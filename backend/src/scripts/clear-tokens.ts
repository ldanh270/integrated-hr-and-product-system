import { prisma } from "@/libs/database.ts"

const main = async () => {
  const deleted = await prisma.refreshToken.deleteMany({})
  console.log(`✅ Cleared ${deleted.count} refresh tokens from DB`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
