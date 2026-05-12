import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  andWhere,
  getSessionContext,
  studentAccessWhere,
} from "@/lib/api/access";

export const revalidate = 120;

export async function GET(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const scopedEmotionWhere =
      context.role === "lecturer"
        ? { lecture: { assignment: { lecturerId: context.lecturerId } } }
        : {};
    const scopedAttendanceWhere =
      context.role === "lecturer"
        ? { lecture: { assignment: { lecturerId: context.lecturerId } } }
        : {};
    const scopedMembershipWhere =
      context.role === "lecturer"
        ? {
            group: {
              assignments: {
                some: { lecturerId: context.lecturerId },
              },
            },
          }
        : {};

    const student = await prisma.student.findFirst({
      where: andWhere(
        { studentId: parseInt(id, 10) },
        studentAccessWhere(context)
      ),
      include: {
        user: { select: { username: true, email: true, isActive: true } },
        department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true,
          },
        },
        emotionRecords: {
          where: scopedEmotionWhere,
          take: 50,
          orderBy: { recordedAt: "desc" },
          include: {
            lecture: {
              select: {
                lectureId: true,
                lectureName: true,
                assignment: {
                  select: {
                    course: { select: { courseCode: true, courseName: true } },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            emotionRecords:
              context.role === "lecturer"
                ? { where: scopedEmotionWhere }
                : true,
            attendanceRecords:
              context.role === "lecturer"
                ? { where: scopedAttendanceWhere }
                : true,
            groupMemberships:
              context.role === "lecturer"
                ? { where: scopedMembershipWhere }
                : true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(student, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' } });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}
