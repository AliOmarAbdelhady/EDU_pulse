const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const prisma = require("./prisma-client");
const { analyzeSingle, analyzeMulti, analyzeCombined } = require("./python-client");
const {
  addStudent,
  removeStudent,
  setLecturer,
  clearLecturer,
  setCaptureMode,
  getCaptureMode,
  getElapsedMinutes,
  updateAggregation,
  hydrateRoomFromRecords,
  buildLiveUpdate,
  getRoom,
  deleteRoom,
  setStudentCodeMap,
  setStudentNameMap,
  setLatestFaces,
  updateStudentPresence,
  markStudentsMissing,
  getStudentPresence,
} = require("./rooms");

const PORT = process.env.SOCKET_PORT || 3001;
const FRAME_INTERVAL_MS = 2000;

// Immediate DB write helpers
async function writeEmotionRecord(record) {
  try {
    await prisma.emotionRecord.create({ data: record });
  } catch (err) {
    console.error("[db] emotion write error:", err.message);
  }
}

async function upsertAttendanceRecord({ studentId, lectureId, firstSeenAt, lastSeenAt, totalAbsenceMinutes }) {
  try {
    const existing = await prisma.attendanceRecord.findFirst({ where: { studentId, lectureId } });
    if (existing) {
      await prisma.attendanceRecord.update({
        where: { attendanceId: existing.attendanceId },
        data: { lastSeenAt, totalAbsenceMinutes, status: "Present" },
      });
    } else {
      await prisma.attendanceRecord.create({
        data: { studentId, lectureId, status: "Present", firstSeenAt, lastSeenAt, totalAbsenceMinutes },
      });
    }
  } catch (err) {
    console.error("[db] attendance upsert error:", err.message);
  }
}

const ALERT_THRESHOLDS = {
  confusionPct: 30,
  boredomPct: 25,
  lowEngagement: 40,
};

function canControlLecture(socket) {
  return ["admin", "lecturer"].includes(String(socket.userRole || "").toLowerCase());
}

const app = express();
app.use(cors());
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || "http://localhost:3000", methods: ["GET", "POST"] },
});

// Rate limiting: track last frame time per socket
const lastFrameTime = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  // In production, verify JWT here. For now, trust the client-provided role/userId.
  socket.userRole = socket.handshake.auth?.role || "student";
  socket.userId = socket.handshake.auth?.userId;
  next();
});

io.on("connection", (socket) => {
  console.log(`[socket] Connected: ${socket.id} role=${socket.userRole} userId=${socket.userId}`);

  // ── Lecturer Events ──────────────────────────────────────────

  socket.on("lecturer_join", async ({ lectureId }) => {
    const roomName = `lecture_${lectureId}`;
    socket.join(roomName);
    socket.lectureId = lectureId;
    socket.join(`${roomName}_lecturer`);
    setLecturer(lectureId, socket.id);
    console.log(`[socket] Lecturer joined lecture ${lectureId}`);

    // Load student code-to-ID mapping from database
    try {
      const students = await prisma.student.findMany({
        select: { studentId: true, studentCode: true, studentName: true },
      });
      const codeMap = new Map(students.map((s) => [s.studentCode, s.studentId]));
      setStudentCodeMap(lectureId, codeMap);
      // Also load name mapping for real-time display
      const nameMap = new Map(students.map((s) => [String(s.studentId), s.studentName]));
      setStudentNameMap(lectureId, nameMap);
      console.log(`[socket] Loaded ${codeMap.size} student code mappings for lecture ${lectureId}`);
    } catch (err) {
      console.error("[socket] Failed to load student codes:", err.message);
    }

    try {
      const existingRecords = await prisma.emotionRecord.findMany({
        where: { lectureId: parseInt(lectureId) },
        orderBy: { recordedAt: "asc" },
      });
      hydrateRoomFromRecords(lectureId, existingRecords);
      console.log(`[socket] Hydrated lecture ${lectureId} with ${existingRecords.length} emotion records`);
    } catch (err) {
      console.error("[socket] Failed to hydrate live chart data:", err.message);
    }

    // Send initial state
    const update = buildLiveUpdate(lectureId);
    if (update) socket.emit("live_update", update);
  });

  socket.on("lecturer_leave", ({ lectureId }) => {
    socket.leave(`lecture_${lectureId}`);
    socket.leave(`lecture_${lectureId}_lecturer`);
    clearLecturer(lectureId);
  });

  socket.on("end_lecture", ({ lectureId }, ack) => {
    console.log(`[socket] end_lecture received for ${lectureId}`);
    if (ack) ack({ flushed: true });
  });

  socket.on("set_capture_mode", ({ lectureId, mode }) => {
    if (!canControlLecture(socket)) return;
    if (!["student", "lecturer_camera"].includes(mode)) return;
    setCaptureMode(lectureId, mode);
    console.log(`[socket] Lecture ${lectureId} capture mode: ${mode}`);

    // Notify all students in the room
    io.to(`lecture_${lectureId}`).emit("capture_mode_changed", { mode });
  });

  // ── Lecturer Camera Frame (combined: emotion + recognition + attendance) ──

  socket.on("lecturer_frame", async ({ lectureId, image }, ack) => {
    if (!canControlLecture(socket)) return;

    const now = Date.now();
    if (lastFrameTime.get(socket.id) && now - lastFrameTime.get(socket.id) < FRAME_INTERVAL_MS) {
      if (ack) ack({ status: "rate_limited" });
      return;
    }
    lastFrameTime.set(socket.id, now);

    // Acknowledge frame received immediately
    if (ack) ack({ status: "processing" });

    const timeMinute = getElapsedMinutes(lectureId);
    const room = getRoom(lectureId);
    const codeMap = room ? room.studentCodeMap : new Map();

    try {
      const result = await analyzeCombined(image, lectureId);
      const recognizedIds = [];

      // Store latest face results for real-time display
      const codeToNameMap = room ? room.studentCodeToNameMap : new Map();
      setLatestFaces(lectureId, result.faces || [], codeToNameMap);

      for (const face of result.faces || []) {
        // Resolve studentId from student_code
        let studentId = null;
        if (face.student_code && codeMap.has(face.student_code)) {
          studentId = codeMap.get(face.student_code);
          recognizedIds.push(studentId);
        }

        const record = {
          lectureId: parseInt(lectureId),
          studentId: studentId ? parseInt(studentId) : null,
          recordedAt: new Date(),
          timeMinute,
          emotion: face.emotion,
          confidence: face.emotion_confidence,
          engagementScore: face.engagement_score,
          focusScore: face.focus_score,
          isPresent: true,
          leftRoom: false,
          source: "live_camera",
          modelName: "DeepFace_Combined",
        };

        // Immediate DB write
        writeEmotionRecord(record);
        updateAggregation(lectureId, face.emotion, record);

        // Track attendance for recognized students
        if (studentId) {
          updateStudentPresence(lectureId, studentId, face.emotion);

          const presence = getStudentPresence(lectureId).get(String(studentId));
          upsertAttendanceRecord({
            studentId: parseInt(studentId),
            lectureId: parseInt(lectureId),
            firstSeenAt: new Date(presence?.firstSeenAt || now),
            lastSeenAt: new Date(now),
            totalAbsenceMinutes: 0,
          });
        }
      }

      // Mark students not seen in this frame as missing
      markStudentsMissing(lectureId, recognizedIds);

      // Check for absent students and accumulate absence time
      const presence = getStudentPresence(lectureId);
      for (const [sid, data] of presence) {
        if (data.firstSeenAt && data.consecutiveMisses >= 3) {
          const lastSeen = data.lastSeenAt || data.firstSeenAt;
          const absentMinutes = Math.floor((now - lastSeen) / 60000);
          if (absentMinutes > 0) {
            upsertAttendanceRecord({
              studentId: parseInt(sid),
              lectureId: parseInt(lectureId),
              firstSeenAt: new Date(data.firstSeenAt),
              lastSeenAt: new Date(lastSeen),
              totalAbsenceMinutes: absentMinutes,
            });
          }
        }
      }

      // Broadcast live update to lecturer
      const update = buildLiveUpdate(lectureId);
      if (update) {
        update.facesDetected = result.total_faces_detected || result.faces?.length || 0;
        update.recognizedCount = recognizedIds.length;
        io.to(`lecture_${lectureId}_lecturer`).emit("live_update", update);
      }

      checkAlerts(lectureId, io);
    } catch (err) {
      console.error("[socket] lecturer_frame error:", err.message);
      // Send error state so the client knows processing failed
      const update = buildLiveUpdate(lectureId);
      if (update) {
        update.facesDetected = 0;
        update.processingError = err.message;
        io.to(`lecture_${lectureId}_lecturer`).emit("live_update", update);
      }
    }
  });

  // ── Student Events ────────────────────────────────────────────

  socket.on("join_lecture", ({ lectureId, studentId }) => {
    const roomName = `lecture_${lectureId}`;
    socket.join(roomName);
    socket.lectureId = lectureId;
    socket.studentId = studentId;
    addStudent(lectureId, studentId, socket.id);
    console.log(`[socket] Student ${studentId} joined lecture ${lectureId}`);

    io.to(`lecture_${lectureId}_lecturer`).emit("student_status", {
      lectureId,
      studentId,
      status: "active",
    });
  });

  socket.on("leave_lecture", ({ lectureId, studentId }) => {
    socket.leave(`lecture_${lectureId}`);
    removeStudent(lectureId, studentId);

    io.to(`lecture_${lectureId}_lecturer`).emit("student_status", {
      lectureId,
      studentId,
      status: "disconnected",
    });
  });

  // ── Student Frame (single face mode) ──────────────────────────

  socket.on("frame", async ({ lectureId, studentId, image }) => {
    const now = Date.now();
    if (lastFrameTime.get(socket.id) && now - lastFrameTime.get(socket.id) < FRAME_INTERVAL_MS) return;
    lastFrameTime.set(socket.id, now);

    const timeMinute = getElapsedMinutes(lectureId);

    try {
      const result = await analyzeSingle(image, studentId, lectureId);

      const record = {
        lectureId: parseInt(lectureId),
        studentId: parseInt(studentId),
        recordedAt: new Date(),
        timeMinute,
        emotion: result.emotion || "Neutral",
        confidence: result.confidence || 0,
        engagementScore: result.engagement_score || 0,
        focusScore: result.focus_score || 0,
        isPresent: result.face_detected,
        leftRoom: false,
        source: "live_camera",
        modelName: "DeepFace_Emotion",
      };

      // Immediate DB write
      writeEmotionRecord(record);

      if (result.face_detected) {
        updateAggregation(lectureId, result.emotion, record);
        updateStudentPresence(lectureId, studentId, result.emotion);

        const presence = getStudentPresence(lectureId).get(String(studentId));
        upsertAttendanceRecord({
          studentId: parseInt(studentId),
          lectureId: parseInt(lectureId),
          firstSeenAt: new Date(presence?.firstSeenAt || now),
          lastSeenAt: new Date(now),
          totalAbsenceMinutes: 0,
        });
      }

      // Acknowledge to student
      socket.emit("emotion_result", {
        emotion: result.emotion,
        confidence: result.confidence,
        engagementScore: result.engagement_score,
        faceDetected: result.face_detected,
      });

      // Broadcast to lecturer
      const update = buildLiveUpdate(lectureId);
      if (update) {
        io.to(`lecture_${lectureId}_lecturer`).emit("live_update", update);
      }

      checkAlerts(lectureId, io);
    } catch (err) {
      console.error("[socket] frame processing error:", err.message);
    }
  });

  // ── Disconnect ────────────────────────────────────────────────

  socket.on("disconnect", () => {
    lastFrameTime.delete(socket.id);

    if (socket.studentId && socket.lectureId) {
      removeStudent(socket.lectureId, socket.studentId);
      io.to(`lecture_${socket.lectureId}_lecturer`).emit("student_status", {
        lectureId: socket.lectureId,
        studentId: socket.studentId,
        status: "disconnected",
      });
    }

    if (socket.userRole === "lecturer" && socket.lectureId) {
      clearLecturer(socket.lectureId);
    }

    console.log(`[socket] Disconnected: ${socket.id}`);
  });
});

// ── Alert Threshold Checking ─────────────────────────────────────

async function checkAlerts(lectureId, io) {
  const update = buildLiveUpdate(lectureId);
  if (!update || update.totalRecords < 5) return;

  const pct = update.emotionPercentages;
  const alerts = [];

  if ((pct.Confused || 0) > ALERT_THRESHOLDS.confusionPct) {
    alerts.push({
      type: "confusion_spike",
      title: "Confusion spike",
      severity: "warning",
      message: `Confusion detected in ${pct.Confused}% of students`,
    });
  }

  if ((pct.Bored || 0) > ALERT_THRESHOLDS.boredomPct) {
    alerts.push({
      type: "boredom_spike",
      title: "Boredom spike",
      severity: "warning",
      message: `Boredom detected in ${pct.Bored}% of students`,
    });
  }

  if (update.avgEngagement < ALERT_THRESHOLDS.lowEngagement) {
    alerts.push({
      type: "low_engagement",
      title: "Low engagement",
      severity: "critical",
      message: `Average engagement dropped to ${update.avgEngagement}%`,
    });
  }

  for (const alert of alerts) {
    try {
      await prisma.alert.create({
        data: {
          lectureId: parseInt(lectureId),
          alertType: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
        },
      });
    } catch (err) {
      console.error("[alerts] DB write error:", err.message);
    }

    io.to(`lecture_${lectureId}_lecturer`).emit("lecture_alert", {
      lectureId,
      alert,
      timestamp: new Date().toISOString(),
    });
  }
}

// ── Start Server ─────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[socket] EDU Pulse Socket.io server running on port ${PORT}`);
});
