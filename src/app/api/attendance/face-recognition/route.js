import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionContext, assignmentAccessWhere } from "@/lib/api/access";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

export async function POST(request) {
  try {
    const context = await getSessionContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (context.role !== "lecturer" && context.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { image, assignmentId } = body;

    if (!image || !assignmentId) {
      return NextResponse.json(
        { error: "Missing image or assignmentId" },
        { status: 400 }
      );
    }

    const assignmentScope = assignmentAccessWhere(context);
    const assignment = await prisma.lecturerCourseAssignment.findFirst({
      where: { assignmentId: Number(assignmentId), ...assignmentScope },
      include: {
        group: {
          include: {
            memberships: {
              where: { status: "active" },
              include: {
                student: {
                  include: {
                    user: { select: { username: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const groupStudents = assignment.group.memberships.map((m) => ({
      studentId: m.student.studentId,
      studentCode: m.student.studentCode,
      fullName: m.student.fullName,
    }));

    const studentCodeToId = new Map(
      groupStudents.map((s) => [s.studentCode, s])
    );

    let pythonRes;
    try {
      pythonRes = await fetch(`${PYTHON_SERVICE_URL}/recognize-faces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
    } catch (fetchErr) {
      console.error("Backend AI service unreachable:", fetchErr.message);
      return NextResponse.json(
        { error: "Face recognition service is not running. Start the backend AI service on port 8001 first." },
        { status: 502 }
      );
    }

    if (!pythonRes.ok) {
      const errText = await pythonRes.text().catch(() => "");
      console.error("Backend AI service error:", pythonRes.status, errText);
      return NextResponse.json(
        { error: "Face recognition service error" },
        { status: 502 }
      );
    }

    const pythonData = await pythonRes.json();

    const matchedStudents = pythonData.faces
      .filter((f) => f.student_code !== null)
      .map((f) => {
        const student = studentCodeToId.get(f.student_code);
        if (!student) return null;
        return {
          studentId: student.studentId,
          studentCode: student.studentCode,
          fullName: student.fullName,
          confidence: f.confidence,
          faceBox: f.face_box,
        };
      })
      .filter(Boolean);

    const unrecognizedFaces = pythonData.faces.filter(
      (f) => f.student_code === null
    ).length;

    return NextResponse.json({
      matchedStudents,
      unrecognizedFaces,
      totalFacesDetected: pythonData.total_faces_detected,
      processingTimeMs: pythonData.processing_time_ms,
    });
  } catch (error) {
    console.error("Face recognition error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
