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
  CalendarCheck2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Minus,
  Clock,
  UserX,
  CalendarDays,
} from "lucide-react";

const weekStatusColors = {
  Present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  Absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  Excused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  Late: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  Unrecorded: "bg-gray-50 text-gray-400 dark:bg-gray-800/30 dark:text-gray-500 border-gray-200 dark:border-gray-700",
};

const weekStatusIcons = {
  Present: CheckCircle2,
  Absent: XCircle,
  Unrecorded: Minus,
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyAttendancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/attendance");
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">My Attendance</h1>
          <p className="text-muted-foreground mt-1">
            Track your attendance and absences across all courses.
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
          <h1 className="text-2xl font-extrabold text-foreground">My Attendance</h1>
          <p className="text-muted-foreground mt-1">
            Track your attendance and absences across all courses.
          </p>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchAttendance} className="mt-2">
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
  const totalAbsences = courses.reduce((sum, c) => sum + c.absentCount, 0);
  const avgAttendance =
    courses.filter((c) => c.attendanceRate !== null).length > 0
      ? Math.round(
          courses
            .filter((c) => c.attendanceRate !== null)
            .reduce((sum, c) => sum + c.attendanceRate, 0) /
            courses.filter((c) => c.attendanceRate !== null).length
        )
      : null;
  const atRiskCourses = courses.filter((c) => c.absentCount >= 4).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">My Attendance</h1>
        <p className="text-muted-foreground mt-1">
          Track your attendance and absences across all courses.
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
                  <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {avgAttendance !== null ? `${avgAttendance}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Average</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <CalendarCheck2 className="h-5 w-5 text-emerald-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">Total Absences</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalAbsences}</p>
                  <p className="text-xs text-muted-foreground mt-1">Across all courses</p>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10">
                  <UserX className="h-5 w-5 text-red-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">At Risk</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{atRiskCourses}</p>
                  <p className="text-xs text-muted-foreground mt-1">4+ absences</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Course Attendance Cards */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No courses found</h3>
            <p className="text-muted-foreground mt-1">
              You are not enrolled in any courses yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course, idx) => (
            <CourseAttendanceCard
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

function CourseAttendanceCard({ course, isExpanded, onToggle, delay }) {
  const weeks = Object.entries(course.weeklyAttendance).sort(
    ([a], [b]) => Number(a) - Number(b)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card>
        {/* Header */}
        <button
          onClick={onToggle}
          className="w-full text-left p-6 hover:bg-muted/50 transition-colors rounded-t-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <CalendarCheck2 className="h-5 w-5 text-primary" />
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
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-lg font-bold text-foreground">
                  {course.attendanceRate !== null ? `${course.attendanceRate}%` : "—"}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Absences</p>
                <p
                  className={`text-lg font-bold ${
                    course.absentCount >= 4 ? "text-red-500" : "text-foreground"
                  }`}
                >
                  {course.absentCount}
                </p>
              </div>
              {course.absentCount >= 4 && (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
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
                {/* Weekly grid */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Weekly Attendance
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {weeks.map(([week, status]) => {
                      const StatusIcon = weekStatusIcons[status] || Minus;
                      return (
                        <div
                          key={week}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border ${
                            weekStatusColors[status] || weekStatusColors.Unrecorded
                          }`}
                        >
                          <span className="text-xs font-medium">W{week}</span>
                          <StatusIcon className="h-4 w-4" />
                          <span className="text-[10px]">{status === "Unrecorded" ? "—" : status}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Absence details */}
                {course.absentLectures.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Absence Details ({course.absentLectures.length})
                    </h4>
                    <div className="space-y-2">
                      {course.absentLectures.map((lecture) => (
                        <div
                          key={lecture.lectureId}
                          className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                        >
                          <div className="flex items-center gap-3">
                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {lecture.lectureName || `Week ${lecture.academicWeek}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Week {lecture.academicWeek}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(lecture.lectureDate)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lecture attendance history */}
                {course.lectureHistory.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      Lecture History
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {course.lectureHistory.map((lecture) => {
                        const status = lecture.status;
                        const StatusIcon = weekStatusIcons[status] || Minus;
                        return (
                          <div
                            key={lecture.lectureId}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <StatusIcon
                                className={`h-4 w-4 shrink-0 ${
                                  status === "Present"
                                    ? "text-emerald-500"
                                    : status === "Absent"
                                    ? "text-red-500"
                                    : "text-gray-400"
                                }`}
                              />
                              <div>
                                <p className="text-sm text-foreground">
                                  {lecture.lectureName || `Week ${lecture.academicWeek}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {lecture.attendancePct !== null && lecture.attendancePct !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(lecture.attendancePct)}% attended
                                </span>
                              )}
                              <Badge
                                className={`text-xs ${
                                  weekStatusColors[status] || weekStatusColors.Unrecorded
                                }`}
                              >
                                {status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 text-center">
                    <p className="text-xs text-muted-foreground">Present</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {course.presentCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10 text-center">
                    <p className="text-xs text-muted-foreground">Absent</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {course.absentCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Recorded Weeks</p>
                    <p className="text-lg font-bold text-foreground">
                      {course.recordedWeeks}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <p className="text-lg font-bold text-foreground">
                      {course.attendanceRate !== null ? `${course.attendanceRate}%` : "—"}
                    </p>
                  </div>
                </div>

                {/* Withdrawal warning */}
                {course.absentCount >= 4 && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                    <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                        Warning: {course.absentCount} absences
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-500">
                        You will be automatically withdrawn after 6 absences in this course.
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
