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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building,
  Users,
  GraduationCap,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useDepartments } from "@/lib/hooks/useDepartments";

function DepartmentSkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-[140px]" />
            <Skeleton className="h-4 w-[60px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <Skeleton className="h-4 w-4 mx-auto" />
            <Skeleton className="h-5 w-8 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-4 mx-auto" />
            <Skeleton className="h-5 w-8 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-4 mx-auto" />
            <Skeleton className="h-5 w-8 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
        </div>
        <Skeleton className="h-3 w-[120px]" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

export default function DepartmentsPage() {
  const { data: departments, isLoading, isError, refetch } = useDepartments();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Browse academic departments and their associated programs.
          </p>
        </div>

        {isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-muted-foreground">Failed to load departments.</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <DepartmentSkeletonCard />
                  </motion.div>
                ))
              : !departments || departments.length === 0
                ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4">
                    <p className="text-muted-foreground">No departments found.</p>
                  </div>
                )
                : departments.map((dept, index) => (
                    <motion.div
                      key={dept.departmentId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{dept.departmentName}</CardTitle>
                              <CardDescription className="font-mono">{dept.departmentCode}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {dept.building && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {dept.building}
                            </p>
                          )}

                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="space-y-1">
                              <div className="flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-lg font-bold">{dept._count?.students || 0}</p>
                              <p className="text-xs text-muted-foreground">Students</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-center">
                                <Users className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-lg font-bold">{dept._count?.lecturers || 0}</p>
                              <p className="text-xs text-muted-foreground">Lecturers</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-lg font-bold">{dept._count?.courses || 0}</p>
                              <p className="text-xs text-muted-foreground">Courses</p>
                            </div>
                          </div>

                          {dept.building && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">{dept.building}</p>
                            </div>
                          )}

                          <Link href={`/departments/${dept.departmentId}`}>
                            <Button variant="outline" className="w-full" size="sm">
                              View Department
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
            }
          </div>
        )}
      </div>
    </motion.div>
  );
}
