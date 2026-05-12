"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  BookOpen,
  Users,
  BarChart3,
  GraduationCap,
  Calendar,
  Award,
  RefreshCw,
  ClipboardList,
} from "lucide-react";
import { useCourse } from "@/lib/hooks/useCourses";

const statusColors = {
  scheduled: "bg-primary/15 text-primary",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function getEngagementBadge(score) {
  if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  if (score >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const { data: course, isLoading, isError, error, refetch } = useCourse(id);

  if (isLoading) {
    return (
      <div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Failed to load course: {error?.message || "Unknown error"}</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Course not found.</p>
          <Link href="/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Derive data from the API response
  const department = course.department || {};
  const assignments = course.assignments || [];
  const studentGroups = course.studentGroups || [];

  // Collect all students across groups
  const allStudents = [];
  const seenStudentIds = new Set();
  for (const group of studentGroups) {
    const memberships = group.memberships || [];
    for (const m of memberships) {
      if (m.student && !seenStudentIds.has(m.student.studentId)) {
        seenStudentIds.add(m.student.studentId);
        allStudents.push(m.student);
      }
    }
  }

  // Get lecturers from assignments
  const lecturers = assignments
    .map((a) => a.lecturer)
    .filter(Boolean);

  const primaryLecturer = lecturers[0] || null;
  const totalEnrollments = allStudents.length;
  const totalLectures = assignments.reduce((sum, a) => sum + (a.lectures?.length || 0), 0);

  // Compute average engagement from emotion records if available
  const avgEngagement = allStudents.length > 0
    ? Math.round(allStudents.reduce((acc, s) => {
        const records = s.emotionRecords || [];
        if (records.length === 0) return acc;
        return acc + records.reduce((rAcc, r) => rAcc + (r.engagementScore || 0), 0) / records.length;
      }, 0) / allStudents.filter(s => s.emotionRecords && s.emotionRecords.length > 0).length || 0)
    : 0;

  // Build lecture list from assignments
  const lectures = [];
  for (const assignment of assignments) {
    if (assignment.lectures) {
      for (const lec of assignment.lectures) {
        lectures.push(lec);
      }
    }
  }
  lectures.sort((a, b) => new Date(b.lectureDate) - new Date(a.lectureDate));
  const recentLectures = lectures.slice(0, 10);

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/courses">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                <span className="font-mono text-muted-foreground mr-2">{course.courseCode}</span>
                {course.courseName}
              </h1>
              <p className="text-muted-foreground">
                Course details, enrolled students, lecture history, and gradebook.
              </p>
            </div>
          </div>
          <Link href={`/courses/${course.courseId}/gradebook`}>
            <Button>
              <ClipboardList className="mr-2 h-4 w-4" />
              Open Gradebook
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalEnrollments}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{recentLectures.length}</p>
                  <p className="text-sm text-muted-foreground">Lectures</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{avgEngagement}%</p>
                  <p className="text-sm text-muted-foreground">Avg Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{course.creditHours}</p>
                  <p className="text-sm text-muted-foreground">Credits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Department</span>
                <span className="font-medium">{department.departmentName || "N/A"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lecturer</span>
                <span className="font-medium">
                  {primaryLecturer ? (primaryLecturer.fullName || primaryLecturer.user?.username) : "N/A"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Credits</span>
                <span className="font-medium">{course.creditHours}</span>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{course.description || "No description available."}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lectures
              </CardTitle>
              <CardDescription>Recent and upcoming lecture sessions.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLectures.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No lectures found.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentLectures.map((lecture) => (
                        <TableRow key={lecture.lectureId}>
                          <TableCell className="font-medium">
                            <Link href={`/lectures/${lecture.lectureId}`} className="hover:underline">
                              {lecture.lectureName}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {new Date(lecture.lectureDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[lecture.status] || ""} variant="outline">
                              {(lecture.status || "scheduled").toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Enrolled Students
            </CardTitle>
            <CardDescription>
              Students currently enrolled in this course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No students enrolled.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Student ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allStudents.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell className="font-medium">
                          <Link href={`/students/${student.studentId}`} className="hover:underline">
                            {student.fullName || student.user?.username || "Unknown"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{student.user?.email || "N/A"}</TableCell>
                        <TableCell className="font-mono text-sm">{student.studentCode}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
