# Changelog — LLPBackend

## [Unreleased] — 2026-04-20

### `src/projects/projects.controller.ts`
- `create`: เพิ่ม `@CurrentUser()` — ส่ง `requesterId` ไปให้ service เพื่อตรวจสิทธิ์

### `src/projects/projects.service.ts`
- `create`: เพิ่ม permission check — ต้องเป็น workspace owner หรือ workspace admin เท่านั้น (เดิมไม่ check เลย)

## [Unreleased] — 2026-04-14

### `src/evaluations/evaluations.controller.ts`
- Route เปลี่ยนจาก `GET/PUT teams/:teamId/rubric` → `GET/PUT workspaces/:workspaceId/rubric`
- เพิ่ม `@CurrentUser()` ใน `upsertRubric` เพื่อตรวจสอบ workspace owner
- เพิ่ม `enabled` ใน request body ของ `upsertRubric`

### `src/evaluations/evaluations.service.ts`
- `getRubric(workspaceId)`: query ด้วย `workspace_id` แทน `team_id`, fallback คืน `enabled: false`
- `upsertRubric(workspaceId, requesterId, body)`: ตรวจสอบว่า requester เป็น workspace owner ก่อนอนุญาต, รองรับ `enabled` flag

### `src/projects/projects.controller.ts`
- เพิ่ม `POST projects/:id/admins` — เพิ่ม project admin ด้วย `userId` หรือ `email`
- เพิ่ม `DELETE projects/:id/admins/:adminId` — ลบ project admin (เฉพาะ workspace owner)
- เพิ่ม `POST projects/:id/invite-link` — สร้าง invite link
- เพิ่ม `POST projects/accept-invite/:token` — รับ invite แล้วเพิ่มเป็น project admin อัตโนมัติ

### `src/projects/projects.service.ts`
- `getByWorkspace`: เพิ่ม join `project_admins(user_id)` ใน select
- เพิ่ม `addAdmin`: ตรวจสอบสิทธิ์ (workspace owner / workspace admin / project admin)
- เพิ่ม `addAdminByEmail`: ค้นหา user จาก email แล้วเรียก `addAdmin`
- เพิ่ม `removeAdmin`: เฉพาะ workspace owner เท่านั้น
- เพิ่ม `createInviteLink`: บันทึกลง `invite_links` table
- เพิ่ม `acceptInviteLink`: ดึง link → เพิ่มเป็น project admin (ignore duplicate)

### `src/teams/teams.controller.ts`
- เพิ่ม `POST teams/:id/invite-by-email` — เชิญสมาชิกผ่าน email
- เพิ่ม `POST teams/:id/invite-link` — สร้าง invite link ของทีม
- เพิ่ม `POST teams/accept-invite/:token` — รับ invite เข้าทีมเป็น member อัตโนมัติ

### `src/teams/teams.service.ts`
- เพิ่ม `inviteByEmail`: ค้นหา user จาก email แล้วเรียก `invite`
- เพิ่ม `createInviteLink`: บันทึกลง `invite_links` table
- เพิ่ม `acceptInviteLink`: ดึง link → เพิ่มเป็น team member role `member` (ignore duplicate)

### `src/users/users.controller.ts`
- เพิ่ม `POST me/change-password`

### `src/users/users.service.ts`
- เพิ่ม `changePassword`: verify รหัสเดิมผ่าน Supabase Auth ก่อน แล้วค่อย update

### `src/workspaces/workspaces.controller.ts`
- เพิ่ม `POST :id/admins/by-email` — เพิ่ม admin ด้วย email
- เพิ่ม `POST :id/invite-link` — สร้าง invite link (เฉพาะ owner)
- เพิ่ม `POST accept-invite/:token` — รับ invite เข้า workspace

### `src/workspaces/workspaces.service.ts`
- `addAdmin`: แก้ให้ ignore duplicate key error แทนการ throw
- เพิ่ม `addAdminByEmail`: ค้นหา user จาก email + ignore duplicate
- เพิ่ม `createInviteLink`: เฉพาะ workspace owner เท่านั้น
- เพิ่ม `acceptInviteLink`: ดึง link → เพิ่มเป็น workspace admin (ignore duplicate)

### `supabase/schema.sql`
- `rubric_weights`: เปลี่ยน `team_id` → `workspace_id` (FK → workspaces), เพิ่ม `enabled boolean NOT NULL DEFAULT true`
- เพิ่มตาราง `project_admins (project_id, user_id)` พร้อม FK และ primary key
- เพิ่มตาราง `invite_links (id, type, target_id, created_by, created_at)`
