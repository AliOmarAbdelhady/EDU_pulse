"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { useEmotionTrends } from "@/lib/hooks/useEmotions";
import EmotionLineChart from "@/components/charts/EmotionLineChart";

const StudentEngagementChart = React.memo(function StudentEngagementChart({
  userId,
}) {
  const { data: trendsData, isLoading: trendsLoading } = useEmotionTrends(
    userId ? { studentId: userId } : {}
  );

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">Weekly Engagement Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {trendsLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : trendsData && trendsData.length > 0 ? (
          <EmotionLineChart
            data={trendsData}
            emotions={["Happy", "Neutral", "Confused", "Bored"]}
            height={256}
          />
        ) : (
          <div className="h-64 flex items-center justify-center bg-muted rounded-lg border border-dashed border-border">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-10 w-10 mx-auto mb-2" />
              <p className="text-sm">No engagement data yet</p>
              <p className="text-xs mt-1">Attend lectures to see your trends</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default StudentEngagementChart;
