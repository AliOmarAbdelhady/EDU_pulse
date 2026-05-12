"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DEFAULT_EMOTION_ORDER,
  EMOTION_COLORS,
  getEmotionColor,
  getEmotionLabel,
} from "@/lib/emotionDisplay";

export { EMOTION_COLORS };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
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

export default React.memo(function EmotionLineChart({
  data = [],
  emotions = [],
  height = 400,
  showGrid = true,
  showDots = true,
  curved = true,
}) {
  const displayEmotions = useMemo(() => {
    const keysInData = Array.from(
      new Set(
        data.flatMap((item) =>
          Object.keys(item).filter((key) => !["date", "name", "label"].includes(key))
        )
      )
    );
    if (emotions.length > 0) return emotions;
    if (keysInData.length > 0) return keysInData;
    return DEFAULT_EMOTION_ORDER;
  }, [data, emotions]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
        {displayEmotions.map((emotion) => (
          <Line
            key={emotion}
            type={curved ? "monotone" : "linear"}
            dataKey={emotion}
            name={getEmotionLabel(emotion)}
            stroke={getEmotionColor(emotion)}
            strokeWidth={2}
            dot={showDots ? { r: 3, strokeWidth: 2 } : false}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});
