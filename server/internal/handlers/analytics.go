package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type AnalyticsHandler struct {
	db *mongo.Database
}

func NewAnalyticsHandler(db *mongo.Database) *AnalyticsHandler {
	return &AnalyticsHandler{db: db}
}

// GetSystemOverview returns global system statistics
func (h *AnalyticsHandler) GetSystemOverview(c *gin.Context) {
	orgCollection := h.db.Collection("organizations")
	userCollection := h.db.Collection("users")
	consumptionCollection := h.db.Collection("token_consumption")

	// Count tenants
	totalTenants, _ := orgCollection.CountDocuments(c.Request.Context(), bson.M{})
	activeTenants, _ := orgCollection.CountDocuments(c.Request.Context(), bson.M{"status": "active"})

	// Count users
	totalUsers, _ := userCollection.CountDocuments(c.Request.Context(), bson.M{})
	activeUsers, _ := userCollection.CountDocuments(c.Request.Context(), bson.M{"status": "active"})

	// Get today's date range
	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	// Today's consumption
	todayPipeline := []bson.M{
		{
			"$match": bson.M{
				"timestamp": bson.M{"$gte": todayStart},
				"status":    "complete",
			},
		},
		{
			"$group": bson.M{
				"_id":         nil,
				"totalTokens": bson.M{"$sum": "$totalTokens"},
				"totalCost":   bson.M{"$sum": "$cost"},
			},
		},
	}
	todayCursor, _ := consumptionCollection.Aggregate(c.Request.Context(), todayPipeline)
	var todayResult []bson.M
	todayCursor.All(c.Request.Context(), &todayResult)

	// This month's consumption
	monthPipeline := []bson.M{
		{
			"$match": bson.M{
				"timestamp": bson.M{"$gte": monthStart},
				"status":    "complete",
			},
		},
		{
			"$group": bson.M{
				"_id":         nil,
				"totalTokens": bson.M{"$sum": "$totalTokens"},
				"totalCost":   bson.M{"$sum": "$cost"},
			},
		},
	}
	monthCursor, _ := consumptionCollection.Aggregate(c.Request.Context(), monthPipeline)
	var monthResult []bson.M
	monthCursor.All(c.Request.Context(), &monthResult)

	// All time consumption
	allTimePipeline := []bson.M{
		{
			"$match": bson.M{"status": "complete"},
		},
		{
			"$group": bson.M{
				"_id":         nil,
				"totalTokens": bson.M{"$sum": "$totalTokens"},
				"totalCost":   bson.M{"$sum": "$cost"},
			},
		},
	}
	allTimeCursor, _ := consumptionCollection.Aggregate(c.Request.Context(), allTimePipeline)
	var allTimeResult []bson.M
	allTimeCursor.All(c.Request.Context(), &allTimeResult)

	var todayTokens, todayCost, monthTokens, monthCost, allTimeTokens, allTimeCost int64
	if len(todayResult) > 0 {
		todayTokens = todayResult[0]["totalTokens"].(int64)
		todayCost = int64(todayResult[0]["totalCost"].(float64))
	}
	if len(monthResult) > 0 {
		monthTokens = monthResult[0]["totalTokens"].(int64)
		monthCost = int64(monthResult[0]["totalCost"].(float64))
	}
	if len(allTimeResult) > 0 {
		allTimeTokens = allTimeResult[0]["totalTokens"].(int64)
		allTimeCost = int64(allTimeResult[0]["totalCost"].(float64))
	}

	// Calculate average consumption per tenant
	avgConsumption := float64(0)
	if activeTenants > 0 {
		avgConsumption = float64(monthTokens) / float64(activeTenants)
	}

	c.JSON(http.StatusOK, gin.H{
		"tenants": gin.H{
			"total":  totalTenants,
			"active": activeTenants,
		},
		"users": gin.H{
			"total":  totalUsers,
			"active": activeUsers,
		},
		"consumption": gin.H{
			"today": gin.H{
				"tokens": todayTokens,
				"cost":   todayCost,
			},
			"thisMonth": gin.H{
				"tokens": monthTokens,
				"cost":   monthCost,
			},
			"allTime": gin.H{
				"tokens": allTimeTokens,
				"cost":   allTimeCost,
			},
		},
		"averageConsumptionPerTenant": avgConsumption,
	})
}

// GetConsumptionTrends returns consumption trends over time
func (h *AnalyticsHandler) GetConsumptionTrends(c *gin.Context) {
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")
	orgID := c.Query("organizationId")

	if startDate == "" || endDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "startDate and endDate are required"})
		return
	}

	start, _ := time.Parse(time.RFC3339, startDate)
	end, _ := time.Parse(time.RFC3339, endDate)

	match := bson.M{
		"timestamp": bson.M{
			"$gte": start,
			"$lte": end,
		},
		"status": "complete",
	}
	if orgID != "" {
		match["organizationId"] = orgID
	}

	pipeline := []bson.M{
		{"$match": match},
		{
			"$group": bson.M{
				"_id": bson.M{
					"$dateToString": bson.M{
						"format": "%Y-%m-%d",
						"date":   "$timestamp",
					},
				},
				"tokens": bson.M{"$sum": "$totalTokens"},
				"cost":   bson.M{"$sum": "$cost"},
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

// GetTopTenants returns top tenants by consumption
func (h *AnalyticsHandler) GetTopTenants(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	limitNum := 10
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limitNum = l
	}

	match := bson.M{"status": "complete"}
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
				"_id":         "$organizationId",
				"totalTokens": bson.M{"$sum": "$totalTokens"},
				"totalCost":   bson.M{"$sum": "$cost"},
			},
		},
		{"$sort": bson.M{"totalTokens": -1}},
		{"$limit": limitNum},
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

// GetRevenueTrends returns revenue trends over time
func (h *AnalyticsHandler) GetRevenueTrends(c *gin.Context) {
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	if startDate == "" || endDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "startDate and endDate are required"})
		return
	}

	start, _ := time.Parse(time.RFC3339, startDate)
	end, _ := time.Parse(time.RFC3339, endDate)

	pipeline := []bson.M{
		{
			"$match": bson.M{
				"billingDate": bson.M{
					"$gte": start,
					"$lte": end,
				},
				"status": "completed",
			},
		},
		{
			"$group": bson.M{
				"_id": bson.M{
					"$dateToString": bson.M{
						"format": "%Y-%m-%d",
						"date":   "$billingDate",
					},
				},
				"revenue": bson.M{"$sum": "$totalCost"},
			},
		},
		{"$sort": bson.M{"_id": 1}},
	}

	collection := h.db.Collection("billing_history")
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

