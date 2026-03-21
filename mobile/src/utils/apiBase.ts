import { NativeModules, Platform } from "react-native"
import Constants from "expo-constants"

function normalizeEnvValue(value: unknown): string | undefined {
  const raw = String(value ?? "")
  if (!raw) return undefined
  const unwrapped = raw.replace(/^[\s"'`]+/, "").replace(/[\s"'`]+$/, "")
  return unwrapped || undefined
}

function stripTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, "")
}

function hostFromScriptUrl(): string | null {
  try {
    const scriptUrl = String((NativeModules as any)?.SourceCode?.scriptURL || "")
    const m = scriptUrl.match(/^https?:\/\/([^:/]+)(?::\d+)?\//)
    const host = m ? m[1] : null
    if (host && !/^(localhost|127\.0\.0\.1)$/i.test(host)) return host
  } catch {}
  return null
}

function hostFromExpoConstants(): string | null {
  try {
    const c = Constants as any
    const raw =
      (typeof c.expoConfig?.hostUri === "string" && c.expoConfig.hostUri) ||
      (typeof c.manifest2?.extra?.expoClient?.hostUri === "string" && c.manifest2.extra.expoClient.hostUri) ||
      (typeof c.expoGoConfig?.debuggerHost === "string" && c.expoGoConfig.debuggerHost) ||
      (typeof c.manifest?.debuggerHost === "string" && c.manifest.debuggerHost) ||
      ""
    if (!raw) return null
    const host = String(raw).split(":")[0]?.trim()
    if (host && !/^(localhost|127\.0\.0\.1)$/i.test(host)) return host
  } catch {}
  return null
}

function devLanHost(): string | null {
  return hostFromScriptUrl() || hostFromExpoConstants()
}

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url)
}

/**
 * Base URL for Next.js API (same origin as web app).
 * In __DEV__, physical devices cannot use localhost; we derive the PC LAN IP from Metro/Expo.
 */
export function getBackendApiBase(): string {
  const canonicalRaw =
    normalizeEnvValue(process.env.EXPO_PUBLIC_CANONICAL_APP_URL as string | undefined) ?? "https://verdevivo.vercel.app"
  const canonical = stripTrailingSlashes(
    /^https?:\/\//i.test(canonicalRaw) ? canonicalRaw : `https://${canonicalRaw}`
  )

  const envApp = normalizeEnvValue(process.env.EXPO_PUBLIC_APP_URL as string | undefined)
  const envApi = normalizeEnvValue(process.env.EXPO_PUBLIC_API_URL as string | undefined)
  const isDev = typeof __DEV__ !== "undefined" && __DEV__

  if (!isDev) {
    const raw = envApp || envApi || canonical
    const base = stripTrailingSlashes(raw)
    if (!/^https?:\/\//i.test(base)) return `https://${base}`
    return base
  }

  const lan = devLanHost()

  const resolveEnvUrl = (u: string | undefined): string | undefined => {
    if (!u) return undefined
    let s = stripTrailingSlashes(u.trim())
    if (!/^https?:\/\//i.test(s)) s = `http://${s}`
    if (isLocalhostUrl(s) && lan) {
      const m = s.match(/^https?:\/\/([^/:]+)(:\d+)?/i)
      const port = m && m[2] ? m[2] : ":3000"
      return `http://${lan}${port}`
    }
    return s
  }

  const fromEnv = resolveEnvUrl(envApp) || resolveEnvUrl(envApi)
  if (fromEnv) return fromEnv

  if (lan) {
    return `http://${lan}:3000`
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000"
  }

  return "http://localhost:3000"
}
