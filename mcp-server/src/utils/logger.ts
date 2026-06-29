/**
 * Lightweight colorful logger for debugging.
 * Uses ANSI escape codes — no extra dependencies needed.
 */

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",

  // Log levels
  info: "\x1b[36m",    // Cyan
  success: "\x1b[32m", // Green
  warn: "\x1b[33m",    // Yellow
  error: "\x1b[31m",   // Red
  debug: "\x1b[35m",   // Magenta

  // Extras
  http: "\x1b[34m",    // Blue
  tool: "\x1b[93m",    // Bright Yellow
} as const;

type LogLevel = "info" | "success" | "warn" | "error" | "debug" | "http" | "tool";

const LEVEL_LABELS: Record<LogLevel, string> = {
  info:    "INFO   ",
  success: "OK     ",
  warn:    "WARN   ",
  error:   "ERROR  ",
  debug:   "DEBUG  ",
  http:    "HTTP   ",
  tool:    "TOOL   ",
};

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").replace("Z", "");
}

function log(level: LogLevel, ...args: unknown[]): void {
  const color = COLORS[level];
  const label = LEVEL_LABELS[level];
  const ts = `${COLORS.dim}${timestamp()}${COLORS.reset}`;
  const prefix = `${ts} ${color}${COLORS.bold}${label}${COLORS.reset}`;

  // Use console.error in STDIO mode so logs go to stderr and don't break the JSON-RPC stream
  const output = process.argv.includes("--stdio") ? console.error : console.log;

  output(prefix, ...args);
}

export const logger = {
  /** General information */
  info: (...args: unknown[]) => log("info", ...args),

  /** Successful operations */
  success: (...args: unknown[]) => log("success", ...args),

  /** Warnings that don't break anything */
  warn: (...args: unknown[]) => log("warn", ...args),

  /** Errors */
  error: (...args: unknown[]) => log("error", ...args),

  /** Verbose debug info (only when DEBUG=true) */
  debug: (...args: unknown[]) => {
    if (process.env.DEBUG === "true") log("debug", ...args);
  },

  /** HTTP request/response logs */
  http: (...args: unknown[]) => log("http", ...args),

  /** MCP tool call logs */
  tool: (...args: unknown[]) => log("tool", ...args),
};
