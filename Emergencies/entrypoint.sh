#!/bin/sh
set -e

echo "Verifying and creating migrations for the Core app..."
python manage.py makemigrations

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Migrations applied."

exec "$@"