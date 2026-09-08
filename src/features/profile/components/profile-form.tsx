"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      router.refresh();
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
        <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Tên của bạn" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Username
        <div className="flex items-center gap-1 text-sm">
          <span className="shrink-0 text-muted-foreground">26visualbuilder.app/</span>
          <Input value={username} onChange={(event) => setUsername(event.target.value)} className="flex-1" />
        </div>
        {username !== previewSlug && (
          <span className="text-xs text-muted-foreground">Sẽ lưu thành: {previewSlug || "—"}</span>
        )}
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </div>
  );
}