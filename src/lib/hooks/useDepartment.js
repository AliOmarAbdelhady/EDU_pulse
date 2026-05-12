import { useQuery } from "@tanstack/react-query";

export function useDepartment(id) {
  return useQuery({
    queryKey: ["department", id],
    queryFn: async () => {
      const res = await fetch(`/api/departments/${id}`);
      if (!res.ok) throw new Error("Failed to fetch department");
      return res.json();
    },
    enabled: !!id,
  });
}
