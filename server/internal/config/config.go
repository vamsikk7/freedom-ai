package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	Environment string

	// Database
	MongoDBURI      string
	MongoDBDatabase string

	// Redis
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	// RabbitMQ
	RabbitMQURL      string
	RabbitMQExchange string

	// SuperTokens
	SuperTokensConnectionURI string
	SuperTokensAPIKey        string
	SuperTokensAPIDomain     string

	// Microsoft OAuth
	MicrosoftOAuthClientID     string
	MicrosoftOAuthClientSecret string

	// Super Admin (OTP-based auth - first user with this email gets super admin)
	SuperAdminEmail string

	// Stripe
	StripeSecretKey     string
	StripeWebhookSecret string

	// Pricing
	PricingGPT4Request        float64
	PricingGPT4Response       float64
	PricingGPT4TurboRequest   float64
	PricingGPT4TurboResponse  float64
	PricingGPT35TurboRequest  float64
	PricingGPT35TurboResponse float64

	// CORS
	CORSOrigin string

	// SMTP (for email notifications)
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string
}

func Load() *Config {
	// Load .env file if it exists
	_ = godotenv.Load()

	return &Config{
		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("ENVIRONMENT", "development"),

		MongoDBURI:      getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		MongoDBDatabase: getEnv("MONGODB_DATABASE", "freedom_ai_management"),

		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),

		RabbitMQURL:      getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		RabbitMQExchange: getEnv("RABBITMQ_EXCHANGE", "llm-events"),

		SuperTokensConnectionURI: getEnv("SUPERTOKENS_CONNECTION_URI", "http://localhost:3567"),
		SuperTokensAPIKey:        getEnv("SUPERTOKENS_API_KEY", ""),
		SuperTokensAPIDomain:     getEnv("SUPERTOKENS_API_DOMAIN", "localhost"),

		MicrosoftOAuthClientID:     getEnv("MICROSOFT_OAUTH_CLIENT_ID", ""),
		MicrosoftOAuthClientSecret: getEnv("MICROSOFT_OAUTH_CLIENT_SECRET", ""),

		SuperAdminEmail: getEnv("SUPER_ADMIN_EMAIL", "admin@freedom-ai.com"),

		StripeSecretKey:     getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),

		PricingGPT4Request:        getEnvAsFloat("PRICING_GPT4_REQUEST", 0.03),
		PricingGPT4Response:       getEnvAsFloat("PRICING_GPT4_RESPONSE", 0.06),
		PricingGPT4TurboRequest:   getEnvAsFloat("PRICING_GPT4_TURBO_REQUEST", 0.01),
		PricingGPT4TurboResponse:  getEnvAsFloat("PRICING_GPT4_TURBO_RESPONSE", 0.03),
		PricingGPT35TurboRequest:  getEnvAsFloat("PRICING_GPT35_TURBO_REQUEST", 0.0015),
		PricingGPT35TurboResponse: getEnvAsFloat("PRICING_GPT35_TURBO_RESPONSE", 0.002),

		CORSOrigin: getEnv("CORS_ORIGIN", "http://localhost:3000"),

		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getEnvAsInt("SMTP_PORT", 587),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:     getEnv("SMTP_FROM", "noreply@freedom-ai.com"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsFloat(key string, defaultValue float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatValue, err := strconv.ParseFloat(value, 64); err == nil {
			return floatValue
		}
	}
	return defaultValue
}
