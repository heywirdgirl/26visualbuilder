// features/canvas-preview/utils/capture-image.ts

import { toPng } from "html-to-image";

export interface CaptureOptions {
  pixelRatio?: number; // 1 | 2 | 3 — độ phân giải, Phase 3 cho chọn
  backgroundColor?: string;
}

// html-to-image đọc getComputedStyle() của TỪNG phần tử rồi inline trực tiếp vào bản clone
// trước khi vẽ ra canvas — không quan tâm CSS nằm ở document hay Shadow DOM adoptedStyleSheets,
// nên xuyên qua được ShadowRootWrapper mà html2canvas (đọc document.styleSheets) không làm được.
export async function captureNodeToPng(
  node: HTMLElement,
  options: CaptureOptions = {}
): Promise<string> {
  const { pixelRatio = 2, backgroundColor = "#ffffff" } = options;
  return toPng(node, { pixelRatio, backgroundColor, cacheBust: true });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}