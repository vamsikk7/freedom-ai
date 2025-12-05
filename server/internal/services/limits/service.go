package limits

import (
	"context"
	"fmt"
	"time"

	"freedom-ai/management-server/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
)

type Service struct {
	db     *mongo.Database
	logger *zap.Logger
}

func NewService(db *mongo.Database, logger *zap.Logger) *Service {
	return &Service{
		db:     db,
		logger: logger,
	}
}

// CheckConsumptionLimits checks if consumption exceeds limits
func (s *Service) CheckConsumptionLimits(ctx context.Context, orgID, userID string, tokens int64) error {
	// Get organization
	orgCollection := s.db.Collection("organizations")
	var org models.Organization
	err := orgCollection.FindOne(ctx, bson.M{"orgId": orgID}).Decode(&org)
	if err != nil {
		return fmt.Errorf("failed to find organization: %w", err)
	}

	limits := org.ConsumptionLimits

	// Check monthly limit
	if limits.MonthlyLimit > 0 {
		monthlyConsumption, err := s.getMonthlyConsumption(ctx, orgID)
		if err != nil {
			return err
		}
		if monthlyConsumption+int64(tokens) > limits.MonthlyLimit {
			return fmt.Errorf("monthly consumption limit exceeded")
		}
	}

	// Check daily limit
	if limits.DailyLimit > 0 {
		dailyConsumption, err := s.getDailyConsumption(ctx, orgID)
		if err != nil {
			return err
		}
		if dailyConsumption+int64(tokens) > limits.DailyLimit {
			return fmt.Errorf("daily consumption limit exceeded")
		}
	}

	// Check per-user limit
	if limits.PerUserLimit > 0 {
		userConsumption, err := s.getUserMonthlyConsumption(ctx, userID)
		if err != nil {
			return err
		}
		if userConsumption+int64(tokens) > limits.PerUserLimit {
			return fmt.Errorf("per-user consumption limit exceeded")
		}
	}

	return nil
}

func (s *Service) getMonthlyConsumption(ctx context.Context, orgID string) (int64, error) {
	now := time.Now().UTC()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	pipeline := []bson.M{
		{
			"$match": bson.M{
				"organizationId": orgID,
				"timestamp":      bson.M{"$gte": monthStart},
				"status":         "complete",
			},
		},
		{
			"$group": bson.M{
				"_id":         nil,
				"totalTokens": bson.M{"$sum": "$totalTokens"},
			},
		},
	}

	collection := s.db.Collection("token_consumption")
	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		return 0, err
	}

	if len(results) == 0 {
		return 0, nil
	}

	return results[0]["totalTokens"].(int64), nil
}

func (s *Service) getDailyConsumption(ctx context.Context, orgID string) (int64, error) {
	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

	pipeline := []bson.M{
		{
			"$match": bson.M{
				"organizationId": orgID,
				"timestamp":      bson.M{"$gte": todayStart},
				"status":         "complete",
			},
		},
		{
			"$group": bson.M{
				"_id":         nil,
				"totalTokens": bson.M{"$sum": "$totalTokens"},
			},
		},
	}

	collection := s.db.Collection("token_consumption")
	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		return 0, err
	}

	if len(results) == 0 {
		return 0, nil
	}

	return results[0]["totalTokens"].(int64), nil
}

func (s *Service) getUserMonthlyConsumption(ctx context.Context, userID string) (int64, error) {
	now := time.Now().UTC()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	pipeline := []bson.M{
		{
			"$match": bson.M{
				"userId":   userID,
				"timestamp": bson.M{"$gte": monthStart},
				"status":    "complete",
			},
		},
		{
			"$group": bson.M{
				"_id":         nil,
				"totalTokens": bson.M{"$sum": "$totalTokens"},
			},
		},
	}

	collection := s.db.Collection("token_consumption")
	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		return 0, err
	}

	if len(results) == 0 {
		return 0, nil
	}

	return results[0]["totalTokens"].(int64), nil
}

