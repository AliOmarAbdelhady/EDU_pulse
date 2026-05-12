import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionContext, lectureAccessWhere, andWhere } from "@/lib/api/access";

export const dynamic = "force-dynamic";

function getDayName(date) {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

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
      select: { lectureId: true, status: true },
    });

    if (!currentLecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    if (currentLecture.status === "analyzed") {
      return NextResponse.json(
        { error: "Analyzed lectures cannot be started again" },
        { status: 409 }
      );
    }

    const now = new Date();
    const startData =
      currentLecture.status === "in_progress"
        ? { status: "in_progress" }
        : {
            status: "in_progress",
            lectureDate: now,
            dayName: getDayName(now),
            startTime: now,
            endTime: null,
          };

    const lecture = await prisma.lecture.update({
      where: { lectureId },
      data: startData,
    });

    return NextResponse.json(lecture);
  } catch (err) {
    console.error("Failed to start lecture:", err);
    return NextResponse.json({ error: "Failed to start lecture" }, { status: 500 });
  }
}
