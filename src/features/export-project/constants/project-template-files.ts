// features/export-project/constants/project-template-files.ts



import { GeneratedFile } from "@/core/types/generated-file.types";
import { slugifyPathSegment } from "@/features/code-generator/utils/path-utils";

const BASE_DEPENDENCIES: Record<string, string> = {
  next: "16.2.9",
  react: "19.2.4",
  "react-dom": "19.2.4",
  cn: "^0.2.6",
  "class-variance-authority": "^0.7.1",
  clsx: "^2.1.1",
  "lucide-react": "^1.21.0",
  "radix-ui": "^1.6.0",
  "tailwind-merge": "^3.6.0",
  "react-resizable-panels": "^4.14.5",
};

const PACKAGE_JSON = (projectSlug: string, extraDeps: Record<string, string> = {}) => {
  const dependencies = Object.fromEntries(
    Object.entries({ ...BASE_DEPENDENCIES, ...extraDeps }).sort(([left], [right]) =>
      left.localeCompare(right)
    )
  );
  return JSON.stringify(
    {
      name: projectSlug,
      version: "0.1.0",
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start" },
      dependencies,
      devDependencies: {
        "@tailwindcss/postcss": "^4",
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        tailwindcss: "^4",
        typescript: "^5",
      },
    },
    null,
    2
  ) + "\n";
};

const TSCONFIG_JSON = `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

const NEXT_CONFIG_TS = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
`;

const POSTCSS_CONFIG_MJS = `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;

const GLOBALS_CSS = (includeShadcnStyles: boolean) => `@import "tailwindcss";
${includeShadcnStyles ? '@import "tw-animate-css";\n@import "shadcn/tailwind.css";\n' : ""}

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, monospace;
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

html, body {
  height: 100%;
  margin: 0;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
`;

const LAYOUT_TSX = (projectName: string) => `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${projectName}",
  description: "Generated by 26VisualBuilder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

// Nội dung y hệt file shadcn CLI cài — luôn nhúng cố định, không phụ thuộc project có
// dùng shadcn.* node nào hay không, vì rẻ (vài trăm byte) và mọi file ui/*.tsx (Phase 2)
// đều import file này. Thiếu nó là lỗi Module not found ngay khi build.
const LIB_UTILS_TS = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const GITIGNORE = `node_modules
.next
.env*.local
.DS_Store
*.tsbuildinfo
`;

const README_MD = (projectName: string) => `# ${projectName}

Generated by **26VisualBuilder**.

## Stack
- Next.js 16
- React 19
- Tailwind CSS v4
- shadcn/ui

## Run

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Mở [http://localhost:3000](http://localhost:3000).

## Ghi chú
Phần state/logic/event **chưa được sinh tự động** — Builder chỉ xuất cấu trúc UI. Bạn tự viết tiếp phần này, hoặc dùng AI coding agent (Cursor, Claude Code...) dựa trên khung UI đã có sẵn trong \`app/\` và \`components/\`.
`;

export function getProjectTemplateFiles(
  projectName: string,
  extraDeps: Record<string, string> = {}
): GeneratedFile[] {
  const slug = slugifyPathSegment(projectName);

  return [
    { path: "package.json", content: PACKAGE_JSON(slug, extraDeps) },
    { path: "tsconfig.json", content: TSCONFIG_JSON },
    { path: "next.config.ts", content: NEXT_CONFIG_TS },
    { path: "postcss.config.mjs", content: POSTCSS_CONFIG_MJS },
    { path: "app/globals.css", content: GLOBALS_CSS("shadcn" in extraDeps) },
    { path: "app/layout.tsx", content: LAYOUT_TSX(projectName) },
    { path: "lib/utils.ts", content: LIB_UTILS_TS },
    { path: ".gitignore", content: GITIGNORE },
    { path: "README.md", content: README_MD(projectName) },
  ];
}
