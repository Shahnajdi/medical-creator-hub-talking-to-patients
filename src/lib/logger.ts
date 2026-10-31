type Level = "debug" | "info" | "warn" | "error";

/** Structured JSON logger. Do not log raw personal data (emails are masked). */
function mask(value: unknown): unknown {
  if (typeof value === "string" && /@/.test(value)) return value.replace(/^(.).*(@.*)$/, "$1***$2");
  if (Array.isArray(value)) return value.map(mask);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mask(v)]));
  return value;
}

function log(level: Level, msg: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "test" && level !== "error") return;
  const line = JSON.stringify({ level, msg, time: new Date().toISOString(), ...(data ? (mask(data) as object) : {}) });
  (level === "error" ? console.error : console.log)(line);
}

export const logger = {
  debug: (m: string, d?: Record<string, unknown>) => log("debug", m, d),
  info: (m: string, d?: Record<string, unknown>) => log("info", m, d),
  warn: (m: string, d?: Record<string, unknown>) => log("warn", m, d),
  error: (m: string, d?: Record<string, unknown>) => log("error", m, d),
};
