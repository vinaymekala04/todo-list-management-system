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

## 5. Quick test (curl)

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
├── controller/  AuthController, UserController, TaskController, DashboardController
├── dto/         RegisterRequest, LoginRequest, AuthResponse, TaskRequest, TaskResponse,
│                DashboardSummary, ProfileResponse, ChangePasswordRequest
├── entity/      User, Task, TaskPriority, TaskStatus
├── exception/   GlobalExceptionHandler, ResourceNotFoundException
├── repository/  UserRepository, TaskRepository
├── security/    JwtUtil, JwtAuthenticationFilter, SecurityConfig,
│                CustomUserDetails, CustomUserDetailsService
└── service/     AuthService, TaskService, DashboardService
src/main/resources/
├── application.properties
└── schema.sql
```
