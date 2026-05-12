import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCourses(filters = {}) {
  return useQuery({
    queryKey: ["courses", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });
}

export function useCourse(id) {
  return useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error("Failed to fetch course");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCourseGradebook(courseId, assignmentId) {
  return useQuery({
    queryKey: ["course-gradebook", courseId, assignmentId || "default"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (assignmentId) params.set("assignmentId", assignmentId);

      const query = params.toString();
      const res = await fetch(
        `/api/courses/${courseId}/gradebook${query ? `?${query}` : ""}`
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to fetch gradebook");
      }

      return res.json();
    },
    enabled: !!courseId,
  });
}

export function useUpdateCourseGradebook(courseId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch(`/api/courses/${courseId}/gradebook`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to update gradebook");
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["course-gradebook", courseId, String(data.assignment.assignmentId)],
        data
      );
      queryClient.setQueryData(["course-gradebook", courseId, "default"], data);
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
