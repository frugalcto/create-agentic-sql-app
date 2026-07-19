insert into app.users (id, email, role, password_hash)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@example.com',
    'admin',
    crypt('password123', gen_salt('bf', 8))
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'viewer@example.com',
    'viewer',
    crypt('password123', gen_salt('bf', 8))
  )
on conflict (id) do update
set email = excluded.email,
    role = excluded.role,
    password_hash = excluded.password_hash;

insert into app.services (id, name)
values
  ('00000000-0000-0000-0000-000000000010', 'Checkout API'),
  ('00000000-0000-0000-0000-000000000011', 'Staging Checkout API')
on conflict (id) do update
set name = excluded.name;

insert into app.service_members (service_id, user_id, role)
values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'viewer'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'owner')
on conflict (service_id, user_id) do update
set role = excluded.role;

insert into app.releases (id, service_id, name, version, status)
values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'Checkout reliability release', '1.4.0', 'draft'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'Prior stable release', '1.3.2', 'approved')
on conflict (id) do update
set service_id = excluded.service_id,
    name = excluded.name,
    version = excluded.version,
    status = excluded.status;

insert into app.pull_requests (id, release_id, title, status)
values
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000020', 'Add payment retry handling', 'open'),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000020', 'Fix checkout timeout logging', 'open'),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000020', 'Update fraud check thresholds', 'open'),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000021', 'Patch logging', 'merged')
on conflict (id) do update
set release_id = excluded.release_id,
    title = excluded.title,
    status = excluded.status;

insert into app.incidents (id, service_id, title, severity, status)
values
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000010', 'Elevated payment authorization latency', 'high', 'open'),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000010', 'Duplicate webhook delivery', 'medium', 'open'),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000010', 'Resolved auth cache issue', 'critical', 'resolved')
on conflict (id) do update
set service_id = excluded.service_id,
    title = excluded.title,
    severity = excluded.severity,
    status = excluded.status;

insert into app.support_tickets (id, service_id, title, priority, status)
values
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000010', 'Customers report delayed checkout confirmation', 'high', 'open'),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000010', 'Dashboard export delay', 'normal', 'closed')
on conflict (id) do update
set service_id = excluded.service_id,
    title = excluded.title,
    priority = excluded.priority,
    status = excluded.status;
