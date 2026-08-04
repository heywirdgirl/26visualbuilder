// core/registry/ui-dependencies.ts



// Metadata riêng cho V4 (Export Project) — biết defId nào cần file components/ui/*.tsx nào.
// Tách khỏi renderer-map.tsx để không đụng pipeline render Canvas đang ổn định; đây là
// dữ liệu CHỈ dùng lúc export, không ảnh hưởng gì tới hiển thị.
export const uiDependencies: Record<string, string[]> = {
  "shadcn.button": ["button"],
  "shadcn.card": ["card"],
  "shadcn.input": ["input"],
  "shadcn.textarea": ["textarea"],
  "shadcn.label": ["label"],
  "shadcn.checkbox": ["checkbox", "label"],
  "shadcn.radio-group": ["radio-group", "label"],
  "shadcn.switch": ["switch", "label"],
  "shadcn.select": ["select"],
  "shadcn.badge": ["badge"],
  "shadcn.avatar": ["avatar"],
  "shadcn.separator": ["separator"],
  "shadcn.scroll-area": ["scroll-area"],
  "shadcn.alert": ["alert"],
  "shadcn.table": ["table"],
  "shadcn.progress": ["progress"],
  "shadcn.skeleton": ["skeleton"],
  "shadcn.breadcrumb": ["breadcrumb"],
  "shadcn.pagination": ["pagination"],
  "shadcn.navigation-menu": ["navigation-menu"],
  "shadcn.menubar": ["menubar"],
  // 13 entry còn lại (Tabs/Dialog/Sheet/Popover/Tooltip/Toast/Accordion/Collapsible/
  // Resizable/AlertDialog/DropdownMenu/ContextMenu/HoverCard) render bằng <div> placeholder
  // (xem placeholderEntry trong renderer-map.tsx) — KHÔNG import component thật nào,
  // nên không khai báo ở đây. Danh sách 21 dòng trên đúng khớp số entry CÓ importStatement.
};

export function getUiDependencies(defId: string): string[] {
  return uiDependencies[defId] ?? [];
}
