

## File mới: `features/profile/actions/update-profile-action.ts`

```typescript
"use server";

import { createClient } from "@/core/supabase/server";

export async function updateProfileAction({
  displayName,
  username,
}: {
  displayName: string;
  username: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập." };

  // display_name: update thẳng qua RLS bình thường — không có ràng buộc unique nên
  // không cần đi qua RPC như username.
  const { error: displayNameError } = await supabase
    .from("profiles")
    .update({ display_name: displayName.trim() || null })
    .eq("id", user.id);

  if (displayNameError) {
    console.error("[profile] Cập nhật display_name thất bại:", displayNameError);
    return { error: "Không thể cập nhật tên hiển thị." };
  }

  // username: BẮT BUỘC qua RPC — trigger prevent_direct_username_change chặn mọi
  // đường khác, đảm bảo redirect history luôn được ghi đúng.
  const { error: usernameError } = await supabase.rpc("change_username", {
    new_username: username,
  });

  if (usernameError) {
    console.error("[profile] Đổi username thất bại:", usernameError);
    return { error: usernameError.message ?? "Không thể đổi username." };
  }

  return { success: true as const };
}
```

## File mới: `features/profile/components/profile-form.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { updateProfileAction } from "../actions/update-profile-action";

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

function slugifyPreview(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

export function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialProfile.display_name ?? "");
  const [username, setUsername] = useState(initialProfile.username);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewSlug = slugifyPreview(username);
  const isValidFormat = /^[a-z0-9-]{3,30}$/.test(previewSlug);

  const handleSave = async () => {
    setError(null);
    if (!isValidFormat) {
      setError("Username phải 3-30 ký tự, chỉ gồm chữ thường/số/dấu gạch ngang.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfileAction({ displayName, username: previewSlug });
      if (!res.success) {
        setError(res.error ?? "Lưu thất bại.");
        return;
      }
      setUsername(previewSlug);
      router.refresh(); // đồng bộ lại Server Component khác (Feed/Sidebar dùng username mới)
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          {initialProfile.avatar_url && <AvatarImage src={initialProfile.avatar_url} alt={displayName} />}
          <AvatarFallback>{(displayName || username).slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground">Avatar đồng bộ từ Google, chưa hỗ trợ đổi riêng.</p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Tên hiển thị
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tên của bạn" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Username
        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground shrink-0">26visualbuilder.app/</span>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} className="flex-1" />
        </div>
        {username !== previewSlug && (
          <span className="text-xs text-muted-foreground">Sẽ lưu thành: {previewSlug || "—"}</span>
        )}
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </div>
  );
}
```

## File mới: `src/app/(shell)/profile/page.tsx`

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/core/supabase/server";
import { ProfileForm } from "@/features/profile/components/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (error || !profile) redirect("/");

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-lg font-semibold mb-4">Profile Settings</h1>
      <ProfileForm initialProfile={profile} />
    </div>
  );
}
```

## Patch `features/auth/components/login-button.tsx`

Thêm lối vào `/profile` — hiện chưa có chỗ nào dẫn tới trang này. Thêm import:
```typescript
import Link from "next/link";
```

Đổi phần hiện khi đã login (bọc avatar+tên trong `Link`, nút đăng xuất giữ riêng ngoài Link):
```tsx
return (
  <div className="flex items-center gap-2 rounded-md border bg-white/80 px-2 py-2 shadow-sm">
    <Link href="/profile" className="flex items-center gap-2 min-w-0">
      <Avatar size="sm">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium">{displayName}</p>
        <p className="truncate text-[10px] text-muted-foreground">{user.email ?? "No email"}</p>
      </div>
    </Link>
    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => void signOut()} disabled={isSigningOut}>
      {isSigningOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
    </Button>
  </div>
);
```

---