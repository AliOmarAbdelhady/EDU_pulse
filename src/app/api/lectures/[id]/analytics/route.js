import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionContext, lectureAccessWhere, andWhere } from "@/lib/api/access";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const lectureId = parseInt(id, 10);

    // Fetch lecture with emotion records
    const lecture = await prisma.lecture.findFirst({
      where: andWhere({ lectureId }, lectureAccessWhere(context)),
      include: {
        emotionRecords: {
          include: {
            student: {
              include: { user: { select: { email: true } } },
            },
          },
          orderBy: { recordedAt: "asc" },
        },
        alerts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const records = lecture.emotionRecords;
    const totalRecords = records.length;

    // Unique students
    const studentIds = [...new Set(records.map((r) => r.studentId).filter(Boolean))];
    const uniqueStudents = studentIds.length;

    // Emotion distribution
    const emotionCounts = {};
    for (const r of records) {
      emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
    }
    const emotionDistribution = Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: totalRecords > 0 ? Math.round((count / totalRecords) * 1000) / 10 : 0,
    }));

    // Averages
    const avgEngagement = totalRecords > 0
      ? Math.round(records.reduce((a, r) => a + (r.engagementScore || 0), 0) / totalRecords)
      : 0;
    const avgFocus = totalRecords > 0
      ? Math.round(records.reduce((a, r) => a + (r.focusScore || 0), 0) / totalRecords)
      : 0;

    // Dominant emotion
    const dominantEmotion = emotionDistribution.sort((a, b) => b.count - a.count)[0]?.emotion || "N/A";

    // Engagement timeline (by timeMinute)
    const minuteMap = {};
    for (const r of records) {
      const m = r.timeMinute || 0;
      if (!minuteMap[m]) minuteMap[m] = { timeMinute: m, totalEngagement: 0, totalFocus: 0, count: 0 };
      minuteMap[m].totalEngagement += r.engagementScore || 0;
      minuteMap[m].totalFocus += r.focusScore || 0;
      minuteMap[m].count += 1;
    }
    const engagementTimeline = Object.values(minuteMap)
      .sort((a, b) => a.timeMinute - b.timeMinute)
      .map((b) => ({
        timeMinute: b.timeMinute,
        avgEngagement: Math.round(b.totalEngagement / b.count),
        avgFocus: Math.round(b.totalFocus / b.count),
        recordCount: b.count,
      }));

    // Peak and lowest engagement minutes
    const peakMinute = engagementTimeline.reduce(
      (best, b) => (b.avgEngagement > (best?.avgEngagement || 0) ? b : best),
      null
    );
    const lowestMinute = engagementTimeline.reduce(
      (worst, b) => (b.avgEngagement < (worst?.avgEngagement || Infinity) ? b : worst),
      null
    );

    // Student breakdown
    const studentMap = {};
    for (const r of records) {
      if (!r.studentId) continue;
      if (!studentMap[r.studentId]) {
        studentMap[r.studentId] = {
          studentId: r.studentId,
          fullName: r.student?.fullName || "Unknown",
          email: r.student?.user?.email || "",
          records: [],
        };
      }
      studentMap[r.studentId].records.push(r);
    }
    const studentBreakdown = Object.values(studentMap).map((s) => {
      const avgE = s.records.reduce((a, r) => a + (r.engagementScore || 0), 0) / s.records.length;
      const avgF = s.records.reduce((a, r) => a + (r.focusScore || 0), 0) / s.records.length;
      const emoCounts = {};
      s.records.forEach((r) => { emoCounts[r.emotion] = (emoCounts[r.emotion] || 0) + 1; });
      const dominant = Object.entries(emoCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";
      return {
        studentId: s.studentId,
        fullName: s.fullName,
        email: s.email,
        avgEngagement: Math.round(avgE),
        avgFocus: Math.round(avgF),
        dominantEmotion: dominant,
        recordCount: s.records.length,
      };
    });

    // Duration
    const durationMinutes = lecture.startTime && lecture.endTime
      ? Math.round((new Date(lecture.endTime) - new Date(lecture.startTime)) / 60000)
      : null;

    // Emotion by segment (first third, middle third, last third)
    const segmentSize = Math.ceil(totalRecords / 3) || 1;
    const segments = [
      { segment: "First third", records: records.slice(0, segmentSize) },
      { segment: "Middle third", records: records.slice(segmentSize, segmentSize * 2) },
      { segment: "Last third", records: records.slice(segmentSize * 2) },
    ];
    const emotionBySegment = segments.map(({ segment, records: segRecords }) => {
      const counts = {};
      segRecords.forEach((r) => { counts[r.emotion] = (counts[r.emotion] || 0) + 1; });
      return { segment, emotionCounts: counts };
    });

    // Alerts
    const alertsList = lecture.alerts.map((a) => ({
      alertType: a.alertType,
      severity: a.severity,
      message: a.message,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({
      summary: {
        totalRecords,
        uniqueStudents,
        avgEngagement,
        avgFocus,
        dominantEmotion,
        peakEngagementMinute: peakMinute?.timeMinute || null,
        lowestEngagementMinute: lowestMinute?.timeMinute || null,
        durationMinutes,
      },
      emotionDistribution,
      engagementTimeline,
      studentBreakdown,
      alerts: alertsList,
      emotionBySegment,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
