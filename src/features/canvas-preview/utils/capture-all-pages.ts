import { useBuilderStore, getPageNodes } from "@/core/store/builder-store";
import { captureNodeToWebp, CaptureOptions } from "./capture-image";
import { PageCapture } from "@/core/types/page-capture.types";

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

// Chụp TUẦN TỰ mọi Page — KHÔNG chạy song song, vì mọi Page dùng chung 1 Canvas DOM
// thật duy nhất (đổi activePageId để hiện đúng nội dung); chụp song song sẽ khiến các
// request tranh nhau đổi cùng 1 DOM, dễ đọc nhầm ảnh giữa các trang.
export async function captureAllPagesClean(options?: CaptureOptions): Promise<PageCapture[] | null> {
  const {
    tree,
    previewContainerEl,
    activePageId: originalActivePageId,
    activeNodeId: originalActiveNodeId,
    setActivePage,
    setActiveNode,
    setHighlightReferenceId,
  } = useBuilderStore.getState();

  if (!previewContainerEl) return null;

  const pages = getPageNodes(tree);
  if (pages.length === 0) return [];

  setActiveNode(null);
  setHighlightReferenceId(null);

  const results: PageCapture[] = [];

  try {
    for (const page of pages) {
      setActivePage(page.id);
      // 2 animation frame để chắc chắn React re-render xong Page mới + browser đã paint
      // thật trước khi chụp — cùng kỹ thuật đã dùng ở captureActivePageClean() (V3).
      await nextFrame();
      await nextFrame();

      const dataUrl = await captureNodeToWebp(previewContainerEl, options);
      const pageName = String((page.props as { name?: string }).name ?? "Page");
      results.push({ pageId: page.id, pageName, dataUrl });
    }
  } finally {
    // Khôi phục đúng trang + lựa chọn gốc — đóng lại /post phải thấy Canvas y hệt
    // trước khi bấm Post, không bị "kẹt" ở trang cuối cùng vừa chụp.
    setActivePage(originalActivePageId ?? pages[0].id);
    setActiveNode(originalActiveNodeId);
  }

  return results;
}
