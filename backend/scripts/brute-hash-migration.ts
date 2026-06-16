import { createHash, timingSafeEqual } from "node:crypto"

const target = "36b96b3f53231d6a6f96d88ac5bd3038547b9d401fa77a5123080e36f2b01927"

function secureHashEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  return timingSafeEqual(Buffer.from(left), Buffer.from(right))
}

const variants: string[] = [
  `-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_categoryId_fkey";

-- DropIndex
DROP INDEX "Task_categoryId_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "categoryId";

-- DropForeignKey
ALTER TABLE "TaskCategory" DROP CONSTRAINT "TaskCategory_projectId_fkey";

-- DropTable
DROP TABLE "TaskCategory";
`,
  `-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_categoryId_fkey";

-- DropIndex
DROP INDEX "Task_categoryId_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "TaskCategory";
`,
  `-- AlterTable
ALTER TABLE "Task" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "TaskCategory";
`,
  `-- DropForeignKey
ALTER TABLE "TaskCategory" DROP CONSTRAINT "TaskCategory_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_categoryId_fkey";

-- DropIndex
DROP INDEX "Task_categoryId_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "TaskCategory";
`,
]

for (const [index, sql] of variants.entries()) {
  const hash = createHash("sha256").update(sql).digest("hex")
  console.log(index, hash, secureHashEquals(hash, target) ? "MATCH" : "")
}

for (const [index, sql] of variants.entries()) {
  const crlf = sql.replace(/\n/g, "\r\n")
  const hash = createHash("sha256").update(crlf).digest("hex")
  if (secureHashEquals(hash, target)) console.log("CRLF match at", index)
}
