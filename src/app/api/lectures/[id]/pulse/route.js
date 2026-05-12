import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Pulse API — returns lecture timeline organized for live playback.
 * Each "tick" represents a minute of class with emotion stats and a smart suggestion
 * generated from the data pattern (so we can demo Live Lecture Pulse without
 * requiring the full socket-server pipeline).
 */

function buildSuggestion({ confusionRate, avgEngagement, boredRate, minuteIndex, baseline }) {
  if (confusionRate >= 0.5) {
    return {
      severity: "critical",
      icon: "alert",
      headline: "Major confusion detected",
      action: "Pause for 90 seconds. Recap the current concept with a concrete example, then take a quick Q&A.",
    };
  }
  if (confusionRate >= 0.3 && confusionRate - baseline >= 0.15) {
    return {
      severity: "high",
      icon: "alert",
      headline: "Confusion spike",
      action: "Topic transition likely caused this. Slow down, restate the key idea, and ask for a thumbs-up check.",
    };
  }
  if (boredRate >= 0.35) {
    return {
      severity: "medium",
      icon: "energy",
      headline: "Energy dropping",
      action: "Inject an active-learning prompt: 30-second pair share, or a quick poll.",
    };
  }
  if (avgEngagement < 0.45) {
    return {
      severity: "medium",
      icon: "energy",
      headline: "Engagement below average",
      action: "Change modality — switch from slides to whiteboard, or share a real-world example.",
    };
  }
  if (avgEngagement >= 0.75 && confusionRate < 0.15) {
    return {
      severity: "low",
      icon: "good",
      headline: "Class is locked in",
      action: "Great pace. Keep going — this is the moment to introduce the harder concept.",
    };
  }
  return {
    severity: "info",
    icon: "info",
    headline: "Class is steady",
    action: "Continue current approach. No intervention needed.",
  };
}

export async function GET(_request, { params }) {
  const { id } = await params;
  const lectureId = parseInt(id);

  const lecture = await prisma.lecture.findUnique({
    where: { lectureId },
    include: {
      assignment: {
        include: {
          course: { select: { courseCode: true, courseName: true } },
        },
      },
    },
  });
  if (!lecture) return Response.json({ error: "Not found" }, { status: 404 });

  const records = await prisma.emotionRecord.findMany({
    where: { lectureId },
    select: {
      timeMinute: true,
      emotion: true,
      engagementScore: true,
      focusScore: true,
      isPresent: true,
      studentId: true,
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
      },
      ticks: [],
    });
  }

  // Bucket by minute.
  const bucketMap = new Map();
  for (const r of records) {
    const k = r.timeMinute || 0;
    if (!bucketMap.has(k)) {
      bucketMap.set(k, {
        minute: k,
        emotions: { Happy: 0, Neutral: 0, Confused: 0, Bored: 0 },
        engagementSum: 0,
        focusSum: 0,
        count: 0,
        students: new Set(),
      });
    }
    const b = bucketMap.get(k);
    b.emotions[r.emotion] = (b.emotions[r.emotion] || 0) + 1;
    b.engagementSum += r.engagementScore || 0;
    b.focusSum += r.focusScore || 0;
    b.count += 1;
    if (r.studentId) b.students.add(r.studentId);
  }

  const sorted = Array.from(bucketMap.values()).sort((a, b) => a.minute - b.minute);

  // Build ticks with suggestions.
  const ticks = [];
  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i];
    const confused = m.emotions.Confused + m.emotions.Bored;
    const confusionRate = confused / m.count;
    const boredRate = m.emotions.Bored / m.count;
    const avgEngagement = m.engagementSum / m.count;

    // 3-minute rolling baseline
    const window = sorted.slice(Math.max(0, i - 3), i);
    const baseline = window.length
      ? window.reduce(
          (s, b) => s + (b.emotions.Confused + b.emotions.Bored) / b.count,
          0
        ) / window.length
      : 0;

    const suggestion = buildSuggestion({
      confusionRate,
      avgEngagement,
      boredRate,
      minuteIndex: i,
      baseline,
    });

    ticks.push({
      minute: m.minute,
      emotions: m.emotions,
      totalSamples: m.count,
      uniqueStudents: m.students.size,
      confusionRate: Math.round(confusionRate * 1000) / 1000,
      boredRate: Math.round(boredRate * 1000) / 1000,
      avgEngagement: Math.round(avgEngagement * 1000) / 1000,
      avgFocus: Math.round((m.focusSum / m.count) * 1000) / 1000,
      baseline: Math.round(baseline * 1000) / 1000,
      suggestion,
    });
  }

  return Response.json({
    lecture: {
      lectureId,
      lectureCode: lecture.lectureCode,
      lectureName: lecture.lectureName,
      course: lecture.assignment?.course,
    },
    ticks,
    totalMinutes: ticks.length,
  });
}
