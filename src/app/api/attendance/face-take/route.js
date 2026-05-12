import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionContext, assignmentAccessWhere } from "@/lib/api/access";

export async function POST(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "lecturer" && context.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { assignmentId, academicWeek, attendance } = body;

    if (!assignmentId || !academicWeek || !Array.isArray(attendance)) {
      return NextResponse.json(
        { error: "Missing assignmentId, academicWeek, or attendance" },
        { status: 400 }
      );
    }

    const assignmentScope = assignmentAccessWhere(context);
    const assignment = await prisma.lecturerCourseAssignment.findFirst({
      where: { assignmentId: Number(assignmentId), ...assignmentScope },
      include: {
        group: {
          include: {
            memberships: {
              where: { status: "active" },
              select: { studentId: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const validStudentIds = new Set(
      assignment.group.memberships.map((m) => m.studentId)
    );

    const operations = [];

    for (const record of attendance) {
      const { studentId, status } = record;
      if (!validStudentIds.has(studentId)) continue;
      if (!["Present", "Absent", "Late", "Excused"].includes(status)) continue;

      operations.push(
        prisma.courseWeekAttendance.upsert({
          where: {
            assignmentId_studentId_academicWeek: {
              assignmentId: assignment.assignmentId,
              studentId,
              academicWeek: Number(academicWeek),
            },
          },
          update: {
            status,
            notes: "Recorded via face recognition",
            recordedByUserId: context.userId,
          },
          create: {
            assignmentId: assignment.assignmentId,
            studentId,
            academicWeek: Number(academicWeek),
            status,
            notes: "Recorded via face recognition",
            recordedByUserId: context.userId,
          },
        })
      );
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    return NextResponse.json({
      success: true,
      recordsSaved: operations.length,
    });
  } catch (error) {
    console.error("Face attendance save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
