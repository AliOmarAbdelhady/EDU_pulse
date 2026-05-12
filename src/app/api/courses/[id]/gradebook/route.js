import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  andWhere,
  assignmentAccessWhere,
  courseAccessWhere,
  getSessionContext,
  parsePositiveInt,
} from "@/lib/api/access";

export const revalidate = 60;

const ACADEMIC_WEEKS = Array.from({ length: 16 }, (_, index) => index + 1);
const ABSENCE_WITHDRAWAL_LIMIT = 6;
const AUTO_WITHDRAWAL_PREFIX = "Automatic withdrawal:";
const PASSING_SCORE = 50;

const ATTENDANCE_STATUSES = new Set([
  "Present",
  "Absent",
  "Excused",
  "Late",
  "Unrecorded",
]);

const DEFAULT_ASSESSMENT_PLAN = [
  { academicWeek: 7, title: "7th Week", category: "midterm", maxMarks: 30, displayOrder: 1 },
  { academicWeek: 12, title: "12th Week", category: "midterm", maxMarks: 20, displayOrder: 2 },
  { academicWeek: 13, title: "Course Work", category: "coursework", maxMarks: 10, displayOrder: 3 },
  { academicWeek: 16, title: "Final", category: "final_exam", maxMarks: 40, displayOrder: 4 },
];

const DEFAULT_GRADE_SCALE = [
  { grade: "A+", minScore: 95, maxScore: 100, isPassing: true, displayOrder: 1 },
  { grade: "A", minScore: 90, maxScore: 94.99, isPassing: true, displayOrder: 2 },
  { grade: "A-", minScore: 85, maxScore: 89.99, isPassing: true, displayOrder: 3 },
  { grade: "B+", minScore: 80, maxScore: 84.99, isPassing: true, displayOrder: 4 },
  { grade: "B", minScore: 75, maxScore: 79.99, isPassing: true, displayOrder: 5 },
  { grade: "B-", minScore: 70, maxScore: 74.99, isPassing: true, displayOrder: 6 },
  { grade: "C+", minScore: 65, maxScore: 69.99, isPassing: true, displayOrder: 7 },
  { grade: "C", minScore: 60, maxScore: 64.99, isPassing: true, displayOrder: 8 },
  { grade: "D+", minScore: 55, maxScore: 59.99, isPassing: true, displayOrder: 9 },
  { grade: "D", minScore: 50, maxScore: 54.99, isPassing: true, displayOrder: 10 },
  { grade: "F", minScore: 0, maxScore: 49.99, isPassing: false, displayOrder: 11 },
];

function roundScore(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function scoreKey(studentId, assessmentItemId) {
  return `${studentId}:${assessmentItemId}`;
}

function attendanceKey(studentId, week) {
  return `${studentId}:${week}`;
}

function isAutomaticWithdrawal(reason) {
  return typeof reason === "string" && reason.startsWith(AUTO_WITHDRAWAL_PREFIX);
}

async function loadAssignment(context, courseId, requestedAssignmentId = null) {
  const assignmentScope = assignmentAccessWhere(context);
  const assignments = await prisma.lecturerCourseAssignment.findMany({
    where: andWhere({ courseId }, assignmentScope),
    include: {
      lecturer: {
        select: {
          lecturerId: true,
          fullName: true,
          userId: true,
        },
      },
      group: {
        select: {
          groupId: true,
          groupCode: true,
          groupName: true,
          _count: { select: { memberships: true } },
        },
      },
      semester: {
        select: {
          semesterId: true,
          semesterName: true,
          isActive: true,
        },
      },
    },
    orderBy: [{ semesterId: "desc" }, { assignmentId: "asc" }],
  });

  const selected =
    assignments.find((assignment) => assignment.assignmentId === requestedAssignmentId) ||
    assignments[0];

  if (!selected) {
    const course = await prisma.course.findFirst({
      where: andWhere({ courseId }, courseAccessWhere(context)),
      select: {
        courseId: true,
        courseCode: true,
        courseName: true,
      },
    });

    return { course, assignments, assignment: null };
  }

  const assignment = await prisma.lecturerCourseAssignment.findUnique({
    where: { assignmentId: selected.assignmentId },
    include: {
      course: {
        include: {
          department: {
            select: {
              departmentId: true,
              departmentName: true,
              departmentCode: true,
            },
          },
        },
      },
      lecturer: {
        include: {
          user: { select: { userId: true, username: true, email: true } },
        },
      },
      group: {
        include: {
          memberships: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      userId: true,
                      username: true,
                      email: true,
                    },
                  },
                },
              },
            },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
      semester: {
        select: {
          semesterId: true,
          semesterName: true,
          isActive: true,
        },
      },
    },
  });

  return { course: assignment?.course || null, assignments, assignment };
}

function canReadGradebook(context, assignment) {
  if (context.role === "admin") return true;
  if (context.role === "lecturer") {
    return assignment.lecturer?.userId === context.userId;
  }
  if (context.role === "student") {
    return assignment.group?.memberships?.some(
      (membership) => membership.studentId === context.studentId
    );
  }
  return false;
}

function canManageGradebook(context, assignment) {
  if (context.role === "admin") return true;
  if (context.role === "lecturer") {
    return assignment.lecturer?.userId === context.userId;
  }
  return false;
}

async function ensureAssessmentPlan(assignmentId) {
  const planTitles = DEFAULT_ASSESSMENT_PLAN.map((item) => item.title);

  const extraItems = await prisma.courseAssessmentItem.findMany({
    where: { assignmentId, title: { notIn: planTitles } },
    select: { assessmentItemId: true },
  });

  if (extraItems.length > 0) {
    const extraIds = extraItems.map((item) => item.assessmentItemId);
    await prisma.$transaction([
      prisma.studentAssessmentScore.deleteMany({
        where: { assessmentItemId: { in: extraIds } },
      }),
      prisma.courseAssessmentItem.deleteMany({
        where: { assessmentItemId: { in: extraIds } },
      }),
    ]);
  }

  for (const planItem of DEFAULT_ASSESSMENT_PLAN) {
    await prisma.courseAssessmentItem.upsert({
      where: {
        assignmentId_academicWeek_title: {
          assignmentId,
          academicWeek: planItem.academicWeek,
          title: planItem.title,
        },
      },
      update: {
        maxMarks: planItem.maxMarks,
        category: planItem.category,
        displayOrder: planItem.displayOrder,
      },
      create: {
        ...planItem,
        assignmentId,
        isRequired: true,
      },
    });
  }

  return prisma.courseAssessmentItem.findMany({
    where: { assignmentId },
    orderBy: [{ displayOrder: "asc" }, { academicWeek: "asc" }],
  });
}

async function ensureGradeScaleRules() {
  await prisma.gradeScaleRule.createMany({
    data: DEFAULT_GRADE_SCALE,
    skipDuplicates: true,
  });

  return prisma.gradeScaleRule.findMany({
    orderBy: [{ displayOrder: "asc" }, { minScore: "desc" }],
  });
}

function gradeForScore(score, gradeRules) {
  const rules = [...(gradeRules.length ? gradeRules : DEFAULT_GRADE_SCALE)].sort(
    (a, b) => Number(b.minScore) - Number(a.minScore)
  );

  const matched = rules.find(
    (rule) => score >= Number(rule.minScore) && score <= Number(rule.maxScore)
  );

  return matched?.grade || "F";
}

function calculateResult({ membership, assessmentItems, attendanceRecords, scoreMap, gradeRules }) {
  const absenceCount = attendanceRecords.filter(
    (record) => record.status === "Absent"
  ).length;

  let courseworkScore = 0;
  let finalExamScore = 0;
  let completedAssessmentCount = 0;

  for (const item of assessmentItems) {
    const score = scoreMap.get(scoreKey(membership.studentId, item.assessmentItemId));
    const marks =
      score?.marks === null || score?.marks === undefined ? null : Number(score.marks);

    if (Number.isFinite(marks)) {
      completedAssessmentCount += 1;
      if (item.category === "final_exam") {
        finalExamScore += marks;
      } else {
        courseworkScore += marks;
      }
    }
  }

  const missingRequiredAssessment = assessmentItems.some((item) => {
    if (!item.isRequired) return false;
    const score = scoreMap.get(scoreKey(membership.studentId, item.assessmentItemId));
    const marks =
      score?.marks === null || score?.marks === undefined ? null : Number(score.marks);
    return !Number.isFinite(marks);
  });

  const totalScore = roundScore(courseworkScore + finalExamScore);
  const manuallyWithdrawn =
    membership.status === "withdrawn" &&
    !isAutomaticWithdrawal(membership.withdrawalReason);
  const withdrawn = absenceCount >= ABSENCE_WITHDRAWAL_LIMIT || manuallyWithdrawn;

  if (withdrawn) {
    return {
      absenceCount,
      courseworkScore: roundScore(courseworkScore),
      finalExamScore: roundScore(finalExamScore),
      totalScore,
      grade: "W",
      status: "withdrawn",
      completedAssessmentCount,
      totalAssessmentCount: assessmentItems.length,
    };
  }

  if (missingRequiredAssessment) {
    return {
      absenceCount,
      courseworkScore: roundScore(courseworkScore),
      finalExamScore: roundScore(finalExamScore),
      totalScore,
      grade: "IP",
      status: "in_progress",
      completedAssessmentCount,
      totalAssessmentCount: assessmentItems.length,
    };
  }

  return {
    absenceCount,
    courseworkScore: roundScore(courseworkScore),
    finalExamScore: roundScore(finalExamScore),
    totalScore,
    grade: gradeForScore(totalScore, gradeRules),
    status: totalScore >= PASSING_SCORE ? "passed" : "failed",
    completedAssessmentCount,
    totalAssessmentCount: assessmentItems.length,
  };
}

function serializeAssignmentOption(assignment) {
  return {
    assignmentId: assignment.assignmentId,
    role: assignment.role,
    lecturer: assignment.lecturer
      ? {
          lecturerId: assignment.lecturer.lecturerId,
          fullName: assignment.lecturer.fullName,
        }
      : null,
    group: assignment.group
      ? {
          groupId: assignment.group.groupId,
          groupCode: assignment.group.groupCode,
          groupName: assignment.group.groupName,
          studentCount: assignment.group._count?.memberships || 0,
        }
      : null,
    semester: assignment.semester || null,
  };
}

async function buildGradebookPayload({ context, course, assignments, assignment, assessmentItems, gradeRules }) {
  const allMemberships = assignment.group?.memberships || [];
  const memberships =
    context.role === "student"
      ? allMemberships.filter((membership) => membership.studentId === context.studentId)
      : allMemberships;

  const studentIds = memberships.map((membership) => membership.studentId);
  const assessmentItemIds = assessmentItems.map((item) => item.assessmentItemId);

  const [attendanceRecords, scores] =
    studentIds.length > 0
      ? await Promise.all([
          prisma.courseWeekAttendance.findMany({
            where: {
              assignmentId: assignment.assignmentId,
              studentId: { in: studentIds },
            },
          }),
          prisma.studentAssessmentScore.findMany({
            where: {
              assessmentItemId: { in: assessmentItemIds },
              studentId: { in: studentIds },
            },
          }),
        ])
      : [[], []];

  const attendanceMap = new Map();
  const attendanceByStudent = new Map();
  for (const record of attendanceRecords) {
    attendanceMap.set(attendanceKey(record.studentId, record.academicWeek), record);
    const records = attendanceByStudent.get(record.studentId) || [];
    records.push(record);
    attendanceByStudent.set(record.studentId, records);
  }

  const scoreMap = new Map();
  for (const score of scores) {
    scoreMap.set(scoreKey(score.studentId, score.assessmentItemId), score);
  }

  const rows = memberships.map((membership) => {
    const weekStatuses = {};
    for (const week of ACADEMIC_WEEKS) {
      weekStatuses[week] =
        attendanceMap.get(attendanceKey(membership.studentId, week))?.status ||
        "Unrecorded";
    }

    const scoreValues = {};
    for (const item of assessmentItems) {
      const score = scoreMap.get(scoreKey(membership.studentId, item.assessmentItemId));
      scoreValues[item.assessmentItemId] = score?.marks ?? null;
    }

    const result = calculateResult({
      membership,
      assessmentItems,
      attendanceRecords: attendanceByStudent.get(membership.studentId) || [],
      scoreMap,
      gradeRules,
    });

    return {
      membershipId: membership.membershipId,
      enrollmentStatus: result.status === "withdrawn" ? "withdrawn" : membership.status,
      withdrawnAt: membership.withdrawnAt,
      withdrawalReason:
        result.status === "withdrawn" && !membership.withdrawalReason
          ? `${AUTO_WITHDRAWAL_PREFIX} ${result.absenceCount} absences in this course.`
          : membership.withdrawalReason,
      student: {
        studentId: membership.student.studentId,
        studentCode: membership.student.studentCode,
        fullName: membership.student.fullName,
        email: membership.student.user?.email || null,
        username: membership.student.user?.username || null,
        gpa: membership.student.gpa,
        academicStanding: membership.student.academicStanding,
      },
      attendance: weekStatuses,
      absenceCount: result.absenceCount,
      scores: scoreValues,
      result,
    };
  });

  const rowsWithScores = rows.filter(
    (row) =>
      row.result.completedAssessmentCount > 0 && row.result.status !== "withdrawn"
  );
  const classAverage =
    rowsWithScores.length > 0
      ? roundScore(
          rowsWithScores.reduce((sum, row) => sum + row.result.totalScore, 0) /
            rowsWithScores.length
        )
      : 0;

  const courseworkMax = assessmentItems
    .filter((item) => item.category !== "final_exam")
    .reduce((sum, item) => sum + Number(item.maxMarks), 0);
  const finalMax = assessmentItems
    .filter((item) => item.category === "final_exam")
    .reduce((sum, item) => sum + Number(item.maxMarks), 0);

  return {
    course: course
      ? {
          courseId: course.courseId,
          courseCode: course.courseCode,
          courseName: course.courseName,
          creditHours: course.creditHours,
          department: course.department || null,
        }
      : null,
    assignments: assignments.map(serializeAssignmentOption),
    assignment: {
      assignmentId: assignment.assignmentId,
      role: assignment.role,
      lecturer: assignment.lecturer
        ? {
            lecturerId: assignment.lecturer.lecturerId,
            fullName: assignment.lecturer.fullName,
            email: assignment.lecturer.user?.email || null,
          }
        : null,
      group: assignment.group
        ? {
            groupId: assignment.group.groupId,
            groupCode: assignment.group.groupCode,
            groupName: assignment.group.groupName,
          }
        : null,
      semester: assignment.semester || null,
    },
    weeks: ACADEMIC_WEEKS,
    absenceWithdrawalLimit: ABSENCE_WITHDRAWAL_LIMIT,
    assessmentItems: assessmentItems.map((item) => ({
      assessmentItemId: item.assessmentItemId,
      academicWeek: item.academicWeek,
      title: item.title,
      category: item.category,
      maxMarks: item.maxMarks,
      displayOrder: item.displayOrder,
      isRequired: item.isRequired,
    })),
    gradeScale: gradeRules.map((rule) => ({
      grade: rule.grade,
      minScore: rule.minScore,
      maxScore: rule.maxScore,
      isPassing: rule.isPassing,
      displayOrder: rule.displayOrder,
    })),
    summary: {
      studentCount: rows.length,
      withdrawnCount: rows.filter((row) => row.result.status === "withdrawn").length,
      atRiskCount: rows.filter(
        (row) =>
          row.result.status !== "withdrawn" &&
          row.absenceCount >= ABSENCE_WITHDRAWAL_LIMIT - 2
      ).length,
      classAverage,
      courseworkMax,
      finalMax,
      totalMax: courseworkMax + finalMax,
    },
    students: rows,
    permissions: {
      canManage: canManageGradebook(context, assignment),
    },
  };
}

async function syncResultsForAssignment(assignment, assessmentItems, gradeRules) {
  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: assignment.groupId },
  });

  const studentIds = memberships.map((membership) => membership.studentId);
  if (studentIds.length === 0) return;

  const assessmentItemIds = assessmentItems.map((item) => item.assessmentItemId);
  const [attendanceRecords, scores] = await Promise.all([
    prisma.courseWeekAttendance.findMany({
      where: {
        assignmentId: assignment.assignmentId,
        studentId: { in: studentIds },
      },
    }),
    prisma.studentAssessmentScore.findMany({
      where: {
        assessmentItemId: { in: assessmentItemIds },
        studentId: { in: studentIds },
      },
    }),
  ]);

  const attendanceByStudent = new Map();
  for (const record of attendanceRecords) {
    const records = attendanceByStudent.get(record.studentId) || [];
    records.push(record);
    attendanceByStudent.set(record.studentId, records);
  }

  const scoreMap = new Map();
  for (const score of scores) {
    scoreMap.set(scoreKey(score.studentId, score.assessmentItemId), score);
  }

  const now = new Date();
  const operations = [];

  for (const membership of memberships) {
    const result = calculateResult({
      membership,
      assessmentItems,
      attendanceRecords: attendanceByStudent.get(membership.studentId) || [],
      scoreMap,
      gradeRules,
    });

    if (result.absenceCount >= ABSENCE_WITHDRAWAL_LIMIT) {
      operations.push(
        prisma.groupMembership.update({
          where: { membershipId: membership.membershipId },
          data: {
            status: "withdrawn",
            withdrawnAt: membership.withdrawnAt || now,
            withdrawalReason: `${AUTO_WITHDRAWAL_PREFIX} ${result.absenceCount} absences in this course.`,
          },
        })
      );
    } else if (
      membership.status === "withdrawn" &&
      isAutomaticWithdrawal(membership.withdrawalReason)
    ) {
      operations.push(
        prisma.groupMembership.update({
          where: { membershipId: membership.membershipId },
          data: {
            status: "active",
            withdrawnAt: null,
            withdrawalReason: null,
          },
        })
      );
    }

    operations.push(
      prisma.studentCourseResult.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId: assignment.assignmentId,
            studentId: membership.studentId,
          },
        },
        update: {
          absenceCount: result.absenceCount,
          courseworkScore: result.courseworkScore,
          finalExamScore: result.finalExamScore,
          totalScore: result.totalScore,
          grade: result.grade,
          status: result.status,
          calculatedAt: now,
        },
        create: {
          assignmentId: assignment.assignmentId,
          studentId: membership.studentId,
          absenceCount: result.absenceCount,
          courseworkScore: result.courseworkScore,
          finalExamScore: result.finalExamScore,
          totalScore: result.totalScore,
          grade: result.grade,
          status: result.status,
          calculatedAt: now,
        },
      })
    );
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }
}

function validationError(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parsePositiveInt(id);
    if (!courseId) return validationError("Invalid course id");

    const { searchParams } = new URL(request.url);
    const assignmentId = parsePositiveInt(searchParams.get("assignmentId"));
    const { course, assignments, assignment } = await loadAssignment(
      context,
      courseId,
      assignmentId
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!assignment) {
      return NextResponse.json(
        { error: "Course has no lecturer assignments to grade." },
        { status: 404 }
      );
    }

    if (!canReadGradebook(context, assignment)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [assessmentItems, gradeRules] = await Promise.all([
      ensureAssessmentPlan(assignment.assignmentId),
      ensureGradeScaleRules(),
    ]);

    const payload = await buildGradebookPayload({
      context,
      course,
      assignments,
      assignment,
      assessmentItems,
      gradeRules,
    });

    return NextResponse.json(payload, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } });
  } catch (error) {
    console.error("Error fetching gradebook:", error);
    return NextResponse.json(
      { error: "Failed to fetch gradebook" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parsePositiveInt(id);
    if (!courseId) return validationError("Invalid course id");

    const body = await request.json();
    if (!body || Array.isArray(body) || typeof body !== "object") {
      return validationError("Request body must be an object");
    }

    const requestedAssignmentId = parsePositiveInt(body.assignmentId);
    const { course, assignments, assignment } = await loadAssignment(
      context,
      courseId,
      requestedAssignmentId
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!assignment) {
      return NextResponse.json(
        { error: "Course has no lecturer assignments to update." },
        { status: 404 }
      );
    }

    if (!canManageGradebook(context, assignment)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [assessmentItems, gradeRules] = await Promise.all([
      ensureAssessmentPlan(assignment.assignmentId),
      ensureGradeScaleRules(),
    ]);

    const validStudentIds = new Set(
      (assignment.group?.memberships || []).map((membership) => membership.studentId)
    );
    const assessmentById = new Map(
      assessmentItems.map((item) => [item.assessmentItemId, item])
    );
    const operations = [];

    const attendanceUpdates = Array.isArray(body.attendance)
      ? body.attendance
      : [];
    for (const update of attendanceUpdates) {
      const studentId = parsePositiveInt(update?.studentId);
      const academicWeek = parsePositiveInt(update?.academicWeek);
      const status = update?.status ?? "Unrecorded";

      if (!studentId || !validStudentIds.has(studentId)) {
        return validationError("Attendance update contains an invalid student.");
      }
      if (!academicWeek || !ACADEMIC_WEEKS.includes(academicWeek)) {
        return validationError("Attendance update contains an invalid week.");
      }
      if (!ATTENDANCE_STATUSES.has(status)) {
        return validationError("Attendance update contains an invalid status.");
      }

      if (status === "Unrecorded") {
        operations.push(
          prisma.courseWeekAttendance.deleteMany({
            where: {
              assignmentId: assignment.assignmentId,
              studentId,
              academicWeek,
            },
          })
        );
      } else {
        const notes =
          typeof update?.notes === "string" && update.notes.trim()
            ? update.notes.trim()
            : null;

        operations.push(
          prisma.courseWeekAttendance.upsert({
            where: {
              assignmentId_studentId_academicWeek: {
                assignmentId: assignment.assignmentId,
                studentId,
                academicWeek,
              },
            },
            update: {
              status,
              notes,
              recordedByUserId: context.userId,
            },
            create: {
              assignmentId: assignment.assignmentId,
              studentId,
              academicWeek,
              status,
              notes,
              recordedByUserId: context.userId,
            },
          })
        );
      }
    }

    const scoreUpdates = Array.isArray(body.scores) ? body.scores : [];
    for (const update of scoreUpdates) {
      const studentId = parsePositiveInt(update?.studentId);
      const assessmentItemId = parsePositiveInt(update?.assessmentItemId);
      const item = assessmentById.get(assessmentItemId);

      if (!studentId || !validStudentIds.has(studentId)) {
        return validationError("Score update contains an invalid student.");
      }
      if (!item) {
        return validationError("Score update contains an invalid assessment item.");
      }

      const rawMarks = update?.marks;
      const marks =
        rawMarks === null || rawMarks === undefined || rawMarks === ""
          ? null
          : Number(rawMarks);

      if (marks !== null && (!Number.isFinite(marks) || marks < 0 || marks > item.maxMarks)) {
        return validationError(
          `${item.title} marks must be between 0 and ${item.maxMarks}.`
        );
      }

      const feedback =
        typeof update?.feedback === "string" && update.feedback.trim()
          ? update.feedback.trim()
          : null;

      operations.push(
        prisma.studentAssessmentScore.upsert({
          where: {
            assessmentItemId_studentId: {
              assessmentItemId,
              studentId,
            },
          },
          update: {
            marks,
            feedback,
            gradedByUserId: context.userId,
            gradedAt: marks === null ? null : new Date(),
          },
          create: {
            assessmentItemId,
            studentId,
            marks,
            feedback,
            gradedByUserId: context.userId,
            gradedAt: marks === null ? null : new Date(),
          },
        })
      );
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    await syncResultsForAssignment(assignment, assessmentItems, gradeRules);

    const refreshed = await loadAssignment(
      context,
      courseId,
      assignment.assignmentId
    );
    const payload = await buildGradebookPayload({
      context,
      course: refreshed.course,
      assignments: refreshed.assignments,
      assignment: refreshed.assignment,
      assessmentItems,
      gradeRules,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error updating gradebook:", error);
    return NextResponse.json(
      { error: "Failed to update gradebook" },
      { status: 500 }
    );
  }
}
