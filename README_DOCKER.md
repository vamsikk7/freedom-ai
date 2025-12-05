# Docker Setup for Freedom AI Management Dashboard

This directory contains Docker Compose configuration for running the management dashboard server with all required services.

## Prerequisites

- Docker Desktop or Docker Engine installed
- Docker Compose v2.0+

## Services Included

1. **MongoDB** - Database for storing consumption data, billing history, and user information
2. **Redis** - Cache and real-time counter storage
3. **RabbitMQ** - Message broker for consuming LLM consumption events
4. **Management Server** - Go application serving the API

## Quick Start

### 1. Start All Services

```bash
docker-compose up -d
```

This will:
- Pull required images (MongoDB, Redis, RabbitMQ)
- Build the Go server application
- Start all services in the background
- Create persistent volumes for data

### 2. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f rabbitmq
```

### 3. Stop Services

```bash
docker-compose down
```

### 4. Stop and Remove Volumes (Clean Slate)

```bash
docker-compose down -v
```

## Service URLs

- **Management Server API**: http://localhost:8080
- **RabbitMQ Management UI**: http://localhost:15672 (guest/guest)
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## Environment Variables

Create a `.env` file in the root directory to override default values:

```env
# SuperTokens
SUPERTOKENS_CONNECTION_URI=http://your-supertokens-instance:3567
SUPERTOKENS_API_KEY=your-api-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
```

## Building the Server Image

To rebuild the server image:

```bash
docker-compose build server
```

Or rebuild all services:

```bash
docker-compose build
```

## Accessing Services

### MongoDB

```bash
# Connect using mongosh
docker exec -it freedom-ai-mongodb mongosh

# Or from host
mongosh mongodb://localhost:27017/freedom_ai_management
```

### Redis

```bash
# Connect using redis-cli
docker exec -it freedom-ai-redis redis-cli
```

### RabbitMQ Management

1. Open http://localhost:15672
2. Login with: `guest` / `guest`
3. View queues, exchanges, and connections

## Health Checks

All services include health checks. Check service status:

```bash
docker-compose ps
```

## Data Persistence

Data is persisted in Docker volumes:
- `mongodb_data` - MongoDB database files
- `redis_data` - Redis AOF files
- `rabbitmq_data` - RabbitMQ data and configuration

To backup data:

```bash
# Backup MongoDB
docker exec freedom-ai-mongodb mongodump --out /data/backup
docker cp freedom-ai-mongodb:/data/backup ./mongodb-backup

# Backup Redis
docker exec freedom-ai-redis redis-cli SAVE
docker cp freedom-ai-redis:/data/dump.rdb ./redis-backup.rdb
```

## Troubleshooting

### Server won't start

1. Check logs: `docker-compose logs server`
2. Verify dependencies are healthy: `docker-compose ps`
3. Ensure ports are not in use: `lsof -i :8080`

### RabbitMQ connection issues

1. Check RabbitMQ is healthy: `docker-compose ps rabbitmq`
2. Verify connection string in server logs
3. Check RabbitMQ management UI at http://localhost:15672

### MongoDB connection issues

1. Wait for MongoDB to be healthy (health check runs every 10s)
2. Check MongoDB logs: `docker-compose logs mongodb`
3. Verify connection string uses service name: `mongodb://mongodb:27017`

## Development

For development, you can mount the server code as a volume (already configured):

```yaml
volumes:
  - ./server:/app
```

Then rebuild and restart:

```bash
docker-compose restart server
```

## Production Considerations

For production deployment:

1. Use environment-specific `.env` files
2. Set strong passwords for RabbitMQ and MongoDB
3. Enable MongoDB authentication
4. Use external Redis/MongoDB if needed
5. Configure proper CORS origins
6. Set up SSL/TLS for all services
7. Use Docker secrets for sensitive data

