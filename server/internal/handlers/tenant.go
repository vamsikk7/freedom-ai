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

type TenantHandler struct {
	db *mongo.Database
}

func NewTenantHandler(db *mongo.Database) *TenantHandler {
	return &TenantHandler{db: db}
}

// ListTenants returns all tenants (developer only)
func (h *TenantHandler) ListTenants(c *gin.Context) {
	collection := h.db.Collection("organizations")
	cursor, err := collection.Find(c.Request.Context(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	var tenants []models.Organization
	if err := cursor.All(c.Request.Context(), &tenants); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get user counts for each tenant
	userCollection := h.db.Collection("users")
	type TenantWithCount struct {
		models.Organization
		UserCount int64 `json:"userCount"`
	}
	
	tenantsWithCounts := make([]TenantWithCount, len(tenants))
	for i, tenant := range tenants {
		userCount, _ := userCollection.CountDocuments(c.Request.Context(), bson.M{
			"organizationId": tenant.OrgID,
			"status":         "active",
		})
		tenantsWithCounts[i] = TenantWithCount{
			Organization: tenant,
			UserCount:    userCount,
		}
	}

	c.JSON(http.StatusOK, tenantsWithCounts)
}

// GetTenant returns a single tenant by ID
func (h *TenantHandler) GetTenant(c *gin.Context) {
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

	c.JSON(http.StatusOK, tenant)
}

// CreateTenant creates a new tenant
func (h *TenantHandler) CreateTenant(c *gin.Context) {
	var tenant models.Organization
	if err := c.ShouldBindJSON(&tenant); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenant.ID = primitive.NewObjectID()
	tenant.CreatedAt = time.Now()
	tenant.UpdatedAt = time.Now()
	if tenant.Status == "" {
		tenant.Status = "active"
	}
	if tenant.WalletBalance == 0 {
		tenant.WalletBalance = 0
	}

	collection := h.db.Collection("organizations")
	_, err := collection.InsertOne(c.Request.Context(), tenant)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tenant)
}

// UpdateTenant updates a tenant
func (h *TenantHandler) UpdateTenant(c *gin.Context) {
	id := c.Param("id")
	var updates models.Organization
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates.UpdatedAt = time.Now()
	collection := h.db.Collection("organizations")
	result, err := collection.UpdateOne(
		c.Request.Context(),
		bson.M{"orgId": id},
		bson.M{"$set": updates},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tenant updated"})
}

// DeleteTenant deactivates a tenant
func (h *TenantHandler) DeleteTenant(c *gin.Context) {
	id := c.Param("id")
	collection := h.db.Collection("organizations")

	result, err := collection.UpdateOne(
		c.Request.Context(),
		bson.M{"orgId": id},
		bson.M{"$set": bson.M{
			"status":    "inactive",
			"updatedAt": time.Now(),
		}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tenant deactivated"})
}

