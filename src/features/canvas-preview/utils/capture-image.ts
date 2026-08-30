// features/canvas-preview/utils/capture-image.ts

import { toPng,toCanvas } from "html-to-image";

export interface CaptureOptions {
  pixelRatio?: number; // 1 | 2 | 3 — độ phân giải, Phase 3 cho chọn
  backgroundColor?: string;
}

// html-to-image đọc getComputedStyle() của TỪNG phần tử rồi inline trực tiếp vào bản clone
// trước khi vẽ ra canvas — không quan tâm CSS nằm ở document hay Shadow DOM adoptedStyleSheets,
// nên xuyên qua được ShadowRootWrapper mà html2canvas (đọc document.styleSheets) không làm được.

// ...captureNodeToPng giữ nguyên...

// WebP cho thumbnail Post — nhẹ hơn PNG, giữ cạnh sắc tốt hơn JPEG (phù hợp screenshot UI).
export async function captureNodeToWebp(
  node: HTMLElement,
  options: CaptureOptions & { quality?: number } = {}
): Promise<string> {
  const { pixelRatio = 2, backgroundColor = "#ffffff", quality = 0.85 } = options;
  const canvas = await toCanvas(node, { pixelRatio, backgroundColor, cacheBust: true });
  return canvas.toDataURL("image/webp", quality);
}


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