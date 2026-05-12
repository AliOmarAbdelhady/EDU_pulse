import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { andWhere, getSessionContext, lectureAccessWhere } from "@/lib/api/access";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "admin" && context.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const lectureId = parseInt(id, 10);

    const currentLecture = await prisma.lecture.findFirst({
      where: andWhere({ lectureId }, lectureAccessWhere(context)),
      select: { lectureId: true },
    });

    if (!currentLecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const endTime = new Date();

    const lecture = await prisma.lecture.update({
      where: { lectureId },
      data: {
        status: "analyzed",
        endTime,
      },
      include: {
        attendanceRecords: true,
      },
    });

    // Finalize attendance percentages for all tracked students
    if (lecture.startTime && lecture.attendanceRecords.length > 0) {
      const totalMinutes = (endTime - new Date(lecture.startTime)) / 60000;

      for (const record of lecture.attendanceRecords) {
        const absenceMin = record.totalAbsenceMinutes || 0;
        const attendedMin = Math.max(0, totalMinutes - absenceMin);
        const pct = totalMinutes > 0 ? Math.round((attendedMin / totalMinutes) * 100) : 0;

        await prisma.attendanceRecord.update({
          where: { attendanceId: record.attendanceId },
          data: {
            attendancePct: Math.min(100, pct),
            lastSeenAt: record.lastSeenAt || endTime,
          },
        });
      }
    }

    return NextResponse.json(lecture);
  } catch (err) {
    console.error("Failed to end lecture:", err);
    return NextResponse.json({ error: "Failed to end lecture" }, { status: 500 });
  }
}
