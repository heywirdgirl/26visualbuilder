// src/app/auth/auth-code-error/page.tsx


export default function AuthCodeErrorPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-lg font-semibold mb-2">Đăng nhập thất bại</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Link xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử đăng nhập lại.
        </p>
        <a href="/" className="text-sm text-primary underline">
          Quay lại trang chủ
        </a>
      </div>
    </div>
  );
}