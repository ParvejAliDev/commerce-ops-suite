create table if not exists roles (
  id serial primary key,
  name text not null unique
);

create table if not exists users (
  id serial primary key,
  email text not null unique,
  full_name text not null,
  role_id integer references roles(id),
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id serial primary key,
  external_id text not null unique,
  status text not null,
  assigned_team text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id serial primary key,
  actor_email text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  created_at timestamptz not null default now()
);

insert into roles (name)
values ('admin'), ('operations'), ('viewer')
on conflict (name) do nothing;

insert into users (email, full_name, role_id)
select 'admin.local@example.com', 'Local Admin', roles.id
from roles
where roles.name = 'admin'
on conflict (email) do nothing;

insert into orders (external_id, status, assigned_team)
values ('ORD-1001', 'pending_review', 'ops-core')
on conflict (external_id) do nothing;
