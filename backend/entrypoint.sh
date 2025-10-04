#!/bin/sh
set -e
echo "Starting Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers ${GUNICORN_WORKERS:-3} --timeout ${GUNICORN_TIMEOUT:-120}
