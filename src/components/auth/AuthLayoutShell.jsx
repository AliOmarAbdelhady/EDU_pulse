"use client";

import { GraduationCap } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/components/shared/ThemeToggle";

export default function AuthLayoutShell({ children }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Ambient background circles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-slate-500/15 dark:bg-slate-600/10 blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[80px]" />
      </div>

      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 h-16 bg-background/60 backdrop-blur-lg border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            EDU<span className="text-primary">Pulse</span>
          </span>
        </Link>

        <ThemeToggle className="h-9 w-9" />
      </header>

      {/* Main centered area */}
      <main className="flex flex-col items-center justify-center min-h-screen pt-24 pb-12 px-3 sm:px-5">
        {children}
      </main>
    </div>
  );
}
