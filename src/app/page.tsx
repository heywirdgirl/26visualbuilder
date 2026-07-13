
// src/app/page.tsx

"use client";

import { TreeView } from "@/features/nodes-tree/components/tree-view";
import { InspectorPanel } from "@/features/inspector/components/inspector-panel";
import { PreviewWorkspace } from "@/features/canvas-preview/components/preview-workspace";
import { CodeModal } from "@/features/code-generator/components/code-modal";
import { useTreeShortcuts } from "@/features/nodes-tree/hooks/use-tree-shortcuts";
import { useBuilderStore } from "@/core/store/builder-store";

export default function Home() {
  useTreeShortcuts();

  const menuHidden = useBuilderStore((s) => s.menuHidden);
  const toggleMenuHidden = useBuilderStore((s) => s.toggleMenuHidden);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {!menuHidden && (
        <aside className="w-64 border-r bg-white flex flex-col shrink-0">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="text-sm font-semibold">Scene Tree</span>
            <CodeModal />
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
          className="fixed bottom-4 right-4 z-[60] bg-black text-white text-xs px-3 py-2 rounded-full shadow-lg"
        >
          Hiện Menu (Ctrl+\)
        </button>
      )}
    </div>
  );
}