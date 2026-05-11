import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireUserWithPlan } from "@/lib/auth/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { runAssistant, transcribeAudio } from "@/lib/agent/orchestrator";
import { validateIntent, executeIntent } from "@/lib/agent/registry";

export const runtime = "nodejs";

const assistantJsonSchema = z.union([
  z.object({
    text: z.string().min(1, "missing_text"),
    mode: z.enum(["dry", "execute"]).optional(),
  }),
  z.object({
    intent: z.string().min(1),
    params: z.record(z.unknown()),
  }),
]);

export async function POST(request: Request) {
  try {
    const { user, token } = await requireUserWithPlan(request, "plus");

    const limited = await enforceRateLimit("assistant", user.id);
    if (limited) return limited;

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "missing_groq_api_key" }, { status: 500 });
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const transcribeLimited = await enforceRateLimit("transcribe", user.id);
      if (transcribeLimited) return transcribeLimited;

      const form = await request.formData();
      const file = form.get("audio") as File | null;
      const prompt = (form.get("text") as string | null) ?? "";
      const modeRaw = form.get("mode") as string | null;
      const mode: "dry" | "execute" = modeRaw === "dry" ? "dry" : "execute";

      let text: string;
      if (file) {
        const transcript = await transcribeAudio(file);
        text = [prompt, transcript].filter(Boolean).join("\n");
      } else {
        text = prompt;
      }

      if (!text || typeof text !== "string") {
        return NextResponse.json({ error: "missing_text" }, { status: 400 });
      }

      const result = await runAssistant(user.id, text, mode, token ?? undefined);
      return NextResponse.json(result);
    }

    const json = await request.json().catch(() => ({}));
    const parsed = assistantJsonSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if ("intent" in parsed.data) {
      const validation = validateIntent(parsed.data.intent, parsed.data.params);
      if (!validation.ok) {
        return NextResponse.json(
          { error: "invalid_params", need: validation.need },
          { status: 400 },
        );
      }
      try {
        const exec = await executeIntent(
          user.id,
          parsed.data.intent,
          validation.value,
          token ?? undefined,
        );
        return NextResponse.json({
          reply: "Ação executada",
          intent: parsed.data.intent,
          result: exec,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    const mode: "dry" | "execute" = parsed.data.mode === "dry" ? "dry" : "execute";
    const result = await runAssistant(user.id, parsed.data.text, mode, token ?? undefined);
    return NextResponse.json(result);
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    const message = err instanceof Error ? err.message : String(err);
    console.error("/api/assistant error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
