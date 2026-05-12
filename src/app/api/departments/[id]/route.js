import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 120;

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { departmentId: parseInt(id, 10) },
      include: {
        _count: {
          select: { students: true, lecturers: true, courses: true },
        },
        lecturers: {
          include: {
            user: { select: { username: true, email: true } },
            _count: { select: { assignments: true } },
          },
        },
        courses: {
          include: {
            _count: { select: { studentGroups: true } },
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(department, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' } });
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json(
      { error: "Failed to fetch department" },
      { status: 500 }
    );
  }
}
