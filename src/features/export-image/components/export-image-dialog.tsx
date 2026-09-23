// features/export-image/components/export-image-dialog.tsx

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/core/utils/cn";
import { useExportImage } from "../hooks/use-export-image";

const RESOLUTION_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
];

// Dialog ĐỘC LẬP — không nằm bên trong DropdownMenuContent nào cả, nên không bị unmount
// theo khi menu đóng. AppShell chỉ cần setOpen(true) từ 1 DropdownMenuItem bình thường.
export function ExportImageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { exportImage, isExporting, canExport } = useExportImage();
  const [pixelRatio, setPixelRatio] = useState<1 | 2 | 3>(2);

  const handleExportClick = async () => {
    await exportImage(pixelRatio);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs z-[7000]">
        <DialogHeader>
          <DialogTitle>Export Image</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-medium mb-1.5">Độ phân giải</p>
            <div className="flex gap-1">
              {RESOLUTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPixelRatio(opt.value)}
                  className={cn(
                    "flex-1 border rounded py-1.5 text-xs",
                    pixelRatio === opt.value && "bg-primary/10 border-primary text-primary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Ảnh dùng link từ domain ngoài (không bật CORS) có thể bị trắng/thiếu trong file xuất ra.
          </p>

          <Button size="sm" onClick={handleExportClick} disabled={isExporting || !canExport}>
            {isExporting ? "Đang xuất..." : `Xuất ảnh (${pixelRatio}x)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}