// core/utils/escape-jsx-text.ts

export function escapeJsxText(value: unknown): string {
  return String(value ?? "").replace(
    /[{}<>]/g,
    (ch) => ({ "{": "&#123;", "}": "&#125;", "<": "&lt;", ">": "&gt;" }[ch] as string)
  );
}

export function escapeAttr(value: unknown): string {
  return String(value ?? "").replace(/"/g, "&quot;");
}