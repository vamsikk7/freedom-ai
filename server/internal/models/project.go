package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Project struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizationID string             `bson:"organizationId" json:"organizationId"`
	ProjectID      string             `bson:"projectId" json:"projectId"` // Can be documentId or custom ID
	ProjectName   string             `bson:"projectName" json:"projectName"`
	CreatedBy      string             `bson:"createdBy" json:"createdBy"` // userId
	Tags           []string           `bson:"tags" json:"tags"`
	Metadata       map[string]interface{} `bson:"metadata" json:"metadata"`
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
}

