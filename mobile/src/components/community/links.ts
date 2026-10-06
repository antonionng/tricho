import { router, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { appHref } from "@/lib/links";
import { webUrl } from "@/lib/api";

/** Opens a website path such as /members/profile in the app, or on the web if the app doesn't show it. */
export function openPath(path: string) {
  const href = appHref(path.replace(/#.*$/, ""));
  if (!href) return;
  if (typeof href === "object" && "web" in href) WebBrowser.openBrowserAsync(/^https?:\/\//.test(href.web) ? href.web : webUrl(href.web)).catch(() => {});
  else router.push(href as Href);
}
