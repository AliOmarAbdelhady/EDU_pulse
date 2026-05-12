import { useQuery } from "@tanstack/react-query";

export function useAdminStats() {
  return useQuery({
    queryKey: ["stats", "admin"],
    queryFn: async () => {
      const res = await fetch("/api/stats/admin");
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useLecturerStats(userId) {
  return useQuery({
    queryKey: ["stats", "lecturer", userId],
    queryFn: async () => {
      const res = await fetch(`/api/stats/lecturer?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch lecturer stats");
      return res.json();
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStudentStats(userId) {
  return useQuery({
    queryKey: ["stats", "student", userId],
    queryFn: async () => {
      const res = await fetch(`/api/stats/student?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch student stats");
      return res.json();
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
