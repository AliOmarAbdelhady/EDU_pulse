const axios = require("axios");

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

async function analyzeSingle(image, studentId, lectureId) {
  try {
    const res = await axios.post(`${PYTHON_URL}/analyze`, {
      image,
      student_id: studentId,
      lecture_id: lectureId,
    }, { timeout: 15000 });
    return res.data;
  } catch (err) {
    console.error("[python-client] analyze error:", err.message);
    return { face_detected: false, emotion: null, confidence: 0, engagement_score: 0, focus_score: 0 };
  }
}

async function analyzeMulti(image, lectureId) {
  try {
    const res = await axios.post(`${PYTHON_URL}/analyze-multi`, {
      image,
      lecture_id: lectureId,
    }, { timeout: 20000 });
    return res.data;
  } catch (err) {
    console.error("[python-client] analyze-multi error:", err.message);
    return { faces: [], total_faces: 0 };
  }
}

async function analyzeCombined(image, lectureId) {
  try {
    const res = await axios.post(`${PYTHON_URL}/analyze-combined`, {
      image,
      lecture_id: lectureId,
    }, { timeout: 25000 });
    return res.data;
  } catch (err) {
    console.error("[python-client] analyze-combined error:", err.message);
    return { faces: [], total_faces_detected: 0, recognized_count: 0 };
  }
}

module.exports = { analyzeSingle, analyzeMulti, analyzeCombined };
