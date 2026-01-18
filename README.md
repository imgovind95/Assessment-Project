# ReachInbox Scheduler

A production-grade email scheduler service with a Dashboard.

## Features
- **Backend**: Express.js, TypeScript, BullMQ, Redis, PostgreSQL (Prisma).
- **Frontend**: Next.js 14, Tailwind CSS.
- **Scheduling**: Delayed jobs using BullMQ.
- **Reliability**: Rate limiting, concurrency control, and persistence.
- **Providers**: Ethereal Email (Mock SMTP).

## Prerequisites
- **Node.js**: v18+
- **Infrastructure**: You need PostgreSQL and Redis.
    - **Option A (Docker)**: If you have Docker Desktop installed.
    - **Option B (Cloud)**: Use free tiers of [Neon/Supabase](https://neon.tech) (Postgres) and [Upstash](https://upstash.com) (Redis).
    - **Option C (Local)**: Install PostgreSQL and Redis directly on your machine.

## Getting Started

### 1. Infrastructure Setup

#### Option A: Docker (Recommended if available)
```bash
# Try 'docker compose' or 'docker-compose'
docker compose up -d
```
*If you see "command not found", Docker is not in your PATH. Try Option B.*

#### Option B: Cloud (No Install)
1. Create a Postgres Database (e.g. Neon.tech). Get the connection string.
2. Create a Redis Database (e.g. Upstash). Get the `redis://` connection URL.
3. Update `server/.env` with these values.

### 2. Backend
Navigate to `server/`:
```bash
cd server
npm install
# Generate Prisma Client
npx prisma generate
# Push Schema to DB (Run this only after setting up DB URL in .env)
npx prisma db push
# Start Server
npm run dev
```
Server runs on `http://localhost:5000`.

### 3. Frontend
Navigate to `client/`:
```bash
cd client
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.

## Architecture Highlights
- **Rate Limiting**: Implemented in `server/src/scheduler/worker.ts` using Redis counters.
- **Concurrency**: Configurable in worker options.
- **CSV Parsing**: Client-side parsing using `papaparse`.

## Testing Flow
1. Open `http://localhost:3000`.
2. Login (Mock).
3. Compose Email > Schedule.
4. Check Server logs for delivery.
