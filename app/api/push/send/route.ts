import { NextResponse } from "next/server";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { z } from "zod";
import { authErrorResponse, requireUser } from "@/lib/auth/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_TITLE = 120;
const MAX_BODY = 500;
const MAX_DATA_BYTES = 4_096;

const pushBodySchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE).optional(),
  body: z.string().trim().max(MAX_BODY).optional(),
  data: z.record(z.unknown()).optional(),
  userIds: z.array(z.string().uuid()).max(50).optional(),
  tokens: z.array(z.string()).max(100).optional(),
});

function isInternalCall(request: Request): boolean {
  const expected = process.env.INTERNAL_API_TOKEN?.trim();
  if (!expected) return false;
  const header = request.headers.get("x-internal-token")?.trim() || "";
  return header.length > 0 && header === expected;
}

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = pushBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const dataPayload = parsed.data.data ?? {};
    try {
      if (Buffer.byteLength(JSON.stringify(dataPayload), "utf8") > MAX_DATA_BYTES) {
        return NextResponse.json(
          { error: "payload_too_large", message: `Campo data excede ${MAX_DATA_BYTES} bytes.` },
          { status: 413 },
        );
      }
    } catch {
      return NextResponse.json({ error: "invalid_data_payload" }, { status: 400 });
    }

    const internal = isInternalCall(request);
    let tokens: string[] = (parsed.data.tokens ?? []).map((t) => String(t));

    if (internal) {
      // Chamada interna (cron/webhook server-to-server) identificada por X-Internal-Token.
      // Não usamos service-role aqui — o chamador deve resolver os device tokens previamente
      // e enviá-los em `tokens[]`. `userIds` é proibido neste caminho.
      const ipLimited = await enforceRateLimit("push", `internal:${getClientIp(request)}`);
      if (ipLimited) return ipLimited;

      if ((parsed.data.userIds?.length ?? 0) > 0) {
        return NextResponse.json(
          {
            error: "user_ids_not_allowed_internal",
            message: "Chamadas internas devem enviar `tokens[]`. Resolva os device tokens antes.",
          },
          { status: 400 },
        );
      }
    } else {
      const auth = await requireUser(request);
      const userLimited = await enforceRateLimit("push", auth.user.id);
      if (userLimited) return userLimited;

      const requestedIds = parsed.data.userIds ?? [];
      const foreign = requestedIds.filter((id) => id !== auth.user.id);
      if (foreign.length > 0) {
        return NextResponse.json(
          {
            error: "forbidden_user_ids",
            message: "Você só pode enviar push para o próprio usuário.",
          },
          { status: 403 },
        );
      }

      // RLS garante que SELECT em device_tokens/profiles só retorna linhas do próprio usuário.
      const { data: devs } = await auth.supabase
        .from("device_tokens")
        .select("token")
        .eq("gardener_id", auth.user.id)
        .eq("is_active", true);
      const expoTokens = (devs ?? [])
        .map((p: { token?: string | null }) => String(p?.token ?? ""))
        .filter((t) => t && Expo.isExpoPushToken(t));
      tokens = [...tokens, ...expoTokens];

      if (expoTokens.length === 0) {
        const { data: profile } = await auth.supabase
          .from("profiles")
          .select("push_token")
          .eq("id", auth.user.id)
          .maybeSingle();
        const profileToken = String(
          (profile as { push_token?: string | null } | null)?.push_token ?? "",
        );
        if (profileToken && Expo.isExpoPushToken(profileToken)) {
          tokens.push(profileToken);
        }
      }
    }

    tokens = Array.from(new Set(tokens)).filter((t) => Expo.isExpoPushToken(t));
    if (tokens.length === 0) {
      return NextResponse.json({ ok: false, error: "Sem tokens válidos" }, { status: 400 });
    }

    const expo = new Expo();
    const messages: ExpoPushMessage[] = tokens.map((to) => ({
      to,
      sound: "default",
      title: parsed.data.title ?? "Notificação",
      body: parsed.data.body ?? "",
      data: dataPayload,
      priority: "high",
    }));
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: unknown[] = [];
    for (const chunk of chunks) {
      const res = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...res);
    }

    return NextResponse.json({ ok: true, tickets, count: tokens.length });
  } catch (err) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
