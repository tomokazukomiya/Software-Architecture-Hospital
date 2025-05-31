FROM python:3.13-slim-bookworm

WORKDIR /app

COPY requirements.txt /tmp/root_requirements.txt

RUN pip install --no-cache-dir -r /tmp/root_requirements.txt

COPY services/staff_service .

EXPOSE 8003

CMD ["uvicorn", "staff_app.asgi:application", "--host", "0.0.0.0", "--port", "8003"]
