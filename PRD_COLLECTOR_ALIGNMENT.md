# PRD and Collector Implementation Alignment

## Summary

The Management Dashboard PRD has been **updated to align with the actual collector implementation**. This document explains the alignment and any required enhancements.

---

## ✅ What's Aligned

### 1. Dual-Message Architecture

**PRD Now Reflects**:
- ✅ Two separate RabbitMQ messages: `llm.request` and `llm.response`
- ✅ Routing keys: `llm.request` and `llm.response`
- ✅ Exchange: `llm-events` (topic exchange)
- ✅ Request-response linking via `requestId` (UUID)

**Collector Implementation**:
- ✅ Publishes to `llm.request` routing key for requests
- ✅ Publishes to `llm.response` routing key for responses
- ✅ Uses `requestId` to link requests and responses

### 2. Data Structures

**PRD Now Reflects**:
- ✅ `LLMRequestData` structure with all fields from collector
- ✅ `LLMResponseData` structure with all fields from collector
- ✅ `Usage` field with `promptTokens`, `completionTokens`, `totalTokens`

**Collector Implementation**:
- ✅ Matches PRD data structures exactly
- ✅ Includes character counts, token counts (estimated)
- ✅ Includes usage field in responses (accurate token counts)

### 3. Token Counting

**PRD Now Reflects**:
- ✅ Priority order: `usage.totalTokens` > `usage.promptTokens + usage.completionTokens` > estimated counts
- ✅ Cost calculation uses accurate token counts from `usage` field
- ✅ Fallback to estimated counts if usage field missing

**Collector Implementation**:
- ✅ Provides `usage` field in responses when available
- ✅ Provides estimated `tokenCount` as fallback

### 4. User and Organization Tracking

**PRD Now Reflects**:
- ✅ `userId` and `organizationId` captured from SuperTokens
- ✅ Caching mechanism (5-minute cache)
- ✅ Organization ID from membership lookup

**Collector Implementation**:
- ✅ `getUserAndOrg()` method retrieves user and org
- ✅ 5-minute cache for user/org mappings
- ✅ Handles missing data gracefully

---

## ⚠️ What Needs Enhancement

### 1. Assistant Type

**Current State**:
- ❌ Collector does NOT capture assistant type
- ❌ PRD assumes assistant type will be available

**Required**:
- Add `assistantType` field to `LLMRequestData` and `LLMResponseData`
- Extract from Gin context: `c.Get("documentType")`
- Map document type to assistant type string

**Impact**: High - Required for consumption breakdown by assistant

**See**: `COLLECTOR_ENHANCEMENTS.md` for implementation details

### 2. Document ID

**Current State**:
- ❌ Collector does NOT capture document ID
- ❌ PRD assumes document ID will be available for project tracking

**Required**:
- Add `documentId` field to `LLMRequestData` and `LLMResponseData`
- Extract from request body or query parameters
- Use for project-level consumption tracking

**Impact**: Medium - Required for project consumption rates feature

**See**: `COLLECTOR_ENHANCEMENTS.md` for implementation details

### 3. Conversation ID

**Current State**:
- ❌ Collector does NOT capture conversation ID
- ❌ PRD assumes conversation ID will be available

**Required**:
- Add `conversationId` field to `LLMRequestData` and `LLMResponseData`
- Extract from request body
- Use for conversation-level analytics

**Impact**: Low - Nice to have for analytics

**See**: `COLLECTOR_ENHANCEMENTS.md` for implementation details

---

## Consumer Service Requirements

### Current PRD Assumptions

The PRD assumes a consumer service that:
1. Consumes from TWO queues (`llm.request` and `llm.response`)
2. Matches requests and responses by `requestId`
3. Combines data into single consumption record
4. Handles orphaned messages (request without response, or vice versa)

### Implementation Notes

**Queue Setup**:
```go
// Declare queues
requestQueue := "llm-consumption-requests"
responseQueue := "llm-consumption-responses"

// Bind to exchange
channel.QueueBind(requestQueue, "llm.request", "llm-events", false, nil)
channel.QueueBind(responseQueue, "llm.response", "llm-events", false, nil)
```

**Matching Logic**:
1. Store requests in Redis cache (key: `request:{requestId}`, TTL: 1 hour)
2. When response arrives, lookup request by `requestId`
3. Combine data and store in MongoDB
4. Clean up cache entry

**Orphaned Message Handling**:
- Request without response: Store as `status: "request-only"`, don't bill
- Response without request: Store as `status: "response-only"`, use response data only
- Retry matching after 24 hours for incomplete records

---

## Billing Logic Alignment

### Token Count Priority

**PRD Specifies** (now aligned):
1. **Primary**: `usage.totalTokens` from response (most accurate)
2. **Secondary**: `usage.promptTokens + usage.completionTokens` (if totalTokens missing)
3. **Fallback**: `requestTokenCount + responseTokenCount` (estimated)

**Collector Provides**:
- ✅ `usage.totalTokens` in response messages (when available)
- ✅ `usage.promptTokens` and `usage.completionTokens` in response messages
- ✅ Estimated `tokenCount` in both request and response

**Billing Calculation**:
```go
// Use accurate counts from usage field
if respData.Usage != nil && respData.Usage.TotalTokens > 0 {
    totalTokens = respData.Usage.TotalTokens
    promptTokens = respData.Usage.PromptTokens
    completionTokens = respData.Usage.CompletionTokens
} else if respData.Usage != nil {
    // Fallback to sum if total missing
    totalTokens = respData.Usage.PromptTokens + respData.Usage.CompletionTokens
} else {
    // Last resort: use estimated counts
    totalTokens = reqData.TokenCount + respData.TokenCount
}

// Calculate cost
cost = calculateCost(model, promptTokens, completionTokens, pricingTable)
```

---

## Database Schema Alignment

### PRD Schema (Updated)

The PRD now includes:
- ✅ Combined request + response data in single record
- ✅ Both request and response timestamps
- ✅ Accurate token counts from `usage` field
- ✅ Estimated token counts as fallback
- ✅ Status field to track complete vs incomplete records
- ✅ Fields for assistant type, document ID, conversation ID (after enhancements)

### MongoDB Collection

**Collection Name**: `token_consumption`

**Key Fields**:
- `requestId` (unique index)
- `userId`, `organizationId` (indexed)
- `assistantType` (indexed, after enhancement)
- `documentId`, `conversationId` (indexed, after enhancement)
- `promptTokens`, `completionTokens`, `totalTokens` (from usage field)
- `cost` (calculated)
- `status` ("complete", "request-only", "response-only")

---

## Implementation Checklist

### Phase 1: Collector Enhancements (Required First)
- [ ] Add `assistantType` field to collector structs
- [ ] Add `documentId` field to collector structs
- [ ] Add `conversationId` field to collector structs
- [ ] Update `CollectRequest` to extract and include new fields
- [ ] Update `CollectResponse` to extract and include new fields
- [ ] Update `WrappedAgentService` to pass context
- [ ] Test enhanced collector with all document types

### Phase 2: Consumer Service (Management Dashboard)
- [ ] Create RabbitMQ consumer service
- [ ] Set up two queues (request and response)
- [ ] Implement request-response matching logic
- [ ] Implement orphaned message handling
- [ ] Store combined records in MongoDB
- [ ] Update real-time counters in Redis

### Phase 3: Billing Integration
- [ ] Implement cost calculation using accurate token counts
- [ ] Create daily billing job
- [ ] Implement wallet deduction logic
- [ ] Handle incomplete records (don't bill)

### Phase 4: Dashboard Implementation
- [ ] Build consumption tracking UI
- [ ] Build billing dashboard
- [ ] Build analytics and reporting
- [ ] Integrate Stripe for top-ups

---

## Testing Requirements

### Collector Testing
1. Verify assistant type is captured for each document type
2. Verify document ID is captured when present
3. Verify conversation ID is captured when present
4. Verify RabbitMQ messages include all fields
5. Verify request-response linking works correctly

### Consumer Testing
1. Test request-response matching
2. Test orphaned message handling
3. Test cost calculation accuracy
4. Test database storage
5. Test Redis caching

### Billing Testing
1. Test daily billing job
2. Test wallet deduction
3. Test incomplete record handling
4. Test cost calculation with various scenarios
5. Test edge cases (missing usage field, etc.)

---

## Conclusion

✅ **PRD is now aligned with collector implementation**

The PRD accurately reflects:
- Dual-message architecture (request + response)
- Actual data structures from collector
- Token counting priority (usage field first)
- Consumer service requirements

⚠️ **Collector enhancements required**:
- Assistant type, document ID, conversation ID need to be added
- See `COLLECTOR_ENHANCEMENTS.md` for implementation guide

📋 **Next Steps**:
1. Implement collector enhancements (Phase 1)
2. Build consumer service (Phase 2)
3. Implement billing system (Phase 3)
4. Build dashboard UI (Phase 4)

---

**Last Updated**: 2024-12-XX  
**Status**: PRD Aligned, Collector Enhancements Required

