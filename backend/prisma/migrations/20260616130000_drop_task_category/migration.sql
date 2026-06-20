-- Idempotent: safe if an earlier duplicate migration already dropped these objects.
ALTER TABLE IF EXISTS "Task" DROP CONSTRAINT IF EXISTS "Task_categoryId_fkey";

DROP INDEX IF EXISTS "Task_categoryId_idx";

ALTER TABLE IF EXISTS "Task" DROP COLUMN IF EXISTS "categoryId";

ALTER TABLE IF EXISTS "TaskCategory" DROP CONSTRAINT IF EXISTS "TaskCategory_projectId_fkey";

DROP TABLE IF EXISTS "TaskCategory";
