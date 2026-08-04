This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
branch sidebar
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Cấu trúc thư mục quan trọng trong src/

Dưới đây là các thư mục chính và vai trò của chúng trong project:

- `src/app/`: entry point của Next.js App Router, gồm layout, trang chính và các route như auth callback.
- `src/components/ui/`: các component UI cơ bản được tái sử dụng, thường là wrapper cho shadcn/ui.
- `src/core/`: tầng cốt lõi của app, bao gồm:
  - `core/providers/`: providers cho ứng dụng như client provider.
  - `core/registry/`: đăng ký các node/component hệ thống, quy tắc render và dependency UI.
  - `core/store/`: store Zustand dùng để quản lý state builder.
  - `core/supabase/`: client/server helper cho Supabase Auth và session.
  - `core/types/`: các type TypeScript cho builder, node, style và file export.
  - `core/utils/`: hàm tiện ích dùng chung như `cn`, style cascade và chuyển đổi style sang class.
- `src/features/`: các feature chính của ứng dụng, chia theo module:
  - `features/auth/`: auth hook và UI login/logout.
  - `features/canvas-preview/`: preview và render component lên canvas.
  - `features/code-generator/`: sinh code và modal xem code.
  - `features/export-image/`: export ảnh từ preview.
  - `features/export-project/`: export project thành file zip.
  - `features/inspector/`: panel chỉnh sửa thuộc tính.
  - `features/node-palette/`: bảng chọn node/component.
  - `features/nodes-tree/`: cây node và thao tác trên tree.
- `src/lib/`: các tiện ích bổ sung dùng chung cho app.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
