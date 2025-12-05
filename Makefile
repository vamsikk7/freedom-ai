.PHONY: help build up down logs restart clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

logs-server: ## View server logs
	docker-compose logs -f server

logs-rabbitmq: ## View RabbitMQ logs
	docker-compose logs -f rabbitmq

restart: ## Restart all services
	docker-compose restart

restart-server: ## Restart server only
	docker-compose restart server

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v

ps: ## Show running containers
	docker-compose ps

shell-server: ## Open shell in server container
	docker exec -it freedom-ai-server sh

shell-mongodb: ## Open MongoDB shell
	docker exec -it freedom-ai-mongodb mongosh freedom_ai_management

shell-redis: ## Open Redis CLI
	docker exec -it freedom-ai-redis redis-cli

rebuild: ## Rebuild and restart server
	docker-compose build server
	docker-compose up -d server

