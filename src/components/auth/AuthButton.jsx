"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuthButton({
  children,
  loading,
  loadingText,
  disabled,
  fullWidth = true,
  className,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "h-12 sm:h-[54px] rounded-[18px] sm:rounded-[21px] font-bold text-sm sm:text-[15px]",
        "transition-all duration-200 outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "bg-gradient-to-br from-[var(--auth-primary-from)] to-[var(--auth-primary-to)]",
        "text-white dark:text-slate-950",
        "shadow-[0_18px_44px_-22px_rgba(22,18,47,0.82)]",
        "dark:shadow-[0_20px_44px_-26px_rgba(129,170,217,0.45)]",
        "hover:-translate-y-[2px] hover:shadow-[0_22px_50px_-20px_rgba(22,18,47,0.9)]",
        "dark:hover:shadow-[0_24px_50px_-22px_rgba(129,170,217,0.55)]",
        "disabled:opacity-70 disabled:pointer-events-none disabled:translate-y-0",
        "flex items-center justify-center gap-2",
        fullWidth ? "w-full" : "w-auto",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || "Loading..."}
        </>
      ) : (
        children
      )}
    </button>
  );
}
