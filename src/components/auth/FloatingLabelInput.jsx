"use client";

import { useState, useId } from "react";
import { cn } from "@/lib/utils";

export default function FloatingLabelInput({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  rightAction,
  autoComplete,
  required,
  disabled,
  id: externalId,
  className,
}) {
  const generatedId = useId();
  const id = externalId || generatedId;
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== "";
  const isFloating = focused || hasValue;

  return (
    <div className={cn("relative", className)}>
      {Icon && (
        <Icon
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] transition-colors duration-200 z-10",
            focused ? "text-foreground" : "text-muted-foreground"
          )}
        />
      )}

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        placeholder=" "
        className={cn(
          "peer w-full h-16 rounded-[21px] border outline-none transition-all duration-200",
          "text-[15px] font-semibold text-foreground placeholder-transparent",
          "bg-white/80 dark:bg-slate-950/80",
          "border-slate-200/80 dark:border-slate-700/70",
          "shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]",
          Icon ? "pl-12 pr-4" : "pl-4 pr-4",
          rightAction ? "pr-12" : "",
          focused &&
            "border-primary/60 dark:border-primary/50 shadow-[0_20px_44px_-28px_rgba(15,23,42,0.55)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />

      <label
        htmlFor={id}
        className={cn(
          "absolute transition-all duration-200 pointer-events-none z-10",
          Icon ? "left-12" : "left-4",
          isFloating
            ? "top-0 -translate-y-1/2 text-[11px] uppercase tracking-wider font-bold px-1.5 bg-white dark:bg-slate-950 text-foreground"
            : "top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground"
        )}
      >
        {label}
      </label>

      {rightAction && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
          {rightAction}
        </div>
      )}
    </div>
  );
}
