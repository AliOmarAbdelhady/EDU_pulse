import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  andWhere,
  getSessionContext,
  parsePositiveInt,
  studentAccessWhere,
} from "@/lib/api/access";

export const dynamic = "force-dynamic";

const MAX_SUBJECT_LENGTH = 140;
const MAX_MESSAGE_LENGTH = 2000;

function normalizeText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function getSenderName(user) {
  return (
    user?.lecturer?.fullName ||
    user?.admin?.fullName ||
    user?.username ||
    user?.email ||
    "EduPulse"
  );
}

export async function POST(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["admin", "lecturer"].includes(context.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const studentId = parsePositiveInt(id);
    if (!studentId) {
      return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const subject = normalizeText(body.subject, MAX_SUBJECT_LENGTH);
    const message = normalizeText(body.message, MAX_MESSAGE_LENGTH);

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findFirst({
      where: andWhere({ studentId }, studentAccessWhere(context)),
      select: {
        studentId: true,
        fullName: true,
        studentCode: true,
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const sender = await prisma.user.findUnique({
      where: { userId: context.userId },
      select: {
        userId: true,
        username: true,
        email: true,
        lecturer: { select: { fullName: true } },
        admin: { select: { fullName: true } },
      },
    });

    const senderName = getSenderName(sender);
    const alert = await prisma.alert.create({
      data: {
        alertType: "system",
        severity: "info",
        title: subject,
        message,
        triggeredByUserId: context.userId,
        recipients: {
          create: {
            userId: student.user.userId,
          },
        },
      },
      include: {
        recipients: true,
        triggeredByUser: {
          select: {
            userId: true,
            username: true,
            email: true,
            lecturer: { select: { fullName: true } },
            admin: { select: { fullName: true } },
          },
        },
      },
    });

    await prisma.auditLog
      .create({
        data: {
          userId: context.userId,
          action: "student_contact_notification",
          entityType: "student",
          entityId: String(student.studentId),
          newValues: {
            subject,
            recipientUserId: student.user.userId,
            recipientEmail: student.user.email,
          },
        },
      })
      .catch((error) => {
        console.error("Error writing contact audit log:", error);
      });

    return NextResponse.json(
      {
        alert,
        recipient: alert.recipients[0],
        student: {
          studentId: student.studentId,
          fullName: student.fullName,
          studentCode: student.studentCode,
          email: student.user.email,
        },
        senderName,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error contacting student:", error);
    return NextResponse.json(
      { error: "Failed to contact student" },
      { status: 500 }
    );
  }
}
