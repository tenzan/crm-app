import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import Mailgun from "mailgun.js";
import formData from "form-data";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a super admin or admin
    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Set expiration time (24 hours from now)
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    // Save the magic link in the database
    await prisma.magicLink.create({
      data: {
        email,
        token,
        expires,
      },
    });

    // If the user is a super admin, create a new tenant
    if (session.user.role === "SUPER_ADMIN") {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!existingUser) {
        // Send magic link email
        const magicLinkUrl = `${process.env.NEXTAUTH_URL}/register?token=${token}`;
        
        await mg.messages.create(process.env.MAILGUN_DOMAIN || "", {
          from: process.env.MAILGUN_FROM_EMAIL || "no-reply@example.com",
          to: email,
          subject: "Complete your registration",
          text: `Click the following link to complete your registration: ${magicLinkUrl}`,
          html: `
            <h1>Welcome to CRM App</h1>
            <p>Click the following link to complete your registration:</p>
            <a href="${magicLinkUrl}">Complete Registration</a>
            <p>This link will expire in 24 hours.</p>
          `,
        });
      } else {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        );
      }
    } 
    // If the user is an admin, add a customer to their tenant
    else if (session.user.role === "ADMIN" && session.user.tenantId) {
      // Check if customer already exists in this tenant
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email,
          tenantId: session.user.tenantId,
        },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: "Customer already exists in this tenant" },
          { status: 400 }
        );
      }

      // Send magic link email
      const magicLinkUrl = `${process.env.NEXTAUTH_URL}/register?token=${token}&tenantId=${session.user.tenantId}`;
      
      await mg.messages.create(process.env.MAILGUN_DOMAIN || "", {
        from: process.env.MAILGUN_FROM_EMAIL || "no-reply@example.com",
        to: email,
        subject: "Complete your registration",
        text: `Click the following link to complete your registration: ${magicLinkUrl}`,
        html: `
          <h1>Welcome to CRM App</h1>
          <p>Click the following link to complete your registration:</p>
          <a href="${magicLinkUrl}">Complete Registration</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    }

    return NextResponse.json(
      { message: "Magic link sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending magic link:", error);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the magic link in the database
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

    return NextResponse.json(
      { 
        valid: true,
        email: magicLink.email
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating magic link:", error);
    return NextResponse.json(
      { error: "Failed to validate magic link" },
      { status: 500 }
    );
  }
}
