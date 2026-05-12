import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  andWhere,
  getSessionContext,
  lectureAccessWhere,
} from "@/lib/api/access";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");

    const filters = [lectureAccessWhere(context)];
    if (assignmentId) filters.push({ assignmentId: parseInt(assignmentId, 10) });

    const lectures = await prisma.lecture.findMany({
      where: andWhere(...filters),
      select: {
        lectureId: true,
        lectureCode: true,
        lectureName: true,
        lectureDate: true,
        assignment: {
          select: {
            course: {
              select: {
                courseCode: true,
                courseName: true,
              },
            },
          },
        },
      },
      orderBy: { lectureDate: "desc" },
    });

    const lectureIds = lectures.map((lecture) => lecture.lectureId);
    if (lectureIds.length === 0) {
      return NextResponse.json([]);
    }

    const grouped = await prisma.emotionRecord.groupBy({
      by: ["lectureId", "emotion"],
      where: { lectureId: { in: lectureIds } },
      _count: { emotion: true },
    });

    const emotionMap = new Map();
    for (const row of grouped) {
      const key = String(row.lectureId);
      const current = emotionMap.get(key) || {};
      current[row.emotion] = row._count.emotion;
      emotionMap.set(key, current);
    }

    const response = lectures.map((lecture) => {
      const emotions = emotionMap.get(String(lecture.lectureId)) || {};
      const totalRecords = Object.values(emotions).reduce((sum, count) => sum + count, 0);

      return {
        lectureId: lecture.lectureId,
        lectureCode: lecture.lectureCode,
        lectureName: lecture.lectureName,
        lectureDate: lecture.lectureDate,
        courseCode: lecture.assignment?.course?.courseCode || null,
        courseName: lecture.assignment?.course?.courseName || null,
        totalRecords,
        emotions,
      };
    });

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error("Error fetching lecture emotion breakdown:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecture emotion breakdown" },
      { status: 500 }
    );
  }
}
