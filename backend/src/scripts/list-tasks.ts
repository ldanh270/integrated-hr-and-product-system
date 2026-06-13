import { prisma } from "../libs/database"

async function main() {
  const admin = await prisma.employee.findFirst({
    where: { username: "admin" },
  })
  console.log("Admin Employee in database:")
  console.log(JSON.stringify(admin, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
