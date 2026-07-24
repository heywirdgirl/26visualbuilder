// core/types/node-definition.types.ts

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
  | "Templates";

// Input type cho Inspector tự sinh form (Phase E)
export type PropInputType = "text" | "textarea" | "number" | "select" | "checkbox";

export interface PropMeta {
  key: string;        // tên field trong defaultProps, VD "placeholder"
  label: string;       // hiển thị trong Inspector, VD "Placeholder"
  inputType: PropInputType;
  options?: string[];  // dùng khi inputType === "select"
}

// DATA THUẦN — không chứa component/JSX nào. Có thể JSON.stringify,
// lưu Supabase, export/import, chia sẻ giữa user mà không phụ thuộc React.
export interface NodeDefinition {
  id: string;                      // unique, VD "html.div", "shadcn.button"
  title: string;                   // hiển thị trong Node Browser, VD "Div"
  category: NodeCategory;
  tags: string[];                  // dùng cho search
  canHaveChildren: boolean;
  defaultProps: Record<string, unknown>;
  propsSchema: PropMeta[];         // field riêng của node — KHÔNG gồm layout chung
  icon?: string;                   // tên icon lucide-react, resolve ở tầng UI
}