# Freedom AI Management Dashboard - Product Requirements Document

## Document Information

**Version**: 1.1  
**Date**: 2024-12-XX  
**Status**: Draft - Updated to align with Collector Implementation  
**Author**: Product Team  
**Stakeholders**: Engineering, Product, Finance, Operations

**Related Documents**:
- `COLLECTOR_ENHANCEMENTS.md` - Required changes to collector for full dashboard support

---

## Executive Summary

The Freedom AI Management Dashboard is a comprehensive administrative and billing platform designed to manage tenants (customers), users, access control, token consumption tracking, and billing. The system supports two primary user roles: **Developers** (who manage all tenants) and **Tenants** (customers who manage their own users and consumption).

### Key Features

1. **Multi-Tenant Management**: Developers can manage all tenants; tenants manage their users
2. **Token Consumption Tracking**: Real-time and historical token usage by user, organization, and assistant
3. **Billing & Wallet System**: Stripe integration for wallet top-ups and automated daily billing
4. **Access Control**: Role-based permissions for developers, tenant admins, and users
5. **Analytics & Reporting**: Consumption rates, monthly reports, and project-level analytics

---

## 1. User Roles & Permissions

### 1.1 Developer Role (Super Admin)

**Capabilities**:
- View and manage all tenants
- Create, edit, and deactivate tenants
- View all users across all tenants
- Access global analytics and consumption data
- Manage billing settings and pricing
- View system-wide token consumption
- Export reports for all tenants

**Access Level**: System-wide, unrestricted

### 1.2 Tenant Admin Role

**Capabilities**:
- Manage users within their organization
- View organization-wide consumption and billing
- Top up organization wallet via Stripe
- View consumption by user and assistant
- Manage user roles and permissions
- Export organization reports
- Set consumption limits and budgets

**Access Level**: Organization-scoped

### 1.3 Tenant User Role

**Capabilities**:
- View own consumption history
- View own token usage by assistant
- View personal usage statistics
- No billing or user management access

**Access Level**: User-scoped

---

## 2. Dashboard Architecture

### 2.1 Developer Dashboard

**Purpose**: Centralized management for Freedom AI developers to oversee all tenants and system operations.

**Key Sections**:

#### 2.1.1 Tenant Management
- **Tenant List View**
  - Table with columns: Tenant Name, Organization ID, User Count, Active Users, Total Consumption (tokens), Wallet Balance, Status, Created Date
  - Filters: Status (Active/Inactive), Date Range, Consumption Range
  - Search: By tenant name, organization ID
  - Actions: View Details, Edit, Deactivate/Activate, View Users, View Consumption

- **Tenant Details Page**
  - Tenant Information: Name, Organization ID, Contact Email, Billing Email, Status
  - User Management: List of all users, ability to add/edit/remove users
  - Consumption Overview: Total tokens, by assistant, by user, time period
  - Billing History: All transactions, wallet top-ups, deductions
  - Settings: Consumption limits, feature flags, API access

- **Create/Edit Tenant**
  - Form fields: Tenant Name, Organization ID, Contact Email, Billing Email, Initial Wallet Balance, Status
  - Validation: Unique organization ID, valid email format
  - Auto-generate organization ID if not provided

#### 2.1.2 Global Analytics
- **System Overview**
  - Total Tenants (Active/Inactive)
  - Total Users (Active/Inactive)
  - Total Token Consumption (Today/This Month/All Time)
  - Total Revenue (Today/This Month/All Time)
  - Average Consumption per Tenant
  - Top 10 Tenants by Consumption

- **Consumption Analytics**
  - Token consumption by assistant (pie chart)
  - Consumption trends over time (line chart)
  - Consumption by tenant (bar chart)
  - Peak usage times (heatmap)
  - Filters: Date range, assistant type, tenant

- **Revenue Analytics**
  - Revenue trends over time
  - Revenue by tenant
  - Top-up frequency and amounts
  - Billing deductions by day

#### 2.1.3 User Management (Cross-Tenant)
- View all users across all tenants
- Filter by tenant, role, status
- Search by email, user ID
- View user consumption history
- Export user data

### 2.2 Tenant Dashboard

**Purpose**: Self-service management for tenant administrators to manage their organization, users, and monitor consumption.

**Key Sections**:

#### 2.2.1 Organization Overview
- **Dashboard Home**
  - Active Users Count
  - Total Token Consumption (Today/This Month/All Time)
  - Wallet Balance
  - Consumption by Assistant (pie chart)
  - Recent Activity Feed
  - Quick Actions: Top Up Wallet, Add User, View Reports

- **Consumption Summary**
  - Total tokens consumed this month
  - Tokens consumed today
  - Projected monthly consumption (based on current rate)
  - Consumption breakdown by assistant
  - Top users by consumption

#### 2.2.2 User Management
- **User List View**
  - Table: Name, Email, Role, Status, Consumption (This Month), Last Active
  - Filters: Role, Status, Date Range
  - Search: By name, email
  - Actions: View Details, Edit, Deactivate, View Consumption

- **User Details Page**
  - User Information: Name, Email, Role, Status, Created Date, Last Active
  - Consumption History: Token usage over time, by assistant
  - Activity Log: Recent actions, API calls
  - Permissions: Current role and permissions

- **Add/Edit User**
  - Form: Name, Email, Role (User/Admin), Initial Permissions
  - Email invitation sent automatically
  - Validation: Unique email within organization

#### 2.2.3 Consumption & Billing
- **Consumption History**
  - Table: Date, Assistant, User, Tokens Used, Cost, Request ID
  - Filters: Date Range, Assistant, User, Min/Max Tokens
  - Export: CSV, JSON
  - Grouping: By Date, By Assistant, By User

- **Billing Dashboard**
  - Current Wallet Balance
  - Monthly Spending: Current month, previous months
  - Top-Up History: Date, Amount, Payment Method, Status
  - Billing History: Daily deductions, date, amount, token count
  - Projected Monthly Cost: Based on current consumption rate
  - Low Balance Alerts: Threshold configuration

- **Wallet Management**
  - Current Balance Display
  - Top-Up Button (Stripe Integration)
  - Auto-Top-Up Settings: Enable/Disable, Threshold, Amount
  - Billing Alerts: Email notifications for low balance

#### 2.2.4 Reports & Analytics
- **Monthly Consumption Report**
  - Total tokens consumed
  - Breakdown by assistant
  - Breakdown by user
  - Cost breakdown
  - Comparison with previous month
  - Export: PDF, CSV

- **Project Consumption Rates**
  - Consumption by project/document (if applicable)
  - Monthly trends
  - Top projects by consumption
  - Cost per project

- **Usage Patterns**
  - Peak usage times
  - Usage by day of week
  - Usage by assistant type
  - User activity patterns

---

## 3. Token Consumption Tracking

### 3.1 Data Collection

**Source**: RabbitMQ Collector (Producer Side)

**Architecture**: The collector publishes **TWO separate messages** for each LLM interaction:
1. **Request Message** (`llm.request` routing key) - Published when LLM request is made
2. **Response Message** (`llm.response` routing key) - Published when LLM response is received

**Request-Response Linking**: Both messages share the same `requestId` (UUID) to enable matching.

#### 3.1.1 Request Message Format

**Routing Key**: `llm.request`  
**Exchange**: `llm-events` (topic exchange)

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-12-XXT10:30:00Z",
  "userId": "user_abc123",
  "organizationId": "org_xyz789",
  "model": "google/gemini-2.5-pro",
  "messages": [...],
  "systemPrompt": "...",
  "tools": [...],
  "characterCount": 1234,
  "tokenCount": 308,
  "requestType": "stream",
  "toolCount": 2,
  "messageCount": 5,
  "temperature": 0.7,
  "maxTokens": 2000,
  "topP": 1.0
}
```

**Note**: `tokenCount` in request is an **estimate**. Actual token counts come from the response message.

#### 3.1.2 Response Message Format

**Routing Key**: `llm.response`  
**Exchange**: `llm-events` (topic exchange)

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-12-XXT10:30:05Z",
  "userId": "user_abc123",
  "organizationId": "org_xyz789",
  "model": "google/gemini-2.5-pro",
  "response": "...",
  "characterCount": 567,
  "tokenCount": 142,
  "finishReason": "stop",
  "usage": {
    "promptTokens": 308,
    "completionTokens": 142,
    "totalTokens": 450
  },
  "responseTimeMs": 5234,
  "hasToolCalls": true,
  "toolCallCount": 2
}
```

**Important**: The `usage` field contains **accurate token counts** from the LLM provider. Use these for billing calculations, not the estimated `tokenCount`.

#### 3.1.3 Enhanced Data (After Collector Updates)

**Note**: The current collector implementation does not capture assistant type, document ID, or conversation ID. These fields need to be added to the collector (see `COLLECTOR_ENHANCEMENTS.md` for implementation details).

Once enhanced, messages will include:
- `assistantType`: "word", "excel", "powerpoint", "onenote", "onedrive", "teams", "outlook"
- `documentId`: Document ID from request context
- `conversationId`: Conversation ID from request body

**See**: `freedom-ai/COLLECTOR_ENHANCEMENTS.md` for detailed implementation guide and code changes required.

### 3.2 Real-Time Processing

**Consumer Service Architecture**:

The consumer service needs to handle **TWO separate queues**:
1. **Request Queue**: Consumes `llm.request` routing key
2. **Response Queue**: Consumes `llm.response` routing key

**Processing Flow**:
1. **Request Message Processing**:
   - Consume from `llm.request` queue
   - Store request data temporarily (Redis cache with TTL)
   - Extract assistant type, document ID, conversation ID
   - Wait for corresponding response

2. **Response Message Processing**:
   - Consume from `llm.response` queue
   - Match with request using `requestId`
   - Combine request and response data
   - Calculate cost using accurate token counts from `usage` field
   - Store complete record in MongoDB
   - Update real-time counters in Redis

3. **Orphaned Messages**:
   - If response arrives without request: Store response-only record
   - If request exists but no response after timeout: Store request-only record (mark as incomplete)
   - Cleanup: Remove cached requests older than 1 hour

**RabbitMQ Queue Setup**:
```go
// Queue declarations
requestQueue := "llm-consumption-requests"
responseQueue := "llm-consumption-responses"

// Bindings
channel.QueueBind(requestQueue, "llm.request", "llm-events", false, nil)
channel.QueueBind(responseQueue, "llm.response", "llm-events", false, nil)
```

**Database Schema** (Combined Request + Response):
```javascript
{
  _id: ObjectId,
  requestId: String (unique),
  timestamp: Date,  // Response timestamp (or request if no response)
  userId: String,
  organizationId: String,
  assistantType: String,  // "word", "excel", "powerpoint", etc.
  documentId: String (optional),
  conversationId: String (optional),
  projectId: String (optional),  // Derived from documentId or conversationId
  model: String,
  
  // Request data
  requestTimestamp: Date,
  requestCharacterCount: Number,
  requestTokenCount: Number,  // Estimated
  requestType: String,  // "stream" or "non-stream"
  toolCount: Number,
  messageCount: Number,
  
  // Response data
  responseTimestamp: Date,
  responseCharacterCount: Number,
  responseTokenCount: Number,  // Estimated
  
  // Accurate token counts (from usage field)
  promptTokens: Number,  // From usage.promptTokens
  completionTokens: Number,  // From usage.completionTokens
  totalTokens: Number,  // From usage.totalTokens (use this for billing)
  
  // Metadata
  finishReason: String,
  responseTimeMs: Number,
  hasToolCalls: Boolean,
  toolCallCount: Number,
  
  // Billing
  cost: Number,  // Calculated from totalTokens and model pricing
  
  // Status
  status: String,  // "complete", "request-only", "response-only", "error"
  
  createdAt: Date,
  indexes: [
    { userId: 1, timestamp: -1 },
    { organizationId: 1, timestamp: -1 },
    { assistantType: 1, timestamp: -1 },
    { documentId: 1, timestamp: -1 },
    { conversationId: 1, timestamp: -1 },
    { projectId: 1, timestamp: -1 },
    { requestId: 1 }  // Unique index
  ]
}
```

**Redis Cache Structure** (for request-response matching):
```
Key: request:{requestId}
Value: JSON string of LLMRequestData
TTL: 3600 seconds (1 hour)
```

### 3.3 Aggregation & Caching

**Daily Aggregations**:
- Pre-calculate daily consumption by user, organization, assistant
- Store in `daily_consumption` collection
- Update at end of each day

**Monthly Aggregations**:
- Pre-calculate monthly consumption
- Store in `monthly_consumption` collection
- Used for reporting and billing

**Redis Caching**:
- Real-time counters: `consumption:org:{orgId}:today`
- Real-time counters: `consumption:user:{userId}:today`
- Cache TTL: 24 hours

---

## 4. Billing System

### 4.1 Wallet System

**Wallet Model**:
- Each organization has a wallet
- Wallet balance stored in MongoDB: `organizations` collection
- Balance updated in real-time
- Minimum balance: $0.00 (can go negative with credit limit)

**Wallet Operations**:
- **Top-Up**: Add funds via Stripe
- **Deduction**: Daily automatic billing
- **Refund**: Manual adjustment (admin only)
- **Credit**: Manual credit (admin only)

### 4.2 Stripe Integration

#### 4.2.1 Top-Up Flow

**User Journey**:
1. Tenant admin clicks "Top Up Wallet"
2. Modal opens with amount input
3. User enters amount (minimum $10, maximum $10,000)
4. Redirects to Stripe Checkout
5. User completes payment
6. Webhook receives payment confirmation
7. Wallet balance updated
8. Transaction recorded in billing history
9. User redirected back to dashboard with success message

**Stripe Configuration**:
- Payment Methods: Credit Card, ACH (optional)
- Currency: USD
- Webhook Endpoint: `/api/v1/billing/stripe/webhook`
- Success URL: `/dashboard/billing?success=true`
- Cancel URL: `/dashboard/billing?canceled=true`

**Backend Implementation**:
```go
// Create Stripe Checkout Session
POST /api/v1/billing/top-up
{
  "amount": 100.00,  // in USD
  "organizationId": "org_xyz"
}

// Webhook Handler
POST /api/v1/billing/stripe/webhook
// Handles: payment_intent.succeeded, payment_intent.failed
```

#### 4.2.2 Auto-Top-Up

**Configuration**:
- Enable/Disable toggle
- Threshold: Wallet balance below this triggers auto-top-up
- Amount: Fixed amount to top up
- Payment Method: Saved payment method required

**Flow**:
1. Daily billing check detects low balance
2. If below threshold and auto-top-up enabled
3. Create Stripe payment intent with saved payment method
4. Process payment
5. Update wallet balance
6. Send email notification

### 4.3 Daily Billing Logic

**Scheduled Job**: Runs daily at 00:00 UTC

**Process**:
1. Query all organizations with consumption in the last 24 hours
   - Query `token_consumption` collection where:
     - `timestamp >= yesterday 00:00 UTC`
     - `timestamp < today 00:00 UTC`
     - `status = "complete"` (only bill for complete requests)
     - `totalTokens > 0` (only bill for actual usage)
   
2. For each organization:
   - Aggregate consumption:
     - Sum `totalTokens` (from usage field, accurate count)
     - Sum `cost` (pre-calculated per record)
     - Group by assistant type for breakdown
     - Group by user for breakdown
   - Deduct total cost from wallet balance
   - Create billing record in `billing_history` collection
   - If balance goes negative and credit limit exceeded:
     - Send low balance alert
     - Optionally disable API access (configurable)
   
3. Handle incomplete records:
   - Records with `status = "request-only"` or `status = "response-only"`:
     - Log for manual review
     - Do NOT bill (wait for complete record)
     - Retry matching after 24 hours
   
4. Send billing summary emails to tenant admins

**Billing Record Schema**:
```javascript
{
  _id: ObjectId,
  organizationId: String,
  billingDate: Date,
  periodStart: Date,
  periodEnd: Date,
  totalTokens: Number,
  totalCost: Number,
  breakdown: {
    byAssistant: {
      "word": { tokens: Number, cost: Number },
      "excel": { tokens: Number, cost: Number },
      // ... other assistants
    },
    byUser: {
      "user_123": { tokens: Number, cost: Number },
      // ... other users
    }
  },
  walletBalanceBefore: Number,
  walletBalanceAfter: Number,
  status: "completed" | "failed" | "pending",
  createdAt: Date
}
```

**Error Handling**:
- If deduction fails (e.g., insufficient balance), mark as "failed"
- Retry logic: Retry failed deductions 3 times with exponential backoff
- Alert administrators of persistent failures

### 4.4 Pricing Model

**Model Pricing Table** (stored in database, configurable):
```javascript
{
  "gpt-4": {
    "requestPricePer1k": 0.03,
    "responsePricePer1k": 0.06
  },
  "gpt-4-turbo": {
    "requestPricePer1k": 0.01,
    "responsePricePer1k": 0.03
  },
  "gpt-3.5-turbo": {
    "requestPricePer1k": 0.0015,
    "responsePricePer1k": 0.002
  }
  // ... other models
}
```

**Cost Calculation**:
```
// Use accurate token counts from usage field (not estimates)
promptCost = (usage.promptTokens / 1000) * requestPricePer1k
completionCost = (usage.completionTokens / 1000) * responsePricePer1k
totalCost = promptCost + completionCost

// If usage field is not available, fall back to estimated tokenCount
if usage.totalTokens == 0 {
  // Use estimated tokenCount from request/response
  estimatedCost = (estimatedTotalTokens / 1000) * averagePricePer1k
}
```

**Priority Order for Token Counts**:
1. **Primary**: `usage.totalTokens` from response message (most accurate)
2. **Fallback**: `usage.promptTokens + usage.completionTokens` (if totalTokens missing)
3. **Last Resort**: `requestTokenCount + responseTokenCount` (estimated, less accurate)

**Markup** (optional, configurable per tenant):
- Base cost from model pricing
- Markup percentage (e.g., 20%)
- Final cost = baseCost * (1 + markupPercentage)

---

## 5. Project Consumption Rates

### 5.1 Project Identification

**Projects** are identified by:
- Document ID (primary)
- Conversation ID (secondary)
- Custom project tags (optional, set by tenant admin)

**Project Model**:
```javascript
{
  _id: ObjectId,
  organizationId: String,
  projectId: String,  // Can be documentId or custom ID
  projectName: String,
  createdBy: String (userId),
  createdAt: Date,
  tags: [String],
  metadata: Object
}
```

### 5.2 Monthly Consumption Tracking

**Monthly Project Consumption**:
- Aggregate consumption by project for each month
- Store in `project_consumption_monthly` collection
- Updated daily via scheduled job

**Schema**:
```javascript
{
  _id: ObjectId,
  organizationId: String,
  projectId: String,
  month: String,  // "2024-12"
  totalTokens: Number,
  totalCost: Number,
  requestCount: Number,
  breakdown: {
    byAssistant: {
      "word": { tokens: Number, cost: Number, requests: Number },
      // ... other assistants
    },
    byUser: {
      "user_123": { tokens: Number, cost: Number, requests: Number },
      // ... other users
    }
  },
  updatedAt: Date
}
```

### 5.3 Dashboard Display

**Monthly Project Consumption View**:
- Table: Project Name, Total Tokens, Total Cost, Requests, Top Assistant, Top User
- Filters: Month, Assistant, User, Min/Max Cost
- Charts:
  - Bar chart: Top 10 projects by consumption
  - Line chart: Consumption trend over months
  - Pie chart: Consumption by assistant for selected project

**Project Details Page**:
- Project information
- Monthly consumption history (last 12 months)
- Consumption by assistant
- Consumption by user
- Daily consumption chart
- Export: CSV, JSON

---

## 6. API Endpoints

### 6.1 Developer Endpoints

```
GET    /api/v1/admin/tenants                    # List all tenants
GET    /api/v1/admin/tenants/:id                # Get tenant details
POST   /api/v1/admin/tenants                    # Create tenant
PUT    /api/v1/admin/tenants/:id                # Update tenant
DELETE /api/v1/admin/tenants/:id                # Deactivate tenant
GET    /api/v1/admin/tenants/:id/users          # Get tenant users
GET    /api/v1/admin/analytics/consumption      # Global consumption analytics
GET    /api/v1/admin/analytics/revenue          # Revenue analytics
GET    /api/v1/admin/reports/export             # Export global reports
```

### 6.2 Tenant Admin Endpoints

```
GET    /api/v1/organization/users               # List organization users
GET    /api/v1/organization/users/:id           # Get user details
POST   /api/v1/organization/users                # Create user
PUT    /api/v1/organization/users/:id            # Update user
DELETE /api/v1/organization/users/:id           # Deactivate user
GET    /api/v1/organization/consumption          # Organization consumption
GET    /api/v1/organization/consumption/history  # Consumption history
GET    /api/v1/organization/billing              # Billing information
GET    /api/v1/organization/billing/history      # Billing history
POST   /api/v1/organization/billing/top-up      # Initiate top-up
GET    /api/v1/organization/projects             # List projects
GET    /api/v1/organization/projects/:id         # Project details
GET    /api/v1/organization/reports/monthly      # Monthly report
```

### 6.3 Billing Endpoints

```
POST   /api/v1/billing/top-up                   # Create top-up session
GET    /api/v1/billing/wallet                   # Get wallet balance
POST   /api/v1/billing/stripe/webhook           # Stripe webhook
GET    /api/v1/billing/history                  # Billing history
POST   /api/v1/billing/auto-top-up              # Configure auto-top-up
```

### 6.4 Consumption Endpoints

```
GET    /api/v1/consumption/real-time            # Real-time consumption
GET    /api/v1/consumption/history              # Consumption history
GET    /api/v1/consumption/aggregate             # Aggregated consumption
GET    /api/v1/consumption/by-assistant          # Consumption by assistant
GET    /api/v1/consumption/by-user               # Consumption by user
GET    /api/v1/consumption/by-project            # Consumption by project
```

---

## 7. Database Schema

### 7.1 Collections

**organizations**:
```javascript
{
  _id: ObjectId,
  orgId: String (unique),  // SuperTokens tenant ID
  name: String,
  contactEmail: String,
  billingEmail: String,
  walletBalance: Number (default: 0),
  creditLimit: Number (default: 0),
  autoTopUp: {
    enabled: Boolean,
    threshold: Number,
    amount: Number,
    paymentMethodId: String
  },
  consumptionLimits: {
    monthlyLimit: Number,
    dailyLimit: Number,
    perUserLimit: Number
  },
  status: "active" | "inactive" | "suspended",
  createdAt: Date,
  updatedAt: Date
}
```

**token_consumption**:
```javascript
{
  _id: ObjectId,
  requestId: String (unique),
  timestamp: Date,
  userId: String,
  organizationId: String,
  assistantType: String,
  documentId: String,
  projectId: String,
  model: String,
  requestTokens: Number,
  responseTokens: Number,
  totalTokens: Number,
  cost: Number,
  metadata: Object,
  createdAt: Date,
  indexes: [
    { userId: 1, timestamp: -1 },
    { organizationId: 1, timestamp: -1 },
    { assistantType: 1, timestamp: -1 },
    { projectId: 1, timestamp: -1 }
  ]
}
```

**billing_history**:
```javascript
{
  _id: ObjectId,
  organizationId: String,
  billingDate: Date,
  periodStart: Date,
  periodEnd: Date,
  totalTokens: Number,
  totalCost: Number,
  breakdown: Object,
  walletBalanceBefore: Number,
  walletBalanceAfter: Number,
  status: String,
  createdAt: Date,
  indexes: [
    { organizationId: 1, billingDate: -1 }
  ]
}
```

**projects**:
```javascript
{
  _id: ObjectId,
  organizationId: String,
  projectId: String,
  projectName: String,
  createdBy: String,
  tags: [String],
  metadata: Object,
  createdAt: Date,
  updatedAt: Date,
  indexes: [
    { organizationId: 1, projectId: 1 }
  ]
}
```

**daily_consumption**:
```javascript
{
  _id: ObjectId,
  organizationId: String,
  date: Date,
  totalTokens: Number,
  totalCost: Number,
  breakdown: {
    byAssistant: Object,
    byUser: Object
  },
  createdAt: Date,
  indexes: [
    { organizationId: 1, date: -1 }
  ]
}
```

**monthly_consumption**:
```javascript
{
  _id: ObjectId,
  organizationId: String,
  month: String,  // "2024-12"
  totalTokens: Number,
  totalCost: Number,
  breakdown: {
    byAssistant: Object,
    byUser: Object,
    byProject: Object
  },
  createdAt: Date,
  updatedAt: Date,
  indexes: [
    { organizationId: 1, month: -1 }
  ]
}
```

**project_consumption_monthly**:
```javascript
{
  _id: ObjectId,
  organizationId: String,
  projectId: String,
  month: String,
  totalTokens: Number,
  totalCost: Number,
  requestCount: Number,
  breakdown: Object,
  updatedAt: Date,
  indexes: [
    { organizationId: 1, projectId: 1, month: -1 }
  ]
}
```

---

## 8. Scheduled Jobs

### 8.1 Daily Billing Job

**Schedule**: Every day at 00:00 UTC  
**Purpose**: Calculate and deduct daily consumption costs

**Process**:
1. Get all organizations with consumption in last 24 hours
2. For each organization:
   - Aggregate consumption from `token_consumption` collection
   - Calculate total cost
   - Deduct from wallet
   - Create billing record
   - Check for low balance alerts
3. Send billing summary emails

**Error Handling**:
- Retry failed deductions
- Log errors for manual review
- Alert administrators

### 8.2 Daily Aggregation Job

**Schedule**: Every day at 01:00 UTC  
**Purpose**: Pre-calculate daily consumption aggregates

**Process**:
1. For each organization:
   - Aggregate yesterday's consumption
   - Store in `daily_consumption` collection
   - Update monthly aggregates

### 8.3 Monthly Aggregation Job

**Schedule**: First day of each month at 02:00 UTC  
**Purpose**: Pre-calculate monthly consumption aggregates

**Process**:
1. For each organization:
   - Aggregate previous month's consumption
   - Store in `monthly_consumption` collection
   - Calculate project consumption
   - Store in `project_consumption_monthly` collection
   - Generate monthly reports

### 8.4 Auto-Top-Up Job

**Schedule**: Every 6 hours  
**Purpose**: Check and process auto-top-ups

**Process**:
1. Get all organizations with auto-top-up enabled
2. Check wallet balance against threshold
3. If below threshold:
   - Create Stripe payment intent
   - Process payment
   - Update wallet balance
   - Send notification

---

## 9. Security & Access Control

### 9.1 Authentication

- All endpoints require SuperTokens authentication
- Role-based access control (RBAC)
- Organization-scoped data access

### 9.2 Authorization

**Developer Role**:
- Can access all endpoints
- No organization scope restrictions

**Tenant Admin Role**:
- Can only access their organization's data
- Cannot access other organizations' data
- Can manage users within their organization

**Tenant User Role**:
- Can only view their own consumption data
- Cannot access billing or user management

### 9.3 Data Isolation

- All queries filtered by `organizationId`
- Database indexes ensure efficient filtering
- API middleware enforces organization scope

---

## 10. User Interface Specifications

### 10.1 Design Principles

- **Clean & Modern**: Material Design or similar
- **Responsive**: Mobile, tablet, desktop support
- **Accessible**: WCAG 2.1 AA compliance
- **Fast**: Optimistic UI updates, lazy loading
- **Intuitive**: Clear navigation, helpful tooltips

### 10.2 Key UI Components

**Dashboard Cards**:
- Wallet balance card (with top-up button)
- Consumption summary cards
- Quick stats cards

**Data Tables**:
- Sortable columns
- Pagination
- Filters
- Export functionality
- Row selection

**Charts**:
- Line charts for trends
- Bar charts for comparisons
- Pie charts for distributions
- Heatmaps for patterns

**Modals**:
- Top-up wallet modal
- Add/edit user modal
- Confirmation dialogs

### 10.3 Technology Stack

**Frontend**:
- React with TypeScript
- TanStack Query for data fetching
- Recharts or Chart.js for charts
- Tailwind CSS for styling
- React Router for navigation

**Backend**:
- Go (Gin framework)
- MongoDB for data storage
- Redis for caching
- RabbitMQ for message queue
- Stripe API for payments

---

## 11. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Database schema setup
- Basic authentication and authorization
- Developer dashboard (tenant list, basic CRUD)
- Token consumption collection from RabbitMQ

### Phase 2: Consumption Tracking (Weeks 3-4)
- Real-time consumption tracking
- Consumption history API
- Basic consumption dashboard
- Daily aggregation jobs

### Phase 3: Billing System (Weeks 5-6)
- Wallet system implementation
- Stripe integration
- Top-up flow
- Daily billing job
- Billing history

### Phase 4: Tenant Dashboard (Weeks 7-8)
- Tenant admin dashboard
- User management
- Consumption views
- Billing dashboard

### Phase 5: Analytics & Reporting (Weeks 9-10)
- Analytics dashboards
- Monthly reports
- Project consumption tracking
- Export functionality

### Phase 6: Advanced Features (Weeks 11-12)
- Auto-top-up
- Consumption limits
- Advanced filters
- Email notifications
- Performance optimization

---

## 12. Success Metrics

### 12.1 Adoption Metrics
- Number of tenants using the dashboard
- Daily active users (developers + tenant admins)
- Feature usage rates

### 12.2 Performance Metrics
- Dashboard load time < 2 seconds
- API response time < 500ms (p95)
- Real-time consumption update latency < 5 seconds

### 12.3 Business Metrics
- Top-up conversion rate
- Average top-up amount
- Billing accuracy (100% target)
- Customer satisfaction score

---

## 13. Future Enhancements

1. **Advanced Analytics**
   - Predictive consumption forecasting
   - Anomaly detection
   - Cost optimization recommendations

2. **Multi-Currency Support**
   - Support for multiple currencies
   - Currency conversion
   - Regional pricing

3. **Enterprise Features**
   - Custom billing contracts
   - Volume discounts
   - Dedicated support tiers

4. **API Access**
   - REST API for consumption data
   - Webhooks for billing events
   - GraphQL API (optional)

5. **Mobile App**
   - Native mobile apps
   - Push notifications
   - Mobile-optimized views

---

## 14. Appendix

### 14.1 Glossary

- **Tenant**: A customer organization using Freedom AI
- **Developer**: Freedom AI team member managing the platform
- **Token**: Unit of LLM consumption (input + output tokens)
- **Wallet**: Prepaid balance for billing consumption
- **Project**: Grouping of related documents/conversations

### 14.2 References

- Stripe API Documentation
- SuperTokens Documentation
- RabbitMQ Best Practices
- MongoDB Aggregation Framework

---

**Document Status**: Ready for Review  
**Next Steps**: Technical design review, architecture approval, sprint planning

