BEGIN;

SELECT plan(6);

SELECT throws_ok(
  $$SELECT app.app_get_sample_dashboard(
    '00000000-0000-0000-0000-000000000099'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid
  )$$,
  'P0001',
  'PERMISSION_DENIED',
  'sample dashboard denies unauthorized user'
);

SELECT ok(
  (
    SELECT
      (dashboard -> 'project' ->> 'name') IS NOT NULL
      AND jsonb_typeof(dashboard -> 'releases') = 'array'
    FROM (
      SELECT app.app_get_sample_dashboard(
        '00000000-0000-0000-0000-000000000001'::uuid,
        '00000000-0000-0000-0000-000000000010'::uuid
      ) AS dashboard
    ) AS shaped
  ),
  'sample dashboard returns expected JSON shape'
);

SELECT is(
  (
    SELECT transition -> 'release' ->> 'status'
    FROM (
      SELECT app.app_transition_release(
        '00000000-0000-0000-0000-000000000001'::uuid,
        '00000000-0000-0000-0000-000000000020'::uuid,
        'approved'
      ) AS transition
    ) AS approved
  ),
  'approved',
  'valid release transition succeeds'
);

UPDATE app.release_items
SET status = 'draft'
WHERE id = '00000000-0000-0000-0000-000000000020';

SELECT throws_ok(
  $$SELECT app.app_transition_release(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000020'::uuid,
    'released'
  )$$,
  'P0001',
  'RELEASE_INVALID_TRANSITION',
  'invalid release transition raises RELEASE_INVALID_TRANSITION'
);

SELECT throws_ok(
  $$SELECT app.app_transition_release(
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000020'::uuid,
    'approved'
  )$$,
  'P0001',
  'PERMISSION_DENIED',
  'viewer cannot transition release'
);

SELECT finish();

ROLLBACK;
