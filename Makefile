.PHONY: help install dev build test lint typecheck format clean infra-up infra-down infra-logs reset

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install all workspace deps
	pnpm install --frozen-lockfile=false

dev: ## Run all apps in dev mode
	pnpm dev

build: ## Build everything
	pnpm build

test: ## Run unit tests
	pnpm test

lint: ## Lint all packages
	pnpm lint

typecheck: ## TypeScript check
	pnpm typecheck

format: ## Format code
	pnpm format

clean: ## Remove all build artefacts and node_modules
	pnpm clean

infra-up: ## Start Neo4j, Qdrant, Redis (requires Docker)
	docker compose -f infra/docker/docker-compose.yml up -d

infra-down: ## Stop infra
	docker compose -f infra/docker/docker-compose.yml down

infra-logs: ## Tail infra logs
	docker compose -f infra/docker/docker-compose.yml logs -f

reset: clean ## Full wipe (caches, storage, clones)
	rm -rf .helix/ storage/ clones/
