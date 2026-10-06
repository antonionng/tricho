import { useEffect } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { api, webUrl } from "./api";
import { appHref } from "./links";
import { queryClient } from "./query";
import { meKey } from "./me";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Asks for permission (once), and sends this phone's push token to the server. */
export async function registerForPush() {
  if (!Device.isDevice) return null;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Replies, messages and events",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const status = current.status === "granted" ? current.status : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await api("push", { body: { token } }).catch(() => {});
  return token;
}

/** Opens what a notification is about. */
export function openHref(href: string | null | undefined) {
  const target = appHref(href);
  if (!target) return;
  if (typeof target === "object" && "web" in target) {
    WebBrowser.openBrowserAsync(target.web.startsWith("http") ? target.web : webUrl(target.web));
  } else {
    router.push(target);
  }
}

/** Registers for push when signed in, refreshes counts as notifications arrive, and opens a tapped one. */
export function usePushNotifications(enabled: boolean) {
  const last = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!enabled) return;
    registerForPush().catch(() => {});
    const received = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: meKey });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
    return () => received.remove();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !last) return;
    const href = last.notification.request.content.data?.href;
    if (typeof href === "string") openHref(href);
    Notifications.clearLastNotificationResponse();
  }, [enabled, last]);
}
