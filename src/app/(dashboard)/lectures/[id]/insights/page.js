"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  AlertTriangle,
  Activity,
  TrendingDown,
  Sparkles,
  Clock,
  Users,
  Target,
  ChevronRight,
} from "lucide-react";

const EMOTION_COLORS = {
  Happy: "#10b981",
  Neutral: "#6b7280",
  Confused: "#f59e0b",
  Bored: "#ef4444",
};

function formatMinute(m) {
  const mm = Math.floor(m);
  const ss = Math.round((m - mm) * 60);
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

function StatCard({ icon, label, value, sub, tone = "primary" }) {
  const toneClasses = {
    primary: "text-primary",
    red: "text-red-500",
    amber: "text-amber-500",
    emerald: "text-emerald-500",
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={toneClasses[tone]}>{icon}</div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Stacked-bar timeline: each bucket = 1 minute. Bar height = total samples,
 * bar segments = emotion counts. Spike minutes get a glowing red ring.
 */
function Timeline({ timeline, spikes, selectedMinute, onSelectMinute }) {
  if (!timeline || timeline.length === 0) return null;

  const maxSamples = Math.max(...timeline.map((m) => m.totalSamples));
  const spikeMinutes = new Set(spikes.map((s) => s.minute));

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 overflow-x-auto pb-2">
        {timeline.map((m) => {
          const isSpike = spikeMinutes.has(m.minute);
          const isSelected = selectedMinute === m.minute;
          const totalHeight = (m.totalSamples / maxSamples) * 100;
          const happyPct = (m.emotions.Happy / m.totalSamples) * 100;
          const neutralPct = (m.emotions.Neutral / m.totalSamples) * 100;
          const confusedPct = (m.emotions.Confused / m.totalSamples) * 100;
          const boredPct = (m.emotions.Bored / m.totalSamples) * 100;

          return (
            <button
              key={m.minute}
              onClick={() => onSelectMinute(m.minute)}
              className={`relative flex flex-col items-center group min-w-[24px]`}
              style={{ height: "180px" }}
            >
              <div
                className={`relative w-5 rounded-t overflow-hidden transition-all ${
                  isSelected ? "ring-2 ring-primary" : ""
                } ${isSpike ? "ring-2 ring-red-500 shadow-lg shadow-red-500/40" : ""}`}
                style={{ height: `${totalHeight}%`, marginTop: "auto" }}
              >
                <div style={{ height: `${boredPct}%`, background: EMOTION_COLORS.Bored }} />
                <div style={{ height: `${confusedPct}%`, background: EMOTION_COLORS.Confused }} />
                <div style={{ height: `${neutralPct}%`, background: EMOTION_COLORS.Neutral }} />
                <div style={{ height: `${happyPct}%`, background: EMOTION_COLORS.Happy }} />
              </div>
              {m.minute % 5 === 0 && (
                <span className="text-[10px] text-muted-foreground mt-1">{m.minute}</span>
              )}
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-popover text-popover-foreground border rounded-lg p-2 text-xs whitespace-nowrap shadow-lg">
                <p className="font-bold">Minute {m.minute}</p>
                <p>Samples: {m.totalSamples}</p>
                <p>Confusion: {Math.round(m.confusionRate * 100)}%</p>
                <p>Engagement: {Math.round(m.avgEngagement * 100)}%</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
          <div key={emotion} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: color }}
            />
            <span>{emotion}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4">
          <span className="inline-block h-3 w-3 rounded-sm ring-2 ring-red-500" />
          <span>Confusion spike</span>
        </div>
      </div>
    </div>
  );
}

export default function LectureInsightsPage() {
  const { id } = useParams();
  const [selectedMinute, setSelectedMinute] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["lecture-timeline", id],
    queryFn: async () => {
      const res = await fetch(`/api/lectures/${id}/timeline`);
      if (!res.ok) throw new Error("Failed to load timeline");
      return res.json();
    },
    enabled: !!id,
  });

  // Auto-select the highest-severity spike on load.
  useEffect(() => {
    if (selectedMinute == null && data?.spikes?.length > 0) {
      setSelectedMinute(data.spikes[0].minute);
    }
  }, [data, selectedMinute]);

  const selectedData = useMemo(() => {
    if (selectedMinute == null || !data?.timeline) return null;
    return data.timeline.find((m) => m.minute === selectedMinute);
  }, [data, selectedMinute]);

  const selectedSpike = useMemo(() => {
    if (selectedMinute == null || !data?.spikes) return null;
    return data.spikes.find((s) => s.minute === selectedMinute);
  }, [data, selectedMinute]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24" /><Skeleton className="h-24" />
          <Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-60" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-muted-foreground">Failed to load lecture insights.</p>;
  }

  if (data.timeline.length === 0) {
    return (
      <div className="space-y-4">
        <Link href={`/lectures/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lecture
          </Button>
        </Link>
        <div className="text-center py-20 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3" />
          <p>No emotion data recorded for this lecture yet.</p>
        </div>
      </div>
    );
  }

  const { lecture, timeline, spikes, summary } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <Link href={`/lectures/${id}`}>
          <Button variant="ghost" size="sm" className="mb-3">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lecture
          </Button>
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-purple-500" />
          Lecture Insights
        </h1>
        <p className="text-muted-foreground mt-1">
          {lecture.course?.courseCode} — {lecture.lectureName} ({lecture.lectureCode})
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="Minutes Analyzed"
          value={summary.totalMinutes}
          sub={`${summary.totalSamples} samples`}
        />
        <StatCard
          icon={<AlertTriangle className="h-6 w-6" />}
          label="Confusion Spikes"
          value={summary.totalSpikes}
          sub={summary.totalSpikes > 0 ? "Click bars to inspect" : "All clear"}
          tone={summary.totalSpikes > 0 ? "red" : "emerald"}
        />
        <StatCard
          icon={<Target className="h-6 w-6" />}
          label="Peak Confusion"
          value={`${Math.round(summary.peakConfusion.confusionRate * 100)}%`}
          sub={`at minute ${summary.peakConfusion.minute}`}
          tone="amber"
        />
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Students"
          value={summary.totalUniqueStudents}
          sub={`avg engagement ${Math.round(summary.avgEngagement * 100)}%`}
        />
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Emotion Timeline
          </CardTitle>
          <CardDescription>
            One bar per minute. Stacked by emotion. Red-ringed bars = confusion spike.
            Click any bar to inspect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Timeline
            timeline={timeline}
            spikes={spikes}
            selectedMinute={selectedMinute}
            onSelectMinute={setSelectedMinute}
          />
        </CardContent>
      </Card>

      {/* Detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected minute detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedSpike ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <Target className="h-5 w-5" />
              )}
              Minute {selectedMinute != null ? selectedMinute : "—"}
              {selectedSpike && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200 border-0 ml-2">
                  Spike — {selectedSpike.severity.toUpperCase()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Metric label="Samples" value={selectedData.totalSamples} />
                  <Metric label="Unique Students" value={selectedData.uniqueStudents} />
                  <Metric
                    label="Confusion"
                    value={`${Math.round(selectedData.confusionRate * 100)}%`}
                    tone={selectedData.confusionRate > 0.3 ? "amber" : undefined}
                  />
                  <Metric
                    label="Engagement"
                    value={`${Math.round(selectedData.avgEngagement * 100)}%`}
                  />
                </div>

                {/* Emotion breakdown bar */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Emotion Mix
                  </p>
                  <div className="flex h-6 rounded-lg overflow-hidden border">
                    {Object.entries(selectedData.emotions).map(([emotion, count]) => {
                      if (count === 0) return null;
                      const pct = (count / selectedData.totalSamples) * 100;
                      return (
                        <div
                          key={emotion}
                          title={`${emotion}: ${count}`}
                          className="flex items-center justify-center text-[10px] font-semibold text-white"
                          style={{
                            width: `${pct}%`,
                            background: EMOTION_COLORS[emotion],
                          }}
                        >
                          {pct >= 10 ? `${Math.round(pct)}%` : ""}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    {Object.entries(selectedData.emotions).map(([emotion, count]) => (
                      <span key={emotion} className="text-muted-foreground">
                        <span
                          className="inline-block h-2 w-2 rounded-sm mr-1"
                          style={{ background: EMOTION_COLORS[emotion] }}
                        />
                        {emotion}: <strong>{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {selectedSpike && (
                  <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50/40 dark:bg-red-950/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      Why this is flagged
                    </p>
                    <p className="text-sm">
                      Confusion rose <strong>+{selectedSpike.magnitude} pp</strong> vs. the
                      previous 3-minute baseline ({Math.round(selectedSpike.baseline * 100)}% → {Math.round(selectedSpike.confusionRate * 100)}%).{" "}
                      <strong>{selectedSpike.affectedStudents}</strong> of{" "}
                      <strong>{selectedSpike.totalStudents}</strong> students showed
                      confusion or boredom.
                    </p>
                    <p className="text-sm mt-2 italic text-muted-foreground">
                      Suggested action: review your lecture content around this timestamp —
                      this often signals a topic transition that needs a recap or worked
                      example.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Click a bar to see detail.</p>
            )}
          </CardContent>
        </Card>

        {/* Spike list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              All Spikes ({spikes.length})
            </CardTitle>
            <CardDescription>Sorted by time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {spikes.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">
                No confusion spikes detected — students stayed engaged throughout.
              </p>
            ) : (
              spikes.map((s) => (
                <button
                  key={s.minute}
                  onClick={() => setSelectedMinute(s.minute)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedMinute === s.minute
                      ? "border-red-400 bg-red-50/50 dark:bg-red-950/40"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Minute {s.minute}</p>
                      <p className="text-xs text-muted-foreground">
                        +{s.magnitude} pp · {s.affectedStudents}/{s.totalStudents} affected
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`border-0 ${
                          s.severity === "high"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200"
                        }`}
                      >
                        {Math.round(s.confusionRate * 100)}%
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function Metric({ label, value, tone }) {
  const toneClass =
    tone === "amber" ? "text-amber-600 dark:text-amber-400" :
    tone === "red"   ? "text-red-600 dark:text-red-400" : "";
  return (
    <div className="text-center rounded-lg border bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
