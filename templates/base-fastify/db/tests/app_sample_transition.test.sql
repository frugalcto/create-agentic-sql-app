do $$
declare
  v_result jsonb;
  v_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  v_viewer_id uuid := '00000000-0000-0000-0000-000000000002';
  v_project_id uuid := '00000000-0000-0000-0000-000000000010';
  v_release_id uuid := '00000000-0000-0000-0000-000000000020';
  v_unknown_user_id uuid := '00000000-0000-0000-0000-000000000099';
begin
  begin
    perform app.app_get_sample_dashboard(v_unknown_user_id, v_project_id);
    raise exception 'expected PERMISSION_DENIED for unauthorized dashboard access';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then
        raise;
      end if;
  end;

  v_result := app.app_get_sample_dashboard(v_owner_id, v_project_id);

  if v_result -> 'project' ->> 'name' is null then
    raise exception 'expected project name in dashboard response';
  end if;

  if jsonb_typeof(v_result -> 'releases') <> 'array' then
    raise exception 'expected releases array in dashboard response';
  end if;

  if coalesce((v_result ->> 'canTransitionReleases')::boolean, false) is distinct from true then
    raise exception 'expected owner canTransitionReleases=true';
  end if;

  v_result := app.app_transition_release(v_owner_id, v_release_id, 'approved');

  if v_result -> 'release' ->> 'status' <> 'approved' then
    raise exception 'expected approved release status, got %', v_result;
  end if;

  update app.release_items
  set status = 'draft'
  where id = v_release_id;

  begin
    perform app.app_transition_release(v_owner_id, v_release_id, 'released');
    raise exception 'expected RELEASE_INVALID_TRANSITION for draft-to-released path';
  exception
    when others then
      if sqlerrm <> 'RELEASE_INVALID_TRANSITION' then
        raise;
      end if;
  end;

  begin
    perform app.app_transition_release(v_viewer_id, v_release_id, 'approved');
    raise exception 'expected PERMISSION_DENIED for viewer transition';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then
        raise;
      end if;
  end;
end $$;
