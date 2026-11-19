# Todo List Management System

Full-stack Todo List Management System built from the project specification in `../user/files/Todo_List_Management_System___Project_Specifications.pdf`.

**Stack:** React 18 + Vite (frontend) · Java 17, Spring Boot 3.3.5, Spring Security + JWT, Spring Data JPA / Hibernate (backend) · MySQL

## What it does

- **Auth:** Register, login (JWT), logout, change password, view profile. Users can only access their own tasks.
- **Tasks (CRUD):** Create, view, edit, delete, and mark complete. Each task has title, description, due date, priority (HIGH / MEDIUM / LOW), status (TODO / IN_PROGRESS / COMPLETED), created/updated dates.
- **Search & filter:** Search by title; filter by status, priority, due date; sort by creation date / priority / due date.
- **Dashboard:** Total, completed, pending, in-progress, overdue tasks, and completion percentage.
- **Alerts:** In-app banner on the Dashboard for Overdue / Due today / Due tomorrow tasks, with matching badges on task cards. Email reminders run daily at 8am (one grouped email per user) — configure with `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` (Gmail SMTP + App Password, see `backend/README-backend.md`); test it with `POST /api/alerts/send-reminders` via Postman/curl (the manual trigger is backend-only, not shown in the UI). If mail is not configured, reminders are skipped with a log warning and the app keeps working.

## Project structure

```
todo-list-management-system/
├── README.md                  # this file
├── backend/                   # Spring Boot API (port 8080)
│   ├── pom.xml
│   ├── README-backend.md      # backend setup, env vars, curl examples
│   └── src/main/java/com/todoapp/
│       ├── config/            # CORS
│       ├── controller/        # Auth, User, Task, Dashboard
│       ├── dto/               # Register/Login/Auth/Task/Dashboard/Profile
│       ├── entity/            # User, Task, TaskPriority, TaskStatus
│       ├── exception/         # GlobalExceptionHandler
│       ├── repository/        # UserRepository, TaskRepository
│       ├── security/          # JwtUtil, JwtAuthenticationFilter, SecurityConfig
│       └── service/           # AuthService, TaskService, DashboardService
├── frontend/                  # React + Vite (port 5173)
│   ├── package.json
│   ├── README-frontend.md
│   └── src/
│       ├── api/               # axios client + auth/tasks/dashboard calls
│       ├── components/        # Navbar, TaskCard, TaskForm, SearchFilter
│       ├── context/           # AuthContext
│       └── pages/             # Login, Register, Dashboard, Tasks,
│                              # CreateTask, EditTask, Profile
```

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Logout (client discards token) |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/users/profile` | Logged-in user's profile |
| POST / GET | `/api/tasks` | Create / list own tasks (`?search&status&priority&dueDate&sortBy&sortDir`) |
| GET / PUT / DELETE | `/api/tasks/{id}` | Get / update / delete one task |
| PATCH | `/api/tasks/{id}/complete` | Mark task COMPLETED |
| GET | `/api/dashboard/summary` | Total / completed / pending / in-progress / overdue / completion % |

## Deploy

See [DEPLOY.md](DEPLOY.md) for the full Render guide: everything on Render — Postgres database + backend as a Docker web service + frontend as a static site, all free tier. The backend uses the `prod` Spring profile on Render (PostgreSQL); local dev still uses MySQL with the default profile. `render.yaml` is the Render Blueprint for all three resources; `backend/Dockerfile` and `docker-compose.yml` (local Docker run, now Postgres) are included. No secrets are in the repo — all DB / JWT / mail settings are env vars set on the Render dashboard. Note: Render's free Postgres expires after 30 days — see DEPLOY.md before relying on it long-term.

## How to run

### Clone in IntelliJ IDEA
1. On the welcome screen, click **Get from VCS** (or File → New → Project from Version Control).
2. Paste `https://github.com/vinaymekala04/todo-list-management-system.git`, choose where to save it, click **Clone**, then **Trust Project**.
3. **Backend:** open the `backend` folder / `pom.xml`, let Maven import it, set JDK 17, create the `todo_db` database in MySQL, then run `TodoListApplication.java`.
4. **Frontend:** in IntelliJ's terminal, run `cd frontend`, `npm install`, `npm run dev`.

### 1. Database
```sql
CREATE DATABASE todo_db;
```
Or run `backend/src/main/resources/schema.sql` in MySQL.

### 2. Backend
```bash
cd backend
# set env vars: DB_USERNAME, DB_PASSWORD, JWT_SECRET (see README-backend.md)
mvn spring-boot:run
# API at http://localhost:8080
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

## Verification done here

- Frontend: `npm install` + `npm run build` passed (Vite build, 109 modules, 2.40s).
- Backend: code written for Java 17 / Spring Boot 3.3.5, no Lombok, endpoints cross-checked against the frontend. It was **not** compiled here because Java/Maven/MySQL are not installed on this machine — run `mvn spring-boot:run` on your laptop / IntelliJ to verify it end-to-end.
- One fix made after the build: frontend change-password now calls `POST /api/auth/change-password`, matching the backend (it had used `/api/users/change-password`).

## Next steps (from the spec, Section 7)

Done already: email reminders, in-app alerts, Docker. Still to do: recurring tasks, drag-and-drop, dark/light theme, categories, pagination, file attachments, calendar view, admin dashboard, CI/CD.
