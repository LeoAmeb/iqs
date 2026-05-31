# CLAUDE.md

Consulta siempre **[AGENTS.md](./AGENTS.md)** para entender la estructura, convenciones y restricciones del proyecto antes de hacer cualquier cambio.

---

## Instrucciones específicas para Claude

### Idioma

Responde **siempre en español**. Comentarios de código, mensajes de commit y nombres de variables en español también, salvo que el contexto sea código que hereda nombres del framework (ej. `queryset`, `serializer`, `props`).

### Antes de escribir código

1. Leer los archivos relevantes — nunca asumir la estructura por el nombre del archivo.
2. Si la tarea toca el backend, verificar si el cambio requiere migración.
3. Si la tarea toca el frontend, identificar si el componente es server o client.

### Tests

Toda funcionalidad nueva lleva su test. Si el usuario no lo pide explícitamente, igualmente crear el test y mencionarlo.

### Comandos

Usar siempre los targets del `Makefile`. No ejecutar `python manage.py`, `uv run`, `pnpm` ni `pytest` directamente desde la raíz; ir via `make local-*`.

### Git

- Mensajes de commit en formato Conventional Commits en español.
- Nunca hacer `git push` ni crear PRs sin que el usuario lo pida explícitamente.
- Nunca usar `--no-verify` en commits.

### Restricciones críticas

- No editar `apps/*/migrations/` manualmente.
- No modificar `config/settings/production.py`.
- No instalar paquetes sin actualizar `pyproject.toml` (backend) o `package.json` (frontend).
