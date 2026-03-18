# Liana HR & Time Attendance WebApp

Monorepo for HR, Time Tracking, Attendance, Leave, and Kosovo payroll workflows in EUR.

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind + Zustand
- Backend: NestJS (Express) + TypeScript + TypeORM + Socket.io
- Database: MySQL
- Auth: JWT + RBAC
- Shared Contracts: `@liana/shared`

## Structure

- `packages/backend` NestJS API
- `packages/frontend` React web app
- `packages/shared` shared enums/types/constants

## Quick Start

1. Copy `.env.example` to `.env`
2. Run MySQL with Docker
3. Install dependencies and start apps

```bash
cp .env.example .env
npm install
docker compose up -d mysql
npm run dev:backend
npm run dev:frontend
```

API: `http://localhost:3000/api`
Frontend: `http://localhost:5173`

## Seed Login

System admin is auto-created on first backend startup:

- Email: `admin@liana.local`
- Password: `Admin123!`

## Implemented Foundations

- JWT authentication (`/api/auth/login`)
- RBAC guards and roles decorator
- Employee listing endpoints
- Employee CRUD endpoints (HR/System Admin controlled)
- Punch endpoint with attendance auto-update
- Real-time punch events over Socket.io (`punch.created`)
- Leave request creation and review workflow endpoints
- Kosovo payroll tier calculation and period processing endpoints
- Notification logging service (email queue logs)
- Attendance CSV export endpoint (`/api/attendance/export/csv`)

## Migrations

Migration workflow is enabled for production-safe schema evolution.

```bash
npm run migration:generate --workspace backend -- -n add_new_table
npm run migration:run --workspace backend
npm run migration:revert --workspace backend
```

TypeORM data source: `packages/backend/src/database/data-source.ts`

## Kosovo Payroll Calculation

- `0-160h`: `100%` hourly rate
- `161-200h`: `130%` hourly rate
- `201+h`: `150%` hourly rate
- Currency: `EUR`

## Notes

- Photo capture supports `photoBase64` payload now; move to S3 by storing object key in `photoUrl`.
- `DB_SYNC=true` is for development only; use migrations in production.
- Offline punch queue is implemented client-side and auto-syncs when online.
- Add PDF/Excel exports in next phase via worker jobs.

## Hostinger VPS Deployment

This repo can be deployed to Hostinger on a VPS or cloud VPS using Docker.

### Files added for production

- `Dockerfile.backend`
- `Dockerfile.frontend`
- `docker-compose.prod.yml`
- `deploy/nginx/default.conf`
- `.env.production.example`

### Deployment steps

1. Provision a Hostinger VPS with Docker and the Docker Compose plugin installed.
2. Copy the repo to the server.
3. Create a production env file:

```bash
cp .env.production.example .env.production
```

4. Update secrets and database passwords in `.env.production`.
5. Start the stack:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

The backend container runs database migrations automatically before app startup,
so schema updates are applied during deployment.

6. Open port `80` in the VPS firewall.

### Important production notes

- The frontend is served by Nginx and proxies `/api` and `/socket.io` to the backend.
- The frontend and backend run on the same origin by default in production.
- Keep `DB_SYNC=false` in production and let migrations manage schema changes.
- For HTTPS, terminate TLS at Nginx on the VPS or place the VPS behind Cloudflare.
