// src/features/canvas-preview/components/shadow-root-wrapper.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function ShadowRootWrapper({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!hostRef.current || hostRef.current.shadowRoot) return;

    const root = hostRef.current.attachShadow({ mode: "open" });
    const container = document.createElement("div");
    container.style.height = "100%";
    root.appendChild(container);
    setMountNode(container);

    // Nạp CSS Tailwind đã build riêng cho Preview vào Shadow Root
    fetch("/preview.css")
      .then((res) => res.text())
      .then((cssText) => {
        if (typeof CSSStyleSheet !== "undefined" && "replaceSync" in CSSStyleSheet.prototype) {
          const sheet = new CSSStyleSheet();
          sheet.replaceSync(cssText);
          root.adoptedStyleSheets = [sheet];
        } else {
          // Fallback cho browser cũ không hỗ trợ Constructable Stylesheets
          const style = document.createElement("style");
          style.textContent = cssText;
          root.appendChild(style);
        }
      })
      .catch(() => {
        console.warn("Không tải được preview.css — chạy `npm run dev:css` trước.");
      });
  }, []);

  return (
    <div ref={hostRef} className="w-full h-full">
      {mountNode && createPortal(children, mountNode)}
    </div>
  );
}