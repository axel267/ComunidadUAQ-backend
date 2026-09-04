# Comunidad UAQ - Backend (Portal FIF)

Este es el backend principal para el Portal FIF de Comunidad UAQ, construido con el framework [Nest](https://github.com/nestjs/nest) (TypeScript).

## 🚀 Tecnologías

* **Framework:** NestJS
* **Base de Datos:** PostgreSQL 16
* **Caché y Eventos:** Redis 7
* **Almacenamiento de Archivos:** MinIO (Compatible con S3)
* **Reverse Proxy:** Nginx

## 📋 Requisitos Previos

* Node.js (v18+)
* Docker y Docker Compose

## 🛠️ Instalación y Configuración Local

1. Instalar las dependencias de Node.js:
```bash
npm install
```

2. Levantar la infraestructura base (Postgres, Redis, MinIO, Nginx) usando Docker Compose:
```bash
docker compose up -d
```

3. Iniciar el servidor de desarrollo de NestJS:
```bash
npm run start:dev
```

## 🐳 Servicios de Docker

Cuando ejecutas `docker compose up -d`, se levantan los siguientes servicios:

* **PostgreSQL:** Puerto `5432` (Usuario: `fif_admin`, DB: `fif_db`)
* **Redis:** Puerto `6379`
* **MinIO (API):** Puerto `9000`
* **MinIO (Consola Web):** Puerto `9001` (Usuario: `minio_admin`)
* **Nginx:** Puerto `80` (Redirige las peticiones `/api/` a la aplicación NestJS en el puerto `4000`)

## ⚙️ Variables de Entorno

Debes crear un archivo `.env` en la raíz del backend (`fif-backend/`) con las siguientes variables para que se conecte correctamente a los servicios levantados por Docker:

```env
PORT=4000

# PostgreSQL 16
DB_HOST=localhost
DB_PORT=5432
DB_USER=fif_admin
DB_PASSWORD=fif_secret_password_2026
DB_NAME=fif_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3 / MinIO local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minio_admin
AWS_SECRET_ACCESS_KEY=minio_secret_key_2026
AWS_S3_BUCKET_NAME=fif-media
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_FORCE_PATH_STYLE=true

# Google Gemini API
GEMINI_API_KEY=tu_api_key_de_google_ai_studio
```

## 🧪 Pruebas

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```
