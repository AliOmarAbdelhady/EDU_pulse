"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Radio,
  Clock,
  Users,
  TrendingUp,
  Brain,
  AlertTriangle,
  StopCircle,
  Camera,
  Eye,
  Loader2,
  Activity,
} from "lucide-react";
import { useLecture } from "@/lib/hooks/useLectures";
import { useLiveLecture } from "@/lib/hooks/useLiveLecture";
import LecturerCameraCapture from "@/components/camera/LecturerCameraCapture";
import dynamic from "next/dynamic";
const ChartContainer = dynamic(
  () => import("@/components/charts/ChartContainer"),
  { ssr: false, loading: () => <div className="h-[200px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);
const EmotionBarChart = dynamic(
  () => import("@/components/charts/EmotionBarChart"),
  { ssr: false, loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);
const EmotionLineChart = dynamic(
  () => import("@/components/charts/EmotionLineChart"),
  { ssr: false, loading: () => <div className="h-[350px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);
const EmotionPieChart = dynamic(
  () => import("@/components/charts/EmotionPieChart"),
  { ssr: false, loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);

const emotionColors = {
  Happy: "#22c55e",
  Neutral: "#6b7280",
  Confused: "#f97316",
  Bored: "#9ca3af",
  Sad: "#3b82f6",
  Angry: "#ef4444",
  Surprise: "#a855f7",
  Fear: "#ec4899",
  Disgust: "#84cc16",
};

const emotionBadgeColors = {
  Happy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Neutral: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  Confused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Bored: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Sad: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Angry: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Surprise: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Fear: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  Disgust: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300",
};

const severityColors = {
  info: "border-blue-500 bg-blue-50 dark:bg-blue-950",
  warning: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  critical: "border-red-500 bg-red-50 dark:bg-red-950",
};

export default function LecturerLiveDashboardPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preferredCaptureMode = searchParams.get("capture");
  const shouldAutoStartCamera = searchParams.get("autoStart") === "1";
  const { data: lecture, isLoading, refetch } = useLecture(id);
  const { liveData, alerts, isConnected, frameStatus, changeCaptureMode, sendFrame, endLecture: endLectureSocket } = useLiveLecture(id);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [startError, setStartError] = useState(null);
  const startRequestedRef = useRef(false);
  const captureModeRequestedRef = useRef(false);

  // Use URL param as initial capture mode so camera renders immediately
  const effectiveCaptureMode = liveData.captureMode === "student" && preferredCaptureMode
    ? preferredCaptureMode
    : liveData.captureMode;

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMinutes((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!lecture || startRequestedRef.current || lecture.status !== "scheduled") return;

    startRequestedRef.current = true;
    setStartError(null);

    fetch(`/api/lectures/${id}/start`, { method: "PATCH" })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to start lecture");
        }
        return refetch();
      })
      .catch((err) => {
        setStartError(err.message || "Failed to start lecture");
      });
  }, [id, lecture, refetch]);

  useEffect(() => {
    const validModes = new Set(["student", "lecturer_camera"]);
    if (
      !isConnected ||
      captureModeRequestedRef.current ||
      !validModes.has(preferredCaptureMode)
    ) {
      return;
    }

    captureModeRequestedRef.current = true;
    changeCaptureMode(preferredCaptureMode);
  }, [changeCaptureMode, isConnected, preferredCaptureMode]);

  const [isEndingLecture, setIsEndingLecture] = useState(false);

  const endLecture = async () => {
    setIsEndingLecture(true);
    try {
      // Flush all socket data first
      await endLectureSocket();
      // Then mark lecture as ended in DB
      await fetch(`/api/lectures/${id}/end`, { method: "PATCH" });
      router.push(`/lectures/${id}`);
    } catch (err) {
      console.error("Failed to end lecture:", err);
      setIsEndingLecture(false);
    }
  };

  const handleLecturerFrame = (base64Image) => {
    sendFrame(base64Image);
  };

  // Build chart data from live data (memoized to prevent unnecessary chart re-renders)
  const barChartData = useMemo(
    () =>
      Object.entries(liveData.emotionCounts)
        .filter(([, count]) => count > 0)
        .map(([emotion, count]) => ({ emotion: emotion.toUpperCase(), count })),
    [liveData.emotionCounts]
  );

  const pieChartData = useMemo(
    () =>
      Object.entries(liveData.emotionCounts)
        .filter(([, count]) => count > 0)
        .map(([emotion, count]) => {
          const total = liveData.totalRecords || 1;
          return {
            emotion: emotion.toUpperCase(),
            count,
            percent: Math.round((count / total) * 100),
          };
        }),
    [liveData.emotionCounts, liveData.totalRecords]
  );

  const timelineData = useMemo(
    () =>
      liveData.engagementTimeline.map((point) => ({
        date: `Min ${point.minute}`,
        Engagement: point.avgEngagement,
        Focus: point.avgFocus,
      })),
    [liveData.engagementTimeline]
  );

  const dominantEmotion = useMemo(
    () =>
      liveData.totalRecords > 0
        ? Object.entries(liveData.emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"
        : "N/A",
    [liveData.totalRecords, liveData.emotionCounts]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Row 1: Live Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/lectures")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{lecture?.lectureName || "Live Lecture"}</h1>
                <Badge className="bg-red-100 text-red-800 animate-pulse">
                  <Radio className="h-3 w-3 mr-1" /> LIVE
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {lecture?.assignment?.course?.courseCode} - {lecture?.assignment?.course?.courseName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{liveData.elapsedMinutes || elapsedMinutes} min</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-muted-foreground">{isConnected ? "Connected" : "Connecting..."}</span>
            </div>

            {effectiveCaptureMode === "lecturer_camera" && frameStatus !== "idle" && (
              <div className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${
                  frameStatus === "sending" ? "bg-yellow-500 animate-pulse" :
                  frameStatus === "processing" ? "bg-blue-500 animate-pulse" :
                  frameStatus === "error" ? "bg-red-500" :
                  "bg-green-500"
                }`} />
                <span className="text-muted-foreground">
                  {frameStatus === "sending" ? "Sending frame..." :
                   frameStatus === "processing" ? "Analyzing faces..." :
                   frameStatus === "error" ? "Processing error" :
                   `${liveData.facesDetected || 0} faces detected`}
                </span>
              </div>
            )}

            <Select value={effectiveCaptureMode} onValueChange={changeCaptureMode}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student Cameras</SelectItem>
                <SelectItem value="lecturer_camera">My Camera</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="destructive" onClick={endLecture} disabled={isEndingLecture}>
              <StopCircle className="h-4 w-4 mr-2" />
              {isEndingLecture ? "Saving data..." : "End Lecture"}
            </Button>
          </div>
        </div>

        {startError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {startError}
          </div>
        )}

        {/* Row 1b: Lecturer Camera (only in lecturer_camera mode) */}
        {effectiveCaptureMode === "lecturer_camera" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4" /> Classroom Camera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LecturerCameraCapture
                lectureId={id}
                onFrame={handleLecturerFrame}
                autoStart={shouldAutoStartCamera || preferredCaptureMode === "lecturer_camera"}
              />
            </CardContent>
          </Card>
        )}

        {/* Row 1c: Live data status when no data yet */}
        {liveData.totalRecords === 0 && effectiveCaptureMode === "lecturer_camera" && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {frameStatus === "sending" || frameStatus === "processing"
                        ? "Processing frames..."
                        : isConnected
                          ? "Waiting for camera frames"
                          : "Not connected to analysis server"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {frameStatus === "error"
                        ? "There was an error processing the last frame. Check that the Python analysis service is running."
                        : "Data will appear here as soon as faces are detected in the camera feed"}
                    </p>
                  </div>
                </div>
                {(frameStatus === "sending" || frameStatus === "processing") && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Row 1d: Real-time Recognized Students Panel */}
        {effectiveCaptureMode === "lecturer_camera" && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Recognized Students
                </CardTitle>
                <div className="flex items-center gap-2">
                  {frameStatus === "processing" && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Analyzing...
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {liveData.latestFaces?.length || 0} face{(liveData.latestFaces?.length || 0) !== 1 ? "s" : ""} detected
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {liveData.latestFaces && liveData.latestFaces.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {liveData.latestFaces.map((face, i) => (
                    <motion.div
                      key={`${face.studentCode || "unknown"}-${i}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: emotionColors[face.emotion] || "#6b7280" }}
                      >
                        {face.studentName && face.studentName !== "Unknown"
                          ? face.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)
                          : "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {face.studentName || "Unknown"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            className={`text-[10px] px-1.5 py-0 h-5 ${emotionBadgeColors[face.emotion] || "bg-gray-100 text-gray-800"}`}
                            variant="outline"
                          >
                            {face.emotion}
                          </Badge>
                          {face.emotionConfidence > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round(face.emotionConfidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                  {frameStatus === "sending" || frameStatus === "processing"
                    ? "Analyzing faces..."
                    : liveData.totalRecords === 0
                      ? "Waiting for camera frames..."
                      : "No faces detected in last frame"}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* Row 2: Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Engagement</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{liveData.avgEngagement}%</p>
                    {liveData.totalRecords > 0 && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Focus</p>
                  <p className="text-2xl font-bold">{liveData.avgFocus}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dominant Emotion</p>
                  <p className="text-2xl font-bold">{dominantEmotion}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                  <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Students</p>
                  <p className="text-2xl font-bold">{liveData.activeStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="Emotion Distribution" description="Real-time emotion breakdown">
            {barChartData.length > 0 ? (
              <EmotionBarChart data={barChartData} layout="vertical" height={300} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Waiting for data...
              </div>
            )}
          </ChartContainer>

          <ChartContainer title="Emotion Percentages" description="Proportion of each emotion">
            {pieChartData.length > 0 ? (
              <EmotionPieChart data={pieChartData} height={300} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Waiting for data...
              </div>
            )}
          </ChartContainer>
        </div>

        {/* Row 4: Engagement Timeline */}
        <ChartContainer title="Engagement Timeline" description="Engagement and focus scores over time">
          {timelineData.length > 0 ? (
            <div className="h-[350px]">
              <EmotionLineChart
                data={timelineData}
                emotions={["Engagement", "Focus"]}
                height={350}
              />
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              Timeline data will appear as the lecture progresses
            </div>
          )}
        </ChartContainer>

        {/* Row 5: Percentage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Emotion Breakdown</CardTitle>
            <CardDescription>
              {liveData.totalRecords} records collected from {liveData.activeStudents} active students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(liveData.emotionPercentages).map(([emotion, pct]) => (
                <div key={emotion} className="flex items-center gap-4">
                  <Badge className={emotionBadgeColors[emotion] || ""} variant="outline" style={{ minWidth: 80 }}>
                    {emotion}
                  </Badge>
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: emotionColors[emotion] || "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{pct}%</span>
                  <span className="text-sm text-muted-foreground w-20 text-right">
                    ({liveData.emotionCounts[emotion] || 0})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Row 6: Alerts Feed */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" /> Live Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <AnimatePresence>
                  {alerts.slice(0, 10).map((alert, i) => (
                    <motion.div
                      key={`${alert.type}-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={`border-l-4 rounded-r-lg p-3 ${severityColors[alert.severity] || ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {alert.severity}
                          </Badge>
                          <span className="ml-2 text-sm font-medium">{alert.message}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{alert.type}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
