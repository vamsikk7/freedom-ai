package stripe

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"freedom-ai/management-server/internal/config"
	"freedom-ai/management-server/internal/models"

	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/checkout/session"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
)

type Service struct {
	config *config.Config
	db     *mongo.Database
	logger *zap.Logger
}

func NewService(cfg *config.Config, db *mongo.Database, logger *zap.Logger) *Service {
	stripe.Key = cfg.StripeSecretKey
	return &Service{
		config: cfg,
		db:     db,
		logger: logger,
	}
}

// CreateCheckoutSession creates a Stripe checkout session for wallet top-up
func (s *Service) CreateCheckoutSession(ctx context.Context, orgID string, amount float64, successURL, cancelURL string) (*stripe.CheckoutSession, error) {
	params := &stripe.CheckoutSessionParams{
		PaymentMethodTypes: stripe.StringSlice([]string{
			"card",
		}),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency: stripe.String("usd"),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name: stripe.String("Freedom AI Wallet Top-Up"),
					},
					UnitAmount: stripe.Int64(int64(amount * 100)), // Convert to cents
				},
				Quantity: stripe.Int64(1),
			},
		},
		Mode:       stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL: stripe.String(successURL),
		CancelURL:  stripe.String(cancelURL),
		Metadata: map[string]string{
			"organizationId": orgID,
		},
	}

	sess, err := session.New(params)
	if err != nil {
		return nil, fmt.Errorf("failed to create checkout session: %w", err)
	}

	// Create top-up transaction record
	topUp := models.TopUpTransaction{
		ID:                  primitive.NewObjectID(),
		OrganizationID:      orgID,
		Amount:              amount,
		StripePaymentIntentID: sess.PaymentIntent.ID,
		Status:              "pending",
	}

	collection := s.db.Collection("top_up_transactions")
	_, err = collection.InsertOne(ctx, topUp)
	if err != nil {
		s.logger.Warn("Failed to create top-up transaction record", zap.Error(err))
	}

	return sess, nil
}

// HandleWebhook processes Stripe webhook events
func (s *Service) HandleWebhook(ctx context.Context, event stripe.Event) error {
	switch event.Type {
	case "payment_intent.succeeded":
		var paymentIntent stripe.PaymentIntent
		err := json.Unmarshal(event.Data.Raw, &paymentIntent)
		if err != nil {
			return fmt.Errorf("failed to unmarshal payment intent: %w", err)
		}

		orgID := paymentIntent.Metadata["organizationId"]
		if orgID == "" {
			return fmt.Errorf("organizationId not found in payment intent metadata")
		}

		return s.processSuccessfulPayment(ctx, orgID, paymentIntent.ID, float64(paymentIntent.Amount)/100.0)

	case "payment_intent.payment_failed":
		var paymentIntent stripe.PaymentIntent
		err := json.Unmarshal(event.Data.Raw, &paymentIntent)
		if err != nil {
			return fmt.Errorf("failed to unmarshal payment intent: %w", err)
		}

		return s.processFailedPayment(ctx, paymentIntent.ID)

	default:
		s.logger.Info("Unhandled webhook event type", zap.String("type", string(event.Type)))
	}

	return nil
}

func (s *Service) processSuccessfulPayment(ctx context.Context, orgID, paymentIntentID string, amount float64) error {
	// Update top-up transaction
	collection := s.db.Collection("top_up_transactions")
	filter := bson.M{"stripePaymentIntentId": paymentIntentID}
	update := bson.M{
		"$set": bson.M{
			"status":      "succeeded",
			"completedAt": time.Now(),
		},
	}
	_, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		s.logger.Warn("Failed to update top-up transaction", zap.Error(err))
	}

	// Update organization wallet balance
	orgCollection := s.db.Collection("organizations")
	_, err = orgCollection.UpdateOne(
		ctx,
		bson.M{"orgId": orgID},
		bson.M{
			"$inc": bson.M{"walletBalance": amount},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		return fmt.Errorf("failed to update wallet balance: %w", err)
	}

	s.logger.Info("Processed successful payment",
		zap.String("orgId", orgID),
		zap.String("paymentIntentId", paymentIntentID),
		zap.Float64("amount", amount))

	return nil
}

func (s *Service) processFailedPayment(ctx context.Context, paymentIntentID string) error {
	collection := s.db.Collection("top_up_transactions")
	_, err := collection.UpdateOne(
		ctx,
		bson.M{"stripePaymentIntentId": paymentIntentID},
		bson.M{
			"$set": bson.M{
				"status": "failed",
			},
		},
	)
	return err
}

