"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  EMOTION_COLORS,
  getEmotionColor,
  getEmotionLabel,
  normalizeEmotionKey,
} from "@/lib/emotionDisplay";

export { EMOTION_COLORS };

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <div className="flex items-center gap-2 text-sm">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: data.payload.fill }}
        />
        <span className="font-medium">{data.name}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Count: <span className="font-medium text-foreground">{data.value}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Share: <span className="font-medium text-foreground">{data.payload.percent}%</span>
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

export default React.memo(function EmotionPieChart({
  data = [],
  height = 350,
  innerRadius = 60,
  outerRadius = 120,
}) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        emotion: normalizeEmotionKey(item.emotion),
        name: getEmotionLabel(item.emotion),
        fill: getEmotionColor(item.emotion),
      })),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="count"
          nameKey="name"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
});
