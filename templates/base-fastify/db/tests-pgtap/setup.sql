CREATE EXTENSION IF NOT EXISTS pgtap;

UPDATE app.release_items
SET status = 'draft'
WHERE id = '00000000-0000-0000-0000-000000000020';

UPDATE app.release_items
SET status = 'approved'
WHERE id = '00000000-0000-0000-0000-000000000021';
