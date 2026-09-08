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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập." };

  const { error: displayNameError } = await supabase
    .from("profiles")
    .update({ display_name: displayName.trim() || null })
    .eq("id", user.id);

  if (displayNameError) {
    console.error("[profile] Cập nhật display_name thất bại:", displayNameError);
    return { error: "Không thể cập nhật tên hiển thị." };
  }

  const { error: usernameError } = await supabase.rpc("change_username", {
    new_username: username,
  });

  if (usernameError) {
    console.error("[profile] Đổi username thất bại:", usernameError);
    return { error: usernameError.message ?? "Không thể đổi username." };
  }

  return { success: true as const };
}