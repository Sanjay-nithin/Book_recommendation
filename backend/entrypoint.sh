#!/bin/sh
set -e

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Ensuring superuser exists..."
python - <<'PYCODE'
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from books.models import User

email = os.environ.get('DJANGO_SU_EMAIL', 'sanjay@gmail.com')
first_name = os.environ.get('DJANGO_SU_FIRST_NAME', 'Sanjay')
last_name = os.environ.get('DJANGO_SU_LAST_NAME', 'subhi')
password = os.environ.get('DJANGO_SU_PASSWORD', 'admin')

if not User.objects.filter(email=email).exists():
	print(f"Creating initial superuser {email}...")
	User.objects.create_superuser(email=email, password=password, first_name=first_name, last_name=last_name)
else:
	print(f"Superuser {email} already exists.")
PYCODE

echo "Starting Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers ${GUNICORN_WORKERS:-3} --timeout ${GUNICORN_TIMEOUT:-120}
