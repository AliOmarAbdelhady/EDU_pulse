"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  RefreshCw,
  ChevronRight,
  Activity,
  Users,
  ShieldCheck,
} from "lucide-react";

const RISK_COLORS = {
  HIGH:   "border-red-400 dark:border-red-600 bg-red-50/40 dark:bg-red-950/30",
  MEDIUM: "border-amber-400 dark:border-amber-600 bg-amber-50/40 dark:bg-amber-950/30",
  LOW:    "border-emerald-400 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/30",
};

const BADGE_COLORS = {
  HIGH:   "bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200",
  LOW:    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200",
};

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-8 w-12 mb-2" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );
}

function StudentSkeleton() {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-16 w-16 rounded" />
      </div>
    </div>
  );
}

function RiskGauge({ score, level }) {
  const color =
    level === "HIGH" ? "stroke-red-500" :
    level === "MEDIUM" ? "stroke-amber-500" : "stroke-emerald-500";
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="absolute inset-0" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" className="stroke-muted" strokeWidth="6" />
        <circle
          cx="32" cy="32" r="28" fill="none"
          className={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{Math.round(score)}</span>
      </div>
    </div>
  );
}

function StudentRow({ student, expanded, onToggle }) {
  const { metrics } = student;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-xl border p-4 transition ${RISK_COLORS[student.riskLevel]}`}
    >
      <div className="flex items-start gap-4">
        <RiskGauge score={student.riskScore} level={student.riskLevel} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base">
                {student.fullName}{" "}
                <span className="text-xs text-muted-foreground font-normal">({student.studentCode})</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {student.courses?.map((c) => c.courseCode).filter(Boolean).join(", ") || "No active enrollment"}
              </p>
            </div>
            <Badge className={`${BADGE_COLORS[student.riskLevel]} border-0`}>
              {student.riskLevel}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {student.drivers.slice(0, expanded ? 999 : 2).map((d, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded-full ${
                  d.severity === "high"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200"
                    : d.severity === "medium"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                }`}
              >
                {d.label}
              </span>
            ))}
            {!expanded && student.drivers.length > 2 && (
              <span className="text-xs px-2 py-1 text-muted-foreground">
                +{student.drivers.length - 2} more
              </span>
            )}
          </div>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 space-y-3"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Metric label="Attendance" value={`${metrics.attendanceRate}%`} />
                <Metric label="Confusion" value={`${metrics.confusionRate}%`} />
                <Metric label="Engagement" value={`${metrics.avgEngagement}%`} />
                <Metric label="Avg Score" value={metrics.avgScore ?? "—"} />
                <Metric label="Lectures" value={metrics.lecturesAnalyzed} />
              </div>
              <div className="rounded-lg bg-background/60 border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Recommended Action
                </p>
                <p className="text-sm">{student.recommendation}</p>
              </div>
            </motion.div>
          )}

          <button
            onClick={onToggle}
            className="mt-3 text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            {expanded ? "Show less" : "Show details"}
            <ChevronRight className={`h-3 w-3 transition ${expanded ? "rotate-90" : ""}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="text-center rounded-lg border bg-background/60 p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

export default function AtRiskPage() {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("ALL"); // ALL | HIGH | MEDIUM | LOW

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["at-risk"],
    queryFn: async () => {
      const res = await fetch("/api/at-risk");
      if (!res.ok) throw new Error("Failed to load at-risk students");
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    if (!data?.students) return [];
    if (filter === "ALL") return data.students;
    return data.students.filter((s) => s.riskLevel === filter);
  }, [data, filter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-red-500" />
            At-Risk Students
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-driven intervention list — refreshed weekly. Click any student for full risk breakdown.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton /><StatCardSkeleton />
            <StatCardSkeleton /><StatCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard
              icon={<Users className="h-6 w-6 text-primary" />}
              label="Total Students"
              value={data?.summary?.total ?? 0}
              onClick={() => setFilter("ALL")}
              active={filter === "ALL"}
            />
            <SummaryCard
              icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
              label="High Risk"
              value={data?.summary?.high ?? 0}
              onClick={() => setFilter("HIGH")}
              active={filter === "HIGH"}
            />
            <SummaryCard
              icon={<TrendingDown className="h-6 w-6 text-amber-500" />}
              label="Medium Risk"
              value={data?.summary?.medium ?? 0}
              onClick={() => setFilter("MEDIUM")}
              active={filter === "MEDIUM"}
            />
            <SummaryCard
              icon={<ShieldCheck className="h-6 w-6 text-emerald-500" />}
              label="Low Risk"
              value={data?.summary?.low ?? 0}
              onClick={() => setFilter("LOW")}
              active={filter === "LOW"}
            />
          </>
        )}
      </div>

      {/* Student list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Intervention List {filter !== "ALL" && (
              <Badge className={`${BADGE_COLORS[filter]} border-0 ml-2`}>{filter}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Sorted by risk score. Each student includes drivers and a recommended action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <>
              <StudentSkeleton /><StudentSkeleton /><StudentSkeleton />
            </>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
              <p>No students in this risk band — looking good!</p>
            </div>
          ) : (
            filtered.map((s) => (
              <StudentRow
                key={s.studentId}
                student={s}
                expanded={expandedId === s.studentId}
                onToggle={() =>
                  setExpandedId(expandedId === s.studentId ? null : s.studentId)
                }
              />
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SummaryCard({ icon, label, value, onClick, active }) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition ${active ? "ring-2 ring-primary" : ""}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
