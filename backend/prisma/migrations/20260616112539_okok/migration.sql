-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_categoryId_fkey";

-- DropIndex
DROP INDEX "Task_categoryId_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "categoryId";

-- DropForeignKey
ALTER TABLE "TaskCategory" DROP CONSTRAINT "TaskCategory_projectId_fkey";

-- DropTable
DROP TABLE "TaskCategory";
