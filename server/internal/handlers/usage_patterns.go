package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type UsagePatternsHandler struct {
	db *mongo.Database
}

func NewUsagePatternsHandler(db *mongo.Database) *UsagePatternsHandler {
	return &UsagePatternsHandler{db: db}
}

// GetPeakUsageTimes returns peak usage times (hour of day)
func (h *UsagePatternsHandler) GetPeakUsageTimes(c *gin.Context) {
	orgID := c.Query("organizationId")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	match := bson.M{"status": "complete"}
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
				"_id": bson.M{
					"$hour": "$timestamp",
				},
				"tokens": bson.M{"$sum": "$totalTokens"},
				"cost":   bson.M{"$sum": "$cost"},
				"count":  bson.M{"$sum": 1},
			},
		},
		{"$sort": bson.M{"_id": 1}},
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

// GetUsageByDayOfWeek returns usage by day of week
func (h *UsagePatternsHandler) GetUsageByDayOfWeek(c *gin.Context) {
	orgID := c.Query("organizationId")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	match := bson.M{"status": "complete"}
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
				"_id": bson.M{
					"$dayOfWeek": "$timestamp",
				},
				"tokens": bson.M{"$sum": "$totalTokens"},
				"cost":   bson.M{"$sum": "$cost"},
				"count":  bson.M{"$sum": 1},
			},
		},
		{"$sort": bson.M{"_id": 1}},
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

// GetUsageByAssistantType returns usage patterns by assistant type
func (h *UsagePatternsHandler) GetUsageByAssistantType(c *gin.Context) {
	orgID := c.Query("organizationId")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	match := bson.M{"status": "complete"}
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
				"_id":   "$assistantType",
				"tokens": bson.M{"$sum": "$totalTokens"},
				"cost":   bson.M{"$sum": "$cost"},
				"count":  bson.M{"$sum": 1},
			},
		},
		{"$sort": bson.M{"tokens": -1}},
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

// GetUserActivityPatterns returns user activity patterns
func (h *UsagePatternsHandler) GetUserActivityPatterns(c *gin.Context) {
	orgID := c.Query("organizationId")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	match := bson.M{"status": "complete"}
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
				"_id":   "$userId",
				"tokens": bson.M{"$sum": "$totalTokens"},
				"cost":   bson.M{"$sum": "$cost"},
				"count":  bson.M{"$sum": 1},
				"lastActive": bson.M{"$max": "$timestamp"},
			},
		},
		{"$sort": bson.M{"tokens": -1}},
		{"$limit": 20},
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

