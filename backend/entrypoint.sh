#!/bin/sh
set -e

DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.production}"
export DJANGO_SETTINGS_MODULE

echo "Waiting for PostgreSQL at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
while ! nc -z "${DB_HOST:-postgres}" "${DB_PORT:-5432}"; do
    sleep 1
done
echo "PostgreSQL is ready."

echo "Running database migrations..."
python manage.py migrate --noinput

if [ "$DJANGO_SETTINGS_MODULE" = "config.settings.production" ]; then
    echo "Collecting static files..."
    python manage.py collectstatic --noinput
fi

exec "$@"
