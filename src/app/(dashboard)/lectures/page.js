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
import { Plus, Search, Eye, Edit, Trash2, RefreshCw, Radio, Play } from "lucide-react";
import { useLectures } from "@/lib/hooks/useLectures";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

const statusColors = {
  scheduled: "bg-primary/15 text-primary",
  SCHEDULED: "bg-primary/15 text-primary",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  analyzed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  ANALYZED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

function LectureSkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
      <TableCell><Skeleton className="h-5 w-[90px]" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
    </TableRow>
  ));
}

export default function LecturesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { role } = useCurrentUser();

  const filters = {};
  if (statusFilter !== "ALL") filters.status = statusFilter;
  if (search.trim()) filters.search = search.trim();

  const { data: lectures, isLoading, isError, refetch } = useLectures(filters);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Lectures</h1>
            <p className="text-muted-foreground">
              Manage and view all scheduled lectures across courses.
            </p>
          </div>
          <Link href="/lectures/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Lecture
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Lectures</CardTitle>
            <CardDescription>
              A list of all lectures with their course, date, and status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lectures..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground">Failed to load lectures.</p>
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
                      <TableHead>Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <LectureSkeletonRows />
                    ) : !lectures || lectures.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No lectures found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lectures.map((lecture) => (
                        <TableRow key={lecture.lectureId}>
                          <TableCell className="font-medium">
                            <Link href={`/lectures/${lecture.lectureId}`} className="hover:underline">
                              {lecture.lectureName}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {lecture.assignment?.course?.courseCode || "N/A"}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {lecture.assignment?.course?.courseName || ""}
                            </span>
                          </TableCell>
                          <TableCell>
                            {lecture.lectureDate
                              ? new Date(lecture.lectureDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {lecture.room?.roomNumber || "No room assigned"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={statusColors[lecture.status] || ""}
                              variant="outline"
                            >
                              {lecture.status?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Live buttons based on role and status */}
                              {(role === "lecturer" || role === "admin") && lecture.status === "scheduled" && (
                                <Link href={`/lectures/${lecture.lectureId}/live?capture=lecturer_camera&autoStart=1`}>
                                  <Button variant="default" size="sm" className="gap-1">
                                    <Play className="h-3 w-3" /> Start Live
                                  </Button>
                                </Link>
                              )}
                              {(role === "lecturer" || role === "admin") && lecture.status === "in_progress" && (
                                <Link href={`/lectures/${lecture.lectureId}/live`}>
                                  <Button variant="destructive" size="sm" className="gap-1">
                                    <Radio className="h-3 w-3 animate-pulse" /> View Live
                                  </Button>
                                </Link>
                              )}
                              {role === "student" && lecture.status === "in_progress" && (
                                <Link href={`/lectures/${lecture.lectureId}/live-student`}>
                                  <Button variant="default" size="sm" className="gap-1">
                                    <Radio className="h-3 w-3" /> Join Live
                                  </Button>
                                </Link>
                              )}
                              <Link href={`/lectures/${lecture.lectureId}`}>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
