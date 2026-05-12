"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Users,
  BarChart3,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useCourses } from "@/lib/hooks/useCourses";

function getEngagementColor(score) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-danger";
}

function CourseCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="pt-2 border-t">
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export default function CoursesPage() {
  const { data: courses, isLoading, isError, error, refetch } = useCourses();

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Courses</h1>
            <p className="text-muted-foreground">
              Browse and manage the courses available to you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Courses</h1>
            <p className="text-muted-foreground">
              Browse and manage the courses available to you.
            </p>
          </div>
          <Card className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">
              Failed to load courses: {error?.message || "Unknown error"}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Browse and manage the courses available to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(courses || []).map((course, index) => {
            const enrolledCount = course.studentGroups?.reduce(
              (sum, g) => sum + (g._count?.memberships || g.memberships?.length || 0),
              0
            ) || 0;
            const lecturesCount = course._count?.lectures ?? 0;
            const lecturerName = course.assignments?.[0]?.lecturer?.fullName || "TBA";
            const avgEngagement = course.avgEngagement ?? null;

            return (
              <motion.div
                key={course.courseId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono">
                        {course.courseCode}
                      </Badge>
                      <span
                        className={`text-lg font-bold ${
                          avgEngagement !== null
                            ? getEngagementColor(avgEngagement)
                            : "text-muted-foreground"
                        }`}
                      >
                        {avgEngagement !== null ? `${avgEngagement}%` : "—"}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{course.courseName}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {course.creditHours} Credits
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {enrolledCount} Enrolled
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {lecturesCount} Lectures
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {course.department?.departmentName || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        Lecturer:{" "}
                        <span className="font-medium text-foreground">
                          {lecturerName}
                        </span>
                      </p>
                    </div>

                    <Link href={`/courses/${course.courseId}`}>
                      <Button variant="outline" className="w-full" size="sm">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
