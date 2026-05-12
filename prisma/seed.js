import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create departments
  const cs = await prisma.department.create({
    data: { name: "Computer Science", code: "CS", faculty: "Faculty of Computing" },
  });
  const math = await prisma.department.create({
    data: { name: "Mathematics", code: "MATH", faculty: "Faculty of Science" },
  });
  const phys = await prisma.department.create({
    data: { name: "Physics", code: "PHY", faculty: "Faculty of Science" },
  });
  const eng = await prisma.department.create({
    data: { name: "Engineering", code: "ENG", faculty: "Faculty of Engineering" },
  });
  const bio = await prisma.department.create({
    data: { name: "Biology", code: "BIO", faculty: "Faculty of Science" },
  });

  console.log("Created departments");

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@edupulse.edu",
      password: adminHash,
      role: "ADMIN",
    },
  });

  // Create lecturer users with profiles
  const lecturer1Hash = await bcrypt.hash("lecturer123", 12);
  const lecturer1 = await prisma.user.create({
    data: {
      name: "Dr. Sarah Smith",
      email: "smith@edupulse.edu",
      password: lecturer1Hash,
      role: "LECTURER",
      lecturerProfile: {
        create: { staffId: "L01", departmentId: cs.id, title: "Dr." },
      },
    },
  });

  const lecturer2Hash = await bcrypt.hash("lecturer123", 12);
  const lecturer2 = await prisma.user.create({
    data: {
      name: "Prof. James Lee",
      email: "lee@edupulse.edu",
      password: lecturer2Hash,
      role: "LECTURER",
      lecturerProfile: {
        create: { staffId: "L02", departmentId: cs.id, title: "Prof." },
      },
    },
  });

  const lecturer3Hash = await bcrypt.hash("lecturer123", 12);
  const lecturer3 = await prisma.user.create({
    data: {
      name: "Dr. Emily Brown",
      email: "brown@edupulse.edu",
      password: lecturer3Hash,
      role: "LECTURER",
      lecturerProfile: {
        create: { staffId: "L03", departmentId: math.id, title: "Dr." },
      },
    },
  });

  console.log("Created lecturers");

  // Create courses
  const course1 = await prisma.course.create({
    data: {
      code: "CS301",
      name: "Introduction to AI",
      credits: 3,
      semester: "Spring 2026",
      level: "300",
      departmentId: cs.id,
      lecturerId: lecturer1.lecturerProfile.id,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      code: "CS401",
      name: "Machine Learning",
      credits: 4,
      semester: "Spring 2026",
      level: "400",
      departmentId: cs.id,
      lecturerId: lecturer1.lecturerProfile.id,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      code: "MATH201",
      name: "Linear Algebra",
      credits: 3,
      semester: "Spring 2026",
      level: "200",
      departmentId: math.id,
      lecturerId: lecturer3.lecturerProfile.id,
    },
  });

  console.log("Created courses");

  // Create student users with profiles
  const emotions = ["HAPPY", "SAD", "ANGRY", "SURPRISED", "NEUTRAL", "CONFUSED", "BORED", "ENGAGED", "FEARFUL"];
  const students = [];

  for (let i = 1; i <= 20; i++) {
    const hash = await bcrypt.hash("student123", 12);
    const student = await prisma.user.create({
      data: {
        name: `Student ${i}`,
        email: `student${i}@edupulse.edu`,
        password: hash,
        role: "STUDENT",
        studentProfile: {
          create: {
            studentId: `S${String(i).padStart(2, "0")}`,
            departmentId: [cs.id, math.id, phys.id, eng.id, bio.id][i % 5],
            enrollmentYear: 2024 + Math.floor(i / 8),
            currentLevel: `${(Math.floor((i - 1) / 5) + 1) * 100}`,
          },
        },
      },
    });
    students.push(student);
  }

  console.log("Created 20 students");

  // Enroll students in courses
  for (const student of students) {
    const courseIds = [course1.id, course2.id, course3.id];
    for (const courseId of courseIds.slice(0, 2 + (students.indexOf(student) % 2))) {
      await prisma.enrollment.create({
        data: {
          studentId: student.studentProfile.id,
          courseId,
        },
      }).catch(() => {}); // Skip if already enrolled
    }
  }

  console.log("Enrolled students");

  // Create lectures and emotion records
  for (let l = 1; l <= 5; l++) {
    const lecture = await prisma.lecture.create({
      data: {
        title: `Lecture ${l}: ${["Intro", "Foundations", "Advanced Topics", "Applications", "Review"][l - 1]}`,
        courseId: course1.id,
        date: new Date(2026, 4, l),
        startTime: new Date(2026, 4, l, 9, 0),
        endTime: new Date(2026, 4, l, 10, 30),
        venue: `Room ${100 + l}`,
        status: l < 5 ? "COMPLETED" : "SCHEDULED",
        sessionNumber: l,
        topic: ["Introduction", "Neural Networks", "Deep Learning", "NLP", "Review"][l - 1],
      },
    });

    // Create emotion records for each student in this lecture
    if (l < 5) {
      for (const student of students.slice(0, 15)) {
        const numRecords = 3 + Math.floor(Math.random() * 5);
        for (let r = 0; r < numRecords; r++) {
          const emotion = emotions[Math.floor(Math.random() * emotions.length)];
          await prisma.emotionRecord.create({
            data: {
              studentId: student.studentProfile.id,
              lectureId: lecture.id,
              emotion,
              confidence: 0.5 + Math.random() * 0.5,
              source: "camera",
              recordedAt: new Date(2026, 4, l, 9 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60)),
            },
          });
        }

        // Create engagement score
        const positiveEmotions = ["HAPPY", "ENGAGED", "SURPRISED"];
        const emotionRecords = await prisma.emotionRecord.findMany({
          where: { studentId: student.studentProfile.id, lectureId: lecture.id },
        });
        const positiveCount = emotionRecords.filter((e) => positiveEmotions.includes(e.emotion)).length;
        const score = Math.round((positiveCount / Math.max(emotionRecords.length, 1)) * 100);

        await prisma.engagement.create({
          data: {
            studentId: student.studentProfile.id,
            lectureId: lecture.id,
            score,
            attentionLevel: 0.4 + Math.random() * 0.6,
            category: score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW",
            calculatedAt: new Date(2026, 4, l, 10, 30),
          },
        }).catch(() => {});
      }
    }
  }

  console.log("Created lectures with emotion records");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
