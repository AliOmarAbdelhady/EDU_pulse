import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  andWhere,
  getSessionContext,
  parsePositiveInt,
  studentAccessWhere,
} from "@/lib/api/access";

export const dynamic = "force-dynamic";

const VALID_ALERT_TYPES = new Set([
  "confusion_spike",
  "boredom_spike",
  "low_engagement",
  "absence",
  "system",
]);

const VALID_SEVERITIES = new Set(["info", "warning", "critical"]);

export async function GET(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = parsePositiveInt(searchParams.get("userId")) || context.userId;
    const alertType = searchParams.get("alertType");
    const severity = searchParams.get("severity");
    const isRead = searchParams.get("isRead");

    if (context.role !== "admin" && requestedUserId !== context.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const where = { userId: requestedUserId };
    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === "true";
    }

    // Get alert recipients for this user, including the alert details
    const alertRecipients = await prisma.alertRecipient.findMany({
      where,
      include: {
        alert: {
          include: {
            lecture: {
              select: {
                lectureId: true,
                lectureName: true,
                lectureCode: true,
              },
            },
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
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Apply alert-level filters after fetch if needed
    let filtered = alertRecipients;
    if (alertType) {
      filtered = filtered.filter((ar) => ar.alert.alertType === alertType);
    }
    if (severity) {
      filtered = filtered.filter((ar) => ar.alert.severity === severity);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["admin", "lecturer"].includes(context.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      lectureId,
      alertType,
      severity,
      title,
      message,
      thresholdValue,
      actualValue,
      timeMinute,
      recipientUserIds,
    } = body;

    if (!alertType || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields: alertType, title, message" },
        { status: 400 }
      );
    }

    if (!VALID_ALERT_TYPES.has(alertType)) {
      return NextResponse.json({ error: "Invalid alertType" }, { status: 400 });
    }

    const normalizedSeverity = severity || "warning";
    if (!VALID_SEVERITIES.has(normalizedSeverity)) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
    }

    const parsedRecipientUserIds = Array.isArray(recipientUserIds)
      ? [...new Set(recipientUserIds.map(parsePositiveInt).filter(Boolean))]
      : [];

    if (parsedRecipientUserIds.length > 0 && context.role !== "admin") {
      const accessibleRecipients = await prisma.student.findMany({
        where: andWhere(
          { userId: { in: parsedRecipientUserIds } },
          studentAccessWhere(context)
        ),
        select: { userId: true },
      });
      const accessibleUserIds = new Set(accessibleRecipients.map((s) => s.userId));
      const hasBlockedRecipient = parsedRecipientUserIds.some(
        (uid) => !accessibleUserIds.has(uid)
      );

      if (hasBlockedRecipient) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Create the alert
    const alert = await prisma.alert.create({
      data: {
        lectureId: lectureId ? parseInt(lectureId, 10) : null,
        triggeredByUserId: context.userId,
        alertType,
        severity: normalizedSeverity,
        title: String(title).trim(),
        message: String(message).trim(),
        thresholdValue,
        actualValue,
        timeMinute,
      },
    });

    // Create alert recipients if provided
    if (parsedRecipientUserIds.length > 0) {
      await prisma.alertRecipient.createMany({
        data: parsedRecipientUserIds.map((uid) => ({
          alertId: alert.alertId,
          userId: uid,
        })),
      });
    }

    // Return the alert with recipients
    const result = await prisma.alert.findUnique({
      where: { alertId: alert.alertId },
      include: {
        recipients: true,
        lecture: {
          select: { lectureId: true, lectureName: true, lectureCode: true },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const recipientId = parsePositiveInt(body.recipientId || body.id);
    const isRead = Boolean(body.isRead);

    if (!recipientId) {
      return NextResponse.json(
        { error: "recipientId is required" },
        { status: 400 }
      );
    }

    const recipient = await prisma.alertRecipient.findUnique({
      where: { recipientId },
      select: { recipientId: true, userId: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    if (context.role !== "admin" && recipient.userId !== context.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.alertRecipient.update({
      where: { recipientId },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
      include: {
        alert: {
          include: {
            lecture: {
              select: { lectureId: true, lectureName: true, lectureCode: true },
            },
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
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
