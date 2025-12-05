package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BillingHistory struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizationID    string            `bson:"organizationId" json:"organizationId"`
	BillingDate       time.Time         `bson:"billingDate" json:"billingDate"`
	PeriodStart       time.Time         `bson:"periodStart" json:"periodStart"`
	PeriodEnd         time.Time         `bson:"periodEnd" json:"periodEnd"`
	TotalTokens       int64             `bson:"totalTokens" json:"totalTokens"`
	TotalCost         float64           `bson:"totalCost" json:"totalCost"`
	Breakdown         BillingBreakdown  `bson:"breakdown" json:"breakdown"`
	WalletBalanceBefore float64         `bson:"walletBalanceBefore" json:"walletBalanceBefore"`
	WalletBalanceAfter  float64         `bson:"walletBalanceAfter" json:"walletBalanceAfter"`
	Status            string            `bson:"status" json:"status"` // completed, failed, pending
	CreatedAt         time.Time         `bson:"createdAt" json:"createdAt"`
}

type BillingBreakdown struct {
	ByAssistant map[string]AssistantBreakdown `bson:"byAssistant" json:"byAssistant"`
	ByUser      map[string]UserBreakdown      `bson:"byUser" json:"byUser"`
}

type AssistantBreakdown struct {
	Tokens  int64   `bson:"tokens" json:"tokens"`
	Cost    float64 `bson:"cost" json:"cost"`
}

type UserBreakdown struct {
	Tokens  int64   `bson:"tokens" json:"tokens"`
	Cost    float64 `bson:"cost" json:"cost"`
}

type TopUpTransaction struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrganizationID string            `bson:"organizationId" json:"organizationId"`
	Amount         float64           `bson:"amount" json:"amount"`
	StripePaymentIntentID string     `bson:"stripePaymentIntentId" json:"stripePaymentIntentId"`
	Status         string            `bson:"status" json:"status"` // pending, succeeded, failed
	CreatedAt      time.Time         `bson:"createdAt" json:"createdAt"`
	CompletedAt    *time.Time        `bson:"completedAt,omitempty" json:"completedAt,omitempty"`
}

