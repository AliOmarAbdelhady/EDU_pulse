import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lectureId = searchParams.get("lectureId");
    const studentId = searchParams.get("studentId");
    const emotion = searchParams.get("emotion");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where = {};

    if (lectureId) where.lectureId = parseInt(lectureId, 10);
    if (studentId) where.studentId = parseInt(studentId, 10);
    if (emotion) where.emotion = emotion;
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) where.recordedAt.lte = new Date(endDate);
    }

    const emotions = await prisma.emotionRecord.findMany({
      where,
      include: {
        student: {
          select: {
            studentId: true,
            studentCode: true,
            fullName: true,
            user: { select: { userId: true, email: true } },
          },
        },
        lecture: {
          select: {
            lectureId: true,
            lectureCode: true,
            lectureName: true,
            assignment: {
              select: {
                course: { select: { courseCode: true, courseName: true } },
              },
            },
          },
        },
      },
      orderBy: { recordedAt: "desc" },
      take: 500,
    });

    return NextResponse.json(emotions, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error("Error fetching emotions:", error);
    return NextResponse.json(
      { error: "Failed to fetch emotions" },
      { status: 500 }
    );
  }
}
