import { useQuery } from "@tanstack/react-query";

export function useEmotions(filters = {}) {
  return useQuery({
    queryKey: ["emotions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.lectureId) params.set("lectureId", filters.lectureId);
      if (filters.studentId) params.set("studentId", filters.studentId);
      if (filters.emotion) params.set("emotion", filters.emotion);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const res = await fetch(`/api/emotions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch emotions");
      return res.json();
    },
  });
}

export function useEmotionFrequency(filters = {}) {
  return useQuery({
    queryKey: ["emotion-frequency", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/emotions/frequency?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch frequency data");
      return res.json();
    },
  });
}

export function useEmotionTrends(filters = {}) {
  return useQuery({
    queryKey: ["emotion-trends", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/emotions/trends?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch trend data");
      return res.json();
    },
  });
}

export function useEmotionLectureBreakdown(filters = {}) {
  return useQuery({
    queryKey: ["emotion-lecture-breakdown", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/emotions/lectures?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch lecture emotion data");
      return res.json();
    },
  });
}
