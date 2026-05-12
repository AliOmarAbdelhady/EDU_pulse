"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    const role = (session?.user?.role || "student").toLowerCase();
    if (role === "admin") router.replace("/dashboard/admin");
    else if (role === "lecturer") router.replace("/dashboard/lecturer");
    else router.replace("/dashboard/student");
  }, [session, status, router]);

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
