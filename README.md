# The Last Knight

A complete, playable medieval pixel survival game with account registration, persistent scores, profiles, and a leaderboard. The same React UI and shared API logic support two deployment targets.

## Run with Docker (Mac, Windows, Linux)

Install and start Docker Desktop, open this project directory in Terminal, then run:

```bash
docker compose up --build
```

Open **http://localhost:8080**. Create an account, enter the arena, and finish a run to save your score. No npm or database installation is needed on the host. First startup downloads and builds images. Migrations run automatically before the API starts.

For background operation:

```bash
docker compose up --build -d
docker compose logs -f backend
```

Stop while preserving the database:

```bash
docker compose down
```

The `knight_data` named volume preserves accounts and scores between container restarts. `docker compose down -v` **deletes that database**.

Optional settings: copy `.env.example` to `.env`. Change `APP_PORT` if 8080 is occupied. Before non-local deployment, replace the development database password with a strong URL-safe password and serve behind HTTPS; set `COOKIE_SECURE=true`. The default password is intentionally local-only. PostgreSQL and the backend have no host-published ports. Back up the PostgreSQL volume for real use.

## What is included

- Sword attacks in a forward arc, directional blocking, stamina, dodge, damage invulnerability, drops, soft enemy separation, keyboard and touch controls.
- Skeletons, goblins, armored knights, and a Warden every fifth wave. Waves become harder; clearing a wave heals 8 HP.
- A local original pixel-art castle background and procedurally rendered pixel sprites, walking motion, hit flashes, particles, sword arcs and torch flicker. Synthesized sound effects and mute control.
- Guest practice, registration, sign-in/out, server-side sessions, score saving, personal statistics, the last 20 runs, and the best 100 players (one result each).
- Pause via Escape/P or the pause button, automatic pause on window blur/tab visibility changes and when switching views.
- Retry for unsuccessful score saves. Scores belong to the account that started the run; signing in halfway through a guest run does not convert it to a ranked run.

## Controls

| Action | Key |
|---|---|
| Move and face | WASD or arrows |
| Strike | Space; or click to aim and strike |
| Shield | Hold E |
| Dodge | Shift |
| Pause / resume | Escape or P |

Touch devices display movement and action buttons. Main combat is designed for a keyboard. Every enemy kill awards points: skeleton 10, goblin 20, knight 50, Warden 250. A completed wave awards 100 points on transition to the next wave. Potions restore 25 HP.

## Architecture

### Docker target

Browser → Nginx/frontend → Express API → PostgreSQL 16.

- `frontend/`: Vite React SPA entry, Nginx configuration and frontend Dockerfile.
- `backend/`: Express adapter and PostgreSQL migration runner, separate lockfile and Dockerfile.
- `lib/server/api.ts`: shared Request/Response API and database-independent parameterized queries.
- `lib/game/`: TypeScript Canvas 2D engine and shared scoring rules. This implementation uses a small custom canvas engine rather than Phaser.
- `app/page.tsx`, `app/globals.css`: shared game UI, account forms, leaderboard and profile.
- `db/migrations/001_postgres.sql`: versioned PostgreSQL schema, applied with an advisory lock and transaction.

### Hosted target

The online edition uses the bundled Vinext/React application on a Worker with a persistent D1 database. `app/api/[...path]/route.ts` adapts D1 to the same shared API. D1 migrations are generated from `db/schema.ts` and live in `drizzle/`. The hosted database and a local Docker database are separate; accounts and results are not synchronized. The Docker target does not require a Cloudflare account or Sites credentials.

The source uses React, TypeScript, Canvas 2D, Radix/Shadcn primitives and CSS. PostgreSQL uses direct parameterized SQL, and the hosted schema uses Drizzle; Prisma is not required.

## API

All mutation requests require JSON, `X-Knight-Request: 1`, and a same-origin request. Sessions use an HttpOnly, SameSite=Strict cookie (Secure with HTTPS). Passwords use salted PBKDF2-SHA256 at 100,000 iterations. Session tokens are random, stored only as SHA-256 hashes, and expire after seven days. Username/email uniqueness is enforced by the database, including case-insensitive usernames. Password-reset and email verification are not implemented.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Database readiness and API health |
| GET | `/api/me` | Current account |
| POST | `/api/auth/register` | username, email, password |
| POST | `/api/auth/login` | email, password |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/games/start` | Create an account-owned game |
| POST | `/api/games/finish` | gameId, wave, duration, kills by enemy type |
| GET | `/api/leaderboard` | Best 100 and current player's rank |
| GET | `/api/profile` | Statistics and 20 recent runs |

The API calculates score from the reported enemy counts and completed waves; a supplied score is ignored. It validates duration against server time, complete earlier-wave counts, maximum spawned counts, run ownership, and unique completion. Authentication is limited to 20 attempts per IP per 15-minute window.

**Anti-cheat limit:** the client simulates combat. Plausibility checks reject obvious modifications, but a determined client can fabricate a plausible run. Competitive public deployment needs server-authoritative simulation or validated replays. The current API accepts waves 1–100; this is a practical MVP limit.

## Development and checks

Requires Node.js 24 for native TypeScript stripping and the SQLite test runner.

```bash
npm ci
node --experimental-strip-types --test tests/game-api.test.mjs
npx tsc --noEmit
npx vite build --config frontend/vite.config.ts
```

The hosted build is `npm run build`. Docker builds the standalone SPA, not the Worker. Do not replace one target's database configuration with the other's.

Validation performed: TypeScript checking, hosted production build, Docker frontend production build, and API integration tests using an in-memory SQLite database with the real SQL migration. Tests cover registration, password checking, session cookies, logout, score recomputation, duplicate submission, ownership, expired sessions, leaderboard/profile, cross-origin rejection and rate limits.

The authoring environment has no Docker executable; a full three-container startup and a live PostgreSQL run were not performed there. Browser interaction testing was not performed. No demo users or fake leaderboard entries are included.

## Assets

`public/art/castle.png` is original AI-generated pixel artwork created for this project. The gameplay sprites and sounds are rendered locally by the game engine. No external asset URLs, trackers, or paid services are used by the Docker application.
