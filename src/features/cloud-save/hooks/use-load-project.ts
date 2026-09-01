// features/cloud-save/hooks/use-load-project.ts


"use client";

import { useCallback, useState } from "react";
import { useBuilderStore } from "@/core/store/builder-store";
import { createClient } from "@/core/supabase/client";
import { TreeNode } from "@/core/types/builder.types";

export function useLoadProject() {
  const loadProjectTree = useBuilderStore((s) => s.loadProjectTree);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(
    async (projectId: string) => {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("projects")
        .select("id, tree_data")
        .eq("id", projectId)
        .single();

      if (fetchError || !data) {
        console.error("[cloud-save] Tải project thất bại:", fetchError);
        setError("Không tìm thấy project, hoặc bạn không có quyền xem project này.");
        setIsLoading(false);
        return;
      }

      loadProjectTree(data.tree_data as TreeNode, data.id);
      setIsLoading(false);
    },
    [loadProjectTree]
  );

  return { loadProject, isLoading, error };
}
