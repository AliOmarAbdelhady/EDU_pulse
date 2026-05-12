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
import { useEmotionFrequency } from "@/lib/hooks/useEmotions";

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

const EMOTION_COLORS = {
  Happy: "#22c55e",
  Neutral: "#6b7280",
  Confused: "#f97316",
  Bored: "#9ca3af",
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

export default function EmotionFrequencyPage() {
  const [sortBy, setSortBy] = useState("count");

  const {
    data: frequencyData,
    isLoading,
    error,
    refetch,
  } = useEmotionFrequency();

  const computed = useMemo(() => {
    if (!frequencyData || !Array.isArray(frequencyData) || frequencyData.length === 0) {
      return { sortedByCount: [], totalCount: 0, pieData: [] };
    }

    const totalCount = frequencyData.reduce((sum, d) => sum + (d.count || 0), 0);
    const sortedByCount = [...frequencyData].sort((a, b) => b.count - a.count);
    const pieData = frequencyData.map((d) => ({
      ...d,
      percent: totalCount > 0 ? Math.round((d.count / totalCount) * 100) : 0,
    }));

    return { sortedByCount, totalCount, pieData };
  }, [frequencyData]);

  const displayData =
    sortBy === "name"
      ? [...(frequencyData || [])].sort((a, b) => a.emotion.localeCompare(b.emotion))
      : computed.sortedByCount;

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Emotion Frequency
        </h1>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">
            {error.message || "Failed to load frequency data"}
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
          Emotion Frequency
        </h1>
        <p className="text-muted-foreground mt-1">
          Detailed breakdown of how often each emotion was detected across all
          sessions.
        </p>
      </motion.div>

      {/* Stats Row */}
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
                <p className="text-sm text-muted-foreground">
                  Total Detections
                </p>
                <p className="text-2xl font-bold mt-1">
                  {computed.totalCount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Most Frequent
                </p>
                {computed.sortedByCount.length > 0 ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: EMOTION_COLORS[computed.sortedByCount[0].emotion] || "#6b7280" }}
                    />
                    <span className="text-2xl font-bold">
                      {computed.sortedByCount[0].emotion}
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold mt-1">N/A</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Least Frequent
                </p>
                {computed.sortedByCount.length > 0 ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{
                        backgroundColor:
                          EMOTION_COLORS[computed.sortedByCount[computed.sortedByCount.length - 1].emotion] || "#6b7280",
                      }}
                    />
                    <span className="text-2xl font-bold">
                      {computed.sortedByCount[computed.sortedByCount.length - 1].emotion}
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold mt-1">N/A</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>

      {/* Bar Chart */}
      {isLoading ? (
        <Card><CardContent className="pt-4"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
      ) : (
        <ChartContainer
          title="Emotion Counts"
          description="Number of detections per emotion category"
        >
          <EmotionBarChart data={displayData} layout="horizontal" height={400} />
        </ChartContainer>
      )}

      {/* Pie Chart */}
      {isLoading ? (
        <Card><CardContent className="pt-4"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
      ) : (
        <ChartContainer
          title="Emotion Distribution"
          description="Proportional share of each emotion in total detections"
        >
          <EmotionPieChart data={computed.pieData} height={400} />
        </ChartContainer>
      )}

      {/* Detailed Table */}
      {isLoading ? (
        <Card><CardContent className="pt-4"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
      ) : (
        <ChartContainer
          title="Detailed Breakdown"
          description="Complete frequency data for all emotions"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Emotion
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Count
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Percentage
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Visual
                  </th>
                </tr>
              </thead>
              <tbody>
                {computed.sortedByCount.map((item, index) => (
                  <motion.tr
                    key={item.emotion}
                    className="border-b last:border-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium">{index + 1}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: EMOTION_COLORS[item.emotion] || "#6b7280",
                          }}
                        />
                        <span className="font-medium">{item.emotion}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.count}</td>
                    <td className="py-3 px-4">
                      {computed.totalCount > 0
                        ? `${Math.round((item.count / computed.totalCount) * 100)}%`
                        : "0%"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-muted rounded-full h-2 max-w-48">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              computed.sortedByCount[0]?.count > 0
                                ? (item.count / computed.sortedByCount[0].count) * 100
                                : 0
                            }%`,
                            backgroundColor: EMOTION_COLORS[item.emotion] || "#6b7280",
                          }}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartContainer>
      )}
    </motion.div>
  );
}
