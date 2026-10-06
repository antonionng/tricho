import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { REVENUECAT_KEYS } from "./config";
import { api } from "./api";

/**
 * Memberships bought in the app go through RevenueCat (App Store and Google Play).
 * The member's Trichollective user id is their RevenueCat id, so the server can
 * look the subscription up and grant the plan.
 */
let configuredFor: string | null = null;

const apiKey = () => (Platform.OS === "ios" ? REVENUECAT_KEYS.ios : Platform.OS === "android" ? REVENUECAT_KEYS.android : "");

/** True when this build has a RevenueCat key, so purchases can be offered. */
export const purchasesAvailable = () => !!apiKey();

export async function setUpPurchases(userId: string) {
  if (!purchasesAvailable() || configuredFor === userId) return;
  if (configuredFor === null && !(await Purchases.isConfigured())) {
    Purchases.configure({ apiKey: apiKey(), appUserID: userId });
  } else {
    await Purchases.logIn(userId);
  }
  configuredFor = userId;
}

export async function logOutPurchases() {
  if (!configuredFor) return;
  configuredFor = null;
  await Purchases.logOut().catch(() => {});
}

/** The packages on sale, from the current RevenueCat offering. */
export async function membershipPackages(): Promise<PurchasesPackage[]> {
  if (!purchasesAvailable()) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

/** Tells the server about a purchase or restore, so access opens straight away. */
const syncWithServer = () => api<{ membership: { isActive: boolean } }>("billing/sync", { body: {} });

/** Buys a package. Returns false when the member cancels the store sheet. */
export async function buy(pkg: PurchasesPackage) {
  try {
    await Purchases.purchasePackage(pkg);
  } catch (error) {
    if ((error as { userCancelled?: boolean }).userCancelled) return false;
    throw error;
  }
  await syncWithServer();
  return true;
}

export async function restore() {
  await Purchases.restorePurchases();
  return syncWithServer();
}

export const manageSubscription = () => Purchases.showManageSubscriptions();
