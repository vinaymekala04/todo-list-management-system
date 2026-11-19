# Deploying to Render

Live deployment for the Todo List Management System, using the Render account
you already have. Architecture:

```
React frontend (Render Static Site, free)
        ↓ VITE_API_URL = https://<backend>.onrender.com/api
Spring Boot backend (Render Web Service, Docker, free)
        ↓ DB_URL (JDBC, SSL)
MySQL (hosted — Render has no managed MySQL, so use Aiven MySQL)
```

**Costs / limits to know before you start:** Render's free web service spins
down after 15 minutes without traffic, so the first request after idle takes
~30–60 seconds to wake up. The Starter plan ($7/month) keeps it always on.
Check Aiven's current free tier / trial on their site before creating the
database — free-tier terms change, and alternatives are PlanetScale or
Railway MySQL. Nothing in this repo contains a real password or secret.

## 0. What is already done in the repo

- `backend/Dockerfile` — multi-stage Maven build, slim Java 17 runtime, low-memory JVM flags for the 512 MB free tier.
- `render.yaml` — Render Blueprint creating the backend web service + frontend static site.
- `backend/src/main/resources/application.properties` — `server.port=${PORT:8080}` (Render injects `PORT`), and all DB / JWT / mail settings already come from env vars.
- `frontend/src/api/axios.js` — API base URL already comes from `VITE_API_URL`, so no code change is needed for production.
- `docker-compose.yml` — local Docker run (backend + MySQL) for testing; not used by Render.

## 1. Create the MySQL database (Aiven)

1. Go to Aiven → create a **MySQL** service (free tier / trial if available).
2. Wait for it to be running, open its **Service URI** / connection details.
3. Note down: host, port, database name, username, password.
4. Your JDBC URL will look like:
   ```
   jdbc:mysql://<host>:<port>/<database>?sslMode=REQUIRED&serverTimezone=UTC
   ```
   Use `sslMode=REQUIRED` — Aiven requires SSL. The tables are created
   automatically by the backend (`ddl-auto=update`).

## 2. Deploy the backend on Render

1. Render Dashboard → **New → Web Service** → connect your GitHub repo
   `vinaymekala04/todo-list-management-system` (or use **New → Blueprint**
   and select the repo — `render.yaml` creates both services at once).
2. If creating manually: **Runtime: Docker**, Dockerfile path
   `./backend/Dockerfile`, Docker context `./backend`, Plan: **Free**.
3. Set these **Environment Variables** on the backend service (never commit them):
   | Variable | Value |
   |---|---|
   | `DB_URL` | the JDBC URL from step 1 |
   | `DB_USERNAME` | Aiven MySQL username |
   | `DB_PASSWORD` | Aiven MySQL password |
   | `JWT_SECRET` | generate a fresh one: `openssl rand -base64 32` (never reuse the dev default in `application.properties`) |
   | `CORS_ALLOWED_ORIGINS` | your frontend URL — fill this in after step 3, e.g. `https://todo-frontend.onrender.com` |
   | `MAIL_HOST` / `MAIL_PORT` | `smtp.gmail.com` / `587` (for the 8am reminders) |
   | `MAIL_USERNAME` / `MAIL_PASSWORD` | your Gmail address + Gmail **App Password** (never your normal password) |
   | `MAIL_FROM` | same as `MAIL_USERNAME` |
4. Deploy. Wait for "Live". Note the backend URL, e.g.
   `https://todo-backend-xxxx.onrender.com` — the `xxxx` suffix is assigned by Render.
5. Test it: `https://<backend>.onrender.com/api/dashboard/summary` should return
   `401` without a token (that means the API is up and security is working).

## 3. Deploy the frontend on Render

1. Render Dashboard → **New → Static Site** → same GitHub repo.
2. **Root Directory:** `frontend`
   **Build Command:** `npm install && npm run build`
   **Publish Directory:** `dist`
   Plan: **Free**.
3. Set this environment variable (rebuild after setting it — Vite bakes it in at build time):
   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://<backend>.onrender.com/api` (your backend URL from step 2 + `/api`) |
4. Deploy. Note the frontend URL, e.g. `https://todo-frontend.onrender.com`.

## 4. Wire them together

1. Go back to the **backend** service → Environment → set
   `CORS_ALLOWED_ORIGINS` to the exact frontend URL from step 3 (no trailing slash).
2. Save — Render redeploys the backend automatically.
3. Open the frontend URL, register / log in, create a task. If login fails with
   a CORS error in the browser console, the `CORS_ALLOWED_ORIGINS` value does
   not exactly match the frontend URL — fix it and wait for the redeploy.

## 5. Check the daily email reminders in production

- The scheduled job runs at 08:00 in the server's timezone, but **only while
  the backend is running**. On the free tier the service spins down when idle,
  so the 8am run may not fire if nothing woke the service — that is a free-tier
  limit, not a bug. The Starter plan ($7/month) keeps it always on.
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
- **"Communications link failure" / DB errors:** the `DB_URL` is wrong or SSL is
  missing — Aiven needs `sslMode=REQUIRED` in the JDBC URL.
- **Frontend shows a blank page / API errors:** `VITE_API_URL` was set after the
  build — change the env var and trigger a manual redeploy (Vite embeds it at build time).
- **Login works locally but not live:** CORS — see step 4.
- **First load is slow:** free-tier spin-down — wait ~60s and refresh.
