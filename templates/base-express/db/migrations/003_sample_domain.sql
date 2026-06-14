create table if not exists app.users (
  id uuid primary key,
  email text not null unique,
  role text not null check (role in ('admin', 'viewer'))
);

create table if not exists app.projects (
  id uuid primary key,
  name text not null
);

create table if not exists app.project_members (
  project_id uuid not null references app.projects(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  role text not null check (role in ('owner', 'viewer')),
  primary key (project_id, user_id)
);

create table if not exists app.release_items (
  id uuid primary key,
  project_id uuid not null references app.projects(id) on delete cascade,
  name text not null,
  status text not null check (status in ('draft', 'approved', 'released'))
);
