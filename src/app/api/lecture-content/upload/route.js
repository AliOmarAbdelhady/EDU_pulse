import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  andWhere,
  assignmentAccessWhere,
  getSessionContext,
} from "@/lib/api/access";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function classifyMimeType(mimeType) {
  if (!mimeType) return "other";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "presentation";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "spreadsheet";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.startsWith("text/")
  )
    return "document";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("archive") || mimeType.includes("compressed"))
    return "archive";
  return "other";
}

export async function POST(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "admin" && context.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const assignmentId = formData.get("assignmentId");
    const academicWeek = formData.get("academicWeek");
    const title = formData.get("title");
    const description = formData.get("description");

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    const parsedAssignmentId = Number(assignmentId);
    const parsedAcademicWeek = Number(academicWeek);

    if (
      !Number.isInteger(parsedAssignmentId) ||
      parsedAssignmentId <= 0 ||
      !Number.isInteger(parsedAcademicWeek) ||
      parsedAcademicWeek <= 0
    ) {
      return NextResponse.json(
        { error: "Valid assignment and academic week are required" },
        { status: 400 }
      );
    }

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 413 }
      );
    }

    const assignment = await prisma.lecturerCourseAssignment.findFirst({
      where: andWhere(
        { assignmentId: parsedAssignmentId },
        assignmentAccessWhere(context)
      ),
      select: {
        assignmentId: true,
        semesterId: true,
        groupId: true,
        course: {
          select: { courseCode: true, courseName: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const fileType = classifyMimeType(file.type);
    const ext = path.extname(file.name) || "";
    const safeName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const storedName = `${randomUUID()}-${safeName}${ext}`;
    const relativeDir = `uploads/contents/${assignment.semesterId}/assignment-${parsedAssignmentId}/week-${parsedAcademicWeek}`;
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);
    const filePath = `${relativeDir}/${storedName}`;

    await mkdir(absoluteDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(absoluteDir, storedName), buffer);

    const content = await prisma.lectureContent.create({
      data: {
        assignmentId: parsedAssignmentId,
        academicWeek: parsedAcademicWeek,
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        fileName: storedName,
        originalName: file.name,
        fileType,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        filePath,
        uploadedBy: context.userId,
        semesterId: assignment.semesterId,
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

    // Send notification to all students in the group
    const memberships = await prisma.groupMembership.findMany({
      where: {
        groupId: assignment.groupId,
        status: "active",
      },
      select: {
        student: {
          select: { userId: true },
        },
      },
    });

    if (memberships.length > 0) {
      const alert = await prisma.alert.create({
        data: {
          alertType: "system",
          severity: "info",
          title: "New lecture material uploaded",
          message: `${assignment.course.courseCode}: "${String(title).trim()}" uploaded for Week ${parsedAcademicWeek}`,
          triggeredByUserId: context.userId,
        },
      });

      await prisma.alertRecipient.createMany({
        data: memberships.map((m) => ({
          alertId: alert.alertId,
          userId: m.student.userId,
        })),
      });
    }

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    console.error("Error uploading lecture content:", error);
    return NextResponse.json(
      { error: "Failed to upload content" },
      { status: 500 }
    );
  }
}
