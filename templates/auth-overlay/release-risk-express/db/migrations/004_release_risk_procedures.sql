create or replace function app.app_health_check()
returns jsonb
language plpgsql
as $$
begin
  return jsonb_build_object('status', 'ok');
end;
$$;

create or replace function app.app_calculate_release_risk(p_release_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_release app.releases%rowtype;
  v_open_critical_incidents integer;
  v_open_high_incidents integer;
  v_open_medium_incidents integer;
  v_open_tickets integer;
  v_open_pull_requests integer;
  v_risk_score integer;
  v_risk_level text;
begin
  select *
  into v_release
  from app.releases
  where id = p_release_id;

  if not found then
    perform app.raise_app_error('RELEASE_NOT_FOUND');
  end if;

  select count(*)
  into v_open_critical_incidents
  from app.incidents
  where service_id = v_release.service_id
    and status = 'open'
    and severity = 'critical';

  select count(*)
  into v_open_high_incidents
  from app.incidents
  where service_id = v_release.service_id
    and status = 'open'
    and severity = 'high';

  select count(*)
  into v_open_medium_incidents
  from app.incidents
  where service_id = v_release.service_id
    and status = 'open'
    and severity = 'medium';

  select count(*)
  into v_open_tickets
  from app.support_tickets
  where service_id = v_release.service_id
    and status = 'open';

  select count(*)
  into v_open_pull_requests
  from app.pull_requests
  where release_id = p_release_id
    and status = 'open';

  v_risk_score :=
    (v_open_critical_incidents * 25) +
    (v_open_high_incidents * 15) +
    (v_open_medium_incidents * 8) +
    (v_open_tickets * 5) +
    (v_open_pull_requests * 3);

  if v_risk_score >= 50 then
    v_risk_level := 'high';
  elsif v_risk_score >= 20 then
    v_risk_level := 'medium';
  else
    v_risk_level := 'low';
  end if;

  return jsonb_build_object(
    'riskScore', v_risk_score,
    'riskLevel', v_risk_level,
    'riskFactors', jsonb_build_object(
      'openCriticalIncidents', v_open_critical_incidents,
      'openHighIncidents', v_open_high_incidents,
      'openMediumIncidents', v_open_medium_incidents,
      'openSupportTickets', v_open_tickets,
      'openPullRequests', v_open_pull_requests
    )
  );
end;
$$;

create or replace function app.app_get_release_risk_dashboard(
  p_service_id uuid
)
returns jsonb
language plpgsql
as $$
declare
  v_service app.services%rowtype;
  v_membership app.service_members%rowtype;
  v_actor uuid := app.auth_require_user();
  v_releases jsonb;
begin
  select *
  into v_service
  from app.services
  where id = p_service_id;

  if not found then
    perform app.raise_app_error('SERVICE_NOT_FOUND');
  end if;

  select *
  into v_membership
  from app.service_members
  where service_id = p_service_id
    and user_id = v_actor;

  if not found then
    perform app.raise_app_error('PERMISSION_DENIED');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', release_row.id,
        'name', release_row.name,
        'version', release_row.version,
        'status', release_row.status,
        'riskScore', (app.app_calculate_release_risk(release_row.id) ->> 'riskScore')::integer,
        'riskLevel', app.app_calculate_release_risk(release_row.id) ->> 'riskLevel',
        'riskFactors', app.app_calculate_release_risk(release_row.id) -> 'riskFactors'
      )
      order by release_row.name
    ),
    '[]'::jsonb
  )
  into v_releases
  from app.releases as release_row
  where release_row.service_id = p_service_id;

  return jsonb_build_object(
    'service',
    jsonb_build_object(
      'id', v_service.id,
      'name', v_service.name
    ),
    'actorRole', v_membership.role,
    'canTransitionReleases', v_membership.role = 'owner',
    'releases', v_releases
  );
end;
$$;

create or replace function app.app_transition_release(
  p_release_id uuid,
  p_target_status text
)
returns jsonb
language plpgsql
as $$
declare
  v_release app.releases%rowtype;
  v_membership app.service_members%rowtype;
  v_actor uuid := app.auth_require_user();
begin
  if p_target_status not in ('draft', 'approved', 'released') then
    perform app.raise_app_error('VALIDATION_FAILED');
  end if;

  select *
  into v_release
  from app.releases
  where id = p_release_id;

  if not found then
    perform app.raise_app_error('RELEASE_NOT_FOUND');
  end if;

  select *
  into v_membership
  from app.service_members
  where service_id = v_release.service_id
    and user_id = v_actor;

  if not found or v_membership.role <> 'owner' then
    perform app.raise_app_error('PERMISSION_DENIED');
  end if;

  if v_release.status = 'draft' and p_target_status = 'approved' then
    update app.releases
    set status = p_target_status
    where id = p_release_id
    returning * into v_release;
  elsif v_release.status = 'approved' and p_target_status = 'released' then
    update app.releases
    set status = p_target_status
    where id = p_release_id
    returning * into v_release;
  else
    perform app.raise_app_error('RELEASE_INVALID_TRANSITION');
  end if;

  return jsonb_build_object(
    'release',
    jsonb_build_object(
      'id', v_release.id,
      'serviceId', v_release.service_id,
      'name', v_release.name,
      'version', v_release.version,
      'status', v_release.status,
      'risk', app.app_calculate_release_risk(v_release.id)
    )
  );
end;
$$;
