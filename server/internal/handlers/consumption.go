package handlers

import (
	"net/http"
	"strconv"
	"time"

	"freedom-ai/management-server/internal/models"
	"freedom-ai/management-server/internal/services/consumption"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
)

type ConsumptionHandler struct {
	db              *mongo.Database
	realtimeService *consumption.RealtimeService
	logger          *zap.Logger
}

func NewConsumptionHandler(db *mongo.Database, realtimeService *consumption.RealtimeService, logger *zap.Logger) *ConsumptionHandler {
	return &ConsumptionHandler{
		db:              db,
		realtimeService: realtimeService,
		logger:          logger,
	}
}

// GetConsumptionHistory returns consumption history with filters
func (h *ConsumptionHandler) GetConsumptionHistory(c *gin.Context) {
	orgID := c.Query("organizationId")
	userID := c.Query("userId")
	assistantType := c.Query("assistantType")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")
	minTokens := c.Query("minTokens")
	maxTokens := c.Query("maxTokens")

	filter := bson.M{}

	if orgID != "" {
		filter["organizationId"] = orgID
	}
	if userID != "" {
		filter["userId"] = userID
	}
	if assistantType != "" {
		filter["assistantType"] = assistantType
	}

	if startDate != "" && endDate != "" {
		start, _ := time.Parse(time.RFC3339, startDate)
		end, _ := time.Parse(time.RFC3339, endDate)
		filter["timestamp"] = bson.M{
			"$gte": start,
			"$lte": end,
		}
	}

	// Add token range filters
	if minTokens != "" || maxTokens != "" {
		tokenFilter := bson.M{}
		if minTokens != "" {
			if min, err := strconv.Atoi(minTokens); err == nil {
				tokenFilter["$gte"] = min
			}
		}
		if maxTokens != "" {
			if max, err := strconv.Atoi(maxTokens); err == nil {
				tokenFilter["$lte"] = max
			}
		}
		if len(tokenFilter) > 0 {
			filter["totalTokens"] = tokenFilter
		}
	}

	collection := h.db.Collection("token_consumption")
	cursor, err := collection.Find(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	var records []models.TokenConsumption
	if err := cursor.All(c.Request.Context(), &records); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, records)
}

// GetConsumptionByAssistant returns consumption grouped by assistant
func (h *ConsumptionHandler) GetConsumptionByAssistant(c *gin.Context) {
	orgID := c.Query("organizationId")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	match := bson.M{}
	if orgID != "" {
		match["organizationId"] = orgID
	}
	if startDate != "" && endDate != "" {
		start, _ := time.Parse(time.RFC3339, startDate)
		end, _ := time.Parse(time.RFC3339, endDate)
		match["timestamp"] = bson.M{
			"$gte": start,
			"$lte": end,
		}
	}

	pipeline := []bson.M{
		{"$match": match},
		{
			"$group": bson.M{
				"_id":    "$assistantType",
				"tokens": bson.M{"$sum": "$totalTokens"},
				"cost":   bson.M{"$sum": "$cost"},
			},
		},
	}

	collection := h.db.Collection("token_consumption")
	cursor, err := collection.Aggregate(c.Request.Context(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	var results []bson.M
	if err := cursor.All(c.Request.Context(), &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

// GetConsumptionByUser returns consumption grouped by user
func (h *ConsumptionHandler) GetConsumptionByUser(c *gin.Context) {
	orgID := c.Query("organizationId")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	match := bson.M{}
	if orgID != "" {
		match["organizationId"] = orgID
	}
	if startDate != "" && endDate != "" {
		start, _ := time.Parse(time.RFC3339, startDate)
		end, _ := time.Parse(time.RFC3339, endDate)
		match["timestamp"] = bson.M{
			"$gte": start,
			"$lte": end,
		}
	}

	pipeline := []bson.M{
		{"$match": match},
		{
			"$group": bson.M{
				"_id":    "$userId",
				"tokens": bson.M{"$sum": "$totalTokens"},
				"cost":   bson.M{"$sum": "$cost"},
			},
		},
	}

	collection := h.db.Collection("token_consumption")
	cursor, err := collection.Aggregate(c.Request.Context(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	var results []bson.M
	if err := cursor.All(c.Request.Context(), &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

// GetRealTimeConsumption returns real-time consumption for an organization or user
func (h *ConsumptionHandler) GetRealTimeConsumption(c *gin.Context) {
	orgID := c.Query("organizationId")
	userID := c.Query("userId")

	if orgID == "" && userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organizationId or userId is required"})
		return
	}

	if h.realtimeService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "real-time service not available"})
		return
	}

	ctx := c.Request.Context()
	var tokens int64
	var err error

	if orgID != "" {
		tokens, err = h.realtimeService.GetRealTimeConsumption(ctx, orgID)
	} else {
		tokens, err = h.realtimeService.GetRealTimeUserConsumption(ctx, userID)
	}

	if err != nil {
		h.logger.Warn("Failed to get real-time consumption", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get real-time consumption"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tokens": tokens})
}
