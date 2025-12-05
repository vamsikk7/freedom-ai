# Freedom AI Management Dashboard

A comprehensive management and billing platform for Freedom AI, built with Go (server) and Next.js (client).

## Project Structure

```
management/
├── server/          # Go backend service
│   ├── internal/
│   │   ├── config/      # Configuration
│   │   ├── database/    # MongoDB connection
│   │   ├── redis/       # Redis client
│   │   ├── models/      # Data models
│   │   ├── handlers/    # HTTP handlers
│   │   ├── services/    # Business logic
│   │   ├── rabbitmq/    # RabbitMQ consumer
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Middleware
│   │   └── lib/         # Utilities
│   └── main.go
└── client/          # Next.js frontend
    ├── src/
    │   ├── app/         # Next.js app router
    │   └── lib/          # Utilities and API client
    └── package.json
```

## Features

- **Multi-Tenant Management**: Manage all tenants and organizations
- **Token Consumption Tracking**: Real-time and historical token usage tracking
- **Billing & Wallet System**: Stripe integration for wallet top-ups and automated daily billing
- **Access Control**: Role-based permissions (Developer, Tenant Admin, Tenant User)
- **Analytics & Reporting**: Consumption rates, monthly reports, and project-level analytics

## Server Setup

### Prerequisites

- Go 1.24.1 or later
- MongoDB
- Redis
- RabbitMQ

### Configuration

1. Copy `.env.example` to `.env` in the `server` directory:

```bash
cd management/server
cp .env.example .env
```

2. Update the `.env` file with your configuration:

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=freedom_ai_management
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
SUPER_ADMIN_EMAIL=admin@freedom-ai.com
SUPER_ADMIN_PASSWORD=changeme123
```

### Running the Server

```bash
cd management/server
go mod download
go run main.go
```

The server will start on port 8080 by default.

## Client Setup

### Prerequisites

- Node.js 18+ and npm

### Configuration

1. Copy `.env.example` to `.env.local`:

```bash
cd management/client
cp .env.example .env.local
```

2. Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Running the Client

```bash
cd management/client
npm install
npm run dev
```

The client will start on http://localhost:3000

## API Endpoints

### Tenant Management

- `GET /api/v1/admin/tenants` - List all tenants
- `GET /api/v1/admin/tenants/:id` - Get tenant details
- `POST /api/v1/admin/tenants` - Create tenant
- `PUT /api/v1/admin/tenants/:id` - Update tenant
- `DELETE /api/v1/admin/tenants/:id` - Deactivate tenant

### Consumption

- `GET /api/v1/consumption/history` - Get consumption history
- `GET /api/v1/consumption/by-assistant` - Consumption by assistant
- `GET /api/v1/consumption/by-user` - Consumption by user

### Billing

- `GET /api/v1/billing/wallet` - Get wallet balance
- `GET /api/v1/billing/history` - Get billing history
- `POST /api/v1/billing/top-up` - Create top-up transaction

## RabbitMQ Consumer

The server consumes token consumption data from RabbitMQ:

- **Exchange**: `llm-events` (topic)
- **Request Queue**: `llm-consumption-requests` (routing key: `llm.request`)
- **Response Queue**: `llm-consumption-responses` (routing key: `llm.response`)

The consumer matches requests and responses by `requestId` and stores complete consumption records in MongoDB.

## Scheduled Jobs

- **Daily Billing**: Runs at 00:00 UTC to process daily consumption and deduct from wallets
- **Daily Aggregation**: Pre-calculates daily consumption aggregates
- **Monthly Aggregation**: Pre-calculates monthly consumption aggregates

## Database Collections

- `organizations` - Tenant/organization data
- `token_consumption` - Individual consumption records
- `billing_history` - Daily billing records
- `top_up_transactions` - Wallet top-up transactions
- `daily_consumption` - Daily aggregated consumption
- `monthly_consumption` - Monthly aggregated consumption

## Development

### Server Development

```bash
cd management/server
go run main.go
```

### Client Development

```bash
cd management/client
npm run dev
```

## Production Deployment

### Server

Build the server:

```bash
cd management/server
go build -o management-server main.go
```

Run with environment variables:

```bash
./management-server
```

### Client

Build the client:

```bash
cd management/client
npm run build
npm start
```

## Environment Variables

See `.env.example` files in both `server` and `client` directories for all available configuration options.

## License

Proprietary - Freedom AI

