-- ============================================================
-- LLP Project Management — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension (already on by default in Supabase)
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  first_name  text not null default '',
  last_name   text not null default '',
  bio         text,
  created_at  timestamptz not null default now()
);

create table if not exists public.contacts (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.profiles(id) on delete cascade,
  type     text not null, -- Email | Facebook | IG | Line | Discord | Phone
  value    text not null
);

-- ============================================================
-- WORKSPACES
-- ============================================================
create table if not exists public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_admins (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  primary key (workspace_id, user_id)
);

-- ============================================================
-- PROJECTS
-- ============================================================
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  description  text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- TEAMS
-- ============================================================
create table if not exists public.teams (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id),
  name         text not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id  uuid not null references public.teams(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  role     text not null check (role in ('team_leader', 'assistant_leader', 'member')),
  primary key (team_id, user_id)
);

create table if not exists public.team_invitations (
  team_id    uuid not null references public.teams(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists public.team_display_names (
  team_id      uuid not null references public.teams(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  primary key (team_id, user_id)
);

-- ============================================================
-- TAGS
-- ============================================================
create table if not exists public.tags (
  id      uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name    text not null,
  color   text not null
);

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null check (status in ('todo', 'in_progress', 'done')) default 'todo',
  start_date  date,
  due_date    date,
  man_hours   numeric,
  created_at  timestamptz not null default now()
);

create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

create table if not exists public.task_attachments (
  id      uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  label   text not null,
  url     text not null
);

create table if not exists public.task_tags (
  task_id uuid not null references public.tasks(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

create table if not exists public.subtasks (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  title      text not null,
  completed  boolean not null default false,
  man_hours  numeric,
  start_date date
);

create table if not exists public.subtask_assignees (
  subtask_id uuid not null references public.subtasks(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  primary key (subtask_id, user_id)
);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
create table if not exists public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references public.tasks(id) on delete set null,
  task_title text,
  team_id    uuid references public.teams(id) on delete set null,
  user_id    uuid references public.profiles(id) on delete set null,
  action     text not null,
  timestamp  timestamptz not null default now()
);

-- ============================================================
-- EVALUATIONS
-- ============================================================
create table if not exists public.evaluations (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references public.teams(id) on delete cascade,
  evaluator_id    uuid not null references public.profiles(id),
  evaluatee_id    uuid not null references public.profiles(id),
  score           int not null check (score between 1 and 5),
  contribution    int check (contribution between 1 and 5),
  quality_of_work int check (quality_of_work between 1 and 5),
  responsibility  int check (responsibility between 1 and 5),
  communication   int check (communication between 1 and 5),
  teamwork        int check (teamwork between 1 and 5),
  effort          int check (effort between 1 and 5),
  comment         text,
  submitted_at    timestamptz not null default now(),
  unique (team_id, evaluator_id, evaluatee_id)
);

create table if not exists public.rubric_weights (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references public.teams(id) on delete cascade unique,
  contribution    numeric not null default 16.67,
  quality_of_work numeric not null default 16.67,
  responsibility  numeric not null default 16.67,
  communication   numeric not null default 16.67,
  teamwork        numeric not null default 16.67,
  effort          numeric not null default 16.65
);

-- ============================================================
-- MEETINGS
-- ============================================================
create table if not exists public.meetings (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  topic       text not null,
  description text,
  link        text,
  datetime    timestamptz not null,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

create table if not exists public.meeting_attendees (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  primary key (meeting_id, user_id)
);

create table if not exists public.meeting_notifications (
  id             uuid primary key default gen_random_uuid(),
  meeting_id     uuid not null references public.meetings(id) on delete cascade,
  minutes_before int not null,
  label          text not null
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  message    text not null,
  read       boolean not null default false,
  meta       jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(read);

-- ============================================================
-- CHAT
-- ============================================================
create table if not exists public.chat_channels (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  name       text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  team_id    uuid not null references public.teams(id),
  sender_id  uuid references public.profiles(id),
  content    text not null,
  mentions   uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_channel_idx on public.chat_messages(channel_id, created_at desc);

-- ============================================================
-- LINKS
-- ============================================================
create table if not exists public.standalone_links (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  label      text not null,
  url        text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.link_tags (
  link_id uuid not null references public.standalone_links(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (link_id, tag_id)
);

-- ============================================================
-- TICKETS
-- ============================================================
create table if not exists public.tickets (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  student_id  uuid references public.profiles(id),
  title       text not null,
  description text not null,
  type        text not null check (type in ('question', 'request', 'feedback', 'issue')),
  status      text not null check (status in ('open', 'in_progress', 'resolved')) default 'open',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets(id) on delete cascade,
  sender_id  uuid references public.profiles(id),
  content    text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (basic policies)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.notifications enable row level security;
alter table public.chat_messages enable row level security;

-- Users can read any profile
create policy "profiles: read all" on public.profiles for select using (true);
-- Users can only update their own profile
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);

-- Users can only see their own notifications
create policy "notifications: own" on public.notifications
  for all using (auth.uid() = user_id);

-- Chat messages: team members can read (simplified — tighten per your needs)
create policy "chat_messages: read" on public.chat_messages for select using (true);
create policy "chat_messages: insert" on public.chat_messages for insert with check (auth.uid() = sender_id);
