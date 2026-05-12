import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 120;

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            students: true,
            lecturers: true,
            courses: true,
          },
        },
      },
      orderBy: { departmentName: "asc" },
    });

    return NextResponse.json(departments, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' } });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}
