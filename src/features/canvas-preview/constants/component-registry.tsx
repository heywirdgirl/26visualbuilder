// src/features/canvas-preview/constants/component-registry.ts

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TreeNode, ContainerProps, ButtonProps, CardProps } from "@/core/types/builder.types";
import { cn } from "@/core/utils/cn";
import { containerToClasses } from "@/features/inspector/utils/tailwind-mapper";

// Map từng loại node -> hàm render ra JSX thật, dùng cho Preview
// Đổi signature:
export function renderRegisteredComponent(
  node: TreeNode,
  children: React.ReactNode,
  isActive: boolean
): React.ReactNode {
  const highlightClass = isActive ? "outline outline-2 outline-blue-500 outline-offset-1" : "";

  switch (node.type) {
    case "container": {
      const props = node.props as ContainerProps;
      return (
        <div
          data-node-id={node.id}
          className={cn(containerToClasses(props), highlightClass)}
        >
          {children}
        </div>
      );
    }

    case "button": {
      const props = node.props as ButtonProps;
      return (
        <Button
          data-node-id={node.id}
          variant={props.variant}
          size={props.size}
          className={highlightClass}
        >
          {props.text}
        </Button>
      );
    }

    case "card": {
      const props = node.props as CardProps;
      return (
        <Card data-node-id={node.id} className={highlightClass}>
          <CardHeader>
            <CardTitle>{props.title}</CardTitle>
            {props.description && <CardDescription>{props.description}</CardDescription>}
          </CardHeader>
          {props.content && <CardContent>{props.content}</CardContent>}
        </Card>
      );
    }

    default:
      return null;
  }
}