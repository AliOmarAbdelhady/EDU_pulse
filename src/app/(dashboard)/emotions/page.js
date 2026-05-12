"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import { useEmotionFrequency, useEmotionTrends } from "@/lib/hooks/useEmotions";

const ChartContainer = dynamic(
  () => import("@/components/charts/ChartContainer"),
  { ssr: false, loading: () => <div className="h-[200px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);
const EmotionBarChart = dynamic(
  () => import("@/components/charts/EmotionBarChart"),
  { ssr: false, loading: () => <div className="h-[350px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);
const EmotionPieChart = dynamic(
  () => import("@/components/charts/EmotionPieChart"),
  { ssr: false, loading: () => <div className="h-[350px] w-full animate-pulse rounded-xl bg-muted/50" /> }
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

const EMOTION_ICONS = {
  Happy: "\u{1F60A}",
  Neutral: "\u{1F610}",
  Confused: "\u{1F615}",
  Bored: "\u{1F634}",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function EmotionsOverviewPage() {
  const {
    data: frequencyData,
    isLoading: freqLoading,
    error: freqError,
    refetch: refetchFreq,
  } = useEmotionFrequency();

  const {
    data: trendData,
    isLoading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends,
  } = useEmotionTrends({ period: "week" });

  const isLoading = freqLoading || trendsLoading;
  const hasError = freqError || trendsError;

  const computed = useMemo(() => {
    if (!frequencyData || !Array.isArray(frequencyData) || frequencyData.length === 0) {
      return {
        totalDetections: 0,
        topEmotion: null,
        emotionTypes: 0,
        barChartData: [],
        pieChartData: [],
        summaryData: [],
        trendEmotions: [],
      };
    }

    const totalDetections = frequencyData.reduce(
      (sum, d) => sum + (d.count || 0),
      0
    );

    const sorted = [...frequencyData].sort((a, b) => b.count - a.count);
    const topEmotion = sorted[0] || null;
    const emotionTypes = frequencyData.length;

    const barChartData = sorted.map((d) => ({
      emotion: d.emotion,
      count: d.count,
    }));

    const pieChartData = frequencyData.map((d) => ({
      emotion: d.emotion,
      count: d.count,
      percent: totalDetections > 0 ? Math.round((d.count / totalDetections) * 100) : 0,
    }));

    const summaryData = frequencyData.map((d) => ({
      emotion: d.emotion,
      count: d.count,
    }));

    const trendEmotions = frequencyData.map((d) => d.emotion);

    return {
      totalDetections,
      topEmotion,
      emotionTypes,
      barChartData,
      pieChartData,
      summaryData,
      trendEmotions,
    };
  }, [frequencyData]);

  if (hasError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Emotion Analysis</h1>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">
            {freqError?.message || trendsError?.message || "Failed to load emotion data"}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              refetchFreq();
              refetchTrends();
            }}
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
        <h1 className="text-2xl font-extrabold tracking-tight">Emotion Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and analyze student emotional patterns across lectures and
          sessions.
        </p>
      </motion.div>

      {/* Summary Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Card><CardContent className="pt-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            <Card><CardContent className="pt-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            <Card><CardContent className="pt-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            <Card><CardContent className="pt-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Detections</p>
                    <p className="text-2xl font-bold mt-1">
                      {computed.totalDetections.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-full bg-primary/15 p-3">
                    <svg
                      className="h-5 w-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Dominant Emotion</p>
                    <p className="text-2xl font-bold mt-1">
                      {computed.topEmotion
                        ? `${EMOTION_ICONS[computed.topEmotion.emotion] || ""} ${computed.topEmotion.emotion}`
                        : "N/A"}
                    </p>
                  </div>
                  {computed.topEmotion && (
                    <div
                      className="rounded-full p-3"
                      style={{
                        backgroundColor:
                          (EMOTION_COLORS[computed.topEmotion.emotion] || "#6b7280") + "20",
                      }}
                    >
                      <div
                        className="h-5 w-5 rounded-full"
                        style={{
                          backgroundColor:
                            EMOTION_COLORS[computed.topEmotion.emotion] || "#6b7280",
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Emotion Types</p>
                    <p className="text-2xl font-bold mt-1">{computed.emotionTypes}</p>
                  </div>
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3">
                    <svg
                      className="h-5 w-5 text-purple-600 dark:text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Positivity</p>
                    <p className="text-2xl font-bold mt-1">
                      {computed.totalDetections > 0
                        ? Math.round(
                            ((computed.summaryData.find((d) => d.emotion === "Happy")
                              ?.count || 0) /
                              computed.totalDetections) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="rounded-full bg-success/10 p-3">
                    <svg
                      className="h-5 w-5 text-success"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>

      {/* Quick Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <Card><CardContent className="pt-4"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
            <Card><CardContent className="pt-4"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
          </>
        ) : (
          <>
            <ChartContainer
              title="Emotion Distribution"
              description="Breakdown of all detected emotions"
            >
              <EmotionBarChart data={computed.barChartData} layout="horizontal" height={300} />
            </ChartContainer>

            <ChartContainer
              title="Emotion Proportions"
              description="Relative share of each emotion category"
            >
              <EmotionPieChart
                data={computed.pieChartData}
                height={300}
                innerRadius={55}
                outerRadius={105}
              />
            </ChartContainer>
          </>
        )}
      </div>

      {/* Weekly Trend */}
      {isLoading ? (
        <Card><CardContent className="pt-4"><Skeleton className="h-[320px] w-full" /></CardContent></Card>
      ) : (
        <ChartContainer
          title="Weekly Emotion Trend"
          description="Top emotions tracked over the past week"
        >
          <EmotionLineChart
            data={trendData || []}
            emotions={computed.trendEmotions}
            height={320}
          />
        </ChartContainer>
      )}

      {/* Emotion Breakdown Cards */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold mb-4">Emotion Breakdown</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} size="sm">
                <CardContent><Skeleton className="h-14 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {computed.summaryData.map((item) => (
              <motion.div
                key={item.emotion}
                variants={itemVariants}
              >
                <Card size="sm">
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                        style={{
                          backgroundColor:
                            (EMOTION_COLORS[item.emotion] || "#6b7280") + "20",
                        }}
                      >
                        {EMOTION_ICONS[item.emotion] || ""}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {item.emotion}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.count} detections
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {computed.totalDetections > 0
                        ? `${Math.round((item.count / computed.totalDetections) * 100)}%`
                        : "0%"}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
