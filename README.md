# Finance Backend — Zorvyn

> basically a backend that lets people with different roles mess with financial records.
> admins rule everything, analysts can add stuff, viewers can only... well, view.

Built with **Node.js + Express + TypeScript + PostgreSQL + Prisma** — aka the stack that actually works.

---

## 📑 What's Inside

- [What This Thing Does](#what-this-thing-does)
- [Tech We're Using](#tech-were-using)
- [How It's Organized](#how-its-organized)
- [Getting It Running](#getting-it-running)
- [API Endpoints](#api-endpoints)
- [Who Can Do What](#who-can-do-what)
- [Things I Assumed](#things-i-assumed)
- [Why I Built It This Way](#why-i-built-it-this-way)
- [Scripts Cheatsheet](#scripts-cheatsheet)

---

## What This Thing Does

It's the backend for a finance data platform. Three types of users — **VIEWER**, **ANALYST**, **ADMIN** — each with their own level of power:

- **Auth** — sign up, log in, get a JWT, you know the drill
- **User Management** — admins can flip users on/off and change their roles
- **Financial Records** — create, read, update, soft-delete (we never actually nuke data)
- **Dashboard** — quick summaries, category breakdowns, recent activity, monthly trends
- **RBAC** — middleware checks your role before letting you do anything spicy

---

## Tech We're Using

| Tech         | Why It's Here                             |
| ------------ | ----------------------------------------- |
| Node.js      | our runtime, fast enough for this         |
| Express.js   | handles the HTTP stuff, no surprises      |
| TypeScript   | because `any` is not a personality trait  |
| PostgreSQL   | relational DB, solid for financial data   |
| Prisma ORM   | talks to the DB so we don't write raw SQL (mostly) |
| JWT          | stateless auth — no sessions to worry about |
| Zod          | validates incoming data at runtime, catches the weird stuff |
| bcrypt       | hashes passwords so we're not monsters    |

---

## How It's Organized

```
src/
├── controllers/    # catches the request, validates, hands off to service
├── services/       # where the actual logic lives (DB queries, math, etc.)
├── routes/         # URL → middleware → controller wiring
├── middleware/      # auth checks (JWT) + role gates (RBAC)
├── validators/     # Zod schemas — the bouncers of incoming data
├── utils/          # shared stuff like ApiResponse and asyncHandler
└── types/          # TS type extensions (Express augmentation etc.)
```

**The flow goes like this:**

```
Request → Route (middleware checks) → Controller (validate + delegate) → Service (do the thing) → Prisma (talk to DB) → Response
```

1. **Routes** — wire up URLs to controllers, slap on auth/RBAC middleware
2. **Controllers** — parse & validate the request using Zod, call the service, send back a nice response
3. **Services** — pure business logic + DB calls, no HTTP stuff here
4. **Middleware** — auth verifies your JWT, RBAC checks if your role is good enough

---

## Getting It Running

### You'll Need

- **Node.js** ≥ 18 (anything lower and things might get weird)
- **PostgreSQL** ≥ 14 (local install or Docker, both work)
- **npm** ≥ 9

### Step 1 — Clone it

```bash
git clone <your-repo-url>
cd finance-backend
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Set up your environment

```bash
cp .env.example .env
```

Now open `.env` and fill in your actual values:

```env
# server stuff
PORT=3000
NODE_ENV=development

# your postgres connection string — swap the username/password/db name
DATABASE_URL="postgresql://youruser:yourpassword@localhost:5432/finance_db?schema=public"

# pick something long and random, this signs your JWTs
JWT_SECRET="some-really-long-secret-dont-be-lazy"
JWT_EXPIRES_IN="24h"

# how many rounds bcrypt runs — 12 is a sweet spot
BCRYPT_SALT_ROUNDS=12
```

### Step 4 — Create the database

```bash
createdb finance_db
```

Or if you prefer psql:

```sql
CREATE DATABASE finance_db;
```

### Step 5 — Run Prisma migrations

```bash
npx prisma migrate dev --name init
```

> this creates all the tables AND generates the Prisma client for you. two birds, one command.

### Step 6 — Fire it up

```bash
npm run dev
```

Server starts at `http://localhost:3000` — you should see a log confirming it.

### Step 7 — Quick sanity check

```bash
curl http://localhost:3000/api/health
```

If you get a response, you're golden.

---

## API Endpoints

### Auth (Public — no token needed)

| Method | Path                  | Description                          |
| ------ | --------------------- | ------------------------------------ |
| POST   | `/api/auth/register`  | sign up a new user                   |
| POST   | `/api/auth/login`     | log in, get your JWT back            |

### Users (Admin Only)

| Method | Path                       | Description                        |
| ------ | -------------------------- | ---------------------------------- |
| GET    | `/api/users`               | list all users                     |
| PATCH  | `/api/users/:id/status`    | toggle a user's active/inactive    |
| PATCH  | `/api/users/:id/role`      | change someone's role              |

### Financial Records

| Method | Path                | Who Can Use It     | Description                           |
| ------ | ------------------- | ------------------ | ------------------------------------- |
| POST   | `/api/records`      | ANALYST, ADMIN     | add a new record                      |
| GET    | `/api/records`      | everyone (logged in) | list records with filters + pagination |
| GET    | `/api/records/:id`  | everyone (logged in) | get one specific record               |
| PUT    | `/api/records/:id`  | ADMIN only         | update a record                       |
| DELETE | `/api/records/:id`  | ADMIN only         | soft-delete (it's still in the DB)    |

**Filters you can use on `GET /api/records`:**

| Param       | Type   | What It Does                              |
| ----------- | ------ | ----------------------------------------- |
| `type`      | string | `INCOME` or `EXPENSE`                     |
| `category`  | string | search by category (case doesn't matter)  |
| `startDate` | string | from this date (ISO 8601)                 |
| `endDate`   | string | to this date (ISO 8601)                   |
| `page`      | number | which page you want (default: 1)          |
| `limit`     | number | how many per page (default: 10, max: 100) |

### Dashboard (Any Logged-In User)

| Method | Path                               | Description                         |
| ------ | ---------------------------------- | ----------------------------------- |
| GET    | `/api/dashboard/summary`           | total income, expenses, net balance |
| GET    | `/api/dashboard/category-breakdown`| spending/income by category         |
| GET    | `/api/dashboard/recent`            | last 10 records                     |
| GET    | `/api/dashboard/trends`            | monthly trends (last 6 months)      |

### Health Check

| Method | Path           | Description             |
| ------ | -------------- | ----------------------- |
| GET    | `/api/health`  | is the server alive?    |

---

## Who Can Do What

| Action              | VIEWER | ANALYST | ADMIN |
| ------------------- | :----: | :-----: | :---: |
| View records        |   ✅   |   ✅    |  ✅   |
| View dashboard      |   ✅   |   ✅    |  ✅   |
| Create records      |   ❌   |   ✅    |  ✅   |
| Update records      |   ❌   |   ❌    |  ✅   |
| Delete records      |   ❌   |   ❌    |  ✅   |
| Manage users        |   ❌   |   ❌    |  ✅   |

> tl;dr — viewers look, analysts add, admins do everything.

---

## Things I Assumed

1. **Single org** — no multi-tenancy, everyone shares the same space. keeping it simple.

2. **Soft-delete only** — financial records are never actually nuked. `isDeleted: true` hides them, but they're still there for auditing.

3. **UUIDs everywhere** — no auto-incrementing IDs. UUIDs are better for distributed stuff and you can't just guess the next ID.

4. **Password rules** — at least 8 chars, needs uppercase + lowercase + a digit. not the strictest policy ever, but enough.

5. **Stateless JWT** — no session store, no token blacklist. token expires = you're out. simple but it means we can't instantly revoke tokens.

6. **Deactivated ≠ logged out** — if an admin deactivates you, your existing JWT still works until it expires. could add a blacklist later but honestly it's fine for now.

7. **Dashboard = global** — dashboard numbers include ALL records, not just yours. it's an org-level view.

8. **Dates are ISO 8601** — send `2026-04-03T00:00:00.000Z`, not `April 3rd`. we're not animals.

---

## Why I Built It This Way

### 1. Layered Architecture (Controller → Service → Prisma)

Keeps things clean and testable. Controllers don't touch the DB directly, services don't know about HTTP — everyone stays in their lane.

### 2. Zod for Validation

TypeScript catches type errors at compile time, but Zod catches the nonsense people send at runtime. together they're a solid team.

### 3. Middleware-Based RBAC

Instead of checking roles inside every controller (messy), we slap `authorise("ADMIN")` on the route definition. you can see who's allowed just by reading the routes file.

### 4. Consistent Response Format

Every response looks like `{ success, message, data?, error? }`. the frontend never has to guess what shape the response is.

### 5. asyncHandler Wrapper

All async controllers are wrapped so if something throws, Express catches it instead of the app silently dying. no unhandled promise rejections on our watch.

### 6. Prisma as ORM

Type-safe DB queries out of the box. for the gnarly stuff (like monthly trend aggregation with date truncation) we drop down to raw SQL because Prisma's query builder doesn't do date functions natively.

### 7. Soft Delete

You don't delete financial data. ever. we just flip a boolean and pretend it's gone. all queries automatically filter out `isDeleted: true` records.

### 8. Graceful Shutdown

When the server gets a SIGINT/SIGTERM, it disconnects Prisma properly before dying. no orphaned connections cluttering up the DB pool.

---

## Scripts Cheatsheet

| Command                   | What It Does                          |
| ------------------------- | ------------------------------------- |
| `npm run dev`             | starts dev server with hot reload     |
| `npm run build`           | compiles TS → JS into `dist/`         |
| `npm start`               | runs the production build             |
| `npm run prisma:generate` | regenerates the Prisma client         |
| `npm run prisma:migrate`  | runs pending DB migrations            |
| `npm run prisma:studio`   | opens Prisma Studio (a DB GUI, kinda nice) |

---

## License

ISC
