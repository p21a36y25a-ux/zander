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
