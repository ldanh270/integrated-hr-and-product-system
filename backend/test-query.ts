import { prisma } from './src/libs/database';
import { PrismaApplicationRepository } from './src/repositories/application.repository';

const repo = new PrismaApplicationRepository(prisma);

async function main() {
  try {
    const res = await repo.findAll({ page: 1, pageSize: 10, status: 'pending', type: 'leave' } as any);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("ERROR OCCURRED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
