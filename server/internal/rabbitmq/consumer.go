package rabbitmq

import (
	"context"
	"encoding/json"
	"fmt"

	"freedom-ai/management-server/internal/config"
	"freedom-ai/management-server/internal/models"
	"freedom-ai/management-server/internal/services/consumption"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
)

type Consumer struct {
	conn          *amqp.Connection
	channel       *amqp.Channel
	requestQueue  string
	responseQueue string
	exchange      string
	db            *mongo.Database
	redis         RedisClient
	consumptionService *consumption.Service
	logger        *zap.Logger
}

type RedisClient interface {
	SetWithTTL(ctx context.Context, key string, value interface{}, ttl int) error
	Get(ctx context.Context, key string) (string, error)
	Delete(ctx context.Context, key string) error
}

func NewConsumer(cfg *config.Config, db *mongo.Database, redis RedisClient, consumptionService *consumption.Service, logger *zap.Logger) (*Consumer, error) {
	conn, err := amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	// Declare exchange
	err = channel.ExchangeDeclare(
		cfg.RabbitMQExchange,
		"topic",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare exchange: %w", err)
	}

	// Declare queues
	requestQueue := "llm-consumption-requests"
	responseQueue := "llm-consumption-responses"

	_, err = channel.QueueDeclare(requestQueue, true, false, false, false, nil)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare request queue: %w", err)
	}

	_, err = channel.QueueDeclare(responseQueue, true, false, false, false, nil)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare response queue: %w", err)
	}

	// Bind queues
	err = channel.QueueBind(requestQueue, "llm.request", cfg.RabbitMQExchange, false, nil)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to bind request queue: %w", err)
	}

	err = channel.QueueBind(responseQueue, "llm.response", cfg.RabbitMQExchange, false, nil)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to bind response queue: %w", err)
	}

	return &Consumer{
		conn:              conn,
		channel:           channel,
		requestQueue:      requestQueue,
		responseQueue:     responseQueue,
		exchange:          cfg.RabbitMQExchange,
		db:                db,
		redis:             redis,
		consumptionService: consumptionService,
		logger:            logger,
	}, nil
}

func (c *Consumer) Start(ctx context.Context) error {
	// Start consuming request messages
	go c.consumeRequests(ctx)

	// Start consuming response messages
	go c.consumeResponses(ctx)

	c.logger.Info("RabbitMQ consumer started",
		zap.String("requestQueue", c.requestQueue),
		zap.String("responseQueue", c.responseQueue))

	<-ctx.Done()
	return nil
}

func (c *Consumer) consumeRequests(ctx context.Context) {
	msgs, err := c.channel.Consume(
		c.requestQueue,
		"",
		false, // manual ack
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		c.logger.Error("Failed to register request consumer", zap.Error(err))
		return
	}

	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-msgs:
			if !ok {
				return
			}
			c.handleRequest(msg)
		}
	}
}

func (c *Consumer) consumeResponses(ctx context.Context) {
	msgs, err := c.channel.Consume(
		c.responseQueue,
		"",
		false, // manual ack
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		c.logger.Error("Failed to register response consumer", zap.Error(err))
		return
	}

	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-msgs:
			if !ok {
				return
			}
			c.handleResponse(msg)
		}
	}
}

func (c *Consumer) handleRequest(msg amqp.Delivery) {
	var requestData models.LLMRequestData
	if err := json.Unmarshal(msg.Body, &requestData); err != nil {
		c.logger.Error("Failed to unmarshal request message", zap.Error(err))
		msg.Nack(false, false)
		return
	}

	// Store request in Redis cache (TTL: 1 hour)
	ctx := context.Background()
	key := fmt.Sprintf("request:%s", requestData.RequestID)
	requestJSON, _ := json.Marshal(requestData)
	if err := c.redis.SetWithTTL(ctx, key, string(requestJSON), 3600); err != nil {
		c.logger.Warn("Failed to cache request", zap.String("requestId", requestData.RequestID), zap.Error(err))
	}

	msg.Ack(false)
}

func (c *Consumer) handleResponse(msg amqp.Delivery) {
	var responseData models.LLMResponseData
	if err := json.Unmarshal(msg.Body, &responseData); err != nil {
		c.logger.Error("Failed to unmarshal response message", zap.Error(err))
		msg.Nack(false, false)
		return
	}

	ctx := context.Background()
	key := fmt.Sprintf("request:%s", responseData.RequestID)

	// Try to get matching request
	requestJSON, err := c.redis.Get(ctx, key)
	var requestData *models.LLMRequestData
	if err == nil && requestJSON != "" {
		requestData = &models.LLMRequestData{}
		if err := json.Unmarshal([]byte(requestJSON), requestData); err == nil {
			// Delete from cache
			_ = c.redis.Delete(ctx, key)
		}
	}

	// Process consumption record
	if err := c.consumptionService.ProcessConsumption(ctx, requestData, &responseData); err != nil {
		c.logger.Error("Failed to process consumption",
			zap.String("requestId", responseData.RequestID),
			zap.Error(err))
		msg.Nack(false, true) // Requeue on error
		return
	}

	msg.Ack(false)
}

func (c *Consumer) Close() error {
	if c.channel != nil {
		c.channel.Close()
	}
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

