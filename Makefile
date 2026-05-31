.PHONY: help \
        local-setup local-infra-up local-infra-down local-reset-db \
        local-backend local-frontend local-celery local-flower \
        local-migrate local-makemigrations local-superuser \
        local-test local-test-cov local-lint local-format local-shell \
        docker-dev docker-stop docker-build \
        docker-logs docker-logs-backend docker-logs-frontend docker-logs-celery \
        docker-flower docker-ps

LOCAL_DB_URL   ?= postgres://postgres:postgres@localhost:5432/template_db
LOCAL_REDIS_URL ?= redis://localhost:6379/0

help:
	@echo "=== Local (flujo principal) ==="
	@echo "  make local-infra-up       - Levanta postgres + redis en Docker"
	@echo "  make local-infra-down     - Detiene la infra"
	@echo "  make local-setup          - Instala dependencias (primera vez)"
	@echo "  make local-backend        - Django runserver :8000"
	@echo "  make local-frontend       - Next.js dev :3000"
	@echo "  make local-celery         - Celery worker"
	@echo "  make local-flower         - Flower UI :5555"
	@echo "  make local-migrate        - Aplica migraciones"
	@echo "  make local-makemigrations - Crea nuevas migraciones"
	@echo "  make local-superuser      - Crea superusuario"
	@echo "  make local-test           - Corre tests"
	@echo "  make local-test-cov       - Tests con reporte de cobertura"
	@echo "  make local-lint           - ruff + eslint"
	@echo "  make local-format         - Auto-formatea código"
	@echo "  make local-shell          - Django shell"
	@echo "  make local-reset-db       - Resetea la base de datos (DESTRUCTIVO)"
	@echo ""
	@echo "=== Docker (stack completo / CI) ==="
	@echo "  make docker-dev           - Levanta todos los servicios"
	@echo "  make docker-stop          - Detiene todos los servicios"
	@echo "  make docker-build         - Reconstruye imágenes"
	@echo "  make docker-logs          - Sigue todos los logs"
	@echo "  make docker-logs-backend  - Logs del backend"
	@echo "  make docker-logs-frontend - Logs del frontend"
	@echo "  make docker-logs-celery   - Logs de celery"
	@echo "  make docker-ps            - Estado de contenedores"
	@echo "  make docker-flower        - Flower en :5555"

# ── Local ──────────────────────────────────────────────────────────────────────

local-infra-up:
	docker compose -f docker-compose.infra.yml up -d --wait

local-infra-down:
	docker compose -f docker-compose.infra.yml down

local-setup:
	cd backend && uv sync --group dev
	cd frontend && pnpm install
	@test -f frontend/.env.local || (cp frontend/.env.local.example frontend/.env.local && echo "Creado frontend/.env.local — edita NEXTAUTH_SECRET antes de iniciar")

local-backend: export DATABASE_URL = $(LOCAL_DB_URL)
local-backend: export REDIS_URL = $(LOCAL_REDIS_URL)
local-backend:
	cd backend && uv run python manage.py runserver 0.0.0.0:8000

local-frontend:
	cd frontend && pnpm dev

local-celery: export DATABASE_URL = $(LOCAL_DB_URL)
local-celery: export REDIS_URL = $(LOCAL_REDIS_URL)
local-celery:
	cd backend && uv run celery -A config.celery worker --loglevel=info --pool=solo

local-flower: export DATABASE_URL = $(LOCAL_DB_URL)
local-flower: export REDIS_URL = $(LOCAL_REDIS_URL)
local-flower:
	@echo "Flower en http://localhost:5555"
	cd backend && uv run celery -A config.celery flower --port=5555

local-migrate: export DATABASE_URL = $(LOCAL_DB_URL)
local-migrate: export REDIS_URL = $(LOCAL_REDIS_URL)
local-migrate:
	cd backend && uv run python manage.py migrate

local-makemigrations: export DATABASE_URL = $(LOCAL_DB_URL)
local-makemigrations: export REDIS_URL = $(LOCAL_REDIS_URL)
local-makemigrations:
	cd backend && uv run python manage.py makemigrations

local-superuser: export DATABASE_URL = $(LOCAL_DB_URL)
local-superuser: export REDIS_URL = $(LOCAL_REDIS_URL)
local-superuser:
	cd backend && uv run python manage.py createsuperuser

local-test: export DATABASE_URL = $(LOCAL_DB_URL)
local-test: export REDIS_URL = $(LOCAL_REDIS_URL)
local-test:
	cd backend && uv run pytest -v

local-test-cov: export DATABASE_URL = $(LOCAL_DB_URL)
local-test-cov: export REDIS_URL = $(LOCAL_REDIS_URL)
local-test-cov:
	cd backend && uv run pytest --cov=apps --cov-report=html

local-lint:
	cd backend && uv run ruff check . && uv run ruff format --check .
	cd frontend && pnpm lint

local-format:
	cd backend && uv run ruff format .
	cd frontend && pnpm lint --fix

local-shell: export DATABASE_URL = $(LOCAL_DB_URL)
local-shell: export REDIS_URL = $(LOCAL_REDIS_URL)
local-shell:
	cd backend && uv run python manage.py shell

local-reset-db:
	@echo "ADVERTENCIA: Se eliminarán todos los datos. Ctrl+C para cancelar..."
	docker compose -f docker-compose.infra.yml down -v
	$(MAKE) local-infra-up
	$(MAKE) local-migrate
	@echo "Base de datos reseteada."

# ── Docker full stack ──────────────────────────────────────────────────────────

docker-dev:
	docker compose up

docker-stop:
	docker compose down

docker-build:
	docker compose build --no-cache

docker-logs:
	docker compose logs -f

docker-logs-backend:
	docker compose logs -f backend

docker-logs-frontend:
	docker compose logs -f frontend

docker-logs-celery:
	docker compose logs -f celery

docker-ps:
	docker compose ps

docker-flower:
	@echo "Flower en http://localhost:5555"
	docker compose up -d flower
