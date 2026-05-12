export const EMOTION_COLORS = {
  HAPPY: { bg: "#22c55e", text: "#15803d", label: "Happy" },
  SAD: { bg: "#3b82f6", text: "#1d4ed8", label: "Sad" },
  ANGRY: { bg: "#ef4444", text: "#dc2626", label: "Angry" },
  SURPRISED: { bg: "#f59e0b", text: "#d97706", label: "Surprised" },
  FEARFUL: { bg: "#8b5cf6", text: "#7c3aed", label: "Fearful" },
  DISGUSTED: { bg: "#84cc16", text: "#65a30d", label: "Disgusted" },
  NEUTRAL: { bg: "#6b7280", text: "#4b5563", label: "Neutral" },
  CONFUSED: { bg: "#f97316", text: "#ea580c", label: "Confused" },
  BORED: { bg: "#9ca3af", text: "#6b7280", label: "Bored" },
  ENGAGED: { bg: "#06b6d4", text: "#0891b2", label: "Engaged" },
};

export const EMOTION_TYPES = Object.keys(EMOTION_COLORS);

export const ROLES = {
  STUDENT: { label: "Student", color: "bg-primary" },
  LECTURER: { label: "Lecturer", color: "bg-emerald-500" },
  ADMIN: { label: "Admin", color: "bg-purple-500" },
};

export const ENGAGEMENT_CATEGORIES = {
  HIGH: { label: "High", color: "#22c55e", range: "70-100" },
  MEDIUM: { label: "Medium", color: "#f59e0b", range: "40-69" },
  LOW: { label: "Low", color: "#ef4444", range: "0-39" },
};

export const APP_NAME = "EDU Pulse";
export const APP_DESCRIPTION =
  "Intelligent system for analyzing student emotions during lectures using AI and statistical analysis.";
