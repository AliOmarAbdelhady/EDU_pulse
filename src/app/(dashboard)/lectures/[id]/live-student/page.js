"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/lib/hooks/useSocket";
import { useLecture } from "@/lib/hooks/useLectures";
import { useProfile } from "@/lib/hooks/useProfile";
import LiveCameraCapture from "@/components/camera/LiveCameraCapture";
import { ArrowLeft, Radio, Clock, LogOut } from "lucide-react";

const emotionColors = {
  Happy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Neutral: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  Confused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Bored: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function StudentLiveSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: profile } = useProfile();
  const studentId = profile?.student?.id;
  const { data: lecture, isLoading } = useLecture(id);
  const { isConnected, joinLecture, leaveLecture, sendFrame, on } = useSocket();

  const [emotionHistory, setEmotionHistory] = useState([]);
  const [captureMode, setCaptureMode] = useState("student");
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Join lecture room
  useEffect(() => {
    if (!isConnected || !id || !studentId) return;
    joinLecture(id, studentId);

    return () => {
      leaveLecture(id, studentId);
    };
  }, [isConnected, id, studentId, joinLecture, leaveLecture]);

  // Listen for emotion results
  useEffect(() => {
    if (!isConnected) return;
    const cleanup = on("emotion_result", (data) => {
      if (data.emotion) {
        setEmotionHistory((prev) => [data, ...prev].slice(0, 10));
      }
    });
    return cleanup;
  }, [isConnected, on]);

  // Listen for capture mode changes
  useEffect(() => {
    if (!isConnected) return;
    const cleanup = on("capture_mode_changed", ({ mode }) => {
      setCaptureMode(mode);
    });
    return cleanup;
  }, [isConnected, on]);

  // Elapsed time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMinutes((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleFrame = useCallback(
    (base64Image, timeMinute) => {
      if (!studentId) return;
      sendFrame(id, studentId, base64Image, timeMinute);
    },
    [id, studentId, sendFrame]
  );

  const handleLeave = () => {
    if (studentId) leaveLecture(id, studentId);
    router.push("/lectures");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleLeave}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{lecture?.lectureName || "Live Lecture"}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-yellow-100 text-yellow-800 animate-pulse">
                  <Radio className="h-3 w-3 mr-1" /> IN PROGRESS
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {elapsedMinutes} min
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleLeave}>
            <LogOut className="h-4 w-4 mr-2" /> Leave Session
          </Button>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-muted-foreground">
            {isConnected ? "Connected to live session" : "Connecting..."}
          </span>
        </div>

        {/* Camera or Mode Message */}
        {captureMode === "lecturer_camera" ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                The lecturer is using their camera to detect classroom emotions.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                No camera needed from your device. Stay engaged!
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Camera</CardTitle>
            </CardHeader>
            <CardContent>
              <LiveCameraCapture
                lectureId={id}
                studentId={studentId}
                onFrame={handleFrame}
                autoStart={captureMode === "student"}
              />
            </CardContent>
          </Card>
        )}

        {/* Emotion History */}
        {emotionHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Recent Emotions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {emotionHistory.map((entry, i) => (
                  <Badge key={i} className={emotionColors[entry.emotion] || ""} variant="outline">
                    {entry.emotion} ({Math.round(entry.confidence * 100)}%)
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
