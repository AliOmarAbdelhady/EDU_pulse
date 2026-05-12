"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "./useSocket";

const INITIAL_DATA = {
  activeStudents: 0,
  totalRecords: 0,
  emotionCounts: { Happy: 0, Neutral: 0, Confused: 0, Bored: 0 },
  emotionPercentages: { Happy: 0, Neutral: 0, Confused: 0, Bored: 0 },
  avgEngagement: 0,
  avgFocus: 0,
  engagementTimeline: [],
  recentRecords: [],
  alerts: [],
  captureMode: "student",
  elapsedMinutes: 0,
  facesDetected: 0,
  recognizedCount: 0,
  processingError: null,
  latestFaces: [],
};

export function useLiveLecture(lectureId) {
  const {
    isConnected,
    lecturerJoin,
    lecturerLeave,
    on,
    sendLecturerFrame,
    setCaptureMode,
    endLectureSocket,
  } = useSocket();
  const [liveData, setLiveData] = useState(INITIAL_DATA);
  const [alerts, setAlerts] = useState([]);
  const [frameStatus, setFrameStatus] = useState("idle"); // idle | sending | processing | done | error
  const cleanupRef = useRef([]);

  useEffect(() => {
    if (!isConnected || !lectureId) return;

    lecturerJoin(lectureId);

    const cleanups = [
      on("live_update", (data) => {
        setLiveData((prev) => ({
          ...prev,
          ...data,
          alerts: prev.alerts,
        }));
        setFrameStatus(data.processingError ? "error" : "done");
      }),
      on("lecture_alert", ({ alert }) => {
        setAlerts((prev) => [alert, ...prev].slice(0, 50));
      }),
      on("capture_mode_changed", ({ mode }) => {
        setLiveData((prev) => ({ ...prev, captureMode: mode }));
      }),
    ];

    cleanupRef.current = cleanups;

    return () => {
      cleanupRef.current.forEach((fn) => fn());
      lecturerLeave(lectureId);
    };
  }, [isConnected, lectureId, lecturerJoin, lecturerLeave, on]);

  const changeCaptureMode = useCallback(
    (mode) => {
      setLiveData((prev) => ({ ...prev, captureMode: mode }));
      setCaptureMode(lectureId, mode);
    },
    [lectureId, setCaptureMode]
  );

  const sendFrame = useCallback(
    async (image) => {
      setFrameStatus("sending");
      const ack = await sendLecturerFrame(lectureId, image);
      if (ack?.status === "processing") {
        setFrameStatus("processing");
      } else if (ack?.status === "rate_limited") {
        setFrameStatus("done");
      } else if (ack?.status === "timeout") {
        setFrameStatus("error");
      }
    },
    [lectureId, sendLecturerFrame]
  );

  const endLecture = useCallback(async () => {
    await endLectureSocket(lectureId);
    lecturerLeave(lectureId);
  }, [lectureId, endLectureSocket, lecturerLeave]);

  return {
    liveData,
    alerts,
    isConnected,
    frameStatus,
    changeCaptureMode,
    sendFrame,
    endLecture,
  };
}
