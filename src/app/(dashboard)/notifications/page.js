"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BellOff,
  Check,
  AlertTriangle,
  Info,
  AlertCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useNotifications, useMarkNotificationRead } from "@/lib/hooks/useNotifications";

const severityConfig = {
  INFO: {
    icon: Info,
    color: "bg-primary/15 text-primary",
    borderColor: "border-l-primary",
  },
  SUCCESS: {
    icon: Check,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    borderColor: "border-l-green-500",
  },
  WARNING: {
    icon: AlertTriangle,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    borderColor: "border-l-yellow-500",
  },
  ERROR: {
    icon: XCircle,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    borderColor: "border-l-red-500",
  },
};

function mapSeverity(dbSeverity) {
  switch (dbSeverity) {
    case "info":
      return "INFO";
    case "warning":
      return "WARNING";
    case "critical":
      return "ERROR";
    default:
      return "INFO";
  }
}

function mapNotification(recipient) {
  const alert = recipient.alert || {};
  const sender = alert.triggeredByUser || {};
  const senderName =
    sender.lecturer?.fullName ||
    sender.admin?.fullName ||
    sender.username ||
    sender.email ||
    null;

  return {
    id: recipient.recipientId,
    alertId: recipient.alertId,
    type: alert.alertType || "SYSTEM",
    title: alert.title || "Untitled",
    message: alert.message || "",
    severity: mapSeverity(alert.severity),
    isRead: recipient.isRead,
    createdAt: recipient.createdAt,
    lectureName: alert.lecture?.lectureName || null,
    senderName,
  };
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div>
            <Skeleton className="h-7 w-10 mb-1" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border">
      <Skeleton className="h-5 w-5 rounded mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { id: userId } = useCurrentUser();
  const { data: recipients, isLoading, isError, refetch } = useNotifications(userId);
  const markReadMutation = useMarkNotificationRead();

  const notifications = useMemo(() => {
    if (!recipients) return [];
    return recipients.map(mapNotification);
  }, [recipients]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const warningCount = useMemo(
    () => notifications.filter((n) => n.severity === "WARNING").length,
    [notifications]
  );

  const errorCount = useMemo(
    () => notifications.filter((n) => n.severity === "ERROR").length,
    [notifications]
  );

  const handleMarkAsRead = (id) => {
    markReadMutation.mutate({ id });
  };

  const handleMarkAllRead = () => {
    const unread = notifications.filter((n) => !n.isRead);
    unread.forEach((n) => {
      markReadMutation.mutate({ id: n.id });
    });
  };

  if (isError) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            Failed to load notifications.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated on engagement alerts, emotion detections, and system events.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <>
                <Badge variant="secondary">{unreadCount} unread</Badge>
                <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark all as read
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Bell className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{notifications.length}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{warningCount}</p>
                      <p className="text-sm text-muted-foreground">Warnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{errorCount}</p>
                      <p className="text-sm text-muted-foreground">Critical</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <BellOff className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{unreadCount}</p>
                      <p className="text-sm text-muted-foreground">Unread</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              Recent alerts and system notifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <>
                  <NotificationSkeleton />
                  <NotificationSkeleton />
                  <NotificationSkeleton />
                  <NotificationSkeleton />
                </>
              ) : notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No notifications found.
                </p>
              ) : (
                notifications.map((notification) => {
                  const config = severityConfig[notification.severity] || severityConfig.INFO;
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-start gap-4 p-4 rounded-lg border border-l-4 ${config.borderColor} ${
                        !notification.isRead ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="mt-0.5">
                        <Icon className={`h-5 w-5 ${
                          notification.severity === "WARNING"
                            ? "text-yellow-500"
                            : notification.severity === "ERROR"
                            ? "text-red-500"
                            : notification.severity === "SUCCESS"
                            ? "text-green-500"
                            : "text-primary"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${!notification.isRead ? "font-semibold" : ""}`}>
                            {notification.title}
                          </h4>
                          <Badge className={config.color} variant="outline" style={{ fontSize: "0.7rem" }}>
                            {notification.severity}
                          </Badge>
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {new Date(notification.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {notification.lectureName && (
                            <span>Lecture: {notification.lectureName}</span>
                          )}
                          {notification.senderName && (
                            <span>From: {notification.senderName}</span>
                          )}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Read
                        </Button>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
