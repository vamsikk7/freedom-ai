package billing

import (
	"context"
	"fmt"
	"time"

	"freedom-ai/management-server/internal/models"
	"freedom-ai/management-server/internal/services/email"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
)

type Service struct {
	db           *mongo.Database
	logger       *zap.Logger
	emailService *email.Service
}

// BillingAggregateResult is the result of billing aggregation query
type BillingAggregateResult struct {
	OrgID       string  `bson:"_id"`
	TotalTokens int64   `bson:"totalTokens"`
	TotalCost   float64 `bson:"totalCost"`
	ByAssistant []struct {
		Assistant string  `bson:"assistant"`
		Tokens    int64   `bson:"tokens"`
		Cost      float64 `bson:"cost"`
	} `bson:"byAssistant"`
	ByUser []struct {
		User   string  `bson:"user"`
		Tokens int64   `bson:"tokens"`
		Cost   float64 `bson:"cost"`
	} `bson:"byUser"`
}

func NewService(db *mongo.Database, logger *zap.Logger) *Service {
	return &Service{
		db:     db,
		logger: logger,
	}
}

func (s *Service) SetEmailService(emailService *email.Service) {
	s.emailService = emailService
}

func (s *Service) ProcessDailyBilling(ctx context.Context) error {
	// Get yesterday's date range
	now := time.Now().UTC()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	yesterday := today.AddDate(0, 0, -1)

	s.logger.Info("Processing daily billing", zap.Time("periodStart", yesterday), zap.Time("periodEnd", today))

	// Get all organizations with consumption in the last 24 hours
	consumptionCollection := s.db.Collection("token_consumption")
	orgCollection := s.db.Collection("organizations")
	billingCollection := s.db.Collection("billing_history")

	// Aggregate consumption by organization
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"timestamp": bson.M{
					"$gte": yesterday,
					"$lt":  today,
				},
				"status": "complete",
				"totalTokens": bson.M{"$gt": 0},
			},
		},
		{
			"$group": bson.M{
				"_id": "$organizationId",
				"totalTokens": bson.M{"$sum": "$totalTokens"},
				"totalCost": bson.M{"$sum": "$cost"},
				"byAssistant": bson.M{
					"$push": bson.M{
						"assistant": "$assistantType",
						"tokens": "$totalTokens",
						"cost": "$cost",
					},
				},
				"byUser": bson.M{
					"$push": bson.M{
						"user": "$userId",
						"tokens": "$totalTokens",
						"cost": "$cost",
					},
				},
			},
		},
	}

	cursor, err := consumptionCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return fmt.Errorf("failed to aggregate consumption: %w", err)
	}
	defer cursor.Close(ctx)

	var results []BillingAggregateResult

	if err := cursor.All(ctx, &results); err != nil {
		return fmt.Errorf("failed to decode aggregation results: %w", err)
	}

	// Process each organization
	for _, result := range results {
		if err := s.processOrganizationBilling(ctx, result, yesterday, today, orgCollection, billingCollection); err != nil {
			s.logger.Error("Failed to process billing for organization",
				zap.String("orgId", result.OrgID),
				zap.Error(err))
			continue
		}
	}

	s.logger.Info("Daily billing completed", zap.Int("organizations", len(results)))
	return nil
}

func (s *Service) processOrganizationBilling(ctx context.Context, result BillingAggregateResult, periodStart, periodEnd time.Time, orgCollection, billingCollection *mongo.Collection) error {
	// Get organization
	var org models.Organization
	err := orgCollection.FindOne(ctx, bson.M{"orgId": result.OrgID}).Decode(&org)
	if err != nil {
		return fmt.Errorf("failed to find organization: %w", err)
	}

	// Build breakdown
	breakdown := models.BillingBreakdown{
		ByAssistant: make(map[string]models.AssistantBreakdown),
		ByUser:      make(map[string]models.UserBreakdown),
	}

	// Aggregate by assistant
	for _, item := range result.ByAssistant {
		if item.Assistant == "" {
			item.Assistant = "unknown"
		}
		existing := breakdown.ByAssistant[item.Assistant]
		existing.Tokens += item.Tokens
		existing.Cost += item.Cost
		breakdown.ByAssistant[item.Assistant] = existing
	}

	// Aggregate by user
	for _, item := range result.ByUser {
		if item.User == "" {
			continue
		}
		existing := breakdown.ByUser[item.User]
		existing.Tokens += item.Tokens
		existing.Cost += item.Cost
		breakdown.ByUser[item.User] = existing
	}

	// Get wallet balance before
	walletBalanceBefore := org.WalletBalance

	// Deduct from wallet
	walletBalanceAfter := walletBalanceBefore - result.TotalCost

	// Update organization wallet
	_, err = orgCollection.UpdateOne(
		ctx,
		bson.M{"orgId": result.OrgID},
		bson.M{"$set": bson.M{
			"walletBalance": walletBalanceAfter,
			"updatedAt":     time.Now(),
		}},
	)
	if err != nil {
		return fmt.Errorf("failed to update wallet balance: %w", err)
	}

	// Create billing record
	billingRecord := models.BillingHistory{
		ID:                  primitive.NewObjectID(),
		OrganizationID:      result.OrgID,
		BillingDate:        time.Now(),
		PeriodStart:        periodStart,
		PeriodEnd:          periodEnd,
		TotalTokens:        result.TotalTokens,
		TotalCost:          result.TotalCost,
		Breakdown:          breakdown,
		WalletBalanceBefore: walletBalanceBefore,
		WalletBalanceAfter:  walletBalanceAfter,
		Status:             "completed",
		CreatedAt:          time.Now(),
	}

	_, err = billingCollection.InsertOne(ctx, billingRecord)
	if err != nil {
		return fmt.Errorf("failed to insert billing record: %w", err)
	}

	s.logger.Info("Processed billing for organization",
		zap.String("orgId", result.OrgID),
		zap.Float64("totalCost", result.TotalCost),
		zap.Float64("walletBalanceAfter", walletBalanceAfter))

	// Send billing summary email if email service is configured
	if s.emailService != nil && org.BillingEmail != "" {
		summary := email.BillingSummary{
			OrgName:             org.Name,
			PeriodStart:         periodStart,
			PeriodEnd:           periodEnd,
			TotalTokens:         result.TotalTokens,
			TotalCost:           result.TotalCost,
			WalletBalanceBefore: walletBalanceBefore,
			WalletBalanceAfter:  walletBalanceAfter,
		}
		summary.Breakdown.ByAssistant = make(map[string]struct {
			Tokens int64
			Cost   float64
		})
		summary.Breakdown.ByUser = make(map[string]struct {
			Tokens int64
			Cost   float64
		})

		for k, v := range breakdown.ByAssistant {
			summary.Breakdown.ByAssistant[k] = struct {
				Tokens int64
				Cost   float64
			}{Tokens: v.Tokens, Cost: v.Cost}
		}
		for k, v := range breakdown.ByUser {
			summary.Breakdown.ByUser[k] = struct {
				Tokens int64
				Cost   float64
			}{Tokens: v.Tokens, Cost: v.Cost}
		}

		if err := s.emailService.SendBillingSummary(org.BillingEmail, org.Name, summary); err != nil {
			s.logger.Warn("Failed to send billing summary email",
				zap.String("orgId", result.OrgID),
				zap.Error(err))
		}
	}

	// Check for low balance alert
	if s.emailService != nil && org.BillingEmail != "" {
		threshold := 10.0 // Default threshold
		if walletBalanceAfter < threshold && walletBalanceBefore >= threshold {
			if err := s.emailService.SendLowBalanceAlert(org.BillingEmail, org.Name, walletBalanceAfter, threshold); err != nil {
				s.logger.Warn("Failed to send low balance alert",
					zap.String("orgId", result.OrgID),
					zap.Error(err))
			}
		}
	}

	return nil
}

