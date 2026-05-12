import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionContext, parsePositiveInt } from "@/lib/api/access";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = parsePositiveInt(searchParams.get("userId"));

    if (!requestedUserId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    if (context.role !== "admin" && context.userId !== requestedUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: requestedUserId },
    });

    if (!lecturer) {
      return NextResponse.json(
        { error: "Lecturer profile not found" },
        { status: 404 }
      );
    }

    const assignments = await prisma.lecturerCourseAssignment.findMany({
      where: { lecturerId: lecturer.lecturerId },
      include: {
        course: {
          select: {
            courseId: true,
            courseCode: true,
            courseName: true,
          },
        },
        group: {
          include: {
            _count: { select: { memberships: true } },
          },
        },
        lectures: {
          select: { lectureId: true },
        },
      },
    });

    const courses = assignments.map((a) => ({
      courseId: a.course.courseId,
      name: a.course.courseName,
      code: a.course.courseCode,
      studentCount: a.group._count.memberships,
      groupId: a.groupId,
    }));

    const assignmentIds = assignments.map((a) => a.assignmentId);

    const lectureIds = assignments.flatMap((a) =>
      a.lectures.map((l) => l.lectureId)
    );

    const avgEngagementResult = await prisma.emotionRecord.aggregate({
      where: { lectureId: { in: lectureIds } },
      _avg: { engagementScore: true },
    });

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const lecturesThisWeek = await prisma.lecture.count({
      where: {
        assignmentId: { in: assignmentIds },
        lectureDate: { gte: startOfWeek, lt: endOfWeek },
      },
    });

    const lecturesRemaining = await prisma.lecture.count({
      where: {
        assignmentId: { in: assignmentIds },
        lectureDate: { gte: now },
        status: "scheduled",
      },
    });

    const recentAlerts = await prisma.alertRecipient.findMany({
      where: { userId: requestedUserId },
      include: {
        alert: {
          include: {
            lecture: {
              select: { lectureName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const formattedAlerts = recentAlerts.map((ar) => ({
      id: ar.alertId,
      type: ar.alert.severity === "warning" || ar.alert.severity === "critical" ? "warning" : "success",
      message: ar.alert.message,
      time: ar.createdAt,
    }));

    const totalStudents = courses.reduce((sum, c) => sum + c.studentCount, 0);

    return NextResponse.json(
      {
        totalStudents,
        courses,
        avgEngagement: avgEngagementResult._avg.engagementScore
          ? Math.round(avgEngagementResult._avg.engagementScore * 100) / 100
          : 0,
        lecturesThisWeek,
        lecturesRemaining,
        recentAlerts: formattedAlerts,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    );
  } catch (error) {
    console.error("Error fetching lecturer stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecturer stats" },
      { status: 500 }
    );
  }
}
