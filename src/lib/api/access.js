import { cache } from "react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export function parsePositiveInt(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const getSessionContext = cache(async function getSessionContext() {
  const session = await auth();
  const userId = parsePositiveInt(session?.user?.id);
  const role = String(session?.user?.role || "").toLowerCase();

  if (!userId) return null;

  const context = {
    userId,
    role,
    lecturerId: null,
    studentId: null,
  };

  if (role === "lecturer") {
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId },
      select: { lecturerId: true },
    });
    context.lecturerId = lecturer?.lecturerId || null;
  }

  if (role === "student") {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { studentId: true },
    });
    context.studentId = student?.studentId || null;
  }

  return context;
});

export function courseAccessWhere(context) {
  if (context?.role === "admin") return {};
  if (context?.role === "lecturer" && context.lecturerId) {
    return {
      assignments: {
        some: { lecturerId: context.lecturerId },
      },
    };
  }
  if (context?.role === "student" && context.studentId) {
    return {
      studentGroups: {
        some: {
          memberships: {
            some: { studentId: context.studentId },
          },
        },
      },
    };
  }

  return { courseId: -1 };
}

export function assignmentAccessWhere(context) {
  if (context?.role === "admin") return {};
  if (context?.role === "lecturer" && context.lecturerId) {
    return { lecturerId: context.lecturerId };
  }
  if (context?.role === "student" && context.studentId) {
    return {
      group: {
        memberships: {
          some: { studentId: context.studentId },
        },
      },
    };
  }

  return { assignmentId: -1 };
}

export function studentGroupAccessWhere(context) {
  if (context?.role === "admin") return {};
  if (context?.role === "lecturer" && context.lecturerId) {
    return {
      assignments: {
        some: { lecturerId: context.lecturerId },
      },
    };
  }
  if (context?.role === "student" && context.studentId) {
    return {
      memberships: {
        some: { studentId: context.studentId },
      },
    };
  }

  return { groupId: -1 };
}

export function studentAccessWhere(context) {
  if (context?.role === "admin") return {};
  if (context?.role === "lecturer" && context.lecturerId) {
    return {
      groupMemberships: {
        some: {
          group: {
            assignments: {
              some: { lecturerId: context.lecturerId },
            },
          },
        },
      },
    };
  }
  if (context?.role === "student" && context.studentId) {
    return { studentId: context.studentId };
  }

  return { studentId: -1 };
}

export function lectureAccessWhere(context) {
  if (context?.role === "admin") return {};
  if (context?.role === "lecturer" && context.lecturerId) {
    return {
      assignment: {
        lecturerId: context.lecturerId,
      },
    };
  }
  if (context?.role === "student" && context.studentId) {
    return {
      assignment: {
        group: {
          memberships: {
            some: { studentId: context.studentId },
          },
        },
      },
    };
  }

  return { lectureId: -1 };
}

export function lectureContentAccessWhere(context) {
  if (context?.role === "admin") return {};
  if (context?.role === "lecturer" && context.lecturerId) {
    return {
      assignment: {
        lecturerId: context.lecturerId,
      },
    };
  }
  if (context?.role === "student" && context.studentId) {
    return {
      assignment: {
        group: {
          memberships: {
            some: { studentId: context.studentId },
          },
        },
      },
    };
  }

  return { contentId: -1 };
}

export function andWhere(...clauses) {
  const filtered = clauses.filter(Boolean);
  if (filtered.length === 0) return {};
  if (filtered.length === 1) return filtered[0];
  return { AND: filtered };
}
