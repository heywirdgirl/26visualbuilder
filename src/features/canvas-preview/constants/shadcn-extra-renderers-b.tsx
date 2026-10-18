import React from "react";
import type { RendererEntry } from "./renderer-map";
import { textEntry, boxEntry, overlayEntry, classAttr, prop } from "./cluster-renderers";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { Calendar } from "@/components/ui/calendar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/core/utils/cn";
import { escapeAttr } from "@/core/utils/escape-jsx-text";
import type { TreeNode } from "@/core/types/builder.types";

const IMP = {
  otp: `import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";`,
  calendar: `import { Calendar } from "@/components/ui/calendar";`,
  carousel: `import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";`,
  command: `import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";`,
  drawer: `import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";`,
};

const otpInfo = (node: TreeNode) => {
  const length = Math.max(1, Number(prop(node, "length", "6")) || 6);
  const split = !!(node.props as { split?: boolean }).split;
  const indices = Array.from({ length }, (_, index) => index);
  const midpoint = Math.ceil(length / 2);
  const groups = split && length >= 4
    ? [indices.slice(0, midpoint), indices.slice(midpoint)]
    : [indices];
  return { length, groups };
};

function CalendarView({
  id,
  className,
  showOutsideDays,
}: {
  id: string;
  className: string;
  showOutsideDays: boolean;
}) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  return (
    <div data-node-id={id} className={cn("w-fit", className)}>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        showOutsideDays={showOutsideDays}
        className="rounded-md border"
      />
    </div>
  );
}

export const shadcnExtraRenderersB: Record<string, RendererEntry> = {
  "shadcn.input-otp": {
    jsxTagName: "InputOTP",
    importStatement: IMP.otp,
    render: (node, _children, className) => {
      const { length, groups } = otpInfo(node);
      return (
        <div data-node-id={node.id} className={cn("w-fit", className)}>
          <InputOTP key={`${length}-${groups.length}`} maxLength={length}>
            {groups.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {groupIndex > 0 && <InputOTPSeparator />}
                <InputOTPGroup>
                  {group.map((index) => <InputOTPSlot key={index} index={index} />)}
                </InputOTPGroup>
              </React.Fragment>
            ))}
          </InputOTP>
        </div>
      );
    },
    toJsx: (node, _children, className, pad) => {
      const { length, groups } = otpInfo(node);
      const body = groups
        .map((group, groupIndex) =>
          (groupIndex > 0 ? `${pad}  <InputOTPSeparator />\n` : "") +
          `${pad}  <InputOTPGroup>\n` +
          group.map((index) => `${pad}    <InputOTPSlot index={${index}} />`).join("\n") +
          `\n${pad}  </InputOTPGroup>`
        )
        .join("\n");
      return `${pad}<InputOTP maxLength={${length}}${classAttr(className)}>\n${body}\n${pad}</InputOTP>`;
    },
  },
  "shadcn.calendar": {
    jsxTagName: "Calendar",
    importStatement: IMP.calendar,
    render: (node, _children, className) => (
      <CalendarView
        id={node.id}
        className={className}
        showOutsideDays={!!(node.props as { showOutsideDays?: boolean }).showOutsideDays}
      />
    ),
    toJsx: (node, _children, className, pad) =>
      `${pad}{/* TODO: Calendar cần state để chọn ngày — thêm const [date, setDate] = useState<Date | undefined>() rồi truyền selected={date} onSelect={setDate} */}\n` +
      `${pad}<Calendar mode="single" showOutsideDays={${!!(node.props as { showOutsideDays?: boolean }).showOutsideDays}} className="${escapeAttr(cn("rounded-md border", className))}" />`,
  },
  "shadcn.carousel": {
    jsxTagName: "Carousel",
    importStatement: IMP.carousel,
    render: (node, children, className) => (
      <Carousel key={node.children.length} data-node-id={node.id} className={className}>
        <CarouselContent>{children}</CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    ),
    toJsx: (_node, childrenJsx, className, pad) =>
      `${pad}<Carousel${classAttr(className)}>\n${pad}  <CarouselContent>\n${childrenJsx}\n${pad}  </CarouselContent>\n${pad}  <CarouselPrevious className="left-2" />\n${pad}  <CarouselNext className="right-2" />\n${pad}</Carousel>`,
  },
  "shadcn.carousel-item": {
    jsxTagName: "CarouselItem",
    render: (node, children, className) => (
      <CarouselItem data-node-id={node.id} className={className}>{children}</CarouselItem>
    ),
  },
  "shadcn.command": {
    jsxTagName: "Command",
    importStatement: IMP.command,
    render: (node, children, className) => (
      <Command data-node-id={node.id} className={cn("rounded-lg border shadow-md", className)}>
        {children}
      </Command>
    ),
    toJsx: (_node, childrenJsx, className, pad) =>
      `${pad}<Command className="${escapeAttr(cn("rounded-lg border shadow-md", className))}">\n${childrenJsx}\n${pad}</Command>`,
  },
  "shadcn.command-input": {
    jsxTagName: "CommandInput",
    render: (node, _children, className) => (
      <CommandInput data-node-id={node.id} placeholder={prop(node, "placeholder")} className={className} />
    ),
  },
  "shadcn.command-list": {
    jsxTagName: "CommandList",
    render: (node, children, className) => (
      <CommandList data-node-id={node.id} className={className}>{children}</CommandList>
    ),
  },
  "shadcn.command-empty": {
    jsxTagName: "CommandEmpty",
    render: (node, _children, className) => (
      <CommandEmpty data-node-id={node.id} className={className}>{prop(node, "text")}</CommandEmpty>
    ),
  },
  "shadcn.command-group": {
    jsxTagName: "CommandGroup",
    render: (node, children, className) => (
      <CommandGroup data-node-id={node.id} heading={prop(node, "heading")} className={className}>
        {children}
      </CommandGroup>
    ),
  },
  "shadcn.command-item": {
    jsxTagName: "CommandItem",
    render: (node, _children, className) => (
      <CommandItem data-node-id={node.id} className={className}>{prop(node, "text")}</CommandItem>
    ),
  },
  "shadcn.command-separator": {
    jsxTagName: "CommandSeparator",
    render: (node, _children, className) => (
      <CommandSeparator data-node-id={node.id} className={className} />
    ),
  },
  "shadcn.drawer": overlayEntry({
    label: "Drawer",
    root: "Drawer",
    trigger: "DrawerTrigger",
    content: "DrawerContent",
    importStatement: IMP.drawer,
  }),
  "shadcn.drawer-header": boxEntry("DrawerHeader", "div", "flex flex-col gap-1.5"),
  "shadcn.drawer-title": textEntry("DrawerTitle", "h4", "text-lg font-semibold"),
  "shadcn.drawer-description": textEntry("DrawerDescription", "p", "text-sm text-muted-foreground"),
  "shadcn.drawer-footer": boxEntry("DrawerFooter", "div", "flex flex-col gap-2"),
};
