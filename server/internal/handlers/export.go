package handlers

import (
	"encoding/csv"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ExportHandler struct {
	db *mongo.Database
}

func NewExportHandler(db *mongo.Database) *ExportHandler {
	return &ExportHandler{db: db}
}

// ExportConsumptionCSV exports consumption data as CSV
func (h *ExportHandler) ExportConsumptionCSV(c *gin.Context) {
	orgID := c.Query("organizationId")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	filter := bson.M{}
	if orgID != "" {
		filter["organizationId"] = orgID
	}
	if startDate != "" && endDate != "" {
		start, _ := time.Parse(time.RFC3339, startDate)
		end, _ := time.Parse(time.RFC3339, endDate)
		filter["timestamp"] = bson.M{
			"$gte": start,
			"$lte": end,
		}
	}

	collection := h.db.Collection("token_consumption")
	cursor, err := collection.Find(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=consumption.csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write header
	writer.Write([]string{
		"Date", "User ID", "Organization ID", "Assistant Type", "Model",
		"Total Tokens", "Cost", "Status",
	})

	// Write data
	for cursor.Next(c.Request.Context()) {
		var record bson.M
		if err := cursor.Decode(&record); err != nil {
			continue
		}

		timestamp := record["timestamp"].(primitive.DateTime).Time()
		writer.Write([]string{
			timestamp.Format(time.RFC3339),
			getString(record, "userId"),
			getString(record, "organizationId"),
			getString(record, "assistantType"),
			getString(record, "model"),
			strconv.FormatInt(getInt64(record, "totalTokens"), 10),
			strconv.FormatFloat(getFloat64(record, "cost"), 'f', 4, 64),
			getString(record, "status"),
		})
	}
}

// ExportConsumptionJSON exports consumption data as JSON
func (h *ExportHandler) ExportConsumptionJSON(c *gin.Context) {
	orgID := c.Query("organizationId")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	filter := bson.M{}
	if orgID != "" {
		filter["organizationId"] = orgID
	}
	if startDate != "" && endDate != "" {
		start, _ := time.Parse(time.RFC3339, startDate)
		end, _ := time.Parse(time.RFC3339, endDate)
		filter["timestamp"] = bson.M{
			"$gte": start,
			"$lte": end,
		}
	}

	collection := h.db.Collection("token_consumption")
	cursor, err := collection.Find(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	var records []bson.M
	if err := cursor.All(c.Request.Context(), &records); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", "attachment; filename=consumption.json")
	c.JSON(http.StatusOK, records)
}

// Helper functions
func getString(m bson.M, key string) string {
	if val, ok := m[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func getInt64(m bson.M, key string) int64 {
	if val, ok := m[key]; ok {
		switch v := val.(type) {
		case int64:
			return v
		case int32:
			return int64(v)
		case int:
			return int64(v)
		}
	}
	return 0
}

func getFloat64(m bson.M, key string) float64 {
	if val, ok := m[key]; ok {
		switch v := val.(type) {
		case float64:
			return v
		case float32:
			return float64(v)
		}
	}
	return 0
}

