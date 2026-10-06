import * as SecureStore from "expo-secure-store";
import { API_URL } from "./config";

const TOKEN_KEY = "tc.session";

let token: string | null = null;
let onSignedOut: (() => void) | null = null;

export async function loadToken() {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
}
export async function saveToken(value: string | null) {
  token = value;
  if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}
export const hasToken = () => !!token;
/** Headers that sign a request as this phone, e.g. for private images. */
export const authHeaders = (): Record<string, string> => (token ? { authorization: `Bearer ${token}` } : {});
/** Called when the server no longer recognises this phone. */
export function setSignedOutHandler(fn: () => void) {
  onSignedOut = fn;
}

/** An error the server explained, with its message safe to show. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: Record<string, unknown>
  ) {
    super(message);
  }
  /** 402: this needs a membership, so show the paywall. */
  get needsMembership() {
    return this.status === 402;
  }
}

type Options = { method?: string; body?: unknown; signal?: AbortSignal };

/**
 * Calls /api/mobile/v1 with this phone's token. `path` is relative, e.g. "community/posts".
 * Pass FormData as the body for uploads.
 */
export async function api<T = unknown>(path: string, { method, body, signal }: Options = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/mobile/v1/${path.replace(/^\//, "")}`, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: {
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined && !isForm ? { "content-type": "application/json" } : {}),
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError(0, "You seem to be offline. Please check your connection and try again.");
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    if (res.status === 401 && token) {
      await saveToken(null);
      onSignedOut?.();
    }
    const message = typeof data.error === "string" ? data.error : "Something went wrong. Please try again.";
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

/** The website's address for a path, e.g. for sharing or opening something the app doesn't show. */
export const webUrl = (path: string) => `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
