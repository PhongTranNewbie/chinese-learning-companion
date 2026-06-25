import { prisma } from "../src/lib/db";

const levels = [
  { code: "HSK1", name: "HSK 1", sortOrder: 1 },
  { code: "HSK2", name: "HSK 2", sortOrder: 2 },
  { code: "HSK3", name: "HSK 3", sortOrder: 3 },
  { code: "HSK4", name: "HSK 4", sortOrder: 4 },
  { code: "HSK5", name: "HSK 5", sortOrder: 5 },
  { code: "HSK6", name: "HSK 6", sortOrder: 6 },
];

async function main() {
  for (const level of levels) {
    await prisma.level.upsert({
      where: { code: level.code },
      update: {
        name: level.name,
        sortOrder: level.sortOrder,
      },
      create: level,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
