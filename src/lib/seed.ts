import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function seedSuperAdmin() {
  try {
    // Check if super admin already exists
    const superAdmin = await prisma.user.findFirst({
      where: {
        role: "SUPER_ADMIN",
      },
    });

    if (!superAdmin) {
      // Get super admin credentials from environment variables
      const email = process.env.SUPER_ADMIN_EMAIL;
      const password = process.env.SUPER_ADMIN_PASSWORD;

      if (!email || !password) {
        console.warn("Super admin credentials not found in environment variables");
        return;
      }

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
