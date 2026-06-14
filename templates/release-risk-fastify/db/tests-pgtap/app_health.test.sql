BEGIN;

SELECT plan(1);

SELECT is(
  (SELECT app.app_health_check() ->> 'status'),
  'ok',
  'health procedure returns ok'
);

SELECT finish();

ROLLBACK;
