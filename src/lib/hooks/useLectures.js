import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useLectures(filters = {}) {
  return useQuery({
    queryKey: ["lectures", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/lectures?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch lectures");
      return res.json();
    },
  });
}

export function useLecture(id) {
  return useQuery({
    queryKey: ["lecture", id],
    queryFn: async () => {
      const res = await fetch(`/api/lectures/${id}`);
      if (!res.ok) throw new Error("Failed to fetch lecture");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateLecture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to create lecture");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lectures"] });
    },
  });
}
