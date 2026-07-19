do $$
declare
  v_login jsonb;
  v_token text;
  v_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  v_viewer_id uuid := '00000000-0000-0000-0000-000000000002';
  v_project_id uuid := '00000000-0000-0000-0000-000000000010';
  v_release_id uuid := '00000000-0000-0000-0000-000000000020';
  v_result jsonb;
begin
  begin
    perform app.app_login('admin@example.com', 'wrong-password');
    raise exception 'expected INVALID_CREDENTIALS for bad password';
  exception
    when others then
      if sqlerrm <> 'INVALID_CREDENTIALS' then
        raise;
      end if;
  end;

  v_login := app.app_login('admin@example.com', 'password123');
  v_token := v_login ->> 'sessionToken';

  if v_token is null or length(v_token) = 0 then
    raise exception 'expected session token from login';
  end if;

  perform set_config('app.session_token', v_token, true);

  v_result := app.app_get_current_user();

  if v_result ->> 'email' <> 'admin@example.com' then
    raise exception 'expected current user email after login';
  end if;

  v_result := app.app_get_sample_dashboard(v_project_id);

  if v_result -> 'project' ->> 'name' <> 'Agentic SQL Demo' then
    raise exception 'expected project name in dashboard response';
  end if;

  perform set_config('app.session_token', v_token, true);
  perform app.app_logout();

  begin
    perform app.app_get_sample_dashboard(v_project_id);
    raise exception 'expected UNAUTHENTICATED after logout';
  exception
    when others then
      if sqlerrm <> 'UNAUTHENTICATED' then
        raise;
      end if;
  end;

  v_login := app.app_login('viewer@example.com', 'password123');
  perform set_config('app.session_token', v_login ->> 'sessionToken', true);

  begin
    perform app.app_transition_release(v_release_id, 'approved');
    raise exception 'expected PERMISSION_DENIED for viewer transition';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then
        raise;
      end if;
  end;
end $$;
