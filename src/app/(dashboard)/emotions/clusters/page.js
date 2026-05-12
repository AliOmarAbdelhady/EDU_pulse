"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const ChartContainer = dynamic(
  () => import("@/components/charts/ChartContainer"),
  { ssr: false, loading: () => <div className="h-[200px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);

const EMOTION_COLORS = {
  HAPPY: "#22c55e",
  SAD: "#3b82f6",
  ANGRY: "#ef4444",
  SURPRISED: "#f59e0b",
  FEARFUL: "#8b5cf6",
  NEUTRAL: "#6b7280",
  CONFUSED: "#f97316",
  BORED: "#9ca3af",
  ENGAGED: "#06b6d4",
};

function hashToSeed(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function seededUnitFloat(seed) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Generate clustered student data
// Each cluster represents a group of students with similar emotion profiles
const generateClusterData = () => {
  const clusters = [
    {
      name: "Highly Engaged",
      emotion: "ENGAGED",
      centerX: 75,
      centerY: 80,
      spread: 15,
      count: 25,
    },
    {
      name: "Happy Learners",
      emotion: "HAPPY",
      centerX: 70,
      centerY: 60,
      spread: 12,
      count: 20,
    },
    {
      name: "Neutral Observers",
      emotion: "NEUTRAL",
      centerX: 50,
      centerY: 45,
      spread: 18,
      count: 18,
    },
    {
      name: "Confused Students",
      emotion: "CONFUSED",
      centerX: 30,
      centerY: 35,
      spread: 14,
      count: 15,
    },
    {
      name: "Bored Group",
      emotion: "BORED",
      centerX: 25,
      centerY: 20,
      spread: 10,
      count: 12,
    },
    {
      name: "Anxious Students",
      emotion: "FEARFUL",
      centerX: 35,
      centerY: 55,
      spread: 12,
      count: 10,
    },
  ];

  const data = {};
  clusters.forEach((cluster, clusterIndex) => {
    const points = [];
    for (let i = 0; i < cluster.count; i++) {
      const baseSeed = hashToSeed(`${cluster.emotion}-${clusterIndex}-${i}`);
      const x =
        cluster.centerX + (seededUnitFloat(baseSeed) - 0.5) * cluster.spread * 2;
      const y =
        cluster.centerY +
        (seededUnitFloat(baseSeed + 1) - 0.5) * cluster.spread * 2;
      points.push({
        x: Math.max(0, Math.min(100, Math.round(x * 10) / 10)),
        y: Math.max(0, Math.min(100, Math.round(y * 10) / 10)),
        z: Math.round(20 + seededUnitFloat(baseSeed + 2) * 30),
        student: `Student ${clusterIndex * 30 + i + 1}`,
      });
    }
    data[cluster.emotion] = {
      name: cluster.name,
      points,
      color: EMOTION_COLORS[cluster.emotion],
    };
  });

  return data;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{data.student}</p>
      <div className="mt-1 space-y-1 text-xs text-muted-foreground">
        <p>
          Engagement Score: <span className="font-medium text-foreground">{data.x}</span>
        </p>
        <p>
          Positivity Index: <span className="font-medium text-foreground">{data.y}</span>
        </p>
      </div>
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

export default function EmotionClustersPage() {
  const [visibleClusters, setVisibleClusters] = useState(
    Object.keys(EMOTION_COLORS)
  );
  const [selectedCluster, setSelectedCluster] = useState(null);

  const clusterData = useMemo(() => generateClusterData(), []);

  const toggleCluster = (emotion) => {
    setVisibleClusters((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  const totalStudents = Object.values(clusterData).reduce(
    (sum, cluster) => sum + cluster.points.length,
    0
  );

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
          Student Clusters
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize how students cluster based on their emotional profiles and
          engagement patterns.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Students</p>
            <p className="text-2xl font-bold mt-1">{totalStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Clusters Identified</p>
            <p className="text-2xl font-bold mt-1">
              {Object.keys(clusterData).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Avg. Cluster Size</p>
            <p className="text-2xl font-bold mt-1">
              {Math.round(totalStudents / Object.keys(clusterData).length)}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cluster Toggles */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(clusterData).map(([emotion, cluster]) => {
            const isActive = visibleClusters.includes(emotion);
            return (
              <button
                key={emotion}
                onClick={() => toggleCluster(emotion)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all border ${
                  isActive
                    ? "border-transparent text-white shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
                style={isActive ? { backgroundColor: cluster.color } : {}}
              >
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${isActive ? "bg-white" : ""}`}
                  style={!isActive ? { backgroundColor: cluster.color } : {}}
                />
                {cluster.name}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Scatter Plot */}
      <ChartContainer
        title="Student Emotion Clusters"
        description="Each point represents a student. X-axis: Engagement score, Y-axis: Positivity index."
      >
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
            />
            <XAxis
              type="number"
              dataKey="x"
              name="Engagement"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{
                value: "Engagement Score",
                position: "insideBottom",
                offset: -10,
                style: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Positivity"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{
                value: "Positivity Index",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                style: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <ZAxis
              type="number"
              dataKey="z"
              range={[50, 200]}
              name="Size"
            />
            <Tooltip content={<CustomTooltip />} />
            {Object.entries(clusterData)
              .filter(([emotion]) => visibleClusters.includes(emotion))
              .map(([emotion, cluster]) => (
                <Scatter
                  key={emotion}
                  name={cluster.name}
                  data={cluster.points}
                  fill={cluster.color}
                  opacity={0.7}
                  onClick={() => setSelectedCluster(emotion)}
                />
              ))}
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Cluster Details */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold mb-4">Cluster Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(clusterData).map(([emotion, cluster]) => {
            const avgEngagement = Math.round(
              cluster.points.reduce((sum, p) => sum + p.x, 0) /
                cluster.points.length
            );
            const avgPositivity = Math.round(
              cluster.points.reduce((sum, p) => sum + p.y, 0) /
                cluster.points.length
            );

            return (
              <motion.div
                key={emotion}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  className="cursor-pointer"
                  onClick={() => setSelectedCluster(emotion)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cluster.color }}
                      />
                      <span className="font-medium text-sm">
                        {cluster.name}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Students</span>
                        <span className="font-medium">{cluster.points.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Avg. Engagement
                        </span>
                        <span className="font-medium">{avgEngagement}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Avg. Positivity
                        </span>
                        <span className="font-medium">{avgPositivity}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
