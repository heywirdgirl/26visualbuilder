import { redirect } from "next/navigation";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { createClient } from "@/core/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (error || !profile) redirect("/");

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-lg font-semibold">Profile Settings</h1>
      <ProfileForm initialProfile={profile} />
    </div>
  );
}