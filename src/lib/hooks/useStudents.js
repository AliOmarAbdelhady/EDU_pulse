import { useMutation, useQuery } from "@tanstack/react-query";

export function useStudents(filters = {}) {
  return useQuery({
    queryKey: ["students", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/students?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });
}

export function useStudent(id) {
  return useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const res = await fetch(`/api/students/${id}`);
      if (!res.ok) throw new Error("Failed to fetch student");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useSendStudentNotification() {
  return useMutation({
    mutationFn: async ({ studentId, subject, message }) => {
      const res = await fetch(`/api/students/${studentId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send notification");
      }

      return data;
    },
  });
}
