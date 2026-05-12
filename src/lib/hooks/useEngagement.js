import { useQuery } from "@tanstack/react-query";

export function useEngagement(filters = {}) {
  return useQuery({
    queryKey: ["engagement", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/engagement?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch engagement data");
      return res.json();
    },
  });
}
