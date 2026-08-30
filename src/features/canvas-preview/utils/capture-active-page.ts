
// Thành:
import { captureNodeToWebp, CaptureOptions } from "./capture-image";
import { useBuilderStore } from "@/core/store/builder-store";

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function captureActivePageClean(options?: CaptureOptions): Promise<string | null> {
  const { previewContainerEl, activeNodeId, setActiveNode, setHighlightReferenceId } =
    useBuilderStore.getState();
  if (!previewContainerEl) return null;

  setActiveNode(null);
  setHighlightReferenceId(null);
  await nextFrame();
  await nextFrame();

  try {
    return await captureNodeToWebp(previewContainerEl, options);

  } finally {
    setActiveNode(activeNodeId);
  }
}
