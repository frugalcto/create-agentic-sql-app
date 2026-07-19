do $$
declare
  v_login jsonb;
  v_token text;
  v_service_id uuid := '00000000-0000-0000-0000-000000000010';
  v_release_id uuid := '00000000-0000-0000-0000-000000000020';
  v_result jsonb;
  v_risk jsonb;
begin
  v_login := app.app_login('admin@example.com', 'password123');
  v_token := v_login ->> 'sessionToken';
  perform set_config('app.session_token', v_token, true);

  v_risk := app.app_calculate_release_risk(v_release_id);

  if (v_risk ->> 'riskScore')::integer <> 37 then
    raise exception 'expected risk score 37, got %', v_risk;
  end if;

  v_result := app.app_get_release_risk_dashboard(v_service_id);

  if v_result -> 'service' ->> 'name' <> 'Checkout API' then
    raise exception 'expected service name in dashboard response';
  end if;

  perform set_config('app.session_token', v_token, true);
  perform app.app_logout();

  begin
    perform app.app_get_release_risk_dashboard(v_service_id);
    raise exception 'expected UNAUTHENTICATED after logout';
  exception
    when others then
      if sqlerrm <> 'UNAUTHENTICATED' then
        raise;
      end if;
  end;
end $$;
