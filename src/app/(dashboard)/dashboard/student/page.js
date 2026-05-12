"use client";

import StatCard from "@/components/dashboard/StatCard";
import dynamic from "next/dynamic";

const StudentEngagementChart = dynamic(
  () => import("@/components/dashboard/StudentEngagementChart"),
  { ssr: false, loading: () => <div className="h-[350px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  TrendingUp,
  Smile,
  GraduationCap,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useStudentStats } from "@/lib/hooks/useStats";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

const emotionColors = {
  Happy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Engaged: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  Confused:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Neutral: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  Bored: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (recordDate.getTime() === today.getTime()) return "Today";
  if (recordDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString();
}

export default function StudentDashboard() {
  const { id: userId, isLoading: userLoading } = useCurrentUser();
  const { data: stats, isLoading, isError, refetch } = useStudentStats(userId);

  const studentId = stats?.studentId;

  const loading = userLoading || isLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Student Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s your engagement overview.
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
            Student Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s your engagement overview.
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
          Student Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s your engagement overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Lectures Attended"
          value={(stats?.lecturesAttended || 0).toString()}
          subtitle="This semester"
          icon={BookOpen}
          delay={0}
        />
        <StatCard
          title="Avg Engagement"
          value={`${stats?.avgEngagement || 0}%`}
          subtitle="Across all courses"
          icon={TrendingUp}
          delay={0.1}
        />
        <StatCard
          title="Dominant Emotion"
          value={stats?.dominantEmotion || "N/A"}
          subtitle="Most frequent this week"
          icon={Smile}
          delay={0.2}
        />
        <StatCard
          title="Courses Enrolled"
          value={(stats?.coursesEnrolled || 0).toString()}
          subtitle="Active this semester"
          icon={GraduationCap}
          delay={0.3}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement overview */}
        <StudentEngagementChart userId={userId} />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className={emotionColors[item.emotion] || emotionColors.Neutral}
                        variant="secondary"
                      >
                        {item.emotion}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.lecture}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateLabel(item.recordedAt)} {formatTime(item.recordedAt)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.confidence
                        ? `${(item.confidence * 100).toFixed(0)}%`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
