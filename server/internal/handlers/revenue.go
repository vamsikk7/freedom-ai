package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type RevenueHandler struct {
	db *mongo.Database
}

func NewRevenueHandler(db *mongo.Database) *RevenueHandler {
	return &RevenueHandler{db: db}
}

// GetTopUpFrequency returns top-up frequency and amounts
func (h *RevenueHandler) GetTopUpFrequency(c *gin.Context) {
	orgID := c.Query("organizationId")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	match := bson.M{"status": "succeeded"}
	if orgID != "" {
		match["organizationId"] = orgID
	}
	if startDate != "" && endDate != "" {
		start, _ := time.Parse(time.RFC3339, startDate)
		end, _ := time.Parse(time.RFC3339, endDate)
		match["createdAt"] = bson.M{
			"$gte": start,
			"$lte": end,
		}
	}

	pipeline := []bson.M{
		{"$match": match},
		{
			"$group": bson.M{
				"_id": bson.M{
					"$dateToString": bson.M{
						"format": "%Y-%m-%d",
						"date":   "$createdAt",
					},
				},
				"count":  bson.M{"$sum": 1},
				"totalAmount": bson.M{"$sum": "$amount"},
				"averageAmount": bson.M{"$avg": "$amount"},
			},
		},
		{"$sort": bson.M{"_id": 1}},
	}

	collection := h.db.Collection("top_up_transactions")
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

// GetBillingDeductionsByDay returns billing deductions by day
func (h *RevenueHandler) GetBillingDeductionsByDay(c *gin.Context) {
	orgID := c.Query("organizationId")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	match := bson.M{"status": "completed"}
	if orgID != "" {
		match["organizationId"] = orgID
	}
	if startDate != "" && endDate != "" {
		start, _ := time.Parse(time.RFC3339, startDate)
		end, _ := time.Parse(time.RFC3339, endDate)
		match["billingDate"] = bson.M{
			"$gte": start,
			"$lte": end,
		}
	}

	pipeline := []bson.M{
		{"$match": match},
		{
			"$group": bson.M{
				"_id": bson.M{
					"$dateToString": bson.M{
						"format": "%Y-%m-%d",
						"date":   "$billingDate",
					},
				},
				"totalDeductions": bson.M{"$sum": "$totalCost"},
				"totalTokens":     bson.M{"$sum": "$totalTokens"},
				"count":           bson.M{"$sum": 1},
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

// GetRevenueByTenant returns revenue breakdown by tenant
func (h *RevenueHandler) GetRevenueByTenant(c *gin.Context) {
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	match := bson.M{"status": "completed"}
	if startDate != "" && endDate != "" {
		start, _ := time.Parse(time.RFC3339, startDate)
		end, _ := time.Parse(time.RFC3339, endDate)
		match["billingDate"] = bson.M{
			"$gte": start,
			"$lte": end,
		}
	}

	pipeline := []bson.M{
		{"$match": match},
		{
			"$group": bson.M{
				"_id":         "$organizationId",
				"totalRevenue": bson.M{"$sum": "$totalCost"},
				"totalTokens": bson.M{"$sum": "$totalTokens"},
				"billingCount": bson.M{"$sum": 1},
			},
		},
		{"$sort": bson.M{"totalRevenue": -1}},
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

