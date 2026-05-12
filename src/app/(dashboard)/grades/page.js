"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Award,
  BookOpen,
  GraduationCap,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  User,
  Users,
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
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  useCourseGradebook,
  useCourses,
  useUpdateCourseGradebook,
} from "@/lib/hooks/useCourses";
import { cn } from "@/lib/utils";

const RESULT_BADGES = {
  passed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  withdrawn: "bg-muted text-muted-foreground",
};

function draftKey(assignmentId, studentId, assessmentItemId) {
  return `${assignmentId}:${studentId}:${assessmentItemId}`;
}

function normalizeScore(value) {
  if (value === null || value === undefined) return "";
  return String(value);
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

function pickGradeItems(items = []) {
  const used = new Set();
  const pick = (predicate) => {
    const item = items.find(
      (candidate) => !used.has(candidate.assessmentItemId) && predicate(candidate)
    );
    if (item) used.add(item.assessmentItemId);
    return item || null;
  };

  return [
    {
      key: "week7",
      label: "7th Week",
      item: pick((item) => Number(item.academicWeek) === 7),
    },
    {
      key: "week12",
      label: "12th Week",
      item: pick((item) => Number(item.academicWeek) === 12),
    },
    {
      key: "coursework",
      label: "Course Work",
      item: pick((item) => item.category === "coursework"),
    },
    {
      key: "final",
      label: "Final",
      item: pick((item) => item.category === "final_exam"),
    },
  ].filter((column) => column.item);
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
        <Skeleton className="h-8 w-48" />
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
          <Skeleton className="h-6 w-44" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreBar({ score, max }) {
  const pct = max > 0 ? Math.min((score / max) * 100, 100) : 0;
  const color =
    pct >= 70
      ? "[&>div]:bg-green-500"
      : pct >= 50
      ? "[&>div]:bg-yellow-500"
      : "[&>div]:bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{score}</span>
        <span className="text-muted-foreground">/ {max}</span>
      </div>
      <Progress value={pct} className={cn("h-2", color)} />
    </div>
  );
}

export default function GradesPage() {
  const [selectedKeyOverride, setSelectedKeyOverride] = useState("");
  const [scoreOverrides, setScoreOverrides] = useState({});
  const [detailStudent, setDetailStudent] = useState(null);
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
  const gradeColumns = useMemo(
    () => pickGradeItems(gradebook?.assessmentItems || []),
    [gradebook?.assessmentItems]
  );
  const allAssessmentItems = gradebook?.assessmentItems || [];
  const canManage = Boolean(gradebook?.permissions?.canManage);
  const isLoading = coursesLoading || (selectedOption && gradebookLoading);
  const isError = coursesError || gradebookError;
  const error = coursesErr || gradebookErr;
  const withdrawalLimit = gradebook?.absenceWithdrawalLimit || 6;

  function getScoreValue(row, item) {
    const key = draftKey(
      selectedOption?.assignmentId,
      row.student.studentId,
      item.assessmentItemId
    );
    return (
      scoreOverrides[key] ??
      normalizeScore(row.scores?.[item.assessmentItemId])
    );
  }

  function handleCellBlur(studentId, assessmentItemId, marks, serverValue) {
    if (marks === serverValue) return;

    updateGradebook.mutate(
      {
        assignmentId: selectedOption.assignmentId,
        scores: [{ studentId, assessmentItemId, marks }],
      },
      {
        onSuccess: () => {
          const key = draftKey(
            selectedOption?.assignmentId,
            studentId,
            assessmentItemId
          );
          setScoreOverrides((current) => {
            const next = { ...current };
            delete next[key];
            return next;
          });
          toast.success("Score saved");
        },
        onError: (mutationError) =>
          toast.error(mutationError.message || "Failed to save score"),
      }
    );
  }

  function handleSaveScores() {
    const scores = [];

    for (const row of students) {
      for (const column of gradeColumns) {
        scores.push({
          studentId: row.student.studentId,
          assessmentItemId: column.item.assessmentItemId,
          marks: getScoreValue(row, column.item),
        });
      }
    }

    updateGradebook.mutate(
      {
        assignmentId: selectedOption.assignmentId,
        scores,
      },
      {
        onSuccess: () => {
          setScoreOverrides({});
          toast.success("Grades saved");
        },
        onError: (mutationError) =>
          toast.error(mutationError.message || "Failed to save grades"),
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
            <h1 className="text-3xl font-extrabold tracking-tight">Grades</h1>
            <p className="text-muted-foreground">
              Grade assigned students by 7th week, 12th week, course work, and final.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selectedKey}
              onChange={(event) => {
                setSelectedKeyOverride(event.target.value);
                setScoreOverrides({});
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
              {error?.message || "Failed to load grades"}
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <StatCard
                icon={Users}
                label="Students"
                value={gradebook?.summary?.studentCount || 0}
              />
              <StatCard
                icon={Award}
                label="Class Average"
                value={`${gradebook?.summary?.classAverage || 0}%`}
                tone="text-green-500"
              />
              <StatCard
                icon={BookOpen}
                label="Course Work"
                value={gradebook?.summary?.courseworkMax || 0}
                tone="text-blue-500"
              />
              <StatCard
                icon={GraduationCap}
                label="Final"
                value={gradebook?.summary?.finalMax || 0}
                tone="text-orange-500"
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
                  {canManage && Object.keys(scoreOverrides).length > 0 && (
                    <Button
                      onClick={handleSaveScores}
                      disabled={
                        updateGradebook.isPending ||
                        students.length === 0 ||
                        gradeColumns.length === 0
                      }
                    >
                      {updateGradebook.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save all ({Object.keys(scoreOverrides).length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-56">Student</TableHead>
                        <TableHead className="text-center">Absences</TableHead>
                        {gradeColumns.map((column) => (
                          <TableHead
                            key={column.key}
                            className="min-w-32 text-center"
                          >
                            <div className="space-y-1">
                              <p>{column.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {column.item.maxMarks} marks
                              </p>
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center">Coursework</TableHead>
                        <TableHead className="text-center">Final</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={gradeColumns.length + 7}
                            className="py-8 text-center text-muted-foreground"
                          >
                            No students found for this assignment.
                          </TableCell>
                        </TableRow>
                      ) : (
                        students.map((row) => (
                          <TableRow key={row.student.studentId}>
                            <TableCell className="font-medium">
                              <button
                                type="button"
                                onClick={() => setDetailStudent(row)}
                                className="text-left hover:underline cursor-pointer"
                              >
                                <div>
                                  <p>{row.student.fullName || row.student.username}</p>
                                  <p className="text-xs font-normal text-muted-foreground">
                                    {row.student.studentCode}
                                  </p>
                                </div>
                              </button>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={cn(
                                  "font-semibold",
                                  row.absenceCount >= withdrawalLimit
                                    ? "text-red-600 dark:text-red-400"
                                    : row.absenceCount >= withdrawalLimit - 2
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-foreground"
                                )}
                              >
                                {row.absenceCount}
                              </span>
                            </TableCell>
                            {gradeColumns.map((column) => {
                              const item = column.item;
                              const key = draftKey(
                                selectedOption.assignmentId,
                                row.student.studentId,
                                item.assessmentItemId
                              );
                              const serverValue = normalizeScore(
                                row.scores?.[item.assessmentItemId]
                              );
                              const isDirty =
                                scoreOverrides[key] !== undefined &&
                                scoreOverrides[key] !== serverValue;

                              return (
                                <TableCell
                                  key={item.assessmentItemId}
                                  className={cn(isDirty && "bg-muted/50")}
                                >
                                  <Input
                                    type="number"
                                    min="0"
                                    max={item.maxMarks}
                                    step="0.25"
                                    disabled={
                                      !canManage ||
                                      row.result.status === "withdrawn"
                                    }
                                    value={
                                      scoreOverrides[key] ?? serverValue
                                    }
                                    onChange={(event) =>
                                      setScoreOverrides((current) => ({
                                        ...current,
                                        [key]: event.target.value,
                                      }))
                                    }
                                    onBlur={(event) => {
                                      if (canManage && event.target.value !== serverValue) {
                                        handleCellBlur(
                                          row.student.studentId,
                                          item.assessmentItemId,
                                          event.target.value,
                                          serverValue
                                        );
                                      }
                                    }}
                                    className="mx-auto w-20 text-center"
                                    aria-label={`${row.student.fullName} ${column.label} score`}
                                  />
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold">
                              {row.result.courseworkScore}/
                              {gradebook.summary.courseworkMax}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {row.result.finalExamScore}/{gradebook.summary.finalMax}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {row.result.totalScore}/{gradebook.summary.totalMax}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={RESULT_BADGES[row.result.status] || ""}
                                variant="outline"
                              >
                                {row.result.grade}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Sheet
        open={!!detailStudent}
        onOpenChange={(open) => !open && setDetailStudent(null)}
      >
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          {detailStudent && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {detailStudent.student.fullName || detailStudent.student.username}
                </SheetTitle>
                <SheetDescription>
                  {detailStudent.student.studentCode} — Grade details
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-6">
                {/* Student Info */}
                <div className="grid grid-cols-2 gap-3">
                  {detailStudent.student.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {detailStudent.student.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    GPA:{" "}
                    {detailStudent.student.gpa !== null &&
                    detailStudent.student.gpa !== undefined
                      ? Number(detailStudent.student.gpa).toFixed(2)
                      : "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Standing: {detailStudent.student.academicStanding || "N/A"}
                  </div>
                </div>

                {/* Attendance */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Attendance</h3>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Absences</span>
                      <span
                        className={cn(
                          "text-lg font-bold",
                          detailStudent.absenceCount >= withdrawalLimit
                            ? "text-red-600 dark:text-red-400"
                            : detailStudent.absenceCount >= withdrawalLimit - 2
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-foreground"
                        )}
                      >
                        {detailStudent.absenceCount} / {withdrawalLimit}
                      </span>
                    </div>
                    {detailStudent.absenceCount >= withdrawalLimit && (
                      <Badge className="mt-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" variant="outline">
                        Withdrawn (exceeded absence limit)
                      </Badge>
                    )}
                    {detailStudent.absenceCount >= withdrawalLimit - 2 &&
                      detailStudent.absenceCount < withdrawalLimit && (
                        <Badge className="mt-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" variant="outline">
                          At risk of withdrawal
                        </Badge>
                      )}
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Score Breakdown</h3>
                  <div className="space-y-3">
                    {allAssessmentItems.map((item) => {
                      const score = detailStudent.scores?.[item.assessmentItemId];
                      return (
                        <div key={item.assessmentItemId} className="rounded-lg border p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.title}</span>
                            <Badge variant="outline" className="text-xs">
                              W{item.academicWeek}
                            </Badge>
                          </div>
                          <ScoreBar
                            score={score !== null && score !== undefined ? score : 0}
                            max={item.maxMarks}
                          />
                          {score === null || score === undefined ? (
                            <p className="text-xs text-muted-foreground">Not graded yet</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Results Summary */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Results</h3>
                  <div className="rounded-lg border p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Coursework</span>
                      <span className="font-semibold">
                        {detailStudent.result.courseworkScore}/{gradebook?.summary?.courseworkMax}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Final Exam</span>
                      <span className="font-semibold">
                        {detailStudent.result.finalExamScore}/{gradebook?.summary?.finalMax}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-sm">
                      <span className="font-semibold">Total</span>
                      <span className="text-lg font-bold">
                        {detailStudent.result.totalScore}/{gradebook?.summary?.totalMax}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Grade</span>
                      <Badge
                        className={RESULT_BADGES[detailStudent.result.status] || ""}
                        variant="outline"
                      >
                        {detailStudent.result.grade}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Link to full gradebook */}
                {selectedOption && (
                  <Link
                    href={`/courses/${selectedOption.courseId}/gradebook`}
                    onClick={() => setDetailStudent(null)}
                  >
                    <Button variant="outline" className="w-full">
                      <BookOpen className="h-4 w-4" />
                      Open full gradebook
                    </Button>
                  </Link>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
