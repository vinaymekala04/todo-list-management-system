# Todo List Management System — Frontend

React 18 + Vite frontend for the Todo List Management System (see the project
spec: `Todo_List_Management_System___Project_Specifications.pdf`). It talks to
the Spring Boot backend over REST and authenticates with JWT.

## Prerequisites

- Node.js 18+ and npm
- The Spring Boot backend running on `http://localhost:8080`
  (MySQL, JWT auth — see the backend project)

## Setup

```bash
cd frontend
cp .env.example .env   # optional — defaults already point at localhost:8080
npm install
npm run dev
```

Then open **http://localhost:5173**.

- `npm run dev` — start the Vite dev server (port 5173)
- `npm run build` — production build into `dist/`
- `npm run preview` — serve the production build locally

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8080/api` | Backend API base URL |

In development, `vite.config.js` also proxies `/api` to
`http://localhost:8080`, so relative API calls work without CORS issues.

## Pages & Routes

| Route | Page | Access |
| --- | --- | --- |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Dashboard — total / completed / pending / in-progress / overdue tasks and completion % | Protected |
| `/tasks` | My Tasks — search, filter, sort, complete, edit, delete | Protected |
| `/tasks/new` | Create Task | Protected |
| `/tasks/:id/edit` | Edit Task | Protected |
| `/profile` | Profile — view details, change password | Protected |

`/` redirects to `/dashboard`. Protected routes redirect to `/login` when
there is no JWT token in `localStorage`; a `401` response from the API also
clears the session and redirects to `/login` (see `src/api/axios.js`).

## API calls (all against the backend in the spec)

| Call | Endpoint |
| --- | --- |
| Register | `POST /api/auth/register` |
| Login | `POST /api/auth/login` |
| Logout | `POST /api/auth/logout` (best-effort; local session is always cleared) |
| Get profile | `GET /api/users/profile` |
| Change password | `POST /api/auth/change-password` |
| List tasks | `GET /api/tasks` |
| Get task | `GET /api/tasks/{id}` |
| Create task | `POST /api/tasks` |
| Update task | `PUT /api/tasks/{id}` |
| Delete task | `DELETE /api/tasks/{id}` |
| Complete task | `PATCH /api/tasks/{id}/complete` |
| Dashboard summary | `GET /api/dashboard/summary` |
| Alerts summary | `GET /api/alerts/summary` |

Notes:

- **Change password:** the spec requires the feature but does not name the
  endpoint. This frontend uses `POST /api/auth/change-password` with
  `{ currentPassword, newPassword }`. If the backend exposes a different
  path, change the single line in `src/api/auth.js`.
- **Search / filter / sort:** implemented client-side in `src/pages/Tasks.jsx`
  over the fetched task list (search by title; filter by status, priority,
  due date; sort by created date, due date, priority, title), so it works
  even if the backend does not support query parameters.
- **Alerts:** `src/components/AlertsBanner.jsx` (rendered at the top of the
  Dashboard) fetches `GET /api/alerts/summary` on mount and shows nothing
  when nothing is overdue, due today, or due tomorrow. Otherwise it shows
  three sections — Overdue (red), Due today (amber), Due tomorrow (blue) —
  each listing task titles with due date and priority, linking to the task's
  edit page. Email sending itself is configured on the backend (SMTP
  settings + a daily scheduled job). The manual trigger
  `POST /api/alerts/send-reminders` is intentionally not exposed in the UI —
  it is a backend-only endpoint for testing via Postman/curl.
  Task cards (`TaskCard.jsx`) also show a "Due today" amber badge and a
  "Due tomorrow" blue badge, alongside the existing red "(Overdue)"
  treatment, for non-completed tasks.
- **Dashboard summary:** `src/api/dashboard.js` normalises the response
  (`totalTasks`/`total`, `completedTasks`/`completed`, …) and computes the
  completion percentage when the backend does not return one.

## Project structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js          # dev server on 5173, /api proxy to :8080
├── .env.example
├── README-frontend.md
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # routes + protected/public route guards
    ├── App.css
    ├── index.css           # global modern styling, responsive, no UI library
    ├── api/
    │   ├── axios.js        # axios instance, JWT interceptor, 401 handling
    │   ├── auth.js         # auth + profile endpoints
    │   ├── tasks.js        # task CRUD + complete endpoints
    │   ├── dashboard.js    # dashboard summary (normalised)
    │   └── alerts.js       # alerts summary endpoint
    ├── context/
    │   └── AuthContext.jsx # login / register / logout, user + token state
    ├── components/
    │   ├── Navbar.jsx
    │   ├── AlertsBanner.jsx # overdue / due-today / due-tomorrow banner
    │   ├── TaskCard.jsx    # priority/status badges, overdue / due-today / due-tomorrow highlight
    │   ├── TaskForm.jsx    # create/edit form (title, description, due date, priority, status)
    │   └── SearchFilter.jsx
    └── pages/
        ├── Login.jsx
        ├── Register.jsx
        ├── Dashboard.jsx
        ├── Tasks.jsx
        ├── CreateTask.jsx
        ├── EditTask.jsx
        └── Profile.jsx
```

## Auth flow

1. Login/register stores the JWT (`token`) and user object in `localStorage`.
2. The axios request interceptor adds `Authorization: Bearer <token>` to
   every request.
3. `AuthContext` restores the session on reload and fetches the profile if
   only a token was stored.
