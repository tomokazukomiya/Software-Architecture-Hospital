FROM python:3.13-slim-bookworm

WORKDIR /app

COPY requirements.txt /tmp/root_requirements.txt

RUN pip install --no-cache-dir -r /tmp/root_requirements.txt

COPY services/visit_service .

EXPOSE 8004

CMD ["uvicorn", "visit_app.asgi:application", "--host", "0.0.0.0", "--port", "8004"]
