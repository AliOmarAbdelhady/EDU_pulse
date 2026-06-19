import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PYTHON_BACKEND = process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

export async function GET(request, { params }) {
  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { reportId: parseInt(id) },
  });

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  // Build the CSV as a Blob by re-using the download route logic inline
  const downloadUrl = new URL(
    `/api/reports/${id}/download`,
    request.url
  );
  const csvRes = await fetch(downloadUrl.toString());
  const csvText = await csvRes.text();

  if (!csvText || csvText.startsWith("No data")) {
    return Response.json(
      { error: "No data available to summarize for this report." },
      { status: 422 }
    );
  }

  // POST the CSV to the Python backend internal summarizer endpoint
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([csvText], { type: "text/csv" }),
    `report_${id}.csv`
  );
  formData.append("lecture_id", String(report.parameters?.entityId || id));

  let pyRes;
  try {
    pyRes = await fetch(`${PYTHON_BACKEND}/summarize/csv/internal`, {
      method: "POST",
      headers: {
        "X-Internal-Key": process.env.INTERNAL_API_KEY || "edupulse-internal-key",
      },
      body: formData,
    });
  } catch (err) {
    return Response.json(
      { error: "Python backend is not reachable. Make sure it is running on port 8001." },
      { status: 503 }
    );
  }

  if (!pyRes.ok) {
    const detail = await pyRes.text().catch(() => "unknown error");
    return Response.json(
      { error: `Summarizer returned ${pyRes.status}: ${detail}` },
      { status: pyRes.status }
    );
  }

  const summary = await pyRes.json();
  return Response.json(summary);
}
