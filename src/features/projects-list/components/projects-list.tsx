// features/projects-list/components/projects-list.tsx


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, FolderOpen, Loader2 } from "lucide-react";
import { createClient } from "@/core/supabase/client";
import { createDefaultProjectTree } from "@/core/store/builder-store";

interface ProjectListItem {
  id: string;
  name: string;
  updated_at: string;
}

export function ProjectsList({ initialProjects }: { initialProjects: ProjectListItem[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async () => {
    const name = window.prompt("Tên project mới:", "Untitled Project");
    if (!name || !name.trim()) return;

    setIsCreating(true);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("projects")
        .insert({ owner_id: user.id, name: name.trim(), tree_data: createDefaultProjectTree() })
        .select("id")
        .single();

      if (error) throw error;
      router.push(`/editor/${data.id}`);
    } catch (err) {
      console.error("[projects] Tạo project thất bại:", err);
      window.alert("Không thể tạo project mới — kiểm tra console.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Xoá project "${name}"? Không thể hoàn tác.`)) return;

    setDeletingId(id);
    const supabase = createClient();
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("[projects] Xoá project thất bại:", err);
      window.alert("Không thể xoá project — kiểm tra console.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My Projects</h1>
        <Button size="sm" onClick={handleCreate} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5 mr-1.5" />
          )}
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Chưa có project nào — bấm &quot;New Project&quot; để bắt đầu.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between border rounded-md px-4 py-3">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  Cập nhật {new Date(p.updated_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/editor/${p.id}`)}>
                  <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                  Mở
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => handleDelete(p.id, p.name)}
                  disabled={deletingId === p.id}
                >
                  {deletingId === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
