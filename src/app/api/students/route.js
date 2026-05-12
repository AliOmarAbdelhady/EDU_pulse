import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  andWhere,
  getSessionContext,
  studentAccessWhere,
} from "@/lib/api/access";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search");

    const filters = [studentAccessWhere(context)];

    if (departmentId) filters.push({ departmentId: parseInt(departmentId, 10) });
    if (search) {
      filters.push({
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { studentCode: { contains: search, mode: "insensitive" } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    const students = await prisma.student.findMany({
      where: andWhere(...filters),
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
            isActive: true,
          },
        },
        department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true,
          },
        },
        _count: {
          select: { emotionRecords: true, attendanceRecords: true, groupMemberships: true },
        },
      },
      orderBy: { studentId: "desc" },
    });

    const studentIds = students.map((s) => s.studentId);
    const engagementWhere = { studentId: { in: studentIds } };

    if (context.role === "lecturer") {
      engagementWhere.lecture = {
        assignment: { lecturerId: context.lecturerId },
      };
    }

    const engagementByStudent = studentIds.length > 0
      ? await prisma.emotionRecord.groupBy({
          by: ["studentId"],
          where: engagementWhere,
          _avg: { engagementScore: true },
        })
      : [];

    const engagementMap = new Map(
      engagementByStudent.map((e) => [e.studentId, e._avg.engagementScore])
    );

    const result = students.map((s) => ({
      ...s,
      avgEngagement: engagementMap.get(s.studentId)
        ? Math.round(engagementMap.get(s.studentId) * 100) / 100
        : null,
    }));

    return NextResponse.json(result, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' } });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
