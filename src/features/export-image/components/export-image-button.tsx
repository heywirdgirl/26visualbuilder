//  features/export-image/components/export-image-button.tsx



"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ImageDown } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { useExportImage } from "../hooks/use-export-image";

const RESOLUTION_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
];

export function ExportImageButton() {
  const { exportImage, isExporting, canExport } = useExportImage();
  const [pixelRatio, setPixelRatio] = useState<1 | 2 | 3>(2);
  const [open, setOpen] = useState(false);

  const handleExportClick = async () => {
    await exportImage(pixelRatio);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={!canExport}>
          <ImageDown className="h-3.5 w-3.5 mr-1.5" />
          Export Image
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 flex flex-col gap-3">
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
          Ảnh dùng link từ domain ngoài (không bật CORS) có thể bị trắng/thiếu trong file xuất ra — giới hạn chung của kỹ thuật chụp DOM, không riêng gì app này.
        </p>

        <Button size="sm" onClick={handleExportClick} disabled={isExporting}>
          {isExporting ? "Đang xuất..." : `Xuất ảnh (${pixelRatio}x)`}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
