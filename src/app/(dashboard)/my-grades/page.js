"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  ChevronDown,
  ChevronUp,
  BookOpen,
  TrendingUp,
  Award,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Minus,
  Calendar,
  FileText,
  ClipboardCheck,
  Target,
  BarChart3,
} from "lucide-react";

const gradeColors = {
  "A+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  A: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "A-": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "B+": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  B: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "B-": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  "C+": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  C: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "D+": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  D: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  F: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  W: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  IP: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const statusLabels = {
  in_progress: "In Progress",
  passed: "Passed",
  failed: "Failed",
  withdrawn: "Withdrawn",
};

const categoryLabels = {
  quiz: "Quiz",
  midterm: "Midterm",
  coursework: "Coursework",
  project: "Project",
  final_exam: "Final Exam",
};

function scoreBar(marks, max, color = "bg-primary") {
  const pct = max > 0 ? Math.min((Number(marks) / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ScoreRing({ value, max, label, colorClass }) {
  const pct = max > 0 ? Math.min((Number(value) / max) * 100, 100) : 0;
  const displayScore = value !== null && value !== undefined ? value : "—";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            className="text-muted"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            className={colorClass}
            strokeWidth="3"
            strokeDasharray={`${pct}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
          {displayScore}
        </span>
      </div>
      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

export default function MyGradesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);

  const fetchGrades = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/grades");
      if (!res.ok) throw new Error("Failed to fetch grades");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">My Grades</h1>
          <p className="text-muted-foreground mt-1">
            View your grades and assessment breakdowns for each course.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">My Grades</h1>
          <p className="text-muted-foreground mt-1">
            View your grades and assessment breakdowns for each course.
          </p>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchGrades} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const courses = data?.courses || [];
  const totalCourses = courses.length;
  const passedCourses = courses.filter(
    (c) => c.result?.status === "passed"
  ).length;
  const avgScore =
    courses.filter((c) => c.result && c.result.status !== "withdrawn").length > 0
      ? Math.round(
          courses
            .filter((c) => c.result && c.result.status !== "withdrawn")
            .reduce((sum, c) => sum + (c.result.totalScore || 0), 0) /
            courses.filter((c) => c.result && c.result.status !== "withdrawn").length
        )
      : 0;
  const inProgressCourses = courses.filter(
    (c) => !c.result || c.result.status === "in_progress"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">My Grades</h1>
        <p className="text-muted-foreground mt-1">
          View your grades and assessment breakdowns for each course.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Courses</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalCourses}</p>
                  <p className="text-xs text-muted-foreground mt-1">Enrolled</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{avgScore}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Overall score</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{passedCourses}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Award className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{inProgressCourses}</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting results</p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <GraduationCap className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Course Cards */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No courses found</h3>
            <p className="text-muted-foreground mt-1">
              You are not enrolled in any courses yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course, idx) => (
            <CourseGradeCard
              key={course.assignmentId}
              course={course}
              isExpanded={expandedCourse === course.assignmentId}
              onToggle={() =>
                setExpandedCourse(
                  expandedCourse === course.assignmentId ? null : course.assignmentId
                )
              }
              delay={idx * 0.05}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssessmentRow({ item }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border border-border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {item.title}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {categoryLabels[item.category] || item.category}
            </Badge>
            <span className="text-[10px] text-muted-foreground">W{item.academicWeek}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {item.marks !== null ? (
              <span className="font-medium text-foreground">
                {item.marks}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Minus className="h-3 w-3" />
                Not graded
              </span>
            )}
            {" / "}
            {item.maxMarks}
          </span>
        </div>
        {scoreBar(
          item.marks,
          item.maxMarks,
          item.marks !== null && item.maxMarks > 0
            ? (Number(item.marks) / item.maxMarks) * 100 >= 50
              ? "bg-emerald-500"
              : "bg-red-500"
            : "bg-muted"
        )}
        {item.feedback && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            {item.feedback}
          </p>
        )}
      </div>
      {item.marks !== null ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, badge }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {badge && (
        <Badge variant="secondary" className="text-[10px]">
          {badge}
        </Badge>
      )}
    </div>
  );
}

function CourseGradeCard({ course, isExpanded, onToggle, delay }) {
  const result = course.result;
  const grade = result?.grade || "IP";
  const status = result?.status || "in_progress";
  const hasScores = course.assessmentBreakdown.some((a) => a.marks !== null);

  const week7Pct = course.week7?.max > 0
    ? Math.round((course.week7.marks / course.week7.max) * 100)
    : null;
  const week12Pct = course.week12?.max > 0
    ? Math.round((course.week12.marks / course.week12.max) * 100)
    : null;
  const cwPct = course.courseworkMax > 0
    ? Math.round((course.courseworkMarks / course.courseworkMax) * 100)
    : null;
  const finalPct = course.finalMax > 0
    ? Math.round((course.finalMarks / course.finalMax) * 100)
    : null;

  const ringColor = (pct) => {
    if (pct === null) return "text-muted-foreground";
    if (pct >= 70) return "text-emerald-500";
    if (pct >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card>
        {/* Header - always visible */}
        <button
          onClick={onToggle}
          className="w-full text-left p-6 hover:bg-muted/50 transition-colors rounded-t-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {course.courseName}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {course.courseCode}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {course.lecturerName && `${course.lecturerName} · `}
                  {course.semesterName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {hasScores && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-lg font-bold text-foreground">
                    {result?.totalScore ?? "—"}%
                  </p>
                </div>
              )}
              <Badge className={`${gradeColors[grade] || gradeColors.IP} text-sm px-3 py-1`}>
                {grade}
              </Badge>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-6">
                {/* Status bar */}
                {result && (
                  <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <Badge
                      className={
                        status === "passed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : status === "failed"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : status === "withdrawn"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                      }
                    >
                      {statusLabels[status] || status}
                    </Badge>
                    {result.courseworkScore != null && (
                      <span className="text-sm text-muted-foreground">
                        Coursework: <span className="font-medium text-foreground">{result.courseworkScore}</span>
                      </span>
                    )}
                    {result.finalExamScore != null && (
                      <span className="text-sm text-muted-foreground">
                        Final: <span className="font-medium text-foreground">{result.finalExamScore}</span>
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      Absences: <span className="font-medium text-foreground">{result.absenceCount}</span>
                    </span>
                    {result.absenceCount >= 4 && (
                      <span className="flex items-center gap-1 text-sm text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        At risk of withdrawal
                      </span>
                    )}
                    {course.attendanceRate !== null && (
                      <span className="text-sm text-muted-foreground">
                        Attendance: <span className="font-medium text-foreground">{course.attendanceRate}%</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Quick Score Overview - 4 rings */}
                {hasScores && (
                  <div className="flex justify-around p-4 rounded-lg border border-border bg-card">
                    <ScoreRing
                      value={week7Pct}
                      max={100}
                      label="7th Week"
                      colorClass={ringColor(week7Pct)}
                    />
                    <ScoreRing
                      value={week12Pct}
                      max={100}
                      label="12th Week"
                      colorClass={ringColor(week12Pct)}
                    />
                    <ScoreRing
                      value={cwPct}
                      max={100}
                      label="Coursework"
                      colorClass={ringColor(cwPct)}
                    />
                    <ScoreRing
                      value={finalPct}
                      max={100}
                      label="Final Exam"
                      colorClass={ringColor(finalPct)}
                    />
                  </div>
                )}

                {/* 7th Week Section */}
                {course.week7 && course.week7.items.length > 0 && (
                  <div>
                    <SectionHeader
                      icon={Calendar}
                      title="7th Week (Midterm Period)"
                      badge={`${course.week7.marks} / ${course.week7.max}`}
                    />
                    <div className="p-3 rounded-lg border border-border bg-muted/30 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">7th Week Total</span>
                        <div className="flex items-center gap-3">
                          {scoreBar(course.week7.marks, course.week7.max,
                            week7Pct !== null && week7Pct >= 50 ? "bg-emerald-500" : "bg-red-500"
                          )}
                          <span className="text-sm font-bold text-foreground min-w-[60px] text-right">
                            {week7Pct !== null ? `${week7Pct}%` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {course.week7.items.map((item) => (
                        <AssessmentRow key={item.assessmentItemId} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 12th Week Section */}
                {course.week12 && course.week12.items.length > 0 && (
                  <div>
                    <SectionHeader
                      icon={BarChart3}
                      title="12th Week"
                      badge={`${course.week12.marks} / ${course.week12.max}`}
                    />
                    <div className="p-3 rounded-lg border border-border bg-muted/30 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">12th Week Total</span>
                        <div className="flex items-center gap-3">
                          {scoreBar(course.week12.marks, course.week12.max,
                            week12Pct !== null && week12Pct >= 50 ? "bg-emerald-500" : "bg-red-500"
                          )}
                          <span className="text-sm font-bold text-foreground min-w-[60px] text-right">
                            {week12Pct !== null ? `${week12Pct}%` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Only show items after week 7 to avoid duplication */}
                    {course.week12.items
                      .filter((item) => item.academicWeek > 7)
                      .length > 0 && (
                      <div className="space-y-2">
                        {course.week12.items
                          .filter((item) => item.academicWeek > 7)
                          .map((item) => (
                            <AssessmentRow key={item.assessmentItemId} item={item} />
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Coursework Details */}
                {course.courseworkItems && course.courseworkItems.length > 0 && (
                  <div>
                    <SectionHeader
                      icon={ClipboardCheck}
                      title="Coursework Details"
                      badge={`${course.courseworkMarks} / ${course.courseworkMax}`}
                    />
                    <div className="p-3 rounded-lg border border-border bg-muted/30 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">All Coursework</span>
                        <div className="flex items-center gap-3">
                          {scoreBar(course.courseworkMarks, course.courseworkMax,
                            cwPct !== null && cwPct >= 50 ? "bg-emerald-500" : "bg-red-500"
                          )}
                          <span className="text-sm font-bold text-foreground min-w-[60px] text-right">
                            {cwPct !== null ? `${cwPct}%` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {course.courseworkItems.map((item) => (
                        <AssessmentRow key={item.assessmentItemId} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Exam Details */}
                {course.finalItems && course.finalItems.length > 0 && (
                  <div>
                    <SectionHeader
                      icon={Target}
                      title="Final Exam"
                      badge={`${course.finalMarks} / ${course.finalMax}`}
                    />
                    <div className="p-3 rounded-lg border border-border bg-muted/30 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Final Exam Total</span>
                        <div className="flex items-center gap-3">
                          {scoreBar(course.finalMarks, course.finalMax,
                            finalPct !== null && finalPct >= 50 ? "bg-emerald-500" : "bg-red-500"
                          )}
                          <span className="text-sm font-bold text-foreground min-w-[60px] text-right">
                            {finalPct !== null ? `${finalPct}%` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {course.finalItems.map((item) => (
                        <AssessmentRow key={item.assessmentItemId} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Summary Totals */}
                {hasScores && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">7th Week</p>
                      <p className="text-lg font-bold text-foreground">
                        {week7Pct ?? "—"}<span className="text-sm text-muted-foreground font-normal">%</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">12th Week</p>
                      <p className="text-lg font-bold text-foreground">
                        {week12Pct ?? "—"}<span className="text-sm text-muted-foreground font-normal">%</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Coursework</p>
                      <p className="text-lg font-bold text-foreground">
                        {course.courseworkMarks}
                        <span className="text-sm text-muted-foreground font-normal">
                          /{course.courseworkMax}
                        </span>
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Final Exam</p>
                      <p className="text-lg font-bold text-foreground">
                        {course.finalMarks}
                        <span className="text-sm text-muted-foreground font-normal">
                          /{course.finalMax}
                        </span>
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 text-center">
                      <p className="text-xs text-muted-foreground">Total / Grade</p>
                      <p className="text-lg font-bold text-primary">
                        {result?.totalScore ?? "—"}%
                        <Badge className={`${gradeColors[grade] || gradeColors.IP} ml-2 text-xs`}>
                          {grade}
                        </Badge>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
