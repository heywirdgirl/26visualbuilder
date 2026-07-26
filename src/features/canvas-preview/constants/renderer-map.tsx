// features/canvas-preview/constants/renderer-map.tsx

import React from "react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Menubar } from "@/components/ui/menubar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { TreeNode } from "@/core/types/builder.types";
import { cn } from "@/core/utils/cn";
import { escapeJsxText, escapeAttr } from "@/core/utils/escape-jsx-text";
import { SYSTEM_NODE_IDS } from "@/core/registry/system-nodes";

// App-only mapping: definitionId -> cách render thật + cách xuất JSX string (code-gen).
// Ngược lại với NodeDefinition (data thuần), file này KHÔNG được serialize/lưu Supabase.
export interface RendererEntry {
  jsxTagName: string;
  importStatement?: string;
  render: (node: TreeNode, children: React.ReactNode, className: string) => React.ReactNode;
  // Tuỳ chọn — chỉ cần khi cấu trúc JSX thật KHÁC với engine generic trong json-to-jsx.ts
  // (VD: cần bọc thêm sub-component như AlertTitle/AlertDescription, SelectItem...).
  toJsx?: (node: TreeNode, childrenJsx: string, className: string, pad: string) => string;
}

// ── Helper dùng chung cho render (Canvas) ──

function containerEntry(tag: string): RendererEntry {
  return {
    jsxTagName: tag,
    render: (node, children, className) =>
      React.createElement(tag, { "data-node-id": node.id, className }, children),
  };
}

function textTagEntry(tag: string): RendererEntry {
  return {
    jsxTagName: tag,
    render: (node, _children, className) => {
      const props = node.props as { text: string };
      return React.createElement(tag, { "data-node-id": node.id, className }, props.text);
    },
  };
}

// Dùng cho các component overlay/trigger (Dialog, Sheet, Popover, Tabs...) —
// V1 hiển thị "luôn mở" để dễ chỉnh sửa nội dung, chưa mô phỏng hành vi tương tác thật.
function placeholderEntry(label: string): RendererEntry {
  return {
    jsxTagName: label,
    render: (node, children, className) => {
      const props = node.props as { triggerText?: string };
      return (
        <div
          data-node-id={node.id}
          className={cn("border border-dashed border-muted-foreground/40 rounded-md p-3", className)}
        >
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {label} (V1 preview){props.triggerText ? ` — trigger: "${props.triggerText}"` : ""}
          </div>
          <div className="flex flex-col gap-2">{children}</div>
        </div>
      );
    },
    // Code-gen cho nhóm này chỉ xuất khung + comment nhắc tự hoàn thiện theo docs shadcn/ui —
    // chưa đủ sub-component (TabsTrigger, DialogTrigger...) để sinh JSX thật hoạt động được.
    toJsx: (node, childrenJsx, _className, pad) => {
      const props = node.props as { triggerText?: string };
      const hint = props.triggerText ? ` (trigger: "${escapeAttr(props.triggerText)}")` : "";
      return `${pad}{/* TODO: ${label}${hint} — cần tự hoàn thiện theo docs shadcn/ui, V1 chỉ xuất khung cấu trúc */}\n${pad}<div>\n${childrenJsx}\n${pad}</div>`;
    },
  };
}

// ── System nodes (PRD v1.9) ──
// Page/Component render như 1 container flex bình thường (đã có direction/gap/padding
// trong defaultProps từ Phase 2) — về mặt hiển thị, khác div ở chỗ Canvas chỉ bắt đầu
// vẽ từ Page active, và Component chỉ "thấy" nội dung thật khi được resolve qua Instance.
const systemPageEntry = containerEntry("div");
const systemComponentEntry = containerEntry("div");

// Folder KHÔNG BAO GIỜ nên xuất hiện trong cây được Canvas duyệt (theo node-rules.ts,
// Page/Component không thể chứa Folder) — entry này chỉ là lưới an toàn, tránh crash
// nếu có bug/dữ liệu cũ lẫn Folder vào nhánh render.
const systemFolderEntry: RendererEntry = {
  jsxTagName: "div",
  render: (node) => (
    <div
      data-node-id={node.id}
      className="text-xs text-amber-600 border border-amber-300 rounded px-2 py-1"
    >
      Folder không thể render trực tiếp: {String((node.props as { name?: string }).name ?? node.id)}
    </div>
  ),
};

export const rendererMap: Record<string, RendererEntry> = {
  [SYSTEM_NODE_IDS.page]: systemPageEntry,
  [SYSTEM_NODE_IDS.component]: systemComponentEntry,
  [SYSTEM_NODE_IDS.folder]: systemFolderEntry,
  // ══ HTML — Layout (container, dùng chung helper) ══
  "html.div": containerEntry("div"),
  "html.section": containerEntry("section"),
  "html.main": containerEntry("main"),
  "html.header": containerEntry("header"),
  "html.footer": containerEntry("footer"),
  "html.aside": containerEntry("aside"),
  "html.article": containerEntry("article"),
  "html.ul": containerEntry("ul"),
  "html.ol": containerEntry("ol"),
  "html.li": containerEntry("li"),
  "html.nav": containerEntry("nav"),

  "html.a": {
    jsxTagName: "a",
    render: (node, children, className) => {
      const props = node.props as { href: string };
      return (
        <a data-node-id={node.id} href={props.href} className={className}>
          {children}
        </a>
      );
    },
  },

  // ══ HTML — Typography ══
  "html.h1": textTagEntry("h1"),
  "html.h2": textTagEntry("h2"),
  "html.h3": textTagEntry("h3"),
  "html.p": textTagEntry("p"),
  "html.span": textTagEntry("span"),

  "html.label": {
    jsxTagName: "label",
    render: (node, _children, className) => {
      const props = node.props as { text: string; htmlFor: string };
      return (
        <label data-node-id={node.id} htmlFor={props.htmlFor} className={className}>
          {props.text}
        </label>
      );
    },
  },

  // ══ HTML — Form (native) ══
  "html.button": {
    jsxTagName: "button",
    render: (node, _children, className) => {
      const props = node.props as { text: string };
      return (
        <button data-node-id={node.id} className={cn("border rounded px-3 py-1.5", className)}>
          {props.text}
        </button>
      );
    },
  },
  "html.input": {
    jsxTagName: "input",
    render: (node, _children, className) => {
      const props = node.props as { placeholder: string; type: string };
      return (
        <input
          data-node-id={node.id}
          placeholder={props.placeholder}
          type={props.type}
          className={cn("border rounded px-3 py-1.5", className)}
        />
      );
    },
  },
  "html.textarea": {
    jsxTagName: "textarea",
    render: (node, _children, className) => {
      const props = node.props as { placeholder: string };
      return (
        <textarea
          data-node-id={node.id}
          placeholder={props.placeholder}
          className={cn("border rounded px-3 py-1.5", className)}
        />
      );
    },
  },
  "html.select": {
    jsxTagName: "select",
    render: (node, _children, className) => {
      const props = node.props as { placeholder: string };
      return (
        <select data-node-id={node.id} className={cn("border rounded px-3 py-1.5", className)}>
          <option>{props.placeholder}</option>
        </select>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { placeholder: string };
      return `${pad}<select>\n${pad}  <option>${escapeJsxText(props.placeholder)}</option>\n${pad}</select>`;
    },
  },
  "html.checkbox": {
    jsxTagName: "input",
    render: (node, _children, className) => {
      const props = node.props as { label: string; checked: boolean };
      return (
        <label data-node-id={node.id} className={cn("flex items-center gap-2", className)}>
          <input type="checkbox" defaultChecked={props.checked} />
          {props.label}
        </label>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { label: string; checked: boolean };
      return `${pad}<label className="flex items-center gap-2">\n${pad}  <input type="checkbox" defaultChecked={${!!props.checked}} />\n${pad}  ${escapeJsxText(props.label)}\n${pad}</label>`;
    },
  },
  "html.radio": {
    jsxTagName: "input",
    render: (node, _children, className) => {
      const props = node.props as { label: string; checked: boolean };
      return (
        <label data-node-id={node.id} className={cn("flex items-center gap-2", className)}>
          <input type="radio" defaultChecked={props.checked} />
          {props.label}
        </label>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { label: string; checked: boolean };
      return `${pad}<label className="flex items-center gap-2">\n${pad}  <input type="radio" defaultChecked={${!!props.checked}} />\n${pad}  ${escapeJsxText(props.label)}\n${pad}</label>`;
    },
  },
  "html.switch": {
    jsxTagName: "input",
    render: (node, _children, className) => {
      const props = node.props as { label: string; checked: boolean };
      return (
        <label data-node-id={node.id} className={cn("flex items-center gap-2", className)}>
          <input type="checkbox" defaultChecked={props.checked} />
          {props.label}
        </label>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { label: string; checked: boolean };
      return `${pad}<label className="flex items-center gap-2">\n${pad}  <input type="checkbox" defaultChecked={${!!props.checked}} />\n${pad}  ${escapeJsxText(props.label)}\n${pad}</label>`;
    },
  },

  // ══ HTML — Media ══
  "html.img": {
    jsxTagName: "img",
    render: (node, _children, className) => {
      const props = node.props as { src: string; alt: string };
      return <img data-node-id={node.id} src={props.src} alt={props.alt} className={className} />;
    },
  },
  "html.icon": {
    jsxTagName: "Icon",
    render: (node, _children, className) => {
      const props = node.props as { name: string; size: number };
      const IconComp =
        (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[props.name] ||
        LucideIcons.HelpCircle;
      return <IconComp data-node-id={node.id} size={props.size} className={className} />;
    },
    // Import cụ thể (VD "Star") được collectImports trong json-to-jsx.ts xử lý riêng,
    // vì phụ thuộc props.name lúc runtime, không cố định như importStatement thường.
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { name: string; size: number };
      const iconName = /^[A-Za-z][A-Za-z0-9]*$/.test(props.name) ? props.name : "HelpCircle";
      return `${pad}<${iconName} size={${Number(props.size) || 24}} />`;
    },
  },
  "html.separator": {
    jsxTagName: "hr",
    render: (node, _children, className) => {
      const props = node.props as { orientation: "horizontal" | "vertical" };
      return (
        <hr
          data-node-id={node.id}
          className={cn(
            props.orientation === "vertical" ? "h-full w-px" : "w-full h-px",
            "border-none bg-border",
            className
          )}
        />
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { orientation: "horizontal" | "vertical" };
      const cls = props.orientation === "vertical" ? "h-full w-px bg-border" : "w-full h-px bg-border";
      return `${pad}<hr className="${cls}" />`;
    },
  },

  // ══ shadcn — Essential ══
  "shadcn.button": {
    jsxTagName: "Button",
    importStatement: `import { Button } from "@/components/ui/button";`,
    render: (node, _children, className) => {
      const props = node.props as { text: string; variant: any; size: any };
      return (
        <Button data-node-id={node.id} variant={props.variant} size={props.size} className={className}>
          {props.text}
        </Button>
      );
    },
  },
  "shadcn.card": {
    jsxTagName: "Card",
    importStatement: `import { Card } from "@/components/ui/card";`,
    render: (node, children, className) => (
      <Card data-node-id={node.id} className={className}>
        {children}
      </Card>
    ),
  },
  "shadcn.input": {
    jsxTagName: "Input",
    importStatement: `import { Input } from "@/components/ui/input";`,
    render: (node, _children, className) => {
      const props = node.props as { placeholder: string; type: string };
      return (
        <Input data-node-id={node.id} placeholder={props.placeholder} type={props.type} className={className} />
      );
    },
  },
  "shadcn.textarea": {
    jsxTagName: "Textarea",
    importStatement: `import { Textarea } from "@/components/ui/textarea";`,
    render: (node, _children, className) => {
      const props = node.props as { placeholder: string };
      return <Textarea data-node-id={node.id} placeholder={props.placeholder} className={className} />;
    },
  },
  "shadcn.label": {
    jsxTagName: "Label",
    importStatement: `import { Label } from "@/components/ui/label";`,
    render: (node, _children, className) => {
      const props = node.props as { text: string; htmlFor: string };
      return (
        <Label data-node-id={node.id} htmlFor={props.htmlFor} className={className}>
          {props.text}
        </Label>
      );
    },
  },
  "shadcn.checkbox": {
    jsxTagName: "Checkbox",
    importStatement: `import { Checkbox } from "@/components/ui/checkbox";\nimport { Label } from "@/components/ui/label";`,
    render: (node, _children, className) => {
      const props = node.props as { label: string; checked: boolean };
      return (
        <div data-node-id={node.id} className={cn("flex items-center gap-2", className)}>
          <Checkbox defaultChecked={props.checked} />
          <Label>{props.label}</Label>
        </div>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { label: string; checked: boolean };
      return `${pad}<div className="flex items-center gap-2">\n${pad}  <Checkbox defaultChecked={${!!props.checked}} />\n${pad}  <Label>${escapeJsxText(props.label)}</Label>\n${pad}</div>`;
    },
  },
  "shadcn.radio-group": {
    jsxTagName: "RadioGroup",
    importStatement: `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";\nimport { Label } from "@/components/ui/label";`,
    render: (node, _children, className) => {
      const props = node.props as { options: string };
      const options = props.options.split(",").map((o) => o.trim()).filter(Boolean);
      return (
        <RadioGroup data-node-id={node.id} className={cn("flex flex-col gap-2", className)} defaultValue={options[0]}>
          {options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={opt} />
              <Label htmlFor={opt}>{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { options: string };
      const options = String(props.options ?? "").split(",").map((o) => o.trim()).filter(Boolean);
      const items = options
        .map(
          (opt) =>
            `${pad}  <div className="flex items-center gap-2">\n${pad}    <RadioGroupItem value="${escapeAttr(opt)}" id="${escapeAttr(opt)}" />\n${pad}    <Label htmlFor="${escapeAttr(opt)}">${escapeJsxText(opt)}</Label>\n${pad}  </div>`
        )
        .join("\n");
      return `${pad}<RadioGroup defaultValue="${escapeAttr(options[0] ?? "")}" className="flex flex-col gap-2">\n${items}\n${pad}</RadioGroup>`;
    },
  },
  "shadcn.switch": {
    jsxTagName: "Switch",
    importStatement: `import { Switch } from "@/components/ui/switch";\nimport { Label } from "@/components/ui/label";`,
    render: (node, _children, className) => {
      const props = node.props as { label: string; checked: boolean };
      return (
        <div data-node-id={node.id} className={cn("flex items-center gap-2", className)}>
          <Switch defaultChecked={props.checked} />
          <Label>{props.label}</Label>
        </div>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { label: string; checked: boolean };
      return `${pad}<div className="flex items-center gap-2">\n${pad}  <Switch defaultChecked={${!!props.checked}} />\n${pad}  <Label>${escapeJsxText(props.label)}</Label>\n${pad}</div>`;
    },
  },
  "shadcn.select": {
    jsxTagName: "Select",
    importStatement: `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";`,
    render: (node, _children, className) => {
      const props = node.props as { placeholder: string; options: string };
      const options = props.options.split(",").map((o) => o.trim()).filter(Boolean);
      return (
        <Select data-node-id={node.id}>
          <SelectTrigger className={className}>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { placeholder: string; options: string };
      const options = String(props.options ?? "").split(",").map((o) => o.trim()).filter(Boolean);
      const items = options
        .map((opt) => `${pad}    <SelectItem value="${escapeAttr(opt)}">${escapeJsxText(opt)}</SelectItem>`)
        .join("\n");
      return `${pad}<Select>\n${pad}  <SelectTrigger>\n${pad}    <SelectValue placeholder="${escapeAttr(props.placeholder)}" />\n${pad}  </SelectTrigger>\n${pad}  <SelectContent>\n${items}\n${pad}  </SelectContent>\n${pad}</Select>`;
    },
  },
  "shadcn.badge": {
    jsxTagName: "Badge",
    importStatement: `import { Badge } from "@/components/ui/badge";`,
    render: (node, _children, className) => {
      const props = node.props as { text: string; variant: any };
      return (
        <Badge data-node-id={node.id} variant={props.variant} className={className}>
          {props.text}
        </Badge>
      );
    },
  },
  "shadcn.avatar": {
    jsxTagName: "Avatar",
    importStatement: `import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";`,
    render: (node, _children, className) => {
      const props = node.props as { src: string; fallback: string };
      return (
        <Avatar data-node-id={node.id} className={className}>
          {props.src && <AvatarImage src={props.src} />}
          <AvatarFallback>{props.fallback}</AvatarFallback>
        </Avatar>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { src: string; fallback: string };
      const img = props.src ? `${pad}  <AvatarImage src="${escapeAttr(props.src)}" />\n` : "";
      return `${pad}<Avatar>\n${img}${pad}  <AvatarFallback>${escapeJsxText(props.fallback)}</AvatarFallback>\n${pad}</Avatar>`;
    },
  },
  "shadcn.separator": {
    jsxTagName: "Separator",
    importStatement: `import { Separator } from "@/components/ui/separator";`,
    render: (node, _children, className) => {
      const props = node.props as { orientation: "horizontal" | "vertical" };
      return <Separator data-node-id={node.id} orientation={props.orientation} className={className} />;
    },
  },

     // ══ shadcn — Layout ══
  "shadcn.scroll-area": {
    jsxTagName: "ScrollArea",
    importStatement: `import { ScrollArea } from "@/components/ui/scroll-area";`,
    render: (node, children, className) => {
      const props = node.props as { height: number };
      return (
        <ScrollArea data-node-id={node.id} className={className} style={{ height: props.height }}>
          {children}
        </ScrollArea>
      );
    },
    toJsx: (node, childrenJsx, _cls, pad) => {
      const props = node.props as { height: number };
      return `${pad}<ScrollArea style={{ height: ${Number(props.height) || 300} }}>\n${childrenJsx}\n${pad}</ScrollArea>`;
    },
  },
  "shadcn.tabs": placeholderEntry("Tabs"),
  "shadcn.accordion": placeholderEntry("Accordion"),
  "shadcn.collapsible": placeholderEntry("Collapsible"),
  "shadcn.resizable": placeholderEntry("Resizable"),

  // ══ shadcn — Feedback ══
  "shadcn.alert": {
    jsxTagName: "Alert",
    importStatement: `import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";`,
    render: (node, _children, className) => {
      const props = node.props as { title: string; description: string; variant: any };
      return (
        <Alert data-node-id={node.id} variant={props.variant} className={className}>
          <AlertTitle>{props.title}</AlertTitle>
          <AlertDescription>{props.description}</AlertDescription>
        </Alert>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { title: string; description: string; variant: any };
      return `${pad}<Alert variant="${escapeAttr(props.variant)}">\n${pad}  <AlertTitle>${escapeJsxText(props.title)}</AlertTitle>\n${pad}  <AlertDescription>${escapeJsxText(props.description)}</AlertDescription>\n${pad}</Alert>`;
    },
  },
  "shadcn.alert-dialog": placeholderEntry("Alert Dialog"),
  "shadcn.dialog": placeholderEntry("Dialog"),
  "shadcn.sheet": placeholderEntry("Sheet"),
  "shadcn.popover": placeholderEntry("Popover"),
  "shadcn.tooltip": {
    jsxTagName: "Tooltip",
    render: (node, children, className) => {
      const props = node.props as { text: string };
      return (
        <div data-node-id={node.id} className={cn("inline-flex flex-col items-start gap-1", className)}>
          {children}
          <span className="text-[10px] bg-black text-white rounded px-1.5 py-0.5">{props.text}</span>
        </div>
      );
    },
    toJsx: (node, childrenJsx, _cls, pad) => {
      const props = node.props as { text: string };
      return `${pad}{/* TODO: dùng TooltipTrigger/TooltipContent thật theo docs shadcn/ui */}\n${pad}<div className="inline-flex flex-col items-start gap-1">\n${childrenJsx}\n${pad}  <span className="text-[10px] bg-black text-white rounded px-1.5 py-0.5">${escapeJsxText(props.text)}</span>\n${pad}</div>`;
    },
  },
  "shadcn.toast": {
    jsxTagName: "Toast",
    render: (node, _children, className) => {
      const props = node.props as { title: string; description: string };
      return (
        <div data-node-id={node.id} className={cn("border rounded-md shadow-sm p-3 bg-background max-w-xs", className)}>
          <div className="text-sm font-medium">{props.title}</div>
          {props.description && <div className="text-xs text-muted-foreground">{props.description}</div>}
        </div>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { title: string; description: string };
      const desc = props.description
        ? `${pad}  <div className="text-xs text-muted-foreground">${escapeJsxText(props.description)}</div>\n`
        : "";
      return `${pad}{/* TODO: shadcn Toast thường gọi qua hàm toast(), đây là bản preview cấu trúc */}\n${pad}<div className="border rounded-md shadow-sm p-3 bg-background max-w-xs">\n${pad}  <div className="text-sm font-medium">${escapeJsxText(props.title)}</div>\n${desc}${pad}</div>`;
    },
  },

  // ══ shadcn — Data ══
  "shadcn.table": {
    jsxTagName: "Table",
    importStatement: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";`,
    render: (node, _children, className) => (
      <Table data-node-id={node.id} className={className}>
        <TableHeader>
          <TableRow>
            <TableHead>Column</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>—</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
    toJsx: (_node, _c, _cls, pad) =>
      `${pad}<Table>\n${pad}  <TableHeader>\n${pad}    <TableRow>\n${pad}      <TableHead>Column</TableHead>\n${pad}    </TableRow>\n${pad}  </TableHeader>\n${pad}  <TableBody>\n${pad}    <TableRow>\n${pad}      <TableCell>—</TableCell>\n${pad}    </TableRow>\n${pad}  </TableBody>\n${pad}</Table>`,
  },
  "shadcn.progress": {
    jsxTagName: "Progress",
    importStatement: `import { Progress } from "@/components/ui/progress";`,
    render: (node, _children, className) => {
      const props = node.props as { value: number };
      return <Progress data-node-id={node.id} value={props.value} className={className} />;
    },
  },
  "shadcn.skeleton": {
    jsxTagName: "Skeleton",
    importStatement: `import { Skeleton } from "@/components/ui/skeleton";`,
    render: (node, _children, className) => {
      const props = node.props as { width: number; height: number };
      return (
        <Skeleton data-node-id={node.id} className={className} style={{ width: props.width, height: props.height }} />
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { width: number; height: number };
      return `${pad}<Skeleton style={{ width: ${Number(props.width) || 0}, height: ${Number(props.height) || 0} }} />`;
    },
  },

  // ══ shadcn — Navigation ══
  "shadcn.breadcrumb": {
    jsxTagName: "Breadcrumb",
    importStatement: `import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";`,
    render: (node, children, className) => (
      <Breadcrumb data-node-id={node.id} className={className}>
        <BreadcrumbList>{children}</BreadcrumbList>
      </Breadcrumb>
    ),
    toJsx: (_node, childrenJsx, _cls, pad) =>
      `${pad}<Breadcrumb>\n${pad}  <BreadcrumbList>\n${childrenJsx || pad + "    {/* thêm BreadcrumbItem con */}"}\n${pad}  </BreadcrumbList>\n${pad}</Breadcrumb>`,
  },
  "shadcn.pagination": {
    jsxTagName: "Pagination",
    importStatement: `import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";`,
    render: (node, _children, className) => {
      const props = node.props as { totalPages: number; currentPage: number };
      const pages = Array.from({ length: Math.max(1, props.totalPages) }, (_, i) => i + 1);
      return (
        <Pagination data-node-id={node.id} className={className}>
          <PaginationContent>
            {pages.map((p) => (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === props.currentPage}>{p}</PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      );
    },
    toJsx: (node, _c, _cls, pad) => {
      const props = node.props as { totalPages: number; currentPage: number };
      const pages = Array.from({ length: Math.max(1, Number(props.totalPages) || 1) }, (_, i) => i + 1);
      const items = pages
        .map(
          (p) =>
            `${pad}    <PaginationItem>\n${pad}      <PaginationLink isActive={${p === props.currentPage}}>${p}</PaginationLink>\n${pad}    </PaginationItem>`
        )
        .join("\n");
      return `${pad}<Pagination>\n${pad}  <PaginationContent>\n${items}\n${pad}  </PaginationContent>\n${pad}</Pagination>`;
    },
  },
  "shadcn.navigation-menu": {
    jsxTagName: "NavigationMenu",
    importStatement: `import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";`,
    render: (node, children, className) => (
      <NavigationMenu data-node-id={node.id} className={className}>
        <NavigationMenuList>{children}</NavigationMenuList>
      </NavigationMenu>
    ),
    // Lưu ý: childrenJsx được indent theo depth thật của cây, không +1 cho lớp NavigationMenuList
    // thêm vào đây — nên indent hiển thị lệch nhẹ so với chuẩn, không ảnh hưởng tính đúng của code.
    toJsx: (_node, childrenJsx, _cls, pad) =>
      `${pad}<NavigationMenu>\n${pad}  <NavigationMenuList>\n${childrenJsx}\n${pad}  </NavigationMenuList>\n${pad}</NavigationMenu>`,
  },
  "shadcn.menubar": {
    jsxTagName: "Menubar",
    importStatement: `import { Menubar } from "@/components/ui/menubar";`,
    render: (node, children, className) => (
      <Menubar data-node-id={node.id} className={className}>
        {children}
      </Menubar>
    ),
  },

  // ══ shadcn — Overlay ══
  "shadcn.dropdown-menu": placeholderEntry("Dropdown Menu"),
  "shadcn.context-menu": placeholderEntry("Context Menu"),
  "shadcn.hover-card": placeholderEntry("Hover Card"),
};

export function getRendererEntry(defId: string): RendererEntry | undefined {
  return rendererMap[defId];
}