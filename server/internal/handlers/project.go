package handlers

import (
	"net/http"

	"freedom-ai/management-server/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type ProjectHandler struct {
	db *mongo.Database
}

func NewProjectHandler(db *mongo.Database) *ProjectHandler {
	return &ProjectHandler{db: db}
}

// ListProjects returns projects for an organization
func (h *ProjectHandler) ListProjects(c *gin.Context) {
	orgID := c.Query("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organizationId is required"})
		return
	}

	collection := h.db.Collection("projects")
	cursor, err := collection.Find(c.Request.Context(), bson.M{"organizationId": orgID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	var projects []models.Project
	if err := cursor.All(c.Request.Context(), &projects); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, projects)
}

// GetProjectConsumption returns consumption for a project
func (h *ProjectHandler) GetProjectConsumption(c *gin.Context) {
	projectID := c.Param("id")
	month := c.Query("month") // Format: "2024-12"

	collection := h.db.Collection("project_consumption_monthly")
	filter := bson.M{"projectId": projectID}
	if month != "" {
		filter["month"] = month
	}

	cursor, err := collection.Find(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	var results []models.ProjectConsumptionMonthly
	if err := cursor.All(c.Request.Context(), &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

// GetProjectConsumptionByMonth returns monthly consumption for a project
func (h *ProjectHandler) GetProjectConsumptionByMonth(c *gin.Context) {
	orgID := c.Query("organizationId")
	month := c.Query("month")

	if orgID == "" || month == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organizationId and month are required"})
		return
	}

	collection := h.db.Collection("project_consumption_monthly")
	cursor, err := collection.Find(
		c.Request.Context(),
		bson.M{
			"organizationId": orgID,
			"month":          month,
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	var results []models.ProjectConsumptionMonthly
	if err := cursor.All(c.Request.Context(), &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

