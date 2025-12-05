package handlers

import (
	"net/http"

	"freedom-ai/management-server/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/supertokens/supertokens-golang/recipe/passwordless"
	"github.com/supertokens/supertokens-golang/recipe/session"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type AuthHandler struct {
	config *config.Config
	db     *mongo.Database
}

func NewAuthHandler(cfg *config.Config, db *mongo.Database) *AuthHandler {
	return &AuthHandler{config: cfg, db: db}
}

// SendOTP sends a one-time password to the user's email
func (h *AuthHandler) SendOTP(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid email address is required"})
		return
	}

	// Create OTP code with SuperTokens Passwordless
	response, err := passwordless.CreateCodeWithEmail("public", req.Email, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send verification code"})
		return
	}

	if response.OK != nil {
		c.JSON(http.StatusOK, gin.H{
			"status":           "OK",
			"message":          "Verification code sent to your email",
			"deviceId":         response.OK.DeviceID,
			"preAuthSessionId": response.OK.PreAuthSessionID,
		})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to send verification code"})
	}
}

// VerifyOTP verifies the one-time password and creates a session
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req struct {
		PreAuthSessionId string `json:"preAuthSessionId" binding:"required"`
		DeviceId         string `json:"deviceId" binding:"required"`
		UserInputCode    string `json:"userInputCode" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All fields are required"})
		return
	}

	// Consume the OTP code
	response, err := passwordless.ConsumeCodeWithUserInputCode("public", req.DeviceId, req.UserInputCode, req.PreAuthSessionId, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify code"})
		return
	}

	if response.OK != nil {
		// Create session for the user
		_, err := session.CreateNewSession(c.Request, c.Writer, "public", response.OK.User.ID, nil, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status": "OK",
			"user": gin.H{
				"id":             response.OK.User.ID,
				"email":          response.OK.User.Email,
				"createdNewUser": response.OK.CreatedNewUser,
			},
		})
	} else if response.IncorrectUserInputCodeError != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":              "Incorrect verification code",
			"failedAttemptCount": response.IncorrectUserInputCodeError.FailedCodeInputAttemptCount,
			"maximumAttempts":    response.IncorrectUserInputCodeError.MaximumCodeInputAttempts,
		})
	} else if response.ExpiredUserInputCodeError != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Verification code has expired. Please request a new one."})
	} else if response.RestartFlowError != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please restart the login process"})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to verify code"})
	}
}

// ResendOTP resends the one-time password by creating a new code for the same email
func (h *AuthHandler) ResendOTP(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	// Create a new OTP code (resend by creating new)
	response, err := passwordless.CreateCodeWithEmail("public", req.Email, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resend verification code"})
		return
	}

	if response.OK != nil {
		c.JSON(http.StatusOK, gin.H{
			"status":           "OK",
			"message":          "Verification code resent",
			"deviceId":         response.OK.DeviceID,
			"preAuthSessionId": response.OK.PreAuthSessionID,
		})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to resend verification code"})
	}
}

// SignOut handles user logout
func (h *AuthHandler) SignOut(c *gin.Context) {
	sess, err := session.GetSession(c.Request, c.Writer, nil)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	err = sess.RevokeSession()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Signed out successfully"})
}

// GetCurrentUser returns the current authenticated user with role information
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	sess, err := session.GetSession(c.Request, c.Writer, nil)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	userID := sess.GetUserID()

	// Get user info from Passwordless
	userInfo, err := passwordless.GetUserByID(userID)
	if err != nil || userInfo == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	// Get user role from MongoDB
	collection := h.db.Collection("users")
	var user struct {
		Role           string `bson:"role"`
		OrganizationID string `bson:"organizationId"`
		Name           string `bson:"name"`
	}

	err = collection.FindOne(c.Request.Context(), bson.M{"userId": userID}).Decode(&user)
	if err != nil {
		// User might not exist in MongoDB yet (new signup), return without role
		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":    userInfo.ID,
				"email": userInfo.Email,
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":             userInfo.ID,
			"email":          userInfo.Email,
			"name":           user.Name,
			"role":           user.Role,
			"organizationId": user.OrganizationID,
		},
	})
}

// CheckEmail checks if an email exists in the system (removed - not supported by passwordless)
// Note: With passwordless, users are created on first OTP verification, so this check is not meaningful
