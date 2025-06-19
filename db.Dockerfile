FROM postgres:15-alpine

ENV POSTGRES_DB=auth_db
ENV POSTGRES_USER=auth_user
ENV POSTGRES_PASSWORD=SoftwareArchitectures2025

RUN apk add --no-cache icu-data-full
RUN apk add --no-cache libc6-compat

COPY init_db/create_database.sql /docker-entrypoint-initdb.d/create_database.sql
