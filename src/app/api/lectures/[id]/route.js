import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  andWhere,
  assignmentAccessWhere,
  getSessionContext,
  lectureAccessWhere,
} from "@/lib/api/access";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const lecture = await prisma.lecture.findFirst({
      where: andWhere(
        { lectureId: parseInt(id, 10) },
        lectureAccessWhere(context)
      ),
      include: {
        assignment: {
          include: {
            lecturer: {
              include: {
                user: { select: { userId: true, username: true, email: true } },
              },
            },
            course: {
              select: {
                courseId: true,
                courseCode: true,
                courseName: true,
              },
            },
            group: {
              select: { groupId: true, groupCode: true, groupName: true },
            },
            semester: {
              select: { semesterId: true, semesterName: true },
            },
          },
        },
        room: {
          select: { roomId: true, roomNumber: true, building: true },
        },
        emotionRecords: {
          include: {
            student: {
              select: {
                studentId: true,
                studentCode: true,
                fullName: true,
                user: { select: { userId: true, email: true } },
              },
            },
          },
          orderBy: { recordedAt: "desc" },
        },
        attendanceRecords: {
          include: {
            student: {
              select: {
                studentId: true,
                studentCode: true,
                fullName: true,
                user: { select: { userId: true, email: true } },
              },
            },
          },
        },
        _count: {
          select: { emotionRecords: true, attendanceRecords: true },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json(
        { error: "Lecture not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(lecture);
  } catch (error) {
    console.error("Error fetching lecture:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecture" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "admin" && context.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const lectureId = parseInt(id, 10);

    const currentLecture = await prisma.lecture.findFirst({
      where: andWhere({ lectureId }, lectureAccessWhere(context)),
      select: { lectureId: true },
    });

    if (!currentLecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const data = {};
    if (body.lectureCode !== undefined) data.lectureCode = body.lectureCode;
    if (body.lectureName !== undefined) data.lectureName = body.lectureName;
    if (body.assignmentId !== undefined) {
      const assignmentId = parseInt(body.assignmentId, 10);
      const assignment = await prisma.lecturerCourseAssignment.findFirst({
        where: andWhere({ assignmentId }, assignmentAccessWhere(context)),
        select: { assignmentId: true },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Assignment not found" },
          { status: 404 }
        );
      }

      data.assignmentId = assignmentId;
    }
    if (body.semesterId !== undefined) data.semesterId = body.semesterId;
    if (body.academicWeek !== undefined) data.academicWeek = parseInt(body.academicWeek, 10);
    if (body.lectureDate !== undefined) data.lectureDate = new Date(body.lectureDate);
    if (body.dayName !== undefined) data.dayName = body.dayName;
    if (body.startTime !== undefined) data.startTime = body.startTime ? new Date(body.startTime) : null;
    if (body.endTime !== undefined) data.endTime = body.endTime ? new Date(body.endTime) : null;
    if (body.roomId !== undefined) data.roomId = body.roomId ? parseInt(body.roomId, 10) : null;
    if (body.status !== undefined) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;

    const lecture = await prisma.lecture.update({
      where: { lectureId },
      data,
      include: {
        assignment: {
          include: {
            lecturer: {
              include: {
                user: { select: { userId: true, username: true, email: true } },
              },
            },
            course: {
              select: {
                courseId: true,
                courseCode: true,
                courseName: true,
              },
            },
            group: {
              select: { groupId: true, groupCode: true, groupName: true },
            },
            semester: {
              select: { semesterId: true, semesterName: true },
            },
          },
        },
        room: {
          select: { roomId: true, roomNumber: true, building: true },
        },
      },
    });

    return NextResponse.json(lecture);
  } catch (error) {
    console.error("Error updating lecture:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Lecture not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update lecture" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "admin" && context.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const lectureId = parseInt(id, 10);
    const currentLecture = await prisma.lecture.findFirst({
      where: andWhere({ lectureId }, lectureAccessWhere(context)),
      select: { lectureId: true },
    });

    if (!currentLecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    await prisma.lecture.delete({
      where: { lectureId },
    });

    return NextResponse.json({ message: "Lecture deleted successfully" });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Lecture not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete lecture" },
      { status: 500 }
    );
  }
}
