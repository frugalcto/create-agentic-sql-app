create schema if not exists app;
create schema if not exists test;

create table if not exists app.schema_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
);
