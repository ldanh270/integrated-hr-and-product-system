import { prisma } from './src/libs/database.ts';

async function main() {
  const employees = await prisma.employee.findMany();
  console.log(employees.map(e => ({ id: e.id, fullName: e.fullName, role: e.role, status: e.status })));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
