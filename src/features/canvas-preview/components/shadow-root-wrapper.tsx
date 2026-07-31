// src/features/canvas-preview/components/shadow-root-wrapper.tsx


"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function ShadowRootWrapper({
  children,
  onContainerReady,
}: {
  children: React.ReactNode;
  onContainerReady?: (el: HTMLElement | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null); // 👈 mới — sống sót qua vòng cleanup ảo của Strict Mode
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    let container: HTMLElement;

    if (hostRef.current.shadowRoot && containerRef.current) {
      // Lần mount thứ 2 do Strict Mode (dev) — Shadow Root đã tồn tại từ lần trước, dùng
      // lại container cũ, KHÔNG return sớm mà bỏ qua onContainerReady như code cũ.
      container = containerRef.current;
    } else {
      const root = hostRef.current.attachShadow({ mode: "open" });
      container = document.createElement("div");
      container.style.height = "100%";
      root.appendChild(container);
      containerRef.current = container;

      fetch("/preview.css")
        .then((res) => res.text())
        .then((cssText) => {
          if (typeof CSSStyleSheet !== "undefined" && "replaceSync" in CSSStyleSheet.prototype) {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(cssText);
            root.adoptedStyleSheets = [sheet];
          } else {
            const style = document.createElement("style");
            style.textContent = cssText;
            root.appendChild(style);
          }
        })
        .catch(() => {
          console.warn("Không tải được preview.css — chạy `npm run dev:css` trước.");
        });
    }

    setMountNode(container);
    onContainerReady?.(container);

    return () => onContainerReady?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={hostRef} className="w-full h-full">
      {mountNode && createPortal(children, mountNode)}
    </div>
  );
}