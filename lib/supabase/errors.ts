type ErrorComCause = {
  cause?: { code?: string } | null;
  status?: number;
  response?: { status?: number };
  originalError?: { status?: number };
  message?: string;
};

function asErrorComCause(err: unknown): ErrorComCause {
  if (typeof err !== "object" || err === null) return {};
  return err as ErrorComCause;
}

export function isSupabaseUnreachable(err: unknown): boolean {
  const e = asErrorComCause(err);
  const causeCode = e.cause?.code;
  if (
    causeCode === "ENOTFOUND" ||
    causeCode === "EAI_AGAIN" ||
    causeCode === "ECONNREFUSED" ||
    causeCode === "ETIMEDOUT"
  ) {
    return true;
  }
  const status = e.status ?? e.response?.status ?? e.originalError?.status;
  if (typeof status === "number" && status >= 500) {
    return true;
  }
  const msg = String(e.message ?? "");
  if (/web server is down/i.test(msg)) return true;
  if (/\b521\b/.test(msg)) return true;
  if (/cloudflare/i.test(msg)) return true;
  if (/unexpected token\s*<.*json/i.test(msg)) return true;
  return false;
}
