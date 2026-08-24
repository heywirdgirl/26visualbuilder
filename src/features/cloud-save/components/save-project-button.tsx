// features/cloud-save/components/save-project-button.tsx



"use client";

import { Button } from "@/components/ui/button";
import { CloudUpload, Loader2, Check } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { useSaveProject } from "../hooks/use-save-project";

export function SaveProjectButton() {
  const user = useBuilderStore((s) => s.user);
  const { saveProject, isSaving, justSaved } = useSaveProject();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={saveProject}
      disabled={!user || isSaving}
      title={!user ? "Đăng nhập để lưu project lên Cloud" : "Lưu project lên Cloud"}
    >
      {isSaving ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : justSaved ? (
        <Check className="mr-1.5 h-3.5 w-3.5" />
      ) : (
        <CloudUpload className="mr-1.5 h-3.5 w-3.5" />
      )}
      {isSaving ? "Đang lưu..." : justSaved ? "Đã lưu!" : "Save"}
    </Button>
  );
}
