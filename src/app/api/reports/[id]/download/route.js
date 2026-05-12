import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ---------- CSV helpers ----------
function escapeCell(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(","));
  }
  return lines.join("\r\n");
}

// ---------- Data fetchers per report type ----------

async function fetchEngagementRows({ entityType, entityId, startDate, endDate }) {
  const where = {};
  if (startDate || endDate) {
    where.recordedAt = {};
    if (startDate) where.recordedAt.gte = new Date(startDate);
    if (endDate) where.recordedAt.lte = new Date(endDate);
  }
  if (entityType === "course" && entityId) {
    where.lecture = { assignment: { courseId: parseInt(entityId) } };
  } else if (entityType === "student" && entityId) {
    where.studentId = parseInt(entityId);
  } else if (entityType === "lecture" && entityId) {
    where.lectureId = parseInt(entityId);
  }

  const records = await prisma.emotionRecord.findMany({
    where,
    include: {
      student: { select: { studentCode: true, fullName: true } },
      lecture: { select: { lectureCode: true, lectureName: true } },
    },
    orderBy: { recordedAt: "asc" },
  });

  return records.map((r) => ({
    student_code: r.student?.studentCode ?? "",
    student_name: r.student?.fullName ?? "",
    lecture_code: r.lecture?.lectureCode ?? "",
    lecture_name: r.lecture?.lectureName ?? "",
    recorded_at: r.recordedAt?.toISOString() ?? "",
    engagement_score: r.engagementScore,
    focus_score: r.focusScore,
    emotion: r.emotion,
    confidence: r.confidence,
    is_present: r.isPresent,
  }));
}

async function fetchEmotionRows({ entityType, entityId, startDate, endDate }) {
  const where = {};
  if (startDate || endDate) {
    where.recordedAt = {};
    if (startDate) where.recordedAt.gte = new Date(startDate);
    if (endDate) where.recordedAt.lte = new Date(endDate);
  }
  if (entityType === "lecture" && entityId) {
    where.lectureId = parseInt(entityId);
  } else if (entityType === "course" && entityId) {
    where.lecture = { assignment: { courseId: parseInt(entityId) } };
  } else if (entityType === "student" && entityId) {
    where.studentId = parseInt(entityId);
  }

  const records = await prisma.emotionRecord.findMany({
    where,
    include: {
      student: { select: { studentCode: true, fullName: true } },
      lecture: { select: { lectureCode: true, lectureName: true } },
    },
    orderBy: { recordedAt: "asc" },
  });

  return records.map((r) => ({
    student_code: r.student?.studentCode ?? "",
    student_name: r.student?.fullName ?? "",
    lecture_code: r.lecture?.lectureCode ?? "",
    lecture_name: r.lecture?.lectureName ?? "",
    recorded_at: r.recordedAt?.toISOString() ?? "",
    time_minute: r.timeMinute,
    emotion: r.emotion,
    confidence: r.confidence,
    engagement_score: r.engagementScore,
    focus_score: r.focusScore,
    source: r.source,
  }));
}

async function fetchAttendanceRows({ entityType, entityId, startDate, endDate }) {
  const where = {};
  if (entityType === "student" && entityId) {
    where.studentId = parseInt(entityId);
  } else if (entityType === "course" && entityId) {
    where.lecture = { assignment: { courseId: parseInt(entityId) } };
  } else if (entityType === "lecture" && entityId) {
    where.lectureId = parseInt(entityId);
  }
  if (startDate || endDate) {
    where.lecture = {
      ...(where.lecture || {}),
      lectureDate: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      },
    };
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: {
      student: { select: { studentCode: true, fullName: true } },
      lecture: {
        select: {
          lectureCode: true,
          lectureName: true,
          lectureDate: true,
          assignment: { include: { course: { select: { courseCode: true, courseName: true } } } },
        },
      },
    },
    orderBy: [{ lecture: { lectureDate: "asc" } }, { student: { studentCode: "asc" } }],
  });

  return records.map((r) => ({
    student_code: r.student?.studentCode ?? "",
    student_name: r.student?.fullName ?? "",
    course_code: r.lecture?.assignment?.course?.courseCode ?? "",
    course_name: r.lecture?.assignment?.course?.courseName ?? "",
    lecture_code: r.lecture?.lectureCode ?? "",
    lecture_name: r.lecture?.lectureName ?? "",
    lecture_date: r.lecture?.lectureDate?.toISOString().slice(0, 10) ?? "",
    status: r.status,
    first_seen_at: r.firstSeenAt?.toISOString() ?? "",
    last_seen_at: r.lastSeenAt?.toISOString() ?? "",
    total_absence_minutes: r.totalAbsenceMinutes ?? 0,
    attendance_pct: r.attendancePct ?? "",
  }));
}

async function fetchPerformanceRows({ entityType, entityId }) {
  const where = {};
  if (entityType === "student" && entityId) {
    where.studentId = parseInt(entityId);
  } else if (entityType === "course" && entityId) {
    where.assignment = { courseId: parseInt(entityId) };
  }

  const results = await prisma.studentCourseResult.findMany({
    where,
    include: {
      student: { select: { studentCode: true, fullName: true } },
      assignment: {
        include: {
          course: { select: { courseCode: true, courseName: true } },
          lecturer: { select: { fullName: true } },
        },
      },
    },
    orderBy: [{ assignment: { course: { courseCode: "asc" } } }, { student: { studentCode: "asc" } }],
  });

  return results.map((r) => ({
    student_code: r.student?.studentCode ?? "",
    student_name: r.student?.fullName ?? "",
    course_code: r.assignment?.course?.courseCode ?? "",
    course_name: r.assignment?.course?.courseName ?? "",
    lecturer: r.assignment?.lecturer?.fullName ?? "",
    absence_count: r.absenceCount,
    coursework_score: r.courseworkScore,
    final_exam_score: r.finalExamScore,
    total_score: r.totalScore,
    grade: r.grade,
    status: r.status,
    calculated_at: r.calculatedAt?.toISOString().slice(0, 10) ?? "",
  }));
}

// ---------- Route handler ----------

export async function GET(request, { params }) {
  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { reportId: parseInt(id) },
  });

  if (!report) {
    return new Response(JSON.stringify({ error: "Report not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const p = report.parameters || {};
  const type = p.originalType || report.reportType;
  const opts = {
    entityType: p.entityType,
    entityId: p.entityId,
    startDate: p.startDate,
    endDate: p.endDate,
  };

  let rows = [];
  try {
    if (type === "engagement") rows = await fetchEngagementRows(opts);
    else if (type === "emotion") rows = await fetchEmotionRows(opts);
    else if (type === "attendance") rows = await fetchAttendanceRows(opts);
    else if (type === "performance") rows = await fetchPerformanceRows(opts);
    else rows = await fetchEmotionRows(opts); // fallback
  } catch (err) {
    console.error("CSV generation error:", err);
    return new Response(JSON.stringify({ error: "Failed to generate CSV" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const csv = rows.length
    ? toCSV(rows)
    : "No data found for the selected parameters.\r\n";

  const filename = `${type}_report_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
