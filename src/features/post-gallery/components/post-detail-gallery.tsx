"use client";

import { useState } from "react";
import { GalleryImage } from "../utils/build-gallery";
import { cn } from "@/core/utils/cn";

export function PostDetailGallery({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;
  const current = images[index];

  return (
    <div className="flex flex-col gap-2">
      <img src={current.imageUrl} alt={current.pageName} className="w-full rounded-lg border object-cover" />

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.pageId}
              onClick={() => setIndex(i)}
              className={cn("shrink-0 flex flex-col items-center gap-1", i === index ? "opacity-100" : "opacity-60 hover:opacity-100")}
            >
              <img
                src={img.imageUrl}
                alt={img.pageName}
                className={cn("w-20 h-14 object-cover rounded-md border-2", i === index ? "border-primary" : "border-transparent")}
              />
              <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{img.pageName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
