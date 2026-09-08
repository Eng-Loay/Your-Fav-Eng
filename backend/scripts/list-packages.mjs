import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const rows = await prisma.membershipPackage.findMany();
  console.log(JSON.stringify(rows, null, 2));
}
main().finally(() => prisma.$disconnect());
