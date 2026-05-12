"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Play, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCourses } from "@/lib/hooks/useCourses";
import { useCreateLecture } from "@/lib/hooks/useLectures";

const ACADEMIC_WEEKS = Array.from({ length: 16 }, (_, index) => index + 1);

export default function NewLecturePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    assignmentId: "",
    academicWeek: "1",
    notes: "",
  });

  const { data: courses, isLoading: coursesLoading, isError: coursesError, refetch: refetchCourses } = useCourses();
  const createLecture = useCreateLecture();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const lecture = await createLecture.mutateAsync({
        assignmentId: parseInt(form.assignmentId, 10),
        academicWeek: parseInt(form.academicWeek, 10),
        startNow: true,
        notes: form.notes || undefined,
      });
      router.push(`/lectures/${lecture.lectureId}/live?capture=lecturer_camera&autoStart=1`);
    } catch (error) {
      console.error("Error creating lecture:", error);
    }
  };

  // Build unique assignments from courses for the dropdown
  // Each course may have multiple assignments; flatten them
  const allAssignments = [];
  if (courses) {
    for (const course of courses) {
      const assignments = course.assignments || [];
      for (const a of assignments) {
        allAssignments.push({
          assignmentId: a.assignmentId,
          label: [
            `${course.courseCode} - ${course.courseName}`,
            a.group?.groupCode || a.group?.groupName,
          ].filter(Boolean).join(" / "),
          courseId: course.courseId,
          semesterId: a.semesterId,
          courseCode: course.courseCode,
          courseName: course.courseName,
          groupName: a.group?.groupName || a.group?.groupCode || "N/A",
        });
      }
    }
  }

  const selectedAssignment = allAssignments.find(
    (assignment) => String(assignment.assignmentId) === form.assignmentId
  );

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/lectures">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Create Lecture</h1>
            <p className="text-muted-foreground">
              Start a live lecture session for a course.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lecture Details</CardTitle>
            <CardDescription>
              Choose the course assignment and academic week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="assignment">Course Assignment *</Label>
                  {coursesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : coursesError ? (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-red-500">Failed to load courses</p>
                      <Button type="button" variant="ghost" size="sm" onClick={() => refetchCourses()}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={form.assignmentId}
                      onValueChange={(value) => handleChange("assignmentId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course assignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {allAssignments.map((a) => (
                          <SelectItem key={a.assignmentId} value={String(a.assignmentId)}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicWeek">Academic Week *</Label>
                  <Select
                    value={form.academicWeek}
                    onValueChange={(value) => handleChange("academicWeek", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic week" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_WEEKS.map((week) => (
                        <SelectItem key={week} value={String(week)}>
                          Week {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedAssignment && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg border bg-muted/40 p-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Course</p>
                    <p className="font-medium">{selectedAssignment.courseCode} - {selectedAssignment.courseName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Group</p>
                    <p className="font-medium">{selectedAssignment.groupName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Semester</p>
                    <p className="font-medium">{selectedAssignment.semesterId}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Brief description or notes for the lecture..."
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                />
              </div>

              {createLecture.isError && (
                <p className="text-sm text-red-500">
                  Failed to create lecture: {createLecture.error?.message || "Unknown error"}
                </p>
              )}

              <div className="flex items-center justify-end gap-4">
                <Link href="/lectures">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createLecture.isPending || !form.assignmentId || !form.academicWeek}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {createLecture.isPending ? "Starting..." : "Start Lecture"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
