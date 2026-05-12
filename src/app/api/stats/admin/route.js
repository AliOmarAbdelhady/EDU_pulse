import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 30;

export async function GET() {
  try {
    const [
      totalUsers,
      totalDepartments,
      totalCourses,
      totalEmotionRecords,
      recentUsers,
      activeSessions,
      lecturesToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.department.count(),
      prisma.course.count(),
      prisma.emotionRecord.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          userId: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          student: { select: { fullName: true } },
          lecturer: { select: { fullName: true } },
          admin: { select: { fullName: true } },
        },
      }),
      prisma.loginSession.count({
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.lecture.count({
        where: {
          lectureDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    const formattedRecentUsers = recentUsers.map((u) => ({
      name: u.student?.fullName || u.lecturer?.fullName || u.admin?.fullName || u.username,
      email: u.email,
      role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
      createdAt: u.createdAt,
    }));

    return NextResponse.json(
      {
        totalUsers,
        totalDepartments,
        totalCourses,
        totalEmotionRecords,
        recentUsers: formattedRecentUsers,
        activeSessions,
        lecturesToday,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    );
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
