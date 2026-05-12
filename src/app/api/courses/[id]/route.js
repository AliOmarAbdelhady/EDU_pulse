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

export async function GET(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const course = await prisma.course.findFirst({
      where: andWhere(
        { courseId: parseInt(id, 10) },
        courseAccessWhere(context)
      ),
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
                memberships: {
                  include: {
                    student: {
                      include: {
                        user: { select: { username: true, email: true } },
                      },
                    },
                  },
                },
              },
            },
            semester: {
              select: { semesterId: true, semesterName: true },
            },
          },
        },
        studentGroups: {
          where: studentGroupAccessWhere(context),
          include: {
            memberships: {
              include: {
                student: {
                  include: {
                    user: { select: { username: true, email: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(course, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' } });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}
