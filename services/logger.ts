/**
 * Production-safe logger.
 *
 * In dev (__DEV__ === true) everything goes to the console.
 * In release builds we no-op by default so we don't ship verbose internal
 * logs in shipping bundles. `error` always reports (folded through the toast
 * bus so users see a friendly message, and routed through a registered crash
 * sink — e.g. Sentry — if one is wired in).
 */

import { errorBus, formatApiError } from "@/services/errors";

type CrashSink = (error: unknown, extras?: Record<string, unknown>) => void;

let crashSink: CrashSink | null = null;

export function registerCrashSink(sink: CrashSink | null) {
  crashSink = sink;
}

function noop() {}

export const log = {
  info: __DEV__ ? console.log.bind(console) : (noop as (...args: unknown[]) => void),
  warn: __DEV__ ? console.warn.bind(console) : (noop as (...args: unknown[]) => void),
  debug: __DEV__ ? console.debug.bind(console) : (noop as (...args: unknown[]) => void),
  error(error: unknown, extras?: Record<string, unknown>) {
    if (__DEV__) {
      console.error(error, extras);
    }
    if (crashSink) {
      try {
        crashSink(error, extras);
      } catch {
        // never let a logger fail propagate
      }
    }
  },
  /**
   * Show a user-facing error toast AND record it through the crash sink. Use
   * this when a non-mutation code path catches something the user should know
   * about (e.g. a deep-link parse error, a background hydrate failure).
   */
  reportToUser(error: unknown, extras?: Record<string, unknown>) {
    errorBus.emit(formatApiError(error));
    log.error(error, extras);
  }
};
