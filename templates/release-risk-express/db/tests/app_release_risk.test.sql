do $$
declare
  v_result jsonb;
  v_risk jsonb;
  v_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  v_viewer_id uuid := '00000000-0000-0000-0000-000000000002';
  v_service_id uuid := '00000000-0000-0000-0000-000000000010';
  v_release_id uuid := '00000000-0000-0000-0000-000000000020';
  v_unknown_user_id uuid := '00000000-0000-0000-0000-000000000099';
begin
  v_risk := app.app_calculate_release_risk(v_release_id);

  if (v_risk ->> 'riskScore')::integer <> 37 then
    raise exception 'expected risk score 37, got %', v_risk;
  end if;

  if v_risk ->> 'riskLevel' <> 'medium' then
    raise exception 'expected medium risk level, got %', v_risk;
  end if;

  begin
    perform app.app_get_release_risk_dashboard(v_unknown_user_id, v_service_id);
    raise exception 'expected PERMISSION_DENIED for unauthorized dashboard access';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then
        raise;
      end if;
  end;

  v_result := app.app_get_release_risk_dashboard(v_owner_id, v_service_id);

  if v_result -> 'service' ->> 'name' <> 'Checkout API' then
    raise exception 'expected service name in dashboard response';
  end if;

  if jsonb_typeof(v_result -> 'releases') <> 'array' then
    raise exception 'expected releases array in dashboard response';
  end if;

  if coalesce((v_result ->> 'canTransitionReleases')::boolean, false) is distinct from true then
    raise exception 'expected owner canTransitionReleases=true';
  end if;

  if (v_result -> 'releases' -> 0 ->> 'riskScore') is null then
    raise exception 'expected riskScore in dashboard release payload';
  end if;

  v_result := app.app_transition_release(v_owner_id, v_release_id, 'approved');

  if v_result -> 'release' ->> 'status' <> 'approved' then
    raise exception 'expected approved release status, got %', v_result;
  end if;

  update app.releases
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
