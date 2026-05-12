import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  andWhere,
  assignmentAccessWhere,
  getSessionContext,
  lectureAccessWhere,
} from "@/lib/api/access";

export const revalidate = 120;

const VALID_LECTURE_STATUSES = new Set([
  "scheduled",
  "in_progress",
  "analyzed",
  "cancelled",
]);

function parsePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDayName(date) {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

async function buildLectureCode() {
  const latestLecture = await prisma.lecture.findFirst({
    orderBy: { lectureId: "desc" },
    select: { lectureId: true },
  });

  return `L${(latestLecture?.lectureId || 0) + 1}`;
}

export async function GET(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");
    const semesterId = searchParams.get("semesterId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filters = [lectureAccessWhere(context)];

    if (assignmentId) filters.push({ assignmentId: parseInt(assignmentId, 10) });
    if (semesterId) filters.push({ semesterId });
    if (status) filters.push({ status });
    if (search) {
      filters.push({ lectureName: { contains: search, mode: "insensitive" } });
    }

    const lectures = await prisma.lecture.findMany({
      where: andWhere(...filters),
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
        _count: {
          select: { emotionRecords: true, attendanceRecords: true },
        },
      },
      orderBy: { lectureDate: "desc" },
    });

    return NextResponse.json(lectures, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' } });
  } catch (error) {
    console.error("Error fetching lectures:", error);
    return NextResponse.json(
      { error: "Failed to fetch lectures" },
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

    if (context.role !== "admin" && context.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      lectureCode,
      lectureName,
      assignmentId,
      academicWeek,
      lectureDate,
      dayName,
      startTime,
      endTime,
      roomId,
      status,
      notes,
      startNow,
    } = body;

    const parsedAssignmentId = parsePositiveInteger(assignmentId);
    const parsedAcademicWeek = parsePositiveInteger(academicWeek);

    if (!parsedAssignmentId || !parsedAcademicWeek) {
      return NextResponse.json(
        { error: "Course assignment and academic week are required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.lecturerCourseAssignment.findFirst({
      where: andWhere(
        { assignmentId: parsedAssignmentId },
        assignmentAccessWhere(context)
      ),
      select: {
        assignmentId: true,
        semesterId: true,
        course: {
          select: {
            courseCode: true,
            courseName: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const normalizedStatus =
      status === "completed" ? "analyzed" : status || (startNow ? "in_progress" : "scheduled");

    if (!VALID_LECTURE_STATUSES.has(normalizedStatus)) {
      return NextResponse.json({ error: "Invalid lecture status" }, { status: 400 });
    }

    const now = new Date();
    const startsImmediately = normalizedStatus === "in_progress" || startNow === true;
    const assignedDate = parseOptionalDate(lectureDate) || now;
    const assignedStartTime = startsImmediately
      ? now
      : parseOptionalDate(startTime);
    const assignedEndTime = parseOptionalDate(endTime);
    const assignedLectureCode =
      String(lectureCode || "").trim() || await buildLectureCode();
    const assignedLectureName =
      String(lectureName || "").trim() ||
      `${assignment.course.courseCode} Week ${parsedAcademicWeek} Lecture`;

    const lecture = await prisma.lecture.create({
      data: {
        lectureCode: assignedLectureCode,
        lectureName: assignedLectureName,
        assignmentId: parsedAssignmentId,
        semesterId: assignment.semesterId,
        academicWeek: parsedAcademicWeek,
        lectureDate: assignedDate,
        dayName: String(dayName || "").trim() || getDayName(assignedDate),
        startTime: assignedStartTime,
        endTime: assignedEndTime,
        roomId: roomId ? parseInt(roomId, 10) : null,
        status: normalizedStatus,
        notes,
      },
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

    return NextResponse.json(lecture, { status: 201 });
  } catch (error) {
    console.error("Error creating lecture:", error);
    return NextResponse.json(
      { error: "Failed to create lecture" },
      { status: 500 }
    );
  }
}
