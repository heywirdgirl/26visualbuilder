// src/features/builder/components/inspector.tsx
import React, { useState } from "react";
import { CanvasBlock } from "@/app/editor/page";
import { Code, Eye, Copy, Check } from "lucide-react";

interface InspectorProps {
  selectedBlock: CanvasBlock | null;
  onUpdate: (key: keyof CanvasBlock, value: any) => void;
}

export default function Inspector({ selectedBlock, onUpdate }: InspectorProps) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tạo code JSX mô phỏng dựa trên cấu trúc Shadcn UI
  const generateJSX = () => {
    if (!selectedBlock) return "";
    if (selectedBlock.type === "button") {
      return `<Button variant="${selectedBlock.variant || "default"}">\n  ${
        selectedBlock.content
      }\n</Button>`;
    }
    if (selectedBlock.type === "card") {
      return `<Card>\n  <CardHeader>\n    <CardTitle>${selectedBlock.content}</CardTitle>\n  </CardHeader>\n</Card>`;
    }
    return `<div className="flex flex-col gap-4">\n  {/* Container Content */}\n</div>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateJSX());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 h-16 flex items-center justify-between shrink-0 z-40">
      {/* Phần bên trái: Tên ứng dụng & Trạng thái chọn */}
      <div className="flex items-center gap-3">
        <span className="font-bold text-indigo-600 tracking-tight text-lg hidden sm:block">
          26visualbuilder
        </span>
        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
        {selectedBlock ? (
          <div className="flex items-center gap-2">
            <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2.5 py-0.5 rounded-full capitalize">
              {selectedBlock.type}
            </span>
            <input
              type="text"
              value={selectedBlock.content}
              onChange={(e) => onUpdate("content", e.target.value)}
              className="text-sm font-medium text-slate-700 border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none px-2 py-1 rounded w-36 sm:w-48"
              placeholder="Nhập nội dung..."
            />
          </div>
        ) : (
          <span className="text-sm text-slate-400 italic">
            Chọn một thành phần trên khung vẽ để chỉnh sửa
          </span>
        )}
      </div>

      {/* Phần bên phải: Tùy chọn mở Code JSX */}
      {selectedBlock && (
        <button
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Code size={16} />
          <span className="hidden sm:inline">Xuất/Xem JSX</span>
        </button>
      )}

      {/* Modal/Popup Xem mã nguồn JSX (Chuẩn Shadcn) */}
      {showCode && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <Eye size={18} /> Mã nguồn JSX
              </h4>
              <button
                onClick={() => setShowCode(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                Đóng
              </button>
            </div>
            
            <pre className="bg-slate-50 p-4 m-4 rounded-xl font-mono text-xs text-slate-800 overflow-x-auto border border-slate-100">
              {generateJSX()}
            </pre>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Đã sao chép!" : "Sao chép mã"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
