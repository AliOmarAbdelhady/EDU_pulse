import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 60;

// Map UI report type labels to the DB enum values
const REPORT_TYPE_MAP = {
  engagement: "course_report",
  emotion: "lecture_summary",
  attendance: "student_report",
  performance: "semester_report",
  // pass DB enum values through unchanged
  course_report: "course_report",
  lecture_summary: "lecture_summary",
  student_report: "student_report",
  semester_report: "semester_report",
  weekly_summary: "weekly_summary",
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const reports = await prisma.report.findMany({
      where: { generatedBy: parseInt(userId, 10) },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(reports, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { generatedBy, reportType, title, entityType, entityId, startDate, endDate, parameters } = body;

    if (!generatedBy || !reportType) {
      return NextResponse.json(
        { error: "Missing required fields: generatedBy, reportType" },
        { status: 400 }
      );
    }

    const dbType = REPORT_TYPE_MAP[reportType] ?? "course_report";
    const reportTitle = title || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;

    const report = await prisma.report.create({
      data: {
        generatedBy: parseInt(generatedBy, 10),
        reportType: dbType,
        title: reportTitle,
        parameters: {
          ...(parameters || {}),
          originalType: reportType,
          entityType: entityType || null,
          entityId: entityId ? String(entityId) : null,
          startDate: startDate || null,
          endDate: endDate || null,
        },
        status: "completed",
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}
