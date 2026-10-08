"use client";

import { useRef, useState } from "react";
import { GalleryImage } from "../utils/build-gallery";
import { cn } from "@/core/utils/cn";

export function FeedImageCarousel({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
        Không có ảnh
      </div>
    );
  }

  const goTo = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(i);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 40) {
      setIndex((i) => (deltaX < 0 ? (i + 1) % images.length : (i - 1 + images.length) % images.length));
    }
    touchStartX.current = null;
  };

  const current = images[index];

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <img src={current.imageUrl} alt={current.pageName} className="max-w-full max-h-full object-contain" />

      {images.length > 1 && (
        <>
          <button onClick={handlePrev} className="absolute inset-y-0 left-0 w-1/3" aria-label="Ảnh trước" />
          <button onClick={handleNext} className="absolute inset-y-0 right-0 w-1/3" aria-label="Ảnh sau" />

          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {index + 1}/{images.length}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => goTo(e, i)}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-4 bg-white" : "w-1.5 bg-white/50")}
                aria-label={`Ảnh ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
