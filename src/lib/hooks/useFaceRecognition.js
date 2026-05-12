import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/attendance";

export function useFaceRecognition() {
  return useMutation({
    mutationFn: async ({ image, assignmentId }) => {
      const res = await fetch(`${API_BASE}/face-recognition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, assignmentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Face recognition failed");
      }
      return res.json();
    },
  });
}

export function useSubmitFaceAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, academicWeek, attendance }) => {
      const res = await fetch(`${API_BASE}/face-take`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, academicWeek, attendance }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save attendance");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["gradebook"] });
    },
  });
}
