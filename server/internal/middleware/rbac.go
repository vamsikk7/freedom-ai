package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// RequireRole checks if the user has the required role
func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userId")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		dbInterface, exists := c.Get("db")
		if !exists {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Database not found in context"})
			return
		}
		db, ok := dbInterface.(*mongo.Database)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Invalid database type in context"})
			return
		}
		collection := db.Collection("users")

		var user struct {
			Role           string `bson:"role"`
			OrganizationID string `bson:"organizationId"`
		}

		err := collection.FindOne(c.Request.Context(), bson.M{"userId": userID}).Decode(&user)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "User not found"})
			return
		}

		// Check role hierarchy
		hasAccess := false
		switch requiredRole {
		case "developer":
			hasAccess = user.Role == "developer"
		case "tenant_admin":
			hasAccess = user.Role == "developer" || user.Role == "tenant_admin"
		case "tenant_user":
			hasAccess = true // All authenticated users can access
		}

		if !hasAccess {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			return
		}

		c.Set("userRole", user.Role)
		c.Set("organizationId", user.OrganizationID)
		c.Next()
	}
}

// RequireOrganizationScope ensures the user can only access their organization's data
func RequireOrganizationScope() gin.HandlerFunc {
	return func(c *gin.Context) {
		orgID := c.Query("organizationId")
		if orgID == "" {
			orgID = c.Param("organizationId")
		}

		userOrgID, exists := c.Get("organizationId")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Organization not found"})
			return
		}

		userRole, _ := c.Get("userRole")
		// Developers can access all organizations
		if userRole == "developer" {
			c.Next()
			return
		}

		// Other users can only access their own organization
		if orgID != "" && orgID != userOrgID {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access denied to this organization"})
			return
		}

		// Set organization ID in context if not provided
		if orgID == "" {
			c.Set("organizationId", userOrgID)
		}

		c.Next()
	}
}

