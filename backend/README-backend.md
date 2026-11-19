# Todo List Management System — Backend

Spring Boot 3.3.x backend (Java 17, Maven) for the Todo List Management System.
MySQL + Spring Data JPA/Hibernate, Spring Security + JWT (jjwt 0.12.x), Bean Validation.
No Lombok — all getters/setters are explicit.

## Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8 running on `localhost:3306`

## 1. Create the database

```sql
CREATE DATABASE todo_db;
```

Or run the explicit DDL (optional — `spring.jpa.hibernate.ddl-auto=update`
creates the tables automatically):

```bash
mysql -u root -p < src/main/resources/schema.sql
```

## 2. Configure environment variables

| Variable | Default (local dev) | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/todo_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` | JDBC URL |
| `DB_USERNAME` | `root` | MySQL user |
| `DB_PASSWORD` | _(empty)_ | MySQL password |
| `JWT_SECRET` | dev-only default in `application.properties` | Base64-encoded key, **at least 256 bits** for HS256. Generate with `openssl rand -base64 32`. **Replace in production.** |
| `JWT_EXPIRATION_MS` | `86400000` (24 h) | Token lifetime in ms |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | React (Vite) frontend origin |
| `MAIL_HOST` | _(empty)_ | SMTP host, e.g. `smtp.gmail.com`. If blank, email reminders are skipped with a log warning — the in-app alerts still work. |
| `MAIL_PORT` | `587` | SMTP port (587 = STARTTLS). |
| `MAIL_USERNAME` | _(empty)_ | SMTP login (for Gmail: your Gmail address). |
| `MAIL_PASSWORD` | _(empty)_ | SMTP password. **For Gmail this must be an App Password, never your normal password** (see below). |
| `MAIL_FROM` | same as `MAIL_USERNAME` | Sender address shown on reminder emails. |
| `REMINDER_ENABLED` | `true` | Set to `false` to disable the daily scheduled reminder run. |
| `REMINDER_CRON` | `0 0 8 * * *` | Cron for the daily run (default 08:00). Format: second minute hour day month weekday. |

Example (PowerShell):

```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your-password"
$env:JWT_SECRET="<base64 secret from openssl rand -base64 32>"
```

## 3. Run

```bash
cd backend
mvn spring-boot:run
```

The API listens on **http://localhost:8080**.

## 4. API endpoints

All endpoints except `/api/auth/register` and `/api/auth/login` require
`Authorization: Bearer <token>`. Every task/dashboard call is scoped to the
logged-in user — a user can never see, edit, or delete another user's tasks
(other users' tasks return 404, exactly like missing tasks).

### Auth

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | `{ "name", "email", "password" }` | Register (201). Duplicate email → 400. |
| POST | `/api/auth/login` | `{ "email", "password" }` | Login, returns `{ token, tokenType, id, name, email }`. Wrong credentials → 401. |
| POST | `/api/auth/logout` | — | Stateless logout — client discards the token; returns a success message. |
| POST | `/api/auth/change-password` | `{ "currentPassword", "newPassword" }` | Change password (auth required). Wrong current password → 400. |

### User

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/users/profile` | Logged-in user's profile (no password hash). |

### Tasks

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tasks` | Create task (201). `title` required; `priority` defaults to `MEDIUM`, `status` to `TODO`. |
| GET | `/api/tasks` | List own tasks. Optional query params: `search` (title contains, case-insensitive), `status` (`TODO`/`IN_PROGRESS`/`COMPLETED`), `priority` (`HIGH`/`MEDIUM`/`LOW`), `dueDate` (`yyyy-MM-dd`), `sortBy` (`title`/`dueDate`/`priority`/`status`/`createdAt`/`updatedAt`, default `createdAt`), `sortDir` (`asc`/`desc`, default `desc`). |
| GET | `/api/tasks/{id}` | Get one own task (404 otherwise). |
| PUT | `/api/tasks/{id}` | Update task. |
| DELETE | `/api/tasks/{id}` | Delete task (204). |
| PATCH | `/api/tasks/{id}/complete` | Mark task `COMPLETED`. |

### Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard/summary` | `{ totalTasks, completedTasks, pendingTasks, inProgressTasks, overdueTasks, completionPercentage }`. Overdue = due before today and not `COMPLETED`. |

### Alerts

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/alerts/summary` | In-app alerts for the logged-in user: `{ overdueCount, dueTodayCount, dueTomorrowCount, overdueTasks, dueTodayTasks, dueTomorrowTasks }`. Only non-`COMPLETED` tasks; overdue = due before today, due today = due today, due tomorrow = due tomorrow. |
| POST | `/api/alerts/send-reminders` | Manually trigger the email reminder run for the logged-in user. Returns `{ sent, failed, message }` (counts are reminder **emails**, one email groups all of the user's due/overdue tasks). |

## 5. Email reminders — how they work

- **In-app alerts** need no setup: `GET /api/alerts/summary` always works for the logged-in user.
- **Email reminders** run daily at **08:00** by default (`app.reminder.cron`, change with `REMINDER_CRON`). The scheduled job (`ReminderService`) goes through every user and sends **one email per user** grouping their non-completed tasks due tomorrow, due today, and overdue. Subject: *"Your tasks due soon — Todo List"*.
- **No duplicate emails:** after a successful send, each included task's `last_reminder_sent_at` is stamped, and tasks already reminded today are skipped — so restarting the app does not re-send the same reminder.
- **Mail not configured?** If `MAIL_HOST` or `MAIL_USERNAME` is blank, the app starts normally, reminders are skipped with a warning in the log, and `POST /api/alerts/send-reminders` returns `failed: 1` with a message telling you to set the mail env vars. Nothing crashes.

### Gmail SMTP example

1. Turn on 2-Step Verification on your Google account.
2. Create an **App Password**: Google Account → Security → 2-Step Verification → App passwords → generate one for "Mail". **Use this 16-character App Password as `MAIL_PASSWORD` — never your normal Gmail password.**
3. Set the env vars (PowerShell):

```powershell
$env:MAIL_HOST="smtp.gmail.com"
$env:MAIL_PORT="587"
$env:MAIL_USERNAME="you@gmail.com"
$env:MAIL_PASSWORD="<16-character app password>"
$env:MAIL_FROM="you@gmail.com"
```

### Test the reminders

```bash
# Logged in as a user with a task due today/tomorrow (or overdue)
curl -X POST http://localhost:8080/api/alerts/send-reminders \
  -H "Authorization: Bearer <token>"
# → {"sent":1,"failed":0,"message":"Reminder email sent to you@gmail.com covering 2 task(s)."}

# Call it again the same day → {"sent":0,"failed":0,"message":"No tasks due — nothing to remind ..."}
# (tasks already reminded today are skipped)

# Check the in-app summary
curl http://localhost:8080/api/alerts/summary \
  -H "Authorization: Bearer <token>"
```

## 6. Quick test (curl)

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Vinay","email":"vinay@example.com","password":"secret123"}'

# Login (copy the token)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vinay@example.com","password":"secret123"}'

# Create a task
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Complete project","description":"Finish backend","dueDate":"2026-11-25","priority":"HIGH"}'

# Dashboard
curl http://localhost:8080/api/dashboard/summary \
  -H "Authorization: Bearer <token>"
```

## Project layout

```
src/main/java/com/todoapp/
├── TodoListApplication.java
├── config/CorsConfig.java
├── controller/  AuthController, UserController, TaskController, DashboardController,
│                AlertController
├── dto/         RegisterRequest, LoginRequest, AuthResponse, TaskRequest, TaskResponse,
│                DashboardSummary, ProfileResponse, ChangePasswordRequest,
│                AlertSummary, ReminderResult
├── entity/      User, Task, TaskPriority, TaskStatus
├── exception/   GlobalExceptionHandler, ResourceNotFoundException
├── repository/  UserRepository, TaskRepository
├── security/    JwtUtil, JwtAuthenticationFilter, SecurityConfig,
│                CustomUserDetails, CustomUserDetailsService
└── service/     AuthService, TaskService, DashboardService,
                 EmailService, ReminderService
src/main/resources/
├── application.properties
└── schema.sql
```
