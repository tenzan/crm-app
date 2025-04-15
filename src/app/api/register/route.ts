import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, token, tenantId } = await request.json();

    if (!name || !email || !password || !token) {
      return NextResponse.json(
        { error: "Name, email, password, and token are required" },
        { status: 400 }
      );
    }

    // Validate the token
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
    });

    if (!magicLink) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    // Check if the token has expired
    if (new Date() > magicLink.expires) {
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 400 }
      );
    }

    // Check if the email matches the token
    if (magicLink.email !== email) {
      return NextResponse.json(
        { error: "Email does not match the invitation" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // If the user is registering as a tenant admin (from super admin invitation)
    if (!tenantId) {
      // Create a new tenant with the user's name as the tenant name
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      
      // Check if tenant with the same slug already exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug },
      });

      const finalSlug = existingTenant ? `${slug}-${Date.now()}` : slug;

      const tenant = await prisma.tenant.create({
        data: {
          name,
          slug: finalSlug,
        },
      });

      if (existingUser) {
        // Update the existing user
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            password: hashedPassword,
            role: "ADMIN",
            tenantId: tenant.id,
          },
        });
      } else {
        // Create a new user as tenant admin
        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "ADMIN",
            tenantId: tenant.id,
          },
        });
      }
    } 
    // If the user is registering as a customer (from tenant admin invitation)
    else {
      // Check if the tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return NextResponse.json(
          { error: "Invalid tenant" },
          { status: 400 }
        );
      }

      // Create a customer record
      await prisma.customer.create({
        data: {
          name,
          email,
          tenantId,
        },
      });

      if (existingUser) {
        // Update the existing user
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            password: hashedPassword,
            role: "USER",
            tenantId,
          },
        });
      } else {
        // Create a new user as customer
        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "USER",
            tenantId,
          },
        });
      }
    }

    // Delete the magic link
    await prisma.magicLink.delete({
      where: { id: magicLink.id },
    });

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
