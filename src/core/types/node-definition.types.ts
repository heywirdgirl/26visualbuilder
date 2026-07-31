// core/types/node-definition.types.ts


import { StyleProps } from "./style.types";
// Nhóm chức năng — dùng để group trong Node Browser (accordion)
export type NodeCategory =
  | "Layout"
  | "Typography"
  | "Form"
  | "List"
  | "Media"
  | "Navigation"
  | "Overlay"
  | "Data Display"
  | "Templates"
  | "System"; // 👈 thêm — Folder/Page/Component/Component Instance. KHÔNG hiện trong Node Browser
              // duyệt theo category thường (Phase 5 xử lý riêng bằng "New Folder/Page/Component").

// Vai trò cấu trúc của Node trong Project — quyết định RULE cha-con.
// Editor CHỈ đọc rule này (node-rules.ts), không viết if(type === "page") ở bất kỳ đâu khác.
export type NodeKind =
  | "folder"
  | "page"
  | "component"
  | "component-instance"
  | "html"
  | "shadcn";

export type PropInputType = "text" | "textarea" | "number" | "select" | "checkbox";

export interface PropMeta {
  key: string;
  label: string;
  inputType: PropInputType;
  options?: string[];
}

// DATA THUẦN — không chứa component/JSX nào. Có thể JSON.stringify,
// lưu Supabase, export/import, chia sẻ giữa user mà không phụ thuộc React.


export interface NodeDefinition {
  id: string;
  title: string;
  category: NodeCategory;
  nodeKind: NodeKind;
  version?: number;
  tags: string[];
  canHaveChildren: boolean;
  defaultProps: Record<string, unknown>;
  defaultStyle?: Partial<StyleProps>; // 👈 mới — chỉ set cho definition cần layout mặc định
  propsSchema: PropMeta[];
  icon?: string;
}