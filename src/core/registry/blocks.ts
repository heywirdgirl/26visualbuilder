import type { BlockDefinition } from "@/core/types/block.types";
import type { DefaultChildSpec } from "@/core/types/node-definition.types";
import { getNodeDefinition } from "./node-registry";
import { canContain } from "./node-rules";
import { getStylePreset } from "./style-presets";

type S = Record<string, unknown>;

const n = (
  defId: string,
  preset?: string,
  props?: S,
  children: DefaultChildSpec[] = [],
  style?: S
): DefaultChildSpec => ({ defId, preset, props, style, children });
const t = (defId: string, preset: string | undefined, text: string, style?: S) =>
  n(defId, preset, { text }, [], style);
const btn = (text: string, variant = "default", preset = "button-soft") =>
  n("shadcn.button", preset, { text, variant });
const link = (text: string) => n("html.a", "link", { href: "#" }, [t("html.span", undefined, text)]);
const icon = (name: string, size = 24, style?: S) => n("html.icon", undefined, { name, size }, [], style);
const head = (eyebrow: string, title: string, lead: string) =>
  n(
    "html.div",
    "stack",
    undefined,
    [
      t("html.span", "eyebrow", eyebrow),
      t("html.h2", "heading-section", title),
      t("html.p", "text-lead", lead),
    ],
    { align: "items-center", textAlign: "center", gap: 2 }
  );

const feature = (ic: string, title: string, desc: string) =>
  n("shadcn.card", "card", undefined, [
    icon(ic, 28, { textColor: "blue-500" }),
    t("html.h3", "heading-card", title),
    t("html.p", "text-muted", desc),
  ]);

const tier = (name: string, price: string, note: string, items: string[], featured = false) =>
  n("shadcn.card", featured ? "card-featured" : "card", undefined, [
    t("html.h3", "heading-card", name),
    t("html.p", "price", price),
    t("html.p", "text-muted", note),
    n(
      "html.ul",
      "list",
      undefined,
      items.map((item) =>
        n("html.li", "list-item", undefined, [
          icon("Check", 16, { textColor: "blue-500" }),
          t("html.span", undefined, item),
        ])
      )
    ),
    btn(featured ? "Chọn gói này" : "Bắt đầu", "default", "button-block"),
  ]);

const quote = (text: string, name: string, role: string, fallback: string) =>
  n("shadcn.card", "card", undefined, [
    t("html.p", "text-body", `“${text}”`),
    n("html.div", "row", undefined, [
      n("shadcn.avatar", undefined, { src: "", fallback }),
      n(
        "html.div",
        "stack",
        undefined,
        [
          t("html.p", undefined, name, { fontWeight: "semibold", textColor: "zinc-900" }),
          t("html.p", "text-muted", role),
        ],
        { gap: 0 }
      ),
    ]),
  ]);

const field = (label: string, placeholder: string, type: string) =>
  n(
    "html.div",
    "stack",
    undefined,
    [
      t("shadcn.label", "label", label),
      n("shadcn.input", undefined, { placeholder, type }),
    ],
    { gap: 2 }
  );

const stat = (value: string, label: string) =>
  n(
    "html.div",
    "stack",
    undefined,
    [t("html.h2", "heading-section", value), t("html.p", "text-muted", label)],
    { align: "items-center", textAlign: "center", gap: 1 }
  );

const faqItem = (question: string, answer: string) =>
  n("shadcn.accordion-item", undefined, undefined, [
    n("shadcn.accordion-trigger", undefined, { text: question }),
    n("shadcn.accordion-content", undefined, undefined, [t("html.p", "text-body", answer)]),
  ]);

const col = (title: string, items: string[]) =>
  n(
    "html.div",
    "stack",
    undefined,
    [
      t("html.p", undefined, title, { fontWeight: "semibold", textColor: "zinc-900" }),
      n("html.ul", "list", undefined, items.map((item) => n("html.li", "list-item", undefined, [link(item)]))),
    ],
    { gap: 3 }
  );

export const BLOCK_CATEGORY_ORDER = ["Điều hướng", "Mở đầu", "Nội dung", "Biểu mẫu", "Chân trang"];

export const BLOCKS: BlockDefinition[] = [
  {
    id: "block.navbar",
    title: "Navbar",
    category: "Điều hướng",
    description: "Thanh điều hướng: logo, 3 liên kết, nút đăng nhập.",
    tags: ["navbar", "header", "menu", "nav"],
    spec: n("html.header", "navbar", undefined, [
      t("html.span", "heading-card", "Brand"),
      n("html.nav", "row", undefined, [link("Trang chủ"), link("Tính năng"), link("Bảng giá")], { gap: 6 }),
      btn("Đăng nhập"),
    ]),
  },
  {
    id: "block.hero",
    title: "Hero",
    category: "Mở đầu",
    description: "Tiêu đề lớn, mô tả và 2 nút hành động ở giữa.",
    tags: ["hero", "landing", "banner", "headline"],
    spec: n("html.section", "hero", undefined, [
      t("html.span", "eyebrow", "Mới ra mắt"),
      t("html.h1", "heading-hero", "Xây dựng giao diện nhanh hơn bao giờ hết"),
      t("html.p", "text-lead", "Một câu mô tả ngắn gọn giá trị sản phẩm của bạn, rõ ràng và dễ hiểu."),
      n(
        "html.div",
        "row",
        undefined,
        [btn("Bắt đầu ngay"), btn("Tìm hiểu thêm", "outline")],
        { justify: "justify-center", flexWrap: "flex-wrap" }
      ),
    ]),
  },
  {
    id: "block.features",
    title: "Tính năng",
    category: "Nội dung",
    description: "Tiêu đề mục và lưới 3 thẻ tính năng có icon.",
    tags: ["features", "grid", "benefits", "cards"],
    spec: n("html.section", "section", undefined, [
      head("Tính năng", "Mọi thứ bạn cần", "Những điểm nổi bật giúp sản phẩm khác biệt."),
      n("html.div", "grid-3", undefined, [
        feature("Zap", "Nhanh chóng", "Hoạt động mượt mà, tải trang gần như tức thì."),
        feature("ShieldCheck", "An toàn", "Dữ liệu được bảo vệ ở mọi bước."),
        feature("Sparkles", "Dễ dùng", "Giao diện trực quan, không cần hướng dẫn."),
      ]),
    ]),
  },
  {
    id: "block.pricing",
    title: "Bảng giá",
    category: "Nội dung",
    description: "3 gói giá, gói giữa được làm nổi bật.",
    tags: ["pricing", "plans", "tiers", "price"],
    spec: n("html.section", "section", undefined, [
      head("Bảng giá", "Chọn gói phù hợp", "Nâng cấp hoặc hủy bất cứ lúc nào."),
      n("html.div", "grid-3", undefined, [
        tier("Starter", "$9", "Cho cá nhân", ["1 dự án", "Hỗ trợ email"]),
        tier("Pro", "$19", "Cho nhóm đang lớn", ["10 dự án", "Hỗ trợ ưu tiên", "Phân tích nâng cao"], true),
        tier("Business", "$49", "Cho doanh nghiệp", ["Không giới hạn dự án", "Quản lý thành viên", "SLA 99.9%"]),
      ]),
    ]),
  },
  {
    id: "block.testimonials",
    title: "Đánh giá",
    category: "Nội dung",
    description: "3 thẻ nhận xét khách hàng có ảnh đại diện.",
    tags: ["testimonials", "reviews", "quotes", "social proof"],
    spec: n("html.section", "section", undefined, [
      head("Khách hàng nói gì", "Được tin dùng mỗi ngày", "Phản hồi thật từ những người đã sử dụng."),
      n("html.div", "grid-3", undefined, [
        quote("Sản phẩm giúp nhóm mình tiết kiệm rất nhiều thời gian.", "Nguyễn An", "Product Manager", "NA"),
        quote("Dễ dùng, đẹp và đúng thứ mình cần.", "Trần Bình", "Designer", "TB"),
        quote("Hỗ trợ nhiệt tình, cập nhật liên tục.", "Lê Chi", "Founder", "LC"),
      ]),
    ]),
  },
  {
    id: "block.stats",
    title: "Số liệu",
    category: "Nội dung",
    description: "Hàng 4 con số nổi bật kèm nhãn.",
    tags: ["stats", "numbers", "metrics", "counter"],
    spec: n("html.section", "section", undefined, [
      n("html.div", "grid-4", undefined, [
        stat("10K+", "Người dùng"),
        stat("50+", "Quốc gia"),
        stat("99.9%", "Uptime"),
        stat("24/7", "Hỗ trợ"),
      ]),
    ]),
  },
  {
    id: "block.cta",
    title: "Kêu gọi hành động",
    category: "Mở đầu",
    description: "Khối nền tối với tiêu đề, mô tả và một nút.",
    tags: ["cta", "call to action", "banner", "signup"],
    spec: n(
      "html.div",
      "card-dark",
      undefined,
      [
        t("html.h2", undefined, "Sẵn sàng bắt đầu?", {
          fontSize: "3xl",
          fontWeight: "bold",
          textColor: "white",
        }),
        t("html.p", undefined, "Tạo tài khoản miễn phí chỉ trong vài giây.", { textColor: "zinc-300" }),
        btn("Dùng thử miễn phí", "secondary"),
      ],
      { align: "items-center", textAlign: "center", paddingY: 12 }
    ),
  },
  {
    id: "block.faq",
    title: "Câu hỏi thường gặp",
    category: "Nội dung",
    description: "Tiêu đề và danh sách hỏi đáp dạng accordion.",
    tags: ["faq", "questions", "accordion", "help"],
    spec: n("html.section", "section", undefined, [
      head("FAQ", "Câu hỏi thường gặp", "Không thấy câu trả lời bạn cần? Hãy liên hệ chúng tôi."),
      n("shadcn.accordion", undefined, undefined, [
        faqItem("Tôi có thể dùng thử miễn phí không?", "Có, bạn được dùng thử đầy đủ tính năng trong 14 ngày."),
        faqItem("Tôi có thể hủy bất cứ lúc nào?", "Có, hủy trong phần cài đặt tài khoản, không mất phí."),
        faqItem("Có hỗ trợ xuất hóa đơn không?", "Có, hóa đơn được gửi tự động qua email mỗi kỳ."),
        faqItem("Dữ liệu của tôi có an toàn không?", "Dữ liệu được mã hóa khi lưu trữ và khi truyền tải."),
      ]),
    ]),
  },
  {
    id: "block.login",
    title: "Form đăng nhập",
    category: "Biểu mẫu",
    description: "Thẻ đăng nhập: email, mật khẩu, nút gửi.",
    tags: ["login", "signin", "form", "auth"],
    spec: n("shadcn.card", "card", undefined, [
      t("html.h2", "heading-section", "Đăng nhập"),
      t("html.p", "text-muted", "Nhập email và mật khẩu để tiếp tục."),
      field("Email", "email@example.com", "email"),
      field("Mật khẩu", "••••••••", "password"),
      btn("Đăng nhập", "default", "button-block"),
      t("html.p", "text-muted", "Chưa có tài khoản? Đăng ký"),
    ], { maxWidth: "md" }),
  },
  {
    id: "block.footer",
    title: "Footer",
    category: "Chân trang",
    description: "Chân trang 4 cột, đường kẻ và dòng bản quyền.",
    tags: ["footer", "links", "bottom", "copyright"],
    spec: n("html.footer", "footer", undefined, [
      n("html.div", "grid-4", undefined, [
        n("html.div", "stack", undefined, [
          t("html.h3", "heading-card", "Brand"),
          t("html.p", "text-muted", "Mô tả ngắn về thương hiệu của bạn."),
        ], { gap: 2 }),
        col("Sản phẩm", ["Tính năng", "Bảng giá", "Cập nhật"]),
        col("Công ty", ["Giới thiệu", "Tuyển dụng", "Liên hệ"]),
        col("Hỗ trợ", ["Trung tâm trợ giúp", "Điều khoản", "Bảo mật"]),
      ]),
      n("shadcn.separator"),
      t("html.p", "text-muted", "© 2026 Brand. Mọi quyền được bảo lưu."),
    ]),
  },
];

export function getBlock(id: string): BlockDefinition | undefined {
  return BLOCKS.find((block) => block.id === id);
}

export function searchBlocks(query: string): BlockDefinition[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return BLOCKS;
  return BLOCKS.filter((block) =>
    [block.title, block.description, block.category, ...block.tags].some((value) =>
      value.toLowerCase().includes(normalizedQuery)
    )
  );
}

export function countSpecNodes(spec: DefaultChildSpec): number {
  return 1 + (spec.children ?? []).reduce((sum, child) => sum + countSpecNodes(child), 0);
}

function validate(
  spec: DefaultChildSpec,
  parentId: string | undefined,
  path: string,
  problems: string[]
) {
  const def = getNodeDefinition(spec.defId);
  if (!def) {
    problems.push(`${path}: node "${spec.defId}" không tồn tại`);
    return;
  }
  if (spec.preset && !getStylePreset(spec.preset)) {
    problems.push(`${path}: preset "${spec.preset}" không tồn tại`);
  }
  if (!def.canHaveChildren && (spec.children?.length ?? 0) > 0) {
    problems.push(`${path}: "${spec.defId}" là node lá nhưng có con`);
  }
  const parentDef = parentId ? getNodeDefinition(parentId) : undefined;
  if (parentDef && !canContain(parentDef, def.nodeKind, def)) {
    problems.push(`${path}: "${parentId}" không được chứa "${spec.defId}"`);
  }
  spec.children?.forEach((child, index) =>
    validate(child, spec.defId, `${path} > ${child.defId}[${index}]`, problems)
  );
}

if (process.env.NODE_ENV !== "production") {
  const problems: string[] = [];
  BLOCKS.forEach((block) => validate(block.spec, undefined, block.id, problems));
  if (problems.length) {
    console.warn("[blocks] Phát hiện lỗi trong định nghĩa block:\n" + problems.join("\n"));
  }
}
