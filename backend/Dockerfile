# syntax=docker/dockerfile:1

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VIRTUALENVS_CREATE=false

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt && pip install gunicorn whitenoise dj-database-url

# Copy project
COPY . .
RUN chmod +x /app/entrypoint.sh

# Collect static (harmless if none)
RUN python manage.py collectstatic --noinput || true

# Port for Render
EXPOSE 8000

# Entrypoint (runs migrations, then gunicorn)
CMD ["/app/entrypoint.sh"]
