package handlers

import (
	"net/http"
	"time"

	"freedom-ai/management-server/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type BillingHandler struct {
	db *mongo.Database
}

func NewBillingHandler(db *mongo.Database) *BillingHandler {
	return &BillingHandler{db: db}
}

// GetWalletBalance returns the wallet balance for an organization
func (h *BillingHandler) GetWalletBalance(c *gin.Context) {
	orgID := c.Query("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organizationId is required"})
		return
	}

	collection := h.db.Collection("organizations")
	var org models.Organization
	err := collection.FindOne(c.Request.Context(), bson.M{"orgId": orgID}).Decode(&org)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"balance": org.WalletBalance})
}

// GetBillingHistory returns billing history for an organization
func (h *BillingHandler) GetBillingHistory(c *gin.Context) {
	orgID := c.Query("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organizationId is required"})
		return
	}

	collection := h.db.Collection("billing_history")
	cursor, err := collection.Find(
		c.Request.Context(),
		bson.M{"organizationId": orgID},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	var records []models.BillingHistory
	if err := cursor.All(c.Request.Context(), &records); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, records)
}

// CreateTopUp creates a top-up transaction (Stripe integration will be added)
func (h *BillingHandler) CreateTopUp(c *gin.Context) {
	var req struct {
		OrganizationID string  `json:"organizationId"`
		Amount          float64 `json:"amount"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	topUp := models.TopUpTransaction{
		ID:             primitive.NewObjectID(),
		OrganizationID: req.OrganizationID,
		Amount:         req.Amount,
		Status:         "pending",
		CreatedAt:      time.Now(),
	}

	collection := h.db.Collection("top_up_transactions")
	_, err := collection.InsertOne(c.Request.Context(), topUp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, topUp)
}

