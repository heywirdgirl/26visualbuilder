import React from "react";
import type { RendererEntry } from "./renderer-map";
import { textEntry, boxEntry, leafEntry } from "./cluster-renderers";
import { cn } from "@/core/utils/cn";
import { escapeAttr } from "@/core/utils/escape-jsx-text";
import { TreeNode } from "@/core/types/builder.types";

const prop = (node: TreeNode, key: string, fallback = "") =>
  String((node.props as Record<string, unknown>)[key] ?? fallback);
const classAttr = (className: string) => (className ? ` className="${escapeAttr(className)}"` : "");
const t = (tag: string) => textEntry(tag, tag, "");
const b = (tag: string) => boxEntry(tag, tag, "");

export const htmlExtraRenderers: Record<string, RendererEntry> = {
  "html.h4": t("h4"),
  "html.h5": t("h5"),
  "html.h6": t("h6"),
  "html.strong": t("strong"),
  "html.em": t("em"),
  "html.small": t("small"),
  "html.mark": t("mark"),
  "html.code": t("code"),
  "html.kbd": t("kbd"),
  "html.blockquote": t("blockquote"),
  "html.address": t("address"),
  "html.pre": {
    jsxTagName: "pre",
    render: (node, _children, className) => (
      <pre data-node-id={node.id} className={className}>{prop(node, "text")}</pre>
    ),
    toJsx: (node, _children, className, pad) =>
      `${pad}<pre${classAttr(className)}>{${JSON.stringify(prop(node, "text"))}}</pre>`,
  },
  "html.time": {
    jsxTagName: "time",
    render: (node, _children, className) => (
      <time data-node-id={node.id} dateTime={prop(node, "dateTime")} className={className}>
        {prop(node, "text")}
      </time>
    ),
  },

  "html.form": {
    jsxTagName: "form",
    render: (node, children, className) => (
      <form data-node-id={node.id} className={className} onSubmit={(event) => event.preventDefault()}>
        {children}
      </form>
    ),
  },
  "html.fieldset": b("fieldset"),
  "html.legend": t("legend"),

  "html.figure": b("figure"),
  "html.figcaption": t("figcaption"),
  "html.video": {
    jsxTagName: "video",
    render: (node, _children, className) => (
      <video
        data-node-id={node.id}
        src={prop(node, "src")}
        controls={!!(node.props as { controls?: boolean }).controls}
        className={className}
      />
    ),
  },
  "html.audio": {
    jsxTagName: "audio",
    render: (node, _children, className) => (
      <audio
        data-node-id={node.id}
        src={prop(node, "src")}
        controls={!!(node.props as { controls?: boolean }).controls}
        className={className}
      />
    ),
  },
  "html.iframe": {
    jsxTagName: "iframe",
    render: (node, _children, className) => (
      <div
        data-node-id={node.id}
        className={cn("h-64 w-full overflow-hidden rounded-md border", className)}
      >
        <iframe
          src={prop(node, "src")}
          title={prop(node, "title", "iframe")}
          className="pointer-events-none h-full w-full"
        />
      </div>
    ),
    toJsx: (node, _children, className, pad) =>
      `${pad}<iframe src="${escapeAttr(prop(node, "src"))}" title="${escapeAttr(prop(node, "title", "iframe"))}" className="${escapeAttr(cn("h-64 w-full", className))}" />`,
  },

  "html.details": {
    jsxTagName: "details",
    render: (node, children, className) => (
      <details data-node-id={node.id} open className={className}>{children}</details>
    ),
  },
  "html.summary": t("summary"),
  "html.hr": leafEntry("hr", "hr", ""),

  "html.dl": b("dl"),
  "html.dt": t("dt"),
  "html.dd": t("dd"),

  "html.table": {
    jsxTagName: "table",
    render: (node, children, className) => (
      <table data-node-id={node.id} className={cn("border-collapse", className)}>{children}</table>
    ),
    toJsx: (_node, childrenJsx, className, pad) =>
      `${pad}<table className="${escapeAttr(cn("border-collapse", className))}">\n${childrenJsx}\n${pad}</table>`,
  },
  "html.thead": b("thead"),
  "html.tbody": b("tbody"),
  "html.tr": b("tr"),
  "html.th": t("th"),
  "html.td": t("td"),

  "html.progress": {
    jsxTagName: "progress",
    render: (node, _children, className) => (
      <progress
        data-node-id={node.id}
        value={Number(prop(node, "value", "0"))}
        max={Number(prop(node, "max", "100")) || 100}
        className={className}
      />
    ),
  },
};
