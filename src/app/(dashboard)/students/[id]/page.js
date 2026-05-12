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
  Mail,
  GraduationCap,
  Building,
  BarChart3,
  BookOpen,
  TrendingUp,
  RefreshCw,
  Award,
} from "lucide-react";
import { useStudent } from "@/lib/hooks/useStudents";
import { useEmotionTrends } from "@/lib/hooks/useEmotions";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import ContactStudentDialog from "@/components/students/ContactStudentDialog";

const emotionColors = {
  Happy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Neutral: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  Confused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Bored: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-32 w-full" /></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    </div>
  );
}

export default function StudentProfilePage() {
  const { id } = useParams();
  const { data: student, isLoading, isError, error, refetch } = useStudent(id);
  const { data: emotionTrends } = useEmotionTrends({ studentId: id });
  const { role } = useCurrentUser();

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
          <p className="text-muted-foreground">Failed to load student: {error?.message || "Unknown error"}</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Student not found.</p>
          <Link href="/students">
            <Button variant="outline">Back to Students</Button>
          </Link>
        </div>
      </div>
    );
  }

  const user = student.user || {};
  const department = student.department || {};
  const emotionRecords = student.emotionRecords || [];
  const counts = student._count || {};
  const canContactStudent = role === "lecturer" || role === "admin";

  // Compute engagement from emotion records
  const avgEngagement = emotionRecords.length > 0
    ? Math.round(emotionRecords.reduce((acc, r) => acc + (r.engagementScore || 0), 0) / emotionRecords.length)
    : 0;

  // Count emotion types
  const emotionCounts = {};
  for (const record of emotionRecords) {
    const emo = record.emotion || "Unknown";
    emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
  }

  // Compute emotion distribution percentages
  const totalEmotions = emotionRecords.length || 1;
  const emotionDistribution = Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion,
    count,
    percentage: Math.round((count / totalEmotions) * 100),
  }));

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/students">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {student.fullName || user.username || "Unknown Student"}
              </h1>
              <p className="text-muted-foreground">
                Student profile with emotion history and engagement scores.
              </p>
            </div>
          </div>
          {canContactStudent && (
            <ContactStudentDialog student={student} buttonLabel="Contact" />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>Personal and academic details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium font-mono">{student.studentCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">
                      {department.departmentName || "N/A"} ({department.departmentCode || "N/A"})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Degree Level</p>
                    <p className="font-medium">{student.degreeLevel || "Undergraduate"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Enrollment Year</p>
                    <p className="font-medium">{student.enrollmentYear || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                    <p className="font-medium">{counts.groupMemberships || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">GPA</p>
                    <p className="font-medium">
                      {student.gpa !== null && student.gpa !== undefined
                        ? Number(student.gpa).toFixed(2)
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Academic Standing</p>
                    <p className="font-medium">
                      {student.academicStanding || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overall Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">{avgEngagement}%</div>
                <p className="text-sm text-muted-foreground mt-1">Average Engagement</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Emotion Records</span>
                  <span className="font-medium">{counts.emotionRecords || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Attendance Records</span>
                  <span className="font-medium">{counts.attendanceRecords || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Course Groups</span>
                  <span className="font-medium">{counts.groupMemberships || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Emotion Distribution
            </CardTitle>
            <CardDescription>
              Distribution of detected emotions across {emotionRecords.length} records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emotionDistribution.length === 0 ? (
              <div className="h-56 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No emotion data available yet</p>
                  <p className="text-sm">Emotion data will appear after attending lectures</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {emotionDistribution.map(({ emotion, count, percentage }) => (
                  <div key={emotion} className="flex items-center gap-4">
                    <Badge className={emotionColors[emotion] || ""} variant="outline" style={{ minWidth: 90 }}>
                      {emotion}
                    </Badge>
                    <div className="flex-1">
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium w-16 text-right">{percentage}%</span>
                    <span className="text-sm text-muted-foreground w-20 text-right">({count} records)</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Emotion Records</CardTitle>
            <CardDescription>
              Most recent emotion detections from lectures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emotionRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No emotion records found.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lecture</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Emotion</TableHead>
                      <TableHead className="text-center">Engagement</TableHead>
                      <TableHead className="text-center">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emotionRecords.slice(0, 20).map((record) => (
                      <TableRow key={record.recordId}>
                        <TableCell className="font-medium">
                          {record.lecture?.lectureName || `Lecture #${record.lectureId}`}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.lecture?.assignment?.course?.courseCode || "N/A"}
                        </TableCell>
                        <TableCell>
                          {new Date(record.recordedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={emotionColors[record.emotion] || ""} variant="outline">
                            {record.emotion}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${Math.round(record.engagementScore || 0)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {Math.round(record.engagementScore || 0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {Math.round((record.confidence || 0) * 100)}%
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
    </div>
  );
}
