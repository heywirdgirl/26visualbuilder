# 26visualbuilder

Dưới đây là cấu trúc thư mục toàn diện và tối ưu nhất cho dự án 26visualbuilder, bám sát 100% tinh thần Tree-based UI Builder (kiểu Godot), sử dụng React 19, Next.js 16 và Tailwind v4 mà chúng ta đã thảo luận.

## Project Structure

src/
├── app/                             # Next.js App Router (Môi trường Web chính)
│   ├── globals.css                  # Cấu hình Tailwind v4 (Entry point chứa @theme)
│   ├── layout.tsx                   # Root Layout bọc các Provider
│   └── page.tsx                     # Entry chính - Nơi lắp ráp App Shell (Giao diện Editor)
│
├── components/                      # Hệ thống linh kiện dùng chung toàn hệ thống
│   └── ui/                          # SHADCN PRIMITIVES (Chỉ dùng để dựng giao diện cho chính bộ Editor)
│       ├── button.tsx               # Nút bấm của thanh công cụ
│       ├── dialog.tsx               # Popup hiển thị xuất code
│       ├── scroll-area.tsx          # Thanh cuộn mượt cho cây Node và Inspector
│       ├── tooltip.tsx              # Gợi ý phím tắt khi hover icon
│       └── ...
│
├── core/                            # Xương sống logic của toàn bộ ứng dụng
│   ├── store/
│   │   └── builder-store.ts         # ZUSTAND STORE TỐI CAO - Quản lý JSON Tree & Active Node ID
│   ├── types/
│   │   └── builder.types.ts         # Định nghĩa TypeScript (TreeNode, PropMeta, ComponentType)
│   ├── providers/
│   │   └── client-provider.tsx      # Chứa các bộ bọc Client-side (Zustand Hydration, TooltipProvider)
│   └── utils/
│       └── cn.ts                    # Helper gộp class quen thuộc của Shadcn
│
├── features/                        # KHU VỰC TÍNH NĂNG - Chia theo phân vùng của Trình thiết kế
│   │
│   ├── nodes-tree/                  # 🌲 QUẢN LÝ CÂY NODE (Cánh trái - Trung tâm điều khiển bố cục)
│   │   ├── components/
│   │   │   ├── tree-view.tsx        # Container bao bọc toàn bộ cây thư mục
│   │   │   └── tree-node-item.tsx   # Từng dòng Node (Hỗ trợ highlight, nút bấm xóa, thêm node con)
│   │   └── hooks/
│   │       └── use-tree-shortcuts.ts # Bắt sự kiện phím tắt (Lên/Xuống để đổi vị trí, Tab để thụt lề cha-con)
│   │
│   ├── inspector/                   # 🎛️ BẢNG ĐIỀU KHIỂN THUỘC TÍNH (Cánh phải - Menu Nổi Floating)
│   │   ├── components/
│   │   │   ├── inspector-panel.tsx  # Khung panel nổi có thể di chuyển/đóng mở
│   │   │   ├── layout-section.tsx   # Các inputs chỉnh Flexbox/Grid (Hệ thống tự dịch sang class Tailwind)
│   │   │   └── props-section.tsx    # Các inputs chỉnh riêng cho cấu hình Shadcn (Variant, Size, Text)
│   │   └── utils/
│   │       └── tailwind-mapper.ts   # Hàm thông minh: map từ UI (Padding: 4) -> Class Tailwind ("p-4")
│   │
│   ├── canvas-preview/              # 🖥️ VÙNG HIỂN THỊ GIAO DIỆN (Ở giữa - Trực quan 100% thực tế)
│   │   ├── components/
│   │   │   ├── preview-workspace.tsx # Vùng chứa trung tâm (Hỗ trợ ẩn menu để bung full-screen viewport)
│   │   │   ├── shadow-root-wrapper.tsx # Bộ bọc SHADOW DOM - Cô lập hoàn toàn CSS của App thực tế
│   │   │   └── component-renderer.tsx # ĐỘNG CƠ RENDER - Vòng lặp đệ quy đọc JSON Tree và trả ra JSX thật
│   │   └── constants/
│   │       └── component-registry.ts # Danh bạ ánh xạ: "button" -> <ShadcnButton />, "container" -> <div />
│   │
│   └── code-generator/              # 💻 BỘ BIÊN DỊCH XUẤT CODE (Đầu ra sản phẩm)
│       ├── components/
│       │   └── code-modal.tsx       # Cửa sổ popup chứa code JSX sạch để copy
│       └── utils/
│           └── json-to-jsx.ts       # COMPILER - Chuyển đổi toàn bộ Cây Node JSON thành chuỗi String JSX siêu sạch
│
└── hooks/                           # Custom hooks dùng chung hệ thống ngoài các feature
    └── use-click-outside.ts

### Core Concepts of the New Structure:
Điểm mấu chốt trong thiết kế cấu trúc này:
​Tách biệt rạch ròi 2 thế giới Shadcn: Các component trong components/ui/ chỉ có một nhiệm vụ độc nhất là làm giao diện cho chính cái app Builder (ví dụ làm cái nút "Export Code", làm cái thanh cuộn của Sidebar). Còn các component Shadcn mà người dùng muốn xài (Button, Card thực tế của họ) sẽ được đăng ký và quản lý riêng biệt bên trong features/canvas-preview/constants/component-registry.ts.
​Module hóa tối đa: Cây Node, Inspector, Canvas, và Code Generator hoạt động như các thực thể độc lập. Chúng nói chuyện với nhau thông qua một "vùng nhớ chung duy nhất" là core/store/builder-store.ts. Nhờ vậy, hiệu năng của app sẽ cực kỳ nhẹ và dễ bảo trì.
​Sẵn sàng cho Shadow DOM: Folder canvas-preview đã thủ sẵn shadow-root-wrapper.tsx. Đây là nơi bạn ném code Tailwind v4 của người dùng vào chạy độc lập mà không sợ nó phá vỡ giao diện hệ thống Editor của bạn.

{
  "name": "26visualbuilder",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@dnd-kit/abstract": "^0.5.0",
    "@dnd-kit/dom": "^0.5.0",
    "@dnd-kit/react": "^0.5.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.21.0",
    "next": "16.2.9",
    "radix-ui": "^1.6.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "shadcn": "^4.12.0",
    "tailwind-merge": "^3.6.0",
    "tw-animate-css": "^1.4.0",
    "zustand": "^5.0.14"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

