#!/bin/sh
set -e

export PYTHONUNBUFFERED=1

echo "==> Running Alembic database migrations..."
alembic upgrade head

# Start background RQ worker if not already running an explicit worker command
if [ "$1" != "rq" ] && [ "${DISABLE_BACKGROUND_WORKER:-false}" != "true" ]; then
    REDIS_TARGET="${APP_REDIS_URL:-$REDIS_URL}"
    if [ -n "$REDIS_TARGET" ]; then
        echo "==> Starting background RQ worker (queue: default)..."
        rq worker default --url "$REDIS_TARGET" &
    fi
fi

echo "==> Starting application..."
exec "$@"
