import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  andWhere,
  lectureContentAccessWhere,
  getSessionContext,
} from "@/lib/api/access";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");
    const academicWeek = searchParams.get("academicWeek");
    const search = searchParams.get("search");

    const filters = [lectureContentAccessWhere(context)];

    if (assignmentId) {
      filters.push({ assignmentId: parseInt(assignmentId, 10) });
    }
    if (academicWeek) {
      filters.push({ academicWeek: parseInt(academicWeek, 10) });
    }
    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { originalName: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const contents = await prisma.lectureContent.findMany({
      where: andWhere(...filters),
      include: {
        assignment: {
          include: {
            course: {
              select: { courseId: true, courseCode: true, courseName: true },
            },
            group: {
              select: { groupId: true, groupCode: true, groupName: true },
            },
            semester: {
              select: { semesterId: true, semesterName: true },
            },
          },
        },
        uploader: {
          select: { userId: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contents, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' } });
  } catch (error) {
    console.error("Error fetching lecture content:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecture content" },
      { status: 500 }
    );
  }
}
