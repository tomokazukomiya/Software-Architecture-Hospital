FROM python:3.13-slim-bookworm

WORKDIR /app

COPY requirements.txt /tmp/root_requirements.txt
COPY services/inventory_service/requirements.txt /tmp/service_requirements.txt

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /tmp/root_requirements.txt && \
    pip install --no-cache-dir -r /tmp/service_requirements.txt

COPY services/inventory_service .

EXPOSE 8001

CMD ["uvicorn", "inventory_app.asgi:application", "--host", "0.0.0.0", "--port", "8001"]
