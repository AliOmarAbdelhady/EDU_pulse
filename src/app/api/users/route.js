import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const revalidate = 120;

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role, department, studentId, staffId } =
      body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userRole = role.toLowerCase();

    const user = await prisma.user.create({
      data: {
        username: name,
        email,
        passwordHash: hashedPassword,
        role: userRole,
      },
    });

    if (userRole === "student" && studentId) {
      await prisma.student.create({
        data: {
          userId: user.userId,
          studentCode: studentId,
          fullName: name,
          departmentId: department ? parseInt(department) : null,
          enrollmentYear: new Date().getFullYear(),
        },
      });
    } else if (userRole === "lecturer" && staffId) {
      await prisma.lecturer.create({
        data: {
          userId: user.userId,
          lecturerCode: staffId,
          fullName: name,
          departmentId: department ? parseInt(department) : null,
        },
      });
    } else if (userRole === "admin") {
      await prisma.admin.create({
        data: {
          userId: user.userId,
          fullName: name,
        },
      });
    }

    return NextResponse.json(
      { message: "Account created successfully", userId: user.userId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        student: true,
        lecturer: true,
        admin: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' } });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
