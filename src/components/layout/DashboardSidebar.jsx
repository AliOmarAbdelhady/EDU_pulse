"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Users,
  GraduationCap,
  Building2,
  Bell,
  FileText,
  ClipboardList,
  CalendarCheck2,
  Camera,
  FileUp,
  LogOut,
  ChevronLeft,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOut } from "next-auth/react";

const studentNav = [
  { href: "/dashboard/student", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/my-grades", icon: ClipboardList, label: "My Grades" },
  { href: "/my-attendance", icon: CalendarCheck2, label: "My Attendance" },
  { href: "/emotions", icon: BarChart3, label: "My Emotions" },
  { href: "/lectures", icon: BookOpen, label: "Lectures" },
  { href: "/courses", icon: GraduationCap, label: "Courses" },
  { href: "/lecture-content", icon: FileUp, label: "Materials" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

const lecturerNav = [
  { href: "/dashboard/lecturer", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/emotions", icon: BarChart3, label: "Emotion Analysis" },
  { href: "/lectures", icon: BookOpen, label: "Lectures" },
  { href: "/courses", icon: GraduationCap, label: "Courses" },
  { href: "/lecture-content", icon: FileUp, label: "Materials" },
  { href: "/grades", icon: ClipboardList, label: "Grades" },
  { href: "/attendance", icon: CalendarCheck2, label: "Attendance" },
  { href: "/attendance/face-recognition", icon: Camera, label: "Face Attendance" },
  { href: "/students", icon: Users, label: "Students" },
  { href: "/at-risk", icon: ShieldAlert, label: "At-Risk" },
  { href: "/reports", icon: FileText, label: "Reports" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

const adminNav = [
  { href: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/emotions", icon: BarChart3, label: "Emotion Analysis" },
  { href: "/lectures", icon: BookOpen, label: "Lectures" },
  { href: "/students", icon: Users, label: "Students" },
  { href: "/courses", icon: GraduationCap, label: "Courses" },
  { href: "/lecture-content", icon: FileUp, label: "Materials" },
  { href: "/departments", icon: Building2, label: "Departments" },
  { href: "/at-risk", icon: ShieldAlert, label: "At-Risk" },
  { href: "/reports", icon: FileText, label: "Reports" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export default function DashboardSidebar({ role = "STUDENT", collapsed, onToggle }) {
  const pathname = usePathname();

  const navItems =
    role === "ADMIN"
      ? adminNav
      : role === "LECTURER"
      ? lecturerNav
      : studentNav;

  return (
    <aside
      style={{ width: collapsed ? 72 : 260 }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-card border-r border-border transition-[width] duration-200 ease-in-out"
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-foreground shrink-0" />
          {!collapsed && (
            <span
              className="text-lg font-extrabold text-foreground whitespace-nowrap animate-[fadeIn_200ms_ease-in-out]"
            >
              EDU<span className="text-primary">Pulse</span>
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span
                  className="whitespace-nowrap animate-[fadeIn_200ms_ease-in-out]"
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors w-full"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
