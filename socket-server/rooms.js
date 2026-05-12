// In-memory room state per lecture
const rooms = {};

function getRoom(lectureId) {
  const key = String(lectureId);
  if (!rooms[key]) {
    rooms[key] = {
      lectureId: key,
      captureMode: "student", // "student" or "lecturer_camera"
      lecturerSocketId: null,
      students: new Map(), // studentId -> { socketId, lastSeen }
      emotionCounts: { Happy: 0, Neutral: 0, Confused: 0, Bored: 0 },
      totalRecords: 0,
      engagementTimeline: [],
      recentRecords: [],
      lectureStartTime: null,
      studentCodeMap: new Map(), // studentCode -> studentId
      studentNameMap: new Map(), // studentId -> studentName
      studentCodeToNameMap: new Map(), // studentCode -> studentName
      studentPresence: new Map(), // studentId -> { firstSeenAt, lastSeenAt, consecutiveMisses, lastEmotion }
      latestFaces: [], // latest frame's face results for real-time display
    };
  }
  return rooms[key];
}

function deleteRoom(lectureId) {
  delete rooms[String(lectureId)];
}

function addStudent(lectureId, studentId, socketId) {
  const room = getRoom(lectureId);
  room.students.set(String(studentId), { socketId, lastSeen: Date.now() });
  return room;
}

function removeStudent(lectureId, studentId) {
  const room = rooms[String(lectureId)];
  if (room) {
    room.students.delete(String(studentId));
  }
}

function getActiveStudentCount(lectureId) {
  const room = rooms[String(lectureId)];
  return room ? room.students.size : 0;
}

function setLecturer(lectureId, socketId) {
  const room = getRoom(lectureId);
  room.lecturerSocketId = socketId;
  room.lectureStartTime = room.lectureStartTime || Date.now();
  return room;
}

function clearLecturer(lectureId) {
  const room = rooms[String(lectureId)];
  if (room) {
    room.lecturerSocketId = null;
  }
}

function setCaptureMode(lectureId, mode) {
  const room = getRoom(lectureId);
  room.captureMode = mode;
}

function getCaptureMode(lectureId) {
  const room = rooms[String(lectureId)];
  return room ? room.captureMode : "student";
}

function getElapsedMinutes(lectureId) {
  const room = rooms[String(lectureId)];
  if (!room || !room.lectureStartTime) return 0;
  return Math.floor((Date.now() - room.lectureStartTime) / 60000);
}

function setStudentCodeMap(lectureId, codeMap) {
  const room = getRoom(lectureId);
  room.studentCodeMap = codeMap;
  // Also initialize presence tracking for all known students
  for (const [, studentId] of codeMap) {
    if (!room.studentPresence.has(String(studentId))) {
      room.studentPresence.set(String(studentId), {
        firstSeenAt: null,
        lastSeenAt: null,
        consecutiveMisses: 0,
        lastEmotion: null,
      });
    }
  }
}

function setStudentNameMap(lectureId, nameMap) {
  const room = getRoom(lectureId);
  room.studentNameMap = nameMap;
  // Build reverse map: studentCode -> studentName
  room.studentCodeToNameMap = new Map();
  for (const [studentId, name] of nameMap) {
    // Find the code for this studentId
    for (const [code, sId] of room.studentCodeMap) {
      if (String(sId) === String(studentId)) {
        room.studentCodeToNameMap.set(code, name);
        break;
      }
    }
  }
}

function setLatestFaces(lectureId, faces, codeToNameMap) {
  const room = getRoom(lectureId);
  room.latestFaces = faces.map((f) => ({
    studentCode: f.student_code || null,
    studentName: f.student_code ? (codeToNameMap.get(f.student_code) || `Student ${f.student_code}`) : "Unknown",
    emotion: f.emotion || "Neutral",
    emotionConfidence: f.emotion_confidence || 0,
    engagementScore: f.engagement_score || 0,
    focusScore: f.focus_score || 0,
    recognitionConfidence: f.recognition_confidence || 0,
    faceBox: f.face_box || [0, 0, 0, 0],
  }));
}

function updateStudentPresence(lectureId, studentId, emotion) {
  const room = getRoom(lectureId);
  if (!room) return;
  const now = Date.now();
  const prev = room.studentPresence.get(String(studentId));
  room.studentPresence.set(String(studentId), {
    firstSeenAt: prev?.firstSeenAt || now,
    lastSeenAt: now,
    consecutiveMisses: 0,
    lastEmotion: emotion,
  });
}

function markStudentsMissing(lectureId, recognizedIds) {
  const room = rooms[String(lectureId)];
  if (!room) return;
  const recognized = new Set(recognizedIds.map(String));
  for (const [studentId, data] of room.studentPresence) {
    if (data.firstSeenAt && !recognized.has(studentId)) {
      data.consecutiveMisses = (data.consecutiveMisses || 0) + 1;
    }
  }
}

function getStudentPresence(lectureId) {
  const room = rooms[String(lectureId)];
  if (!room) return new Map();
  return room.studentPresence;
}

function updateAggregation(lectureId, emotion, record) {
  const room = getRoom(lectureId);
  if (!room) return;

  room.emotionCounts[emotion] = (room.emotionCounts[emotion] || 0) + 1;
  room.totalRecords += 1;

  room.recentRecords.unshift(record);
  if (room.recentRecords.length > 50) {
    room.recentRecords.pop();
  }

  // Update engagement timeline (per-minute bucket, capped at 60 minutes)
  const minute = record.timeMinute;
  let bucket = room.engagementTimeline.find((b) => b.minute === minute);
  if (!bucket) {
    bucket = { minute, totalEngagement: 0, totalFocus: 0, count: 0 };
    room.engagementTimeline.push(bucket);
    if (room.engagementTimeline.length > 60) {
      room.engagementTimeline = room.engagementTimeline.slice(-60);
    }
  }
  bucket.totalEngagement += record.engagementScore || 0;
  bucket.totalFocus += record.focusScore || 0;
  bucket.count += 1;
}

function hydrateRoomFromRecords(lectureId, records = []) {
  const room = getRoom(lectureId);
  room.emotionCounts = { Happy: 0, Neutral: 0, Confused: 0, Bored: 0 };
  room.totalRecords = 0;
  room.engagementTimeline = [];
  room.recentRecords = [];

  for (const record of records) {
    updateAggregation(lectureId, record.emotion, record);

    if (record.studentId && record.isPresent !== false) {
      const previous = room.studentPresence.get(String(record.studentId));
      const recordedAt = record.recordedAt
        ? new Date(record.recordedAt).getTime()
        : Date.now();

      room.studentPresence.set(String(record.studentId), {
        firstSeenAt: previous?.firstSeenAt || recordedAt,
        lastSeenAt: recordedAt,
        consecutiveMisses: previous?.consecutiveMisses || 0,
        lastEmotion: record.emotion,
      });
    }
  }
}

function buildLiveUpdate(lectureId) {
  const room = rooms[String(lectureId)];
  if (!room) return null;

  const total = room.totalRecords || 1;
  const emotionPercentages = {};
  for (const [emotion, count] of Object.entries(room.emotionCounts)) {
    emotionPercentages[emotion] = Math.round((count / total) * 1000) / 10;
  }

  const timeline = room.engagementTimeline.map((b) => ({
    minute: b.minute,
    avgEngagement: Math.round(b.totalEngagement / b.count),
    avgFocus: Math.round(b.totalFocus / b.count),
    recordCount: b.count,
  }));

  const allEngagement = room.recentRecords
    .map((r) => r.engagementScore || 0)
    .filter((s) => s > 0);
  const allFocus = room.recentRecords
    .map((r) => r.focusScore || 0)
    .filter((s) => s > 0);

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  // Build per-student breakdown from presence data
  const studentBreakdown = [];
  for (const [studentId, data] of room.studentPresence) {
    if (data.firstSeenAt) {
      studentBreakdown.push({
        studentId,
        lastEmotion: data.lastEmotion,
        lastSeenAt: data.lastSeenAt,
        consecutiveMisses: data.consecutiveMisses || 0,
      });
    }
  }

  const recognizedStudents = [...room.studentPresence.values()].filter((d) => d.firstSeenAt).length;
  const activeStudents = room.captureMode === "lecturer_camera"
    ? recognizedStudents
    : room.students.size;

  return {
    lectureId: room.lectureId,
    captureMode: room.captureMode,
    activeStudents,
    totalRecords: room.totalRecords,
    emotionCounts: { ...room.emotionCounts },
    emotionPercentages,
    avgEngagement: Math.round(avg(allEngagement)),
    avgFocus: Math.round(avg(allFocus)),
    engagementTimeline: timeline,
    recentRecords: room.recentRecords.slice(0, 20),
    elapsedMinutes: getElapsedMinutes(lectureId),
    studentBreakdown,
    latestFaces: room.latestFaces || [],
  };
}

module.exports = {
  getRoom,
  deleteRoom,
  addStudent,
  removeStudent,
  getActiveStudentCount,
  setLecturer,
  clearLecturer,
  setCaptureMode,
  getCaptureMode,
  getElapsedMinutes,
  updateAggregation,
  hydrateRoomFromRecords,
  buildLiveUpdate,
  setStudentCodeMap,
  setStudentNameMap,
  setLatestFaces,
  updateStudentPresence,
  markStudentsMissing,
  getStudentPresence,
};
