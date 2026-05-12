import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unlink } from "node:fs/promises";
import path from "node:path";
import {
  andWhere,
  lectureContentAccessWhere,
  getSessionContext,
} from "@/lib/api/access";

export const revalidate = 120;

export async function GET(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentId = Number(params.id);
    if (!Number.isInteger(contentId) || contentId <= 0) {
      return NextResponse.json(
        { error: "Invalid content ID" },
        { status: 400 }
      );
    }

    const content = await prisma.lectureContent.findFirst({
      where: andWhere(
        { contentId },
        lectureContentAccessWhere(context)
      ),
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
    });

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(content, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' } });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "admin" && context.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentId = Number(params.id);
    if (!Number.isInteger(contentId) || contentId <= 0) {
      return NextResponse.json(
        { error: "Invalid content ID" },
        { status: 400 }
      );
    }

    const existing = await prisma.lectureContent.findFirst({
      where: andWhere(
        { contentId },
        lectureContentAccessWhere(context)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description } = body;

    const updated = await prisma.lectureContent.update({
      where: { contentId },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && {
          description: description ? String(description).trim() : null,
        }),
      },
      include: {
        assignment: {
          include: {
            course: {
              select: { courseId: true, courseCode: true, courseName: true },
            },
            group: {
              select: { groupId: true, groupCode: true, groupName: true },
            },
          },
        },
        uploader: {
          select: { userId: true, username: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "admin" && context.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentId = Number(params.id);
    if (!Number.isInteger(contentId) || contentId <= 0) {
      return NextResponse.json(
        { error: "Invalid content ID" },
        { status: 400 }
      );
    }

    const existing = await prisma.lectureContent.findFirst({
      where: andWhere(
        { contentId },
        lectureContentAccessWhere(context)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Try to delete the file from filesystem
    try {
      const absolutePath = path.join(process.cwd(), "public", existing.filePath);
      await unlink(absolutePath);
    } catch {
      // File may already be deleted, continue with DB deletion
    }

    await prisma.lectureContent.delete({
      where: { contentId },
    });

    return NextResponse.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}
