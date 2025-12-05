package consumption

import (
	"freedom-ai/management-server/internal/config"
)

type PricingService struct {
	config *config.Config
}

func NewPricingService(cfg *config.Config) *PricingService {
	return &PricingService{config: cfg}
}

func (p *PricingService) CalculateCost(model string, promptTokens, completionTokens int) float64 {
	var requestPrice, responsePrice float64

	// Determine pricing based on model
	switch model {
	case "gpt-4":
		requestPrice = p.config.PricingGPT4Request
		responsePrice = p.config.PricingGPT4Response
	case "gpt-4-turbo", "gpt-4-turbo-preview":
		requestPrice = p.config.PricingGPT4TurboRequest
		responsePrice = p.config.PricingGPT4TurboResponse
	case "gpt-3.5-turbo", "gpt-3.5-turbo-16k":
		requestPrice = p.config.PricingGPT35TurboRequest
		responsePrice = p.config.PricingGPT35TurboResponse
	default:
		// Default to GPT-3.5 pricing for unknown models
		requestPrice = p.config.PricingGPT35TurboRequest
		responsePrice = p.config.PricingGPT35TurboResponse
	}

	// Calculate cost (prices are per 1k tokens)
	promptCost := (float64(promptTokens) / 1000.0) * requestPrice
	completionCost := (float64(completionTokens) / 1000.0) * responsePrice

	return promptCost + completionCost
}

