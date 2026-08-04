// features/export-project/components/export-project-button.tsx


"use client";

import { Button } from "@/components/ui/button";
import { FolderDown } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { useExportProject } from "../hooks/use-export-project";

export function ExportProjectButton() {
  const tree = useBuilderStore((s) => s.tree);
  const { exportProjectZip, isExporting } = useExportProject();

  const handleClick = () => {
    const defaultName = String((tree.props as { name?: string }).name ?? "My Project");
    // Tạm dùng window.prompt — cùng kiểu tạm với New Page/Folder/Component (V1.9), thay
    // bằng dialog đẹp hơn nếu sau này bạn vẽ mockup riêng cho luồng đặt tên project.
    const name = window.prompt("Tên project:", defaultName);
    if (name && name.trim()) exportProjectZip(name.trim());
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isExporting}>
      <FolderDown className="h-3.5 w-3.5 mr-1.5" />
      {isExporting ? "Đang xuất..." : "Export Project"}
    </Button>
  );
}
