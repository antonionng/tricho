"use server";

import { after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { alertOwners, deliver } from "@/lib/mail/send";
import { featureAcknowledgementEmail, featureAlert } from "@/lib/mail/templates/leads";
import { parseFeatureApplication, type FeatureFields } from "@/lib/feature-application";
import { shortName } from "@/lib/names";

export type FeatureState =
  | { ok: true; message: string }
  | { ok: false; message: string; fields?: FeatureFields }
  | null;

/**
 * The /featured form. Stored as a Draft so it lands in the Studio inbox,
 * then the team is alerted and the applicant gets an acknowledgement.
 */
export async function sendFeatureApplication(_prev: FeatureState, formData: FormData): Promise<FeatureState> {
  const parsed = parseFeatureApplication(formData);
  if (parsed.ok && "ignored" in parsed) {
    return { ok: true, message: "Thank you. We'll be in touch." };
  }
  if (!parsed.ok) return parsed;

  const { application, fields } = parsed;
  const session = await auth().catch(() => null);
  const userId = session?.user?.id || null;

  const body = [
    `Format: ${application.formatLabel}`,
    `Taking part: ${application.roleLabel}`,
    application.place ? `Based in: ${application.place}` : null,
    "",
    application.share,
  ]
    .filter((line) => line !== null)
    .join("\n");

  let draftId: string;
  try {
    const draft = await prisma.draft.create({
      data: {
        agent: "website",
        kind: "feature_application",
        title: `${application.name}: ${application.formatLabel}`,
        summary: `${application.roleLabel} · ${application.email}`,
        body,
        payload: {
          name: application.name,
          email: application.email,
          share: application.share,
          format: application.format,
          formatLabel: application.formatLabel,
          role: application.role,
          roleLabel: application.roleLabel,
          ...(application.place ? { place: application.place } : {}),
          ...(userId ? { userId } : {}),
        },
      },
      select: { id: true },
    });
    draftId = draft.id;
  } catch (error) {
    console.error("[FEATURE_APPLICATION]", error);
    return {
      ok: false,
      message: "Something went wrong sending your application. Please try again in a moment.",
      fields,
    };
  }

  after(async () => {
    const { subject, content } = featureAcknowledgementEmail(application);
    await Promise.all([
      alertOwners(featureAlert(application, draftId)),
      deliver(application.email, subject, content, { tag: "feature-application" }),
    ]);
  });

  return {
    ok: true,
    message: `Thank you, ${shortName(application.name, "you")}. Your application has reached us. We read every one ourselves and will reply by email within five working days.`,
  };
}
