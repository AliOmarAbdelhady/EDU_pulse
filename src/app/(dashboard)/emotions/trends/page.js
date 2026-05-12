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
import { useEmotionTrends } from "@/lib/hooks/useEmotions";

const ChartContainer = dynamic(
  () => import("@/components/charts/ChartContainer"),
  { ssr: false, loading: () => <div className="h-[200px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);
const EmotionLineChart = dynamic(
  () => import("@/components/charts/EmotionLineChart"),
  { ssr: false, loading: () => <div className="h-[350px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);

const EMOTION_COLORS = {
  Happy: "#22c55e",
  Neutral: "#6b7280",
  Confused: "#f97316",
  Bored: "#9ca3af",
};

const ALL_EMOTIONS = Object.keys(EMOTION_COLORS);

const PERIODS = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

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

export default function EmotionTrendsPage() {
  const [period, setPeriod] = useState("week");
  const [selectedEmotions, setSelectedEmotions] = useState([
    "Happy",
    "Neutral",
    "Confused",
    "Bored",
  ]);

  const {
    data: trendData,
    isLoading,
    error,
    refetch,
  } = useEmotionTrends({ period });

  const toggleEmotion = (emotion) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Emotion Trends
        </h1>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">
            {error.message || "Failed to load trend data"}
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
          Emotion Trends
        </h1>
        <p className="text-muted-foreground mt-1">
          Track how emotions evolve over time with customizable period views.
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        {/* Period Selector */}
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                period === p.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Emotion Filter */}
        <div className="flex flex-wrap gap-2">
          {ALL_EMOTIONS.map((emotion) => {
            const isActive = selectedEmotions.includes(emotion);
            return (
              <button
                key={emotion}
                onClick={() => toggleEmotion(emotion)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                  isActive
                    ? "border-transparent text-white"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
                style={
                  isActive
                    ? { backgroundColor: EMOTION_COLORS[emotion] }
                    : {}
                }
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
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

      {/* Main Chart */}
      {isLoading ? (
        <Card><CardContent className="pt-4"><Skeleton className="h-[450px] w-full" /></CardContent></Card>
      ) : (
        <ChartContainer
          title={`Emotion Trends (${PERIODS.find((p) => p.key === period)?.label})`}
          description="Select emotions above to toggle their visibility on the chart"
        >
          <EmotionLineChart
            data={trendData || []}
            emotions={selectedEmotions}
            height={450}
            showDots={true}
            curved={true}
          />
        </ChartContainer>
      )}

      {/* Summary Cards for Selected Emotions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))
        ) : (
          selectedEmotions.slice(0, 4).map((emotion) => {
            const dataPoints = trendData || [];
            const values = dataPoints.map((d) => d[emotion] || 0);
            const avg =
              values.length > 0
                ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
                : 0;
            const latest = values.length > 0 ? values[values.length - 1] : 0;
            const previous = values.length > 1 ? values[values.length - 2] : latest;
            const changePercent =
              previous > 0
                ? Math.round(((latest - previous) / previous) * 100)
                : 0;

            return (
              <Card key={emotion}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                    />
                    <span className="text-sm font-medium">{emotion}</span>
                  </div>
                  <p className="text-2xl font-bold">{latest}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs font-medium ${
                        changePercent >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {changePercent >= 0 ? "+" : ""}
                      {changePercent}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      vs previous
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: {avg} per {period}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}
