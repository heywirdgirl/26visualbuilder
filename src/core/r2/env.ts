function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name} — kiểm tra .env.local hoặc Cloudflare Dashboard.`);
  }
  return value;
}

export function getR2PublicUrl(): string {
  // Lấy từ biến môi trường, ví dụ: https://img.26visualbuilder.com
  // hoặc https://26visualbuilder-image.r2.dev nếu dùng default R2 domain
  return requireEnv("R2_PUBLIC_URL");
}
