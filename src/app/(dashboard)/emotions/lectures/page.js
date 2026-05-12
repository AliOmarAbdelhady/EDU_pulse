"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import { useEmotionLectureBreakdown } from "@/lib/hooks/useEmotions";

const ChartContainer = dynamic(
  () => import("@/components/charts/ChartContainer"),
  { ssr: false, loading: () => <div className="h-[200px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);

const EMOTION_COLORS = {
  Happy: "#22c55e",
  Neutral: "#6b7280",
  Confused: "#f97316",
  Bored: "#9ca3af",
};

const EMOTION_LABELS = {
  Happy: "Happy",
  Neutral: "Neutral",
  Confused: "Confused",
  Bored: "Bored",
};

const EMOTION_KEYS = Object.keys(EMOTION_COLORS);

// Custom tooltip for stacked bar
const StackedTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md max-w-xs">
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom tooltip for radar
const RadarTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{data.emotion}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {data.count} detections ({data.value}%)
      </p>
    </div>
  );
};

const renderLegend = (props) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function EmotionLecturesPage() {
  const {
    data: lectureBreakdownData,
    isLoading,
    error,
    refetch,
  } = useEmotionLectureBreakdown({});

  const lectures = useMemo(() => {
    if (!lectureBreakdownData || !Array.isArray(lectureBreakdownData)) return [];
    return lectureBreakdownData;
  }, [lectureBreakdownData]);

  const [selectedLectureId, setSelectedLectureId] = useState(null);

  // Derive the selected lecture object
  const selectedLecture = useMemo(() => {
    if (!selectedLectureId && lectures.length > 0) return lectures[0];
    return lectures.find((l) =>
      String(l.lectureId || l.id) === String(selectedLectureId)
    ) || lectures[0] || null;
  }, [lectures, selectedLectureId]);

  // Build emotion map for the selected lecture from frequency data
  const selectedLectureEmotions = useMemo(() => {
    return selectedLecture?.emotions || {};
  }, [selectedLecture]);

  // Build stacked bar data across all lectures from database aggregation.
  const stackedBarData = useMemo(() => {
    if (lectures.length === 0) return [];
    return lectures.map((lec) => ({
      name: lec.courseCode || lec.lectureCode || lec.lectureName || "N/A",
      Happy: 0,
      Neutral: 0,
      Confused: 0,
      Bored: 0,
      ...(lec.emotions || {}),
    }));
  }, [lectures]);

  // Radar data for the selected lecture
  const radarData = useMemo(() => {
    const entries = Object.entries(selectedLectureEmotions);
    if (entries.length === 0) return [];
    const total = entries.reduce((sum, [, count]) => sum + (count || 0), 0);
    return entries.map(([emotion, count]) => ({
      emotion: EMOTION_LABELS[emotion] || emotion,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      count,
    }));
  }, [selectedLectureEmotions]);

  const getLectureName = (lec) => lec.lectureName || lec.name || "Unknown";
  const getLectureCode = (lec) =>
    lec.courseCode || lec.lectureCode || lec.code || "N/A";
  const getLectureId = (lec) => lec.lectureId || lec.id;

  const getTopEmotion = (emotionMap) => {
    const entries = Object.entries(emotionMap);
    if (entries.length === 0) return ["Neutral", 0];
    return entries.reduce((prev, curr) => (curr[1] > prev[1] ? curr : prev));
  };

  if (error && lectures.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Lecture Comparison
        </h1>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">
            {error?.message || "Failed to load lecture data"}
          </p>
          <Button
            variant="outline"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Lecture Comparison
        </h1>
        <p className="text-muted-foreground mt-1">
          Compare emotion distributions across different lectures and courses.
        </p>
      </motion.div>

      {/* Lecture Selector Cards */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4"><Skeleton className="h-20 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {lectures.map((lec) => {
              const lecId = getLectureId(lec);
              const isSelected = selectedLecture && getLectureId(selectedLecture) === lecId;
              const topEmotion = getTopEmotion(lec.emotions || {});

              return (
                <motion.div
                  key={lecId}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "ring-2 ring-primary"
                        : "hover:ring-1 hover:ring-border"
                    }`}
                    onClick={() => setSelectedLectureId(lecId)}
                  >
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground font-medium">
                        {getLectureCode(lec)}
                      </p>
                      <p className="text-sm font-medium mt-0.5 truncate">
                        {getLectureName(lec)}
                      </p>
                      {isSelected && topEmotion[1] > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: EMOTION_COLORS[topEmotion[0]] || "#6b7280",
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            Top: {EMOTION_LABELS[topEmotion[0]] || topEmotion[0]}
                          </span>
                        </div>
                      )}
                      {lec.lectureDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(lec.lectureDate).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Stacked Bar Chart - All Lectures */}
      {isLoading ? (
        <Card><CardContent className="pt-4"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
      ) : (
        <ChartContainer
          title="Emotion Distribution by Lecture"
          description="Stacked comparison of emotions across all lectures"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={stackedBarData}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<StackedTooltip />} />
              <Legend content={renderLegend} />
              {EMOTION_KEYS.map((emotion) => (
                <Bar
                  key={emotion}
                  dataKey={emotion}
                  name={EMOTION_LABELS[emotion]}
                  stackId="a"
                  fill={EMOTION_COLORS[emotion]}
                  radius={
                    emotion === EMOTION_KEYS[EMOTION_KEYS.length - 1]
                      ? [4, 4, 0, 0]
                      : [0, 0, 0, 0]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Radar Chart + Details for Selected Lecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        {isLoading ? (
          <Card><CardContent className="pt-4"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
        ) : (
          <ChartContainer
            title={`${selectedLecture ? getLectureName(selectedLecture) : "Lecture"} - Emotion Profile`}
            description="Radar view of emotion proportions for the selected lecture"
          >
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="70%"
                data={radarData}
              >
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="emotion"
                  tick={{ fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, "auto"]}
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name={selectedLecture ? getLectureName(selectedLecture) : "Lecture"}
                  dataKey="value"
                  stroke={EMOTION_COLORS.Happy}
                  fill={EMOTION_COLORS.Happy}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip content={<RadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

        {/* Lecture Detail */}
        {isLoading ? (
          <Card><CardContent className="pt-4"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
        ) : (
          <ChartContainer
            title={`${selectedLecture ? getLectureCode(selectedLecture) : ""} - ${selectedLecture ? getLectureName(selectedLecture) : "Lecture"}`}
            description="Detailed emotion breakdown for the selected lecture"
          >
            <div className="space-y-3">
              {selectedLecture && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  {selectedLecture.lectureDate && (
                    <span>{new Date(selectedLecture.lectureDate).toLocaleDateString()}</span>
                  )}
                </div>
              )}

              {Object.entries(selectedLectureEmotions)
                .sort((a, b) => b[1] - a[1])
                .map(([emotion, count], index) => {
                  const total = Object.values(selectedLectureEmotions).reduce(
                    (sum, v) => sum + v,
                    0
                  );
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                  return (
                    <motion.div
                      key={emotion}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: EMOTION_COLORS[emotion] || "#6b7280",
                        }}
                      />
                      <span className="text-sm w-24 shrink-0">
                        {EMOTION_LABELS[emotion] || emotion}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <motion.div
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: EMOTION_COLORS[emotion] || "#6b7280",
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">
                        {percentage}%
                      </span>
                      <span className="text-xs text-muted-foreground w-14 text-right">
                        ({count})
                      </span>
                    </motion.div>
                  );
                })}

              {Object.keys(selectedLectureEmotions).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a lecture to view its emotion breakdown.
                </p>
              )}
            </div>
          </ChartContainer>
        )}
      </div>
    </motion.div>
  );
}
