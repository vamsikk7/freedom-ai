package aggregation

import (
	"context"
	"fmt"
	"time"

	"freedom-ai/management-server/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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

// AggregateDailyConsumption aggregates consumption for yesterday
func (s *Service) AggregateDailyConsumption(ctx context.Context) error {
	now := time.Now().UTC()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	yesterday := today.AddDate(0, 0, -1)

	s.logger.Info("Aggregating daily consumption", zap.Time("date", yesterday))

	// Get all organizations with consumption yesterday
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"timestamp": bson.M{
					"$gte": yesterday,
					"$lt":  today,
				},
				"status": "complete",
			},
		},
		{
			"$group": bson.M{
				"_id":         "$organizationId",
				"totalTokens": bson.M{"$sum": "$totalTokens"},
				"totalCost":   bson.M{"$sum": "$cost"},
				"byAssistant": bson.M{
					"$push": bson.M{
						"assistant": "$assistantType",
						"tokens":    "$totalTokens",
						"cost":      "$cost",
					},
				},
				"byUser": bson.M{
					"$push": bson.M{
						"user":   "$userId",
						"tokens": "$totalTokens",
						"cost":   "$cost",
					},
				},
			},
		},
	}

	consumptionCollection := s.db.Collection("token_consumption")
	cursor, err := consumptionCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return fmt.Errorf("failed to aggregate consumption: %w", err)
	}
	defer cursor.Close(ctx)

	var results []struct {
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

	if err := cursor.All(ctx, &results); err != nil {
		return fmt.Errorf("failed to decode results: %w", err)
	}

	// Store daily aggregations
	dailyCollection := s.db.Collection("daily_consumption")
	for _, result := range results {
		breakdown := models.ConsumptionBreakdown{
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

		dailyRecord := models.DailyConsumption{
			ID:             primitive.NewObjectID(),
			OrganizationID: result.OrgID,
			Date:           yesterday,
			TotalTokens:    result.TotalTokens,
			TotalCost:      result.TotalCost,
			Breakdown:      breakdown,
			CreatedAt:      time.Now(),
		}

		// Upsert daily record
		filter := bson.M{
			"organizationId": result.OrgID,
			"date":           yesterday,
		}
		update := bson.M{"$set": dailyRecord}
		opts := options.Update().SetUpsert(true)
		_, err := dailyCollection.UpdateOne(ctx, filter, update, opts)
		if err != nil {
			s.logger.Warn("Failed to upsert daily consumption",
				zap.String("orgId", result.OrgID),
				zap.Error(err))
		}
	}

	s.logger.Info("Daily aggregation completed", zap.Int("organizations", len(results)))
	return nil
}

// AggregateMonthlyConsumption aggregates consumption for previous month
func (s *Service) AggregateMonthlyConsumption(ctx context.Context) error {
	now := time.Now().UTC()
	firstOfThisMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	firstOfLastMonth := firstOfThisMonth.AddDate(0, -1, 0)
	lastMonthEnd := firstOfThisMonth.AddDate(0, 0, -1).Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	monthStr := firstOfLastMonth.Format("2006-01")
	s.logger.Info("Aggregating monthly consumption", zap.String("month", monthStr))

	// Get all organizations with consumption in previous month
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"timestamp": bson.M{
					"$gte": firstOfLastMonth,
					"$lte": lastMonthEnd,
				},
				"status": "complete",
			},
		},
		{
			"$group": bson.M{
				"_id":         "$organizationId",
				"totalTokens": bson.M{"$sum": "$totalTokens"},
				"totalCost":   bson.M{"$sum": "$cost"},
				"byAssistant": bson.M{
					"$push": bson.M{
						"assistant": "$assistantType",
						"tokens":    "$totalTokens",
						"cost":      "$cost",
					},
				},
				"byUser": bson.M{
					"$push": bson.M{
						"user":   "$userId",
						"tokens": "$totalTokens",
						"cost":   "$cost",
					},
				},
				"byProject": bson.M{
					"$push": bson.M{
						"project": "$projectId",
						"tokens":  "$totalTokens",
						"cost":    "$cost",
					},
				},
			},
		},
	}

	consumptionCollection := s.db.Collection("token_consumption")
	cursor, err := consumptionCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return fmt.Errorf("failed to aggregate monthly consumption: %w", err)
	}
	defer cursor.Close(ctx)

	var results []struct {
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
		ByProject []struct {
			Project string  `bson:"project"`
			Tokens  int64   `bson:"tokens"`
			Cost    float64 `bson:"cost"`
		} `bson:"byProject"`
	}

	if err := cursor.All(ctx, &results); err != nil {
		return fmt.Errorf("failed to decode results: %w", err)
	}

	// Store monthly aggregations
	monthlyCollection := s.db.Collection("monthly_consumption")
	for _, result := range results {
		breakdown := models.ConsumptionBreakdown{
			ByAssistant: make(map[string]models.AssistantBreakdown),
			ByUser:      make(map[string]models.UserBreakdown),
			ByProject:   make(map[string]models.ProjectBreakdown),
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

		// Aggregate by project
		for _, item := range result.ByProject {
			if item.Project == "" {
				continue
			}
			existing := breakdown.ByProject[item.Project]
			existing.Tokens += item.Tokens
			existing.Cost += item.Cost
			existing.Requests += 1
			breakdown.ByProject[item.Project] = existing
		}

		monthlyRecord := models.MonthlyConsumption{
			ID:             primitive.NewObjectID(),
			OrganizationID: result.OrgID,
			Month:          monthStr,
			TotalTokens:    result.TotalTokens,
			TotalCost:      result.TotalCost,
			Breakdown:      breakdown,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		// Upsert monthly record
		filter := bson.M{
			"organizationId": result.OrgID,
			"month":          monthStr,
		}
		update := bson.M{"$set": monthlyRecord}
		opts := options.Update().SetUpsert(true)
		_, err := monthlyCollection.UpdateOne(ctx, filter, update, opts)
		if err != nil {
			s.logger.Warn("Failed to upsert monthly consumption",
				zap.String("orgId", result.OrgID),
				zap.Error(err))
		}
	}

	s.logger.Info("Monthly aggregation completed", zap.Int("organizations", len(results)))
	return nil
}

