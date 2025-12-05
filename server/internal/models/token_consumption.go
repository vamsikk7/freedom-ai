package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TokenConsumption struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RequestID  string            `bson:"requestId" json:"requestId"` // Unique UUID
	Timestamp  time.Time         `bson:"timestamp" json:"timestamp"` // Response timestamp (or request if no response)
	UserID     string            `bson:"userId" json:"userId"`
	OrgID      string            `bson:"organizationId" json:"organizationId"`
	
	// Enhanced fields (after collector updates)
	AssistantType string `bson:"assistantType" json:"assistantType"` // word, excel, powerpoint, etc.
	DocumentID    string `bson:"documentId" json:"documentId"`
	ConversationID string `bson:"conversationId" json:"conversationId"`
	ProjectID     string `bson:"projectId" json:"projectId"` // Derived from documentId or conversationId
	
	Model string `bson:"model" json:"model"`
	
	// Request data
	RequestTimestamp      time.Time `bson:"requestTimestamp" json:"requestTimestamp"`
	RequestCharacterCount int       `bson:"requestCharacterCount" json:"requestCharacterCount"`
	RequestTokenCount     int       `bson:"requestTokenCount" json:"requestTokenCount"` // Estimated
	RequestType           string    `bson:"requestType" json:"requestType"`           // stream or non-stream
	ToolCount             int       `bson:"toolCount" json:"toolCount"`
	MessageCount          int       `bson:"messageCount" json:"messageCount"`
	
	// Response data
	ResponseTimestamp      time.Time `bson:"responseTimestamp" json:"responseTimestamp"`
	ResponseCharacterCount int       `bson:"responseCharacterCount" json:"responseCharacterCount"`
	ResponseTokenCount     int       `bson:"responseTokenCount" json:"responseTokenCount"` // Estimated
	
	// Accurate token counts (from usage field)
	PromptTokens     int `bson:"promptTokens" json:"promptTokens"`         // From usage.promptTokens
	CompletionTokens int `bson:"completionTokens" json:"completionTokens"` // From usage.completionTokens
	TotalTokens      int `bson:"totalTokens" json:"totalTokens"`           // From usage.totalTokens (use this for billing)
	
	// Metadata
	FinishReason   string `bson:"finishReason" json:"finishReason"`
	ResponseTimeMs int64  `bson:"responseTimeMs" json:"responseTimeMs"`
	HasToolCalls   bool   `bson:"hasToolCalls" json:"hasToolCalls"`
	ToolCallCount  int    `bson:"toolCallCount" json:"toolCallCount"`
	
	// Billing
	Cost float64 `bson:"cost" json:"cost"` // Calculated from totalTokens and model pricing
	
	// Status
	Status string `bson:"status" json:"status"` // complete, request-only, response-only, error
	
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
}

// LLMRequestData matches the collector's request message format
type LLMRequestData struct {
	RequestID        string    `json:"requestId"`
	Timestamp        time.Time `json:"timestamp"`
	UserID           string    `json:"userId"`
	OrganizationID   string    `json:"organizationId"`
	Model            string    `json:"model"`
	Messages         []interface{} `json:"messages"`
	SystemPrompt     string    `json:"systemPrompt"`
	Tools            []interface{} `json:"tools"`
	CharacterCount   int       `json:"characterCount"`
	TokenCount       int       `json:"tokenCount"` // Estimated
	RequestType      string    `json:"requestType"`
	ToolCount        int       `json:"toolCount"`
	MessageCount     int       `json:"messageCount"`
	Temperature      float64   `json:"temperature"`
	MaxTokens        int       `json:"maxTokens"`
	TopP             float64   `json:"topP"`
	AssistantType    string    `json:"assistantType,omitempty"` // After enhancement
	DocumentID       string    `json:"documentId,omitempty"`    // After enhancement
	ConversationID   string    `json:"conversationId,omitempty"` // After enhancement
}

// LLMResponseData matches the collector's response message format
type LLMResponseData struct {
	RequestID      string    `json:"requestId"`
	Timestamp      time.Time `json:"timestamp"`
	UserID         string    `json:"userId"`
	OrganizationID string    `json:"organizationId"`
	Model          string    `json:"model"`
	Response       string    `json:"response"`
	CharacterCount int       `json:"characterCount"`
	TokenCount     int       `json:"tokenCount"` // Estimated
	FinishReason   string    `json:"finishReason"`
	Usage          *Usage    `json:"usage"` // Accurate token counts
	ResponseTimeMs int64     `json:"responseTimeMs"`
	HasToolCalls   bool      `json:"hasToolCalls"`
	ToolCallCount  int       `json:"toolCallCount"`
	AssistantType  string    `json:"assistantType,omitempty"` // After enhancement
	DocumentID     string    `json:"documentId,omitempty"`    // After enhancement
	ConversationID string    `json:"conversationId,omitempty"` // After enhancement
}

type Usage struct {
	PromptTokens     int `json:"promptTokens"`
	CompletionTokens int `json:"completionTokens"`
	TotalTokens      int `json:"totalTokens"`
}

