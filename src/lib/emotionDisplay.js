export const EMOTION_COLORS = {
  Happy: "#16a34a",
  Neutral: "#64748b",
  Confused: "#f97316",
  Bored: "#ef4444",
  Sad: "#3b82f6",
  Angry: "#dc2626",
  Surprised: "#eab308",
  Fearful: "#8b5cf6",
  Disgusted: "#84cc16",
  Engagement: "#0ea5e9",
  Focus: "#8b5cf6",
  Confidence: "#14b8a6",
  Unknown: "#6b7280",
};

export const DEFAULT_EMOTION_ORDER = ["Happy", "Neutral", "Confused", "Bored"];

const EMOTION_ALIASES = {
  HAPPY: "Happy",
  HAPPINESS: "Happy",
  NEUTRAL: "Neutral",
  CONFUSED: "Confused",
  CONFUSION: "Confused",
  SURPRISE: "Confused",
  SURPRISED: "Confused",
  ANGRY: "Confused",
  ANGER: "Confused",
  BORED: "Bored",
  BOREDOM: "Bored",
  SAD: "Bored",
  SADNESS: "Bored",
  DISGUST: "Bored",
  DISGUSTED: "Bored",
  FEAR: "Bored",
  FEARFUL: "Bored",
  ENGAGED: "Engagement",
  ENGAGEMENT: "Engagement",
  AVG_ENGAGEMENT: "Engagement",
  FOCUS: "Focus",
  AVG_FOCUS: "Focus",
  CONFIDENCE: "Confidence",
};

export function normalizeEmotionKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Unknown";

  const key = raw.replace(/\s+/g, "_").toUpperCase();
  if (EMOTION_ALIASES[key]) return EMOTION_ALIASES[key];

  return raw
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function getEmotionLabel(value) {
  return normalizeEmotionKey(value);
}

export function getEmotionColor(value) {
  const key = normalizeEmotionKey(value);
  return EMOTION_COLORS[key] || EMOTION_COLORS.Unknown;
}
