package consumption

import (
	"context"
	"fmt"
	"time"

	"freedom-ai/management-server/internal/config"
	"freedom-ai/management-server/internal/models"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
)

type Service struct {
	db             *mongo.Database
	config         *config.Config
	logger         *zap.Logger
	pricingService *PricingService
	realtimeService *RealtimeService
}

func NewService(db *mongo.Database, cfg *config.Config, logger *zap.Logger) *Service {
	return &Service{
		db:             db,
		config:         cfg,
		logger:         logger,
		pricingService: NewPricingService(cfg),
	}
}

func (s *Service) ProcessConsumption(ctx context.Context, requestData *models.LLMRequestData, responseData *models.LLMResponseData) error {
	// Determine token counts (priority: usage.totalTokens > usage sum > estimated)
	var totalTokens, promptTokens, completionTokens int

	if responseData != nil && responseData.Usage != nil {
		if responseData.Usage.TotalTokens > 0 {
			totalTokens = responseData.Usage.TotalTokens
			promptTokens = responseData.Usage.PromptTokens
			completionTokens = responseData.Usage.CompletionTokens
		} else {
			totalTokens = responseData.Usage.PromptTokens + responseData.Usage.CompletionTokens
			promptTokens = responseData.Usage.PromptTokens
			completionTokens = responseData.Usage.CompletionTokens
		}
	} else if requestData != nil && responseData != nil {
		// Fallback to estimated counts
		totalTokens = requestData.TokenCount + responseData.TokenCount
		promptTokens = requestData.TokenCount
		completionTokens = responseData.TokenCount
	} else if responseData != nil {
		totalTokens = responseData.TokenCount
		completionTokens = responseData.TokenCount
	} else if requestData != nil {
		totalTokens = requestData.TokenCount
		promptTokens = requestData.TokenCount
	}

	// Determine status
	status := "complete"
	if requestData == nil && responseData != nil {
		status = "response-only"
	} else if requestData != nil && responseData == nil {
		status = "request-only"
	}

	// Get organization ID and user ID
	var orgID, userID string
	if responseData != nil {
		orgID = responseData.OrganizationID
		userID = responseData.UserID
	} else if requestData != nil {
		orgID = requestData.OrganizationID
		userID = requestData.UserID
	}

	// Get assistant type, document ID, conversation ID
	var assistantType, documentID, conversationID string
	if responseData != nil {
		assistantType = responseData.AssistantType
		documentID = responseData.DocumentID
		conversationID = responseData.ConversationID
	} else if requestData != nil {
		assistantType = requestData.AssistantType
		documentID = requestData.DocumentID
		conversationID = requestData.ConversationID
	}

	// Derive project ID
	projectID := documentID
	if projectID == "" {
		projectID = conversationID
	}

	// Get model
	model := ""
	if responseData != nil {
		model = responseData.Model
	} else if requestData != nil {
		model = requestData.Model
	}

	// Calculate cost
	cost := s.pricingService.CalculateCost(model, promptTokens, completionTokens)

	// Create consumption record
	record := models.TokenConsumption{
		ID:         primitive.NewObjectID(),
		RequestID:  getRequestID(requestData, responseData),
		Timestamp:  getTimestamp(responseData, requestData),
		UserID:     userID,
		OrgID:      orgID,
		AssistantType: assistantType,
		DocumentID:    documentID,
		ConversationID: conversationID,
		ProjectID:     projectID,
		Model:         model,
		RequestTimestamp:      getRequestTimestamp(requestData),
		RequestCharacterCount: getRequestCharacterCount(requestData),
		RequestTokenCount:     getRequestTokenCount(requestData),
		RequestType:           getRequestType(requestData),
		ToolCount:             getToolCount(requestData),
		MessageCount:          getMessageCount(requestData),
		ResponseTimestamp:      getResponseTimestamp(responseData),
		ResponseCharacterCount: getResponseCharacterCount(responseData),
		ResponseTokenCount:     getResponseTokenCount(responseData),
		PromptTokens:          promptTokens,
		CompletionTokens:      completionTokens,
		TotalTokens:           totalTokens,
		FinishReason:          getFinishReason(responseData),
		ResponseTimeMs:        getResponseTimeMs(responseData),
		HasToolCalls:          getHasToolCalls(responseData),
		ToolCallCount:         getToolCallCount(responseData),
		Cost:                  cost,
		Status:                status,
		CreatedAt:             time.Now(),
	}

	// Store in MongoDB
	collection := s.db.Collection("token_consumption")
	_, err := collection.InsertOne(ctx, record)
	if err != nil {
		return fmt.Errorf("failed to insert consumption record: %w", err)
	}

	// Update real-time counters if service is available and record is complete
	if s.realtimeService != nil && status == "complete" && orgID != "" && userID != "" && totalTokens > 0 {
		if err := s.realtimeService.UpdateRealTimeCounters(ctx, orgID, userID, int64(totalTokens)); err != nil {
			s.logger.Warn("Failed to update real-time counters",
				zap.String("requestId", record.RequestID),
				zap.Error(err))
		}
	}

	s.logger.Info("Processed consumption record",
		zap.String("requestId", record.RequestID),
		zap.String("orgId", orgID),
		zap.Int("totalTokens", totalTokens),
		zap.Float64("cost", cost))

	return nil
}

// SetRealtimeService sets the realtime service for updating counters
func (s *Service) SetRealtimeService(realtimeService *RealtimeService) {
	s.realtimeService = realtimeService
}

// Helper functions
func getRequestID(req *models.LLMRequestData, resp *models.LLMResponseData) string {
	if resp != nil {
		return resp.RequestID
	}
	if req != nil {
		return req.RequestID
	}
	return ""
}

func getTimestamp(resp *models.LLMResponseData, req *models.LLMRequestData) time.Time {
	if resp != nil {
		return resp.Timestamp
	}
	if req != nil {
		return req.Timestamp
	}
	return time.Now()
}

func getRequestTimestamp(req *models.LLMRequestData) time.Time {
	if req != nil {
		return req.Timestamp
	}
	return time.Time{}
}

func getRequestCharacterCount(req *models.LLMRequestData) int {
	if req != nil {
		return req.CharacterCount
	}
	return 0
}

func getRequestTokenCount(req *models.LLMRequestData) int {
	if req != nil {
		return req.TokenCount
	}
	return 0
}

func getRequestType(req *models.LLMRequestData) string {
	if req != nil {
		return req.RequestType
	}
	return ""
}

func getToolCount(req *models.LLMRequestData) int {
	if req != nil {
		return req.ToolCount
	}
	return 0
}

func getMessageCount(req *models.LLMRequestData) int {
	if req != nil {
		return req.MessageCount
	}
	return 0
}

func getResponseTimestamp(resp *models.LLMResponseData) time.Time {
	if resp != nil {
		return resp.Timestamp
	}
	return time.Time{}
}

func getResponseCharacterCount(resp *models.LLMResponseData) int {
	if resp != nil {
		return resp.CharacterCount
	}
	return 0
}

func getResponseTokenCount(resp *models.LLMResponseData) int {
	if resp != nil {
		return resp.TokenCount
	}
	return 0
}

func getFinishReason(resp *models.LLMResponseData) string {
	if resp != nil {
		return resp.FinishReason
	}
	return ""
}

func getResponseTimeMs(resp *models.LLMResponseData) int64 {
	if resp != nil {
		return resp.ResponseTimeMs
	}
	return 0
}

func getHasToolCalls(resp *models.LLMResponseData) bool {
	if resp != nil {
		return resp.HasToolCalls
	}
	return false
}

func getToolCallCount(resp *models.LLMResponseData) int {
	if resp != nil {
		return resp.ToolCallCount
	}
	return 0
}

