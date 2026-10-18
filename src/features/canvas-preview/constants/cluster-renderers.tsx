import React from "react";
import type { RendererEntry } from "./renderer-map";
import { cn } from "@/core/utils/cn";
import { escapeJsxText, escapeAttr } from "@/core/utils/escape-jsx-text";
import { TreeNode } from "@/core/types/builder.types";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

export const classAttr = (className: string) => (className ? ` className="${escapeAttr(className)}"` : "");
export const prop = (node: TreeNode, key: string, fallback = "") =>
  String((node.props as Record<string, unknown>)[key] ?? fallback);

export function textEntry(jsxTagName: string, tag: string, base: string): RendererEntry {
  return {
    jsxTagName,
    render: (node, _children, className) =>
      React.createElement(tag, { "data-node-id": node.id, className: cn(base, className) }, prop(node, "text")),
  };
}

export function boxEntry(
  jsxTagName: string,
  tag: string,
  base: string,
  importStatement?: string
): RendererEntry {
  return {
    jsxTagName,
    importStatement,
    render: (node, children, className) =>
      React.createElement(tag, { "data-node-id": node.id, className: cn(base, className) }, children),
  };
}

export function leafEntry(jsxTagName: string, tag: string, base: string): RendererEntry {
  return {
    jsxTagName,
    render: (node, _children, className) =>
      React.createElement(tag, { "data-node-id": node.id, className: cn(base, className) }),
  };
}

export function overlayEntry(options: {
  label: string;
  root: string;
  trigger: string;
  content: string;
  importStatement: string;
  contentAttrs?: (node: TreeNode) => string;
}): RendererEntry {
  return {
    jsxTagName: options.root,
    importStatement: options.importStatement,
    render: (node, children, className) => (
      <div
        data-node-id={node.id}
        className={cn("rounded-md border border-dashed border-muted-foreground/40 p-3", className)}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded border bg-background px-3 py-1 text-sm">
            {prop(node, "triggerText", "Open")}
          </span>
          <span className="text-[10px] text-muted-foreground">{options.label} · xem trước (luôn mở)</span>
        </div>
        <div className="flex flex-col gap-2 rounded-md border bg-background p-3 shadow-sm">{children}</div>
      </div>
    ),
    toJsx: (node, childrenJsx, className, pad) => {
      const extra = options.contentAttrs?.(node) ?? "";
      const triggerText = escapeJsxText(prop(node, "triggerText", "Open"));
      return `${pad}<${options.root}>\n${pad}  <${options.trigger}>${triggerText}</${options.trigger}>\n${pad}  <${options.content}${extra}${classAttr(className)}>\n${childrenJsx}\n${pad}  </${options.content}>\n${pad}</${options.root}>`;
    },
  };
}

const IMP = {
  dialog: `import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";`,
  alert: `import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";`,
  sheet: `import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";`,
  popover: `import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";`,
  hover: `import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";`,
  dropdown: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";`,
  context: `import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuLabel, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";`,
  menubar: `import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@/components/ui/menubar";`,
  breadcrumb: `import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";`,
  navmenu: `import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";`,
  table: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";`,
  collapsible: `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";`,
  resizable: `import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";`,
};

const MENU_ITEM = "rounded-sm px-2 py-1.5 text-sm";
const MENU_LABEL = "px-2 py-1.5 text-sm font-semibold";
const MENU_SEP = "my-1 h-px bg-border";

export const clusterRenderers: Record<string, RendererEntry> = {
  "shadcn.dialog": overlayEntry({
    label: "Dialog",
    root: "Dialog",
    trigger: "DialogTrigger",
    content: "DialogContent",
    importStatement: IMP.dialog,
  }),
  "shadcn.dialog-title": textEntry("DialogTitle", "h4", "text-lg font-semibold"),
  "shadcn.dialog-description": textEntry("DialogDescription", "p", "text-sm text-muted-foreground"),
  "shadcn.dialog-footer": boxEntry("DialogFooter", "div", "flex justify-end gap-2"),

  "shadcn.alert-dialog": overlayEntry({
    label: "Alert Dialog",
    root: "AlertDialog",
    trigger: "AlertDialogTrigger",
    content: "AlertDialogContent",
    importStatement: IMP.alert,
  }),
  "shadcn.alert-dialog-title": textEntry("AlertDialogTitle", "h4", "text-lg font-semibold"),
  "shadcn.alert-dialog-description": textEntry("AlertDialogDescription", "p", "text-sm text-muted-foreground"),
  "shadcn.alert-dialog-footer": boxEntry("AlertDialogFooter", "div", "flex justify-end gap-2"),
  "shadcn.alert-dialog-cancel": textEntry("AlertDialogCancel", "span", "rounded-md border px-3 py-1.5 text-sm"),
  "shadcn.alert-dialog-action": textEntry(
    "AlertDialogAction",
    "span",
    "rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
  ),

  "shadcn.sheet": overlayEntry({
    label: "Sheet",
    root: "Sheet",
    trigger: "SheetTrigger",
    content: "SheetContent",
    importStatement: IMP.sheet,
    contentAttrs: (node) => ` side="${escapeAttr(prop(node, "side", "right"))}"`,
  }),
  "shadcn.sheet-title": textEntry("SheetTitle", "h4", "text-lg font-semibold"),
  "shadcn.sheet-description": textEntry("SheetDescription", "p", "text-sm text-muted-foreground"),

  "shadcn.popover": overlayEntry({
    label: "Popover",
    root: "Popover",
    trigger: "PopoverTrigger",
    content: "PopoverContent",
    importStatement: IMP.popover,
  }),
  "shadcn.hover-card": overlayEntry({
    label: "Hover Card",
    root: "HoverCard",
    trigger: "HoverCardTrigger",
    content: "HoverCardContent",
    importStatement: IMP.hover,
  }),

  "shadcn.dropdown-menu": overlayEntry({
    label: "Dropdown",
    root: "DropdownMenu",
    trigger: "DropdownMenuTrigger",
    content: "DropdownMenuContent",
    importStatement: IMP.dropdown,
  }),
  "shadcn.dropdown-menu-label": textEntry("DropdownMenuLabel", "div", MENU_LABEL),
  "shadcn.dropdown-menu-item": textEntry("DropdownMenuItem", "div", MENU_ITEM),
  "shadcn.dropdown-menu-separator": leafEntry("DropdownMenuSeparator", "div", MENU_SEP),

  "shadcn.context-menu": overlayEntry({
    label: "Context Menu",
    root: "ContextMenu",
    trigger: "ContextMenuTrigger",
    content: "ContextMenuContent",
    importStatement: IMP.context,
  }),
  "shadcn.context-menu-label": textEntry("ContextMenuLabel", "div", MENU_LABEL),
  "shadcn.context-menu-item": textEntry("ContextMenuItem", "div", MENU_ITEM),
  "shadcn.context-menu-separator": leafEntry("ContextMenuSeparator", "div", MENU_SEP),

  "shadcn.menubar": boxEntry("Menubar", "div", "flex gap-4 rounded-md border p-1", IMP.menubar),
  "shadcn.menubar-menu": {
    jsxTagName: "MenubarMenu",
    render: (node, children, className) => (
      <div data-node-id={node.id} className={cn("flex flex-col gap-1", className)}>
        <span className="px-2 py-1 text-sm font-medium">{prop(node, "title", "Menu")}</span>
        <div className="flex min-w-32 flex-col rounded-md border bg-background p-1 shadow-sm">{children}</div>
      </div>
    ),
    toJsx: (node, childrenJsx, className, pad) =>
      `${pad}<MenubarMenu>\n${pad}  <MenubarTrigger>${escapeJsxText(prop(node, "title", "Menu"))}</MenubarTrigger>\n${pad}  <MenubarContent${classAttr(className)}>\n${childrenJsx}\n${pad}  </MenubarContent>\n${pad}</MenubarMenu>`,
  },
  "shadcn.menubar-item": textEntry("MenubarItem", "div", MENU_ITEM),
  "shadcn.menubar-separator": leafEntry("MenubarSeparator", "div", MENU_SEP),

  "shadcn.breadcrumb": {
    jsxTagName: "Breadcrumb",
    importStatement: IMP.breadcrumb,
    render: (node, children, className) => (
      <Breadcrumb data-node-id={node.id} className={className}>
        <BreadcrumbList>{children}</BreadcrumbList>
      </Breadcrumb>
    ),
    toJsx: (_node, childrenJsx, _className, pad) =>
      `${pad}<Breadcrumb>\n${pad}  <BreadcrumbList>\n${childrenJsx}\n${pad}  </BreadcrumbList>\n${pad}</Breadcrumb>`,
  },
  "shadcn.breadcrumb-item": {
    jsxTagName: "BreadcrumbItem",
    render: (node, _children, className) => (
      <BreadcrumbItem data-node-id={node.id}>
        <BreadcrumbLink href={prop(node, "href", "#")} className={className} onClick={(event) => event.preventDefault()}>
          {prop(node, "text")}
        </BreadcrumbLink>
      </BreadcrumbItem>
    ),
    toJsx: (node, _children, className, pad) =>
      `${pad}<BreadcrumbItem>\n${pad}  <BreadcrumbLink href="${escapeAttr(prop(node, "href", "#"))}"${classAttr(className)}>${escapeJsxText(prop(node, "text"))}</BreadcrumbLink>\n${pad}</BreadcrumbItem>`,
  },
  "shadcn.breadcrumb-page": {
    jsxTagName: "BreadcrumbItem",
    render: (node, _children, className) => (
      <BreadcrumbItem data-node-id={node.id}>
        <BreadcrumbPage className={className}>{prop(node, "text")}</BreadcrumbPage>
      </BreadcrumbItem>
    ),
    toJsx: (node, _children, className, pad) =>
      `${pad}<BreadcrumbItem>\n${pad}  <BreadcrumbPage${classAttr(className)}>${escapeJsxText(prop(node, "text"))}</BreadcrumbPage>\n${pad}</BreadcrumbItem>`,
  },
  "shadcn.breadcrumb-separator": {
    jsxTagName: "BreadcrumbSeparator",
    render: (node) => <BreadcrumbSeparator data-node-id={node.id} />,
  },

  "shadcn.navigation-menu": {
    jsxTagName: "NavigationMenu",
    importStatement: IMP.navmenu,
    render: (node, children, className) => (
      <NavigationMenu data-node-id={node.id} className={className}>
        <NavigationMenuList>{children}</NavigationMenuList>
      </NavigationMenu>
    ),
    toJsx: (_node, childrenJsx, _className, pad) =>
      `${pad}<NavigationMenu>\n${pad}  <NavigationMenuList>\n${childrenJsx}\n${pad}  </NavigationMenuList>\n${pad}</NavigationMenu>`,
  },
  "shadcn.navigation-menu-link": {
    jsxTagName: "NavigationMenuItem",
    render: (node, _children, className) => (
      <NavigationMenuItem data-node-id={node.id}>
        <NavigationMenuLink href={prop(node, "href", "#")} className={className} onClick={(event) => event.preventDefault()}>
          {prop(node, "text")}
        </NavigationMenuLink>
      </NavigationMenuItem>
    ),
    toJsx: (node, _children, className, pad) =>
      `${pad}<NavigationMenuItem>\n${pad}  <NavigationMenuLink href="${escapeAttr(prop(node, "href", "#"))}"${classAttr(className)}>${escapeJsxText(prop(node, "text"))}</NavigationMenuLink>\n${pad}</NavigationMenuItem>`,
  },

  "shadcn.table": {
    jsxTagName: "Table",
    importStatement: IMP.table,
    render: (node, children, className) => (
      <Table data-node-id={node.id} className={className}>{children}</Table>
    ),
  },
  "shadcn.table-header": {
    jsxTagName: "TableHeader",
    render: (node, children, className) => (
      <TableHeader data-node-id={node.id} className={className}>{children}</TableHeader>
    ),
  },
  "shadcn.table-body": {
    jsxTagName: "TableBody",
    render: (node, children, className) => (
      <TableBody data-node-id={node.id} className={className}>{children}</TableBody>
    ),
  },
  "shadcn.table-row": {
    jsxTagName: "TableRow",
    render: (node, children, className) => (
      <TableRow data-node-id={node.id} className={className}>{children}</TableRow>
    ),
  },
  "shadcn.table-head": {
    jsxTagName: "TableHead",
    render: (node, _children, className) => (
      <TableHead data-node-id={node.id} className={className}>{prop(node, "text")}</TableHead>
    ),
  },
  "shadcn.table-cell": {
    jsxTagName: "TableCell",
    render: (node, _children, className) => (
      <TableCell data-node-id={node.id} className={className}>{prop(node, "text")}</TableCell>
    ),
  },

  "shadcn.collapsible": boxEntry("Collapsible", "div", "flex flex-col gap-2", IMP.collapsible),
  "shadcn.collapsible-trigger": textEntry("CollapsibleTrigger", "div", "cursor-pointer text-sm font-medium"),
  "shadcn.collapsible-content": boxEntry("CollapsibleContent", "div", "flex flex-col gap-2 border-l pl-3"),

  "shadcn.resizable": {
    jsxTagName: "ResizablePanelGroup",
    importStatement: IMP.resizable,
    render: (node, children, className) => (
      <div
        data-node-id={node.id}
        className={cn(
          "flex min-h-24 rounded-md border",
          prop(node, "direction", "horizontal") === "vertical" ? "flex-col" : "flex-row",
          className
        )}
      >
        {children}
      </div>
    ),
    toJsx: (node, childrenJsx, className, pad) =>
      `${pad}<ResizablePanelGroup orientation="${escapeAttr(prop(node, "direction", "horizontal"))}"${classAttr(className)}>\n${childrenJsx}\n${pad}</ResizablePanelGroup>`,
  },
  "shadcn.resizable-panel": {
    jsxTagName: "ResizablePanel",
    render: (node, children, className) => (
      <div
        data-node-id={node.id}
        className={className}
        style={{ flex: `${Number(prop(node, "defaultSize", "50")) || 50} 1 0%` }}
      >
        {children}
      </div>
    ),
  },
  "shadcn.resizable-handle": leafEntry("ResizableHandle", "div", "shrink-0 basis-px bg-border"),
};
