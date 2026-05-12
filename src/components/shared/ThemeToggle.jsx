"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "rounded-full border border-border bg-background/80 hover:bg-muted",
        className
      )}
      aria-label="Toggle dark mode"
    >
      <Sun className="h-4 w-4 text-foreground hidden dark:block" />
      <Moon className="h-4 w-4 text-foreground block dark:hidden" />
    </Button>
  );
}
