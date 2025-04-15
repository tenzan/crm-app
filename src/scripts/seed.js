const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  try {
    // Check if super admin already exists
    const superAdmin = await prisma.user.findFirst({
      where: {
        role: "SUPER_ADMIN",
      },
    });

    if (!superAdmin) {
      // Get super admin credentials from environment variables
      const email = process.env.SUPER_ADMIN_EMAIL || "askar75@gmail.com";
      const password = process.env.SUPER_ADMIN_PASSWORD || "draJAMU7";

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the super admin user
      await prisma.user.create({
        data: {
          email,
          name: "Super Admin",
          password: hashedPassword,
          role: "SUPER_ADMIN",
        },
      });

      console.log("Super admin user created successfully");
    } else {
      console.log("Super admin user already exists");
    }
  } catch (error) {
    console.error("Error seeding super admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedSuperAdmin()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
