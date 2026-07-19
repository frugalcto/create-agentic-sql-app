do $$
declare
  v_login jsonb;
  v_token text;
  v_project_id uuid := '00000000-0000-0000-0000-000000000010';
  v_release_id uuid := '00000000-0000-0000-0000-000000000020';
  v_result jsonb;
begin
  v_login := app.app_login('admin@example.com', 'password123');
  v_token := v_login ->> 'sessionToken';
  perform set_config('app.session_token', v_token, true);

  begin
    perform app.app_get_sample_dashboard('00000000-0000-0000-0000-000000000099');
    raise exception 'expected RELEASE_NOT_FOUND for unknown project';
  exception
    when others then
      if sqlerrm <> 'RELEASE_NOT_FOUND' then
        raise;
      end if;
  end;

  v_result := app.app_get_sample_dashboard(v_project_id);

  if v_result -> 'project' ->> 'name' <> 'Agentic SQL Demo' then
    raise exception 'expected project name in dashboard response';
  end if;

  if jsonb_typeof(v_result -> 'releases') <> 'array' then
    raise exception 'expected releases array in dashboard response';
  end if;

  if coalesce((v_result ->> 'canTransitionReleases')::boolean, false) is distinct from true then
    raise exception 'expected owner canTransitionReleases=true';
  end if;

  v_result := app.app_transition_release(v_release_id, 'approved');

  if v_result -> 'release' ->> 'status' <> 'approved' then
    raise exception 'expected approved release status, got %', v_result;
  end if;

  update app.release_items
  set status = 'draft'
  where id = v_release_id;

  begin
    perform app.app_transition_release(v_release_id, 'released');
    raise exception 'expected RELEASE_INVALID_TRANSITION for draft-to-released path';
  exception
    when others then
      if sqlerrm <> 'RELEASE_INVALID_TRANSITION' then
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
