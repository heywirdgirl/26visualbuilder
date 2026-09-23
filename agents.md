Xác nhận đúng nguyên nhân, và đây là 1 giới hạn **đã biết, được chính đội Radix UI (thư viện nền của shadcn) thừa nhận** — không phải bug ngẫu nhiên. Tra cứu GitHub Issues chính thức của Radix xác nhận: khi đặt 1 Popover **bên trong** `DropdownMenuItem`, hành vi mặc định là bấm vào nội dung Popover sẽ kích hoạt DropdownMenu tự đóng lại — và vì đó cũng làm Popover đóng theo. Cách vá tạm (`preventDefault` trong `onSelect`) được chính tác giả thư viện xác nhận **có tác dụng phụ khác** (hỏng điều hướng bàn phím, focus). Đây là do cách bạn lồng `ExportImageButton` (tự quản lý Popover riêng) **vào bên trong** `DropdownMenuItem` — không phải do tính năng "auto lấy ảnh từ trang" bạn nghi ngờ, 2 việc đó hoàn toàn không liên quan.

**Vì sao `ExportProjectButton` cạnh đó không bị lỗi này:** nó dùng `window.prompt()` — hộp thoại **gốc của trình duyệt**, không phải component React do Radix quản lý — nên không bị ảnh hưởng khi DropdownMenu đóng/mở. Chỉ `ExportImageButton` (Popover thật) mới dính.

**Cách sửa đúng, không phải vá tạm:** tách hẳn phần "chọn độ phân giải + xuất ảnh" ra khỏi cây `DropdownMenu` — chuyển từ Popover sang **Dialog độc lập**, điều khiển bằng state ở `AppShell`, `DropdownMenuItem` chỉ còn việc bật cờ `open = true` rồi để menu tự đóng bình thường (không cần `preventDefault` gì cả — đây chính xác là cách 1 kỹ sư của Radix khuyên trong thảo luận chính thức: tạo Dialog riêng không có trigger, item chỉ gọi `setOpen(true)`).

## File mới: `features/export-image/components/export-image-dialog.tsx`

```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/core/utils/cn";
import { useExportImage } from "../hooks/use-export-image";

const RESOLUTION_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
];

// Dialog ĐỘC LẬP — không nằm bên trong DropdownMenuContent nào cả, nên không bị unmount
// theo khi menu đóng. AppShell chỉ cần setOpen(true) từ 1 DropdownMenuItem bình thường.
export function ExportImageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { exportImage, isExporting, canExport } = useExportImage();
  const [pixelRatio, setPixelRatio] = useState<1 | 2 | 3>(2);

  const handleExportClick = async () => {
    await exportImage(pixelRatio);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Export Image</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-medium mb-1.5">Độ phân giải</p>
            <div className="flex gap-1">
              {RESOLUTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPixelRatio(opt.value)}
                  className={cn(
                    "flex-1 border rounded py-1.5 text-xs",
                    pixelRatio === opt.value && "bg-primary/10 border-primary text-primary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Ảnh dùng link từ domain ngoài (không bật CORS) có thể bị trắng/thiếu trong file xuất ra.
          </p>

          <Button size="sm" onClick={handleExportClick} disabled={isExporting || !canExport}>
            {isExporting ? "Đang xuất..." : `Xuất ảnh (${pixelRatio}x)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Xoá file cũ** `features/export-image/components/export-image-button.tsx` — chỉ được dùng đúng 1 nơi (`AppShell`), thay hoàn toàn bởi `ExportImageDialog`, giữ lại sẽ thành dead code gây rối.

## Patch `features/app-shell/components/app-shell.tsx`

Thêm import:
```typescript
import { useState } from "react";
import { ImageDown } from "lucide-react"; // thêm vào dòng import lucide-react đã có
import { ExportImageDialog } from "@/features/export-image/components/export-image-dialog";
```
Bỏ import cũ:
```typescript
// Xoá dòng:
import { ExportImageButton } from "@/features/export-image/components/export-image-button";
```

Thêm state (đầu function `AppShell`):
```typescript
const [exportImageOpen, setExportImageOpen] = useState(false);
```

Đổi `DropdownMenuItem` của Export Image:
```tsx
// Đổi:
<DropdownMenuItem asChild className="cursor-pointer">
  <div className="w-full">
    <ExportImageButton />
  </div>
</DropdownMenuItem>
// Thành:
<DropdownMenuItem onSelect={() => setExportImageOpen(true)} className="cursor-pointer">
  <ImageDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
  Export Image
</DropdownMenuItem>
```

Thêm `<ExportImageDialog />` **ngoài** cây `<aside>`/`<DropdownMenu>` hoàn toàn — đặt cạnh `</div>` đóng ngoài cùng của component:
```tsx
      {menuHidden && (
        <button ...>Visual</button>
      )}

      {/* Nằm ngoài DropdownMenu — không phụ thuộc vòng đời mount/unmount của menu */}
      <ExportImageDialog open={exportImageOpen} onOpenChange={setExportImageOpen} />
    </div>
  );
}
```

`ExportProjectButton` giữ nguyên y hệt cách bạn đang đặt (`asChild` lồng trong `DropdownMenuItem`) — không cần sửa, vì đúng như phân tích, `window.prompt()` không dính lỗi này.

---
**Test nhanh:** mở dropdown → bấm "Export Image" → menu đóng lại bình thường (đúng, không phải lỗi) → **ngay sau đó** Dialog chọn độ phân giải phải hiện ra và **đứng yên**, chọn 1x/2x/3x, bấm "Xuất ảnh" → phải chạy đúng, không tự tắt nửa chừng nữa.