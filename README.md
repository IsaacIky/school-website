# 🎓 University Platform — Configurable Platform Foundation

A DB-configurable, multi-campus university management platform.  
Resolves issues: [#30 University Structure & RBAC Epic](https://github.com/IsaacIky/school-website/issues/30) · [#31 Faculties, Departments & Programs](https://github.com/IsaacIky/school-website/issues/31) · [#32 Roles & Permissions Engine](https://github.com/IsaacIky/school-website/issues/32) · [#33 User Management Module](https://github.com/IsaacIky/school-website/issues/33)

---

## 🏗  Architecture

```
school-website/
├── apps/
│   ├── api/          # NestJS backend (TypeScript)
│   └── web/          # Next.js 14 frontend (TypeScript, App Router)
└── packages/
    └── db/           # Prisma schema + migrations + seed
```

**Stack**: Next.js 14 · NestJS 10 · PostgreSQL · Prisma 5 · pnpm workspaces

---

## ⚙️  Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| PostgreSQL | ≥ 15 |

Install pnpm if needed:

```bash
npm install -g pnpm
```

---

## 🚀  Quick Start

### 1 — Clone & install dependencies

```bash
git clone https://github.com/IsaacIky/school-website.git
cd school-website
pnpm install
```

### 2 — Configure environment variables

```bash
# API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — at minimum set DATABASE_URL and JWT_SECRET

# Web
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env — set NEXT_PUBLIC_API_URL if different from default
```

**`apps/api/.env` minimum values:**

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/school_db?schema=public"
JWT_SECRET="replace-with-a-long-random-string"
JWT_EXPIRES_IN="7d"
PORT=4000
WEB_URL="http://localhost:3000"
```

### 3 — Create the database

```bash
createdb school_db          # or use psql / pgAdmin
```

### 4 — Run migrations

```bash
# From repo root:
pnpm db:migrate:dev
# This runs: prisma migrate dev inside packages/db
```

### 5 — Seed initial data

```bash
pnpm db:seed
```

This creates:
- **Main Campus** (code: `MAIN`)
- **Faculty of Computing & Artificial Intelligence** + Department of Computer Science + BSc CS program
- **32 permissions** (CRUD × 8 resources)
- **System roles**: Super Admin · Faculty Admin · Department Admin · Lecturer · Student · Applicant · Admissions Officer
- **Admin user**: `admin@university.ac.zw` / `Admin@123!` *(change via env vars!)*

Override defaults:

```bash
SEED_ADMIN_EMAIL=you@youruni.ac.zw SEED_ADMIN_PASSWORD=Str0ng!Pass pnpm db:seed
```

### 6 — Start development servers

```bash
pnpm dev
# API: http://localhost:4000/api/v1
# Web: http://localhost:3000
```

Or start individually:

```bash
pnpm --filter @school/api start:dev
pnpm --filter @school/web dev
```

---

## 🗄  Database Schema

### University Structure

```
Campus → Faculty → Department → Program
```

### Identity & RBAC

| Table | Purpose |
|-------|---------|
| `users` | Single identity for applicants / students / lecturers / admins |
| `roles` | Named roles (system + custom) |
| `permissions` | Fine-grained resource:action pairs |
| `role_permissions` | M2M roles ↔ permissions |
| `user_role_assignments` | Scoped role assignments (GLOBAL / CAMPUS / FACULTY / DEPARTMENT / PROGRAM) |
| `audit_logs` | Immutable change log with before/after JSON |

### Admissions (Foundation)

The schema lays the groundwork for the admissions workflow  
`Submitted → Under Review → Shortlisted → Offered → Accepted → Enrolled / Rejected`  
(full admissions module to be built on top of this foundation in a subsequent PR).

---

## 🔌  API Endpoints

Base URL: `http://localhost:4000/api/v1`

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/login` | Login — returns JWT |
| `GET` | `/auth/me` | Get current user profile (🔒) |

### University Structure (🔒 JWT required)

| Method | Path | Notes |
|--------|------|-------|
| `GET / POST` | `/campuses` | List / Create |
| `GET / PATCH / DELETE` | `/campuses/:id` | Read / Update / Delete |
| `GET / POST` | `/faculties` | `?campusId=…` filter |
| `GET / PATCH / DELETE` | `/faculties/:id` | |
| `GET / POST` | `/departments` | `?facultyId=…` filter |
| `GET / PATCH / DELETE` | `/departments/:id` | |
| `GET / POST` | `/programs` | `?departmentId=…` filter |
| `GET / PATCH / DELETE` | `/programs/:id` | |

### RBAC (🔒 Super Admin only)

| Method | Path | Description |
|--------|------|-------------|
| `GET / POST` | `/rbac/roles` | List / Create roles |
| `GET / PATCH / DELETE` | `/rbac/roles/:id` | Read / Update / Delete role |
| `POST` | `/rbac/roles/:id/permissions` | Assign permissions to role |
| `DELETE` | `/rbac/roles/:roleId/permissions/:permissionId` | Revoke permission |
| `GET / POST` | `/rbac/permissions` | List / Create permissions |
| `DELETE` | `/rbac/permissions/:id` | Delete permission |
| `POST` | `/rbac/assign` | Assign role to user (with scope) |
| `GET` | `/rbac/users/:userId/roles` | Get user's role assignments |
| `DELETE` | `/rbac/assignments/:id` | Revoke role assignment |

### Audit Logs (🔒 Super Admin only)

```
GET /audit-logs?entity=Campus&userId=…&page=1&pageSize=20
```

---

## 🔑  Logging In

After seeding the database the platform ships with a default admin account:

| Field | Value |
|-------|-------|
| Email | `admin@university.ac.zw` |
| Password | `Admin@123!` |

> **Important:** Change these credentials immediately in any shared or production environment.
> Override them at seed time with:
> ```bash
> SEED_ADMIN_EMAIL=you@youruni.ac.zw SEED_ADMIN_PASSWORD=Str0ng!Pass pnpm db:seed
> ```

### Login flow (web)

1. Open `http://localhost:3000/login`
2. Enter the email and password above
3. On success the token is stored in `localStorage` and you are redirected to `/admin`
4. All `/admin/*` pages redirect to `/login` if no valid token is found
5. Click **🚪 Logout** in the sidebar to clear the token and return to `/login`

### Login via API (curl / Postman)

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@university.ac.zw","password":"Admin@123!"}'
# Response: { "accessToken": "<jwt>", "user": { ... } }

# Use the token in subsequent requests:
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer <jwt>"
```

---

## 🖥  Admin UI Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/login` | Login page (email + password) |
| `/admin` | Dashboard with navigation cards (🔒 requires login) |
| `/admin/campuses` | List & create campuses (🔒) |
| `/admin/faculties` | List & create faculties (🔒) |
| `/admin/departments` | List & create departments (🔒) |
| `/admin/programs` | List & create programs (🔒) |

---

## 🔐  RBAC & Scoping

A `UserRoleAssignment` can be scoped to:

| `scopeType` | Meaning |
|-------------|---------|
| `GLOBAL` | User has the role across the whole system |
| `CAMPUS` | Role is scoped to a specific campus |
| `FACULTY` | Role is scoped to a specific faculty |
| `DEPARTMENT` | Role is scoped to a specific department |
| `PROGRAM` | Role is scoped to a specific program |

Example — assign Faculty Admin for Faculty of Science only:

```json
POST /api/v1/rbac/assign
{
  "userId": "<uuid>",
  "roleId": "<faculty-admin-role-uuid>",
  "scopeType": "FACULTY",
  "facultyId": "<faculty-uuid>"
}
```

---

## 🛠  Useful Commands

```bash
# Generate Prisma client after schema changes
pnpm db:generate

# Create a new migration
pnpm db:migrate:dev

# Open Prisma Studio (DB browser)
pnpm db:studio

# Format all files
pnpm format

# Lint all packages
pnpm lint
```

---

## 📁  Folder Structure (detailed)

```
apps/api/src/
├── app.module.ts
├── main.ts
├── auth/
│   ├── auth.module.ts / auth.service.ts / auth.controller.ts
│   ├── strategies/jwt.strategy.ts
│   ├── guards/jwt-auth.guard.ts | roles.guard.ts
│   └── decorators/roles.decorator.ts
├── audit/
│   ├── audit.module.ts / audit.service.ts
│   ├── audit.interceptor.ts      # auto-logs mutations
│   └── audit.controller.ts
├── campus / faculty / department / program
│   ├── *.module.ts / *.service.ts / *.controller.ts
│   └── dto/create-*.dto.ts | update-*.dto.ts
├── rbac/
│   ├── rbac.module.ts / rbac.service.ts / rbac.controller.ts
│   └── dto/rbac.dto.ts
├── config/config.module.ts
└── prisma/prisma.module.ts | prisma.service.ts

apps/web/src/
├── app/
│   ├── layout.tsx | page.tsx
│   ├── login/
│   │   └── page.tsx          # login form → stores JWT → redirects to /admin
│   └── admin/
│       ├── layout.tsx (sidebar nav + AdminGuard + LogoutButton)
│       ├── page.tsx  (dashboard)
│       ├── campuses/page.tsx
│       ├── faculties/page.tsx
│       ├── departments/page.tsx
│       └── programs/page.tsx
├── components/
│   ├── AdminGuard.tsx         # client-side route guard (redirects to /login)
│   ├── LogoutButton.tsx       # clears token + redirects to /login
│   └── EntityPage.tsx         # reusable CRUD table + form
└── lib/api.ts                 # fetch wrapper with JWT (includes login/logout helpers)

packages/db/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── package.json
```

---

## 🤝  Contributing

1. Branch from `main`
2. Follow the [issue board](https://github.com/IsaacIky/school-website/issues) — reference the issue number in your PR
3. Run `pnpm lint` and `pnpm format` before pushing
4. Keep PRs focused on one feature/module
