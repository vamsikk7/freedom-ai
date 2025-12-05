package autotopup

import (
	"context"
	"fmt"
	"time"

	"freedom-ai/management-server/internal/config"
	"freedom-ai/management-server/internal/models"
	"freedom-ai/management-server/internal/services/email"

	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/paymentintent"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
)

type Service struct {
	config       *config.Config
	db           *mongo.Database
	logger       *zap.Logger
	emailService *email.Service
}

func NewService(cfg *config.Config, db *mongo.Database, logger *zap.Logger) *Service {
	return &Service{
		config: cfg,
		db:     db,
		logger: logger,
	}
}

func (s *Service) SetEmailService(emailService *email.Service) {
	s.emailService = emailService
}

// CheckAndProcessAutoTopUp checks organizations with auto-top-up enabled and processes if needed
func (s *Service) CheckAndProcessAutoTopUp(ctx context.Context) error {
	collection := s.db.Collection("organizations")
	cursor, err := collection.Find(ctx, bson.M{
		"autoTopUp.enabled": true,
	})
	if err != nil {
		return fmt.Errorf("failed to find organizations: %w", err)
	}
	defer cursor.Close(ctx)

	var orgs []models.Organization
	if err := cursor.All(ctx, &orgs); err != nil {
		return fmt.Errorf("failed to decode organizations: %w", err)
	}

	for _, org := range orgs {
		if org.WalletBalance < org.AutoTopUp.Threshold {
			if err := s.processAutoTopUp(ctx, org); err != nil {
				s.logger.Error("Failed to process auto-top-up",
					zap.String("orgId", org.OrgID),
					zap.Error(err))
				continue
			}
		}
	}

	return nil
}

func (s *Service) processAutoTopUp(ctx context.Context, org models.Organization) error {
	if org.AutoTopUp.PaymentMethodID == "" {
		return fmt.Errorf("no payment method configured")
	}

	// Create payment intent
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(int64(org.AutoTopUp.Amount * 100)),
		Currency: stripe.String(string(stripe.CurrencyUSD)),
		PaymentMethod: stripe.String(org.AutoTopUp.PaymentMethodID),
		Confirm:  stripe.Bool(true),
		Metadata: map[string]string{
			"organizationId": org.OrgID,
			"type":           "auto_topup",
		},
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		return fmt.Errorf("failed to create payment intent: %w", err)
	}

	if pi.Status == stripe.PaymentIntentStatusSucceeded {
		// Update wallet balance
		collection := s.db.Collection("organizations")
		_, err = collection.UpdateOne(
			ctx,
			bson.M{"orgId": org.OrgID},
			bson.M{
				"$inc": bson.M{"walletBalance": org.AutoTopUp.Amount},
				"$set": bson.M{"updatedAt": time.Now()},
			},
		)
		if err != nil {
			return fmt.Errorf("failed to update wallet: %w", err)
		}

		// Create top-up transaction record
		topUpCollection := s.db.Collection("top_up_transactions")
		topUp := models.TopUpTransaction{
			ID:                  primitive.NewObjectID(),
			OrganizationID:      org.OrgID,
			Amount:              org.AutoTopUp.Amount,
			StripePaymentIntentID: pi.ID,
			Status:              "succeeded",
			CreatedAt:           time.Now(),
		}
		completedAt := time.Now()
		topUp.CompletedAt = &completedAt

		_, err = topUpCollection.InsertOne(ctx, topUp)
		if err != nil {
			s.logger.Warn("Failed to create top-up transaction", zap.Error(err))
		}

		s.logger.Info("Auto-top-up processed successfully",
			zap.String("orgId", org.OrgID),
			zap.Float64("amount", org.AutoTopUp.Amount))

		// Send notification email
		if s.emailService != nil && org.BillingEmail != "" {
			if err := s.emailService.SendAutoTopUpNotification(org.BillingEmail, org.Name, org.AutoTopUp.Amount); err != nil {
				s.logger.Warn("Failed to send auto-top-up notification",
					zap.String("orgId", org.OrgID),
					zap.Error(err))
			}
		}
	}

	return nil
}

