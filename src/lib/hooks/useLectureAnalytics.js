"use client";

import { useQuery } from "@tanstack/react-query";

export function useLectureAnalytics(lectureId) {
  return useQuery({
    queryKey: ["lecture-analytics", lectureId],
    queryFn: async () => {
      const res = await fetch(`/api/lectures/${lectureId}/analytics`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!lectureId,
  });
}
