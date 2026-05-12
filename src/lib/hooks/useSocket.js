"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export function useSocket() {
  const { data: session } = useSession();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    const socket = io(SOCKET_URL, {
      auth: {
        token: session.user.accessToken || "demo",
        role: session.user.role,
        userId: session.user.id,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.user]);

  const joinLecture = useCallback((lectureId, studentId) => {
    socketRef.current?.emit("join_lecture", { lectureId, studentId });
  }, []);

  const leaveLecture = useCallback((lectureId, studentId) => {
    socketRef.current?.emit("leave_lecture", { lectureId, studentId });
  }, []);

  const lecturerJoin = useCallback((lectureId) => {
    socketRef.current?.emit("lecturer_join", { lectureId });
  }, []);

  const lecturerLeave = useCallback((lectureId) => {
    socketRef.current?.emit("lecturer_leave", { lectureId });
  }, []);

  const sendFrame = useCallback((lectureId, studentId, image, timeMinute) => {
    socketRef.current?.emit("frame", { lectureId, studentId, image, timeMinute });
  }, []);

  const sendLecturerFrame = useCallback((lectureId, image) => {
    return new Promise((resolve) => {
      socketRef.current?.emit("lecturer_frame", { lectureId, image }, (ack) => {
        resolve(ack);
      });
      // Resolve immediately if no ack within 5s
      setTimeout(() => resolve({ status: "timeout" }), 5000);
    });
  }, []);

  const setCaptureMode = useCallback((lectureId, mode) => {
    socketRef.current?.emit("set_capture_mode", { lectureId, mode });
  }, []);

  const endLectureSocket = useCallback((lectureId) => {
    return new Promise((resolve) => {
      socketRef.current?.emit("end_lecture", { lectureId }, (ack) => {
        resolve(ack);
      });
      setTimeout(() => resolve({ flushed: false }), 5000);
    });
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  return {
    isConnected,
    joinLecture,
    leaveLecture,
    lecturerJoin,
    lecturerLeave,
    sendFrame,
    sendLecturerFrame,
    setCaptureMode,
    endLectureSocket,
    on,
  };
}
