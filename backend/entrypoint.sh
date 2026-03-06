#!/bin/bash
set -e

echo "Starting BCS Backend..."

echo "Running database migrations..."
alembic upgrade head

echo "Starting uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8001
