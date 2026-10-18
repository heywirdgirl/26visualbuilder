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
  "shadcn.tabs": ["tabs"],
  "shadcn.tabs-list": ["tabs"],
  "shadcn.tabs-trigger": ["tabs"],
  "shadcn.tabs-content": ["tabs"],
  "shadcn.accordion": ["accordion"],
  "shadcn.accordion-item": ["accordion"],
  "shadcn.accordion-trigger": ["accordion"],
  "shadcn.accordion-content": ["accordion"],
  "shadcn.dialog": ["dialog", "button"],
  "shadcn.dialog-title": ["dialog", "button"],
  "shadcn.dialog-description": ["dialog", "button"],
  "shadcn.dialog-footer": ["dialog", "button"],
  "shadcn.alert-dialog": ["alert-dialog", "button"],
  "shadcn.alert-dialog-title": ["alert-dialog", "button"],
  "shadcn.alert-dialog-description": ["alert-dialog", "button"],
  "shadcn.alert-dialog-footer": ["alert-dialog", "button"],
  "shadcn.alert-dialog-cancel": ["alert-dialog", "button"],
  "shadcn.alert-dialog-action": ["alert-dialog", "button"],
  "shadcn.sheet": ["sheet", "button"],
  "shadcn.sheet-title": ["sheet", "button"],
  "shadcn.sheet-description": ["sheet", "button"],
  "shadcn.popover": ["popover"],
  "shadcn.hover-card": ["hover-card"],
  "shadcn.dropdown-menu": ["dropdown-menu"],
  "shadcn.dropdown-menu-label": ["dropdown-menu"],
  "shadcn.dropdown-menu-item": ["dropdown-menu"],
  "shadcn.dropdown-menu-separator": ["dropdown-menu"],
  "shadcn.context-menu": ["context-menu"],
  "shadcn.context-menu-label": ["context-menu"],
  "shadcn.context-menu-item": ["context-menu"],
  "shadcn.context-menu-separator": ["context-menu"],
  "shadcn.menubar-menu": ["menubar"],
  "shadcn.menubar-item": ["menubar"],
  "shadcn.menubar-separator": ["menubar"],
  "shadcn.breadcrumb-item": ["breadcrumb"],
  "shadcn.breadcrumb-page": ["breadcrumb"],
  "shadcn.breadcrumb-separator": ["breadcrumb"],
  "shadcn.navigation-menu-link": ["navigation-menu"],
  "shadcn.table-header": ["table"],
  "shadcn.table-body": ["table"],
  "shadcn.table-row": ["table"],
  "shadcn.table-head": ["table"],
  "shadcn.table-cell": ["table"],
  "shadcn.collapsible": ["collapsible"],
  "shadcn.collapsible-trigger": ["collapsible"],
  "shadcn.collapsible-content": ["collapsible"],
  "shadcn.resizable": ["resizable"],
  "shadcn.resizable-panel": ["resizable"],
  "shadcn.resizable-handle": ["resizable"],
  "shadcn.slider": ["slider"],
  "shadcn.toggle": ["toggle"],
  "shadcn.toggle-group": ["toggle-group", "toggle"],
  "shadcn.toggle-group-item": ["toggle-group", "toggle"],
  "shadcn.aspect-ratio": ["aspect-ratio"],
  "shadcn.input-otp": ["input-otp"],
  "shadcn.calendar": ["calendar", "button"],
  "shadcn.carousel": ["carousel", "button"],
  "shadcn.carousel-item": ["carousel", "button"],
  "shadcn.command": ["command", "dialog", "input-group"],
  "shadcn.command-input": ["command", "dialog", "input-group"],
  "shadcn.command-list": ["command", "dialog", "input-group"],
  "shadcn.command-empty": ["command", "dialog", "input-group"],
  "shadcn.command-group": ["command", "dialog", "input-group"],
  "shadcn.command-item": ["command", "dialog", "input-group"],
  "shadcn.command-separator": ["command", "dialog", "input-group"],
  "shadcn.drawer": ["drawer"],
  "shadcn.drawer-header": ["drawer"],
  "shadcn.drawer-title": ["drawer"],
  "shadcn.drawer-description": ["drawer"],
  "shadcn.drawer-footer": ["drawer"],
};

export function getUiDependencies(defId: string): string[] {
  return uiDependencies[defId] ?? [];
}

const UI_NPM_PACKAGES: Record<string, Record<string, string>> = {
  "input-otp": { "input-otp": "^1.5.0" },
  calendar: { "date-fns": "^4.4.0", "react-day-picker": "^10.0.2" },
  carousel: { "embla-carousel-react": "^8.6.0" },
  command: { cmdk: "^1.1.1" },
  drawer: { vaul: "^1.1.2" },
};

export function getNpmPackagesForUiSlugs(slugs: string[]): Record<string, string> {
  const dependencies = slugs.reduce<Record<string, string>>(
    (dependencies, slug) => ({ ...dependencies, ...(UI_NPM_PACKAGES[slug] ?? {}) }),
    {}
  );
  if (slugs.length > 0) {
    dependencies.shadcn = "^4.12.0";
    dependencies["tw-animate-css"] = "^1.4.0";
  }
  return dependencies;
}

export const UI_PEER_SLUGS: Record<string, string[]> = {
  pagination: ["button"],
  "alert-dialog": ["button"],
  dialog: ["button"],
  calendar: ["button"],
  carousel: ["button"],
  command: ["dialog"],
  "input-group": ["button", "input", "textarea"],
  "toggle-group": ["toggle"],
};
