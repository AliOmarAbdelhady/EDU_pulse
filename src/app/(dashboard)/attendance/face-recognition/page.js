"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Save,
  ScanFace,
  ShieldAlert,
  Timer,
  Users,
  XCircle,
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
import {
  useCourses,
  useCourseGradebook,
} from "@/lib/hooks/useCourses";
import {
  useFaceRecognition,
  useSubmitFaceAttendance,
} from "@/lib/hooks/useFaceRecognition";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  {
    value: "Present",
    label: "Present",
    Icon: CheckCircle2,
    className:
      "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
  },
  {
    value: "Absent",
    label: "Absent",
    Icon: XCircle,
    className:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
  {
    value: "Excused",
    label: "Excused",
    Icon: ShieldAlert,
    className:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    value: "Late",
    label: "Late",
    Icon: Timer,
    className:
      "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  },
];

const STATUS_BADGES = {
  Recognized: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Not Detected": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  Present: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Excused: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

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
    }))
  );
}

const CAPTURE_INTERVAL_MS = 5000;
const JPEG_QUALITY = 0.6;
const CAPTURE_WIDTH = 480;
const CAPTURE_HEIGHT = 360;

function StatCard({ icon: Icon, label, value, tone = "text-primary" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-7 w-7", tone)} />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FaceRecognitionPage() {
  const [selectedKeyOverride, setSelectedKeyOverride] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [recognizedMap, setRecognizedMap] = useState({});
  const [attendanceOverrides, setAttendanceOverrides] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const processingRef = useRef(false);

  const { data: courses, isLoading: coursesLoading } = useCourses();
  const faceRecognition = useFaceRecognition();
  const submitAttendance = useSubmitFaceAttendance();

  const assignmentOptions = useMemo(
    () => buildAssignmentOptions(courses || []),
    [courses]
  );

  const selectedKey = assignmentOptions.some(
    (option) => option.key === selectedKeyOverride
  )
    ? selectedKeyOverride
    : assignmentOptions[0]?.key || "";

  const selectedOption = assignmentOptions.find(
    (option) => option.key === selectedKey
  );

  const { data: gradebook, isLoading: gradebookLoading } = useCourseGradebook(
    selectedOption?.courseId,
    selectedOption?.assignmentId
  );

  const students = gradebook?.students || [];
  const activeWeek = gradebook?.weeks?.includes(selectedWeek)
    ? selectedWeek
    : gradebook?.weeks?.[0] || 1;
  const isLoading = coursesLoading || (selectedOption && gradebookLoading);
  const selectedAssignmentId = selectedOption?.assignmentId;

  const recognizedCount = students.filter(
    (row) => recognizedMap[row.student.studentId]
  ).length;

  function setAttendanceStatus(studentId, status) {
    setAttendanceOverrides((current) => ({
      ...current,
      [studentId]: status,
    }));
  }

  function getAttendanceStatus(studentId) {
    if (attendanceOverrides[studentId]) return attendanceOverrides[studentId];
    if (recognizedMap[studentId]) return "Present";
    return null;
  }

  function getRecognitionStatus(studentId) {
    if (recognizedMap[studentId]) {
      return { status: "Recognized", confidence: recognizedMap[studentId].confidence };
    }
    return { status: "Not Detected", confidence: 0 };
  }

  const handleFrame = useCallback(
    async (base64) => {
      if (!selectedAssignmentId || processingRef.current) return;
      processingRef.current = true;
      setIsProcessing(true);
      try {
        const result = await faceRecognition.mutateAsync({
          image: base64,
          assignmentId: selectedAssignmentId,
        });
        if (result.matchedStudents) {
          setRecognizedMap((prev) => {
            const next = { ...prev };
            for (const match of result.matchedStudents) {
              const existing = next[match.studentId];
              if (!existing || match.confidence > existing.confidence) {
                next[match.studentId] = match;
              }
            }
            return next;
          });
        }
      } catch (err) {
        console.error("Face recognition frame error:", err);
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
    [selectedAssignmentId, faceRecognition]
  );

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: CAPTURE_WIDTH,
          height: CAPTURE_HEIGHT,
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      toast.error(
        err.name === "NotAllowedError"
          ? "Camera access denied"
          : "Camera error: " + err.message
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = CAPTURE_WIDTH;
    canvas.height = CAPTURE_HEIGHT;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const base64 = dataUrl.split(",")[1];
    handleFrame(base64);
  }, [handleFrame]);

  const toggleCamera = useCallback(() => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isCameraActive, startCamera, stopCamera]);

  const startCaptureLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      captureFrame();
    }, CAPTURE_INTERVAL_MS);
    captureFrame();
  }, [captureFrame]);

  const stopCaptureLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isCameraActive) {
      stopCaptureLoop();
      return undefined;
    }

    startCaptureLoop();
    return stopCaptureLoop;
  }, [isCameraActive, startCaptureLoop, stopCaptureLoop]);

  function markRecognizedPresent() {
    setAttendanceOverrides((current) => {
      const next = { ...current };
      for (const row of students) {
        if (recognizedMap[row.student.studentId] && !next[row.student.studentId]) {
          next[row.student.studentId] = "Present";
        }
      }
      return next;
    });
  }

  function markUnrecognizedAbsent() {
    setAttendanceOverrides((current) => {
      const next = { ...current };
      for (const row of students) {
        if (!recognizedMap[row.student.studentId] && !next[row.student.studentId]) {
          next[row.student.studentId] = "Absent";
        }
      }
      return next;
    });
  }

  function handleSave() {
    const attendance = students.map((row) => ({
      studentId: row.student.studentId,
      status: getAttendanceStatus(row.student.studentId) || "Absent",
    }));

    submitAttendance.mutate(
      {
        assignmentId: selectedOption.assignmentId,
        academicWeek: activeWeek,
        attendance,
      },
      {
        onSuccess: (result) => {
          toast.success(`Week ${activeWeek} attendance saved (${result.recordsSaved} records)`);
          setAttendanceOverrides({});
        },
        onError: (err) => toast.error(err.message || "Failed to save attendance"),
      }
    );
  }

  function handleReset() {
    setRecognizedMap({});
    setAttendanceOverrides({});
  }

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <ScanFace className="h-8 w-8" />
              Face Recognition Attendance
            </h1>
            <p className="text-muted-foreground">
              Use face recognition to automatically detect and mark student attendance.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selectedKey}
              onChange={(e) => {
                setSelectedKeyOverride(e.target.value);
                setRecognizedMap({});
                setAttendanceOverrides({});
              }}
              className="h-9 min-w-72 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {assignmentOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.courseCode} - {option.groupName} - {option.semesterName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {assignmentOptions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 gap-3">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No course assignments found.</p>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard icon={Users} label="Total Students" value={students.length} />
              <StatCard
                icon={CheckCircle2}
                label="Recognized"
                value={recognizedCount}
                tone="text-green-500"
              />
              <StatCard
                icon={Camera}
                label="Camera"
                value={isCameraActive ? "Active" : "Off"}
                tone={isCameraActive ? "text-green-500" : "text-muted-foreground"}
              />
              <StatCard
                icon={AlertTriangle}
                label="Unrecognized"
                value={students.length - recognizedCount}
                tone="text-yellow-500"
              />
            </div>

            {/* Camera + Controls */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>Camera Feed</CardTitle>
                    <CardDescription>
                      {isProcessing
                        ? "Processing the latest frame with DeepFace..."
                        : isCameraActive
                        ? "Capturing faces every 5 seconds..."
                        : "Start the camera to begin face recognition"}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={activeWeek}
                      onChange={(e) => setSelectedWeek(Number(e.target.value))}
                      className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {(gradebook?.weeks || []).map((week) => (
                        <option key={week} value={week}>
                          Week {week}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant={isCameraActive ? "destructive" : "default"}
                      size="sm"
                      onClick={toggleCamera}
                    >
                      <Camera className="h-4 w-4" />
                      {isCameraActive ? "Stop Camera" : "Start Camera"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Video feed */}
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-2xl mx-auto">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {isCameraActive && (
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
                          <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-white text-xs font-medium">FACE DETECTION</span>
                        </div>
                      </div>
                    )}
                    {isCameraActive && recognizedCount > 0 && (
                      <div className="absolute top-3 right-3 bg-black/60 rounded-lg px-3 py-1.5">
                        <span className="text-white text-xs font-medium">
                          {recognizedCount} recognized
                        </span>
                      </div>
                    )}
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="text-center space-y-2">
                          <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-muted-foreground">Camera is off</p>
                          <p className="text-xs text-muted-foreground">
                            Start the camera to detect student faces
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </CardContent>
            </Card>

            {/* Student table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>
                      {gradebook?.course?.courseCode} {gradebook?.course?.courseName} — Week {activeWeek}
                    </CardTitle>
                    <CardDescription>
                      {recognizedCount} of {students.length} students recognized
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={markRecognizedPresent}>
                      <CheckCircle2 className="h-4 w-4" />
                      Mark recognized present
                    </Button>
                    <Button variant="outline" size="sm" onClick={markUnrecognizedAbsent}>
                      <XCircle className="h-4 w-4" />
                      Mark unrecognized absent
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={submitAttendance.isPending || students.length === 0}
                    >
                      <Save className="h-4 w-4" />
                      Save attendance
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RefreshCw className="h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recognition</TableHead>
                        <TableHead className="min-w-48">Student</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-center">Attendance</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-muted-foreground"
                          >
                            No students found for this assignment.
                          </TableCell>
                        </TableRow>
                      ) : (
                        students.map((row) => {
                          const rec = getRecognitionStatus(row.student.studentId);
                          const currentStatus = getAttendanceStatus(row.student.studentId);

                          return (
                            <TableRow key={row.student.studentId}>
                              <TableCell>
                                <Badge
                                  className={
                                    STATUS_BADGES[rec.status] || STATUS_BADGES["Not Detected"]
                                  }
                                  variant="outline"
                                >
                                  {rec.status}
                                  {rec.confidence > 0 && (
                                    <span className="ml-1 opacity-70">
                                      ({Math.round(rec.confidence * 100)}%)
                                    </span>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {row.student.fullName || row.student.username}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {row.student.studentCode}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap justify-center gap-1.5">
                                  {STATUS_OPTIONS.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      aria-pressed={currentStatus === option.value}
                                      onClick={() =>
                                        setAttendanceStatus(
                                          row.student.studentId,
                                          option.value
                                        )
                                      }
                                      className={cn(
                                        "inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-xs font-medium transition-colors",
                                        currentStatus === option.value
                                          ? option.className
                                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                                      )}
                                    >
                                      <option.Icon className="h-3.5 w-3.5" />
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  className={
                                    currentStatus
                                      ? STATUS_BADGES[currentStatus]
                                      : "bg-muted text-muted-foreground"
                                  }
                                  variant="outline"
                                >
                                  {currentStatus || "Pending"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </motion.div>
  );
}
