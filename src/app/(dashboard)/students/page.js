"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, RefreshCw } from "lucide-react";
import { useStudents } from "@/lib/hooks/useStudents";
import { useDepartments } from "@/lib/hooks/useDepartments";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import ContactStudentDialog from "@/components/students/ContactStudentDialog";

function getEngagementBadge(score) {
  if (score === null || score === undefined) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  if (score >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
}

function StudentTableSkeleton() {
  return Array.from({ length: 6 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell className="text-center"><Skeleton className="h-5 w-14 mx-auto" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
    </TableRow>
  ));
}

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const { role } = useCurrentUser();
  const canContactStudents = role === "lecturer" || role === "admin";

  const filters = {};
  if (search.trim()) filters.search = search.trim();
  if (deptFilter !== "ALL") filters.departmentId = deptFilter;

  const {
    data: students,
    isLoading: studentsLoading,
    isError: studentsError,
    error: studentsErr,
    refetch: refetchStudents,
  } = useStudents(filters);

  const {
    data: departments,
    isLoading: departmentsLoading,
    isError: departmentsError,
    error: departmentsErr,
    refetch: refetchDepartments,
  } = useDepartments();

  const isLoading = studentsLoading || departmentsLoading;
  const isError = studentsError || departmentsError;
  const error = studentsErr || departmentsErr;
  const refetch = () => {
    refetchStudents();
    refetchDepartments();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            View students available through your assigned courses.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Directory</CardTitle>
            <CardDescription>
              Students with their department and engagement scores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {(departments || []).map((dept) => (
                    <SelectItem key={dept.departmentId} value={String(dept.departmentId)}>
                      {dept.departmentName} ({dept.departmentCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground">
                  Failed to load students: {error?.message || "Unknown error"}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="text-center">GPA</TableHead>
                      <TableHead className="text-center">Engagement</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <StudentTableSkeleton />
                    ) : (students || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No students found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (students || []).map((student) => (
                        <TableRow key={student.studentId}>
                          <TableCell className="font-medium">
                            {student.fullName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.user?.email}
                          </TableCell>
                          <TableCell>
                            {student.department ? (
                              <>
                                <span className="font-mono text-sm">
                                  {student.department.departmentCode}
                                </span>
                                <span className="text-muted-foreground ml-1 text-sm">
                                  {student.department.departmentName}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {student.studentCode}
                          </TableCell>
                          <TableCell>{student.degreeLevel}</TableCell>
                          <TableCell className="text-center font-semibold">
                            {student.gpa !== null && student.gpa !== undefined
                              ? Number(student.gpa).toFixed(2)
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={getEngagementBadge(student.avgEngagement)}
                              variant="outline"
                            >
                              {student.avgEngagement !== null && student.avgEngagement !== undefined
                                ? `${student.avgEngagement}%`
                                : "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {canContactStudents && (
                                <ContactStudentDialog
                                  student={student}
                                  buttonVariant="ghost"
                                  buttonSize="icon"
                                  iconOnly
                                />
                              )}
                              <Link href={`/students/${student.studentId}`}>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
