import AuthLayoutShell from "@/components/auth/AuthLayoutShell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }) {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return <AuthLayoutShell>{children}</AuthLayoutShell>;
}
