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

type UserHandler struct {
	db *mongo.Database
}

func NewUserHandler(db *mongo.Database) *UserHandler {
	return &UserHandler{db: db}
}

// ListUsers returns users for an organization
func (h *UserHandler) ListUsers(c *gin.Context) {
	orgID := c.Query("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organizationId is required"})
		return
	}

	collection := h.db.Collection("users")
	filter := bson.M{"organizationId": orgID}
	cursor, err := collection.Find(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	var users []models.User
	if err := cursor.All(c.Request.Context(), &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

// GetUser returns a single user by ID
func (h *UserHandler) GetUser(c *gin.Context) {
	id := c.Param("id")
	collection := h.db.Collection("users")

	var user models.User
	err := collection.FindOne(c.Request.Context(), bson.M{"userId": id}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

// CreateUser creates a new user
func (h *UserHandler) CreateUser(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user.ID = primitive.NewObjectID()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	if user.Status == "" {
		user.Status = "active"
	}
	if user.Role == "" {
		user.Role = "tenant_user"
	}

	collection := h.db.Collection("users")
	_, err := collection.InsertOne(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// UpdateUser updates a user
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var updates models.User
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates.UpdatedAt = time.Now()
	collection := h.db.Collection("users")
	result, err := collection.UpdateOne(
		c.Request.Context(),
		bson.M{"userId": id},
		bson.M{"$set": updates},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated"})
}

// DeleteUser deactivates a user
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	collection := h.db.Collection("users")

	result, err := collection.UpdateOne(
		c.Request.Context(),
		bson.M{"userId": id},
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
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deactivated"})
}

// GetUserConsumption returns consumption summary for a user
func (h *UserHandler) GetUserConsumption(c *gin.Context) {
	userID := c.Param("id")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	match := bson.M{"userId": userID}
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
				"_id":         "$userId",
				"totalTokens": bson.M{"$sum": "$totalTokens"},
				"totalCost":   bson.M{"$sum": "$cost"},
				"requestCount": bson.M{"$sum": 1},
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

	if len(results) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"totalTokens":  0,
			"totalCost":   0,
			"requestCount": 0,
		})
		return
	}

	c.JSON(http.StatusOK, results[0])
}

