// src/app/projects/page.tsx


import { redirect } from "next/navigation";
import { createClient } from "@/core/supabase/server";
import { ProjectsList } from "@/features/projects-list/components/projects-list";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/"); // chưa đăng nhập — về trang chủ, LoginButton nằm sẵn trong sidebar ở đó
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) console.error("[projects] Lỗi tải danh sách:", error);

  return <ProjectsList initialProjects={projects ?? []} />;
}
