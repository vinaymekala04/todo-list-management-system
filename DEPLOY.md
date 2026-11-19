# Deploying — Render backend, Vercel frontend, Neon database

Live deployment for the Todo List Management System:

```
React frontend (Vercel, free)
        ↓ VITE_API_URL = https://<backend>.onrender.com/api
Spring Boot backend (Render Web Service, Docker, free)
        ↓ PostgreSQL over SSL, `prod` profile
PostgreSQL (Neon, free plan — permanent, no expiry)
```

The backend uses the `prod` Spring profile on Render
(`SPRING_PROFILES_ACTIVE=prod` in `render.yaml`), which switches the
database from MySQL to PostgreSQL — see
`backend/src/main/resources/application-prod.properties`. **Local development
is unchanged:** without the `prod` profile the app still uses your local MySQL,
exactly as before.

**Why Neon and not Render's database:** Render's free PostgreSQL expires
after 30 days and is then deleted. Neon's free plan does not expire — 1 GB
storage, 100 compute-hours a month, no credit card. It scales to zero after
5 minutes idle and wakes up on the next connection (first query after idle
takes a few seconds).

**Free-tier limits to know before you start:**
- The free Render web service spins down after 15 minutes without traffic, so
  the first request after idle takes ~30–60 seconds to wake up. Starter
  ($7/month) keeps it always on.
- Neon free compute is 100 hours a month per project. A todo app uses very
  little — idle time does not count, since compute scales to zero — but if the
  monthly hours run out, Neon suspends compute until the next month.
- Nothing in this repo contains a real password or secret.

## 0. What is already done in the repo

- `backend/Dockerfile` — multi-stage Maven build, slim Java 17 runtime, low-memory JVM flags for the 512 MB free tier.
- `render.yaml` — Render Blueprint creating the backend web service only. The frontend is **not** in it — it deploys on Vercel (step 3). The database is **not** in it either — Neon is created in its own dashboard (step 1).
- `frontend/vercel.json` — SPA fallback so direct links / refreshes on routes like `/dashboard` or `/login` serve `index.html` instead of a 404 on Vercel.
- `backend/pom.xml` — PostgreSQL driver added (MySQL driver kept for local dev).
- `backend/src/main/resources/application-prod.properties` — Postgres datasource + dialect, activated only with `SPRING_PROFILES_ACTIVE=prod`. The JDBC URL includes `?sslmode=${DB_SSLMODE:require}` because Neon requires SSL; local Docker overrides it to `disable`.
- `backend/src/main/resources/schema-postgres.sql` — Postgres DDL if you ever want it explicitly (the backend creates the tables automatically with `ddl-auto=update`).
- `frontend/src/api/axios.js` — API base URL already comes from `VITE_API_URL`, so no code change is needed for production.
- `docker-compose.yml` — local Docker run uses Postgres, matching production (`docker compose up --build`).

## 1. Create the free Neon database

1. Go to [neon.tech](https://neon.tech) → sign up (GitHub/Google/email, no credit card) → **Create project**.
2. Give it a name like `todo-app`, pick the region nearest you (e.g. Singapore / Mumbai if shown), keep the defaults: database `neondb`, role `neondb_owner`.
3. On the project dashboard, open **Connect** and copy the connection string. It looks like:
   ```
   postgresql://neondb_owner:<password>@ep-xxx-xxx.ap-south-1.aws.neon.tech/neondb?sslmode=require
   ```
   Split it into its parts — you will need each one separately:
   - **Host:** `ep-xxx-xxx.ap-south-1.aws.neon.tech`
   - **Database:** `neondb`
   - **User:** `neondb_owner`
   - **Password:** the part after the `:` following the username
   - **Port:** `5432`

## 2. Deploy the backend on Render

1. Render Dashboard → **New → Blueprint** → connect your GitHub repo
   `vinaymekala04/todo-list-management-system`.
2. Render reads `render.yaml` and shows the one resource it will create:
   `todo-backend` (web service, free).
   Confirm — **no paid plan and no database are selected**.
3. Wait for the backend to build and go Live. Note the backend URL, e.g.
   `https://todo-backend-xxxx.onrender.com` — the `xxxx` suffix is assigned by Render.

## 3. Deploy the frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → sign up (GitHub is easiest) →
   **Add New → Project** → import the repo
   `vinaymekala04/todo-list-management-system`.
2. In the project settings, set:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add the environment variable (under Environment Variables, before deploying):
   - `VITE_API_URL` = `https://<backend>.onrender.com/api` (your backend URL from step 2 + `/api`)
4. Click **Deploy**. Note the frontend URL, e.g.
   `https://todo-frontend.vercel.app`.
5. Vercel auto-deploys on every push to `main` after this. If you change
   `VITE_API_URL` later, redeploy — Vite bakes it in at build time.

## 4. Set the env vars on Render

**Backend service (`todo-backend`) → Environment** — fill in the Neon values from step 1:
| Variable | Value |
|---|---|
| `DB_HOST` | Neon host from step 1 |
| `DB_PORT` | `5432` (already set in `render.yaml`) |
| `DB_NAME` | `neondb` (or your database name) |
| `DB_USERNAME` | Neon role, e.g. `neondb_owner` |
| `DB_PASSWORD` | Neon password |
| `DB_SSLMODE` | `require` (already set in `render.yaml`) |
| `CORS_ALLOWED_ORIGINS` | your Vercel frontend URL, e.g. `https://todo-frontend.vercel.app` |
| `MAIL_HOST` / `MAIL_PORT` | `smtp.gmail.com` / `587` (already set, for the 8am reminders) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | your Gmail address + Gmail **App Password** (never your normal password) |
| `MAIL_FROM` | same as `MAIL_USERNAME` |

`JWT_SECRET` is already generated by the Blueprint. `VITE_API_URL` lives on
Vercel, not on Render (step 3).

## 5. Wire frontend and backend together

1. Set `CORS_ALLOWED_ORIGINS` on the backend to the exact frontend URL
   (no trailing slash) and save — Render redeploys the backend automatically.
2. Open the frontend URL, register / log in, create a task. If login fails with
   a CORS error in the browser console, the `CORS_ALLOWED_ORIGINS` value does
   not exactly match the frontend URL — fix it and wait for the redeploy.
3. The Neon database starts empty — register a fresh account on the live site
   and re-create your tasks there (or move them over — see step 5).

## 6. Move your data off the old Render database (before it expires)

Your current Render database expires in ~10 days. If it has tasks you want to
keep, copy them to Neon before then. You need `psql` / `pg_dump` (install
PostgreSQL client tools, or use the Render dashboard's External Database URL
and the Neon dashboard's connection string):

```bash
# 1. Dump the old Render database (use its External Database URL from the Render dashboard)
pg_dump "<render-external-database-url>" > todo_backup.sql

# 2. Restore it into Neon (use the connection string from the Neon dashboard)
psql "<neon-connection-string>" < todo_backup.sql
```

If the dump includes `CREATE DATABASE` / owner lines that fail on Neon, dump
data + schema only for the app tables instead:
```bash
pg_dump "<render-external-database-url>" --no-owner --no-privileges > todo_backup.sql
```
After the move works, delete the old Render database in the Render dashboard
so it does not confuse you later — it would have expired anyway.

## 7. Check the daily email reminders in production

- The scheduled job runs at 08:00 in the server's timezone, but **only while
  the backend is running**. On the free tier the Render service spins down when
  idle, so the 8am run may not fire if nothing woke the service — that is a
  free-tier limit, not a bug. The Starter plan ($7/month) keeps it always on.
- To test immediately in production, use Postman (the button was removed from
  the UI on purpose):
  ```
  POST https://<backend>.onrender.com/api/alerts/send-reminders
  Authorization: Bearer <your JWT from login>
  ```
  → `{"sent":1,"failed":0,"message":"Reminder email sent to ..."}`
  Calling it twice the same day returns `sent: 0` — tasks already reminded today are skipped.

## Troubleshooting

- **Backend build fails on Render:** check the deploy logs; the usual cause is
  the Dockerfile path — it must be `./backend/Dockerfile` with context `./backend`.
- **DB connection errors / SSL error:** check `DB_HOST`, `DB_NAME`,
  `DB_USERNAME`, `DB_PASSWORD` on the backend — one wrong character breaks it.
  `DB_SSLMODE` must be `require` for Neon. The backend must be running with
  `SPRING_PROFILES_ACTIVE=prod` (set by `render.yaml`). Without it, it tries
  MySQL on localhost and fails on Render.
- **Frontend shows a blank page / API errors:** `VITE_API_URL` was set after the
  build — change the env var on Vercel and redeploy (Vite embeds it at build time).
- **Refreshing `/dashboard` or `/login` on Vercel gives a 404:** the SPA
  fallback in `frontend/vercel.json` should handle this — make sure Vercel's
  Root Directory is `frontend`, so it picks that file up.
- **Login works locally but not live:** CORS — see step 4.
- **First load is slow:** free-tier spin-down on Render + Neon waking from
  idle — wait ~60s and refresh.
- **Neon suspended / "compute suspended":** the monthly 100 free compute-hours
  ran out — it resumes next month, or upgrade the Neon plan.
