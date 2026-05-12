"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useCourseGradebook,
  useUpdateCourseGradebook,
} from "@/lib/hooks/useCourses";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  {
    value: "Present",
    label: "Present",
    Icon: CheckCircle2,
    className: "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
  },
  {
    value: "Absent",
    label: "Absent",
    Icon: XCircle,
    className: "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
  {
    value: "Excused",
    label: "Excused",
    Icon: ShieldAlert,
    className: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    value: "Late",
    label: "Late",
    Icon: Timer,
    className: "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  },
];

const STATUS_BADGES = {
  Present: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Excused: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Unrecorded: "bg-muted text-muted-foreground",
};

const RESULT_BADGES = {
  passed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  withdrawn: "bg-muted text-muted-foreground",
};

function draftKey(assignmentId, studentId, id) {
  return `${assignmentId}:${studentId}:${id}`;
}

function formatCategory(category) {
  return String(category || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeScoreValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "text-primary" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-8 w-8", tone)} />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CourseGradebookPage() {
  const { id } = useParams();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [attendanceOverrides, setAttendanceOverrides] = useState({});
  const [scoreOverrides, setScoreOverrides] = useState({});

  const {
    data: gradebook,
    isLoading,
    isError,
    error,
    refetch,
  } = useCourseGradebook(id, selectedAssignmentId);
  const updateGradebook = useUpdateCourseGradebook(id);

  const canManage = gradebook?.permissions?.canManage;
  const students = gradebook?.students || [];
  const assessmentItems = gradebook?.assessmentItems || [];
  const activeAssignmentId =
    selectedAssignmentId ||
    (gradebook?.assignment?.assignmentId
      ? String(gradebook.assignment.assignmentId)
      : "");
  const activeWeek = gradebook?.weeks?.includes(selectedWeek)
    ? selectedWeek
    : gradebook?.weeks?.[0] || 1;

  function getAttendanceValue(row, week = activeWeek) {
    const key = draftKey(activeAssignmentId, row.student.studentId, week);
    return attendanceOverrides[key] ?? row.attendance?.[week] ?? "Unrecorded";
  }

  function getScoreValue(row, item) {
    const key = draftKey(
      activeAssignmentId,
      row.student.studentId,
      item.assessmentItemId
    );
    return (
      scoreOverrides[key] ??
      normalizeScoreValue(row.scores?.[item.assessmentItemId])
    );
  }

  const selectedWeekAttendance = students.map((row) => ({
    studentId: row.student.studentId,
    academicWeek: activeWeek,
    status: getAttendanceValue(row, activeWeek),
  }));

  function setAttendanceStatus(studentId, status) {
    setAttendanceOverrides((current) => ({
      ...current,
      [draftKey(activeAssignmentId, studentId, activeWeek)]: status,
    }));
  }

  function markAll(status) {
    setAttendanceOverrides((current) => {
      const next = { ...current };
      for (const row of students) {
        next[draftKey(activeAssignmentId, row.student.studentId, activeWeek)] =
          status;
      }
      return next;
    });
  }

  function handleSaveAttendance() {
    updateGradebook.mutate(
      {
        assignmentId: gradebook.assignment.assignmentId,
        attendance: selectedWeekAttendance,
      },
      {
        onSuccess: () => toast.success(`Week ${activeWeek} attendance saved`),
        onError: (mutationError) =>
          toast.error(mutationError.message || "Failed to save attendance"),
      }
    );
  }

  function handleSaveScores() {
    const scores = [];

    for (const row of students) {
      for (const item of assessmentItems) {
        scores.push({
          studentId: row.student.studentId,
          assessmentItemId: item.assessmentItemId,
          marks: getScoreValue(row, item),
        });
      }
    }

    updateGradebook.mutate(
      {
        assignmentId: gradebook.assignment.assignmentId,
        scores,
      },
      {
        onSuccess: () => toast.success("Scores saved and grades recalculated"),
        onError: (mutationError) =>
          toast.error(mutationError.message || "Failed to save scores"),
      }
    );
  }

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <LoadingSkeleton />
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href={`/courses/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Course Gradebook</h1>
              <p className="text-muted-foreground">
                Attendance and marks could not be loaded.
              </p>
            </div>
          </div>
          <Card className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">
              {error?.message || "Failed to load gradebook"}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </Card>
        </div>
      </motion.div>
    );
  }

  if (!gradebook) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/courses/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                <span className="font-mono text-muted-foreground mr-2">
                  {gradebook.course?.courseCode}
                </span>
                Gradebook
              </h1>
              <p className="text-muted-foreground">
                Weekly attendance, continuous assessment, final exam, and course grades.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={activeAssignmentId}
              onChange={(event) => setSelectedAssignmentId(event.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {(gradebook.assignments || []).map((assignment) => (
                <option key={assignment.assignmentId} value={assignment.assignmentId}>
                  {assignment.group?.groupCode || assignment.group?.groupName || "Group"} -{" "}
                  {assignment.semester?.semesterName || assignment.semester?.semesterId || "Semester"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!canManage && (
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardContent className="flex items-center gap-3 pt-6">
              <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              <p className="text-sm text-blue-900 dark:text-blue-200">
                You can view your course record here. Only the assigned lecturer or an admin can edit attendance and marks.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={Users} label="Students" value={gradebook.summary.studentCount} />
          <StatCard
            icon={CalendarCheck2}
            label="Class Average"
            value={`${gradebook.summary.classAverage}%`}
            tone="text-green-500"
          />
          <StatCard
            icon={AlertTriangle}
            label="At Risk"
            value={gradebook.summary.atRiskCount}
            tone="text-yellow-500"
          />
          <StatCard
            icon={ShieldAlert}
            label="Withdrawn"
            value={gradebook.summary.withdrawnCount}
            tone="text-red-500"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Assessment Plan
              </CardTitle>
              <CardDescription>
                Continuous assessment is {gradebook.summary.courseworkMax} marks and the final exam is {gradebook.summary.finalMax} marks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {assessmentItems.map((item) => (
                  <div key={item.assessmentItemId} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">Week {item.academicWeek}</Badge>
                      <span className="text-sm font-semibold">{item.maxMarks} marks</span>
                    </div>
                    <p className="mt-2 font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{formatCategory(item.category)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Grade Scale
              </CardTitle>
              <CardDescription>Final course grade from 100 marks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(gradebook.gradeScale || []).map((rule) => (
                  <Badge
                    key={rule.grade}
                    variant="outline"
                    className={cn(
                      "h-7",
                      rule.isPassing
                        ? "border-green-200 text-green-700 dark:border-green-900 dark:text-green-300"
                        : "border-red-200 text-red-700 dark:border-red-900 dark:text-red-300"
                    )}
                  >
                    {rule.grade}: {rule.minScore}
                    {rule.maxScore < 100 ? `-${rule.maxScore}` : "+"}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="attendance">
          <TabsList>
            <TabsTrigger value="attendance">
              <CalendarCheck2 className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="scores">
              <Award className="h-4 w-4" />
              Scores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Weekly Attendance</CardTitle>
                    <CardDescription>
                      A student is automatically withdrawn from the course after {gradebook.absenceWithdrawalLimit} absences.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={activeWeek}
                      onChange={(event) => setSelectedWeek(Number(event.target.value))}
                      className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {(gradebook.weeks || []).map((week) => (
                        <option key={week} value={week}>
                          Week {week}
                        </option>
                      ))}
                    </select>
                    {canManage && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => markAll("Present")}>
                          <CheckCircle2 className="h-4 w-4" />
                          Mark all present
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => markAll("Unrecorded")}>
                          <Clock3 className="h-4 w-4" />
                          Clear week
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveAttendance}
                          disabled={updateGradebook.isPending}
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-center">Week {activeWeek}</TableHead>
                        <TableHead className="text-center">Absences</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((row) => {
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
                                      setAttendanceStatus(row.student.studentId, option.value)
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
                                  row.absenceCount >= gradebook.absenceWithdrawalLimit
                                    ? "text-red-600 dark:text-red-400"
                                    : row.absenceCount >= gradebook.absenceWithdrawalLimit - 2
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-foreground"
                                )}
                              >
                                {row.absenceCount}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={STATUS_BADGES[currentStatus] || STATUS_BADGES.Unrecorded}
                                variant="outline"
                              >
                                {currentStatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scores" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Scores and Results</CardTitle>
                    <CardDescription>
                      Marks are validated against each assessment maximum and the course total is graded from 100.
                    </CardDescription>
                  </div>
                  {canManage && (
                    <Button onClick={handleSaveScores} disabled={updateGradebook.isPending}>
                      <Save className="h-4 w-4" />
                      Save scores
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-48">Student</TableHead>
                        {assessmentItems.map((item) => (
                          <TableHead
                            key={item.assessmentItemId}
                            className="min-w-32 text-center"
                          >
                            <div className="space-y-1">
                              <p>{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                W{item.academicWeek} - {item.maxMarks}
                              </p>
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center">Coursework</TableHead>
                        <TableHead className="text-center">Final</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">GPA</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((row) => (
                        <TableRow key={row.student.studentId}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{row.student.fullName || row.student.username}</p>
                              <p className="text-xs font-normal text-muted-foreground">
                                {row.student.studentCode}
                              </p>
                            </div>
                          </TableCell>
                          {assessmentItems.map((item) => {
                            const key = draftKey(
                              activeAssignmentId,
                              row.student.studentId,
                              item.assessmentItemId
                            );

                            return (
                              <TableCell key={item.assessmentItemId}>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.maxMarks}
                                  step="0.25"
                                  disabled={!canManage || row.result.status === "withdrawn"}
                                  value={
                                    scoreOverrides[key] ??
                                    normalizeScoreValue(row.scores?.[item.assessmentItemId])
                                  }
                                  onChange={(event) =>
                                    setScoreOverrides((current) => ({
                                      ...current,
                                      [key]: event.target.value,
                                    }))
                                  }
                                  className="mx-auto w-20 text-center"
                                  aria-label={`${row.student.fullName} ${item.title} score`}
                                />
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-semibold">
                            {row.result.courseworkScore}/{gradebook.summary.courseworkMax}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {row.result.finalExamScore}/{gradebook.summary.finalMax}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {row.result.totalScore}/{gradebook.summary.totalMax}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {row.student.gpa !== null && row.student.gpa !== undefined
                              ? Number(row.student.gpa).toFixed(2)
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Badge
                                className={RESULT_BADGES[row.result.status] || ""}
                                variant="outline"
                              >
                                {row.result.grade}
                              </Badge>
                              {row.result.status === "withdrawn" && (
                                <span className="text-xs text-muted-foreground">
                                  Withdrawn
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
