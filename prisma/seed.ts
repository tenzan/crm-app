import { seedSuperAdmin } from '../src/lib/seed.js';

async function main() {
  console.log('Start seeding...');
  await seedSuperAdmin();
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
