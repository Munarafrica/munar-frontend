# Munar Backend

Express.js + Neon DB (PostgreSQL) + Drizzle ORM API server.

## Stack

| Layer | Tech |
|-------|------|
| Server | Express.js 4 |
| Database | Neon DB (serverless Postgres) |
| ORM | Drizzle ORM |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| Language | TypeScript |

## Quick Start

### 1. Get a Neon DB database

1. Go to [console.neon.tech](https://console.neon.tech) and create a free project
2. Copy the **connection string** from the dashboard (format: `postgresql://...`)

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` – your Neon connection string
- `JWT_ACCESS_SECRET` – generate with `openssl rand -hex 64`
- `JWT_REFRESH_SECRET` – generate with `openssl rand -hex 64`
- `CORS_ORIGINS` – your frontend URL(s)

### 3. Install dependencies

```bash
npm install
```

### 4. Push schema to Neon DB

```bash
# Push schema directly (no migration files needed for first-time setup)
npm run db:push
```

### 5. Start dev server

```bash
npm run dev
# → API running at http://localhost:3000
# → Health check: http://localhost:3000/api/health
```

---

## Database Commands

```bash
npm run db:push        # Push schema changes directly to Neon DB
npm run db:generate    # Generate migration SQL files
npm run db:migrate     # Run migration files
npm run db:studio      # Open Drizzle Studio (DB browser)
```

---

## API Endpoints

### Auth
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/signup` | – |
| POST | `/api/auth/login` | – |
| POST | `/api/auth/refresh` | – |
| POST | `/api/auth/logout` | – |
| POST | `/api/auth/forgot-password` | – |
| POST | `/api/auth/reset-password` | – |
| GET | `/api/auth/me` | ✓ |
| PATCH | `/api/auth/profile` | ✓ |

### Events
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/events` | ✓ |
| POST | `/api/events` | ✓ |
| GET | `/api/events/:id` | ✓ |
| PUT/PATCH | `/api/events/:id` | ✓ |
| DELETE | `/api/events/:id` | ✓ |
| GET | `/api/events/slug/:slug` | – |
| PATCH | `/api/events/:id/publish` | ✓ |
| PATCH | `/api/events/:id/unpublish` | ✓ |

### Per-event modules (prefix `/api/events/:eventId/`)
- `tickets` – CRUD + attendees + check-in
- `speakers`, `sessions`, `tracks` – program management
- `forms`, `forms/:id/responses` – forms + submissions
- `sponsors` – sponsor management
- `merchandise/products`, `merchandise/orders` – merch store
- `voting/campaigns/:campaignId/categories/:categoryId/contestants` – voting tree

---

## Connecting the Frontend

In the frontend root, copy `.env.example` to `.env.local`:

```bash
# e:\CODING\Munar Frontend\.env.local
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_DATA=false
```

Setting `VITE_USE_MOCK_DATA=false` switches all service calls from mock data to real API requests.

---

## Deployment (Vercel)

The `api/index.ts` at the project root exports the Express app as a Vercel serverless function.

Set these environment variables in your Vercel project dashboard:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGINS` (your deployed frontend URL)

The `vercel.json` at the project root routes `/api/*` → the Express handler and `/*` → the Vite SPA.
