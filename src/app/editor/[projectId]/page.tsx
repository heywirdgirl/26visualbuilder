// src/app/editor/[projectId]/page.tsx


"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { useLoadProject } from "@/features/cloud-save/hooks/use-load-project";

export default function EditorPage() {
  const params = useParams<{ projectId: string }>();
  const { loadProject, isLoading, error } = useLoadProject();

  useEffect(() => {
    if (params.projectId) void loadProject(params.projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.projectId]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-sm text-muted-foreground">
        Đang tải project...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-center">
        <div>
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <a href="/projects" className="text-sm text-primary underline">
            Quay lại danh sách project
          </a>
        </div>
      </div>
    );
  }

  return <AppShell />;
}
