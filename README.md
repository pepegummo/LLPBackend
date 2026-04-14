# LLP Backend — LLPBackend

NestJS REST API สำหรับระบบจัดการโปรเจกต์และประเมินผลนักศึกษา เชื่อมต่อกับ Supabase (PostgreSQL + Auth)

---

## Tech Stack

| Category | Library / Tool |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| Runtime | Node.js 20+ |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT Bearer token) |
| Validation | class-validator + class-transformer |
| Security | Helmet, NestJS Throttler |
| Testing | Jest + Supertest |

---

## How to Run

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env`:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
```

### 3. ตั้งค่า Database

ไปที่ **Supabase Dashboard → SQL Editor** แล้วรันไฟล์:

```
supabase/schema.sql
```

### 4. รัน Development Server

```bash
npm run start:dev
```

API พร้อมใช้งานที่ http://localhost:3001

### 5. Build Production

```bash
npm run build
npm run start:prod
```

### 6. รัน Tests

```bash
npm run test:e2e
```

---

## File Structure

```
LLPBackend/
├── src/
│   ├── main.ts                  # Bootstrap + Helmet + Throttler
│   ├── app.module.ts            # Root module
│   ├── auth/                    # JWT middleware — extract user จาก Authorization header
│   ├── common/
│   │   └── current-user.decorator.ts  # @CurrentUser() param decorator
│   ├── supabase/
│   │   └── supabase.service.ts  # Singleton Supabase client (service role)
│   ├── users/                   # GET /me, PATCH /me, PUT /me/contacts,
│   │   │                        # POST /me/change-password, GET /users/:id,
│   │   │                        # GET /users/search?email=
│   ├── workspaces/              # CRUD workspaces, admins, invite links
│   ├── projects/                # CRUD projects, project admins, invite links
│   ├── teams/                   # CRUD teams, members, invite links, display name
│   ├── tasks/                   # CRUD tasks, assignees, subtasks, attachments, tags
│   ├── evaluations/             # Peer evaluation + rubric weights (per workspace)
│   ├── meetings/                # CRUD meetings, attendees, notification settings
│   ├── chat/                    # Chat channels + messages
│   ├── tickets/                 # Tickets + ticket messages
│   ├── links/                   # Standalone links
│   ├── notifications/           # User notifications
│   └── health/                  # GET /health
└── supabase/
    └── schema.sql               # DDL ทั้งหมด — รันใน Supabase SQL Editor
```

---

## API Overview

| Resource | Endpoints |
|---|---|
| Auth | ใช้ Supabase Auth โดยตรง — ส่ง JWT ใน `Authorization: Bearer` |
| Users | `GET /api/users/me`, `PATCH /api/users/me`, `POST /api/me/change-password` |
| Workspaces | `GET/POST /api/workspaces`, `POST /api/workspaces/:id/admins/by-email`, `POST /api/workspaces/:id/invite-link` |
| Projects | `GET/POST /api/workspaces/:id/projects`, `POST /api/projects/:id/admins`, `POST /api/projects/:id/invite-link` |
| Teams | `GET/POST /api/projects/:id/teams`, `POST /api/teams/:id/invite-link`, `POST /api/teams/:id/invite-by-email` |
| Tasks | `GET/POST /api/teams/:id/tasks`, `PATCH /api/tasks/:id` |
| Evaluations | `POST /api/evaluations`, `GET /api/teams/:id/evaluations` |
| Rubric | `GET/PUT /api/workspaces/:id/rubric` (workspace owner only) |
| Meetings | `GET/POST /api/teams/:id/meetings` |
| Chat | `GET/POST /api/teams/:id/channels` |
| Tickets | `GET/POST /api/teams/:id/tickets` |
| Notifications | `GET /api/notifications` |
