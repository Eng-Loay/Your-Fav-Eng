# Deploy this LMS to Vercel (agent runbook)

This file is for another coding agent (or a human) who needs to take **this repo as it exists today** and get it live on Vercel with **no VPS**.

The original GitHub project (`Eng-Loay/Your-Fav-Eng`) was a **Next.js 16 frontend + Express API + Prisma**, meant to run as two PM2 processes on a Linux box with local MySQL and `backend/uploads/` on disk. This checkout already contains the Vercel port. **Do not start that port from scratch unless this tree is missing `vercel.json`, `backend/src/lib/blob.ts`, and `backend/src/lib/redis.ts`.**

A previous production deploy of this checkout:

- Project: `your-fav-eng-lms`
- URL: `https://your-fav-eng-lms.vercel.app`
- Team: the Vercel account that ran `vercel link`

If you are deploying a **fresh** copy (new Vercel project, new Neon/Blob/Redis), follow every step below. If you are **re-deploying this same linked project**, skip to [Redeploy](#11-redeploy).

---

## 0. What you are deploying

```
Browser
  │
  ▼
Vercel project (one Git folder, one production URL)
  ├─ service "frontend"  Next.js 16 at repo root
  └─ service "backend"   Express at /backend  (entrypoint src/index.ts)
        │
        ├─ Neon Postgres     Prisma (pooled DATABASE_URL + DIRECT_URL)
        ├─ Vercel Blob       uploads, videos, generated PDFs
        └─ Upstash Redis     rate limit, Gemini key cooldown, WS pub/sub
```

Public routing is in `vercel.json`:

| Path | Service |
|---|---|
| `/api/messages/ws` | backend (WebSocket) |
| `/api/games/ws` | backend (WebSocket) |
| `/api/*` | backend (Express) |
| everything else | frontend (Next.js) |

The frontend talks to the API at **same origin** `NEXT_PUBLIC_API_URL=/api`. Do not point it at `localhost:5001` in production.

Auth lowercases emails. Store users as `loay@eng.com`, not `Loay@Eng.Com`. Login still accepts mixed case.

---

## 1. Preconditions

On the machine:

- Node 22+
- `npm`
- Vercel CLI (`npm i -g vercel`) logged in (`vercel whoami`)
- Network access to Vercel Marketplace

In the repo (this checkout already has these; if you cloned the **upstream** GitHub repo without the port, you must implement the port first — see [Appendix A](#appendix-a-if-you-only-have-the-original-vps-repo)):

- `vercel.json` with `services` + rewrites
- `backend/prisma/schema.prisma` → `provider = "postgresql"` and `directUrl`
- `backend/src/index.ts` exports `http.Server`, `listen` only when `VERCEL !== '1'`
- `backend/src/lib/blob.ts` + multer **memory** storage
- `backend/src/lib/redis.ts` + Redis-backed sockets
- `next.config.mjs` has `images.unoptimized: true`
- `backend/package.json` `"build": "prisma generate"` (**not** `tsc`)
- No `pnpm-lock.yaml` (npm only). If both lockfiles exist, Vercel picks pnpm and the build dies.

Working directory for all commands: **repo root** unless a step says `cd backend`.

---

## 2. Link a Vercel project

```bash
vercel whoami
vercel link --yes --project your-fav-eng-lms
```

Adjust `--project` and `--scope <team-slug>` if the team is not the default.

GitHub auto-connect to `Eng-Loay/Your-Fav-Eng` will fail unless that GitHub account is on this Vercel team. **CLI deploys from the local folder work without Git.** Prefer `vercel --prod` from this tree.

Confirm `.vercel/project.json` exists. Do not commit secrets. `.vercel/` is gitignored here.

---

## 3. Provision Marketplace stores (once per project)

Run these from the linked repo root. They inject env vars into the Vercel project.

### Blob (public, for course images / uploads)

```bash
vercel blob create-store your-fav-eng-media \
  --access public \
  --yes \
  --environment production \
  --environment preview \
  --environment development
```

This sets `BLOB_READ_WRITE_TOKEN`.

### Neon Postgres

```bash
vercel integration add neon --name your-fav-eng-db --non-interactive
```

Typical injected names:

- `DATABASE_URL` (pooled — this is what Prisma uses at runtime)
- `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` (direct — migrations)
- `POSTGRES_PRISMA_URL`

You still must add **`DIRECT_URL`** yourself (Prisma schema requires it). Copy the unpooled URL:

```bash
vercel env pull .env.local --environment=development --yes
```

Then, without echoing secrets:

```bash
python3 - <<'PY'
from pathlib import Path
vals = {}
for line in Path('.env.local').read_text().splitlines():
    if not line.strip() or line.startswith('#') or '=' not in line:
        continue
    k, v = line.split('=', 1)
    vals[k] = v.strip().strip('"').strip("'")
direct = vals.get('DATABASE_URL_UNPOOLED') or vals.get('POSTGRES_URL_NON_POOLING')
Path('/tmp/direct_url.txt').write_text(direct or '')
print('DIRECT_URL length', len(direct or ''))
PY

for envn in production development; do
  vercel env add DIRECT_URL "$envn" < /tmp/direct_url.txt
done
# Preview asks for a git branch; empty branch = all preview branches:
vercel env add DIRECT_URL preview "" < /tmp/direct_url.txt
rm -f /tmp/direct_url.txt
```

### Upstash Redis

```bash
vercel integration add upstash/upstash-kv --name your-fav-eng-redis --non-interactive
```

If the CLI returns `integration_terms_acceptance_required`:

```bash
vercel --non-interactive integration accept-terms upstash --yes
vercel --non-interactive integration add upstash/upstash-kv --name your-fav-eng-redis
```

Injected names this stack understands (see `backend/src/lib/redis.ts`):

- `KV_REST_API_URL` + `KV_REST_API_TOKEN` (REST, used for publish / rate limit)
- `REDIS_URL` (Redis protocol, used for subscribe on WS instances)

`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` also work if present.

---

## 4. App secrets (all three environments)

Add each variable **once per environment** (`production`, `preview`, `development`). Preview: `vercel env add NAME preview ""`.

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `/api` | Must be same-origin. **Never** `http://localhost:5001/api` in production. |
| `FRONTEND_URL` | `https://<project>.vercel.app` | CORS / Stripe return URLs. Update after first alias is known. |
| `JWT_SECRET` | `openssl rand -hex 32` | Same value on prod + preview + development or tokens break locally. |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 32` | Separate from JWT_SECRET. |
| `DIRECT_URL` | Neon unpooled URL | Already covered in step 3. |
| `STRIPE_SECRET_KEY` | Stripe secret | Optional until payments. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Point Stripe at `https://<host>/api/payments/webhook`. |
| `GEMINI_API_KEY` or `GEMINI_API_KEYS` | Gemini key(s) | Optional; AI tutor. Comma-separated for rotation. |

Pull after adding:

```bash
vercel env pull .env.local --environment=development --yes
```

Copy Prisma-needed keys into `backend/.env` (gitignored) so local Prisma can run:

```bash
python3 - <<'PY'
from pathlib import Path
vals = {}
for line in Path('.env.local').read_text().splitlines():
    if not line.strip() or line.startswith('#') or '=' not in line:
        continue
    k, v = line.split('=', 1)
    vals[k] = v.strip().strip('"').strip("'")
needed = ['DATABASE_URL', 'DIRECT_URL', 'BLOB_READ_WRITE_TOKEN',
          'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'REDIS_URL',
          'JWT_SECRET', 'JWT_REFRESH_SECRET']
Path('backend/.env').write_text(
    '\n'.join(f'{k}="{vals[k]}"' for k in needed if vals.get(k)) + '\n'
)
print('wrote backend/.env keys', [k for k in needed if vals.get(k)])
PY
```

`backend/src/config/database.ts` appends `pgbouncer=true&connection_limit=1` to `DATABASE_URL` at runtime. Do not point `DATABASE_URL` at the direct (unpooled) host.

---

## 5. Schema + seed (against Neon)

```bash
cd backend
npx prisma generate
npx prisma db push
```

`db push` is what this repo uses (no committed migrations folder).

**Seed is destructive to branding and some teacher rows if you run the full `prisma/seed.ts` blindly.** Prefer:

```bash
# 1) login accounts (upsert, non-destructive)
npx tsx prisma/seed.accounts.ts

# 2) owner admin used in production
npx tsx scripts/seed-loay-admin.ts

# 3) catalog / dummy LMS data — only on an empty database
npx tsx prisma/seed.ts
```

If you already have live branding you care about, **skip full `seed.ts`**. It used to write London/IAGRCP phone `+441185919965` over Loay’s contact info. The seed file in this checkout is patched, but still overwrites `platformSetting` rows.

After a full seed, restore Loay branding:

```bash
npx tsx scripts/restore-loay-branding.ts
```

Known working admin (login lowercases the email):

| Email typed at login | Stored email | Password | Role |
|---|---|---|---|
| `Loay@Eng.com` | `loay@eng.com` | `Loay#1234l` | ADMIN |
| `admin@animka.com` | same | `Admin123!` | ADMIN |
| `student1@animka.com` | same | `student123` | STUDENT |

If login 401s with the right password, the DB row’s email casing does not match `email.toLowerCase()`. Fix with `scripts/seed-loay-admin.ts` (case-insensitive lookup, then write lowercase).

---

## 6. First production deploy

From repo root:

```bash
vercel --prod --yes
```

Expect ~2–4 minutes. Both services must build:

1. Frontend: `npm install` → `next build` (TypeScript runs; `ignoreBuildErrors` is off).
2. Backend: `npm install` → `prisma generate` → Express entry `src/index.ts`.

Success looks like:

```
✓ Build complete — Using src/index.ts as the root entrypoint.
✓ Typecheck complete
▲ Production  https://your-fav-eng-<hash>-<team>.vercel.app
▲ Aliased     https://your-fav-eng-lms.vercel.app
✓ Ready
```

Then set `FRONTEND_URL` production to the aliased URL if it still points at localhost or a guessed host, and redeploy (or it only matters for CORS / Stripe redirects; same-origin `/api` does not need it for the SPA).

---

## 7. Verify (do not skip)

```bash
BASE=https://your-fav-eng-lms.vercel.app   # or the alias you got

curl -sS "$BASE/api/health"
# {"status":"ok","db":"up"}

curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/"
# 200

curl -sS -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"Loay@Eng.com","password":"Loay#1234l"}'
# success true, role ADMIN, accessToken present

curl -sS "$BASE/api/settings/branding"
# contactPhone 01273587216, contactEmail essamloay2@gmail.com

curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' "$BASE/le-logo.png"
# 200 image/png

# Stripe webhook is mounted with express.raw *before* json:
curl -sS -X POST "$BASE/api/payments/webhook" \
  -H 'Content-Type: application/json' \
  --data-binary '{"id":"evt_test"}'
# 400 Missing stripe-signature header  ← correct

# WebSockets need HTTP/1.1 (browsers do this; HTTP/2 curl looks like a 404):
curl --http1.1 -sS -D - -o /dev/null -m 8 \
  -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' \
  -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
  "$BASE/api/messages/ws"
# HTTP/1.1 101 Switching Protocols
```

Open `/admin` **logged in as ADMIN**. If you see a white “client-side exception”, the Lucide `icon` vs CSS `icon` clash is back — see pitfalls.

Logs (CLI deploys have no git branch):

```bash
vercel logs --no-branch --environment production --since 1h --expand
```

`Cannot find module 'express'` means the backend `build` script compiled with `tsc` to `dist/` and Vercel shipped JS without node_modules. Keep `"build": "prisma generate"`.

---

## 8. Stripe webhook (when payments go live)

1. Stripe Dashboard → Webhooks → `https://<prod-host>/api/payments/webhook`
2. Events: at least `checkout.session.completed` (whatever `payments.service` already handles)
3. Put the signing secret in `STRIPE_WEBHOOK_SECRET` (production)
4. Redeploy or wait — env changes need a new deployment to appear on Functions

The Express app mounts:

```ts
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
```

Do not put `express.json()` first.

---

## 9. Custom domain

```bash
vercel domains add example.com
# follow DNS instructions in the CLI / dashboard
```

Then set `FRONTEND_URL=https://example.com` on production and redeploy. Keep `NEXT_PUBLIC_API_URL=/api`.

---

## 10. Local dev after linking

```bash
vercel env pull .env.local --yes
vercel dev          # runs both services + bindings
# or, without cloud:
vercel dev -L
```

Classic two-process mode still works for backend-only hacking:

```bash
npm run dev:all     # Next :3000 + Express :5001
```

Uploads without `BLOB_READ_WRITE_TOKEN` throw. Pull env first.

---

## 11. Redeploy

```bash
vercel --prod --yes
```

No need to re-provision Neon/Blob/Redis. Do **not** re-run full `seed.ts` on production unless you intend to reset catalog/settings.

---

## Pitfalls this port already hit (read before you improvise)

### Lockfile

Vercel saw `pnpm-lock.yaml` (stale) and ran `pnpm install --frozen-lockfile`. It failed because `package.json` had drifted. **Delete `pnpm-lock.yaml`. Keep `package-lock.json`. Pin `installCommand`: `npm install` on both services.**

### Backend `build: tsc` ships a broken function

Express on Vercel must bundle from `src/index.ts`. If `npm run build` is `tsc`, the output is `dist/index.js` that `require('express')` at `/var/task` with **no node_modules**. Runtime: `Cannot find module 'express'`.

Correct: `"build": "prisma generate"` in `backend/package.json`. `postinstall` also runs `prisma generate`.

### `/_next/image` 404s — images look “gone”

Static files (`/le-logo.png`, `/brand/...`) return 200. Next’s optimizer (`/_next/image?url=...`) 404s under Vercel Services (`x-matched-path: /404`). Homepage used `<Image>` so every picture died.

**Keep `images.unoptimized: true` in `next.config.mjs`.** Do not “fix” this by adding more `remotePatterns` alone.

### Seed overwrites Loay’s phone/email/address

`backend/prisma/seed.ts` originally upserted IAGRCP London branding (`+441185919965`, `info@iagrcp.org`, Lime St). Running it on empty Neon made the live site show UK contact data.

This checkout’s seed is patched to Loay’s values (`01273587216`, `essamloay2@gmail.com`, الإسكندرية، العجمي). After any full seed, run `scripts/restore-loay-branding.ts` and confirm `GET /api/settings/branding`.

### Admin white screen (“client-side exception”)

`adminStatStyle()` returned `{ icon: "text-primary" }` (a **class name**). Stat cards also set `icon: Users` (a **component**), then spread the style **after**, so React rendered the string `"text-primary"` as a component.

The CSS field is now `iconClass`. Do not rename it back to `icon`. Same pattern exists on admin courses + store pages.

### WebSocket curl 404

`curl https://.../api/messages/ws` over HTTP/2 hits Express as a normal GET → JSON 404. Browsers upgrade over HTTP/1.1. Test with `curl --http1.1` and expect `101` then `Missing token` if no JWT.

Backend attaches **one** `WebSocketServer({ server })` in `backend/src/realtime/shared-wss.ts` and routes by path. Do not register two `ws` servers with `{ server, path }` — the first rejects the other’s upgrades with HTTP 400.

Function max duration is 300s. Game/chat clients do **not** reconnect yet. Long classroom sessions will drop.

### Email uniqueness is case-sensitive in Postgres, login is not

`login()` queries `email.toLowerCase()`. A row stored as `Loay@Eng.Com` will never match `loay@eng.com`. Always persist lowercase.

### Full seed deleted teachers after creating them

Older `seed.ts` created `instructor@iagrcp.org` then `deleteMany({ role: 'TEACHER' })`, so course upserts failed with `Course_instructorId_fkey`. That wipe is removed. If you resurrect it, catalog seed breaks.

### `vercel logs` empty

CLI production deploys are not on `main`. Use `--no-branch`.

### Do not export the Express `app` as default

Export the **`http.Server`** (`export default server`) so WebSocket upgrades attach. `listen()` only when `process.env.VERCEL !== '1'`.

---

## Env checklist (production)

After `vercel env ls production` you should have at least:

- `DATABASE_URL`
- `DIRECT_URL`
- `BLOB_READ_WRITE_TOKEN`
- `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or Upstash REST pair)
- `REDIS_URL`
- `JWT_SECRET` + `JWT_REFRESH_SECRET`
- `NEXT_PUBLIC_API_URL=/api`
- `FRONTEND_URL`

---

## Appendix A — If you only have the original VPS repo

The upstream repo is **not** Vercel-ready. You must port it (or copy this checkout). Minimum code changes that were required:

1. **`vercel.json`** — Services + rewrites as above.
2. **Prisma** — `mysql` → `postgresql`, add `directUrl`, serverless singleton + `pgbouncer` query params in `backend/src/config/database.ts`.
3. **Express entry** — build `http.Server`, attach both WS servers, `export default server`, no `listen` on Vercel.
4. **Uploads** — `multer.memoryStorage()`, `put()` to `@vercel/blob`, store the HTTPS URL in Prisma. No `diskStorage`, no `express.static('/uploads')`.
5. **Sockets** — publish/subscribe via Upstash; one shared `WebSocketServer({ server })`.
6. **Rate limit / Gemini cooldown** — Upstash, not in-process Maps (except local socket sets).
7. **Frontend** — `getApiBase()` → `/api` on Vercel; `images.unoptimized: true`; exclude `backend/` from root `tsconfig.json`.
8. **Backend `package.json`** — `"build": "prisma generate"`. Remove `pnpm-lock.yaml`.
9. **Do not** set `typescript.ignoreBuildErrors: true`. This tree uses `strict: false` plus `@ts-nocheck` on ~27 inherited UI files so `next build` typecheck passes. A later agent should actually fix those types.
10. **Admin stat cards** — style field must be `iconClass`, not `icon`.

Reference files in this checkout:

- `vercel.json`
- `backend/src/index.ts`
- `backend/src/lib/blob.ts`
- `backend/src/lib/redis.ts`
- `backend/src/lib/ratelimit.ts`
- `backend/src/middleware/upload.ts`
- `backend/src/realtime/shared-wss.ts`
- `backend/src/realtime/websocket.ts`
- `backend/src/realtime/game-websocket.ts`
- `backend/src/config/database.ts`
- `next.config.mjs`
- `lib/api.ts` (`getApiBase`)
- `lib/admin-theme.ts`

---

## Appendix B — What “done” looked like on the first port

Order of events (so you do not repeat them):

1. Investigate original repo: Next + Express + Prisma MySQL + PM2 + disk uploads + in-memory `ws`.
2. Implement Services / Neon / Blob / Redis in this tree.
3. `vercel link` → Blob store → Neon → Upstash (accept terms) → JWT + `NEXT_PUBLIC_API_URL=/api`.
4. `prisma db push` + accounts seed. Full seed failed once on teacher FK; branding seed wrote London numbers.
5. Deploy 1: pnpm lockfile error.
6. Deploy 2: READY but `GET /api/health` → `FUNCTION_INVOCATION_FAILED` / missing `express` (tsc build).
7. Deploy 3: health + login work; `/_next/image` 404; seed branding wrong; HTTP/2 WS looked 404.
8. Restore branding; `images.unoptimized`; HTTP/1.1 WS 101.
9. Seed Loay admin at lowercase email.
10. Admin dashboard crash from `icon` overwrite; rename to `iconClass` and redeploy.

You should not need that loop if you follow this file on a **new** Vercel project using **this** checkout.
