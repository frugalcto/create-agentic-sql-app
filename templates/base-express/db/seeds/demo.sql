insert into app.users (id, email, role)
values
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'viewer@example.com', 'viewer')
on conflict (id) do update
set email = excluded.email,
    role = excluded.role;

insert into app.projects (id, name)
values ('00000000-0000-0000-0000-000000000010', 'Sample Project')
on conflict (id) do update
set name = excluded.name;

insert into app.project_members (project_id, user_id, role)
values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'viewer')
on conflict (project_id, user_id) do update
set role = excluded.role;

insert into app.release_items (id, project_id, name, status)
values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'Release Alpha', 'draft'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'Release Beta', 'approved')
on conflict (id) do update
set project_id = excluded.project_id,
    name = excluded.name,
    status = excluded.status;
