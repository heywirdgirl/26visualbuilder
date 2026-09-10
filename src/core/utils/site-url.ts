// src/core/utils/site-url.ts


import "server-only"; // build sẽ báo lỗi ngay nếu file này lỡ bị import vào Client Component

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name} — kiểm tra .env.local hoặc wrangler.jsonc.`);
  }
  return value;
}

// KHÔNG dùng tiền tố NEXT_PUBLIC_ — đúng bài học từ NEXT_PUBLIC_SITE_URL từng gây bug
// redirect sai domain ở luồng login OAuth. Chỉ server đọc biến này (Share, Metadata,
// Sitemap đều chạy server-side), nên không cần "đóng cứng" lúc build như R2_PUBLIC_URL.
export function getSiteUrl(): string {
  return requireEnv("SITE_URL").replace(/\/+$/, ""); // bỏ "/" thừa cuối, tránh double-slash khi ghép path
}

export function getPostUrl(username: string, slug: string): string {
  return `${getSiteUrl()}/${username}/${slug}`;
}

export function getProfileUrl(username: string): string {
  return `${getSiteUrl()}/${username}`;
}

// Fallback OG image khi post.thumbnail_url null (hiếm, nhưng vẫn cần đúng PRD mục 9).
// File ảnh thật (public/og-fallback.png) là việc bạn chuẩn bị ở Phase 5, chưa cần có ngay.
export function getFallbackOgImageUrl(): string {
  return `${getSiteUrl()}/og-fallback.png`;
}
