const LOG_LEVELS = ["debug", "info", "warn", "error"];
const REDACT_KEYS = ["password", "token", "authorization", "apiKey", "secret"];

function sanitizeContext(context) {
  if (!context || typeof context !== "object") return context;
  if (Array.isArray(context)) return context.map(sanitizeContext);
  const sanitized = {};
  for (const [key, value] of Object.entries(context)) {
    if (REDACT_KEYS.some((redactKey) => key.toLowerCase().includes(redactKey.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function resolveLevel() {
  if (typeof window === "undefined") return "info";
  const fromStorage = window.localStorage && window.localStorage.getItem("trace.log.level");
  if (LOG_LEVELS.includes(fromStorage)) return fromStorage;
  return window.location.hostname === "localhost" ? "debug" : "info";
}

function shouldLog(level, currentLevel) {
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(currentLevel);
}

function baseLog(level, event, context = {}) {
  const currentLevel = resolveLevel();
  if (!shouldLog(level, currentLevel)) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    context: sanitizeContext(context),
  };
  if (level === "error") {
    console.error(payload);
  } else if (level === "warn") {
    console.warn(payload);
  } else {
    console.log(payload);
  }
}

export const logger = {
  debug: (event, context) => baseLog("debug", event, context),
  info: (event, context) => baseLog("info", event, context),
  warn: (event, context) => baseLog("warn", event, context),
  error: (event, context) => baseLog("error", event, context),
};
