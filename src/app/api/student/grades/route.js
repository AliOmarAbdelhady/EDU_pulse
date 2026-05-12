import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionContext } from "@/lib/api/access";

export const dynamic = "force-dynamic";

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
                    creditHours: true,
                  },
                },
                lecturer: {
                  select: { fullName: true },
                },
                semester: {
                  select: { semesterName: true },
                },
                _count: { select: { lectures: true } },
              },
            },
          },
        },
      },
    });

    const assignmentIds = memberships.flatMap((m) =>
      m.group.assignments.map((a) => a.assignmentId)
    );

    const [results, scores, attendance] = await Promise.all([
      prisma.studentCourseResult.findMany({
        where: { studentId, assignmentId: { in: assignmentIds } },
      }),
      prisma.studentAssessmentScore.findMany({
        where: {
          studentId,
          assessmentItemId: {
            in: [],
          },
        },
        include: {
          assessmentItem: {
            select: {
              assessmentItemId: true,
              title: true,
              category: true,
              maxMarks: true,
              displayOrder: true,
              assignmentId: true,
            },
          },
        },
      }),
      prisma.courseWeekAttendance.findMany({
        where: { studentId, assignmentId: { in: assignmentIds } },
      }),
    ]);

    // Fetch all assessment items for these assignments
    const assessmentItems = assignmentIds.length > 0
      ? await prisma.courseAssessmentItem.findMany({
          where: { assignmentId: { in: assignmentIds } },
          orderBy: [{ displayOrder: "asc" }, { academicWeek: "asc" }],
        })
      : [];

    // Fetch scores now that we have assessment item IDs
    const assessmentItemIds = assessmentItems.map((item) => item.assessmentItemId);
    const studentScores = assessmentItemIds.length > 0
      ? await prisma.studentAssessmentScore.findMany({
          where: {
            studentId,
            assessmentItemId: { in: assessmentItemIds },
          },
        })
      : [];

    const resultMap = new Map(results.map((r) => [r.assignmentId, r]));
    const scoreMap = new Map(studentScores.map((s) => [s.assessmentItemId, s]));
    const attendanceMap = new Map(
      attendance.map((a) => [`${a.assignmentId}:${a.academicWeek}`, a])
    );

    const courses = [];

    for (const membership of memberships) {
      for (const assignment of membership.group.assignments) {
        const result = resultMap.get(assignment.assignmentId);
        const items = assessmentItems.filter(
          (item) => item.assignmentId === assignment.assignmentId
        );

        const assessmentBreakdown = items.map((item) => {
          const score = scoreMap.get(item.assessmentItemId);
          return {
            assessmentItemId: item.assessmentItemId,
            title: item.title,
            category: item.category,
            maxMarks: item.maxMarks,
            marks: score?.marks ?? null,
            feedback: score?.feedback ?? null,
            academicWeek: item.academicWeek,
          };
        });

        const courseworkMarks = assessmentBreakdown
          .filter((a) => a.category !== "final_exam" && a.marks !== null)
          .reduce((sum, a) => sum + Number(a.marks), 0);
        const courseworkMax = assessmentBreakdown
          .filter((a) => a.category !== "final_exam")
          .reduce((sum, a) => sum + Number(a.maxMarks), 0);
        const finalMarks = assessmentBreakdown
          .filter((a) => a.category === "final_exam" && a.marks !== null)
          .reduce((sum, a) => sum + Number(a.marks), 0);
        const finalMax = assessmentBreakdown
          .filter((a) => a.category === "final_exam")
          .reduce((sum, a) => sum + Number(a.maxMarks), 0);

        // Week 7 breakdown (midterm period)
        const week7Items = assessmentBreakdown.filter((a) => a.academicWeek <= 7);
        const week7Marks = week7Items
          .filter((a) => a.marks !== null)
          .reduce((sum, a) => sum + Number(a.marks), 0);
        const week7Max = week7Items.reduce((sum, a) => sum + Number(a.maxMarks), 0);

        // Week 12 breakdown
        const week12Items = assessmentBreakdown.filter((a) => a.academicWeek <= 12);
        const week12Marks = week12Items
          .filter((a) => a.marks !== null)
          .reduce((sum, a) => sum + Number(a.marks), 0);
        const week12Max = week12Items.reduce((sum, a) => sum + Number(a.maxMarks), 0);

        // Coursework items (non-final)
        const courseworkItems = assessmentBreakdown.filter((a) => a.category !== "final_exam");
        // Final exam items
        const finalItems = assessmentBreakdown.filter((a) => a.category === "final_exam");

        const totalLectures = assignment._count.lectures;
        const presentWeeks = attendance.filter(
          (a) => a.assignmentId === assignment.assignmentId && a.status === "Present"
        ).length;

        courses.push({
          courseId: assignment.course.courseId,
          courseCode: assignment.course.courseCode,
          courseName: assignment.course.courseName,
          creditHours: assignment.course.creditHours,
          lecturerName: assignment.lecturer?.fullName || null,
          semesterName: assignment.semester?.semesterName || null,
          assignmentId: assignment.assignmentId,
          enrollmentStatus: membership.status,
          result: result
            ? {
                totalScore: result.totalScore,
                courseworkScore: result.courseworkScore,
                finalExamScore: result.finalExamScore,
                grade: result.grade,
                status: result.status,
                absenceCount: result.absenceCount,
              }
            : null,
          assessmentBreakdown,
          courseworkMarks: Math.round(courseworkMarks * 100) / 100,
          courseworkMax,
          finalMarks: Math.round(finalMarks * 100) / 100,
          finalMax,
          week7: {
            marks: Math.round(week7Marks * 100) / 100,
            max: week7Max,
            items: week7Items,
          },
          week12: {
            marks: Math.round(week12Marks * 100) / 100,
            max: week12Max,
            items: week12Items,
          },
          courseworkItems,
          finalItems,
          attendanceRate:
            totalLectures > 0
              ? Math.round((presentWeeks / totalLectures) * 100)
              : null,
        });
      }
    }

    return NextResponse.json({ courses }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } });
  } catch (error) {
    console.error("Error fetching student grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}
