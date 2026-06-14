create or replace function app.raise_app_error(p_code text)
returns void
language plpgsql
as $$
begin
  raise exception '%', p_code using errcode = 'P0001';
end;
$$;
