import { TreeNode } from "@/core/types/builder.types";
import { getPageNodes } from "@/core/store/builder-store";

export interface GalleryImage {
  pageId: string;
  pageName: string;
  imageUrl: string;
}

// Sắp xếp lại theo ĐÚNG thứ tự Page thật trong tree_data (thứ tự lưu trong post_pages
// không đảm bảo khớp thứ tự cây) — cùng nguyên tắc "tree_data là nguồn sự thật" đã dùng
// cho pageNames trước đây.
export function buildGallery(
  treeData: TreeNode,
  postPages: { page_id: string; image_url: string }[],
  fallbackThumbnailUrl: string | null,
  fallbackName: string
): GalleryImage[] {
  const imageMap = new Map(postPages.map((p) => [p.page_id, p.image_url]));
  const pages = getPageNodes(treeData);

  const gallery = pages
    .map((page) => {
      const imageUrl = imageMap.get(page.id);
      if (!imageUrl) return null;
      const pageName = String((page.props as { name?: string }).name ?? "Page");
      return { pageId: page.id, pageName, imageUrl };
    })
    .filter((g): g is GalleryImage => g !== null);

  // Bài đăng cũ (trước tính năng multi-page) không có row nào trong post_pages —
  // fallback về đúng 1 ảnh cover cũ, không để trống.
  if (gallery.length === 0 && fallbackThumbnailUrl) {
    return [{ pageId: "cover", pageName: fallbackName, imageUrl: fallbackThumbnailUrl }];
  }
  return gallery;
}
