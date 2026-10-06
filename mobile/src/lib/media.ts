import type { ImageSource } from "expo-image";
import { API_URL } from "./config";
import { authHeaders } from "./api";

/**
 * An image from the website. Paths like /api/files/… are made absolute and sent
 * with this phone's token, so private photos load the same as on the web.
 */
export function mediaUrl(src: string | null | undefined): ImageSource | null {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) {
    return src.startsWith(API_URL) ? { uri: src, headers: authHeaders() } : { uri: src };
  }
  return { uri: `${API_URL}${src.startsWith("/") ? src : `/${src}`}`, headers: authHeaders() };
}
