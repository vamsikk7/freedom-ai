package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"freedom-ai/management-server/internal/config"
	"freedom-ai/management-server/internal/database"
	"freedom-ai/management-server/internal/lib/supertokens"
	"freedom-ai/management-server/internal/middleware"
	"freedom-ai/management-server/internal/rabbitmq"
	"freedom-ai/management-server/internal/redis"
	"freedom-ai/management-server/internal/routes"
	"freedom-ai/management-server/internal/services/aggregation"
	"freedom-ai/management-server/internal/services/autotopup"
	"freedom-ai/management-server/internal/services/billing"
	"freedom-ai/management-server/internal/services/consumption"
	"freedom-ai/management-server/internal/services/email"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
)

func main() {
	// Load environment variables
	cfg := config.Load()

	// Initialize logger
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	// Initialize MongoDB
	db, err := database.NewMongoDB(cfg.MongoDBURI, cfg.MongoDBDatabase, logger)
	if err != nil {
		logger.Fatal("Failed to connect to MongoDB", zap.Error(err))
	}
	defer db.Disconnect(context.Background())

	// Initialize Redis
	rdb, err := redis.NewRedisClient(cfg.RedisHost, cfg.RedisPort, cfg.RedisPassword, cfg.RedisDB, logger)
	if err != nil {
		logger.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer rdb.Close()

	// Initialize SuperTokens
	if cfg.SuperTokensConnectionURI != "" {
		if err := supertokens.InitSuperTokens(cfg); err != nil {
			logger.Fatal("Failed to initialize SuperTokens", zap.Error(err))
		}
		logger.Info("SuperTokens initialized")
	} else {
		logger.Warn("SuperTokens not configured, authentication disabled")
	}

	// Set up Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.Logger(logger))
	router.Use(middleware.CORS())

	// SuperTokens middleware (if configured)
	if cfg.SuperTokensConnectionURI != "" {
		router.Use(supertokens.Middleware())
	}

	// Initialize middleware
	router.Use(middleware.Database(db.Database))
	router.Use(middleware.Redis(rdb.Client()))
	router.Use(middleware.Config(cfg))

	// Initialize services
	consumptionService := consumption.NewService(db.Database, cfg, logger)
	billingService := billing.NewService(db.Database, logger)
	emailService := email.NewService(cfg, logger)
	
	// Initialize real-time consumption service and connect to consumption service
	realtimeService := consumption.NewRealtimeService(rdb, logger)
	consumptionService.SetRealtimeService(realtimeService)
	
	// Set email service for billing and auto-top-up
	billingService.SetEmailService(emailService)

	// Initialize RabbitMQ consumer (if configured)
	var consumer *rabbitmq.Consumer
	if cfg.RabbitMQURL != "" {
		consumer, err = rabbitmq.NewConsumer(cfg, db.Database, rdb, consumptionService, logger)
		if err != nil {
			logger.Warn("Failed to initialize RabbitMQ consumer", zap.Error(err))
		} else {
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			go func() {
				if err := consumer.Start(ctx); err != nil {
					logger.Error("RabbitMQ consumer error", zap.Error(err))
				}
			}()
			logger.Info("RabbitMQ consumer started")
		}
	} else {
		logger.Info("RabbitMQ consumer disabled (RabbitMQ URL not configured)")
	}

	// Set up routes
	routes.SetupRoutes(router, db.Database, cfg, realtimeService, logger)

	// Start scheduled jobs
	go startScheduledJobs(cfg, billingService, db.Database, rdb, logger)

	// Start server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	// Graceful shutdown
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	logger.Info("Server started", zap.String("port", cfg.Port))

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit

	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	// Close RabbitMQ connection on shutdown
	if consumer != nil {
		if err := consumer.Close(); err != nil {
			logger.Warn("Error closing RabbitMQ connection", zap.Error(err))
		} else {
			logger.Info("RabbitMQ connection closed")
		}
	}

	logger.Info("Server exited")
}

func startScheduledJobs(cfg *config.Config, billingService *billing.Service, db *mongo.Database, redis *redis.RedisClient, logger *zap.Logger) {
	aggregationService := aggregation.NewService(db, logger)
	autotopupService := autotopup.NewService(cfg, db, logger)
	emailService := email.NewService(cfg, logger)
	autotopupService.SetEmailService(emailService)
	// Daily billing job (runs at 00:00 UTC)
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		// Calculate time until next midnight UTC
		now := time.Now().UTC()
		midnight := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, time.UTC)
		delay := midnight.Sub(now)

		// Wait until midnight
		time.Sleep(delay)

		// Run immediately
		logger.Info("Running daily billing job")
		if err := billingService.ProcessDailyBilling(context.Background()); err != nil {
			logger.Error("Daily billing job failed", zap.Error(err))
		}

		// Then run on schedule
		for range ticker.C {
			logger.Info("Running daily billing job")
			if err := billingService.ProcessDailyBilling(context.Background()); err != nil {
				logger.Error("Daily billing job failed", zap.Error(err))
			}
		}
	}()

	// Daily aggregation job (runs at 01:00 UTC)
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		// Calculate time until next 01:00 UTC
		now := time.Now().UTC()
		nextRun := time.Date(now.Year(), now.Month(), now.Day()+1, 1, 0, 0, 0, time.UTC)
		delay := nextRun.Sub(now)

		time.Sleep(delay)

		// Run immediately
		logger.Info("Running daily aggregation job")
		if err := aggregationService.AggregateDailyConsumption(context.Background()); err != nil {
			logger.Error("Daily aggregation job failed", zap.Error(err))
		}

		// Then run on schedule
		for range ticker.C {
			logger.Info("Running daily aggregation job")
			if err := aggregationService.AggregateDailyConsumption(context.Background()); err != nil {
				logger.Error("Daily aggregation job failed", zap.Error(err))
			}
		}
	}()

	// Monthly aggregation job (runs on first day of each month at 02:00 UTC)
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		// Calculate time until next 02:00 UTC on first of month
		now := time.Now().UTC()
		var nextRun time.Time
		if now.Day() == 1 && now.Hour() < 2 {
			nextRun = time.Date(now.Year(), now.Month(), 1, 2, 0, 0, 0, time.UTC)
		} else {
			nextMonth := now.AddDate(0, 1, 0)
			nextRun = time.Date(nextMonth.Year(), nextMonth.Month(), 1, 2, 0, 0, 0, time.UTC)
		}
		delay := nextRun.Sub(now)

		time.Sleep(delay)

		// Run immediately
		logger.Info("Running monthly aggregation job")
		if err := aggregationService.AggregateMonthlyConsumption(context.Background()); err != nil {
			logger.Error("Monthly aggregation job failed", zap.Error(err))
		}

		// Then check daily if it's the first of the month
		for range ticker.C {
			now := time.Now().UTC()
			if now.Day() == 1 && now.Hour() == 2 {
				logger.Info("Running monthly aggregation job")
				if err := aggregationService.AggregateMonthlyConsumption(context.Background()); err != nil {
					logger.Error("Monthly aggregation job failed", zap.Error(err))
				}
			}
		}
	}()

	// Auto-top-up job (runs every 6 hours)
	go func() {
		ticker := time.NewTicker(6 * time.Hour)
		defer ticker.Stop()

		// Run immediately
		logger.Info("Running auto-top-up job")
		if err := autotopupService.CheckAndProcessAutoTopUp(context.Background()); err != nil {
			logger.Error("Auto-top-up job failed", zap.Error(err))
		}

		// Then run on schedule
		for range ticker.C {
			logger.Info("Running auto-top-up job")
			if err := autotopupService.CheckAndProcessAutoTopUp(context.Background()); err != nil {
				logger.Error("Auto-top-up job failed", zap.Error(err))
			}
		}
	}()
}

