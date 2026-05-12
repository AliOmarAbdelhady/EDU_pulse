"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Building,
  GraduationCap,
  Users,
  BookOpen,
  Award,
  RefreshCw,
} from "lucide-react";
import { useDepartment } from "@/lib/hooks/useDepartment";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const { data: department, isLoading, isError, error, refetch } = useDepartment(id);

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
          <p className="text-muted-foreground">Failed to load department: {error?.message || "Unknown error"}</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!department) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Department not found.</p>
          <Link href="/departments">
            <Button variant="outline">Back to Departments</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  const counts = department._count || {};
  const lecturers = department.lecturers || [];
  const courses = department.courses || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/departments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="font-mono text-muted-foreground mr-2">{department.departmentCode}</span>
              {department.departmentName}
            </h1>
            <p className="text-muted-foreground">
              Department overview with lecturers and courses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{counts.students || 0}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{counts.lecturers || 0}</p>
                  <p className="text-sm text-muted-foreground">Lecturers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{counts.courses || 0}</p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Department Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Code</span>
              <Badge variant="outline" className="font-mono">{department.departmentCode}</Badge>
            </div>
            <Separator />
            {department.building && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Building</span>
                  <span className="font-medium">{department.building}</span>
                </div>
                <Separator />
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Lecturers
              </CardTitle>
              <CardDescription>Academic staff in this department.</CardDescription>
            </CardHeader>
            <CardContent>
              {lecturers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No lecturers found.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="text-center">Assignments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lecturers.map((lecturer) => (
                        <TableRow key={lecturer.lecturerId}>
                          <TableCell className="font-medium">
                            {lecturer.fullName || lecturer.user?.username || "Unknown"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {lecturer.title || "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            {lecturer._count?.assignments || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Courses
              </CardTitle>
              <CardDescription>Courses offered by this department.</CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No courses found.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-center">Credits</TableHead>
                        <TableHead className="text-center">Groups</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.courseId}>
                          <TableCell>
                            <Link href={`/courses/${course.courseId}`} className="font-mono text-sm font-medium hover:underline">
                              {course.courseCode}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm">{course.courseName}</TableCell>
                          <TableCell className="text-center">{course.creditHours || 3}</TableCell>
                          <TableCell className="text-center">
                            {course._count?.studentGroups || 0}
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
    </motion.div>
  );
}
