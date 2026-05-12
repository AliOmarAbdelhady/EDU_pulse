"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ModeSwitch({ mode, onModeChange }) {
  return (
    <div
      className={cn(
        "w-full flex rounded-full p-1 mb-6",
        "border border-slate-200/80 dark:border-slate-800/80",
        "bg-slate-100/90 dark:bg-slate-900/70"
      )}
    >
      {["login", "signup"].map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onModeChange(m)}
          aria-pressed={mode === m}
          className={cn(
            "relative flex-1 py-2.5 text-sm font-semibold rounded-full transition-colors duration-150",
            mode === m
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {mode === m && (
            <motion.div
              layoutId="mode-pill"
              className="absolute inset-0 rounded-full bg-white dark:bg-slate-800 shadow-sm"
              style={{ zIndex: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            />
          )}
          <span className="relative z-10">
            {m === "login" ? "Log in" : "Sign up"}
          </span>
        </button>
      ))}
    </div>
  );
}
