# Docker Setup - Quick Reference

## Files Created

1. **`docker-compose.yml`** - Main Docker Compose configuration
2. **`server/Dockerfile`** - Multi-stage build for Go server
3. **`Makefile`** - Convenient commands for Docker operations
4. **`docker-start.sh`** - Quick start script

## Quick Start

### Option 1: Using Makefile
```bash
make up          # Start all services
make logs        # View logs
make down        # Stop services
```

### Option 2: Using Docker Compose
```bash
docker-compose up -d        # Start all services
docker-compose logs -f      # View logs
docker-compose down         # Stop services
```

### Option 3: Using Quick Start Script
```bash
./docker-start.sh
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| **Server** | 8080 | Management API server |
| **MongoDB** | 27017 | Database |
| **Redis** | 6379 | Cache and real-time counters |
| **RabbitMQ** | 5672 | AMQP message broker |
| **RabbitMQ UI** | 15672 | Management interface (guest/guest) |

## Environment Variables

Services are configured with defaults. Override using `.env` file or environment variables:

```bash
# Create .env file
cp .env.docker.example .env
# Edit .env with your values
```

## Useful Commands

```bash
# View logs
make logs-server      # Server logs only
make logs-rabbitmq    # RabbitMQ logs only

# Access services
make shell-mongodb    # MongoDB shell
make shell-redis      # Redis CLI
make shell-server     # Server container shell

# Rebuild server
make rebuild          # Rebuild and restart server

# Clean everything
make clean            # Stop and remove all data
```

## Health Checks

All services include health checks. The server waits for dependencies to be healthy before starting.

## Data Persistence

Data is stored in Docker volumes:
- `mongodb_data` - MongoDB database
- `redis_data` - Redis persistence
- `rabbitmq_data` - RabbitMQ data and config

## Network

All services are on the `freedom-ai-network` bridge network and can communicate using service names:
- `mongodb:27017`
- `redis:6379`
- `rabbitmq:5672`

