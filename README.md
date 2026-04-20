# Rental CRM Backend (NestJS)

Backend del taller de NestJS para CRM inmobiliario orientado a arriendos, siguiendo el patron `module -> service -> controller`.

## Stack

- NestJS 11
- TypeORM + PostgreSQL
- JWT + RBAC
- Swagger
- Jest + Supertest

## Estructura

- `src/modules/organizations`, `roles`, `users`, `auth`
- `src/modules/contacts`, `leads`
- `src/modules/amenities`, `owners`, `properties`
- `src/modules/opportunities`, `activities`, `tasks`, `visits`
- `src/modules/rental-applications`, `documents`, `rental-evaluations`, `rental-contracts`
- `src/modules/seed` para datos iniciales

## Variables de entorno

Usar `backend/.env.example` como base.

Para desarrollo con Docker local:

- copiar `backend/.env.docker.example` a `backend/.env`
- usar Postgres del `docker-compose.yml` de la raiz
- el compose publica en puerto `5433` para evitar conflicto con un Postgres local en `5432`

Para Neon en produccion:

- `DATABASE_URL=postgresql://...sslmode=require`
- `DB_SSL=true`

## Instalacion y ejecucion

```bash
cd backend
npm install
npm run build
npm run start:dev
```

## Desarrollo local con Docker (PostgreSQL)

Desde la raiz del repo:

```bash
docker compose up -d
```

Verificar estado:

```bash
docker compose ps
```

Luego en backend:

```bash
cd backend
cp .env.docker.example .env
npm install
npm run start:dev
```

Apagar contenedor:

```bash
docker compose down
```

Borrar datos (opcional, reinicio limpio):

```bash
docker compose down -v
```

## Seed inicial

Endpoint:

```bash
POST /api/seed
```

Script:

```bash
npm run seed
```

Usuarios semilla:

- `admin@boho.test / Admin1234!`
- `agent@boho.test / Agent1234!`

## Autenticacion y autorizacion

- Login: `POST /api/auth/login`
- Logout: `POST /api/auth/logout` (flujo simple en cliente)
- Perfil actual: `GET /api/auth/me`
- Rutas protegidas con JWT global
- Roles con decorador `@Roles(...)` y `RolesGuard`

## Swagger

- URL local: `http://localhost:3000/api/docs`

## Pruebas

```bash
npm run test
npm run test:e2e
```

## CI

Pipeline en `.github/workflows/ci.yml` ejecuta build + tests en `push` y `pull_request` a `main`.
