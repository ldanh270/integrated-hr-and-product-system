import { prisma } from "../src/libs/database.ts"

const rows = await prisma.$queryRaw<
  {
    migration_name: string
    checksum: string
    logs: string | null
    finished_at: Date | null
  }[]
>`SELECT migration_name, checksum, logs, finished_at FROM "_prisma_migrations" ORDER BY started_at`

const tables = await prisma.$queryRaw<{ table_name: string }[]>`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'TaskCategory',
      'WeeklyScheduleTemplate',
      'RealShift'
    )
  ORDER BY table_name
`
console.log("tables:", tables)

const taskCols = await prisma.$queryRaw<{ column_name: string }[]>`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'Task'
    AND column_name IN ('categoryId')
`
console.log("task categoryId:", taskCols)

await prisma.$disconnect()
