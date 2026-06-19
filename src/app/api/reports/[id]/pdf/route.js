import prisma from "@/lib/prisma";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

const PYTHON_BACKEND = process.env.PYTHON_SERVICE_URL || "http://localhost:8001";
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || "edupulse-internal-key";

// EDU Pulse brand colors
const COLORS = {
  primary: "#3b82f6",
  dark: "#1e293b",
  muted: "#64748b",
  light: "#f1f5f9",
  border: "#e2e8f0",
  happy: "#10b981",
  neutral: "#6b7280",
  confused: "#f59e0b",
  bored: "#ef4444",
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

// ---------- Risk / metric helpers ----------

function classifyRisk(attendanceRate, confusionRate, avgEngagement) {
  let score = 0;
  if (attendanceRate != null) score += (1 - attendanceRate) * 35;
  if (confusionRate != null) score += Math.min(confusionRate * 2, 1) * 25;
  if (avgEngagement != null) score += (1 - avgEngagement) * 25;
  if (score >= 65) return { level: "HIGH", color: COLORS.high };
  if (score >= 40) return { level: "MEDIUM", color: COLORS.medium };
  return { level: "LOW", color: COLORS.low };
}

// ---------- PDF helpers ----------

function drawHeader(doc, report) {
  doc.fillColor(COLORS.dark).fontSize(22).font("Helvetica-Bold")
    .text("EDU Pulse", 50, 50);
  doc.fillColor(COLORS.primary).fontSize(10).font("Helvetica")
    .text("AI-Powered Education Analytics", 50, 76);

  doc.fillColor(COLORS.muted).fontSize(9)
    .text(`Generated: ${new Date(report.completedAt || report.createdAt).toLocaleString("en-US")}`,
          400, 50, { align: "right", width: 145 });
  doc.text(`Report #${report.reportId}`, 400, 65, { align: "right", width: 145 });

  // Divider
  doc.strokeColor(COLORS.border).lineWidth(1)
    .moveTo(50, 100).lineTo(545, 100).stroke();
}

function drawTitle(doc, title, subtitle) {
  doc.fillColor(COLORS.dark).fontSize(24).font("Helvetica-Bold")
    .text(title, 50, 120);
  if (subtitle) {
    doc.fillColor(COLORS.muted).fontSize(11).font("Helvetica")
      .text(subtitle, 50, 150);
  }
}

function drawStatCard(doc, x, y, label, value, sub = "", color = COLORS.primary) {
  const w = 115, h = 70;
  doc.roundedRect(x, y, w, h, 6)
    .fillAndStroke(COLORS.light, COLORS.border);

  doc.fillColor(color).fontSize(20).font("Helvetica-Bold")
    .text(String(value), x + 10, y + 12, { width: w - 20 });
  doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica")
    .text(label, x + 10, y + 40, { width: w - 20 });
  if (sub) {
    doc.fillColor(COLORS.muted).fontSize(8)
      .text(sub, x + 10, y + 53, { width: w - 20 });
  }
}

function drawSectionTitle(doc, text, y) {
  doc.fillColor(COLORS.primary).fontSize(13).font("Helvetica-Bold")
    .text(text.toUpperCase(), 50, y);
  doc.strokeColor(COLORS.primary).lineWidth(2)
    .moveTo(50, y + 18).lineTo(120, y + 18).stroke();
  return y + 30;
}

function drawBarChart(doc, x, y, w, h, data, title) {
  // data = [{ label, value, color }, ...]
  if (title) {
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold")
      .text(title, x, y);
    y += 22;
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    doc.fillColor(COLORS.muted).fontSize(10).font("Helvetica")
      .text("No data", x, y);
    return y + 20;
  }

  const max = Math.max(...data.map((d) => d.value));
  const labelWidth = 80;
  const valueWidth = 40;
  const barAreaWidth = w - labelWidth - valueWidth - 20;
  const rowHeight = h / data.length;
  const barHeight = Math.min(rowHeight - 6, 18);

  data.forEach((d, i) => {
    const rowY = y + i * rowHeight;
    const barWidth = max > 0 ? (d.value / max) * barAreaWidth : 0;

    // Label
    doc.fillColor(COLORS.dark).fontSize(10).font("Helvetica")
      .text(d.label, x, rowY + (rowHeight - 12) / 2, { width: labelWidth });

    // Bar background
    doc.roundedRect(x + labelWidth, rowY + (rowHeight - barHeight) / 2, barAreaWidth, barHeight, 3)
      .fillColor(COLORS.light).fill();

    // Bar
    if (barWidth > 0) {
      doc.roundedRect(x + labelWidth, rowY + (rowHeight - barHeight) / 2, barWidth, barHeight, 3)
        .fillColor(d.color || COLORS.primary).fill();
    }

    // Value
    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
    doc.fillColor(COLORS.dark).fontSize(10).font("Helvetica-Bold")
      .text(`${d.value} (${pct}%)`, x + labelWidth + barAreaWidth + 8,
            rowY + (rowHeight - 12) / 2, { width: valueWidth + 20 });
  });

  return y + h + 10;
}

function drawWrappedParagraph(doc, text, x, y, width) {
  doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica");
  doc.text(text, x, y, { width, align: "justify", lineGap: 3 });
  return doc.y + 10;
}

function drawInsightBox(doc, text, severity, y) {
  const colors = {
    high:   { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
    medium: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
    low:    { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  }[severity] || { bg: "#e0e7ff", text: "#3730a3", border: "#a5b4fc" };

  const padding = 10;
  doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica");
  const textHeight = doc.heightOfString(text, { width: 495 - padding * 2 });
  const boxHeight = textHeight + padding * 2;

  doc.roundedRect(50, y, 495, boxHeight, 6)
    .fillAndStroke(colors.bg, colors.border);

  doc.fillColor(colors.text).fontSize(11).font("Helvetica")
    .text(text, 50 + padding, y + padding, { width: 495 - padding * 2 });

  return y + boxHeight + 8;
}

// ---------- Data fetchers ----------

async function fetchEmotionAggregate(params) {
  const where = buildEmotionWhere(params);
  const records = await prisma.emotionRecord.findMany({
    where,
    select: { emotion: true, engagementScore: true, focusScore: true, isPresent: true, studentId: true },
  });
  return records;
}

function buildEmotionWhere({ entityType, entityId, startDate, endDate }) {
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
  return where;
}

async function callBartSummary(rows, lectureId) {
  // Build a tiny CSV from emotion data and call the Python summarizer.
  if (rows.length === 0) return null;
  const headers = ["dominant_emotion", "emotion_confidence", "engagement_score", "attended"];
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      [r.emotion, r.confidence ?? "", r.engagementScore ?? "", r.isPresent ? "True" : "False"].join(",")
    ),
  ].join("\r\n");

  const formData = new FormData();
  formData.append("file", new Blob([csv], { type: "text/csv" }), "report.csv");
  formData.append("lecture_id", String(lectureId || "report"));

  try {
    const res = await fetch(`${PYTHON_BACKEND}/summarize/csv/internal`, {
      method: "POST",
      headers: { "X-Internal-Key": INTERNAL_KEY },
      body: formData,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn("BART unavailable, skipping AI summary:", e.message);
    return null;
  }
}

// ---------- Main route ----------

export async function GET(_request, { params }) {
  const { id } = await params;
  const reportId = parseInt(id);

  const report = await prisma.report.findUnique({
    where: { reportId },
    include: { generatedByUser: { select: { username: true } } },
  });
  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  const p = report.parameters || {};
  const type = p.originalType || "emotion";

  // Pull aggregate emotion data for charting + BART input.
  const emotionRecords = await prisma.emotionRecord.findMany({
    where: buildEmotionWhere({
      entityType: p.entityType,
      entityId: p.entityId,
      startDate: p.startDate,
      endDate: p.endDate,
    }),
    include: {
      student: { select: { studentCode: true, fullName: true } },
      lecture: { select: { lectureCode: true, lectureName: true } },
    },
  });

  // Aggregate per emotion
  const emotionCounts = { Happy: 0, Neutral: 0, Confused: 0, Bored: 0 };
  let engagementSum = 0, presentCount = 0;
  const uniqueStudents = new Set();
  for (const r of emotionRecords) {
    emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
    engagementSum += r.engagementScore || 0;
    if (r.isPresent) presentCount += 1;
    if (r.studentId) uniqueStudents.add(r.studentId);
  }

  const totalSamples = emotionRecords.length;
  const avgEngagement = totalSamples ? engagementSum / totalSamples : 0;
  const attendanceRate = totalSamples ? presentCount / totalSamples : 0;
  const confusionRate = totalSamples
    ? (emotionCounts.Confused + emotionCounts.Bored) / totalSamples
    : 0;
  const risk = classifyRisk(attendanceRate, confusionRate, avgEngagement);

  // Call BART for AI summary
  const aiSummary = await callBartSummary(emotionRecords, p.entityId);

  // Build PDF
  const chunks = [];
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  doc.on("data", (c) => chunks.push(c));

  // ---------- PAGE 1 ----------
  drawHeader(doc, report);
  drawTitle(doc, report.title || `${type[0].toUpperCase() + type.slice(1)} Report`,
    `Generated by ${report.generatedByUser?.username || "EDU Pulse"} • Report type: ${type}`);

  // Risk banner
  doc.roundedRect(50, 180, 495, 50, 8)
    .fillAndStroke(risk.color + "20", risk.color);
  doc.fillColor(risk.color).fontSize(11).font("Helvetica-Bold")
    .text("OVERALL ASSESSMENT", 65, 192);
  doc.fillColor(COLORS.dark).fontSize(18).font("Helvetica-Bold")
    .text(`Cohort Risk: ${risk.level}`, 65, 207);
  doc.fillColor(COLORS.dark).fontSize(10).font("Helvetica")
    .text(`${uniqueStudents.size} students · ${totalSamples} samples`, 400, 207, { align: "right", width: 130 });

  // Stat cards
  let y = drawSectionTitle(doc, "Key Metrics", 260);
  drawStatCard(doc, 50,  y, "Students", uniqueStudents.size);
  drawStatCard(doc, 175, y, "Attendance", `${Math.round(attendanceRate * 100)}%`, "Present rate", COLORS.happy);
  drawStatCard(doc, 300, y, "Engagement", `${Math.round(avgEngagement * 100)}%`, "Avg score", COLORS.primary);
  drawStatCard(doc, 425, y, "Confusion", `${Math.round(confusionRate * 100)}%`, "Negative rate",
    confusionRate > 0.3 ? COLORS.confused : COLORS.muted);

  y += 90;

  // Emotion distribution chart
  y = drawSectionTitle(doc, "Emotion Distribution", y);
  const chartData = [
    { label: "Happy",    value: emotionCounts.Happy,    color: COLORS.happy },
    { label: "Neutral",  value: emotionCounts.Neutral,  color: COLORS.neutral },
    { label: "Confused", value: emotionCounts.Confused, color: COLORS.confused },
    { label: "Bored",    value: emotionCounts.Bored,    color: COLORS.bored },
  ];
  y = drawBarChart(doc, 50, y, 495, 120, chartData);

  // AI Summary
  y = drawSectionTitle(doc, "AI Summary", y + 10);
  if (aiSummary && aiSummary.summary) {
    y = drawWrappedParagraph(doc, aiSummary.summary, 50, y, 495);

    if (aiSummary.insights && aiSummary.insights.length > 0) {
      y += 5;
      doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold")
        .text("Key Insights", 50, y);
      y += 18;
      for (const ins of aiSummary.insights) {
        if (y > 740) { doc.addPage(); y = 50; }
        const cleanText = ins.replace(/[^\x00-\x7F]/g, "").trim();
        const severity = ins.includes("Low") || ins.includes("High negative") ? "high" : "low";
        y = drawInsightBox(doc, "• " + cleanText, severity, y);
      }
    }
  } else {
    y = drawWrappedParagraph(doc,
      "AI summary unavailable — start the backend service to enable BART-generated insights.",
      50, y, 495);
  }

  // ---------- PAGE 2: details table ----------
  if (emotionRecords.length > 0) {
    doc.addPage();
    drawHeader(doc, report);
    drawTitle(doc, "Student Detail", "Per-student emotion & engagement summary");

    y = drawSectionTitle(doc, "Top Students", 180);

    // Aggregate per student
    const byStudent = new Map();
    for (const r of emotionRecords) {
      const key = r.student?.studentCode || `S${r.studentId}`;
      if (!byStudent.has(key)) {
        byStudent.set(key, {
          code: key, name: r.student?.fullName || "—",
          count: 0, engagementSum: 0, confused: 0, present: 0,
        });
      }
      const s = byStudent.get(key);
      s.count += 1;
      s.engagementSum += r.engagementScore || 0;
      if (r.emotion === "Confused" || r.emotion === "Bored") s.confused += 1;
      if (r.isPresent) s.present += 1;
    }

    const students = Array.from(byStudent.values())
      .map((s) => ({
        ...s,
        avgEngagement: s.engagementSum / s.count,
        confusionRate: s.confused / s.count,
        attendanceRate: s.present / s.count,
      }))
      .sort((a, b) => b.confusionRate - a.confusionRate)
      .slice(0, 18);

    // Table header
    const headers = ["Code", "Name", "Attendance", "Engagement", "Confusion"];
    const colWidths = [60, 180, 80, 90, 85];
    let col = 50;
    doc.fillColor(COLORS.muted).fontSize(9).font("Helvetica-Bold");
    headers.forEach((h, i) => { doc.text(h, col, y, { width: colWidths[i] }); col += colWidths[i]; });
    y += 14;
    doc.strokeColor(COLORS.border).lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
    y += 6;

    for (const s of students) {
      if (y > 770) { doc.addPage(); drawHeader(doc, report); y = 130; }
      col = 50;
      doc.fillColor(COLORS.dark).fontSize(9).font("Helvetica");
      doc.text(s.code, col, y, { width: colWidths[0] }); col += colWidths[0];
      doc.text(s.name.substring(0, 28), col, y, { width: colWidths[1] }); col += colWidths[1];
      doc.text(`${Math.round(s.attendanceRate * 100)}%`, col, y, { width: colWidths[2] }); col += colWidths[2];
      doc.text(`${Math.round(s.avgEngagement * 100)}%`, col, y, { width: colWidths[3] }); col += colWidths[3];
      doc.fillColor(s.confusionRate > 0.4 ? COLORS.high : s.confusionRate > 0.25 ? COLORS.medium : COLORS.dark);
      doc.text(`${Math.round(s.confusionRate * 100)}%`, col, y, { width: colWidths[4] });
      y += 16;
    }
  }

  // Page numbers
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(COLORS.muted).fontSize(8).font("Helvetica")
      .text(`Page ${i + 1} of ${range.count}`, 50, 800, { align: "center", width: 495 });
    doc.text("EDU Pulse · Confidential", 50, 815, { align: "center", width: 495 });
  }

  doc.end();
  await new Promise((resolve) => doc.on("end", resolve));
  const pdfBuffer = Buffer.concat(chunks);

  const filename = `report_${report.reportId}_${type}_${new Date().toISOString().slice(0, 10)}.pdf`;
  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
