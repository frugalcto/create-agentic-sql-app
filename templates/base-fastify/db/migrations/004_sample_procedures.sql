create or replace function app.app_health_check()
returns jsonb
language plpgsql
as $$
begin
  return jsonb_build_object('status', 'ok');
end;
$$;

create or replace function app.app_get_sample_dashboard(
  p_actor_user_id uuid,
  p_project_id uuid
)
returns jsonb
language plpgsql
as $$
declare
  v_project app.projects%rowtype;
  v_membership app.project_members%rowtype;
  v_releases jsonb;
begin
  select *
  into v_project
  from app.projects
  where id = p_project_id;

  if not found then
    perform app.raise_app_error('RELEASE_NOT_FOUND');
  end if;

  select *
  into v_membership
  from app.project_members
  where project_id = p_project_id
    and user_id = p_actor_user_id;

  if not found then
    perform app.raise_app_error('PERMISSION_DENIED');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', release_item.id,
        'name', release_item.name,
        'status', release_item.status
      )
      order by release_item.name
    ),
    '[]'::jsonb
  )
  into v_releases
  from app.release_items as release_item
  where release_item.project_id = p_project_id;

  return jsonb_build_object(
    'project',
    jsonb_build_object(
      'id', v_project.id,
      'name', v_project.name
    ),
    'actorRole', v_membership.role,
    'canTransitionReleases', v_membership.role = 'owner',
    'releases', v_releases
  );
end;
$$;

create or replace function app.app_transition_release(
  p_actor_user_id uuid,
  p_release_id uuid,
  p_target_status text
)
returns jsonb
language plpgsql
as $$
declare
  v_release app.release_items%rowtype;
  v_membership app.project_members%rowtype;
begin
  if p_target_status not in ('draft', 'approved', 'released') then
    perform app.raise_app_error('VALIDATION_FAILED');
  end if;

  select *
  into v_release
  from app.release_items
  where id = p_release_id;

  if not found then
    perform app.raise_app_error('RELEASE_NOT_FOUND');
  end if;

  select *
  into v_membership
  from app.project_members
  where project_id = v_release.project_id
    and user_id = p_actor_user_id;

  if not found or v_membership.role <> 'owner' then
    perform app.raise_app_error('PERMISSION_DENIED');
  end if;

  if v_release.status = 'draft' and p_target_status = 'approved' then
    update app.release_items
    set status = p_target_status
    where id = p_release_id
    returning * into v_release;
  elsif v_release.status = 'approved' and p_target_status = 'released' then
    update app.release_items
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
      'projectId', v_release.project_id,
      'name', v_release.name,
      'status', v_release.status
    )
  );
end;
$$;
