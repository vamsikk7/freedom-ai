package handlers

import (
	"net/http"
	"time"

	"freedom-ai/management-server/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type OrganizationHandler struct {
	db *mongo.Database
}

func NewOrganizationHandler(db *mongo.Database) *OrganizationHandler {
	return &OrganizationHandler{db: db}
}

// UpdateConsumptionLimits updates consumption limits for an organization
func (h *OrganizationHandler) UpdateConsumptionLimits(c *gin.Context) {
	orgID := c.Param("id")
	var limits models.ConsumptionLimits
	if err := c.ShouldBindJSON(&limits); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := h.db.Collection("organizations")
	result, err := collection.UpdateOne(
		c.Request.Context(),
		bson.M{"orgId": orgID},
		bson.M{"$set": bson.M{
			"consumptionLimits": limits,
			"updatedAt":         time.Now(),
		}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Consumption limits updated"})
}

// UpdateAutoTopUp updates auto-top-up settings for an organization
func (h *OrganizationHandler) UpdateAutoTopUp(c *gin.Context) {
	orgID := c.Param("id")
	var autoTopUp models.AutoTopUpConfig
	if err := c.ShouldBindJSON(&autoTopUp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := h.db.Collection("organizations")
	result, err := collection.UpdateOne(
		c.Request.Context(),
		bson.M{"orgId": orgID},
		bson.M{"$set": bson.M{
			"autoTopUp": autoTopUp,
			"updatedAt": time.Now(),
		}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Auto-top-up settings updated"})
}

