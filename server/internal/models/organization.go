package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Organization struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrgID        string             `bson:"orgId" json:"orgId"` // SuperTokens tenant ID
	Name         string             `bson:"name" json:"name"`
	ContactEmail string             `bson:"contactEmail" json:"contactEmail"`
	BillingEmail string             `bson:"billingEmail" json:"billingEmail"`
	WalletBalance float64           `bson:"walletBalance" json:"walletBalance"`
	CreditLimit   float64           `bson:"creditLimit" json:"creditLimit"`
	AutoTopUp     AutoTopUpConfig   `bson:"autoTopUp" json:"autoTopUp"`
	ConsumptionLimits ConsumptionLimits `bson:"consumptionLimits" json:"consumptionLimits"`
	Status         string            `bson:"status" json:"status"` // active, inactive, suspended
	CreatedAt      time.Time         `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time         `bson:"updatedAt" json:"updatedAt"`
}

type AutoTopUpConfig struct {
	Enabled        bool   `bson:"enabled" json:"enabled"`
	Threshold      float64 `bson:"threshold" json:"threshold"`
	Amount         float64 `bson:"amount" json:"amount"`
	PaymentMethodID string `bson:"paymentMethodId" json:"paymentMethodId"`
}

type ConsumptionLimits struct {
	MonthlyLimit int64 `bson:"monthlyLimit" json:"monthlyLimit"`
	DailyLimit   int64 `bson:"dailyLimit" json:"dailyLimit"`
	PerUserLimit int64 `bson:"perUserLimit" json:"perUserLimit"`
}

