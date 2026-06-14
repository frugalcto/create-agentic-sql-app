create table if not exists app.users (
  id uuid primary key,
  email text not null unique,
  role text not null check (role in ('admin', 'viewer'))
);

create table if not exists app.services (
  id uuid primary key,
  name text not null
);

create table if not exists app.service_members (
  service_id uuid not null references app.services(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  role text not null check (role in ('owner', 'viewer')),
  primary key (service_id, user_id)
);

create table if not exists app.releases (
  id uuid primary key,
  service_id uuid not null references app.services(id) on delete cascade,
  name text not null,
  version text not null,
  status text not null check (status in ('draft', 'approved', 'released'))
);

create table if not exists app.pull_requests (
  id uuid primary key,
  release_id uuid not null references app.releases(id) on delete cascade,
  title text not null,
  status text not null check (status in ('open', 'merged'))
);

create table if not exists app.incidents (
  id uuid primary key,
  service_id uuid not null references app.services(id) on delete cascade,
  title text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null check (status in ('open', 'resolved'))
);

create table if not exists app.support_tickets (
  id uuid primary key,
  service_id uuid not null references app.services(id) on delete cascade,
  title text not null,
  priority text not null check (priority in ('low', 'normal', 'high')),
  status text not null check (status in ('open', 'closed'))
);
