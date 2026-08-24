
// src/app/page.tsx

"use client";

import { SaveProjectButton } from "@/features/cloud-save/components/save-project-button";
import { TreeView } from "@/features/nodes-tree/components/tree-view";
import { InspectorPanel } from "@/features/inspector/components/inspector-panel";
import { PreviewWorkspace } from "@/features/canvas-preview/components/preview-workspace";
import { CodeModal } from "@/features/code-generator/components/code-modal";
import { ExportProjectButton } from "@/features/export-project/components/export-project-button";
import { useTreeShortcuts } from "@/features/nodes-tree/hooks/use-tree-shortcuts";
import { ExportImageButton } from "@/features/export-image/components/export-image-button";
import { LoginButton } from "@/features/auth/components/login-button";
import { useBuilderStore } from "@/core/store/builder-store";
import { useEffect } from "react";
import { createClient } from "@/core/supabase/client";

export default function Home() {
  useTreeShortcuts();

  // Nếu Supabase redirect về trang chủ với ?code=..., cố gắng trao đổi code thành session
  // và xóa query param để tránh việc refresh gây lỗi đổi code lại.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("exchangeCodeForSession (client) failed:", error);
        } else {
          // Xóa query param `code` khỏi URL để tránh retry khi refresh
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (err) {
        console.error("Auth exchange error (client):", err);
      }
    })();
  }, []);

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
            <LoginButton />
            
            <SaveProjectButton />
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