package supertokens

import (
	"net/http"

	"freedom-ai/management-server/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/supertokens/supertokens-golang/recipe/passwordless"
	"github.com/supertokens/supertokens-golang/recipe/passwordless/plessmodels"
	"github.com/supertokens/supertokens-golang/recipe/session"
	"github.com/supertokens/supertokens-golang/recipe/thirdparty"
	"github.com/supertokens/supertokens-golang/recipe/thirdparty/tpmodels"
	"github.com/supertokens/supertokens-golang/supertokens"
)

func InitSuperTokens(cfg *config.Config) error {
	apiBasePath := "/api/v1/auth"

	// Build recipe list
	recipeList := []supertokens.Recipe{
		session.Init(nil),
		// Use Passwordless (OTP) instead of EmailPassword
		passwordless.Init(plessmodels.TypeInput{
			ContactMethodEmail: plessmodels.ContactMethodEmailConfig{
				Enabled: true,
			},
			FlowType: "USER_INPUT_CODE", // OTP flow
		}),
	}

	// Add Microsoft OAuth if configured
	if cfg.MicrosoftOAuthClientID != "" && cfg.MicrosoftOAuthClientSecret != "" {
		// SuperTokens will automatically handle the OAuth callback at /api/v1/auth/callback/microsoft
		// The redirect URI in Azure Portal should be: {API_DOMAIN}/api/v1/auth/callback/microsoft
		// For development: http://localhost:8080/api/v1/auth/callback/microsoft
		// For production: https://your-api-domain.com/api/v1/auth/callback/microsoft
		thirdPartyRecipe := thirdparty.Init(&tpmodels.TypeInput{
			SignInAndUpFeature: tpmodels.TypeInputSignInAndUp{
				Providers: []tpmodels.ProviderInput{
					{
						Config: tpmodels.ProviderConfig{
							ThirdPartyId: "microsoft",
							Clients: []tpmodels.ProviderClientConfig{
								{
									ClientID:     cfg.MicrosoftOAuthClientID,
									ClientSecret: cfg.MicrosoftOAuthClientSecret,
									Scope: []string{
										"openid",
										"email",
										"profile",
									},
								},
							},
						},
					},
				},
			},
		})
		recipeList = append(recipeList, thirdPartyRecipe)
	}

	err := supertokens.Init(supertokens.TypeInput{
		Supertokens: &supertokens.ConnectionInfo{
			ConnectionURI: cfg.SuperTokensConnectionURI,
			APIKey:        cfg.SuperTokensAPIKey,
		},
		AppInfo: supertokens.AppInfo{
			AppName:       "Freedom AI Management",
			APIDomain:     cfg.SuperTokensAPIDomain,
			WebsiteDomain: cfg.SuperTokensAPIDomain,
			APIBasePath:   &apiBasePath,
		},
		RecipeList: recipeList,
	})

	return err
}

// Middleware returns a Gin middleware for SuperTokens
func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		supertokens.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c.Request = r
			c.Next()
		})).ServeHTTP(c.Writer, c.Request)
	}
}

// VerifySession returns a middleware that requires a valid session
func VerifySession() gin.HandlerFunc {
	return func(c *gin.Context) {
		session.VerifySession(nil, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			sess, err := session.GetSession(r, w, nil)
			if err != nil {
				c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
				return
			}
			userID := sess.GetUserID()
			c.Set("userId", userID)
			c.Set("session", sess)
			c.Next()
		})).ServeHTTP(c.Writer, c.Request)
	}
}

// GetSession retrieves the current session
func GetSession(c *gin.Context) (interface{}, error) {
	return session.GetSession(c.Request, c.Writer, nil)
}
