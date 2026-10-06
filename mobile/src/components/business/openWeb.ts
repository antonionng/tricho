import * as WebBrowser from "expo-web-browser";
import { webUrl } from "@/lib/api";

/** Opens a page of the website in the in-app browser, for the parts the app leaves to the web. */
export function openWeb(path: string) {
  return WebBrowser.openBrowserAsync(webUrl(path)).catch(() => {});
}
