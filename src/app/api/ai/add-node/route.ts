import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createClient } from "@/core/supabase/server";
import { getAiRegistrySummary } from "@/core/registry/ai-registry-summary";
import { aiResponseSchema } from "@/features/ai-assistant/schemas/ai-output.schema";
import { buildAddNodeSystemPrompt } from "@/features/ai-assistant/prompts/add-node.prompt";
import { AiContextPayload } from "@/features/ai-assistant/utils/build-ai-context";

const MODEL_ID = "@cf/zai-org/glm-4.7-flash";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Cần đăng nhập để dùng AI Assistant." },
        { status: 401 }
      );
    }

    const { data: allowed, error: usageError } = await supabase.rpc("increment_ai_usage", {
      max_per_day: 20,
    });
    if (usageError || !allowed) {
      return NextResponse.json(
        { error: "Bạn đã dùng hết lượt AI hôm nay (tối đa 20 lượt/ngày) — thử lại vào ngày mai." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as {
      prompt?: unknown;
      context?: unknown;
    };
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const context = body.context as AiContextPayload | undefined;

    if (!prompt) {
      return NextResponse.json({ error: "Thiếu nội dung yêu cầu." }, { status: 400 });
    }
    if (!context?.currentPageTree) {
      return NextResponse.json({ error: "Thiếu context trang hiện tại." }, { status: 400 });
    }

    const { createWorkersAI } = await import("workers-ai-provider");
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const workersai = createWorkersAI({ binding: env.AI });
    const systemPrompt = buildAddNodeSystemPrompt(getAiRegistrySummary(), context);

    const result = await generateObject({
      model: workersai(MODEL_ID),
      system: systemPrompt,
      prompt,
      schema: aiResponseSchema,
    });

    return NextResponse.json({ success: true, data: result.object });
  } catch (error) {
    console.error("[ai] add-node thất bại:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI Assistant thất bại — thử lại." },
      { status: 500 }
    );
  }
}
