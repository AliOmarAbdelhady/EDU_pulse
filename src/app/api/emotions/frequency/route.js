import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lectureId = searchParams.get("lectureId");
    const studentId = searchParams.get("studentId");

    const where = {};
    if (lectureId) where.lectureId = parseInt(lectureId, 10);
    if (studentId) where.studentId = parseInt(studentId, 10);

    const frequency = await prisma.emotionRecord.groupBy({
      by: ["emotion"],
      where,
      _count: {
        emotion: true,
      },
      orderBy: {
        _count: {
          emotion: "desc",
        },
      },
    });

    const formatted = frequency.map((item) => ({
      emotion: item.emotion,
      count: item._count.emotion,
    }));

    return NextResponse.json(formatted, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error("Error fetching emotion frequency:", error);
    return NextResponse.json(
      { error: "Failed to fetch emotion frequency" },
      { status: 500 }
    );
  }
}
