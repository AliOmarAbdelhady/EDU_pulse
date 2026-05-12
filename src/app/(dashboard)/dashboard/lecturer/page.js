"use client";

import StatCard from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Radio,
} from "lucide-react";
import { useLecturerStats } from "@/lib/hooks/useStats";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useLectures } from "@/lib/hooks/useLectures";
import Link from "next/link";

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

export default function LecturerDashboard() {
  const { id: userId, isLoading: userLoading } = useCurrentUser();
  const { data: stats, isLoading, isError, refetch } = useLecturerStats(userId);
  const { data: lectures } = useLectures({ status: "in_progress" });
  const liveLectures = lectures || [];

  const loading = userLoading || isLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Lecturer Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your classes and student engagement.
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Lecturer Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your classes and student engagement.
          </p>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load dashboard data</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">
          Lecturer Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor your classes and student engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={(stats?.totalStudents || 0).toString()}
          subtitle="Across all courses"
          icon={Users}
          delay={0}
        />
        <StatCard
          title="Active Courses"
          value={(stats?.courses?.length || 0).toString()}
          subtitle="This semester"
          icon={BookOpen}
          delay={0.1}
        />
        <StatCard
          title="Avg Class Engagement"
          value={`${stats?.avgEngagement || 0}%`}
          subtitle="All lectures combined"
          icon={TrendingUp}
          delay={0.2}
        />
        <StatCard
          title="Lectures This Week"
          value={(stats?.lecturesThisWeek || 0).toString()}
          subtitle={`${stats?.lecturesRemaining || 0} remaining`}
          icon={Calendar}
          delay={0.3}
        />
      </div>

      {/* Currently Live Lectures */}
      {liveLectures.length > 0 && (
        <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500 animate-pulse" />
              Currently Live
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {liveLectures.map((lecture) => (
                <div
                  key={lecture.lectureId}
                  className="flex items-center justify-between p-4 rounded-xl bg-background border"
                >
                  <div>
                    <p className="font-medium">{lecture.lectureName}</p>
                    <p className="text-sm text-muted-foreground">
                      {lecture.assignment?.course?.courseCode} - {lecture.assignment?.course?.courseName}
                    </p>
                  </div>
                  <Link href={`/lectures/${lecture.lectureId}/live`}>
                    <Button variant="destructive" size="sm" className="gap-1">
                      <Radio className="h-3 w-3 animate-pulse" /> View Live Dashboard
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">My Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.courses?.length > 0 ? (
              <div className="space-y-4">
                {stats.courses.map((course) => (
                  <div
                    key={course.code}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {course.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {course.code} &middot; {course.studentCount} students
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {course.engagement || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No courses assigned yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentAlerts?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted"
                  >
                    {alert.type === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm text-foreground/80">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(alert.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No recent alerts
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
