// src/features/builder/components/sidebar-palette.tsx
import React, { useState } from "react";
import { Plus, X, Type, LayoutGrid, Square } from "lucide-react";

interface SidebarPaletteProps {
  onDropComponent: (type: "button" | "card" | "container") => void;
}

export default function SidebarPalette({ onDropComponent }: SidebarPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Khi người dùng bắt đầu kéo component, sidebar tự động thu gọn lại theo ý tưởng Mobile-First
  const handleDragStart = (type: "button" | "card" | "container") => {
    setIsOpen(false); 
    onDropComponent(type);
  };

  return (
    <>
      {/* Nút kích hoạt mở Sidebar (Nằm góc dưới/cạnh màn hình tiện thao tác trên mobile) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-all active:scale-95"
          aria-label="Thêm thành phần"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Sidebar trượt ra với hiệu ứng kính mờ (Glassmorphism) */}
      {isOpen && (
        <div className="absolute inset-y-0 right-0 w-full max-w-xs md:max-w-sm bg-white/70 backdrop-blur-md border-l border-slate-200/50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Tiêu đề Sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-base">Thành phần UI (MVP)</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Đóng sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Danh sách các Block rút gọn cho phép kéo thả */}
          <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Kéo thả vào Wireframe
            </p>

            {/* Component Button */}
            <div
              draggable
              onDragStart={() => handleDragStart("button")}
              className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-md transition-all"
            >
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Type size={18} />
              </div>
              <div>
                <h4 className="font-medium text-slate-700 text-sm">Button</h4>
                <p className="text-xs text-slate-400">Dùng cho hành động CTA</p>
              </div>
            </div>

            {/* Component Card */}
            <div
              draggable
              onDragStart={() => handleDragStart("card")}
              className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-md transition-all"
            >
              <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                <Square size={18} />
              </div>
              <div>
                <h4 className="font-medium text-slate-700 text-sm">Card</h4>
                <p className="text-xs text-slate-400">Dùng để nhóm nội dung</p>
              </div>
            </div>

            {/* Component Container */}
            <div
              draggable
              onDragStart={() => handleDragStart("container")}
              className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-md transition-all"
            >
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <LayoutGrid size={18} />
              </div>
              <div>
                <h4 className="font-medium text-slate-700 text-sm">Container</h4>
                <p className="text-xs text-slate-400">Dùng để chứa layout</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100 text-center text-xs text-slate-400">
             Cấu trúc chuẩn Shadcn UI
          </div>
        </div>
      )}
    </>
  );
}
