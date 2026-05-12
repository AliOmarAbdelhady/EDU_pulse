"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, LogOut, MoreVertical, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/lib/hooks/useProfile";
import { useNotifications } from "@/lib/hooks/useNotifications";
import ThemeToggle from "@/components/shared/ThemeToggle";

export default function DashboardHeader({ collapsed }) {
  const { data: session } = useSession();
  const { data: profile } = useProfile();
  const user = session?.user;
  const { data: notifications } = useNotifications(user?.id);
  const unreadCount = (notifications || []).filter((item) => !item.isRead).length;
  const displayName = profile?.user?.displayName || user?.name || "User";
  const role = profile?.user?.role || user?.role || "Student";
  const initials = displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 transition-[left] duration-200",
        collapsed ? "left-[72px]" : "left-[260px]"
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lectures, students, courses..."
            className="pl-10 bg-muted border-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <Button asChild variant="ghost" size="icon" className="relative">
          <Link href="/notifications">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-danger text-white border-0">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Link>
        </Button>

        <Button asChild variant="ghost" className="flex items-center gap-2 px-2">
          <Link href="/profile">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-none">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {role}
              </p>
            </div>
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/profile" className="w-full">
                  Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-danger"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
