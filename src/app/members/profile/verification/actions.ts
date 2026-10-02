"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { deleteStoredFile, storeUpload, type UploadResult } from "@/lib/storage";
import { alertOwners } from "@/lib/mail/send";
import { verificationSubmittedAlert } from "@/lib/mail/templates/owners";
import { isVerificationKind, MAX_PENDING_REQUESTS } from "@/lib/verification";
import { loadApplicant } from "./applicant";

const PAGE = "/members/profile/verification";

function s(form: FormData, key: string, max: number) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function uploadError(message: string) {
  if (/larger than/i.test(message)) return "size";
  if (/PDF|JPEG/i.test(message)) return "type";
  if (/empty/i.test(message)) return "file";
  return "save";
}

/** Send a document for the verified badge. Stored privately; the owners are told. */
export async function submitVerificationAction(form: FormData) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect(`/login?next=${PAGE}`);
  const applicant = await loadApplicant(ctx);
  if (!applicant?.eligible) redirect(PAGE);

  const kind = s(form, "kind", 32);
  const title = s(form, "title", 160);
  const note = s(form, "note", 2000) || null;
  const file = form.get("file");

  if (!isVerificationKind(kind)) redirect(`${PAGE}?error=kind#send`);
  if (title.length < 3) redirect(`${PAGE}?error=title#send`);
  if (!(file instanceof File) || file.size === 0) redirect(`${PAGE}?error=file#send`);

  const pending = await prisma.verificationRequest.count({ where: { userId: applicant.userId, status: "pending" } });
  if (pending >= MAX_PENDING_REQUESTS) redirect(`${PAGE}?error=limit#send`);

  let stored: UploadResult | null;
  try {
    stored = await storeUpload({ kind: "document", file, ownerId: applicant.userId, isPublic: false });
  } catch (error) {
    console.error("[verification] upload failed", error);
    stored = { ok: false, message: "save" };
  }
  if (!stored) redirect(`${PAGE}?error=file#send`);
  if (!stored.ok) redirect(`${PAGE}?error=${uploadError(stored.message)}#send`);

  await prisma.verificationRequest.create({
    data: { userId: applicant.userId, kind, title, note, fileId: stored.file.id },
  });

  await alertOwners(
    verificationSubmittedAlert({ name: applicant.name, email: applicant.email ?? "No email on file", title })
  ).catch((error) => console.error("[verification] owner alert failed", error));

  revalidatePath(PAGE);
  revalidatePath("/studio/verification");
  redirect(`${PAGE}?sent=1`);
}

/** Withdraw a request that has not been reviewed yet, deleting its document. */
export async function withdrawVerificationAction(form: FormData) {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId) redirect(`/login?next=${PAGE}`);

  const id = s(form, "id", 64);
  const request = await prisma.verificationRequest.findFirst({
    where: { id, userId, status: "pending" },
    select: { id: true, fileId: true },
  });
  if (!request) redirect(PAGE);

  await prisma.verificationRequest.delete({ where: { id: request.id } });
  await deleteStoredFile(request.fileId).catch((error) => console.error("[verification] couldn't delete file", error));

  revalidatePath(PAGE);
  revalidatePath("/studio/verification");
  redirect(`${PAGE}?withdrawn=1`);
}
