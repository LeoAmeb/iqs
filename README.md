# Template Full-Stack

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.1-092E20?style=flat&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-3.15-A30000?style=flat&logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-5.4-37814A?style=flat&logo=celery&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![uv](https://img.shields.io/badge/uv-package%20manager-DE5FE9?style=flat)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?style=flat&logo=pnpm&logoColor=white)

Plantilla de proyecto full-stack lista para producción. Backend Django REST + Frontend Next.js, con autenticación JWT, RBAC, audit log, tareas asíncronas y panel de administración.

---

## Arquitectura

```mermaid
graph TD
    Browser["🌐 Cliente (Browser)"]

    subgraph Frontend["Next.js 15 · :3000"]
        Auth["(auth)/\nlogin · register"]
        Admin["(admin)/\ndashboard · users · roles · audit"]
        FE_Libs["NextAuth.js v5\nTanStack Query\nshadcn/ui · Tailwind v4"]
    end

    subgraph Backend["Django 5 + DRF · :8000"]
        API["api/v1/\nusers · roles · audit · dashboard · auth"]
        Celery["Celery Worker"]
        Gunicorn["Gunicorn (prod)"]
        AuditMW["django-auditlog\nmiddleware"]
    end

    subgraph Infra["Infraestructura"]
        PG[("PostgreSQL 16")]
        Redis[("Redis 7\nBroker · Cache")]
    end

    Browser -->|":3000"| Frontend
    Frontend -->|"HTTP/JSON :8000/api/v1/"| Backend
    Backend --> PG
    Celery -->|"broker"| Redis
    Backend -->|"enqueue tasks"| Celery
```

---

## Stack

| Capa | Tecnología |
|------|-----------|
| **Backend** | Python 3.12 · Django 5.1 · Django REST Framework 3.15 |
| **Auth** | SimpleJWT · dj-rest-auth · django-allauth (Google, GitHub) |
| **Tareas async** | Celery 5.4 · Redis 7 · Flower (monitor) |
| **ORM / DB** | PostgreSQL 16 · psycopg3 |
| **Frontend** | Next.js 15 · React 19 · TypeScript 5 |
| **UI** | shadcn/ui · Radix UI · Tailwind CSS v4 |
| **Estado / Data** | TanStack Query v5 · React Hook Form · Zod |
| **Auth frontend** | NextAuth.js v5 |
| **API schema** | drf-spectacular (Swagger / ReDoc) |
| **Audit** | django-auditlog |
| **Tooling backend** | uv · ruff · pytest · mypy |
| **Tooling frontend** | pnpm · ESLint · TypeScript |
| **Contenedores** | Docker · Docker Compose |

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para la infra local o stack completo)
- [Python 3.12+](https://www.python.org/) + [uv](https://docs.astral.sh/uv/) (para flujo local)
- [Node.js 20+](https://nodejs.org/) + [pnpm](https://pnpm.io/) (para flujo local)
- `make` disponible en el PATH (viene en macOS/Linux; en Windows usar [Git Bash](https://gitforwindows.org/) o [WSL](https://learn.microsoft.com/en-us/windows/wsl/))

---

## Inicio rápido

### 1. Clonar y configurar variables de entorno

```bash
git clone <repo-url> mi-proyecto
cd mi-proyecto
cp .env.example .env
# Editar .env con tus valores (ver sección Variables de entorno)
```

### 2A. Flujo local (recomendado para desarrollo con Claude Code u otros agentes)

La infra (Postgres + Redis) corre en Docker; Django y Next.js corren directamente en el host.

```bash
# Primera vez: instalar dependencias
make local-setup

# Levantar Postgres + Redis
make local-infra-up

# Aplicar migraciones y crear superusuario
make local-migrate
make local-superuser

# En terminales separadas:
make local-backend    # Django en :8000
make local-frontend   # Next.js en :3000
make local-celery     # Worker de Celery
```

### 2B. Flujo Docker completo (CI / demo / staging)

Todos los servicios en contenedores.

```bash
make docker-dev
# Primera vez, en otra terminal:
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

---

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SECRET_KEY` | Clave secreta Django | `django-insecure-...` |
| `JWT_SECRET_KEY` | Clave independiente para firmar JWT | `replace-me-...` |
| `DEBUG` | Modo debug | `True` |
| `ALLOWED_HOSTS` | Hosts permitidos | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Orígenes CORS | `http://localhost:3000` |
| `DATABASE_URL` | URL de conexión a Postgres | `postgres://user:pass@host:5432/db` |
| `REDIS_URL` | URL de conexión a Redis | `redis://localhost:6379/0` |
| `FLOWER_USER` | Usuario de Flower | `admin` |
| `FLOWER_PASSWORD` | Contraseña de Flower | `admin` |
| `GOOGLE_CLIENT_ID` | OAuth Google | (opcional) |
| `GOOGLE_CLIENT_SECRET` | OAuth Google | (opcional) |
| `GITHUB_CLIENT_ID` | OAuth GitHub | (opcional) |
| `GITHUB_CLIENT_SECRET` | OAuth GitHub | (opcional) |
| `NEXTAUTH_URL` | URL pública del frontend | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Clave para NextAuth | `openssl rand -base64 32` |
| `NEXT_PUBLIC_API_URL` | URL pública de la API (browser) | `http://localhost:8000/api/v1` |
| `INTERNAL_API_URL` | URL interna de la API (SSR/Docker) | `http://backend:8000/api/v1` |
| `EMAIL_BACKEND` | Backend de email | `console.EmailBackend` |

---

## Comandos Make

### Flujo local (`local-*`)

| Comando | Descripción |
|---------|-------------|
| `make local-setup` | Instala dependencias de backend (`uv sync`) y frontend (`pnpm install`) |
| `make local-infra-up` | Levanta Postgres + Redis en Docker |
| `make local-infra-down` | Detiene la infra |
| `make local-backend` | Django `runserver` en `:8000` |
| `make local-frontend` | Next.js `dev` en `:3000` |
| `make local-celery` | Celery worker (`--pool=solo` para Windows) |
| `make local-flower` | Flower UI en `:5555` |
| `make local-migrate` | Aplica migraciones pendientes |
| `make local-makemigrations` | Genera nuevas migraciones |
| `make local-superuser` | Crea superusuario de Django |
| `make local-test` | Corre suite de tests con pytest |
| `make local-test-cov` | Tests con reporte de cobertura HTML |
| `make local-lint` | Ruff (backend) + ESLint (frontend) |
| `make local-format` | Auto-formatea backend con `ruff format` |
| `make local-shell` | Django shell interactivo |
| `make local-reset-db` | **Destructivo** — borra volúmenes, re-levanta infra y migra |

### Stack Docker (`docker-*`)

| Comando | Descripción |
|---------|-------------|
| `make docker-dev` | Levanta todos los servicios (`docker compose up`) |
| `make docker-stop` | Detiene todos los servicios |
| `make docker-build` | Reconstruye imágenes sin caché |
| `make docker-logs` | Sigue todos los logs |
| `make docker-logs-backend` | Logs del contenedor backend |
| `make docker-logs-frontend` | Logs del contenedor frontend |
| `make docker-logs-celery` | Logs del worker Celery |
| `make docker-ps` | Estado de los contenedores |
| `make docker-flower` | Levanta Flower en `:5555` |

---

## Estructura del proyecto

```
template/
├── backend/                      # Django API
│   ├── api/
│   │   └── v1/                   # Toda la lógica HTTP va aquí
│   │       ├── urls.py           # Entry point: api/v1/
│   │       ├── users/            # Views · Serializers · URLs · Permisos
│   │       ├── roles/
│   │       ├── audit/
│   │       └── dashboard/
│   ├── apps/                     # Modelos, managers, migraciones, signals
│   │   ├── users/
│   │   ├── roles/
│   │   ├── audit/
│   │   └── dashboard/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── celery.py
│   ├── pyproject.toml            # Dependencias (uv) + configuración ruff/pytest/mypy
│   ├── Dockerfile
│   └── entrypoint.sh
│
├── frontend/                     # Next.js App Router
│   ├── app/
│   │   ├── (auth)/               # Rutas públicas
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── (admin)/              # Rutas protegidas
│   │       ├── dashboard/
│   │       ├── users/
│   │       │   └── [id]/
│   │       ├── roles/
│   │       └── audit/
│   ├── components/
│   │   ├── layout/               # AppSidebar, AdminHeader
│   │   └── ui/                   # Componentes shadcn/ui
│   ├── lib/                      # Clientes API, utils
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml            # Stack completo (dev/CI)
├── docker-compose.infra.yml      # Solo Postgres + Redis (flujo local)
├── Makefile
├── .env.example
└── README.md
```

---

## API Endpoints

Base URL: `http://localhost:8000/api/v1/`

### Autenticación (`auth/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `auth/login/` | Login con email + password. Devuelve access/refresh JWT con claims de rol y permisos |
| `POST` | `auth/logout/` | Invalida el refresh token |
| `POST` | `auth/token/refresh/` | Renueva el access token |
| `POST` | `auth/password/change/` | Cambio de contraseña (autenticado) |
| `POST` | `auth/password/reset/` | Solicitar reset por email |
| `POST` | `auth/password/reset/confirm/` | Confirmar reset con token |
| `POST` | `auth/register/` | Registro de usuario |
| `POST` | `auth/google/` | Login con Google OAuth2 |
| `POST` | `auth/github/` | Login con GitHub OAuth2 |

### Usuarios (`users/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `users/` | Listar usuarios (paginado, filtros, búsqueda) |
| `POST` | `users/` | Crear usuario |
| `GET` | `users/{id}/` | Detalle de usuario |
| `PATCH` | `users/{id}/` | Actualizar usuario |
| `DELETE` | `users/{id}/` | Eliminar usuario |
| `GET` | `users/me/` | Perfil del usuario autenticado con permisos |

### Roles y Permisos (`roles/`, `permissions/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET/POST` | `roles/` | Listar / crear roles |
| `GET/PATCH/DELETE` | `roles/{id}/` | Detalle / actualizar / eliminar rol |
| `GET` | `permissions/` | Listar todos los permisos disponibles |

### Audit Log (`audit/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `audit/` | Listar entradas de auditoría (filtro por usuario, acción, fecha) |
| `GET` | `audit/{id}/` | Detalle de una entrada |

### Dashboard (`dashboard/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `dashboard/stats/` | Estadísticas generales (usuarios, roles, actividad reciente) |
| `POST` | `dashboard/celery-ping/` | Verificar workers de Celery |

**Documentación interactiva:**
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- Schema OpenAPI: `http://localhost:8000/api/schema/`

---

## Autenticación

El sistema usa **JWT con doble token** (access + refresh):

```
Login  →  POST /api/v1/auth/login/
          {email, password}
          ← {access, refresh}   (access dura 5 min; refresh dura 7 días)

Petición autenticada  →  Authorization: Bearer <access_token>

Renovar token  →  POST /api/v1/auth/token/refresh/
                  {refresh}
                  ← {access}
```

El **access token** incluye claims adicionales:
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "is_superuser": false,
  "role": "admin",
  "permissions": ["users.view", "users.edit", "roles.view"]
}
```

Esto permite que el frontend no necesite una llamada extra a `/auth/user/` después del login.

---

## Sistema de permisos (RBAC)

Los permisos son codenames con formato `<recurso>.<acción>` (ej. `users.view`, `roles.edit`).

```
Superuser  →  acceso total (sin verificación de permisos)
   │
   └── Role  →  tiene N permissions (M2M)
                    │
                    └── User  →  tiene 0 o 1 Role
```

**Uso en vistas:**
```python
# Requiere el permiso "users.view"
permission_classes = [require_permission("users.view")]

# Requiere ser admin o superuser
permission_classes = [IsAdminOrSuperuser]
```

**En el frontend**, los permisos llegan en el JWT y se verifican antes de renderizar secciones o llamar endpoints.

---

## Audit Log

Toda creación, actualización y eliminación de usuarios y roles queda registrada automáticamente en `AuditLog` con:

- Usuario que realizó la acción
- Acción (`create` / `update` / `delete`)
- Tipo y ID del recurso afectado
- IP del cliente
- User-agent
- Datos extra (ej. email del usuario afectado)

---

## Tareas asíncronas (Celery)

Celery usa Redis como broker. Para agregar una tarea:

```python
# apps/mi_app/tasks.py
from config.celery import app

@app.task
def mi_tarea(arg):
    ...

# Encolar desde una vista:
mi_tarea.delay(arg)
```

Monitor visual disponible en `http://localhost:5555` (Flower).

---

## Deployment en Railway

### Requisitos en Railway

1. Crear un proyecto nuevo en [railway.app](https://railway.app)
2. Agregar servicios: **PostgreSQL** y **Redis** desde el marketplace
3. Conectar el repositorio de GitHub

### Variables de entorno en Railway

Configurar en el panel de cada servicio:

**Backend:**
```
SECRET_KEY=<genera con: python -c "import secrets; print(secrets.token_urlsafe(50))">
JWT_SECRET_KEY=<idem>
DEBUG=False
ALLOWED_HOSTS=<tu-dominio>.railway.app
CORS_ALLOWED_ORIGINS=https://<tu-frontend>.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
DJANGO_SETTINGS_MODULE=config.settings.production
```

**Frontend:**
```
NEXTAUTH_URL=https://<tu-frontend>.railway.app
NEXTAUTH_SECRET=<genera con: openssl rand -base64 32>
NEXT_PUBLIC_API_URL=https://<tu-backend>.railway.app/api/v1
INTERNAL_API_URL=https://<tu-backend>.railway.app/api/v1
```

### Comandos de build en Railway

- **Backend:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
- **Frontend:** `pnpm build && node server.js`
- **Release command (backend):** `python manage.py migrate`

Railway auto-despliega en cada push a `main`.

---

## Desarrollo

### Tests

```bash
# Correr todos los tests
make local-test

# Con reporte de cobertura (genera htmlcov/)
make local-test-cov
```

Los tests usan `pytest-django` con la configuración en `pyproject.toml`. La base de datos de test se crea y destruye automáticamente.

### Linting y formato

```bash
make local-lint     # Verifica ruff + ESLint (no modifica archivos)
make local-format   # Auto-formatea con ruff format
```

Configuración de Ruff en `backend/pyproject.toml`:
- Line length: 100
- Rules: `E, W, F, I, UP, B, SIM, TCH, RUF`
- Excluye migraciones y `__init__.py`

### Agregar una nueva app

```bash
# 1. Crear la app Django
cd backend && uv run python manage.py startapp mi_app apps/mi_app

# 2. Agregar a INSTALLED_APPS en config/settings/base.py

# 3. Crear estructura API
mkdir -p api/v1/mi_app
touch api/v1/mi_app/__init__.py
touch api/v1/mi_app/views.py
touch api/v1/mi_app/serializers.py
touch api/v1/mi_app/urls.py

# 4. Incluir en api/v1/urls.py
path("", include("api.v1.mi_app.urls")),

# 5. Crear migraciones
make local-makemigrations
make local-migrate
```
