import { NodeCategory, NodeDefinition } from "@/core/types/node-definition.types";

type RawDef = Omit<NodeDefinition, "nodeKind">;

const text = (
  name: string,
  title: string,
  category: NodeCategory,
  defaultText: string,
  tags: string[] = [],
  multiline = false,
  extra: Partial<RawDef> = {}
): RawDef => ({
  id: `html.${name}`,
  title,
  category,
  tags: [name, ...tags],
  canHaveChildren: false,
  defaultProps: { text: defaultText },
  propsSchema: [{ key: "text", label: "Nội dung", inputType: multiline ? "textarea" : "text" }],
  ...extra,
});

const box = (
  name: string,
  title: string,
  category: NodeCategory,
  tags: string[] = [],
  extra: Partial<RawDef> = {}
): RawDef => ({
  id: `html.${name}`,
  title,
  category,
  tags: [name, ...tags],
  canHaveChildren: true,
  defaultProps: {},
  propsSchema: [],
  ...extra,
});

const cellStyle = { padding: 2, borderWidth: 1 as const, borderColor: "zinc-300" };

export const htmlExtraRawNodes: RawDef[] = [
  text("h4", "Heading 4", "Typography", "Heading 4", ["heading", "title"]),
  text("h5", "Heading 5", "Typography", "Heading 5", ["heading", "title"]),
  text("h6", "Heading 6", "Typography", "Heading 6", ["heading", "title"]),
  text("strong", "Bold", "Typography", "Chữ đậm", ["bold", "strong"]),
  text("em", "Italic", "Typography", "Chữ nghiêng", ["italic", "emphasis"]),
  text("small", "Small", "Typography", "Chữ nhỏ", ["small", "note"]),
  text("mark", "Highlight", "Typography", "Chữ nổi bật", ["highlight", "mark"]),
  text("code", "Code", "Typography", "console.log()", ["code", "inline"]),
  text("kbd", "Keyboard", "Typography", "Ctrl + K", ["keyboard", "shortcut"]),
  text("blockquote", "Quote", "Typography", "Một câu trích dẫn đáng nhớ.", ["quote", "blockquote"], true),
  text("pre", "Preformatted", "Typography", "dòng 1\ndòng 2", ["code", "block", "pre"], true),
  text("address", "Address", "Typography", "123 Đường ABC\nHà Nội", ["address", "contact"], true),
  {
    id: "html.time",
    title: "Time",
    category: "Typography",
    tags: ["time", "date"],
    canHaveChildren: false,
    defaultProps: { text: "15/10/2026", dateTime: "2026-10-15" },
    propsSchema: [
      { key: "text", label: "Nội dung hiển thị", inputType: "text" },
      { key: "dateTime", label: "Giá trị (YYYY-MM-DD)", inputType: "text" },
    ],
  },

  box("form", "Form", "Form", ["form", "submit"], {
    tier: "component",
    defaultChildren: [
      { defId: "html.label", props: { text: "Email" } },
      { defId: "html.input", props: { placeholder: "email@example.com", type: "email" } },
      { defId: "html.button", props: { text: "Gửi" } },
    ],
  }),
  box("fieldset", "Fieldset", "Form", ["form", "group"], {
    tier: "component",
    defaultChildren: [
      { defId: "html.legend" },
      { defId: "html.input", props: { placeholder: "Nhập nội dung..." } },
    ],
  }),
  text("legend", "Legend", "Form", "Thông tin cá nhân", [], false, { parentOnly: ["html.fieldset"] }),

  box("figure", "Figure", "Media", ["figure", "image", "caption"], {
    tier: "component",
    defaultChildren: [{ defId: "html.img" }, { defId: "html.figcaption" }],
  }),
  text("figcaption", "Figcaption", "Media", "Chú thích ảnh", [], false, { parentOnly: ["html.figure"] }),

  box("details", "Details", "Layout", ["details", "toggle", "collapse"], {
    tier: "component",
    defaultChildren: [
      { defId: "html.summary" },
      { defId: "html.p", props: { text: "Nội dung ẩn, bấm tiêu đề để mở." } },
    ],
  }),
  text("summary", "Summary", "Layout", "Bấm để xem thêm", [], false, { parentOnly: ["html.details"] }),
  {
    id: "html.hr",
    title: "Horizontal Rule",
    category: "Layout",
    tags: ["hr", "divider", "line"],
    canHaveChildren: false,
    defaultProps: {},
    propsSchema: [],
  },

  box("dl", "Description List", "List", ["description", "glossary"], {
    tier: "component",
    allowedChildIds: ["html.dt", "html.dd"],
    defaultStyle: { direction: "flex-col", gap: 1 },
    defaultChildren: [
      { defId: "html.dt", props: { text: "Thuật ngữ 1" } },
      { defId: "html.dd", props: { text: "Giải thích cho thuật ngữ 1." } },
      { defId: "html.dt", props: { text: "Thuật ngữ 2" } },
      { defId: "html.dd", props: { text: "Giải thích cho thuật ngữ 2." } },
    ],
  }),
  text("dt", "Term", "List", "Thuật ngữ", [], false, { parentOnly: ["html.dl"] }),
  text("dd", "Definition", "List", "Giải thích", [], false, { parentOnly: ["html.dl"] }),

  box("table", "Table (HTML)", "Data Display", ["table", "grid", "data"], {
    tier: "component",
    allowedChildIds: ["html.thead", "html.tbody"],
    defaultStyle: { width: "full" },
    defaultChildren: [
      {
        defId: "html.thead",
        children: [
          {
            defId: "html.tr",
            children: [1, 2, 3].map((index) => ({
              defId: "html.th",
              props: { text: `Cột ${index}` },
            })),
          },
        ],
      },
      {
        defId: "html.tbody",
        children: [1, 2].map((row) => ({
          defId: "html.tr",
          children: [1, 2, 3].map((column) => ({
            defId: "html.td",
            props: { text: `Ô ${row}.${column}` },
          })),
        })),
      },
    ],
  }),
  box("thead", "Table Head Group", "Data Display", ["thead"], {
    parentOnly: ["html.table"],
    allowedChildIds: ["html.tr"],
  }),
  box("tbody", "Table Body Group", "Data Display", ["tbody"], {
    parentOnly: ["html.table"],
    allowedChildIds: ["html.tr"],
  }),
  box("tr", "Table Row (HTML)", "Data Display", ["tr", "row"], {
    parentOnly: ["html.thead", "html.tbody"],
    allowedChildIds: ["html.th", "html.td"],
    defaultChildren: [1, 2, 3].map((index) => ({
      defId: "html.td",
      props: { text: `Ô ${index}` },
    })),
  }),
  text("th", "Header Cell", "Data Display", "Tiêu đề", ["th", "cell"], false, {
    parentOnly: ["html.tr"],
    defaultStyle: { ...cellStyle, fontWeight: "semibold", textAlign: "left" },
  }),
  text("td", "Cell", "Data Display", "Ô", ["td", "cell"], false, {
    parentOnly: ["html.tr"],
    defaultStyle: cellStyle,
  }),

  {
    id: "html.video",
    title: "Video",
    category: "Media",
    tags: ["video", "media", "player"],
    canHaveChildren: false,
    defaultProps: {
      src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      controls: true,
    },
    propsSchema: [
      { key: "src", label: "Đường dẫn video", inputType: "text" },
      { key: "controls", label: "Hiện điều khiển", inputType: "checkbox" },
    ],
  },
  {
    id: "html.audio",
    title: "Audio",
    category: "Media",
    tags: ["audio", "media", "sound", "player"],
    canHaveChildren: false,
    defaultProps: {
      src: "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
      controls: true,
    },
    propsSchema: [
      { key: "src", label: "Đường dẫn audio", inputType: "text" },
      { key: "controls", label: "Hiện điều khiển", inputType: "checkbox" },
    ],
  },
  {
    id: "html.iframe",
    title: "Iframe",
    category: "Media",
    tags: ["iframe", "embed", "website"],
    canHaveChildren: false,
    defaultProps: { src: "https://example.com", title: "Trang nhúng" },
    propsSchema: [
      { key: "src", label: "Đường dẫn trang", inputType: "text" },
      { key: "title", label: "Tiêu đề (accessibility)", inputType: "text" },
    ],
  },

  {
    id: "html.progress",
    title: "Progress (HTML)",
    category: "Feedback",
    tags: ["progress", "loading", "bar"],
    canHaveChildren: false,
    defaultProps: { value: 50, max: 100 },
    propsSchema: [
      { key: "value", label: "Giá trị", inputType: "number" },
      { key: "max", label: "Tối đa", inputType: "number" },
    ],
  },
];
