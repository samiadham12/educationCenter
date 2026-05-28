# Education Center Platform

Production educational platform backend (Next.js 15 + MongoDB local + Cloudflare R2 + 10 API security layers).

UI is **not** hand-coded — use Google Stitch prompts in `prompts/stitch/`.

## Prerequisites

- **Node.js 20+** and npm ([nodejs.org](https://nodejs.org))
- **MongoDB 7** local: `mongodb://127.0.0.1:27017`
- **Redis** (optional): `redis://127.0.0.1:6379`
- **Cloudflare R2** credentials for media uploads

## Quick Start

### Windows — if `npm` is not recognized

This project includes **portable Node.js** in `.tools/node/`. Use:

```cmd
cd F:\samy\programming\educationCenter

setup.cmd
dev.cmd
```

Or prefix commands:

```cmd
npm.cmd install
npm.cmd run dev
```

(`npm.cmd` in the project folder forwards to `.tools\node\npm.cmd`)

**Permanent fix:** Install [Node.js LTS](https://nodejs.org) and restart the terminal — then `npm` works everywhere.

### Standard commands (after Node is on PATH)

```powershell
cd f:\samy\programming\educationCenter

copy .env.example .env.local
# Edit .env.local — set AUTH_SECRET, MONGODB_URI, R2 keys

npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- API health: `GET /api/health`
- Login: `/login` (default seed: `admin@example.com` / password from `.env.local`)
- Admin placeholder: `/admin`

## Project Structure

```
src/
  features/          # Feature-based modules (models, services, API)
  layers/            # 10 API security layers
  app/api/           # Catch-all API + NextAuth
  shared/            # MongoDB, Redis, R2, utils
prompts/stitch/      # Google Stitch UI prompts
stitch-output/       # Generated UI lands here
scripts/             # seed-indexes, seed-super-admin
```

## API Overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/login`, `GET /api/auth/session`, NextAuth `/api/auth/*` |
| Users | `POST /api/users/staff`, `POST /api/users/students`, `GET /api/users` |
| Hierarchy | `/api/academic-years`, `/api/terms`, `/api/subjects`, `/api/sections`, `/api/lectures` |
| Media | `POST /api/media/presign`, `POST /api/media/confirm` |
| Access | `POST /api/lecture-codes/redeem`, `GET /api/student/content-tree` |
| Stream | `GET /api/stream/:mediaId/manifest` |
| Progress | `POST /api/progress/heartbeat`, `POST /api/progress/flush`, `GET /api/progress/:mediaId` |
| Stream | `GET /api/stream/:id/manifest`, `playlist.m3u8`, `segment/:seq`, `pdf/:id` |
| Admin | `GET /api/admin/stats`, `GET /api/admin/usage`, `GET /api/admin/usage/export`, `POST /api/academic-years/promote-all` |
| Codes | `GET /api/lecture-codes/:lectureId`, `POST /api/lecture-codes/regenerate` |

All `/api/*` routes (except public health/login) pass through **10 security layers** in `src/layers/`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Unit tests (vitest) |
| `npm run setup` | All DB seeds |
| `npm run seed:indexes` | Sync MongoDB indexes |
| `npm run seed:admin` | Create super admin |
| `npm run seed:academic` | Years + terms |

## Documentation

- Master plan: `plan.md` (phases marked complete)
- Deployment: `DEPLOYMENT.md`
- Models reference: `models.md` → see `plan.md` §16

## Stitch UI Workflow

1. Send prompts from `prompts/stitch/` to Google Stitch
2. Copy generated code to `stitch-output/`
3. Wire thin shells in `src/app/(stitch)/` (see `plan.md` Appendix B)




the branding color ; #0fbaac