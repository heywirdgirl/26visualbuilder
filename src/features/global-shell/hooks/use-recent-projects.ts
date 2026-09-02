"use client";

import { useCallback } from "react";
import { useBuilderStore } from "@/core/store/builder-store";
import { createClient } from "@/core/supabase/client";

export function useRecentProjects() {
  const setRecentProjects = useBuilderStore((s) => s.setRecentProjects);
  const setProjectsLoading = useBuilderStore((s) => s.setProjectsLoading);
  const setProjectsError = useBuilderStore((s) => s.setProjectsError);

  const fetchRecentProjects = useCallback(async () => {
    const { user } = useBuilderStore.getState();
    if (!user) return;

    setProjectsLoading(true);
    setProjectsError(null);

    const supabase = createClient();
    const { data, count, error } = await supabase
      .from("projects")
      .select("id, name, description, thumbnail_url, updated_at", { count: "exact" })
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[global-shell] Tải danh sách project thất bại:", error);
      setProjectsError("Không tải được danh sách project.");
      setProjectsLoading(false);
      return;
    }

    setRecentProjects(data ?? [], count ?? 0);
    setProjectsLoading(false);
  }, [setRecentProjects, setProjectsLoading, setProjectsError]);

  return { fetchRecentProjects };
}
