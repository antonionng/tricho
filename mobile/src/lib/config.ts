import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
  revenueCat?: { ios?: string; android?: string };
};

/** The website the app talks to, without a trailing slash. */
export const API_URL = (extra.apiUrl ?? "https://www.trichollective.net").replace(/\/$/, "");
export const REVENUECAT_KEYS = { ios: extra.revenueCat?.ios ?? "", android: extra.revenueCat?.android ?? "" };
