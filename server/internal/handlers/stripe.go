package handlers

import (
	"io"
	"net/http"

	"freedom-ai/management-server/internal/services/stripe"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v78/webhook"
)

type StripeHandler struct {
	stripeService *stripe.Service
	webhookSecret string
}

func NewStripeHandler(stripeService *stripe.Service, webhookSecret string) *StripeHandler {
	return &StripeHandler{
		stripeService: stripeService,
		webhookSecret: webhookSecret,
	}
}

// CreateTopUpSession creates a Stripe checkout session for wallet top-up
func (h *StripeHandler) CreateTopUpSession(c *gin.Context) {
	var req struct {
		OrganizationID string  `json:"organizationId"`
		Amount         float64 `json:"amount"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Amount < 10 || req.Amount > 10000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount must be between $10 and $10,000"})
		return
	}

	successURL := c.Query("success_url")
	if successURL == "" {
		successURL = "/dashboard/billing?success=true"
	}

	cancelURL := c.Query("cancel_url")
	if cancelURL == "" {
		cancelURL = "/dashboard/billing?canceled=true"
	}

	sess, err := h.stripeService.CreateCheckoutSession(c.Request.Context(), req.OrganizationID, req.Amount, successURL, cancelURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessionId": sess.ID,
		"url":       sess.URL,
	})
}

// HandleWebhook processes Stripe webhook events
func (h *StripeHandler) HandleWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event, err := webhook.ConstructEvent(payload, c.GetHeader("Stripe-Signature"), h.webhookSecret)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		return
	}

	if err := h.stripeService.HandleWebhook(c.Request.Context(), event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

