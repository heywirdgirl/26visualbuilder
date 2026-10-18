import type { NodeDefinition } from "@/core/types/node-definition.types";
import { txt } from "./shadcn-cluster-nodes";

type RawDef = Omit<NodeDefinition, "nodeKind">;

export const extraRawNodesA: RawDef[] = [
  {
    id: "shadcn.slider",
    title: "Slider",
    category: "Form",
    tags: ["form", "slider", "range", "shadcn"],
    canHaveChildren: false,
    defaultProps: { value: 50, max: 100, step: 1 },
    defaultStyle: { width: "full" },
    propsSchema: [
      { key: "value", label: "Giá trị mặc định", inputType: "number" },
      { key: "max", label: "Tối đa", inputType: "number" },
      { key: "step", label: "Bước nhảy", inputType: "number" },
    ],
  },
  {
    id: "shadcn.toggle",
    title: "Toggle",
    category: "Form",
    tags: ["form", "toggle", "button", "shadcn"],
    canHaveChildren: false,
    defaultProps: { text: "Đậm", variant: "outline", size: "default" },
    propsSchema: [
      { key: "text", label: "Nội dung", inputType: "text" },
      { key: "variant", label: "Variant", inputType: "select", options: ["default", "outline"] },
      { key: "size", label: "Size", inputType: "select", options: ["default", "sm", "lg"] },
    ],
  },
  {
    id: "shadcn.toggle-group",
    title: "Toggle Group",
    category: "Form",
    tier: "component",
    tags: ["form", "toggle", "group", "segmented", "shadcn"],
    canHaveChildren: true,
    defaultProps: { type: "single", variant: "outline" },
    propsSchema: [
      { key: "type", label: "Kiểu chọn", inputType: "select", options: ["single", "multiple"] },
      { key: "variant", label: "Variant", inputType: "select", options: ["default", "outline"] },
    ],
    allowedChildIds: ["shadcn.toggle-group-item"],
    defaultChildren: ["Trái", "Giữa", "Phải"].map((text) => ({
      defId: "shadcn.toggle-group-item",
      props: { text },
    })),
  },
  txt("shadcn.toggle-group-item", "Toggle Item", "shadcn.toggle-group", "Mục", "Form"),
  {
    id: "shadcn.aspect-ratio",
    title: "Aspect Ratio",
    category: "Layout",
    tier: "component",
    tags: ["layout", "ratio", "frame", "image", "shadcn"],
    canHaveChildren: true,
    defaultProps: { ratio: "16/9" },
    defaultStyle: { width: "full" },
    propsSchema: [
      {
        key: "ratio",
        label: "Tỉ lệ khung",
        inputType: "select",
        options: ["1/1", "4/3", "16/9", "21/9", "3/4", "9/16"],
      },
    ],
    defaultChildren: [
      { defId: "html.img", props: { src: "https://placehold.co/640x360", alt: "Ảnh" } },
    ],
  },
  {
    id: "shadcn.spinner",
    title: "Spinner",
    category: "Feedback",
    tags: ["feedback", "spinner", "loading", "shadcn"],
    canHaveChildren: false,
    defaultProps: { size: 24 },
    propsSchema: [{ key: "size", label: "Kích thước", inputType: "number" }],
  },
  {
    id: "shadcn.empty",
    title: "Empty State",
    category: "Data Display",
    tier: "component",
    tags: ["data", "empty", "placeholder", "no data"],
    canHaveChildren: true,
    defaultProps: {},
    propsSchema: [],
    defaultStyle: {
      direction: "flex-col",
      align: "items-center",
      justify: "justify-center",
      gap: 2,
      padding: 8,
      textAlign: "center",
      borderWidth: 1,
      borderColor: "zinc-300",
      borderRadius: "lg",
    },
    defaultChildren: [
      { defId: "html.icon", props: { name: "Inbox", size: 40 } },
      { defId: "html.h3", props: { text: "Chưa có dữ liệu" } },
      { defId: "html.p", props: { text: "Hãy thêm mục đầu tiên để bắt đầu." } },
      { defId: "shadcn.button", props: { text: "Thêm mới" } },
    ],
  },
];
