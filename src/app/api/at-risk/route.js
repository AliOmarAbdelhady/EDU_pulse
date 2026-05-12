import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Compute a per-student risk score blending:
 *   - attendance rate          (35%)
 *   - confusion+bored rate     (25%)
 *   - avg engagement score     (25%)
 *   - course performance       (15%)
 *
 * Returns 0..100 (higher = more at risk) plus an explainable driver list.
 */
function computeRisk({ attendanceRate, confusionRate, avgEngagement, avgScore }) {
  // Normalize to a 0..1 risk per factor (higher = worse).
  // avgEngagement is on a 0..1 scale in the DB.
  const attendanceRisk = clamp(1 - attendanceRate);             // 0 attended → 1.0 risk
  const confusionRisk  = clamp(confusionRate * 2);              // 50%+ confused → max risk
  const engagementRisk = clamp(1 - avgEngagement);              // 0 engaged → 1.0 risk
  const performanceRisk = avgScore == null ? 0.5 : clamp(1 - (avgScore / 100));

  const score = (
    attendanceRisk  * 0.35 +
    confusionRisk   * 0.25 +
    engagementRisk  * 0.25 +
    performanceRisk * 0.15
  ) * 100;

  return Math.round(score * 10) / 10;
}

function clamp(v) {
  if (Number.isNaN(v) || v == null) return 0;
  return Math.max(0, Math.min(1, v));
}

function riskBand(score) {
  if (score >= 65) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function buildDrivers({ attendanceRate, confusionRate, avgEngagement, avgScore, absences }) {
  const drivers = [];
  const pct = (n) => `${Math.round(n * 100)}%`;

  if (attendanceRate < 0.7) {
    drivers.push({
      severity: "high",
      label: `Attendance ${pct(attendanceRate)} (target 80%+)`,
    });
  }
  if (absences >= 3) {
    drivers.push({
      severity: attendanceRate < 0.6 ? "high" : "medium",
      label: `${absences} absences this semester`,
    });
  }
  if (confusionRate > 0.30) {
    drivers.push({
      severity: confusionRate > 0.45 ? "high" : "medium",
      label: `Confusion rate ${pct(confusionRate)} during lectures`,
    });
  }
  if (avgEngagement < 0.5) {
    drivers.push({
      severity: avgEngagement < 0.3 ? "high" : "medium",
      label: `Avg engagement ${Math.round(avgEngagement * 100)}% (target 60%+)`,
    });
  }
  if (avgScore != null && avgScore < 60) {
    drivers.push({
      severity: avgScore < 50 ? "high" : "medium",
      label: `Course performance ${Math.round(avgScore)}/100`,
    });
  }

  if (drivers.length === 0) {
    drivers.push({ severity: "low", label: "All metrics within healthy range" });
  }
  return drivers;
}

function buildRecommendation(drivers, riskLevel) {
  if (riskLevel === "LOW") return "Continue current engagement strategy.";

  const tags = drivers.map((d) => d.label.toLowerCase()).join(" ");
  const tips = [];

  if (tags.includes("attendance") || tags.includes("absences")) {
    tips.push("Schedule a check-in to identify attendance blockers");
  }
  if (tags.includes("confusion")) {
    tips.push("Offer office hours or paired-study group for difficult topics");
  }
  if (tags.includes("engagement")) {
    tips.push("Introduce active-learning prompts during the next lecture");
  }
  if (tags.includes("performance")) {
    tips.push("Provide a personalized practice problem set + 1:1 review");
  }

  return tips.length ? tips.join(" • ") : "Schedule a 1-on-1 office hours session.";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const departmentId = searchParams.get("departmentId");
  const minRisk = parseFloat(searchParams.get("minRisk") || "0");
  const limit = parseInt(searchParams.get("limit") || "100");

  try {
    // 1. Load students (optionally filtered by department).
    const students = await prisma.student.findMany({
      where: departmentId ? { departmentId: parseInt(departmentId) } : undefined,
      include: {
        groupMemberships: {
          where: { status: "active" },
          include: { group: { include: { course: true } } },
        },
      },
    });

    if (students.length === 0) {
      return Response.json({ students: [], generatedAt: new Date().toISOString() });
    }

    const studentIds = students.map((s) => s.studentId);
    const courseIdNum = courseId ? parseInt(courseId) : null;

    // 2. Pull emotion + attendance + grade aggregates in one round-trip each.
    const [emotionAgg, attendanceAgg, results] = await Promise.all([
      // Emotion records grouped by student
      prisma.emotionRecord.findMany({
        where: {
          studentId: { in: studentIds },
          ...(courseIdNum
            ? { lecture: { assignment: { courseId: courseIdNum } } }
            : {}),
        },
        select: { studentId: true, emotion: true, engagementScore: true, isPresent: true },
      }),
      // Attendance grouped by student
      prisma.attendanceRecord.findMany({
        where: {
          studentId: { in: studentIds },
          ...(courseIdNum
            ? { lecture: { assignment: { courseId: courseIdNum } } }
            : {}),
        },
        select: { studentId: true, status: true, totalAbsenceMinutes: true, attendancePct: true },
      }),
      // Performance from final results
      prisma.studentCourseResult.findMany({
        where: {
          studentId: { in: studentIds },
          ...(courseIdNum ? { assignment: { courseId: courseIdNum } } : {}),
        },
        select: { studentId: true, totalScore: true, absenceCount: true, grade: true },
      }),
    ]);

    // 3. Build per-student aggregates.
    const byStudent = new Map(
      students.map((s) => [
        s.studentId,
        {
          studentId: s.studentId,
          studentCode: s.studentCode,
          fullName: s.fullName,
          courses: s.groupMemberships.map((m) => ({
            courseCode: m.group?.course?.courseCode,
            courseName: m.group?.course?.courseName,
          })),
          emotionCount: 0,
          confusionCount: 0,
          engagementSum: 0,
          attendanceTotal: 0,
          attendancePresent: 0,
          totalAbsenceMinutes: 0,
          absences: 0,
          scores: [],
        },
      ])
    );

    for (const r of emotionAgg) {
      const s = byStudent.get(r.studentId);
      if (!s) continue;
      s.emotionCount += 1;
      if (r.emotion === "Confused" || r.emotion === "Bored") s.confusionCount += 1;
      s.engagementSum += r.engagementScore || 0;
    }
    for (const r of attendanceAgg) {
      const s = byStudent.get(r.studentId);
      if (!s) continue;
      s.attendanceTotal += 1;
      if (r.status === "Present" || r.status === "Returned") s.attendancePresent += 1;
      s.totalAbsenceMinutes += r.totalAbsenceMinutes || 0;
    }
    for (const r of results) {
      const s = byStudent.get(r.studentId);
      if (!s) continue;
      s.scores.push(r.totalScore);
      s.absences = Math.max(s.absences, r.absenceCount || 0);
    }

    // 4. Score each student.
    const scored = Array.from(byStudent.values()).map((s) => {
      const attendanceRate = s.attendanceTotal ? s.attendancePresent / s.attendanceTotal : 0.5;
      const confusionRate = s.emotionCount ? s.confusionCount / s.emotionCount : 0;
      const avgEngagement = s.emotionCount ? s.engagementSum / s.emotionCount : 0.5;
      const avgScore = s.scores.length ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : null;
      const absences = s.absences;

      const inputs = { attendanceRate, confusionRate, avgEngagement, avgScore, absences };
      const riskScore = computeRisk(inputs);
      const riskLevel = riskBand(riskScore);
      const drivers = buildDrivers(inputs);
      const recommendation = buildRecommendation(drivers, riskLevel);

      return {
        studentId: s.studentId,
        studentCode: s.studentCode,
        fullName: s.fullName,
        courses: s.courses,
        riskScore,
        riskLevel,
        metrics: {
          attendanceRate: Math.round(attendanceRate * 1000) / 10,  // %
          confusionRate: Math.round(confusionRate * 1000) / 10,    // %
          avgEngagement: Math.round(avgEngagement * 1000) / 10,  // shown as %
          avgScore: avgScore == null ? null : Math.round(avgScore * 10) / 10,
          absences,
          lecturesAnalyzed: s.attendanceTotal,
        },
        drivers,
        recommendation,
      };
    });

    // 5. Filter + sort by risk descending.
    const filtered = scored
      .filter((s) => s.riskScore >= minRisk)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);

    return Response.json({
      students: filtered,
      summary: {
        total: scored.length,
        high: scored.filter((s) => s.riskLevel === "HIGH").length,
        medium: scored.filter((s) => s.riskLevel === "MEDIUM").length,
        low: scored.filter((s) => s.riskLevel === "LOW").length,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("at-risk error:", err);
    return Response.json({ error: "Failed to compute risk scores" }, { status: 500 });
  }
}
