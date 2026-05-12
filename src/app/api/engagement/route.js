import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function engagementCategory(score) {
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

function engagementTrend(records) {
  if (records.length < 2) return "STABLE";

  const midpoint = Math.ceil(records.length / 2);
  const firstAvg = average(records.slice(0, midpoint).map((r) => r.engagementScore || 0));
  const secondAvg = average(records.slice(midpoint).map((r) => r.engagementScore || 0));
  const delta = secondAvg - firstAvg;

  if (delta > 5) return "UP";
  if (delta < -5) return "DOWN";
  return "STABLE";
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lectureId = searchParams.get("lectureId");
    const studentId = searchParams.get("studentId");

    const where = {};
    if (lectureId) where.lectureId = parseInt(lectureId, 10);
    if (studentId) where.studentId = parseInt(studentId, 10);

    // Get aggregated engagement metrics from emotion_records
    const aggregation = await prisma.emotionRecord.aggregate({
      where,
      _avg: {
        engagementScore: true,
        focusScore: true,
        confidence: true,
      },
      _count: {
        recordId: true,
      },
      _min: {
        engagementScore: true,
        focusScore: true,
      },
      _max: {
        engagementScore: true,
        focusScore: true,
      },
    });

    const studentWhere = studentId ? where : { ...where, studentId: { not: null } };

    const groupedStudents = await prisma.emotionRecord.groupBy({
      by: ["studentId"],
      where: studentWhere,
      _avg: {
        engagementScore: true,
        focusScore: true,
      },
      _count: {
        recordId: true,
      },
      orderBy: {
        _avg: {
          engagementScore: "desc",
        },
      },
    });

    const studentIds = groupedStudents
      .map((item) => item.studentId)
      .filter(Boolean);

    const [students, studentRecords] = await Promise.all([
      studentIds.length
        ? prisma.student.findMany({
            where: { studentId: { in: studentIds } },
            select: {
              studentId: true,
              studentCode: true,
              fullName: true,
            },
          })
        : [],
      studentIds.length
        ? prisma.emotionRecord.findMany({
            where: studentWhere,
            select: {
              studentId: true,
              lectureId: true,
              recordedAt: true,
              engagementScore: true,
              focusScore: true,
              lecture: {
                select: {
                  assignment: {
                    select: {
                      course: {
                        select: {
                          courseCode: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { recordedAt: "asc" },
          })
        : [],
    ]);

    const studentInfo = new Map(students.map((student) => [student.studentId, student]));
    const recordsByStudent = new Map();
    for (const record of studentRecords) {
      const key = record.studentId;
      if (!recordsByStudent.has(key)) recordsByStudent.set(key, []);
      recordsByStudent.get(key).push(record);
    }

    const studentBreakdown = groupedStudents.map((item) => {
      const records = recordsByStudent.get(item.studentId) || [];
      const lectureIds = new Set(records.map((record) => record.lectureId));
      const courseCodes = new Set(
        records
          .map((record) => record.lecture?.assignment?.course?.courseCode)
          .filter(Boolean)
      );
      const avgEngagement = item._avg.engagementScore || 0;
      const avgFocus = item._avg.focusScore || 0;
      const student = studentInfo.get(item.studentId);

      return {
        studentId: item.studentId,
        studentCode: student?.studentCode || "",
        fullName: student?.fullName || "Unknown student",
        courseCodes: Array.from(courseCodes),
        lectureCount: lectureIds.size,
        avgEngagement,
        avgFocus,
        category: engagementCategory(avgEngagement),
        trend: engagementTrend(records),
        recordCount: item._count.recordId,
      };
    });

    // Get engagement over time (by time_minute within a lecture)
    let timeSeries = [];
    if (lectureId) {
      timeSeries = await prisma.emotionRecord.groupBy({
        by: ["timeMinute"],
        where,
        _avg: {
          engagementScore: true,
          focusScore: true,
        },
        _count: {
          recordId: true,
        },
        orderBy: {
          timeMinute: "asc",
        },
      });
    }

    return NextResponse.json({
      summary: {
        avgEngagementScore: aggregation._avg.engagementScore,
        avgFocusScore: aggregation._avg.focusScore,
        avgConfidence: aggregation._avg.confidence,
        totalRecords: aggregation._count.recordId,
        minEngagement: aggregation._min.engagementScore,
        maxEngagement: aggregation._max.engagementScore,
        minFocus: aggregation._min.focusScore,
        maxFocus: aggregation._max.focusScore,
      },
      studentBreakdown,
      timeSeries: timeSeries.map((t) => ({
        timeMinute: t.timeMinute,
        avgEngagement: t._avg.engagementScore,
        avgFocus: t._avg.focusScore,
        recordCount: t._count.recordId,
      })),
    });
  } catch (error) {
    console.error("Error fetching engagement:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagement data" },
      { status: 500 }
    );
  }
}
