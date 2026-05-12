import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getBucketKey(recordedAt, period) {
  const date = new Date(recordedAt);

  if (period === "month") {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  if (period === "week") {
    const weekStart = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    ));
    const day = weekStart.getUTCDay() || 7;
    weekStart.setUTCDate(weekStart.getUTCDate() - day + 1);
    return weekStart.toISOString().split("T")[0];
  }

  return date.toISOString().split("T")[0];
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lectureId = searchParams.get("lectureId");
    const studentId = searchParams.get("studentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = ["day", "week", "month"].includes(searchParams.get("period"))
      ? searchParams.get("period")
      : "day";

    const where = {};
    if (lectureId) where.lectureId = parseInt(lectureId, 10);
    if (studentId) where.studentId = parseInt(studentId, 10);
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) where.recordedAt.lte = new Date(endDate);
    }

    const records = await prisma.emotionRecord.findMany({
      where,
      select: {
        recordedAt: true,
        emotion: true,
        confidence: true,
      },
      orderBy: { recordedAt: "asc" },
      take: 1000,
    });

    const groupedByDate = records.reduce((acc, record) => {
      const dateKey = getBucketKey(record.recordedAt, period);
      if (!acc[dateKey]) {
        acc[dateKey] = {};
      }
      if (!acc[dateKey][record.emotion]) {
        acc[dateKey][record.emotion] = { count: 0, totalConfidence: 0 };
      }
      acc[dateKey][record.emotion].count += 1;
      acc[dateKey][record.emotion].totalConfidence += record.confidence;
      return acc;
    }, {});

    const trends = Object.entries(groupedByDate).map(([date, emotions]) => {
      const emotionData = { date };
      Object.entries(emotions).forEach(([emotion, data]) => {
        emotionData[emotion] = data.count;
        emotionData[`${emotion}_avg_confidence`] =
          Math.round((data.totalConfidence / data.count) * 100) / 100;
      });
      return emotionData;
    });

    return NextResponse.json(trends, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error("Error fetching emotion trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch emotion trends" },
      { status: 500 }
    );
  }
}
