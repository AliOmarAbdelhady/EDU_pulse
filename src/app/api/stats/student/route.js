import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: parseInt(userId, 10) },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const [
      lecturesAttended,
      engagementAvg,
      emotionFrequency,
      coursesEnrolled,
      recentActivity,
    ] = await Promise.all([
      prisma.attendanceRecord.count({
        where: {
          studentId: student.studentId,
          status: "Present",
        },
      }),
      prisma.emotionRecord.aggregate({
        where: { studentId: student.studentId },
        _avg: { engagementScore: true },
      }),
      prisma.emotionRecord.groupBy({
        by: ["emotion"],
        where: { studentId: student.studentId },
        _count: { emotion: true },
        orderBy: { _count: { emotion: "desc" } },
        take: 1,
      }),
      prisma.groupMembership.count({
        where: { studentId: student.studentId },
      }),
      prisma.emotionRecord.findMany({
        where: { studentId: student.studentId },
        include: {
          lecture: {
            select: {
              lectureName: true,
              assignment: {
                select: {
                  course: { select: { courseName: true } },
                },
              },
            },
          },
        },
        orderBy: { recordedAt: "desc" },
        take: 5,
      }),
    ]);

    const recentActivityFormatted = recentActivity.map((r) => ({
      id: r.recordId,
      lecture: r.lecture.lectureName,
      courseName: r.lecture.assignment?.course?.courseName,
      emotion: r.emotion,
      confidence: r.confidence,
      engagementScore: r.engagementScore,
      recordedAt: r.recordedAt,
    }));

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const weeklyEngagement = await prisma.emotionRecord.groupBy({
      by: ["lectureId"],
      where: {
        studentId: student.studentId,
        recordedAt: { gte: sevenDaysAgo },
      },
      _avg: { engagementScore: true },
      _count: { recordId: true },
    });

    return NextResponse.json(
      {
        lecturesAttended,
        avgEngagement: engagementAvg._avg.engagementScore
          ? Math.round(engagementAvg._avg.engagementScore * 100) / 100
          : 0,
        dominantEmotion: emotionFrequency[0]?.emotion || "Neutral",
        coursesEnrolled,
        recentActivity: recentActivityFormatted,
        weeklyEngagement: weeklyEngagement.map((w) => ({
          lectureId: w.lectureId,
          avgEngagement: w._avg.engagementScore,
          recordCount: w._count.recordId,
        })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    );
  } catch (error) {
    console.error("Error fetching student stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch student stats" },
      { status: 500 }
    );
  }
}
