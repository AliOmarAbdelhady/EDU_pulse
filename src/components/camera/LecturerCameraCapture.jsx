"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import CameraStatus from "./CameraStatus";

const CAPTURE_INTERVAL_MS = 2000;
const JPEG_QUALITY = 0.5;
const CAPTURE_WIDTH = 480;
const CAPTURE_HEIGHT = 360;

export default function LecturerCameraCapture({ lectureId, onFrame, autoStart = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const hasAutoStartedRef = useRef(false);

  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [detectedFaces, setDetectedFaces] = useState(0);
  const [framesSent, setFramesSent] = useState(0);

  const startCamera = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      let stream;
      try {
        // Try environment (rear) camera first, then fall back to user (front) camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT },
          audio: false,
        });
      }
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsActive(true);
      setIsConnecting(false);
    } catch (err) {
      setIsConnecting(false);
      if (err.name === "NotAllowedError") {
        setError("Camera access denied");
      } else if (err.name === "NotFoundError") {
        setError("No camera found");
      } else {
        setError("Camera error: " + err.message);
      }
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
    setIsActive(false);
    setDetectedFaces(0);
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isActive) return;

    const ctx = canvas.getContext("2d");
    canvas.width = CAPTURE_WIDTH;
    canvas.height = CAPTURE_HEIGHT;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const base64 = dataUrl.split(",")[1];

    if (onFrame) {
      onFrame(base64);
    }

    setFramesSent((prev) => prev + 1);
  }, [isActive, onFrame]);

  useEffect(() => {
    if (isActive && !intervalRef.current) {
      intervalRef.current = setInterval(captureFrame, CAPTURE_INTERVAL_MS);
      captureFrame();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, captureFrame]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (!autoStart || hasAutoStartedRef.current || isActive || isConnecting) return;

    hasAutoStartedRef.current = true;
    startCamera();
  }, [autoStart, isActive, isConnecting, startCamera]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {isActive && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-medium">CLASSROOM CAM</span>
            </div>
          </div>
        )}

        {isActive && detectedFaces > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 rounded-lg px-3 py-1.5">
            <span className="text-white text-xs font-medium">{detectedFaces} faces detected</span>
          </div>
        )}

        {!isActive && !isConnecting && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Classroom camera is off</p>
              <p className="text-xs text-muted-foreground">Start the camera to detect student faces</p>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-center justify-between">
        <CameraStatus isActive={isActive} isConnecting={isConnecting} error={error} />
        <div className="flex items-center gap-2">
          {framesSent > 0 && (
            <span className="text-xs text-muted-foreground">
              {framesSent} frames sent
            </span>
          )}
          {!isActive ? (
            <button
              onClick={startCamera}
              disabled={isConnecting}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isConnecting ? "Starting..." : "Start Camera"}
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90"
            >
              Stop Camera
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
