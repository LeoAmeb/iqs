# AGENTS.md — Guía para agentes de IA

Este archivo describe la estructura, convenciones y reglas del proyecto para que cualquier agente de IA pueda trabajar en él de forma autónoma y coherente.

---

## Resumen del proyecto

Monorepo full-stack con:
- **Backend**: Django 5.1 + Django REST Framework, en `backend/`
- **Frontend**: Next.js 15 (App Router) + TypeScript, en `frontend/`
- **Tareas asíncronas**: Celery 5.4 con Redis como broker
- **Infra local**: Postgres 16 + Redis 7 via Docker Compose (`docker-compose.infra.yml`)
- **Gestor de paquetes Python**: `uv` — nunca `pip` directo ni `venv` manual
- **Gestor de paquetes JS**: `pnpm` — nunca `npm` ni `yarn`
- **Comandos del proyecto**: `Makefile` en la raíz del monorepo

---

## Estructura de directorios

```
template/
├── backend/
│   ├── api/
│   │   └── v1/                  # Capa HTTP: views, serializers, urls, permissions, filters
│   │       ├── urls.py          # Entry point único: path("api/v1/", include("api.v1.urls"))
│   │       ├── users/
│   │       ├── roles/
│   │       ├── audit/
│   │       └── dashboard/
│   ├── apps/                    # Capa de dominio: models, managers, migrations, signals, tasks
│   │   ├── users/
│   │   ├── roles/
│   │   ├── audit/
│   │   └── dashboard/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py          # Settings compartidos — no tocar en producción
│   │   │   ├── development.py
│   │   │   └── production.py    # ZONA RESTRINGIDA
│   │   ├── urls.py
│   │   └── celery.py
│   ├── pyproject.toml           # Dependencias (uv) + config ruff/pytest/mypy
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── (auth)/              # Rutas públicas: login, register
│   │   └── (admin)/             # Rutas protegidas con layout de sidebar
│   │       ├── dashboard/
│   │       ├── users/
│   │       ├── roles/
│   │       └── audit/
│   ├── components/
│   │   ├── layout/              # AppSidebar, AdminHeader (layout del panel)
│   │   └── ui/                  # Componentes shadcn/ui — NO editar directamente
│   ├── hooks/                   # TanStack Query hooks por recurso (use-users, use-roles…)
│   ├── lib/
│   │   ├── api.ts               # Cliente axios con auto-refresh JWT
│   │   ├── api-routes.ts        # Rutas de la API como constantes tipadas
│   │   ├── permissions.ts       # Constantes PERMISSIONS espejando el backend
│   │   ├── schemas.ts           # Schemas Zod para validación de formularios
│   │   └── query-client.ts      # Configuración global de TanStack Query
│   ├── types/                   # Tipos TypeScript del dominio
│   ├── auth.ts                  # Configuración de NextAuth.js v5
│   ├── middleware.ts             # Protección de rutas (redirige a /login si no hay sesión)
│   └── Dockerfile
├── docker-compose.yml           # Stack completo (todos los servicios)
├── docker-compose.infra.yml     # Solo Postgres + Redis (flujo local)
├── Makefile
└── .env.example
```

---

## Decisión arquitectónica clave: `api/v1/` vs `apps/`

La separación entre capa HTTP y capa de dominio es **estricta**.

| Carpeta | Contiene | Ejemplos |
|---------|----------|---------|
| `api/v1/<app>/` | Todo lo que toca HTTP | `views.py`, `serializers.py`, `urls.py`, `permissions.py`, `filters.py`, `throttles.py` |
| `apps/<app>/` | Todo lo que no toca HTTP | `models.py`, `managers.py`, `migrations/`, `signals.py`, `tasks.py`, `admin.py`, `constants.py` |

Nunca mezclar: los modelos no importan de `api/`, y las vistas no definen lógica de negocio que pertenezca al modelo.

---

## Comandos de desarrollo

Todos se ejecutan desde la raíz del proyecto con `make`.

### Flujo local (recomendado)

```bash
make local-setup          # Instala deps: uv sync --group dev + pnpm install
make local-infra-up       # Levanta Postgres + Redis en Docker
make local-migrate        # Aplica migraciones
make local-superuser      # Crea superusuario de Django
make local-backend        # Django runserver en :8000
make local-frontend       # Next.js dev en :3000
make local-celery         # Celery worker (--pool=solo en Windows)
make local-flower         # Flower UI en :5555
make local-test           # pytest
make local-test-cov       # pytest con reporte HTML en htmlcov/
make local-lint           # ruff check + eslint (solo verifica, no modifica)
make local-format         # ruff format (auto-formatea el backend)
make local-shell          # Django shell interactivo
make local-makemigrations # Genera migraciones nuevas
make local-reset-db       # DESTRUCTIVO: borra volúmenes, re-levanta infra y migra
```

### Stack Docker completo

```bash
make docker-dev           # Levanta todos los servicios en contenedores
make docker-stop          # Para todos los servicios
make docker-build         # Reconstruye imágenes sin caché
make docker-logs          # Sigue todos los logs en tiempo real
make docker-logs-backend  # Logs solo del backend
make docker-logs-frontend # Logs solo del frontend
make docker-logs-celery   # Logs del worker Celery
make docker-ps            # Estado de los contenedores
make docker-flower        # Levanta Flower en :5555
```

---

## Backend

### Convenciones Python / Django

- **Formato**: ruff con `line-length = 100`. Ejecutar `make local-format` antes de commitear.
- **Imports**: orden isort — stdlib → third-party → `apps.*` → `api.*` → `config.*`.
- **Modelos**: siempre incluir `__str__`, `Meta.ordering` e índices en campos frecuentemente filtrados.
- **Permisos**: codenames con formato `<recurso>.<acción>` (ej. `users.view`, `roles.edit`). Definirlos en `apps/<app>/constants.py`.
- **Serializers**: si escritura difiere de lectura, usar serializers separados (`XWriteSerializer` / `XSerializer`). El `to_representation` del write serializer delega al read serializer.
- **Viewsets**: toda lógica de permisos y selección de serializer en `get_permissions()` y `get_serializer_class()`. La lógica de negocio no va en las vistas.
- **Type hints**: añadir en métodos públicos de serializers y modelos.

### Permisos (RBAC)

```
Superuser  →  acceso total (sin verificación de permisos)
   │
   └── Role  →  tiene N permissions (M2M, codename único)
                    │
                    └── User  →  tiene 0 o 1 Role
```

Uso en vistas:
```python
# Requiere codename específico
permission_classes = [require_permission("users.view")]

# Requiere ser admin (slug="admin") o superuser
permission_classes = [IsAdminOrSuperuser]
```

### Audit log

Toda creación, actualización y eliminación de usuarios y roles se registra en `AuditLog` (via `apps/audit/middleware.py`) con: usuario, acción, recurso, IP, user-agent y datos extra.

### Agregar una nueva app

Checklist en orden:

1. Crear la app Django:
   ```bash
   cd backend && uv run python manage.py startapp mi_app apps/mi_app
   ```
2. Registrar en `INSTALLED_APPS` (`config/settings/base.py`):
   ```python
   "apps.mi_app",
   ```
3. Crear `apps/mi_app/models.py`. Incluir `created_at`/`updated_at` en entidades de negocio.
4. Generar y aplicar migraciones:
   ```bash
   make local-makemigrations && make local-migrate
   ```
5. Crear capa API:
   ```
   api/v1/mi_app/__init__.py
   api/v1/mi_app/views.py
   api/v1/mi_app/serializers.py
   api/v1/mi_app/urls.py
   ```
6. Registrar en `api/v1/urls.py`:
   ```python
   path("", include("api.v1.mi_app.urls")),
   ```
7. Escribir tests en `apps/mi_app/tests/`.
8. Registrar en `apps/mi_app/admin.py` si el modelo requiere gestión manual.

---

## Frontend

### Stack y capas

| Capa | Tecnología | Dónde |
|------|-----------|-------|
| Routing + SSR | Next.js 15 App Router | `app/` |
| Autenticación | NextAuth.js v5 | `auth.ts`, `middleware.ts` |
| Fetching cliente | TanStack Query v5 | `hooks/` |
| Cliente HTTP | Axios | `lib/api.ts` |
| Formularios | React Hook Form + Zod | `lib/schemas.ts` |
| UI components | shadcn/ui + Radix UI | `components/ui/` |
| Estilos | Tailwind CSS v4 | sin `tailwind.config.js` tradicional |
| Notificaciones | Sonner (toasts) | `components/providers.tsx` |

### Rutas y layouts

```
app/
├── layout.tsx              # Root layout: ThemeProvider, QueryClientProvider, SessionProvider
├── (auth)/
│   ├── layout.tsx          # Layout centrado, sin sidebar
│   ├── login/page.tsx      # Formulario + OAuth Google/GitHub
│   └── register/page.tsx
└── (admin)/
    ├── layout.tsx          # SidebarProvider + AppSidebar + SidebarInset + AdminHeader
    ├── dashboard/page.tsx
    ├── users/
    │   ├── page.tsx        # Listado con tabla, filtros, paginación
    │   └── [id]/page.tsx   # Detalle de usuario
    ├── roles/page.tsx
    └── audit/page.tsx
```

La protección de rutas está en `middleware.ts`: si no hay sesión válida redirige a `/login`. La comprobación de permisos finos (ej. ocultar botón de eliminar) se hace en componentes usando el hook `useHasPermission`.

### Cliente HTTP (`lib/api.ts`)

El cliente axios adjunta automáticamente el `Authorization: Bearer <token>` leyendo la sesión de NextAuth. Implementa **auto-refresh silencioso** en 401:

1. Detecta el error 401.
2. Encola las peticiones concurrentes que fallen mientras refresca.
3. Llama a `POST /auth/token/refresh/` con el refresh token de la sesión.
4. Reintenta todas las peticiones encoladas con el nuevo token.
5. Si el refresh falla, hace `signOut` y redirige a `/login`.

Importante: `lib/api.ts` es solo para peticiones **del lado del cliente**. Las peticiones en server components usan `lib/api-server.ts` con el token obtenido via `auth()`.

### Rutas de la API (`lib/api-routes.ts`)

Todas las URLs de la API están centralizadas como constantes tipadas. Nunca hardcodear rutas en componentes o hooks:

```typescript
// Correcto
api.get(API_ROUTES.users.list)
api.get(API_ROUTES.users.detail(id))

// Incorrecto
api.get("/users/")
api.get(`/users/${id}/`)
```

### Hooks de TanStack Query (`hooks/`)

Cada recurso tiene su propio archivo de hooks. Patrón estándar:

```typescript
// hooks/use-mi-recurso.ts
export function useMiRecursos(params?) {
  return useQuery({
    queryKey: ["mi-recurso", params],
    queryFn: () => api.get(API_ROUTES.miRecurso.list, { params }).then(r => r.data),
  })
}

export function useCreateMiRecurso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(API_ROUTES.miRecurso.list, payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mi-recurso"] })
      toast.success("Creado correctamente")
    },
    onError: () => toast.error("Error al crear"),
  })
}
```

### Permisos en el frontend (`lib/permissions.ts`)

Los codenames están espejados del backend como constantes TypeScript:

```typescript
import { PERMISSIONS } from "@/lib/permissions"

// En un componente
const canEdit = useHasPermission(PERMISSIONS.USERS.EDIT)
```

Al agregar un nuevo permiso en el backend, añadirlo también aquí.

### Autenticación (`auth.ts`)

NextAuth v5 maneja tres proveedores:
- **Credentials**: llama a `POST /api/v1/auth/login/`, extrae el JWT de Django de la respuesta.
- **Google OAuth**: intercambia el token de Google con `POST /api/v1/auth/google/` para obtener JWT de Django.
- **GitHub OAuth**: igual con `POST /api/v1/auth/github/`.

El callback `jwt` renueva el access token automáticamente cuando expira (TTL: 15 minutos). Si el refresh falla, setea `token.error = "RefreshTokenError"` y el middleware redirige al login.

**Importante**: el callback `authorize` y el refresh de token usan `INTERNAL_API_URL` (hostname Docker interno), no `NEXT_PUBLIC_API_URL` (solo para el navegador).

### Convenciones TypeScript / Next.js

- **Server vs client components**: por defecto server component. Añadir `"use client"` solo cuando se necesita estado, efectos o interactividad (hooks, event handlers).
- **Fetching**: TanStack Query en client components; `fetch` o `api-server.ts` en server components.
- **Formularios**: React Hook Form + Zod. El schema va en `lib/schemas.ts`, no inline en el componente.
- **Componentes UI**: usar los de `components/ui/` (shadcn). No editar esos archivos directamente; si se necesita una variación, crear un wrapper en `components/`.
- **Tailwind v4**: no existe `tailwind.config.js`. La configuración se hace con variables CSS y `@theme` en el CSS principal.
- **Tipos globales**: en `types/index.ts`. Extender los tipos de NextAuth en `types/next-auth.d.ts`.

---

## Celery

### Configuración

`config/celery.py` define la app Celery y usa `autodiscover_tasks()` para encontrar automáticamente todos los archivos `tasks.py` dentro de las apps registradas en `INSTALLED_APPS`.

Settings relevantes en `config/settings/base.py`:

```python
CELERY_BROKER_URL        = REDIS_URL          # Redis como broker
CELERY_RESULT_BACKEND    = REDIS_URL          # Resultados también en Redis
CELERY_TASK_SERIALIZER   = "json"
CELERY_TASK_TIME_LIMIT   = 30 * 60           # Máximo 30 minutos por tarea
CELERY_TASK_TRACK_STARTED = True
```

### Tareas programadas (Celery Beat)

El schedule está en `CELERY_BEAT_SCHEDULE` dentro de `base.py`. Tarea activa:

| Tarea | Frecuencia | Qué hace |
|-------|-----------|---------|
| `flush-expired-tokens` | Cada 24 h | Elimina JWT tokens expirados/en blacklist para mantener la tabla limpia |

Para agregar una tarea periódica nueva, añadirla al dict `CELERY_BEAT_SCHEDULE` en `base.py`.

### Agregar una tarea nueva

```python
# apps/mi_app/tasks.py
from config.celery import app

@app.task(bind=True)
def mi_tarea(self, arg1, arg2):
    # lógica...
    return resultado

# Encolar desde una vista o signal:
from apps.mi_app.tasks import mi_tarea
mi_tarea.delay(arg1, arg2)

# Con opciones:
mi_tarea.apply_async(args=[arg1, arg2], countdown=60)  # ejecutar en 60s
```

### Pool en Windows

El pool `prefork` (default de Celery) usa semáforos POSIX no disponibles en Windows. El target `local-celery` del Makefile ya incluye `--pool=solo`:

```bash
make local-celery   # safe en Windows, una tarea a la vez
```

En Docker/Linux se usa `--concurrency=2` (prefork normal).

### Tarea de debug

`config/celery.py` expone `debug_task` para verificar que el worker recibe tareas. Se puede disparar desde `POST /api/v1/dashboard/celery-ping/`.

---

## Flower

Flower es la interfaz web de monitoreo de Celery.

- **URL local**: `http://localhost:5555`
- **Auth**: HTTP Basic Auth con `FLOWER_USER` / `FLOWER_PASSWORD` del `.env`
- **Qué muestra**: workers activos, tareas en cola, historial de ejecuciones, tasa de éxito/fallo, tiempo de ejecución

### Levantar Flower

```bash
# Flujo local
make local-flower

# Flujo Docker
make docker-flower
```

### Cuándo usarlo

- Verificar que los workers están activos antes de encolar tareas en producción.
- Investigar tareas fallidas (ver traceback completo en la UI).
- Ver el tiempo de ejecución de tareas para detectar cuellos de botella.
- Confirmar que las tareas programadas (Beat) se están disparando.

---

## Redis

Redis cumple **tres roles simultáneos** en este proyecto:

| Rol | Config | Descripción |
|-----|--------|-------------|
| **Broker Celery** | `CELERY_BROKER_URL` | Cola de mensajes entre Django y el worker |
| **Result Backend** | `CELERY_RESULT_BACKEND` | Almacena resultados y estados de tareas |
| **Cache Django** | `CACHES["default"]` via `django-redis` | Cache de vistas, querysets y fragmentos |
| **Sesiones** | `SESSION_ENGINE = "cache"` | Sesiones de Django almacenadas en Redis (no en DB) |

### Uso del cache en Django

```python
from django.core.cache import cache

# Guardar
cache.set("mi_clave", valor, timeout=300)  # 5 minutos

# Leer
valor = cache.get("mi_clave")

# Invalidar
cache.delete("mi_clave")
```

### Throttling

La configuración de rate limiting de DRF también usa Redis como backend. Rates configurados en `base.py`:

```python
"DEFAULT_THROTTLE_RATES": {
    "anon": "100/hour",
    "user": "1000/hour",
    "login": "5/minute",       # LoginRateThrottle
    "register": "3/minute",    # RegisterRateThrottle
    "password_reset": "3/hour",
}
```

---

## Tests

**Regla:** toda funcionalidad nueva lleva su test. Sin excepciones salvo configuración pura.

### Estructura

```
apps/
└── mi_app/
    └── tests/
        ├── __init__.py
        ├── conftest.py        # fixtures locales
        ├── test_models.py
        └── test_views.py      # prueba los endpoints via APIClient
```

### Ejecutar

```bash
make local-test           # todos los tests
make local-test-cov       # con reporte HTML en htmlcov/
```

### Convenciones

- Usar `pytest` + `pytest-django`. Fixtures en `conftest.py`.
- Usar `factory_boy` para crear objetos de prueba.
- Los tests de vistas deben cubrir: respuesta exitosa, permisos denegados y datos inválidos.
- No mockear la base de datos; pytest-django crea y destruye la DB de test automáticamente.
- Marcar tests lentos con `@pytest.mark.slow` y los que requieren Redis con `@pytest.mark.integration`.

---

## Git workflow

### Ramas

```
main        → producción (solo merge via PR aprobada, nunca push directo)
develop     → integración (rama base para todas las features)
feature/*   → nuevas funcionalidades  (ej. feature/user-avatar-upload)
fix/*       → correcciones            (ej. fix/jwt-refresh-race-condition)
chore/*     → mantenimiento           (ej. chore/update-celery-to-5.5)
```

### Conventional Commits

Formato: `<tipo>(<scope>): <descripción en español>`

| Tipo | Cuándo |
|------|--------|
| `feat` | Nueva funcionalidad visible |
| `fix` | Corrección de bug |
| `refactor` | Cambio de código sin cambio de comportamiento |
| `test` | Agregar o corregir tests |
| `chore` | Dependencias, configuración, scripts |
| `docs` | Documentación únicamente |
| `style` | Formato, whitespace |

Ejemplos:
```
feat(users): agregar endpoint de cambio de avatar
fix(auth): corregir race condition en auto-refresh de JWT
refactor(api): mover throttles de apps/ a api/v1/
test(roles): agregar tests de permisos para RoleViewSet
chore(deps): actualizar Django a 5.1.4
```

### Proceso de PR

1. Crear rama desde `develop`
2. Commits atómicos con Conventional Commits
3. Abrir PR hacia `develop` (nunca directo a `main`)
4. La IA **nunca** hace push ni crea PRs sin confirmación explícita

---

## Restricciones — Lo que la IA NUNCA debe hacer

| Acción prohibida | Motivo |
|-----------------|--------|
| Editar archivos en `apps/*/migrations/` | Solo `makemigrations` genera migraciones; editarlas rompe el historial |
| Modificar `config/settings/production.py` | Zona de producción; cualquier cambio puede causar downtime o vulnerabilidades |
| Hacer `git push` o crear PRs sin confirmación explícita | Afecta el repositorio remoto y a otros desarrolladores |
| Instalar paquetes sin actualizar `pyproject.toml` o `package.json` | Las dependencias no declaradas no se reproducen |
| Usar `pip install` o `npm install` directamente | Usar `uv add` / `pnpm add` para mantener el lock file actualizado |
| Hardcodear secrets o credenciales | Usar siempre `python-decouple` (`config("VAR")`) o variables de entorno |
| Editar archivos en `components/ui/` directamente | Son componentes generados por shadcn; crear wrappers en `components/` |

---

## Gotchas conocidos

### Windows + Celery
El pool `prefork` usa semáforos POSIX no disponibles en Windows. El Makefile ya resuelve esto con `--pool=solo` en `local-celery`. En Docker (Linux) no aplica.

### uv y el workspace
`uv run` sube en el árbol buscando `pyproject.toml`. El archivo con `[project]` está en `backend/pyproject.toml`. Si se ejecuta `uv run` desde la raíz del monorepo sin `[project]`, recreará el venv vacío. Siempre ejecutar comandos backend desde `backend/` o via los targets del Makefile.

### Variables de entorno en Make (Windows)
La sintaxis `KEY=VALUE comando` es bash pura y no funciona en cmd.exe ni PowerShell. Los targets del Makefile usan `export` a nivel de target, que funciona en cualquier shell.

### `INTERNAL_API_URL` vs `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_URL`: lo usa el navegador. Apunta a `localhost:8000`.
- `INTERNAL_API_URL`: lo usa Next.js en el servidor (server components, `auth.ts`). Apunta al hostname Docker (`backend:8000`) cuando corre en contenedor.
  
Nunca usar `NEXT_PUBLIC_API_URL` en `auth.ts` ni en server components cuando el frontend corre en Docker.

### Tailwind CSS v4
No existe `tailwind.config.js`. La configuración de tema se hace con `@theme` en el CSS principal. No crear archivos de configuración de Tailwind tradicionales.

### Docker Compose y rutas relativas
Con múltiples `-f`, las rutas se resuelven desde el directorio del primer archivo. El directorio base es siempre la raíz del proyecto.

---

## URLs de referencia rápida

| Servicio | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:8000/api/v1/` |
| Swagger UI | `http://localhost:8000/api/docs/` |
| ReDoc | `http://localhost:8000/api/redoc/` |
| Django Admin | `http://localhost:8000/django-admin/` |
| Flower | `http://localhost:5555` |
