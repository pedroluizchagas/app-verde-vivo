import { NextResponse } from "next/server"
import { Expo } from "expo-server-sdk"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const title = String(body?.title || "Notificação")
    const bodyText = String(body?.body || "")
    const data = body?.data || {}
    const userIds: string[] = Array.isArray(body?.userIds) ? body.userIds : []
    let tokens: string[] = Array.isArray(body?.tokens) ? body.tokens : []

    const supabase = await createClient()

    if (userIds.length > 0) {
      const { data: devs } = await supabase
        .from("device_tokens")
        .select("token, provider")
        .in("gardener_id", userIds)
        .eq("is_active", true)
      const expoTokens = (devs || [])
        .map((p: any) => String(p?.token || ""))
        .filter((t) => t && Expo.isExpoPushToken(t))
      tokens = [...tokens, ...expoTokens]
      if (expoTokens.length === 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, push_token, push_provider")
          .in("id", userIds)
        const profileTokens = (profiles || [])
          .map((p: any) => String(p?.push_token || ""))
          .filter((t) => t && Expo.isExpoPushToken(t))
        tokens = [...tokens, ...profileTokens]
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: devs } = await supabase
          .from("device_tokens")
          .select("token, provider")
          .eq("gardener_id", user.id)
          .eq("is_active", true)
        const devTokens = (devs || [])
          .map((p: any) => String(p?.token || ""))
          .filter((t) => t && Expo.isExpoPushToken(t))
        tokens = [...tokens, ...devTokens]
        if (devTokens.length === 0) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("push_token, push_provider")
            .eq("id", user.id)
            .maybeSingle()
          const token = String((profile as any)?.push_token || "")
          if (token && Expo.isExpoPushToken(token)) tokens.push(token)
        }
      }
    }

    tokens = Array.from(new Set(tokens)).filter((t) => Expo.isExpoPushToken(t))
    if (tokens.length === 0) {
      return NextResponse.json({ ok: false, error: "Sem tokens válidos" }, { status: 400 })
    }

    const expo = new Expo()
    const messages = tokens.map((to) => ({
      to,
      sound: "default" as const,
      title,
      body: bodyText,
      data,
      priority: "high" as const,
    }))
    const chunks = expo.chunkPushNotifications(messages)
    const tickets: any[] = []
    for (const chunk of chunks) {
      const res = await expo.sendPushNotificationsAsync(chunk)
      tickets.push(...res)
    }

    return NextResponse.json({ ok: true, tickets, count: tokens.length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Erro" }, { status: 500 })
  }
}
