package handlers

import (
	"net/http"
	"time"

	"freedom-ai/management-server/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetTenantDetails returns comprehensive tenant information
func (h *TenantHandler) GetTenantDetails(c *gin.Context) {
	id := c.Param("id")
	collection := h.db.Collection("organizations")

	var tenant models.Organization
	err := collection.FindOne(c.Request.Context(), bson.M{"orgId": id}).Decode(&tenant)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get user count
	userCollection := h.db.Collection("users")
	userCount, _ := userCollection.CountDocuments(c.Request.Context(), bson.M{
		"organizationId": id,
		"status":         "active",
	})

	// Get consumption summary
	consumptionCollection := h.db.Collection("token_consumption")
	now := time.Now().UTC()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	consumptionPipeline := []bson.M{
		{
			"$match": bson.M{
				"organizationId": id,
				"timestamp":      bson.M{"$gte": monthStart},
				"status":         "complete",
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

	consumptionCursor, _ := consumptionCollection.Aggregate(c.Request.Context(), consumptionPipeline)
	var consumptionResults []bson.M
	consumptionCursor.All(c.Request.Context(), &consumptionResults)

	var totalTokens int64
	var totalCost float64
	if len(consumptionResults) > 0 {
		totalTokens = consumptionResults[0]["totalTokens"].(int64)
		totalCost = consumptionResults[0]["totalCost"].(float64)
	}

	// Get recent billing history
	billingCollection := h.db.Collection("billing_history")
	billingCursor, _ := billingCollection.Find(
		c.Request.Context(),
		bson.M{"organizationId": id},
		options.Find().SetSort(bson.M{"billingDate": -1}).SetLimit(10),
	)
	var billingHistory []models.BillingHistory
	billingCursor.All(c.Request.Context(), &billingHistory)

	details := gin.H{
		"tenant": tenant,
		"stats": gin.H{
			"userCount":   userCount,
			"totalTokens": totalTokens,
			"totalCost":   totalCost,
		},
		"billingHistory": billingHistory,
	}

	c.JSON(http.StatusOK, details)
}

