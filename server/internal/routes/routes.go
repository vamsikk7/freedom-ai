package routes

import (
	"freedom-ai/management-server/internal/config"
	"freedom-ai/management-server/internal/handlers"
	"freedom-ai/management-server/internal/lib/supertokens"
	"freedom-ai/management-server/internal/middleware"
	"freedom-ai/management-server/internal/services/consumption"
	"freedom-ai/management-server/internal/services/stripe"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
)

func SetupRoutes(router *gin.Engine, db *mongo.Database, cfg *config.Config, realtimeService *consumption.RealtimeService, logger *zap.Logger) {
	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Initialize handlers
	tenantHandler := handlers.NewTenantHandler(db)
	consumptionHandler := handlers.NewConsumptionHandler(db, realtimeService, logger)
	billingHandler := handlers.NewBillingHandler(db)
	userHandler := handlers.NewUserHandler(db)
	analyticsHandler := handlers.NewAnalyticsHandler(db)
	projectHandler := handlers.NewProjectHandler(db)
	exportHandler := handlers.NewExportHandler(db)
	authHandler := handlers.NewAuthHandler(cfg, db)

	// Initialize Stripe service and handler
	var stripeHandler *handlers.StripeHandler
	if cfg.StripeSecretKey != "" {
		// Create a simple logger for stripe service
		logger, _ := zap.NewProduction()
		defer logger.Sync()
		stripeService := stripe.NewService(cfg, db, logger)
		stripeHandler = handlers.NewStripeHandler(stripeService, cfg.StripeWebhookSecret)
	}

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public/auth routes - OTP based authentication
		auth := v1.Group("/auth")
		{
			// OTP endpoints
			auth.POST("/send-otp", authHandler.SendOTP)
			auth.POST("/verify-otp", authHandler.VerifyOTP)
			auth.POST("/resend-otp", authHandler.ResendOTP)
			auth.POST("/signout", authHandler.SignOut)
			// GetCurrentUser requires authentication but is public endpoint (returns 401 if not authenticated)
			auth.GET("/user", supertokens.VerifySession(), authHandler.GetCurrentUser)
			
			// Third-party OAuth routes (handled by SuperTokens)
			// These routes are automatically handled by SuperTokens middleware
		}

		// Public routes (only for webhooks and health checks)
		public := v1.Group("")
		{
			// Stripe webhook must be public
			if stripeHandler != nil {
				public.POST("/billing/stripe/webhook", stripeHandler.HandleWebhook)
			}
		}

		// Protected routes (require authentication)
		protected := v1.Group("")
		protected.Use(supertokens.VerifySession())
		{
			// Developer-only routes
			developerOnly := protected.Group("")
			developerOnly.Use(middleware.RequireRole("developer"))
			{
				developerOnly.GET("/admin/tenants", tenantHandler.ListTenants)
				developerOnly.GET("/admin/tenants/:id", tenantHandler.GetTenant)
				developerOnly.GET("/admin/tenants/:id/details", tenantHandler.GetTenantDetails)
				developerOnly.POST("/admin/tenants", tenantHandler.CreateTenant)
				developerOnly.PUT("/admin/tenants/:id", tenantHandler.UpdateTenant)
				developerOnly.DELETE("/admin/tenants/:id", tenantHandler.DeleteTenant)
			}

			// Tenant admin and developer routes
			adminRoutes := protected.Group("")
			adminRoutes.Use(middleware.RequireRole("tenant_admin"))
			{
				orgHandler := handlers.NewOrganizationHandler(db)
				adminRoutes.PUT("/organization/:id/consumption-limits", orgHandler.UpdateConsumptionLimits)
				adminRoutes.PUT("/organization/:id/auto-top-up", orgHandler.UpdateAutoTopUp)
				adminRoutes.GET("/organization/users", userHandler.ListUsers)
				adminRoutes.GET("/organization/users/:id", userHandler.GetUser)
				adminRoutes.POST("/organization/users", userHandler.CreateUser)
				adminRoutes.PUT("/organization/users/:id", userHandler.UpdateUser)
				adminRoutes.DELETE("/organization/users/:id", userHandler.DeleteUser)
			}

			// All authenticated users
			protected.GET("/organization/users/:id/consumption", userHandler.GetUserConsumption)
			protected.GET("/consumption/history", consumptionHandler.GetConsumptionHistory)
			protected.GET("/consumption/by-assistant", consumptionHandler.GetConsumptionByAssistant)
			protected.GET("/consumption/by-user", consumptionHandler.GetConsumptionByUser)
			protected.GET("/consumption/real-time", consumptionHandler.GetRealTimeConsumption)
			protected.GET("/billing/wallet", billingHandler.GetWalletBalance)
			protected.GET("/billing/history", billingHandler.GetBillingHistory)
			protected.POST("/billing/top-up", billingHandler.CreateTopUp)
			protected.GET("/analytics/overview", analyticsHandler.GetSystemOverview)
			protected.GET("/analytics/consumption-trends", analyticsHandler.GetConsumptionTrends)
			protected.GET("/analytics/top-tenants", analyticsHandler.GetTopTenants)
			protected.GET("/analytics/revenue-trends", analyticsHandler.GetRevenueTrends)
			protected.GET("/organization/projects", projectHandler.ListProjects)
			protected.GET("/organization/projects/:id/consumption", projectHandler.GetProjectConsumption)
			protected.GET("/organization/projects/consumption/monthly", projectHandler.GetProjectConsumptionByMonth)
			protected.GET("/export/consumption/csv", exportHandler.ExportConsumptionCSV)
			protected.GET("/export/consumption/json", exportHandler.ExportConsumptionJSON)

			// Usage patterns (all authenticated)
			usagePatternsHandler := handlers.NewUsagePatternsHandler(db)
			protected.GET("/analytics/usage-patterns/peak-times", usagePatternsHandler.GetPeakUsageTimes)
			protected.GET("/analytics/usage-patterns/day-of-week", usagePatternsHandler.GetUsageByDayOfWeek)
			protected.GET("/analytics/usage-patterns/assistant-type", usagePatternsHandler.GetUsageByAssistantType)
			protected.GET("/analytics/usage-patterns/user-activity", usagePatternsHandler.GetUserActivityPatterns)

			// Revenue endpoints (admin only)
			revenueHandler := handlers.NewRevenueHandler(db)
			adminRoutes.GET("/analytics/revenue/top-up-frequency", revenueHandler.GetTopUpFrequency)
			adminRoutes.GET("/analytics/revenue/billing-deductions", revenueHandler.GetBillingDeductionsByDay)
			adminRoutes.GET("/analytics/revenue/by-tenant", revenueHandler.GetRevenueByTenant)

			// Reports handler
			reportsHandler := handlers.NewReportsHandler(db)
			protected.GET("/reports/monthly", reportsHandler.GetMonthlyReport)

			// PDF handler
			pdfHandler := handlers.NewPDFHandler(db)
			protected.GET("/export/reports/monthly/pdf", pdfHandler.ExportMonthlyReportPDF)

			// Stripe endpoints
			if stripeHandler != nil {
				protected.POST("/billing/stripe/checkout", stripeHandler.CreateTopUpSession)
			}
		}
	}
}
