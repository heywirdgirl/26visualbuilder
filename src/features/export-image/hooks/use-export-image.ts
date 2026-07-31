// features/export-image/hooks/use-export-image.ts



"use client";

import { useState } from "react";
import { useBuilderStore, useActivePage } from "@/core/store/builder-store";
import { captureNodeToPng, downloadDataUrl } from "@/features/canvas-preview/utils/capture-image";
import { slugifyPathSegment } from "@/features/code-generator/utils/path-utils";

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export function useExportImage() {
  const previewContainerEl = useBuilderStore((s) => s.previewContainerEl);
  const activeNodeId = useBuilderStore((s) => s.activeNodeId);
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);
  const setHighlightReferenceId = useBuilderStore((s) => s.setHighlightReferenceId);
  const activePage = useActivePage();
  const [isExporting, setIsExporting] = useState(false);

  const canExport = !!previewContainerEl && !!activePage;

  const exportImage = async (pixelRatio: 1 | 2 | 3) => {
    if (!previewContainerEl || !activePage || isExporting) return;
    setIsExporting(true);

    const previousActiveNodeId = activeNodeId;
    setActiveNode(null);
    setHighlightReferenceId(null);
    await nextFrame();
    await nextFrame();

    try {
      const dataUrl = await captureNodeToPng(previewContainerEl, { pixelRatio });
      const pageName = String((activePage.props as { name?: string }).name ?? "page");
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadDataUrl(dataUrl, `${slugifyPathSegment(pageName)}-${pixelRatio}x-${dateStr}.png`);
    } catch (err) {
      console.error("Export image thất bại:", err);
      window.alert("Không thể xuất ảnh — thử lại hoặc kiểm tra console để biết chi tiết.");
    } finally {
      setActiveNode(previousActiveNodeId);
      setIsExporting(false);
    }
  };

  return { exportImage, isExporting, canExport };
}
