"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  RefreshCw,
  Save,
  ShieldAlert,
  Timer,
  Users,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCourseGradebook,
  useCourses,
  useUpdateCourseGradebook,
} from "@/lib/hooks/useCourses";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  {
    value: "Present",
    label: "Present",
    Icon: CheckCircle2,
    className:
      "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
  },
  {
    value: "Absent",
    label: "Absent",
    Icon: XCircle,
    className:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
  {
    value: "Excused",
    label: "Excused",
    Icon: ShieldAlert,
    className:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    value: "Late",
    label: "Late",
    Icon: Timer,
    className:
      "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  },
];

const STATUS_BADGES = {
  Present: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Excused: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Unrecorded: "bg-muted text-muted-foreground",
};

function draftKey(assignmentId, studentId, week) {
  return `${assignmentId}:${studentId}:${week}`;
}

function buildAssignmentOptions(courses = []) {
  return courses.flatMap((course) =>
    (course.assignments || []).map((assignment) => ({
      key: `${course.courseId}:${assignment.assignmentId}`,
      courseId: String(course.courseId),
      assignmentId: String(assignment.assignmentId),
      courseCode: course.courseCode,
      courseName: course.courseName,
      groupName:
        assignment.group?.groupCode ||
        assignment.group?.groupName ||
        "Group",
      semesterName:
        assignment.semester?.semesterName ||
        assignment.semester?.semesterId ||
        "Semester",
    }))
  );
}

function StatCard({ icon: Icon, label, value, tone = "text-primary" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-7 w-7", tone)} />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item}>
            <CardContent className="pt-6">
              <Skeleton className="h-14 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-52" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AttendancePage() {
  const [selectedKeyOverride, setSelectedKeyOverride] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [attendanceOverrides, setAttendanceOverrides] = useState({});
  const {
    data: courses,
    isLoading: coursesLoading,
    isError: coursesError,
    error: coursesErr,
    refetch: refetchCourses,
  } = useCourses();

  const assignmentOptions = useMemo(
    () => buildAssignmentOptions(courses || []),
    [courses]
  );
  const selectedKey = assignmentOptions.some(
    (option) => option.key === selectedKeyOverride
  )
    ? selectedKeyOverride
    : assignmentOptions[0]?.key || "";

  const selectedOption = assignmentOptions.find(
    (option) => option.key === selectedKey
  );
  const {
    data: gradebook,
    isLoading: gradebookLoading,
    isError: gradebookError,
    error: gradebookErr,
    refetch: refetchGradebook,
  } = useCourseGradebook(
    selectedOption?.courseId,
    selectedOption?.assignmentId
  );
  const updateGradebook = useUpdateCourseGradebook(selectedOption?.courseId);

  const students = gradebook?.students || [];
  const canManage = Boolean(gradebook?.permissions?.canManage);
  const activeWeek = gradebook?.weeks?.includes(selectedWeek)
    ? selectedWeek
    : gradebook?.weeks?.[0] || 1;
  const isLoading = coursesLoading || (selectedOption && gradebookLoading);
  const isError = coursesError || gradebookError;
  const error = coursesErr || gradebookErr;

  function getAttendanceValue(row, week = activeWeek) {
    const key = draftKey(
      selectedOption?.assignmentId,
      row.student.studentId,
      week
    );
    return attendanceOverrides[key] ?? row.attendance?.[week] ?? "Unrecorded";
  }

  const selectedWeekAttendance = students.map((row) => ({
    studentId: row.student.studentId,
    academicWeek: activeWeek,
    status: getAttendanceValue(row, activeWeek),
  }));

  const statusCounts = selectedWeekAttendance.reduce(
    (counts, record) => ({
      ...counts,
      [record.status]: (counts[record.status] || 0) + 1,
    }),
    {}
  );

  function setAttendanceStatus(studentId, status) {
    setAttendanceOverrides((current) => ({
      ...current,
      [draftKey(selectedOption.assignmentId, studentId, activeWeek)]: status,
    }));
  }

  function markAll(status) {
    setAttendanceOverrides((current) => {
      const next = { ...current };
      for (const row of students) {
        next[draftKey(selectedOption.assignmentId, row.student.studentId, activeWeek)] =
          status;
      }
      return next;
    });
  }

  function handleSaveAttendance() {
    updateGradebook.mutate(
      {
        assignmentId: selectedOption.assignmentId,
        attendance: selectedWeekAttendance,
      },
      {
        onSuccess: () => {
          setAttendanceOverrides({});
          toast.success(`Week ${activeWeek} attendance saved`);
        },
        onError: (mutationError) =>
          toast.error(mutationError.message || "Failed to save attendance"),
      }
    );
  }

  function refetch() {
    refetchCourses();
    refetchGradebook();
  }

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <LoadingState />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground">
              Record weekly attendance for students in assigned course groups.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selectedKey}
              onChange={(event) => {
                setSelectedKeyOverride(event.target.value);
                setAttendanceOverrides({});
              }}
              className="h-9 min-w-72 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {assignmentOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.courseCode} - {option.groupName} - {option.semesterName}
                </option>
              ))}
            </select>
            {selectedOption && (
              <Link href={`/courses/${selectedOption.courseId}/gradebook`}>
                <Button variant="outline">
                  <BookOpen className="h-4 w-4" />
                  Full gradebook
                </Button>
              </Link>
            )}
          </div>
        </div>

        {isError ? (
          <Card className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">
              {error?.message || "Failed to load attendance"}
            </p>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </Card>
        ) : assignmentOptions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 gap-3">
            <GraduationCap className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No course assignments found.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                label="Students"
                value={gradebook?.summary?.studentCount || 0}
              />
              <StatCard
                icon={CheckCircle2}
                label="Present"
                value={statusCounts.Present || 0}
                tone="text-green-500"
              />
              <StatCard
                icon={XCircle}
                label="Absent"
                value={statusCounts.Absent || 0}
                tone="text-red-500"
              />
              <StatCard
                icon={AlertTriangle}
                label="At Risk"
                value={gradebook?.summary?.atRiskCount || 0}
                tone="text-yellow-500"
              />
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>
                      {gradebook?.course?.courseCode} {gradebook?.course?.courseName}
                    </CardTitle>
                    <CardDescription>
                      {gradebook?.assignment?.group?.groupName ||
                        gradebook?.assignment?.group?.groupCode ||
                        "Assigned group"}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={activeWeek}
                      onChange={(event) => setSelectedWeek(Number(event.target.value))}
                      className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {(gradebook?.weeks || []).map((week) => (
                        <option key={week} value={week}>
                          Week {week}
                        </option>
                      ))}
                    </select>
                    {canManage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAll("Present")}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark all present
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAll("Unrecorded")}
                        >
                          <Clock3 className="h-4 w-4" />
                          Clear week
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveAttendance}
                          disabled={
                            updateGradebook.isPending || students.length === 0
                          }
                        >
                          <Save className="h-4 w-4" />
                          Save attendance
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-56">Student</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-center">Week {activeWeek}</TableHead>
                        <TableHead className="text-center">Absences</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-muted-foreground"
                          >
                            No students found for this assignment.
                          </TableCell>
                        </TableRow>
                      ) : (
                        students.map((row) => {
                          const currentStatus = getAttendanceValue(row, activeWeek);

                          return (
                            <TableRow key={row.student.studentId}>
                              <TableCell className="font-medium">
                                {row.student.fullName || row.student.username}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {row.student.studentCode}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap justify-center gap-1.5">
                                  {STATUS_OPTIONS.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      disabled={!canManage}
                                      aria-pressed={currentStatus === option.value}
                                      onClick={() =>
                                        setAttendanceStatus(
                                          row.student.studentId,
                                          option.value
                                        )
                                      }
                                      className={cn(
                                        "inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                                        currentStatus === option.value
                                          ? option.className
                                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                                      )}
                                    >
                                      <option.Icon className="h-3.5 w-3.5" />
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={cn(
                                    "font-semibold",
                                    row.absenceCount >=
                                      gradebook.absenceWithdrawalLimit
                                      ? "text-red-600 dark:text-red-400"
                                      : row.absenceCount >=
                                        gradebook.absenceWithdrawalLimit - 2
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-foreground"
                                  )}
                                >
                                  {row.absenceCount}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  className={
                                    STATUS_BADGES[currentStatus] ||
                                    STATUS_BADGES.Unrecorded
                                  }
                                  variant="outline"
                                >
                                  {currentStatus}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </motion.div>
  );
}
