import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useLectureContent(filters = {}) {
  return useQuery({
    queryKey: ["lecture-content", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.assignmentId) params.set("assignmentId", filters.assignmentId);
      if (filters.academicWeek) params.set("academicWeek", filters.academicWeek);
      if (filters.search) params.set("search", filters.search);
      const res = await fetch(`/api/lecture-content?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch lecture content");
      return res.json();
    },
  });
}

export function useUploadLectureContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, assignmentId, academicWeek, title, description }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentId", String(assignmentId));
      formData.append("academicWeek", String(academicWeek));
      formData.append("title", title);
      if (description) formData.append("description", description);
      const res = await fetch("/api/lecture-content/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to upload content");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lecture-content"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteLectureContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contentId) => {
      const res = await fetch(`/api/lecture-content/${contentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to delete content");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lecture-content"] });
    },
  });
}
