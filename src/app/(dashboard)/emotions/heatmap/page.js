"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import { useEmotions } from "@/lib/hooks/useEmotions";

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

const EMOTIONS = Object.keys(EMOTION_COLORS);

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_INDEX = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun" };
const HOURS = [
  "8AM", "9AM", "10AM", "11AM", "12PM",
  "1PM", "2PM", "3PM", "4PM", "5PM",
];
const HOUR_MAP = {
  "8AM": 8, "9AM": 9, "10AM": 10, "11AM": 11, "12PM": 12,
  "1PM": 13, "2PM": 14, "3PM": 15, "4PM": 16, "5PM": 17,
};

// Generate intensity color from value (0-100)
const getIntensityColor = (value, baseColor) => {
  const opacity = Math.max(0.1, value / 100);
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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

export default function EmotionHeatmapPage() {
  const [selectedEmotion, setSelectedEmotion] = useState("Happy");
  const [hoveredCell, setHoveredCell] = useState(null);

  const {
    data: emotionsData,
    isLoading,
    error,
    refetch,
  } = useEmotions({});

  const heatmapData = useMemo(() => {
    const data = {};
    DAYS.forEach((day) => {
      data[day] = {};
      HOURS.forEach((hour) => {
        data[day][hour] = 0;
      });
    });

    if (!emotionsData || !Array.isArray(emotionsData)) return data;

    emotionsData.forEach((record) => {
      if (record.emotion !== selectedEmotion) return;
      if (!record.recordedAt) return;

      const date = new Date(record.recordedAt);
      const dayName = DAY_INDEX[date.getDay()];
      const hour = date.getHours();

      // Map the hour to the nearest heatmap hour slot
      let hourLabel = null;
      for (const [label, mappedHour] of Object.entries(HOUR_MAP)) {
        if (hour === mappedHour) {
          hourLabel = label;
          break;
        }
      }
      if (!hourLabel || !dayName) return;

      data[dayName][hourLabel] = (data[dayName][hourLabel] || 0) + 1;
    });

    // Normalize to 0-100 scale
    let maxCount = 0;
    DAYS.forEach((day) => {
      HOURS.forEach((hour) => {
        if (data[day][hour] > maxCount) maxCount = data[day][hour];
      });
    });

    if (maxCount > 0) {
      DAYS.forEach((day) => {
        HOURS.forEach((hour) => {
          data[day][hour] = Math.round((data[day][hour] / maxCount) * 100);
        });
      });
    }

    return data;
  }, [emotionsData, selectedEmotion]);

  const allValues = DAYS.flatMap((day) =>
    HOURS.map((hour) => heatmapData[day]?.[hour] || 0)
  );
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 0;
  const avgVal = allValues.length > 0
    ? Math.round(allValues.reduce((sum, v) => sum + v, 0) / allValues.length)
    : 0;

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Emotion Heatmap
        </h1>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">
            {error.message || "Failed to load emotion data"}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
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
          Emotion Heatmap
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize emotion intensity patterns across different times and days.
        </p>
      </motion.div>

      {/* Emotion Selector */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map((emotion) => {
            const isActive = selectedEmotion === emotion;
            return (
              <button
                key={emotion}
                onClick={() => setSelectedEmotion(emotion)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all border ${
                  isActive
                    ? "border-transparent text-white shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
                style={
                  isActive
                    ? { backgroundColor: EMOTION_COLORS[emotion] }
                    : {}
                }
              >
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    isActive ? "bg-white" : ""
                  }`}
                  style={
                    !isActive
                      ? { backgroundColor: EMOTION_COLORS[emotion] }
                      : {}
                  }
                />
                {emotion}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {isLoading ? (
          <>
            <Card><CardContent className="pt-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            <Card><CardContent className="pt-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            <Card><CardContent className="pt-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Peak Intensity</p>
                <p className="text-2xl font-bold mt-1">{maxVal}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Average Intensity</p>
                <p className="text-2xl font-bold mt-1">{avgVal}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Active Emotion</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: EMOTION_COLORS[selectedEmotion] }}
                  />
                  <span className="text-2xl font-bold">{selectedEmotion}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>

      {/* Heatmap */}
      {isLoading ? (
        <Card><CardContent className="pt-4"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
      ) : (
        <ChartContainer
          title={`${selectedEmotion} Intensity Heatmap`}
          description="Hover over cells to see exact values. Darker cells indicate higher intensity."
        >
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header row */}
              <div className="flex items-center mb-2">
                <div className="w-14 shrink-0" />
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="flex-1 text-center text-xs font-medium text-muted-foreground"
                  >
                    {hour}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center mb-1.5">
                  <div className="w-14 shrink-0 text-xs font-medium text-muted-foreground pr-2 text-right">
                    {day}
                  </div>
                  <div className="flex flex-1 gap-1.5">
                    {HOURS.map((hour) => {
                      const value = heatmapData[day]?.[hour] || 0;
                      const isHovered =
                        hoveredCell?.day === day && hoveredCell?.hour === hour;

                      return (
                        <motion.div
                          key={`${day}-${hour}`}
                          className="flex-1 aspect-square rounded-md cursor-pointer relative"
                          style={{
                            backgroundColor: getIntensityColor(
                              value,
                              EMOTION_COLORS[selectedEmotion]
                            ),
                            minWidth: 0,
                          }}
                          whileHover={{ scale: 1.1 }}
                          onMouseEnter={() =>
                            setHoveredCell({ day, hour, value })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: dayIndex * 0.05 + HOURS.indexOf(hour) * 0.02,
                            duration: 0.2,
                          }}
                        >
                          {isHovered && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-foreground text-background text-xs font-medium whitespace-nowrap z-10 shadow-lg">
                              {day} {hour}: {value}%
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-xs text-muted-foreground">Low</span>
                <div className="flex gap-0.5">
                  {[0, 20, 40, 60, 80, 100].map((val) => (
                    <div
                      key={val}
                      className="h-4 w-8 rounded-sm"
                      style={{
                        backgroundColor: getIntensityColor(
                          val,
                          EMOTION_COLORS[selectedEmotion]
                        ),
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">High</span>
              </div>
            </div>
          </div>
        </ChartContainer>
      )}

      {/* Tooltip info */}
      {hoveredCell && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium shadow-lg z-50 pointer-events-none"
        >
          {hoveredCell.day} at {hoveredCell.hour}: {hoveredCell.value}%{" "}
          {selectedEmotion.toLowerCase()} intensity
        </motion.div>
      )}
    </motion.div>
  );
}
