// src/app/editor/page.tsx
"use client";

import React, { useState } from "react";
import SidebarPalette from "@/features/builder/components/sidebar-palette";
import Inspector from "@/features/builder/components/inspector";
import WireframeCanvas from "@/features/builder/components/wireframe-canvas";

// Định nghĩa cấu trúc cơ bản cho các khối UI (Block) trong MVP
export interface CanvasBlock {
  id: string;
  type: "button" | "card" | "container";
  content: string;
  variant?: string;
  color?: string;
  width?: string;
  height?: string;
}

export default function EditorPage() {
  const [blocks, setBlocks] = useState<CanvasBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Tìm block đang được chọn để hiển thị/chỉnh sửa trên Inspector
  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

  // Xử lý khi thả một component mới vào canvas
  const handleDrop = (type: "button" | "card" | "container") => {
    const newBlock: CanvasBlock = {
      id: `block-${Date.now()}`,
      type,
      content: `${type.charAt(0).toUpperCase() + type.slice(1)} Sample`,
      width: "w-auto",
      height: "h-auto",
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id); // Tự động chọn block vừa thêm
  };

  // Cập nhật thuộc tính của block đang chọn từ Inspector
  const updateBlock = (key: keyof CanvasBlock, value: any) => {
    if (!selectedId) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === selectedId ? { ...b, [key]: value } : b))
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden relative font-sans">
      {/* 1. Bảng điều khiển Inspector (Đặt ở phía trên cùng, nổi bật) */}
      <Inspector selectedBlock={selectedBlock} onUpdate={updateBlock} />

      {/* 2. Vùng Canvas (Vẽ Wireframe ở giữa, chiếm tối đa không gian) */}
      <WireframeCanvas
        blocks={blocks}
        selectedId={selectedId}
        onSelectBlock={setSelectedId}
      />

      {/* 3. Sidebar chứa thư viện Component có hỗ trợ kéo thả & kính mờ */}
      <SidebarPalette onDropComponent={handleDrop} />
    </div>
  );
}
