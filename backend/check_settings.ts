import { prisma } from './src/libs/database.ts';
async function main() {
  const s = await prisma.payrollSettings.findUnique({where: {id: 'GLOBAL'}});
  console.log('DB Data:', s);
}
main().finally(() => prisma.$disconnect());
