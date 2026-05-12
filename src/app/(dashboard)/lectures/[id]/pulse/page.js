"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Play,
  Pause,
  RotateCcw,
  Radio,
  AlertTriangle,
  Zap,
  Sparkles,
  CheckCircle,
  Info,
  Users,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const EMOTION_COLORS = {
  Happy: "#10b981",
  Neutral: "#6b7280",
  Confused: "#f59e0b",
  Bored: "#ef4444",
};

const SEVERITY_STYLES = {
  critical: {
    ring: "ring-4 ring-red-500/60",
    bg: "bg-red-500",
    border: "border-red-500",
    glow: "shadow-2xl shadow-red-500/50",
    text: "text-red-100",
    badge: "bg-red-100 text-red-900 dark:bg-red-900/70 dark:text-red-100",
  },
  high: {
    ring: "ring-4 ring-orange-500/50",
    bg: "bg-orange-500",
    border: "border-orange-500",
    glow: "shadow-xl shadow-orange-500/40",
    text: "text-orange-50",
    badge: "bg-orange-100 text-orange-900 dark:bg-orange-900/70 dark:text-orange-100",
  },
  medium: {
    ring: "ring-2 ring-amber-400",
    bg: "bg-amber-500",
    border: "border-amber-500",
    glow: "shadow-lg shadow-amber-500/30",
    text: "text-amber-50",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-100",
  },
  low: {
    ring: "ring-2 ring-emerald-400",
    bg: "bg-emerald-500",
    border: "border-emerald-500",
    glow: "shadow-md shadow-emerald-500/30",
    text: "text-emerald-50",
    badge: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100",
  },
  info: {
    ring: "ring-2 ring-blue-400",
    bg: "bg-blue-500",
    border: "border-blue-500",
    glow: "shadow-md shadow-blue-500/30",
    text: "text-blue-50",
    badge: "bg-blue-100 text-blue-900 dark:bg-blue-900/70 dark:text-blue-100",
  },
};

const SUGGESTION_ICONS = {
  alert: AlertTriangle,
  energy: Zap,
  good: CheckCircle,
  info: Info,
};

// ---------- Big central pulse meter ----------

function PulseMeter({ tick, isLive }) {
  const confusion = tick?.confusionRate ?? 0;
  const sev = tick?.suggestion?.severity ?? "info";
  const styles = SEVERITY_STYLES[sev];

  return (
    <div className="relative flex flex-col items-center">
      {/* Animated rings */}
      {isLive && (
        <>
          <motion.div
            className={`absolute inset-0 rounded-full ${styles.bg}`}
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 280, height: 280, left: "50%", top: "50%", x: "-50%", y: "-50%" }}
          />
          <motion.div
            className={`absolute inset-0 rounded-full ${styles.bg}`}
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            style={{ width: 280, height: 280, left: "50%", top: "50%", x: "-50%", y: "-50%" }}
          />
        </>
      )}

      {/* Big circle */}
      <motion.div
        layout
        animate={isLive ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={`relative z-10 h-72 w-72 rounded-full flex flex-col items-center justify-center ${styles.bg} ${styles.glow} ${styles.ring}`}
      >
        <div className="text-7xl font-extrabold text-white leading-none">
          {Math.round(confusion * 100)}%
        </div>
        <div className="text-sm uppercase tracking-widest text-white/90 mt-2">
          Confusion
        </div>
        {tick && (
          <div className="mt-3 text-xs text-white/80 font-medium">
            Minute {tick.minute}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ---------- Live alert / suggestion banner ----------

function SuggestionBanner({ suggestion, minute }) {
  if (!suggestion) return null;
  const styles = SEVERITY_STYLES[suggestion.severity];
  const Icon = SUGGESTION_ICONS[suggestion.icon] || Info;

  return (
    <motion.div
      key={`${minute}-${suggestion.headline}`}
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -30, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`rounded-xl border-2 ${styles.border} ${styles.bg} ${styles.glow} p-5`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-white/20 p-3">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-white/90 text-xs uppercase tracking-widest mb-1">
            <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
            Live Suggestion
          </div>
          <h3 className="text-xl font-bold text-white">{suggestion.headline}</h3>
          <p className="text-white/95 text-sm mt-1.5">{suggestion.action}</p>
        </div>
        <Badge className={`border-0 ${styles.badge}`}>
          {suggestion.severity.toUpperCase()}
        </Badge>
      </div>
    </motion.div>
  );
}

// ---------- Mini emotion chip strip ----------

function EmotionStrip({ emotions, total }) {
  if (!emotions || !total) return null;
  return (
    <div className="flex h-3 rounded-full overflow-hidden border">
      {Object.entries(emotions).map(([e, c]) => {
        if (c === 0) return null;
        const pct = (c / total) * 100;
        return (
          <div
            key={e}
            title={`${e}: ${c}`}
            style={{ width: `${pct}%`, background: EMOTION_COLORS[e] }}
          />
        );
      })}
    </div>
  );
}

// ---------- Recent alerts feed ----------

function AlertsFeed({ alerts }) {
  return (
    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
      <AnimatePresence initial={false}>
        {alerts.map((a, i) => {
          const styles = SEVERITY_STYLES[a.suggestion.severity];
          const Icon = SUGGESTION_ICONS[a.suggestion.icon] || Info;
          return (
            <motion.div
              key={`${a.minute}-${i}`}
              layout
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              className={`rounded-lg border ${styles.border} bg-card p-3 flex items-start gap-3`}
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 text-${a.suggestion.severity === "critical" ? "red" : a.suggestion.severity === "high" ? "orange" : a.suggestion.severity === "medium" ? "amber" : a.suggestion.severity === "low" ? "emerald" : "blue"}-500`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{a.suggestion.headline}</p>
                <p className="text-xs text-muted-foreground truncate">{a.suggestion.action}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Minute {a.minute} · Confusion {Math.round(a.confusionRate * 100)}%
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ---------- Main page ----------

const SPEED_OPTIONS = [
  { label: "0.5×", value: 4000 },
  { label: "1×",   value: 2000 },
  { label: "2×",   value: 1000 },
  { label: "4×",   value: 500 },
  { label: "8×",   value: 250 },
];

export default function LivePulsePage() {
  const { id } = useParams();
  const [tickIndex, setTickIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [alerts, setAlerts] = useState([]);
  const timerRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["lecture-pulse", id],
    queryFn: async () => {
      const res = await fetch(`/api/lectures/${id}/pulse`);
      if (!res.ok) throw new Error("Failed to load pulse data");
      return res.json();
    },
    enabled: !!id,
  });

  const currentTick = data?.ticks?.[tickIndex] ?? null;
  const totalTicks = data?.ticks?.length ?? 0;

  // Auto-advance ticker
  useEffect(() => {
    if (!isPlaying || !data?.ticks?.length) return;
    timerRef.current = setInterval(() => {
      setTickIndex((i) => {
        if (i + 1 >= data.ticks.length) {
          setIsPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, speed);
    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed, data]);

  // Capture alerts when severity is medium or higher
  useEffect(() => {
    if (!currentTick) return;
    const sev = currentTick.suggestion?.severity;
    if (sev === "critical" || sev === "high" || sev === "medium") {
      setAlerts((prev) => {
        if (prev.find((a) => a.minute === currentTick.minute)) return prev;
        return [
          { minute: currentTick.minute, ...currentTick },
          ...prev,
        ].slice(0, 30);
      });
    }
  }, [currentTick]);

  const reset = () => {
    setTickIndex(0);
    setAlerts([]);
    setIsPlaying(false);
  };

  const progressPct = totalTicks > 0 ? ((tickIndex + 1) / totalTicks) * 100 : 0;

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!data.ticks?.length) {
    return (
      <div className="space-y-4">
        <Link href={`/lectures/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lecture
          </Button>
        </Link>
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3" />
            <p>No emotion data recorded for this lecture yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href={`/lectures/${id}`}>
            <Button variant="ghost" size="sm" className="mb-3">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lecture
            </Button>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Radio className={`h-8 w-8 ${isPlaying ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
            Live Lecture Pulse
            {isPlaying && (
              <Badge className="bg-red-500 text-white border-0 animate-pulse">LIVE</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {data.lecture.course?.courseCode} — {data.lecture.lectureName}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isPlaying ? "destructive" : "default"}
            onClick={() => setIsPlaying((p) => !p)}
            disabled={tickIndex >= totalTicks - 1 && !isPlaying}
          >
            {isPlaying ? (
              <><Pause className="mr-2 h-4 w-4" /> Pause</>
            ) : (
              <><Play className="mr-2 h-4 w-4" /> {tickIndex === 0 ? "Start Live" : "Resume"}</>
            )}
          </Button>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <div className="flex rounded-lg border overflow-hidden">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSpeed(s.value)}
                className={`px-3 py-2 text-xs font-medium transition ${
                  speed === s.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover:bg-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Minute {currentTick?.minute ?? 0} of {data.ticks[data.ticks.length - 1]?.minute ?? 0}</span>
          <span>{tickIndex + 1} / {totalTicks} ticks</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Suggestion banner */}
      <AnimatePresence mode="wait">
        {currentTick && (
          <SuggestionBanner
            key={`${tickIndex}-${currentTick.suggestion?.headline}`}
            suggestion={currentTick.suggestion}
            minute={currentTick.minute}
          />
        )}
      </AnimatePresence>

      {/* Main: pulse meter + side stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Pulse Meter
            </CardTitle>
            <CardDescription>
              Real-time confusion percentage. Pulses + glows scale with severity.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-12 gap-8">
            <PulseMeter tick={currentTick} isLive={isPlaying} />

            {currentTick && (
              <div className="w-full max-w-md space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Class Mood ({currentTick.totalSamples} samples)
                </p>
                <EmotionStrip emotions={currentTick.emotions} total={currentTick.totalSamples} />
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                  {Object.entries(currentTick.emotions).map(([e, c]) => (
                    <span key={e} className="flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-sm"
                        style={{ background: EMOTION_COLORS[e] }}
                      />
                      {e}: <strong>{c}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <SideStat
                  icon={<Users className="h-5 w-5 text-primary" />}
                  label="Students Engaged"
                  value={currentTick?.uniqueStudents ?? 0}
                />
                <SideStat
                  icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
                  label="Avg Engagement"
                  value={`${Math.round((currentTick?.avgEngagement ?? 0) * 100)}%`}
                />
                <SideStat
                  icon={<TrendingDown className="h-5 w-5 text-amber-500" />}
                  label="Baseline (last 3m)"
                  value={`${Math.round((currentTick?.baseline ?? 0) * 100)}%`}
                />
                <SideStat
                  icon={<Sparkles className="h-5 w-5 text-purple-500" />}
                  label="Total Alerts"
                  value={alerts.length}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alert Feed ({alerts.length})
          </CardTitle>
          <CardDescription>
            Live notifications when intervention is recommended. Auto-clears on reset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">
              No alerts yet — press Start to begin the simulation.
            </p>
          ) : (
            <AlertsFeed alerts={alerts} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SideStat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-muted p-2">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
