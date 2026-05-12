"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  FileUp,
  FileText,
  Download,
  Trash2,
  Upload,
  FolderOpen,
  RefreshCw,
  Search,
  GraduationCap,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Presentation,
  Sheet,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  useLectureContent,
  useUploadLectureContent,
  useDeleteLectureContent,
} from "@/lib/hooks/useLectureContent";
import { useCourses } from "@/lib/hooks/useCourses";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

const FILE_TYPE_STYLES = {
  pdf: { icon: FileText, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  document: { icon: FileText, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  image: { icon: FileImage, color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  video: { icon: FileVideo, color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  audio: { icon: FileAudio, color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  presentation: { icon: Presentation, color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  spreadsheet: { icon: Sheet, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  archive: { icon: FileArchive, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  other: { icon: File, color: "bg-muted text-muted-foreground" },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildAssignmentOptions(courses = []) {
  return courses.flatMap((course) =>
    (course.assignments || []).map((assignment) => ({
      key: `${course.courseId}:${assignment.assignmentId}`,
      courseId: String(course.courseId),
      assignmentId: String(assignment.assignmentId),
      courseCode: course.courseCode,
      courseName: course.courseName,
      groupName:
        assignment.group?.groupCode ||
        assignment.group?.groupName ||
        "Group",
      semesterName:
        assignment.semester?.semesterName ||
        assignment.semester?.semesterId ||
        "Semester",
      semesterId: assignment.semester?.semesterId,
    }))
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function LecturerUploadForm({ assignmentOptions }) {
  const fileInputRef = useRef(null);
  const [selectedKey, setSelectedKey] = useState(
    assignmentOptions[0]?.key || ""
  );
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const uploadMutation = useUploadLectureContent();

  const selectedOption = assignmentOptions.find(
    (opt) => opt.key === selectedKey
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedOption) {
      toast.error("Please select a course");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    uploadMutation.mutate(
      {
        file: selectedFile,
        assignmentId: selectedOption.assignmentId,
        academicWeek: selectedWeek,
        title: title.trim(),
        description: description.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Material uploaded successfully! Students have been notified.");
          setTitle("");
          setDescription("");
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
        onError: (err) => toast.error(err.message || "Upload failed"),
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Material
        </CardTitle>
        <CardDescription>
          Upload lecture materials for a specific course and week. Students will
          be notified automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {assignmentOptions.length === 0 ? (
                  <option value="">No courses assigned</option>
                ) : (
                  assignmentOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.courseCode} - {opt.groupName} - {opt.semesterName}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Week</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Week {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to Data Structures - Week 3 Notes"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the material..."
              rows={2}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">File</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              {selectedFile ? (
                <div className="text-center">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Click to select a file (max 50MB)
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.mp4,.avi,.mov,.mp3,.wav,.zip,.rar,.txt,.csv"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              className="hidden"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              uploadMutation.isPending ||
              !selectedOption ||
              !selectedFile ||
              !title.trim()
            }
          >
            {uploadMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Material
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LecturerMaterialsTable({ contents }) {
  const deleteMutation = useDeleteLectureContent();

  function handleDelete(content) {
    if (!confirm(`Delete "${content.title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(content.contentId, {
      onSuccess: () => toast.success("Material deleted"),
      onError: (err) => toast.error(err.message || "Delete failed"),
    });
  }

  if (contents.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 gap-3">
        <FolderOpen className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          No materials uploaded yet. Use the form above to upload your first
          material.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Uploaded Materials
        </CardTitle>
        <CardDescription>
          {contents.length} material{contents.length !== 1 ? "s" : ""} uploaded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48">Title</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map((item) => {
                const typeStyle = FILE_TYPE_STYLES[item.fileType] || FILE_TYPE_STYLES.other;
                const TypeIcon = typeStyle.icon;
                return (
                  <TableRow key={item.contentId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-40 truncate">
                      {item.originalName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={typeStyle.color}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {item.fileType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatFileSize(item.fileSize)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Week {item.academicWeek}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.assignment?.course?.courseCode}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/${item.filePath}`} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentMaterialsView({ contents, assignmentOptions }) {
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");

  const filtered = useMemo(() => {
    let items = contents;
    if (selectedKey) {
      const opt = assignmentOptions.find((o) => o.key === selectedKey);
      if (opt) items = items.filter((c) => String(c.assignmentId) === opt.assignmentId);
    }
    if (selectedWeek) {
      items = items.filter((c) => c.academicWeek === Number(selectedWeek));
    }
    return items;
  }, [contents, selectedKey, selectedWeek, assignmentOptions]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const item of filtered) {
      const key = item.academicWeek;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  }, [filtered]);

  if (contents.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 gap-3">
        <FolderOpen className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          No materials available yet. Your lecturers haven&apos;t uploaded any
          materials for your courses.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="h-9 min-w-64 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Courses</option>
          {assignmentOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.courseCode} - {opt.groupName}
            </option>
          ))}
        </select>
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="h-9 min-w-40 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All Weeks</option>
          {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-8 gap-2">
          <Search className="h-6 w-6 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            No materials match the selected filters.
          </p>
        </Card>
      ) : (
        grouped.map(([week, items]) => (
          <Card key={week}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Week {week}
              </CardTitle>
              <CardDescription>
                {items.length} material{items.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => {
                  const typeStyle = FILE_TYPE_STYLES[item.fileType] || FILE_TYPE_STYLES.other;
                  const TypeIcon = typeStyle.icon;
                  return (
                    <div
                      key={item.contentId}
                      className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className={`rounded-lg p-2 ${typeStyle.color}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {item.assignment?.course?.courseCode}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.originalName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(item.fileSize)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Uploaded by {item.uploader?.username || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/${item.filePath}`} download>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export default function LectureContentPage() {
  const { role, isLoading: userLoading } = useCurrentUser();
  const {
    data: courses,
    isLoading: coursesLoading,
    isError: coursesError,
    error: coursesErr,
    refetch: refetchCourses,
  } = useCourses();
  const {
    data: contents,
    isLoading: contentLoading,
    isError: contentError,
    error: contentErr,
    refetch: refetchContent,
  } = useLectureContent();

  const assignmentOptions = useMemo(
    () => buildAssignmentOptions(courses || []),
    [courses]
  );

  const isLecturer = role === "lecturer" || role === "admin";
  const isLoading = userLoading || coursesLoading || contentLoading;
  const isError = coursesError || contentError;
  const error = coursesErr || contentErr;

  function refetch() {
    refetchCourses();
    refetchContent();
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <LoadingState />
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Lecture Materials
            </h1>
            <p className="text-muted-foreground">
              {isLecturer
                ? "Upload and manage course materials organized by week."
                : "Access lecture materials uploaded by your lecturers."}
            </p>
          </div>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {isError ? (
          <Card className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">
              {error?.message || "Failed to load materials"}
            </p>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </Card>
        ) : isLecturer ? (
          <>
            <LecturerUploadForm assignmentOptions={assignmentOptions} />
            <LecturerMaterialsTable contents={contents || []} />
          </>
        ) : (
          <StudentMaterialsView
            contents={contents || []}
            assignmentOptions={assignmentOptions}
          />
        )}
      </div>
    </motion.div>
  );
}
