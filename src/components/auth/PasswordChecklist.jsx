"use client";

import { Circle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const rules = [
  {
    label: "8+ characters",
    test: (pw) => pw.length >= 8,
  },
  {
    label: "Uppercase letter",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    label: "Lowercase letter",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    label: "Number",
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    label: "Special character",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
  {
    label: "Passwords match",
    test: (pw, confirm) => pw.length > 0 && pw === confirm,
  },
];

export default function PasswordChecklist({ password, confirmPassword }) {
  return (
    <div className="rounded-[18px] bg-muted/60 p-3 space-y-2">
      <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
        Password checklist
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {rules.map((rule) => {
          const passed = rule.test(password, confirmPassword);
          return (
            <motion.div
              key={rule.label}
              className="flex items-center gap-2"
              animate={{ scale: passed ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 0.2 }}
            >
              {passed ? (
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
              <span
                className={`text-sm transition-colors duration-200 ${
                  passed ? "text-success font-medium" : "text-muted-foreground"
                }`}
              >
                {rule.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
