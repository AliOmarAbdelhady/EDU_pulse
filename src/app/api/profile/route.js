import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const revalidate = 120;

const COMMON_EDITABLE_FIELDS = new Set(["displayName"]);
const STUDENT_EDITABLE_FIELDS = new Set(["displayName", "phone", "departmentId"]);
const LECTURER_EDITABLE_FIELDS = new Set([
  "displayName",
  "phone",
  "departmentId",
  "title",
  "specialization",
]);

function getDisplayName(user) {
  return (
    user.student?.fullName ||
    user.lecturer?.fullName ||
    user.admin?.fullName ||
    user.username
  );
}

function serializeDepartment(department) {
  if (!department) return null;
  return {
    id: department.departmentId,
    name: department.departmentName,
    code: department.departmentCode,
    building: department.building,
  };
}

function roleEditableFields(role) {
  if (role === "student") return STUDENT_EDITABLE_FIELDS;
  if (role === "lecturer") return LECTURER_EDITABLE_FIELDS;
  return COMMON_EDITABLE_FIELDS;
}

function normalizeNullableText(value) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDepartmentId(value) {
  if (value === null || value === "" || value === undefined) return null;
  const departmentId = Number(value);
  return Number.isInteger(departmentId) && departmentId > 0 ? departmentId : NaN;
}

async function buildProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      student: {
        include: {
          department: true,
          groupMemberships: {
            include: {
              group: {
                include: {
                  course: {
                    select: {
                      courseId: true,
                      courseCode: true,
                      courseName: true,
                    },
                  },
                  semester: {
                    select: {
                      semesterId: true,
                      semesterName: true,
                    },
                  },
                },
              },
            },
            orderBy: { joinedAt: "desc" },
          },
          _count: {
            select: {
              attendanceRecords: true,
              emotionRecords: true,
              groupMemberships: true,
            },
          },
        },
      },
      lecturer: {
        include: {
          department: true,
          assignments: {
            include: {
              course: {
                select: {
                  courseId: true,
                  courseCode: true,
                  courseName: true,
                },
              },
              group: {
                include: {
                  _count: { select: { memberships: true } },
                },
              },
              semester: {
                select: {
                  semesterId: true,
                  semesterName: true,
                },
              },
              _count: { select: { lectures: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: {
              assignments: true,
            },
          },
        },
      },
      admin: true,
      _count: {
        select: {
          reports: true,
          auditLogs: true,
          loginSessions: true,
        },
      },
    },
  });

  if (!user) return null;

  let student = null;
  let lecturer = null;
  let admin = null;
  let metrics = {};

  if (user.student) {
    const engagement = await prisma.emotionRecord.aggregate({
      where: { studentId: user.student.studentId },
      _avg: { engagementScore: true },
    });

    student = {
      id: user.student.studentId,
      code: user.student.studentCode,
      fullName: user.student.fullName,
      phone: user.student.phone,
      degreeLevel: user.student.degreeLevel,
      enrollmentYear: user.student.enrollmentYear,
      gpa: user.student.gpa,
      completedCreditHours: user.student.completedCreditHours,
      academicStanding: user.student.academicStanding,
      departmentId: user.student.departmentId,
      department: serializeDepartment(user.student.department),
      enrollments: user.student.groupMemberships.map((membership) => ({
        id: membership.membershipId,
        joinedAt: membership.joinedAt,
        group: {
          id: membership.group.groupId,
          code: membership.group.groupCode,
          name: membership.group.groupName,
        },
        course: {
          id: membership.group.course.courseId,
          code: membership.group.course.courseCode,
          name: membership.group.course.courseName,
        },
        semester: membership.group.semester
          ? {
              id: membership.group.semester.semesterId,
              name: membership.group.semester.semesterName,
            }
          : null,
      })),
    };

    metrics = {
      attendanceCount: user.student._count.attendanceRecords,
      emotionRecordCount: user.student._count.emotionRecords,
      enrolledGroupCount: user.student._count.groupMemberships,
      averageEngagement: engagement._avg.engagementScore
        ? Math.round(engagement._avg.engagementScore * 100) / 100
        : 0,
    };
  }

  if (user.lecturer) {
    const groupIds = user.lecturer.assignments.map((assignment) => assignment.groupId);
    const uniqueStudents =
      groupIds.length > 0
        ? await prisma.groupMembership.findMany({
            where: { groupId: { in: groupIds } },
            distinct: ["studentId"],
            select: { studentId: true },
          })
        : [];

    const lectureCount = user.lecturer.assignments.reduce(
      (sum, assignment) => sum + assignment._count.lectures,
      0
    );

    lecturer = {
      id: user.lecturer.lecturerId,
      code: user.lecturer.lecturerCode,
      fullName: user.lecturer.fullName,
      phone: user.lecturer.phone,
      title: user.lecturer.title,
      specialization: user.lecturer.specialization,
      academicRank: user.lecturer.academicRank,
      officeLocation: user.lecturer.officeLocation,
      officeHours: user.lecturer.officeHours,
      hireDate: user.lecturer.hireDate,
      departmentId: user.lecturer.departmentId,
      department: serializeDepartment(user.lecturer.department),
      assignments: user.lecturer.assignments.map((assignment) => ({
        id: assignment.assignmentId,
        role: assignment.role,
        course: {
          id: assignment.course.courseId,
          code: assignment.course.courseCode,
          name: assignment.course.courseName,
        },
        group: {
          id: assignment.group.groupId,
          code: assignment.group.groupCode,
          name: assignment.group.groupName,
          studentCount: assignment.group._count.memberships,
        },
        semester: assignment.semester
          ? {
              id: assignment.semester.semesterId,
              name: assignment.semester.semesterName,
            }
          : null,
        lectureCount: assignment._count.lectures,
      })),
    };

    metrics = {
      assignmentCount: user.lecturer._count.assignments,
      assignedCourseCount: new Set(
        user.lecturer.assignments.map((assignment) => assignment.courseId)
      ).size,
      lectureCount,
      studentCount: uniqueStudents.length,
    };
  }

  if (user.admin) {
    admin = {
      id: user.admin.adminId,
      fullName: user.admin.fullName,
      createdAt: user.admin.createdAt,
      updatedAt: user.admin.updatedAt,
    };

    const activeSessionCount = await prisma.loginSession.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    metrics = {
      reportCount: user._count.reports,
      auditLogCount: user._count.auditLogs,
      loginSessionCount: user._count.loginSessions,
      activeSessionCount,
    };
  }

  return {
    user: {
      id: user.userId,
      username: user.username,
      displayName: getDisplayName(user),
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    student,
    lecturer,
    admin,
    metrics,
  };
}

async function getSessionUserId() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await buildProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' } });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { userId },
      include: {
        student: true,
        lecturer: true,
        admin: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    if (!body || Array.isArray(body) || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be an object" },
        { status: 400 }
      );
    }

    const allowedFields = roleEditableFields(currentUser.role);
    const unsupportedFields = Object.keys(body).filter(
      (field) => !allowedFields.has(field)
    );

    if (unsupportedFields.length > 0) {
      return NextResponse.json(
        { error: `Unsupported field(s): ${unsupportedFields.join(", ")}` },
        { status: 400 }
      );
    }

    const userData = {};
    const studentData = {};
    const lecturerData = {};
    const adminData = {};

    if (Object.prototype.hasOwnProperty.call(body, "displayName")) {
      if (typeof body.displayName !== "string") {
        return NextResponse.json(
          { error: "Display name must be a string" },
          { status: 400 }
        );
      }

      const displayName = body.displayName.trim();
      if (!displayName) {
        return NextResponse.json(
          { error: "Display name is required" },
          { status: 400 }
        );
      }

      const duplicateUser = await prisma.user.findFirst({
        where: {
          username: displayName,
          NOT: { userId },
        },
        select: { userId: true },
      });

      if (duplicateUser) {
        return NextResponse.json(
          { error: "Display name is already in use" },
          { status: 409 }
        );
      }

      userData.username = displayName;
      if (currentUser.role === "student") studentData.fullName = displayName;
      if (currentUser.role === "lecturer") lecturerData.fullName = displayName;
      if (currentUser.role === "admin") adminData.fullName = displayName;
    }

    if (Object.prototype.hasOwnProperty.call(body, "phone")) {
      const phone = normalizeNullableText(body.phone);
      if (phone === undefined) {
        return NextResponse.json(
          { error: "Phone must be a string or null" },
          { status: 400 }
        );
      }

      if (currentUser.role === "student") studentData.phone = phone;
      if (currentUser.role === "lecturer") lecturerData.phone = phone;
    }

    if (Object.prototype.hasOwnProperty.call(body, "departmentId")) {
      const departmentId = parseDepartmentId(body.departmentId);
      if (Number.isNaN(departmentId)) {
        return NextResponse.json(
          { error: "Department id must be a valid department" },
          { status: 400 }
        );
      }

      if (departmentId !== null) {
        const department = await prisma.department.findUnique({
          where: { departmentId },
          select: { departmentId: true },
        });

        if (!department) {
          return NextResponse.json(
            { error: "Department not found" },
            { status: 400 }
          );
        }
      }

      if (currentUser.role === "student") studentData.departmentId = departmentId;
      if (currentUser.role === "lecturer") lecturerData.departmentId = departmentId;
    }

    if (Object.prototype.hasOwnProperty.call(body, "title")) {
      const title = normalizeNullableText(body.title);
      if (title === undefined) {
        return NextResponse.json(
          { error: "Title must be a string or null" },
          { status: 400 }
        );
      }
      lecturerData.title = title;
    }

    if (Object.prototype.hasOwnProperty.call(body, "specialization")) {
      const specialization = normalizeNullableText(body.specialization);
      if (specialization === undefined) {
        return NextResponse.json(
          { error: "Specialization must be a string or null" },
          { status: 400 }
        );
      }
      lecturerData.specialization = specialization;
    }

    const updates = [];
    if (Object.keys(userData).length > 0) {
      updates.push(
        prisma.user.update({
          where: { userId },
          data: userData,
        })
      );
    }

    if (Object.keys(studentData).length > 0) {
      if (!currentUser.student) {
        return NextResponse.json(
          { error: "Student profile not found" },
          { status: 404 }
        );
      }
      updates.push(
        prisma.student.update({
          where: { userId },
          data: studentData,
        })
      );
    }

    if (Object.keys(lecturerData).length > 0) {
      if (!currentUser.lecturer) {
        return NextResponse.json(
          { error: "Lecturer profile not found" },
          { status: 404 }
        );
      }
      updates.push(
        prisma.lecturer.update({
          where: { userId },
          data: lecturerData,
        })
      );
    }

    if (Object.keys(adminData).length > 0) {
      if (!currentUser.admin) {
        return NextResponse.json(
          { error: "Admin profile not found" },
          { status: 404 }
        );
      }
      updates.push(
        prisma.admin.update({
          where: { userId },
          data: adminData,
        })
      );
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    const profile = await buildProfile(userId);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile update error:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Display name is already in use" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
