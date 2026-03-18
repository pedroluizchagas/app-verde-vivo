export function isSupabaseUnreachable(err: any): boolean {
  const cause = err?.cause
  const causeCode = cause?.code
  if (causeCode === "ENOTFOUND" || causeCode === "EAI_AGAIN" || causeCode === "ECONNREFUSED" || causeCode === "ETIMEDOUT") {
    return true
  }
  const status = (err as any)?.status ?? (err as any)?.response?.status ?? (err as any)?.originalError?.status
  if (typeof status === "number" && status >= 500) {
    return true
  }
  const msg = String((err as any)?.message || "")
  if (/web server is down/i.test(msg)) return true
  if (/\b521\b/.test(msg)) return true
  if (/cloudflare/i.test(msg)) return true
  if (/unexpected token\s*<.*json/i.test(msg)) return true
  return false
}
