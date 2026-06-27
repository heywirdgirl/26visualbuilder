// src/features/builder/components/wireframe-canvas.tsx
import React from "react";
import { CanvasBlock } from "@/app/editor/page";

interface WireframeCanvasProps {
  blocks: CanvasBlock[];
  selectedId: string | null;
  onSelectBlock: (id: string) => void;
}

export default function WireframeCanvas({
  blocks,
  selectedId,
  onSelectBlock,
}: WireframeCanvasProps) {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start">
      {/* Mockup khung màn hình thiết bị (Mobile-First tối ưu) */}
      <div className="w-full max-w-md min-h-[500px] bg-white border-2 border-slate-200 rounded-3xl shadow-xl p-6 flex flex-col gap-4 relative ring-8 ring-slate-100">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-200 rounded-b-xl" />

        {blocks.length === 0 ? (
          <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center mt-6">
            <p className="text-sm font-medium text-slate-600">
              Chưa có thành phần nào
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Nhấn nút `+` ở góc dưới để bắt đầu kéo thả các block giao diện
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-8">
            {blocks.map((block) => {
              const isSelected = block.id === selectedId;

              return (
                <div
                  key={block.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBlock(block.id);
                  }}
                  className={`p-4 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  {/* Kết xuất (render) mô phỏng tương ứng từng block theo PRD */}
                  {block.type === "button" && (
                    <button className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm shadow-sm transition-colors text-center">
                      {block.content}
                    </button>
                  )}

                  {block.type === "card" && (
                    <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm">
                      <h5 className="font-semibold text-slate-800 text-sm">
                        {block.content}
                      </h5>
                      <p className="text-xs text-slate-400 mt-1">
                        Nội dung mô tả trên Card mẫu...
                      </p>
                    </div>
                  )}

                  {block.type === "container" && (
                    <div className="border border-dashed border-slate-300 bg-slate-50/50 rounded-xl p-4 flex flex-col items-center justify-center min-h-[80px]">
                      <span className="text-xs font-medium text-slate-400">
                        {block.content} (Row / Column Layout)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
