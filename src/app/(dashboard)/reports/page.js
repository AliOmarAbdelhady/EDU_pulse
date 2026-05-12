"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Sparkles,
  X,
  Loader2,
  FileDown,
} from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useReports, useCreateReport } from "@/lib/hooks/useReports";
import { useCourses } from "@/lib/hooks/useCourses";
import { useDepartments } from "@/lib/hooks/useDepartments";
import { useStudents } from "@/lib/hooks/useStudents";
import { useLectures } from "@/lib/hooks/useLectures";

const reportTypes = [
  { value: "engagement", label: "Engagement Report", description: "Student engagement scores and trends" },
  { value: "emotion", label: "Emotion Analysis", description: "Emotion distribution and patterns" },
  { value: "attendance", label: "Attendance Report", description: "Student attendance records" },
  { value: "performance", label: "Performance Summary", description: "Overall academic performance metrics" },
];

const statusColors = {
  READY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  GENERATING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function mapStatus(dbStatus) {
  switch (dbStatus) {
    case "completed":
      return "READY";
    case "generating":
      return "GENERATING";
    case "failed":
      return "FAILED";
    default:
      return "READY";
  }
}

function getReportTypeLabel(type) {
  const found = reportTypes.find((t) => t.value === type);
  return found ? found.label : type;
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div>
            <Skeleton className="h-7 w-10 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-5 rounded" />
        <div>
          <Skeleton className="h-4 w-48 mb-1" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  );
}

export default function ReportsPage() {
  const { id: userId } = useCurrentUser();
  const { data: reportsData, isLoading: reportsLoading, isError: reportsError, refetch: refetchReports } = useReports(userId);
  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  const { data: departmentsData, isLoading: departmentsLoading } = useDepartments();
  const { data: studentsData, isLoading: studentsLoading } = useStudents();
  const { data: lecturesData, isLoading: lecturesLoading } = useLectures();
  const createReportMutation = useCreateReport();

  const [reportType, setReportType] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [summaryPanel, setSummaryPanel] = useState(null); // { reportId, title, data } | null
  const [summarizing, setSummarizing] = useState(null);   // reportId being summarized
  const [summaryError, setSummaryError] = useState(null);

  const handleSummarize = useCallback(async (report) => {
    const rid = report.reportId || report.id;
    setSummarizing(rid);
    setSummaryError(null);
    setSummaryPanel(null);
    try {
      const res = await fetch(`/api/reports/${rid}/summarize`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Summarization failed");
      setSummaryPanel({ reportId: rid, title: report.title || report.typeLabel, data });
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setSummarizing(null);
    }
  }, []);

  const entitiesLoading = coursesLoading || departmentsLoading || studentsLoading || lecturesLoading;

  const entityOptions = useMemo(() => {
    switch (entityType) {
      case "course":
        return (coursesData || []).map((course) => ({
          id: course.courseId,
          label: `${course.courseCode} - ${course.courseName}`,
        }));
      case "department":
        return (departmentsData || []).map((dept) => ({
          id: dept.departmentId,
          label: dept.departmentName,
        }));
      case "student":
        return (studentsData || []).map((student) => ({
          id: student.studentId,
          label: `${student.fullName} (${student.studentCode})`,
        }));
      case "lecture":
        return (lecturesData || []).map((lecture) => ({
          id: lecture.lectureId,
          label: lecture.lectureName,
        }));
      default:
        return [];
    }
  }, [entityType, coursesData, departmentsData, studentsData, lecturesData]);

  const recentReports = useMemo(() => {
    if (!reportsData) return [];
    return reportsData.map((report) => ({
      ...report,
      displayStatus: mapStatus(report.report_status),
      typeLabel: getReportTypeLabel(report.report_type),
    }));
  }, [reportsData]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return recentReports.filter((r) => {
      const d = new Date(r.createdAt || r.created_at || r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [recentReports]);

  const handleGenerate = () => {
    createReportMutation.mutate({
      generatedBy: userId,
      reportType,
      entityType,
      entityId,
      startDate,
      endDate,
    });
  };

  if (reportsError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            Failed to load reports.
          </p>
          <Button variant="outline" onClick={() => refetchReports()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and download various analytical reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{reportTypes.length}</p>
                      <p className="text-sm text-muted-foreground">Report Types</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{recentReports.length}</p>
                      <p className="text-sm text-muted-foreground">Reports Generated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{thisMonthCount}</p>
                      <p className="text-sm text-muted-foreground">This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Generator
            </CardTitle>
            <CardDescription>
              Select report type, date range, and entity to generate a custom report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Report Type *</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={entityType} onValueChange={(val) => { setEntityType(val); setEntityId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="lecture">Lecture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entity</Label>
                <Select value={entityId} onValueChange={setEntityId} disabled={!entityType || entitiesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      entitiesLoading
                        ? "Loading..."
                        : entityType
                        ? "Select entity"
                        : "Select entity type first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {entityOptions.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="invisible">Actions</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="endDate" className="text-xs">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                onClick={handleGenerate}
                disabled={!reportType || createReportMutation.isPending}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {createReportMutation.isPending ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Reports
            </CardTitle>
            <CardDescription>
              Recently generated reports available for download.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportsLoading ? (
                <>
                  <ReportSkeleton />
                  <ReportSkeleton />
                  <ReportSkeleton />
                </>
              ) : recentReports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No reports generated yet.
                </p>
              ) : (
                recentReports.map((report) => (
                  <div
                    key={report.id || report.reportId}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{report.title || report.typeLabel}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.createdAt || report.created_at || report.date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[report.displayStatus] || ""} variant="outline">
                        {report.displayStatus}
                      </Badge>
                      {report.displayStatus === "READY" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Summarize with AI"
                            disabled={summarizing === (report.reportId || report.id)}
                            onClick={() => handleSummarize(report)}
                          >
                            {summarizing === (report.reportId || report.id)
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Sparkles className="h-4 w-4 text-purple-500" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Download PDF report"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = `/api/reports/${report.reportId || report.id}/pdf`;
                              a.click();
                            }}
                          >
                            <FileDown className="h-4 w-4 text-rose-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Download raw CSV"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = `/api/reports/${report.reportId || report.id}/download`;
                              a.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        {/* Error banner */}
        {summaryError && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-lg border border-red-400 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
            <span><AlertCircle className="inline h-4 w-4 mr-1" />{summaryError}</span>
            <Button variant="ghost" size="icon" onClick={() => setSummaryError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Summary panel */}
        {summaryPanel && (
          <Card className="border-purple-400 dark:border-purple-700">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI Summary — {summaryPanel.title}
                </CardTitle>
                <CardDescription>Generated by facebook/bart-large-cnn</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSummaryPanel(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary text */}
              <p className="text-sm leading-relaxed">{summaryPanel.data.summary}</p>

              {/* Insights */}
              {summaryPanel.data.insights?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Insights</p>
                  <ul className="space-y-1">
                    {summaryPanel.data.insights.map((ins, i) => (
                      <li key={i} className="text-sm">{ins}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metrics */}
              {summaryPanel.data.metrics && Object.keys(summaryPanel.data.metrics).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Metrics</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(summaryPanel.data.metrics)
                      .filter(([, v]) => typeof v !== "object")
                      .map(([k, v]) => (
                        <div key={k} className="rounded-lg border p-3 text-center">
                          <p className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, " ")}</p>
                          <p className="text-lg font-bold">{typeof v === "number" ? Number(v.toFixed(2)) : String(v)}</p>
                        </div>
                      ))}
                  </div>
                  {/* Emotion distribution */}
                  {summaryPanel.data.metrics.emotion_distribution && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(summaryPanel.data.metrics.emotion_distribution).map(([emotion, count]) => (
                        <Badge key={emotion} variant="outline">
                          {emotion}: {count}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
