const DEBUG = process.env.DEBUG === "true" || process.env.NODE_ENV === "development";
const VERBOSE = process.env.VERBOSE === "true" || DEBUG;

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

type LogLevel = "debug" | "info" | "warn" | "error";

function timestamp(): string {
  return new Date().toISOString();
}

function formatMessage(
  level: LogLevel,
  component: string,
  message: string,
  data?: unknown,
): string {
  const colors: Record<LogLevel, string> = {
    debug: DIM,
    info: GREEN,
    warn: YELLOW,
    error: RED,
  };
  const color = colors[level];
  const ts = `${DIM}[${timestamp()}]${RESET}`;
  const comp = `${CYAN}[${component}]${RESET}`;
  const lvl = `${color}${level.toUpperCase().padEnd(5)}${RESET}`;

  let msg = `${ts} ${lvl} ${comp} ${message}`;

  if (data !== undefined && VERBOSE) {
    msg += `\n${DIM}${JSON.stringify(data, null, 2)}${RESET}`;
  }

  return msg;
}

export const logger = {
  debug(component: string, message: string, data?: unknown): void {
    if (DEBUG) {
      console.error(formatMessage("debug", component, message, data));
    }
  },

  info(component: string, message: string, data?: unknown): void {
    console.error(formatMessage("info", component, message, data));
  },

  warn(component: string, message: string, data?: unknown): void {
    console.error(formatMessage("warn", component, message, data));
  },

  error(component: string, message: string, data?: unknown): void {
    console.error(formatMessage("error", component, message, data));
  },

  rpc(method: string, params: unknown[], duration?: number): void {
    if (VERBOSE) {
      const durationStr = duration !== undefined ? ` ${DIM}(${duration}ms)${RESET}` : "";
      console.error(
        `${DIM}[${timestamp()}]${RESET} ${CYAN}RPC${RESET}    ${BOLD}${method}${RESET}${durationStr}`,
      );
      if (DEBUG) {
        console.error(`${DIM}  params: ${JSON.stringify(params)}${RESET}`);
      }
    }
  },

  tool(toolName: string, input: unknown, success: boolean, duration: number): void {
    if (VERBOSE) {
      const status = success ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
      console.error(
        `${DIM}[${timestamp()}]${RESET} ${YELLOW}TOOL${RESET}   ${status} ${BOLD}${toolName}${RESET} ${DIM}(${duration}ms)${RESET}`,
      );
      if (DEBUG) {
        console.error(`${DIM}  input: ${JSON.stringify(input)}${RESET}`);
      }
    }
  },

  payment(action: string, details: Record<string, unknown>): void {
    if (VERBOSE) {
      console.error(`${DIM}[${timestamp()}]${RESET} ${GREEN}X402${RESET}   ${action}`);
      if (DEBUG) {
        console.error(`${DIM}  ${JSON.stringify(details)}${RESET}`);
      }
    }
  },
};

export function isDebugEnabled(): boolean {
  return DEBUG;
}

export function isVerboseEnabled(): boolean {
  return VERBOSE;
}
