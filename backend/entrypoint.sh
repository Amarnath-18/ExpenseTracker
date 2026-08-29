#!/bin/sh
set -e

echo "==> Running Alembic database migrations..."
alembic upgrade head

echo "==> Starting server..."
exec "$@"
