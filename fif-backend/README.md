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

*(Nota: Asegúrate de configurar las variables de entorno correspondientes en tu archivo `.env` de NestJS para conectarte a estos servicios).*

## 🧪 Pruebas

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```
