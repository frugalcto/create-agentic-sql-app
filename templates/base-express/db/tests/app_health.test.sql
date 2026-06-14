do $$
declare
  v_result jsonb;
begin
  v_result := app.app_health_check();

  if coalesce(v_result ->> 'status', '') <> 'ok' then
    raise exception 'expected health status ok, got %', v_result;
  end if;
end $$;
