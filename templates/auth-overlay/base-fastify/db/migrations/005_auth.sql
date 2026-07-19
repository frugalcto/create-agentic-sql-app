create extension if not exists pgcrypto;

alter table app.users
  add column if not exists password_hash text,
  add column if not exists disabled_at timestamptz;

create table if not exists app.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists sessions_token_hash_idx on app.sessions (token_hash);
create index if not exists sessions_user_expires_idx on app.sessions (user_id, expires_at);

create or replace function app.auth_session_token_hash(p_raw_token text)
returns text
language sql
immutable
set search_path = app, pg_temp
as $$
  select encode(digest(p_raw_token, 'sha256'), 'hex');
$$;

create or replace function app.auth_user_id()
returns uuid
language sql
stable
security definer
set search_path = app, pg_temp
as $$
  select s.user_id
  from app.sessions s
  where s.token_hash = app.auth_session_token_hash(current_setting('app.session_token', true))
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1;
$$;

create or replace function app.auth_require_user()
returns uuid
language plpgsql
stable
security definer
set search_path = app, pg_temp
as $$
declare
  v_user_id uuid;
begin
  begin
    perform current_setting('app.session_token', true);
  exception
    when others then
      perform app.raise_app_error('UNAUTHENTICATED');
  end;

  v_user_id := app.auth_user_id();

  if v_user_id is null then
    perform app.raise_app_error('UNAUTHENTICATED');
  end if;

  return v_user_id;
end;
$$;

create or replace function app.app_login(p_email text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = app, pg_temp
as $$
declare
  v_user app.users%rowtype;
  v_token text;
begin
  select *
  into v_user
  from app.users
  where lower(email) = lower(p_email)
    and disabled_at is null;

  if not found
    or v_user.password_hash is null
    or v_user.password_hash <> crypt(p_password, v_user.password_hash) then
    perform app.raise_app_error('INVALID_CREDENTIALS');
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into app.sessions (user_id, token_hash, expires_at)
  values (v_user.id, app.auth_session_token_hash(v_token), now() + interval '7 days');

  return jsonb_build_object(
    'sessionToken', v_token,
    'user', jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email
    )
  );
end;
$$;

create or replace function app.app_logout()
returns jsonb
language plpgsql
security definer
set search_path = app, pg_temp
as $$
begin
  update app.sessions
  set revoked_at = now()
  where token_hash = app.auth_session_token_hash(current_setting('app.session_token', true))
    and revoked_at is null;

  return jsonb_build_object('loggedOut', true);
end;
$$;

create or replace function app.app_get_current_user()
returns jsonb
language plpgsql
stable
security definer
set search_path = app, pg_temp
as $$
declare
  v_user_id uuid := app.auth_require_user();
  v_user app.users%rowtype;
begin
  select *
  into v_user
  from app.users
  where id = v_user_id;

  return jsonb_build_object(
    'id', v_user.id,
    'email', v_user.email
  );
end;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_runtime') then
    create role app_runtime login password 'app_runtime_dev';
  end if;
end $$;

revoke all on schema app from public;
revoke all on all tables in schema app from public;
revoke all on all sequences in schema app from public;
revoke all on all functions in schema app from public;

grant usage on schema app to app_runtime;
grant select, update on app.projects to app_runtime;
grant select on app.project_members to app_runtime;
grant select, update on app.release_items to app_runtime;
grant select on app.users to app_runtime;

grant execute on function app.app_health_check() to app_runtime;
grant execute on function app.app_login(text, text) to app_runtime;
grant execute on function app.app_logout() to app_runtime;
grant execute on function app.app_get_current_user() to app_runtime;
grant execute on function app.app_get_sample_dashboard(uuid) to app_runtime;
grant execute on function app.app_transition_release(uuid, text) to app_runtime;

alter table app.users enable row level security;
alter table app.users force row level security;
alter table app.projects enable row level security;
alter table app.projects force row level security;
alter table app.project_members enable row level security;
alter table app.project_members force row level security;
alter table app.release_items enable row level security;
alter table app.release_items force row level security;
alter table app.sessions enable row level security;
alter table app.sessions force row level security;

drop policy if exists users_self_select on app.users;
create policy users_self_select on app.users
  for select to app_runtime
  using (id = app.auth_user_id());

drop policy if exists projects_member_select on app.projects;
create policy projects_member_select on app.projects
  for select to app_runtime
  using (
    exists (
      select 1
      from app.project_members pm
      where pm.project_id = id
        and pm.user_id = app.auth_user_id()
    )
  );

drop policy if exists project_members_self_select on app.project_members;
create policy project_members_self_select on app.project_members
  for select to app_runtime
  using (user_id = app.auth_user_id());

drop policy if exists release_items_member_select on app.release_items;
create policy release_items_member_select on app.release_items
  for select to app_runtime
  using (
    exists (
      select 1
      from app.project_members pm
      where pm.project_id = release_items.project_id
        and pm.user_id = app.auth_user_id()
    )
  );

drop policy if exists release_items_owner_update on app.release_items;
create policy release_items_owner_update on app.release_items
  for update to app_runtime
  using (
    exists (
      select 1
      from app.project_members pm
      where pm.project_id = release_items.project_id
        and pm.user_id = app.auth_user_id()
        and pm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from app.project_members pm
      where pm.project_id = release_items.project_id
        and pm.user_id = app.auth_user_id()
        and pm.role = 'owner'
    )
  );

drop policy if exists sessions_no_access on app.sessions;
create policy sessions_no_access on app.sessions
  for all to app_runtime
  using (false);
