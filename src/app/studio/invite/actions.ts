"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ListingKind, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import { publishDraft } from "@/agents/publish";
import { composeInviteEmail, parseInviteLines } from "@/lib/invite";
import { studioAction } from "../_lib/guard";

function s(form: FormData, key: string, max = 20000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function back(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) search.set(k, v);
  const q = search.toString();
  return `/studio/invite${q ? `?${q}` : ""}`;
}

/** 32 random hex characters. */
function newToken() {
  return randomBytes(16).toString("hex");
}

export async function createInvitesAction(form: FormData) {
  await studioAction();
  const { valid, problems } = parseInviteLines(s(form, "lines", 50000));
  const note = s(form, "note", 2000);

  let created = 0;
  const skipped: string[] = problems.map((p) => `Line ${p.line}: ${p.reason}`);

  for (const person of valid) {
    const existing = await prisma.directoryListing.findFirst({
      where: {
        email: person.email,
        status: { in: [ListingStatus.invited, ListingStatus.pending, ListingStatus.listed] },
      },
      select: { status: true },
    });
    if (existing) {
      const why =
        existing.status === ListingStatus.invited
          ? "already invited"
          : existing.status === ListingStatus.pending
            ? "already has a listing waiting for review"
            : "is already listed";
      skipped.push(`Line ${person.line}: ${person.email} ${why}.`);
      continue;
    }

    const token = newToken();
    const ref = `invite:${person.email}`;

    // A re-invitation (say after a rejected listing) moves the old draft off its
    // ref. An old draft that was never sent is withdrawn, so only the new link goes out.
    const old = await prisma.draft.findFirst({
      where: { payload: { path: ["ref"], equals: ref } },
      select: { id: true, status: true, payload: true },
    });

    const { subject, body } = composeInviteEmail({
      name: person.name,
      token,
      note,
      founderFull: site.founderFull,
      baseUrl: site.url,
      launchTitle: site.launch.title,
      launchStartsAt: site.launch.startsAt,
      freeDays: FREE_LISTING_DAYS,
    });

    await prisma.$transaction(async (tx) => {
      if (old) {
        const oldPayload = old.payload && typeof old.payload === "object" && !Array.isArray(old.payload) ? old.payload : {};
        await tx.draft.update({
          where: { id: old.id },
          data: {
            payload: { ...oldPayload, ref: `${ref}#replaced-${old.id}`, replacedRef: ref },
            ...(old.status === "draft"
              ? { status: "rejected", reviewedAt: new Date(), reviewerNote: "Replaced by a newer invitation." }
              : {}),
          },
        });
      }
      await tx.directoryListing.create({
        data: {
          name: person.name,
          email: person.email,
          profession: person.profession,
          city: person.city,
          country: person.country,
          status: ListingStatus.invited,
          kind: ListingKind.listed,
          source: "invite",
          inviteToken: token,
        },
      });
      await tx.draft.create({
        data: {
          agent: "membership",
          kind: "email",
          title: `Invitation to ${person.name}`,
          summary: `Founding directory invitation for ${person.email}. Approving it sends the email.`,
          body,
          payload: { to: person.email, subject, invite: true, ref },
        },
      });
    });
    created++;
  }

  revalidatePath("/studio/invite");
  revalidatePath("/studio", "layout");
  const parts = [
    `${created} invitation${created === 1 ? "" : "s"} drafted`,
    `${skipped.length} skipped`,
  ];
  redirect(
    back({
      notice: `${parts.join(", ")}.${created ? " They're waiting for approval below and in the inbox." : ""}`,
      tone: created === 0 && skipped.length > 0 ? "danger" : undefined,
      skipped: skipped.length ? skipped.slice(0, 30).join("\n") : undefined,
    })
  );
}

export async function sendInvitesAction(form: FormData) {
  await studioAction();
  if (s(form, "confirm", 8) !== "yes") redirect(back({ confirm: "send" }));

  const drafts = await prisma.draft.findMany({
    where: { status: "draft", kind: "email", payload: { path: ["invite"], equals: true } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  let sent = 0;
  let failed = 0;
  for (const d of drafts) {
    try {
      await publishDraft(d.id);
      sent++;
    } catch (error) {
      failed++;
      console.error(`[invite] couldn't send draft ${d.id}`, error);
    }
  }

  const logged = !process.env.AUTH_RESEND_KEY;
  const message =
    drafts.length === 0
      ? "There were no invitations waiting."
      : logged
        ? `Approved ${sent} invitation${sent === 1 ? "" : "s"}. Email sending isn't switched on yet (there's no email key), so they were written to the server log instead of being sent.`
        : `Sent ${sent} invitation${sent === 1 ? "" : "s"}.`;

  revalidatePath("/studio/invite");
  revalidatePath("/studio", "layout");
  redirect(
    back({
      notice: failed ? `${message} ${failed} couldn't be sent and are still waiting.` : message,
      tone: failed ? "danger" : undefined,
    })
  );
}
