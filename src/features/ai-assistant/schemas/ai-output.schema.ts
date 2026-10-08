import { z } from "zod";
import { AiNode, AiOperation } from "@/core/types/ai-operation.types";

const aiNodeSchema: z.ZodType<AiNode> = z.lazy(() =>
  z.object({
    nodeType: z.string(),
    props: z.record(z.string(), z.unknown()).optional(),
    style: z.record(z.string(), z.unknown()).optional(),
    children: z.array(aiNodeSchema).max(20).optional(),
  })
);

const aiOperationSchema: z.ZodType<AiOperation> = z.object({
  action: z.literal("add"),
  parentId: z.string(),
  node: aiNodeSchema,
});

export const aiResponseSchema = z.object({
  operations: z.array(aiOperationSchema).max(10),
  summary: z.string().max(200).optional(),
});

export type AiResponse = z.infer<typeof aiResponseSchema>;
