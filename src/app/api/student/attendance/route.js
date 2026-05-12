import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionContext } from "@/lib/api/access";

export const dynamic = "force-dynamic";

const ACADEMIC_WEEKS = Array.from({ length: 16 }, (_, i) => i + 1);

export async function GET() {
  try {
    const context = await getSessionContext();
    if (!context || context.role !== "student" || !context.studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = context.studentId;

    const memberships = await prisma.groupMembership.findMany({
      where: { studentId },
      include: {
        group: {
          include: {
            assignments: {
              include: {
                course: {
                  select: {
                    courseId: true,
                    courseCode: true,
                    courseName: true,
                  },
                },
                lecturer: {
                  select: { fullName: true },
                },
                semester: {
                  select: { semesterName: true },
                },
              },
            },
          },
        },
      },
    });

    const assignmentIds = memberships.flatMap((m) =>
      m.group.assignments.map((a) => a.assignmentId)
    );

    const weeklyAttendance =
      assignmentIds.length > 0
        ? await prisma.courseWeekAttendance.findMany({
            where: { studentId, assignmentId: { in: assignmentIds } },
          })
        : [];

    // Also fetch lecture-level attendance for detailed records
    const lectureAttendance =
      assignmentIds.length > 0
        ? await prisma.attendanceRecord.findMany({
            where: { studentId },
            include: {
              lecture: {
                select: {
                  lectureId: true,
                  lectureName: true,
                  lectureDate: true,
                  academicWeek: true,
                  assignmentId: true,
                  status: true,
                },
              },
            },
            orderBy: { lecture: { lectureDate: "desc" } },
          })
        : [];

    const attendanceMap = new Map(
      weeklyAttendance.map((a) => [`${a.assignmentId}:${a.academicWeek}`, a])
    );

    const courses = [];

    for (const membership of memberships) {
      for (const assignment of membership.group.assignments) {
        const weekStatuses = {};
        let presentCount = 0;
        let absentCount = 0;

        for (const week of ACADEMIC_WEEKS) {
          const record = attendanceMap.get(
            `${assignment.assignmentId}:${week}`
          );
          const status = record?.status || "Unrecorded";
          weekStatuses[week] = status;
          if (status === "Present") presentCount++;
          if (status === "Absent") absentCount++;
        }

        const recordedWeeks = Object.values(weekStatuses).filter(
          (s) => s !== "Unrecorded"
        ).length;

        // Filter lecture attendance for this assignment
        const lectureRecords = lectureAttendance.filter(
          (r) => r.lecture.assignmentId === assignment.assignmentId
        );

        const absentLectures = lectureRecords.filter(
          (r) => r.status === "Absent"
        );

        courses.push({
          courseId: assignment.course.courseId,
          courseCode: assignment.course.courseCode,
          courseName: assignment.course.courseName,
          lecturerName: assignment.lecturer?.fullName || null,
          semesterName: assignment.semester?.semesterName || null,
          assignmentId: assignment.assignmentId,
          enrollmentStatus: membership.status,
          weeklyAttendance: weekStatuses,
          presentCount,
          absentCount,
          recordedWeeks,
          attendanceRate:
            recordedWeeks > 0
              ? Math.round((presentCount / recordedWeeks) * 100)
              : null,
          absentLectures: absentLectures.map((r) => ({
            lectureId: r.lecture.lectureId,
            lectureName: r.lecture.lectureName,
            lectureDate: r.lecture.lectureDate,
            academicWeek: r.lecture.academicWeek,
            status: r.status,
          })),
          lectureHistory: lectureRecords.map((r) => ({
            lectureId: r.lecture.lectureId,
            lectureName: r.lecture.lectureName,
            lectureDate: r.lecture.lectureDate,
            academicWeek: r.lecture.academicWeek,
            status: r.status,
            firstSeenAt: r.firstSeenAt,
            lastSeenAt: r.lastSeenAt,
            attendancePct: r.attendancePct,
          })),
        });
      }
    }

    return NextResponse.json({ courses }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } });
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
