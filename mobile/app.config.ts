import type { ExpoConfig } from "expo/config";

/** The website the app talks to. Point it at your laptop in development, e.g. http://192.168.1.20:3000. */
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://www.trichollective.net";

const config: ExpoConfig = {
  name: "Trichollective",
  slug: "trichollective",
  scheme: "trichollective",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  backgroundColor: "#f4f3f0",
  ios: {
    bundleIdentifier: "net.trichollective.app",
    supportsTablet: true,
    associatedDomains: ["applinks:www.trichollective.net"],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription: "Choose photos to share in the community, in messages and on your profile.",
      NSCameraUsageDescription: "Take a photo to share in the community or use on your profile.",
    },
  },
  android: {
    package: "net.trichollective.app",
    adaptiveIcon: {
      backgroundColor: "#0b0b0b",
      foregroundImage: "./assets/android-icon-foreground.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: "www.trichollective.net", pathPrefix: "/members" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  plugins: [
    "expo-router",
    "expo-status-bar",
    "expo-secure-store",
    "expo-image",
    "expo-web-browser",
    "expo-font",
    ["expo-splash-screen", { image: "./assets/splash-icon.png", imageWidth: 120, backgroundColor: "#f4f3f0" }],
    "expo-sharing",
    ["expo-notifications", { color: "#0b0b0b" }],
    ["expo-image-picker", { photosPermission: "Choose photos to share in the community, in messages and on your profile." }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    apiUrl,
    revenueCat: {
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "",
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "",
    },
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
};

export default config;
