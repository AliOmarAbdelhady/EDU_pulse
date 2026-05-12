import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  andWhere,
  assignmentAccessWhere,
  courseAccessWhere,
  getSessionContext,
  studentGroupAccessWhere,
} from "@/lib/api/access";

export const revalidate = 120;

export async function GET(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    const filters = [courseAccessWhere(context)];

    if (departmentId) filters.push({ departmentId: parseInt(departmentId, 10) });

    const courses = await prisma.course.findMany({
      where: andWhere(...filters),
      include: {
        department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true,
          },
        },
        assignments: {
          where: assignmentAccessWhere(context),
          include: {
            lecturer: {
              include: {
                user: { select: { username: true, email: true } },
              },
            },
            group: {
              include: {
                _count: { select: { memberships: true } },
              },
            },
          },
        },
        studentGroups: {
          where: studentGroupAccessWhere(context),
          include: {
            _count: { select: { memberships: true } },
          },
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { courseId: "asc" },
    });

    return NextResponse.json(courses, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' } });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      courseCode,
      courseName,
      description,
      creditHours,
      departmentId,
    } = body;

    if (!courseCode || !courseName) {
      return NextResponse.json(
        { error: "Missing required fields: courseCode and courseName" },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        courseCode,
        courseName,
        description,
        creditHours: creditHours || 3,
        departmentId: departmentId ? parseInt(departmentId, 10) : null,
      },
      include: {
        department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true,
          },
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
