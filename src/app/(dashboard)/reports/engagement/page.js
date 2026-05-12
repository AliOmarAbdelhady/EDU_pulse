"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import dynamic from "next/dynamic";

const ChartContainer = dynamic(
  () => import("@/components/charts/ChartContainer"),
  { ssr: false, loading: () => <div className="h-[200px] w-full animate-pulse rounded-xl bg-muted/50" /> }
);
import { useEngagement } from "@/lib/hooks/useEngagement";

const categoryColors = {
  HIGH: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  LOW: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function percent(value) {
  return Math.round(Number(value || 0));
}

function categoryFor(score) {
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

function TrendIcon({ trend }) {
  switch (trend) {
    case "UP":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "DOWN":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

function EngagementTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EngagementReportsPage() {
  const { data, isLoading, error, refetch } = useEngagement({});

  const rows = useMemo(() => {
    return (data?.studentBreakdown || []).map((item) => {
      const score = percent(item.avgEngagement);
      const attention = percent(item.avgFocus);

      return {
        id: item.studentId || item.studentCode,
        student: item.fullName || "Unknown student",
        studentId: item.studentCode || String(item.studentId || ""),
        course: item.courseCodes?.length ? item.courseCodes.join(", ") : "N/A",
        score,
        attention,
        category: item.category || categoryFor(score),
        trend: item.trend || "STABLE",
        lectures: item.lectureCount || 0,
        records: item.recordCount || 0,
      };
    });
  }, [data]);

  const summary = useMemo(() => {
    const averageEngagement =
      data?.summary?.avgEngagementScore !== null &&
      data?.summary?.avgEngagementScore !== undefined
        ? percent(data.summary.avgEngagementScore)
        : percent(rows.reduce((sum, row) => sum + row.score, 0) / (rows.length || 1));

    return {
      averageEngagement,
      high: rows.filter((row) => row.category === "HIGH").length,
      medium: rows.filter((row) => row.category === "MEDIUM").length,
      low: rows.filter((row) => row.category === "LOW").length,
    };
  }, [data, rows]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Engagement Reports</h1>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">
            {error.message || "Failed to load engagement data"}
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
    <div>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Engagement Reports</h1>
          <p className="text-muted-foreground">
            Detailed engagement analysis and scores from saved emotion records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <Skeleton className="h-14 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summary.averageEngagement}%</p>
                    <p className="text-sm text-muted-foreground">Average Engagement</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{summary.high}</p>
                    <p className="text-sm text-muted-foreground">High Engagement</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{summary.medium}</p>
                    <p className="text-sm text-muted-foreground">Medium Engagement</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{summary.low}</p>
                    <p className="text-sm text-muted-foreground">Low Engagement</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
        ) : (
          <ChartContainer
            title="Engagement Overview"
            description="Average engagement and focus per student from the database"
          >
            {rows.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={rows.slice(0, 20)}
                  margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="student"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={70}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip content={<EngagementTooltip />} />
                  <Bar dataKey="score" name="Engagement" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attention" name="Focus" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No engagement records found</p>
                </div>
              </div>
            )}
          </ChartContainer>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Engagement Details</CardTitle>
                <CardDescription>
                  Individual engagement metrics calculated from emotion records.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled={rows.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead className="text-center">Lectures</TableHead>
                      <TableHead className="text-center">Engagement</TableHead>
                      <TableHead className="text-center">Focus</TableHead>
                      <TableHead className="text-center">Category</TableHead>
                      <TableHead className="text-center">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                          No engagement records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.student}</TableCell>
                          <TableCell className="font-mono text-sm">{row.studentId}</TableCell>
                          <TableCell>{row.course}</TableCell>
                          <TableCell className="text-center">{row.lectures}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-sky-500"
                                  style={{ width: `${row.score}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-10">{row.score}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-violet-500"
                                  style={{ width: `${row.attention}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-10">{row.attention}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={categoryColors[row.category] || ""} variant="outline">
                              {row.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <TrendIcon trend={row.trend} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
