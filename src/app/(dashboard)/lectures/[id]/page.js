"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
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
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Users,
  BarChart3,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Radio,
  Play,
} from "lucide-react";
import { useLecture } from "@/lib/hooks/useLectures";
import { useEngagement } from "@/lib/hooks/useEngagement";
import { useLectureAnalytics } from "@/lib/hooks/useLectureAnalytics";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import dynamic from "next/dynamic";

const ChartContainer = dynamic(
  () => import("@/components/charts/ChartContainer"),
  { ssr: false, loading: () => <div className="h-[200px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);
const EmotionBarChart = dynamic(
  () => import("@/components/charts/EmotionBarChart"),
  { ssr: false, loading: () => <div className="h-[350px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);
const EmotionPieChart = dynamic(
  () => import("@/components/charts/EmotionPieChart"),
  { ssr: false, loading: () => <div className="h-[350px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);
const EmotionLineChart = dynamic(
  () => import("@/components/charts/EmotionLineChart"),
  { ssr: false, loading: () => <div className="h-[350px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);

const emotionColors = {
  Happy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Neutral: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  Confused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Bored: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function formatLectureClockTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatLectureTimeRange(lecture) {
  const start = formatLectureClockTime(lecture.startTime);
  const end = formatLectureClockTime(lecture.endTime);

  if (!start) return "Assigned when lecture starts";
  if (lecture.status === "in_progress") return `${start} - Live now`;
  if (!end) return `${start} - End assigned after lecture`;

  return `${start} - ${end}`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    </div>
  );
}

export default function LectureDetailPage() {
  const { id } = useParams();
  const { data: lecture, isLoading, isError, error, refetch } = useLecture(id);
  const { data: engagementData } = useEngagement({ lectureId: id });
  const { data: analytics } = useLectureAnalytics(lecture?.status === "analyzed" ? id : null);
  const { role } = useCurrentUser();

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
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Failed to load lecture: {error?.message || "Unknown error"}</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!lecture) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Lecture not found.</p>
          <Link href="/lectures">
            <Button variant="outline">Back to Lectures</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  const assignment = lecture.assignment || {};
  const course = assignment.course || {};
  const lecturer = assignment.lecturer || {};
  const group = assignment.group || {};
  const semester = assignment.semester || {};
  const room = lecture.room || {};
  const emotionRecords = lecture.emotionRecords || [];
  const attendanceRecords = lecture.attendanceRecords || [];
  const counts = lecture._count || {};

  // Compute emotion counts
  const emotionCounts = {};
  for (const record of emotionRecords) {
    const emo = record.emotion || "Unknown";
    emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
  }
  const emotionDistribution = Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion,
    count,
    percentage: emotionRecords.length > 0 ? Math.round((count / emotionRecords.length) * 100) : 0,
  }));

  // Compute averages from emotion records
  const avgEngagement = emotionRecords.length > 0
    ? Math.round(emotionRecords.reduce((acc, r) => acc + (r.engagementScore || 0), 0) / emotionRecords.length)
    : 0;
  const avgFocus = emotionRecords.length > 0
    ? Math.round(emotionRecords.reduce((acc, r) => acc + (r.focusScore || 0), 0) / emotionRecords.length)
    : 0;

  const statusColors = {
    scheduled: "bg-primary/15 text-primary",
    in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    analyzed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  // Build venue string
  const venue = room.roomNumber
    ? [room.building, room.roomNumber].filter(Boolean).join(" - ")
    : "N/A";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/lectures">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{lecture.lectureName}</h1>
            <p className="text-muted-foreground">
              Lecture details, emotions, and student engagement.
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {(role === "lecturer" || role === "admin") && (
              <Link href={`/lectures/${lecture.lectureId}/insights`}>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" /> Insights
                </Button>
              </Link>
            )}
            {(role === "lecturer" || role === "admin") && (
              <Link href={`/lectures/${lecture.lectureId}/pulse`}>
                <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                  <Radio className="h-4 w-4 mr-2" /> Live Pulse
                </Button>
              </Link>
            )}
            {(role === "lecturer" || role === "admin") && lecture.status === "scheduled" && (
              <Link href={`/lectures/${lecture.lectureId}/live?capture=lecturer_camera&autoStart=1`}>
                <Button>
                  <Play className="h-4 w-4 mr-2" /> Start Live
                </Button>
              </Link>
            )}
            {(role === "lecturer" || role === "admin") && lecture.status === "in_progress" && (
              <Link href={`/lectures/${lecture.lectureId}/live`}>
                <Button variant="destructive">
                  <Radio className="h-4 w-4 mr-2 animate-pulse" /> View Live
                </Button>
              </Link>
            )}
            {role === "student" && lecture.status === "in_progress" && (
              <Link href={`/lectures/${lecture.lectureId}/live-student`}>
                <Button>
                  <Radio className="h-4 w-4 mr-2" /> Join Live
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Lecture Information</CardTitle>
              <CardDescription>Session details and metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Course</p>
                    <p className="font-medium">
                      <Link href={`/courses/${course.courseId}`} className="hover:underline">
                        {course.courseCode} - {course.courseName}
                      </Link>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(lecture.lectureDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">
                      {formatLectureTimeRange(lecture)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="font-medium">{venue}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Lecturer</p>
                  <p className="font-medium">{lecturer.fullName || lecturer.user?.username || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Group</p>
                  <p className="font-medium">{group.groupName || group.groupCode || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="font-medium">{semester.semesterName || lecture.semesterId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Academic Week</p>
                  <p className="font-medium">Week {lecture.academicWeek || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    className={statusColors[lecture.status] || ""}
                    variant="outline"
                  >
                    {(lecture.status || "scheduled").toUpperCase()}
                  </Badge>
                </div>
              </div>

              {lecture.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="mt-1">{lecture.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Attendance</span>
                <span className="font-semibold">{counts.attendanceRecords || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Emotion Records</span>
                <span className="font-semibold">{counts.emotionRecords || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Engagement</span>
                <span className="font-semibold">{avgEngagement}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Focus</span>
                <span className="font-semibold">{avgFocus}%</span>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Emotion Distribution</p>
                <div className="flex flex-wrap gap-2">
                  {emotionDistribution.map(({ emotion, count, percentage }) => (
                    <Badge key={emotion} className={emotionColors[emotion] || ""} variant="outline">
                      {emotion}: {count} ({percentage}%)
                    </Badge>
                  ))}
                  {emotionDistribution.length === 0 && (
                    <span className="text-sm text-muted-foreground">No data yet</span>
                  )}
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
              Distribution of emotions detected during this lecture ({emotionRecords.length} records).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emotionDistribution.length === 0 ? (
              <div className="h-48 flex items-center justify-center bg-muted/50 rounded-lg border border-dashed">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No emotion data collected yet</p>
                  <p className="text-sm">Data collected during the lecture will populate this visualization</p>
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
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Emotion Records
            </CardTitle>
            <CardDescription>
              Individual emotion and engagement scores for each student in this lecture.
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
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Emotion</TableHead>
                      <TableHead className="text-center">Engagement</TableHead>
                      <TableHead className="text-center">Focus</TableHead>
                      <TableHead className="text-center">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emotionRecords.map((record) => (
                      <TableRow key={record.recordId}>
                        <TableCell className="font-medium">
                          {record.studentId ? (
                            <Link href={`/students/${record.studentId}`} className="hover:underline">
                              {record.student?.fullName || record.student?.user?.email || `Student #${record.studentId}`}
                            </Link>
                          ) : (
                            <span>Classroom camera</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.student?.user?.email || (record.studentId ? "N/A" : "No student assigned")}
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
                            <span className="text-sm font-medium">{Math.round(record.engagementScore || 0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-purple-500"
                                style={{ width: `${Math.round(record.focusScore || 0)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{Math.round(record.focusScore || 0)}%</span>
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

        {/* Post-Lecture Analytics (only when analyzed) */}
        {lecture.status === "analyzed" && analytics && (
          <>
            <Separator />

            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Post-Lecture Analytics
              </h2>
              <p className="text-muted-foreground mt-1">
                Comprehensive analysis of student engagement and emotions during this lecture.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Records</p>
                  <p className="text-3xl font-bold">{analytics.summary?.totalRecords || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Unique Students</p>
                  <p className="text-3xl font-bold">{analytics.summary?.uniqueStudents || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Peak Engagement</p>
                  <p className="text-3xl font-bold">
                    {analytics.summary?.peakEngagementMinute != null
                      ? `Min ${analytics.summary.peakEngagementMinute}`
                      : "N/A"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Dominant Emotion</p>
                  <p className="text-3xl font-bold">{analytics.summary?.dominantEmotion || "N/A"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer
                title="Emotion Distribution"
                description="Number of detections per emotion type"
              >
                {analytics.emotionDistribution?.length > 0 ? (
                  <EmotionBarChart
                    data={analytics.emotionDistribution.map((e) => ({
                      emotion: e.emotion?.toUpperCase(),
                      count: e.count,
                    }))}
                    layout="vertical"
                    height={300}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data
                  </div>
                )}
              </ChartContainer>

              <ChartContainer
                title="Emotion Percentages"
                description="Proportion of each emotion"
              >
                {analytics.emotionDistribution?.length > 0 ? (
                  <EmotionPieChart
                    data={analytics.emotionDistribution.map((e) => ({
                      emotion: e.emotion?.toUpperCase(),
                      count: e.count,
                      percent: e.percentage,
                    }))}
                    height={300}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data
                  </div>
                )}
              </ChartContainer>
            </div>

            {/* Engagement Timeline */}
            {analytics.engagementTimeline?.length > 0 && (
              <ChartContainer
                title="Engagement & Focus Timeline"
                description="How engagement and focus changed throughout the lecture"
              >
                <EmotionLineChart
                  data={analytics.engagementTimeline.map((p) => ({
                    date: `Min ${p.timeMinute}`,
                    Engagement: p.avgEngagement,
                    Focus: p.avgFocus,
                  }))}
                  emotions={["Engagement", "Focus"]}
                  height={350}
                />
              </ChartContainer>
            )}

            {/* Emotion by Segment */}
            {analytics.emotionBySegment?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Emotion by Time Segment</CardTitle>
                  <CardDescription>How emotions shifted across the lecture</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analytics.emotionBySegment.map((seg) => (
                      <div key={seg.segment} className="p-4 rounded-lg bg-muted">
                        <p className="font-medium text-sm mb-3">{seg.segment}</p>
                        {Object.entries(seg.emotionCounts || {}).map(([emotion, count]) => (
                          <div key={emotion} className="flex items-center justify-between text-sm">
                            <Badge className={emotionColors[emotion] || ""} variant="outline">
                              {emotion}
                            </Badge>
                            <span>{count}</span>
                          </div>
                        ))}
                        {Object.keys(seg.emotionCounts || {}).length === 0 && (
                          <p className="text-xs text-muted-foreground">No data</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student Breakdown */}
            {analytics.studentBreakdown?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" /> Student Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-center">Avg Engagement</TableHead>
                          <TableHead className="text-center">Avg Focus</TableHead>
                          <TableHead className="text-center">Dominant Emotion</TableHead>
                          <TableHead className="text-center">Records</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.studentBreakdown.map((s) => (
                          <TableRow key={s.studentId}>
                            <TableCell>
                              <Link href={`/students/${s.studentId}`} className="hover:underline font-medium">
                                {s.fullName}
                              </Link>
                              <p className="text-xs text-muted-foreground">{s.email}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-muted rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full bg-primary"
                                    style={{ width: `${s.avgEngagement}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{s.avgEngagement}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-muted rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full bg-purple-500"
                                    style={{ width: `${s.avgFocus}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{s.avgFocus}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={emotionColors[s.dominantEmotion] || ""} variant="outline">
                                {s.dominantEmotion}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm">{s.recordCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alert History */}
            {analytics.alerts?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" /> Alerts During Lecture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.alerts.map((alert, i) => (
                      <div
                        key={i}
                        className={`border-l-4 rounded-r-lg p-3 ${
                          alert.severity === "critical"
                            ? "border-red-500 bg-red-50 dark:bg-red-950"
                            : alert.severity === "warning"
                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                            : "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{alert.severity}</Badge>
                            <span className="text-sm">{alert.message}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{alert.alertType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
