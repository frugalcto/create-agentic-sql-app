-- Reset mutable demo data before each database test run.
update app.release_items
set status = 'draft'
where id = '00000000-0000-0000-0000-000000000020';

update app.release_items
set status = 'approved'
where id = '00000000-0000-0000-0000-000000000021';
