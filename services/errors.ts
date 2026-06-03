import { SafeScanApiError } from "@/services/apiClient";

export function formatApiError(error: unknown): string {
  if (error instanceof SafeScanApiError) {
    if (error.status >= 500) return "SafeScan is having trouble reaching its backend. Please try again in a moment.";
    if (error.status === 401) return "Your session expired. Sign in again to continue.";
    if (error.status === 403) return "You don't have permission to do that.";
    if (error.status === 404) return "SafeScan could not find what you were looking for.";
    if (error.status === 422) return error.message || "SafeScan could not understand the response from the backend.";
    return error.message || `SafeScan API ${error.status}`;
  }
  if (error instanceof Error) return error.message || "Something went wrong.";
  if (typeof error === "string") return error;
  return "Something went wrong.";
}

type Listener = (message: string) => void;

const listeners = new Set<Listener>();

export const errorBus = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emit(message: string) {
    for (const listener of listeners) listener(message);
  }
};
