import { useQuery } from "@tanstack/react-query";

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
  });
}
