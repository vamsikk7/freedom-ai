package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type ReportsHandler struct {
	db *mongo.Database
}

func NewReportsHandler(db *mongo.Database) *ReportsHandler {
	return &ReportsHandler{db: db}
}

// GetMonthlyReport returns a monthly consumption report
func (h *ReportsHandler) GetMonthlyReport(c *gin.Context) {
	orgID := c.Query("organizationId")
	month := c.Query("month") // Format: "2024-12"

	if orgID == "" || month == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organizationId and month are required"})
		return
	}

	// Parse month
	monthTime, err := time.Parse("2006-01", month)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid month format, use YYYY-MM"})
		return
	}

	monthStart := time.Date(monthTime.Year(), monthTime.Month(), 1, 0, 0, 0, 0, time.UTC)
	nextMonth := monthStart.AddDate(0, 1, 0)
	prevMonth := monthStart.AddDate(0, -1, 0)

	// Get current month consumption
	consumptionCollection := h.db.Collection("token_consumption")
	currentPipeline := []bson.M{
		{
			"$match": bson.M{
				"organizationId": orgID,
				"timestamp": bson.M{
					"$gte": monthStart,
					"$lt":  nextMonth,
				},
				"status": "complete",
			},
		},
		{
			"$group": bson.M{
				"_id":         nil,
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

	currentCursor, _ := consumptionCollection.Aggregate(c.Request.Context(), currentPipeline)
	var currentResults []bson.M
	currentCursor.All(c.Request.Context(), &currentResults)

	// Get previous month consumption for comparison
	prevPipeline := []bson.M{
		{
			"$match": bson.M{
				"organizationId": orgID,
				"timestamp": bson.M{
					"$gte": prevMonth,
					"$lt":  monthStart,
				},
				"status": "complete",
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

	prevCursor, _ := consumptionCollection.Aggregate(c.Request.Context(), prevPipeline)
	var prevResults []bson.M
	prevCursor.All(c.Request.Context(), &prevResults)

	// Build breakdown
	var currentData bson.M
	if len(currentResults) > 0 {
		currentData = currentResults[0]
	} else {
		currentData = bson.M{
			"totalTokens": int64(0),
			"totalCost":   float64(0),
			"byAssistant": []interface{}{},
			"byUser":      []interface{}{},
		}
	}

	var prevTokens, prevCost int64
	if len(prevResults) > 0 {
		prevTokens = prevResults[0]["totalTokens"].(int64)
		prevCost = int64(prevResults[0]["totalCost"].(float64))
	}

	// Aggregate breakdowns
	breakdown := bson.M{
		"byAssistant": make(map[string]bson.M),
		"byUser":      make(map[string]bson.M),
	}

	if byAssistant, ok := currentData["byAssistant"].([]interface{}); ok {
		for _, item := range byAssistant {
			if itemMap, ok := item.(bson.M); ok {
				assistant := itemMap["assistant"].(string)
				if assistant == "" {
					assistant = "unknown"
				}
				tokens := itemMap["tokens"].(int64)
				cost := itemMap["cost"].(float64)

				existing := breakdown["byAssistant"].(map[string]bson.M)[assistant]
				if existing == nil {
					existing = bson.M{"tokens": int64(0), "cost": float64(0)}
				}
				existing["tokens"] = existing["tokens"].(int64) + tokens
				existing["cost"] = existing["cost"].(float64) + cost
				breakdown["byAssistant"].(map[string]bson.M)[assistant] = existing
			}
		}
	}

	if byUser, ok := currentData["byUser"].([]interface{}); ok {
		for _, item := range byUser {
			if itemMap, ok := item.(bson.M); ok {
				user := itemMap["user"].(string)
				if user == "" {
					continue
				}
				tokens := itemMap["tokens"].(int64)
				cost := itemMap["cost"].(float64)

				existing := breakdown["byUser"].(map[string]bson.M)[user]
				if existing == nil {
					existing = bson.M{"tokens": int64(0), "cost": float64(0)}
				}
				existing["tokens"] = existing["tokens"].(int64) + tokens
				existing["cost"] = existing["cost"].(float64) + cost
				breakdown["byUser"].(map[string]bson.M)[user] = existing
			}
		}
	}

	// Calculate comparison
	currentTokens := currentData["totalTokens"].(int64)
	currentCost := currentData["totalCost"].(float64)

	tokenChange := float64(0)
	costChange := float64(0)
	if prevTokens > 0 {
		tokenChange = ((float64(currentTokens) - float64(prevTokens)) / float64(prevTokens)) * 100
		costChange = ((currentCost - float64(prevCost)) / float64(prevCost)) * 100
	}

	report := bson.M{
		"month": month,
		"period": bson.M{
			"start": monthStart,
			"end":   nextMonth,
		},
		"current": bson.M{
			"totalTokens": currentTokens,
			"totalCost":   currentCost,
		},
		"previous": bson.M{
			"totalTokens": prevTokens,
			"totalCost":   float64(prevCost),
		},
		"comparison": bson.M{
			"tokenChangePercent": tokenChange,
			"costChangePercent":  costChange,
		},
		"breakdown": breakdown,
	}

	c.JSON(http.StatusOK, report)
}
