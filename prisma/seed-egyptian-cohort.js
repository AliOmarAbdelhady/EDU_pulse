const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const semesterId = "SPRING2026";
const courseCode = "CS301";
const groupCode = "CS301-EG-A";
const lecturerEmail = "ahmed.elsayed@edupulse.edu.eg";
const defaultPassword = "Egypt2026!";
const withdrawalLimit = 6;

const assessmentPlan = [
  { academicWeek: 3, title: "Week 3 assessment", category: "quiz", maxMarks: 5, displayOrder: 1 },
  { academicWeek: 4, title: "Week 4 assessment", category: "quiz", maxMarks: 5, displayOrder: 2 },
  { academicWeek: 5, title: "Week 5 assessment", category: "quiz", maxMarks: 5, displayOrder: 3 },
  { academicWeek: 7, title: "Midterm exam", category: "midterm", maxMarks: 15, displayOrder: 4 },
  { academicWeek: 11, title: "Coursework task", category: "coursework", maxMarks: 10, displayOrder: 5 },
  { academicWeek: 12, title: "Project submission", category: "project", maxMarks: 10, displayOrder: 6 },
  { academicWeek: 15, title: "Coursework assessment", category: "coursework", maxMarks: 10, displayOrder: 7 },
  { academicWeek: 16, title: "Final exam", category: "final_exam", maxMarks: 40, displayOrder: 8 },
];

const gradeScale = [
  { grade: "A+", minScore: 95, maxScore: 100, isPassing: true, displayOrder: 1, points: 4.0 },
  { grade: "A", minScore: 90, maxScore: 94.99, isPassing: true, displayOrder: 2, points: 3.7 },
  { grade: "A-", minScore: 85, maxScore: 89.99, isPassing: true, displayOrder: 3, points: 3.4 },
  { grade: "B+", minScore: 80, maxScore: 84.99, isPassing: true, displayOrder: 4, points: 3.2 },
  { grade: "B", minScore: 75, maxScore: 79.99, isPassing: true, displayOrder: 5, points: 3.0 },
  { grade: "B-", minScore: 70, maxScore: 74.99, isPassing: true, displayOrder: 6, points: 2.7 },
  { grade: "C+", minScore: 65, maxScore: 69.99, isPassing: true, displayOrder: 7, points: 2.3 },
  { grade: "C", minScore: 60, maxScore: 64.99, isPassing: true, displayOrder: 8, points: 2.0 },
  { grade: "D+", minScore: 55, maxScore: 59.99, isPassing: true, displayOrder: 9, points: 1.5 },
  { grade: "D", minScore: 50, maxScore: 54.99, isPassing: true, displayOrder: 10, points: 1.0 },
  { grade: "F", minScore: 0, maxScore: 49.99, isPassing: false, displayOrder: 11, points: 0 },
];

const students = [
  { code: "EG260001", name: "Omar Mohamed Hassan", email: "omar.hassan2026@edupulse.edu.eg", phone: "+201001230001", total: 96, absences: [9] },
  { code: "EG260002", name: "Mariam Ahmed Ali", email: "mariam.ali2026@edupulse.edu.eg", phone: "+201001230002", total: 92, absences: [4, 13] },
  { code: "EG260003", name: "Youssef Mahmoud Ibrahim", email: "youssef.ibrahim2026@edupulse.edu.eg", phone: "+201001230003", total: 88, absences: [2] },
  { code: "EG260004", name: "Nour Khaled Mostafa", email: "nour.mostafa2026@edupulse.edu.eg", phone: "+201001230004", total: 84, absences: [6, 14] },
  { code: "EG260005", name: "Salma Tarek El-Din", email: "salma.tarek2026@edupulse.edu.eg", phone: "+201001230005", total: 79, absences: [1, 8, 15] },
  { code: "EG260006", name: "Hana Sameh Farouk", email: "hana.farouk2026@edupulse.edu.eg", phone: "+201001230006", total: 75, absences: [3, 10] },
  { code: "EG260007", name: "Karim Hany Abdelrahman", email: "karim.abdelrahman2026@edupulse.edu.eg", phone: "+201001230007", total: 71, absences: [5, 11, 13] },
  { code: "EG260008", name: "Farida Sherif Nabil", email: "farida.nabil2026@edupulse.edu.eg", phone: "+201001230008", total: 68, absences: [7] },
  { code: "EG260009", name: "Ziad Amr Fathy", email: "ziad.fathy2026@edupulse.edu.eg", phone: "+201001230009", total: 63, absences: [2, 6, 10, 14] },
  { code: "EG260010", name: "Laila Hesham Younis", email: "laila.younis2026@edupulse.edu.eg", phone: "+201001230010", total: 58, absences: [4, 8, 12] },
  { code: "EG260011", name: "Adham Wael Saad", email: "adham.saad2026@edupulse.edu.eg", phone: "+201001230011", total: 52, absences: [1, 3, 5, 7, 9] },
  { code: "EG260012", name: "Malak Peter Girgis", email: "malak.girgis2026@edupulse.edu.eg", phone: "+201001230012", total: 47, absences: [3, 12] },
  { code: "EG260013", name: "Ahmed Magdy Sobhy", email: "ahmed.sobhy2026@edupulse.edu.eg", phone: "+201001230013", total: 82, absences: [2, 4] },
  { code: "EG260014", name: "Jana Mohamed Samir", email: "jana.samir2026@edupulse.edu.eg", phone: "+201001230014", total: 90, absences: [] },
  { code: "EG260015", name: "Seif Mostafa Adel", email: "seif.adel2026@edupulse.edu.eg", phone: "+201001230015", total: 73, absences: [6, 7, 8, 9] },
  { code: "EG260016", name: "Habiba Walid Amin", email: "habiba.amin2026@edupulse.edu.eg", phone: "+201001230016", total: 86, absences: [11] },
  { code: "EG260017", name: "Mazen Alaa Kamel", email: "mazen.kamel2026@edupulse.edu.eg", phone: "+201001230017", total: 61, absences: [1, 5, 10, 13, 15] },
  { code: "EG260018", name: "Yara Ashraf Soliman", email: "yara.soliman2026@edupulse.edu.eg", phone: "+201001230018", total: 94, absences: [12] },
  { code: "EG260019", name: "Mohamed Islam Ramadan", email: "mohamed.ramadan2026@edupulse.edu.eg", phone: "+201001230019", total: 69, absences: [1, 2, 3, 4, 5, 6] },
  { code: "EG260020", name: "Menna Emad Lotfy", email: "menna.lotfy2026@edupulse.edu.eg", phone: "+201001230020", total: 77, absences: [8, 9, 10, 11, 12, 13] },
];

function usernameFromEmail(email) {
  return email.split("@")[0];
}

function resultForScore(score, absenceCount) {
  if (absenceCount >= withdrawalLimit) {
    return { grade: "W", status: "withdrawn", points: 0 };
  }

  const rule = gradeScale.find(
    (item) => score >= item.minScore && score <= item.maxScore
  ) || gradeScale[gradeScale.length - 1];

  return {
    grade: rule.grade,
    status: score >= 50 ? "passed" : "failed",
    points: rule.points,
  };
}

function splitMarks(total) {
  const ratio = total / 100;
  return [
    Math.min(5, Math.round(5 * ratio * 4) / 4),
    Math.min(5, Math.round(5 * ratio * 4) / 4),
    Math.min(5, Math.round(5 * ratio * 4) / 4),
    Math.min(15, Math.round(15 * ratio * 4) / 4),
    Math.min(10, Math.round(10 * ratio * 4) / 4),
    Math.min(10, Math.round(10 * ratio * 4) / 4),
    Math.min(10, Math.round(10 * ratio * 4) / 4),
    0,
  ];
}

function rebalanceFinal(marks, targetTotal) {
  const partial = marks.slice(0, 7).reduce((sum, mark) => sum + mark, 0);
  marks[7] = Math.max(0, Math.min(40, Math.round((targetTotal - partial) * 4) / 4));
  return marks;
}

async function ensureUser({ email, username, passwordHash, role }) {
  return prisma.user.upsert({
    where: { email },
    update: {
      username,
      passwordHash,
      role,
      isActive: true,
    },
    create: {
      email,
      username,
      passwordHash,
      role,
      isActive: true,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const existingDepartment = await prisma.department.findFirst({
    where: { departmentCode: "CS" },
  });

  const department = existingDepartment
    ? await prisma.department.update({
        where: { departmentId: existingDepartment.departmentId },
        data: {
          departmentName: "Computer Science",
          building: "Smart Village Campus - Building B",
        },
      })
    : await prisma.department.create({
        data: {
          departmentCode: "CS",
          departmentName: "Computer Science",
          building: "Smart Village Campus - Building B",
        },
      });

  await prisma.department.update({
    where: { departmentId: department.departmentId },
    data: {
      departmentName: "Computer Science",
      building: "Smart Village Campus - Building B",
    },
  });

  const semester = await prisma.semester.upsert({
    where: { semesterId },
    update: { semesterName: "Spring 2026", isActive: true },
    create: {
      semesterId,
      semesterName: "Spring 2026",
      startDate: new Date("2026-02-07T00:00:00.000Z"),
      endDate: new Date("2026-06-06T00:00:00.000Z"),
      isActive: true,
    },
  });

  const course = await prisma.course.findFirst({
    where: { courseCode },
  });

  if (!course) {
    throw new Error(`Course ${courseCode} was not found.`);
  }

  const lecturerUser = await ensureUser({
    email: lecturerEmail,
    username: "dr.ahmed.elsayed",
    passwordHash,
    role: "lecturer",
  });

  const lecturer = await prisma.lecturer.upsert({
    where: { userId: lecturerUser.userId },
    update: {
      lecturerCode: "EGCS001",
      fullName: "Dr. Ahmed Hassan El-Sayed",
      departmentId: department.departmentId,
      title: "Dr.",
      specialization: "Artificial Intelligence and Machine Learning",
      phone: "+201000450321",
      academicRank: "Associate Professor",
      officeLocation: "Smart Village Campus, Building B, Office 304",
      officeHours: "Sunday and Tuesday, 11:00 AM - 1:00 PM",
      hireDate: new Date("2018-09-01T00:00:00.000Z"),
    },
    create: {
      userId: lecturerUser.userId,
      lecturerCode: "EGCS001",
      fullName: "Dr. Ahmed Hassan El-Sayed",
      departmentId: department.departmentId,
      title: "Dr.",
      specialization: "Artificial Intelligence and Machine Learning",
      phone: "+201000450321",
      academicRank: "Associate Professor",
      officeLocation: "Smart Village Campus, Building B, Office 304",
      officeHours: "Sunday and Tuesday, 11:00 AM - 1:00 PM",
      hireDate: new Date("2018-09-01T00:00:00.000Z"),
    },
  });

  const group =
    (await prisma.studentGroup.findFirst({ where: { groupCode } })) ||
    (await prisma.studentGroup.create({
      data: {
        groupCode,
        groupName: "Egyptian AI Cohort A",
        courseId: course.courseId,
        semesterId: semester.semesterId,
      },
    }));

  await prisma.studentGroup.update({
    where: { groupId: group.groupId },
    data: {
      groupName: "Egyptian AI Cohort A",
      courseId: course.courseId,
      semesterId: semester.semesterId,
    },
  });

  let assignment = await prisma.lecturerCourseAssignment.findFirst({
    where: {
      lecturerId: lecturer.lecturerId,
      courseId: course.courseId,
      groupId: group.groupId,
      semesterId: semester.semesterId,
    },
  });

  if (!assignment) {
    assignment = await prisma.lecturerCourseAssignment.create({
      data: {
        lecturerId: lecturer.lecturerId,
        courseId: course.courseId,
        groupId: group.groupId,
        semesterId: semester.semesterId,
        role: "primary",
      },
    });
  }

  await prisma.gradeScaleRule.createMany({
    data: gradeScale.map(({ points, ...rule }) => rule),
    skipDuplicates: true,
  });

  await prisma.courseAssessmentItem.createMany({
    data: assessmentPlan.map((item) => ({
      ...item,
      assignmentId: assignment.assignmentId,
      isRequired: true,
    })),
    skipDuplicates: true,
  });

  const assessmentItems = await prisma.courseAssessmentItem.findMany({
    where: { assignmentId: assignment.assignmentId },
    orderBy: [{ displayOrder: "asc" }, { academicWeek: "asc" }],
  });

  const createdStudents = [];

  for (const studentData of students) {
    const user = await ensureUser({
      email: studentData.email,
      username: usernameFromEmail(studentData.email),
      passwordHash,
      role: "student",
    });

    const absenceCount = studentData.absences.length;
    const computed = resultForScore(studentData.total, absenceCount);
    const gpa =
      computed.grade === "W"
        ? 0
        : Math.min(
            4,
            Math.round(
              (computed.points + (computed.points > 0 ? 0.15 : 0)) * 100
            ) / 100
          );
    const academicStanding =
      computed.grade === "W"
        ? "Withdrawn"
        : gpa >= 3.4
        ? "Excellent"
        : gpa >= 2.0
        ? "Good Standing"
        : "Academic Probation";

    const student = await prisma.student.upsert({
      where: { userId: user.userId },
      update: {
        studentCode: studentData.code,
        fullName: studentData.name,
        departmentId: department.departmentId,
        enrollmentYear: 2026,
        degreeLevel: "Undergraduate",
        phone: studentData.phone,
        gpa,
        completedCreditHours: computed.grade === "W" ? 30 : 33,
        academicStanding,
      },
      create: {
        userId: user.userId,
        studentCode: studentData.code,
        fullName: studentData.name,
        departmentId: department.departmentId,
        enrollmentYear: 2026,
        degreeLevel: "Undergraduate",
        phone: studentData.phone,
        gpa,
        completedCreditHours: computed.grade === "W" ? 30 : 33,
        academicStanding,
      },
    });

    const existingMembership = await prisma.groupMembership.findFirst({
      where: {
        groupId: group.groupId,
        studentId: student.studentId,
      },
    });

    const withdrawalReason =
      absenceCount >= withdrawalLimit
        ? `Automatic withdrawal: ${absenceCount} absences in this course.`
        : null;

    if (existingMembership) {
      await prisma.groupMembership.update({
        where: { membershipId: existingMembership.membershipId },
        data: {
          status: absenceCount >= withdrawalLimit ? "withdrawn" : "active",
          withdrawnAt: absenceCount >= withdrawalLimit ? new Date("2026-05-30T00:00:00.000Z") : null,
          withdrawalReason,
        },
      });
    } else {
      await prisma.groupMembership.create({
        data: {
          groupId: group.groupId,
          studentId: student.studentId,
          status: absenceCount >= withdrawalLimit ? "withdrawn" : "active",
          withdrawnAt: absenceCount >= withdrawalLimit ? new Date("2026-05-30T00:00:00.000Z") : null,
          withdrawalReason,
        },
      });
    }

    const absentWeeks = new Set(studentData.absences);
    for (let week = 1; week <= 16; week += 1) {
      const status = absentWeeks.has(week)
        ? "Absent"
        : week % 5 === 0 && student.studentId % 3 === 0
        ? "Late"
        : "Present";

      await prisma.courseWeekAttendance.upsert({
        where: {
          assignmentId_studentId_academicWeek: {
            assignmentId: assignment.assignmentId,
            studentId: student.studentId,
            academicWeek: week,
          },
        },
        update: {
          status,
          recordedByUserId: lecturerUser.userId,
          notes: status === "Absent" ? "Recorded manually by lecturer" : null,
        },
        create: {
          assignmentId: assignment.assignmentId,
          studentId: student.studentId,
          academicWeek: week,
          status,
          recordedByUserId: lecturerUser.userId,
          notes: status === "Absent" ? "Recorded manually by lecturer" : null,
        },
      });
    }

    const marks = rebalanceFinal(splitMarks(studentData.total), studentData.total);
    for (let index = 0; index < assessmentItems.length; index += 1) {
      const item = assessmentItems[index];
      const marksValue = Math.min(item.maxMarks, marks[index] ?? 0);

      await prisma.studentAssessmentScore.upsert({
        where: {
          assessmentItemId_studentId: {
            assessmentItemId: item.assessmentItemId,
            studentId: student.studentId,
          },
        },
        update: {
          marks: marksValue,
          feedback:
            computed.grade === "W"
              ? "Score retained, but course status is withdrawn due to attendance."
              : "Seeded Egyptian cohort gradebook record.",
          gradedByUserId: lecturerUser.userId,
          gradedAt: new Date("2026-06-06T10:00:00.000Z"),
        },
        create: {
          assessmentItemId: item.assessmentItemId,
          studentId: student.studentId,
          marks: marksValue,
          feedback:
            computed.grade === "W"
              ? "Score retained, but course status is withdrawn due to attendance."
              : "Seeded Egyptian cohort gradebook record.",
          gradedByUserId: lecturerUser.userId,
          gradedAt: new Date("2026-06-06T10:00:00.000Z"),
        },
      });
    }

    const courseworkScore = marks.slice(0, 7).reduce((sum, mark) => sum + mark, 0);
    const finalExamScore = marks[7];
    const totalScore = Math.round((courseworkScore + finalExamScore) * 100) / 100;

    await prisma.studentCourseResult.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: assignment.assignmentId,
          studentId: student.studentId,
        },
      },
      update: {
        absenceCount,
        courseworkScore,
        finalExamScore,
        totalScore,
        grade: computed.grade,
        status: computed.status,
        calculatedAt: new Date("2026-06-06T10:00:00.000Z"),
      },
      create: {
        assignmentId: assignment.assignmentId,
        studentId: student.studentId,
        absenceCount,
        courseworkScore,
        finalExamScore,
        totalScore,
        grade: computed.grade,
        status: computed.status,
        calculatedAt: new Date("2026-06-06T10:00:00.000Z"),
      },
    });

    createdStudents.push({
      code: student.studentCode,
      name: student.fullName,
      grade: computed.grade,
      totalScore,
      absenceCount,
      gpa,
      status: computed.status,
    });
  }

  console.log(
    JSON.stringify(
      {
        lecturer: {
          lecturerId: lecturer.lecturerId,
          name: lecturer.fullName,
          email: lecturerEmail,
          password: defaultPassword,
        },
        course: {
          courseId: course.courseId,
          courseCode: course.courseCode,
          courseName: course.courseName,
          groupCode,
          assignmentId: assignment.assignmentId,
        },
        students: createdStudents,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
