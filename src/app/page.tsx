
// src/app/page.tsx

"use client";

import { TreeView } from "@/features/nodes-tree/components/tree-view";
import { InspectorPanel } from "@/features/inspector/components/inspector-panel";
import { PreviewWorkspace } from "@/features/canvas-preview/components/preview-workspace";
import { CodeModal } from "@/features/code-generator/components/code-modal";
import { ExportProjectButton } from "@/features/export-project/components/export-project-button";
import { useTreeShortcuts } from "@/features/nodes-tree/hooks/use-tree-shortcuts";
import { ExportImageButton } from "@/features/export-image/components/export-image-button";
import { useBuilderStore } from "@/core/store/builder-store";

export default function Home() {
  useTreeShortcuts();

  const menuHidden = useBuilderStore((s) => s.menuHidden);
  const toggleMenuHidden = useBuilderStore((s) => s.toggleMenuHidden);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {!menuHidden && (
        <aside className="fixed z-[30] w-50 border-r bg-white/68 flex flex-col shrink-0 ">
          <button
          onClick={toggleMenuHidden}
          className="fixed top-4 left-4 z-[60] bg-black/68 text-white text-xs px-3 py-2 rounded-full shadow-lg"
        >
          Scene Tree
        </button>
          <div className="flex items-center gap-2 p-3 border-b pt-16 flex-wrap">
  <CodeModal />
  <ExportImageButton />
  <ExportProjectButton />
</div>
          <TreeView />
        </aside>
      )}

      <main className="flex-1 relative">
        <PreviewWorkspace />
        {!menuHidden && <InspectorPanel />}
      </main>

      {/* Nút hiện lại menu khi đang ẩn — vì lúc đó không còn gì để bấm ngoài phím tắt */}
      {menuHidden && (
        <button
          onClick={toggleMenuHidden}
          className="fixed top-4 left-4 z-[60] bg-black/46 text-white text-xs px-3 py-2 rounded-full shadow-lg"
        >
          Scene Tree
        </button>
      )}
    </div>
  );
}