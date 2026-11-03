import { cleanConcerns, type ConcernId } from "@/config/consumer";

function cleanPlace(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, 60) : "";
  return s || null;
}

/**
 * Reads the hub settings form. Both consents are opt-in and unticked by default.
 * Concerns are health data, so they are kept only while health-data consent is given:
 * withdrawing it clears them. A consent keeps its original date while it stays given.
 */
export function consumerSettingsFromForm(
  form: FormData,
  current: { marketingConsentAt: Date | null; healthDataConsentAt: Date | null },
  now = new Date()
): {
  marketing: boolean;
  activity: boolean;
  marketingConsentAt: Date | null;
  healthDataConsentAt: Date | null;
  concerns: ConcernId[];
  region: string | null;
  country: string | null;
} {
  const marketing = form.get("marketing") === "on";
  const health = form.get("healthConsent") === "on";
  return {
    marketing,
    activity: form.get("activity") === "on",
    marketingConsentAt: marketing ? (current.marketingConsentAt ?? now) : null,
    healthDataConsentAt: health ? (current.healthDataConsentAt ?? now) : null,
    concerns: health ? cleanConcerns(form.getAll("concerns")) : [],
    region: cleanPlace(form.get("region")),
    country: cleanPlace(form.get("country")),
  };
}

/** Everything we hold about a consumer, for the data export (UK GDPR Article 15 and 20). */
export function consumerExport(data: {
  user: { name: string | null; email: string | null; createdAt: Date; emailUpdates: boolean; emailActivity: boolean };
  profile: {
    displayMode: string;
    alias: string;
    region: string | null;
    country: string | null;
    concerns: string[];
    marketingConsentAt: Date | null;
    healthDataConsentAt: Date | null;
    createdAt: Date;
  };
  saved: { createdAt: Date; listing: { name: string; slug: string | null } }[];
  enquiries: { createdAt: Date; status: string; message: string; listing: { name: string } }[];
}) {
  const { user, profile } = data;
  return {
    exportedAt: new Date().toISOString(),
    account: {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      emails: { newsAndUpdates: user.emailUpdates, aboutYourEnquiries: user.emailActivity },
    },
    profile: {
      shownToOthersAs: profile.displayMode === "name" ? "first name" : "alias",
      alias: profile.alias,
      region: profile.region,
      country: profile.country,
      concerns: profile.concerns,
      marketingConsentAt: profile.marketingConsentAt?.toISOString() ?? null,
      healthDataConsentAt: profile.healthDataConsentAt?.toISOString() ?? null,
      createdAt: profile.createdAt.toISOString(),
    },
    savedProfessionals: data.saved.map((s) => ({ name: s.listing.name, slug: s.listing.slug, savedAt: s.createdAt.toISOString() })),
    enquiries: data.enquiries.map((e) => ({
      to: e.listing.name,
      sentAt: e.createdAt.toISOString(),
      status: e.status,
      message: e.message,
    })),
  };
}
