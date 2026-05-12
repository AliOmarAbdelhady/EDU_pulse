import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const EMOTION_KEYS = ["Happy", "Neutral", "Confused", "Bored"];

/**
 * Build a per-minute aggregate of emotions, engagement, and attendance for a single lecture,
 * plus an algorithm-detected list of "confusion spikes" with severity scoring.
 *
 * Spike rule: a minute is a spike if its confusion-rate
 *   (a) >= 0.30 AND
 *   (b) rose by >= 0.15 from a 3-minute rolling baseline.
 */
function detectSpikes(minutes) {
  const spikes = [];
  for (let i = 0; i < minutes.length; i++) {
    const m = minutes[i];
    if (m.totalSamples < 3) continue;

    // Rolling baseline = avg confusion rate over the previous 3 minutes (or what's available).
    const baselineWindow = minutes.slice(Math.max(0, i - 3), i);
    if (baselineWindow.length === 0) continue;
    const baseline =
      baselineWindow.reduce((s, b) => s + b.confusionRate, 0) /
      baselineWindow.length;

    if (m.confusionRate >= 0.3 && m.confusionRate - baseline >= 0.15) {
      spikes.push({
        minute: m.minute,
        confusionRate: m.confusionRate,
        baseline,
        magnitude: Math.round((m.confusionRate - baseline) * 1000) / 10, // pp delta
        affectedStudents: m.emotions.Confused + m.emotions.Bored,
        totalStudents: m.totalSamples,
        severity: m.confusionRate >= 0.5 ? "high" : "medium",
      });
    }
  }
  return spikes;
}

export async function GET(_request, { params }) {
  const { id } = await params;
  const lectureId = parseInt(id);

  try {
    const lecture = await prisma.lecture.findUnique({
      where: { lectureId },
      include: {
        assignment: {
          include: {
            course: { select: { courseCode: true, courseName: true } },
            lecturer: { select: { fullName: true } },
          },
        },
      },
    });

    if (!lecture) {
      return Response.json({ error: "Lecture not found" }, { status: 404 });
    }

    // Pull all emotion records for this lecture, sorted by time_minute.
    const records = await prisma.emotionRecord.findMany({
      where: { lectureId },
      select: {
        timeMinute: true,
        emotion: true,
        engagementScore: true,
        focusScore: true,
        isPresent: true,
        studentId: true,
        recordedAt: true,
      },
      orderBy: { timeMinute: "asc" },
    });

    if (records.length === 0) {
      return Response.json({
        lecture: {
          lectureId,
          lectureCode: lecture.lectureCode,
          lectureName: lecture.lectureName,
          course: lecture.assignment?.course,
          lecturer: lecture.assignment?.lecturer?.fullName,
        },
        timeline: [],
        spikes: [],
        summary: { totalSamples: 0, totalMinutes: 0 },
      });
    }

    // Bucket by minute.
    const bucketMap = new Map();
    for (const r of records) {
      const key = r.timeMinute || 0;
      if (!bucketMap.has(key)) {
        bucketMap.set(key, {
          minute: key,
          emotions: { Happy: 0, Neutral: 0, Confused: 0, Bored: 0 },
          engagementSum: 0,
          focusSum: 0,
          presentCount: 0,
          totalSamples: 0,
          uniqueStudents: new Set(),
        });
      }
      const b = bucketMap.get(key);
      b.emotions[r.emotion] = (b.emotions[r.emotion] || 0) + 1;
      b.engagementSum += r.engagementScore || 0;
      b.focusSum += r.focusScore || 0;
      if (r.isPresent) b.presentCount += 1;
      b.totalSamples += 1;
      if (r.studentId) b.uniqueStudents.add(r.studentId);
    }

    // Sort and finalize.
    const minutes = Array.from(bucketMap.values())
      .sort((a, b) => a.minute - b.minute)
      .map((b) => {
        const confused = b.emotions.Confused + b.emotions.Bored;
        return {
          minute: b.minute,
          emotions: b.emotions,
          totalSamples: b.totalSamples,
          uniqueStudents: b.uniqueStudents.size,
          avgEngagement: Math.round((b.engagementSum / b.totalSamples) * 1000) / 1000,
          avgFocus: Math.round((b.focusSum / b.totalSamples) * 1000) / 1000,
          confusionRate: Math.round((confused / b.totalSamples) * 1000) / 1000,
          attendanceRate: Math.round((b.presentCount / b.totalSamples) * 1000) / 1000,
        };
      });

    const spikes = detectSpikes(minutes);

    // Summary
    const peakConfusion = minutes.reduce(
      (best, m) => (m.confusionRate > best.confusionRate ? m : best),
      minutes[0]
    );
    const lowestEngagement = minutes.reduce(
      (worst, m) => (m.avgEngagement < worst.avgEngagement ? m : worst),
      minutes[0]
    );
    const totalUniqueStudents = new Set(records.map((r) => r.studentId).filter(Boolean)).size;

    return Response.json({
      lecture: {
        lectureId,
        lectureCode: lecture.lectureCode,
        lectureName: lecture.lectureName,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
        lectureDate: lecture.lectureDate,
        course: lecture.assignment?.course,
        lecturer: lecture.assignment?.lecturer?.fullName,
      },
      timeline: minutes,
      spikes,
      summary: {
        totalSamples: records.length,
        totalMinutes: minutes.length,
        totalUniqueStudents,
        peakConfusion: {
          minute: peakConfusion.minute,
          confusionRate: peakConfusion.confusionRate,
        },
        lowestEngagement: {
          minute: lowestEngagement.minute,
          avgEngagement: lowestEngagement.avgEngagement,
        },
        totalSpikes: spikes.length,
        avgEngagement:
          Math.round(
            (records.reduce((s, r) => s + (r.engagementScore || 0), 0) /
              records.length) *
              1000
          ) / 1000,
      },
    });
  } catch (err) {
    console.error("timeline error:", err);
    return Response.json({ error: "Failed to compute timeline" }, { status: 500 });
  }
}
