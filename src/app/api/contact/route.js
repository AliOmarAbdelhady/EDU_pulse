import prisma from "@/lib/prisma";

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
  return typeof email === "string" && /.+@.+\..+/.test(email);
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const name = asTrimmedString(formData.get("name"));
    const email = asTrimmedString(formData.get("email"));
    const organization = asTrimmedString(formData.get("organization"));
    const message = asTrimmedString(formData.get("message"));

    if (!name || !isValidEmail(email) || !message) {
      return Response.redirect(new URL("/contact?error=1", request.url));
    }

    const userAgent = request.headers.get("user-agent") || undefined;
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || undefined;

    await prisma.auditLog.create({
      data: {
        action: "contact_message",
        entityType: "contact",
        ipAddress,
        newValues: {
          name,
          email,
          organization: organization || undefined,
          message,
          userAgent,
        },
      },
    });

    return Response.redirect(new URL("/contact?sent=1", request.url));
  } catch {
    return Response.redirect(new URL("/contact?error=1", request.url));
  }
}
