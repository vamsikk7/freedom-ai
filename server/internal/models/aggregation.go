package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DailyConsumption struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizationID string            `bson:"organizationId" json:"organizationId"`
	Date           time.Time         `bson:"date" json:"date"`
	TotalTokens    int64             `bson:"totalTokens" json:"totalTokens"`
	TotalCost      float64           `bson:"totalCost" json:"totalCost"`
	Breakdown      ConsumptionBreakdown `bson:"breakdown" json:"breakdown"`
	CreatedAt      time.Time         `bson:"createdAt" json:"createdAt"`
}

type MonthlyConsumption struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizationID string            `bson:"organizationId" json:"organizationId"`
	Month          string            `bson:"month" json:"month"` // "2024-12"
	TotalTokens    int64             `bson:"totalTokens" json:"totalTokens"`
	TotalCost      float64           `bson:"totalCost" json:"totalCost"`
	Breakdown      ConsumptionBreakdown `bson:"breakdown" json:"breakdown"`
	CreatedAt      time.Time         `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time         `bson:"updatedAt" json:"updatedAt"`
}

type ConsumptionBreakdown struct {
	ByAssistant map[string]AssistantBreakdown `bson:"byAssistant" json:"byAssistant"`
	ByUser      map[string]UserBreakdown      `bson:"byUser" json:"byUser"`
	ByProject   map[string]ProjectBreakdown   `bson:"byProject,omitempty" json:"byProject,omitempty"`
}

type ProjectBreakdown struct {
	Tokens   int64   `bson:"tokens" json:"tokens"`
	Cost     float64 `bson:"cost" json:"cost"`
	Requests int64   `bson:"requests" json:"requests"`
}

type ProjectConsumptionMonthly struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizationID string            `bson:"organizationId" json:"organizationId"`
	ProjectID      string            `bson:"projectId" json:"projectId"`
	Month          string            `bson:"month" json:"month"` // "2024-12"
	TotalTokens    int64             `bson:"totalTokens" json:"totalTokens"`
	TotalCost      float64           `bson:"totalCost" json:"totalCost"`
	RequestCount   int64             `bson:"requestCount" json:"requestCount"`
	Breakdown      ProjectBreakdownDetail `bson:"breakdown" json:"breakdown"`
	UpdatedAt      time.Time         `bson:"updatedAt" json:"updatedAt"`
}

type ProjectBreakdownDetail struct {
	ByAssistant map[string]AssistantProjectBreakdown `bson:"byAssistant" json:"byAssistant"`
	ByUser      map[string]UserProjectBreakdown      `bson:"byUser" json:"byUser"`
}

type AssistantProjectBreakdown struct {
	Tokens   int64   `bson:"tokens" json:"tokens"`
	Cost     float64 `bson:"cost" json:"cost"`
	Requests int64   `bson:"requests" json:"requests"`
}

type UserProjectBreakdown struct {
	Tokens   int64   `bson:"tokens" json:"tokens"`
	Cost     float64 `bson:"cost" json:"cost"`
	Requests int64   `bson:"requests" json:"requests"`
}

