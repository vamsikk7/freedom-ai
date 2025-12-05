package consumption

import (
	"context"
	"fmt"

	"go.uber.org/zap"
)

type RedisClient interface {
	IncrementBy(ctx context.Context, key string, value int64) (int64, error)
	GetInt(ctx context.Context, key string) (int64, error)
}

type RealtimeService struct {
	redis  RedisClient
	logger *zap.Logger
}

func NewRealtimeService(redis RedisClient, logger *zap.Logger) *RealtimeService {
	return &RealtimeService{
		redis:  redis,
		logger: logger,
	}
}

// UpdateRealTimeCounters updates real-time consumption counters in Redis
func (s *RealtimeService) UpdateRealTimeCounters(ctx context.Context, orgID, userID string, tokens int64) error {
	// Update organization counter
	orgKey := fmt.Sprintf("consumption:org:%s:today", orgID)
	if _, err := s.redis.IncrementBy(ctx, orgKey, tokens); err != nil {
		s.logger.Warn("Failed to update org counter", zap.String("orgId", orgID), zap.Error(err))
	}

	// Update user counter
	userKey := fmt.Sprintf("consumption:user:%s:today", userID)
	if _, err := s.redis.IncrementBy(ctx, userKey, tokens); err != nil {
		s.logger.Warn("Failed to update user counter", zap.String("userId", userID), zap.Error(err))
	}

	return nil
}

// GetRealTimeConsumption returns real-time consumption for an organization
func (s *RealtimeService) GetRealTimeConsumption(ctx context.Context, orgID string) (int64, error) {
	key := fmt.Sprintf("consumption:org:%s:today", orgID)
	val, err := s.redis.GetInt(ctx, key)
	if err != nil {
		// Return 0 if key doesn't exist (not an error)
		return 0, nil
	}
	return val, nil
}

// GetRealTimeUserConsumption returns real-time consumption for a user
func (s *RealtimeService) GetRealTimeUserConsumption(ctx context.Context, userID string) (int64, error) {
	key := fmt.Sprintf("consumption:user:%s:today", userID)
	val, err := s.redis.GetInt(ctx, key)
	if err != nil {
		// Return 0 if key doesn't exist (not an error)
		return 0, nil
	}
	return val, nil
}

