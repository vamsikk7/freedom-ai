package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID         string             `bson:"userId" json:"userId"` // SuperTokens user ID
	OrganizationID string             `bson:"organizationId" json:"organizationId"`
	Email          string             `bson:"email" json:"email"`
	Name           string             `bson:"name" json:"name"`
	Role           string             `bson:"role" json:"role"` // developer, tenant_admin, tenant_user
	Status         string             `bson:"status" json:"status"` // active, inactive
	LastActive     *time.Time         `bson:"lastActive,omitempty" json:"lastActive,omitempty"`
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type UserConsumptionSummary struct {
	UserID         string  `json:"userId"`
	Email          string  `json:"email"`
	Name           string  `json:"name"`
	TotalTokens    int64   `json:"totalTokens"`
	TotalCost      float64 `json:"totalCost"`
	RequestCount   int64   `json:"requestCount"`
}

