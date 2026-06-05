create table if not exists roles (
  id serial primary key,
  name text not null unique
);

create table if not exists users (
  id serial primary key,
  email text not null unique,
  full_name text not null,
  role_id integer references roles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table users add column if not exists password_hash text;
alter table users add column if not exists is_active boolean not null default true;

create table if not exists sessions (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_expires_at_idx on sessions(expires_at);

create table if not exists orders (
  id serial primary key,
  external_id text not null unique,
  status text not null,
  assigned_team text not null,
  created_at timestamptz not null default now()
);

create table if not exists order_status_history (
  id serial primary key,
  order_id integer not null references orders(id) on delete cascade,
  previous_status text not null,
  next_status text not null,
  actor_email text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists order_notes (
  id serial primary key,
  order_id integer not null references orders(id) on delete cascade,
  actor_email text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id serial primary key,
  actor_email text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table audit_logs add column if not exists details text;

create table if not exists reports (
  id serial primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists report_jobs (
  id serial primary key,
  report_id integer not null references reports(id) on delete cascade,
  requested_by_email text not null,
  status text not null default 'pending',
  filters jsonb not null default '{}'::jsonb,
  artifact_name text,
  artifact_content text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

insert into roles (name)
values ('admin'), ('operations'), ('viewer')
on conflict (name) do nothing;

insert into users (email, full_name, role_id, is_active)
select 'admin.local@example.com', 'Local Admin', roles.id, true
from roles
where roles.name = 'admin'
on conflict (email) do nothing;

insert into users (email, full_name, role_id, is_active)
select 'ops.local@example.com', 'Ops Lead', roles.id, true
from roles
where roles.name = 'operations'
on conflict (email) do nothing;

insert into users (email, full_name, role_id, is_active)
select 'viewer.local@example.com', 'Read Only Analyst', roles.id, true
from roles
where roles.name = 'viewer'
on conflict (email) do nothing;

insert into orders (external_id, status, assigned_team)
values
  ('ORD-1001', 'pending_review', 'ops-core'),
  ('ORD-1002', 'processing', 'ops-core'),
  ('ORD-1003', 'shipped', 'warehouse-east'),
  ('ORD-1004', 'cancelled', 'ops-escalations')
on conflict (external_id) do nothing;

insert into reports (slug, name, description)
values
  (
    'orders-daily-export',
    'Daily Orders Export',
    'Full operational order export for handoffs and spreadsheet reviews.'
  ),
  (
    'orders-exceptions-export',
    'Exceptions Export',
    'Focused export for pending review and cancelled work queues.'
  )
on conflict (slug) do nothing;
