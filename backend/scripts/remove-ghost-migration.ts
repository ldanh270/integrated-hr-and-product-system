import { prisma } from "../src/libs/database.ts"

await prisma.$executeRaw`
  DELETE FROM "_prisma_migrations"
  WHERE migration_name = '20260616112539_okok'
`
console.log("Removed ghost migration 20260616112539_okok")
await prisma.$disconnect()
