import type { Profession } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PROFESSIONS } from "@/config/rooms";
import { HEARD_FROM } from "@/config/signup";
import type { AccountTypeId } from "@/lib/account-type";
import { makeConsumer } from "@/lib/consumer";

/** Sign-up details wait as long as the emailed link works. */
export const PENDING_SIGNUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** A full name: at least a first name and a surname, tidied, or null. */
export function cleanFullName(v: unknown) {
  if (typeof v !== "string") return null;
  const name = v.trim().replace(/\s+/g, " ").slice(0, 80);
  const words = name.split(" ").filter((w) => /\p{L}/u.test(w));
  return words.length >= 2 ? name : null;
}

/**
 * A phone number as typed, kept only if it has 7 to 15 digits and nothing but
 * digits, spaces, brackets, dots, dashes and a leading plus. Empty gives "".
 */
export function cleanPhone(v: unknown): string | null {
  if (typeof v !== "string") return "";
  const phone = v.trim().replace(/\s+/g, " ");
  if (!phone) return "";
  if (!/^\+?[\d\s().-]+$/.test(phone)) return null;
  const digits = phone.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15 ? phone : null;
}

/** Short free text, tidied, or "" when empty. */
function cleanText(v: unknown, max = 80) {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

export type SignupDetails = {
  name: string;
  phone: string;
  profession: Profession;
  practiceName: string;
  city: string;
  country: string;
  heardFrom: string;
};

export type SignupResult = { ok: true; details: SignupDetails } | { ok: false; error: string };

/** Reads and checks the sign-up form. Name, discipline, town and country are needed. */
export function signupDetailsFromForm(formData: FormData): SignupResult {
  const name = cleanFullName(formData.get("name"));
  if (!name) return { ok: false, error: "Please enter your full name, first name and surname." };
  const phone = cleanPhone(formData.get("phone"));
  if (phone === null) return { ok: false, error: "Please check your mobile number, or leave it empty." };
  const profession = String(formData.get("profession") ?? "");
  if (!PROFESSIONS.some((p) => p.id === profession)) return { ok: false, error: "Please choose the option closest to your work." };
  const city = cleanText(formData.get("city"));
  const country = cleanText(formData.get("country"));
  if (!city || !country) return { ok: false, error: "Please tell us the town and country where you practise." };
  const heard = String(formData.get("heardFrom") ?? "");
  return {
    ok: true,
    details: {
      name,
      phone,
      profession: profession as Profession,
      practiceName: cleanText(formData.get("practiceName"), 120),
      city,
      country,
      heardFrom: HEARD_FROM.some((h) => h.id === heard) ? heard : "",
    },
  };
}

export type ConsumerSignupDetails = { name: string; marketing: boolean };

/** A first name only: letters, spaces, hyphens and apostrophes. Empty gives "". */
export function cleanFirstName(v: unknown): string | null {
  if (typeof v !== "string") return "";
  const name = v.trim().replace(/\s+/g, " ").slice(0, 40);
  if (!name) return "";
  return /^[\p{L}][\p{L}\p{M}' -]*$/u.test(name) ? name : null;
}

/**
 * Reads the consumer sign-up form: an optional first name and the marketing opt-in,
 * which is unticked unless they tick it (PECR).
 */
export function consumerSignupFromForm(
  formData: FormData
): { ok: true; details: ConsumerSignupDetails } | { ok: false; error: string } {
  const name = cleanFirstName(formData.get("firstName"));
  if (name === null) return { ok: false, error: "Please use letters only for your first name, or leave it empty." };
  return { ok: true, details: { name, marketing: formData.get("marketing") === "on" } };
}

export async function savePendingConsumerSignup(email: string, d: ConsumerSignupDetails) {
  const data = {
    accountType: "consumer" as const,
    name: d.name,
    marketing: d.marketing,
    phone: null,
    profession: null,
    practiceName: null,
    city: null,
    country: null,
    heardFrom: null,
  };
  await prisma.pendingSignup.upsert({
    where: { email },
    create: { email, ...data },
    update: { ...data, createdAt: new Date() },
  });
}

/** Held until the emailed link creates the account, so it works on any device. */
export async function savePendingSignup(email: string, d: SignupDetails) {
  const data = {
    name: d.name,
    phone: d.phone || null,
    profession: d.profession,
    practiceName: d.practiceName || null,
    city: d.city,
    country: d.country,
    heardFrom: d.heardFrom || null,
    accountType: "professional" as const,
    marketing: false,
  };
  await prisma.pendingSignup.upsert({
    where: { email },
    create: { email, ...data },
    update: { ...data, createdAt: new Date() },
  });
}

export async function clearPendingSignup(email: string) {
  await prisma.pendingSignup.deleteMany({ where: { email } });
}

/**
 * Moves the sign-up details onto a newly created account and returns them.
 * An account that already has a name came through Google, so the form's details
 * (possibly typed by someone else for this email) are left out, and the account type
 * comes from `viaGoogle`, which the sign-up page set in this browser.
 *
 * A consumer gets a ConsumerProfile and never a TrichologistProfile or directory listing.
 */
export async function applyPendingSignup(
  user: { id: string; email: string; name?: string | null },
  viaGoogle: { accountType?: AccountTypeId | null } = {}
) {
  const pending = await prisma.pendingSignup.findUnique({ where: { email: user.email } });
  if (pending) await clearPendingSignup(user.email);
  const fresh = pending && Date.now() - pending.createdAt.getTime() < PENDING_SIGNUP_MAX_AGE_MS;
  const fromForm = !!pending && !!fresh && !user.name;
  const accountType: AccountTypeId = fromForm ? pending.accountType : viaGoogle.accountType === "consumer" ? "consumer" : "professional";

  if (accountType === "consumer") {
    const name = fromForm ? pending.name || null : null;
    await makeConsumer(user.id, { name, marketing: fromForm && pending.marketing });
    return { name: user.name ?? name, fromForm, accountType } as const;
  }
  if (!fromForm) return { name: user.name ?? null, fromForm: false as const, accountType };

  await prisma.user.update({ where: { id: user.id }, data: { name: pending.name, heardFrom: pending.heardFrom } });
  const profile = {
    phone: pending.phone,
    profession: pending.profession,
    practiceName: pending.practiceName,
    city: pending.city,
    country: pending.country,
  };
  await prisma.trichologistProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...profile },
    update: profile,
  });
  return { ...pending, fromForm: true as const, accountType };
}
