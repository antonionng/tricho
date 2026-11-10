import "server-only";
import { storeUpload } from "@/lib/storage";
import { MAX_DRAFT_FILES, startDraftRun } from "@/agents/course-drafter";

/** Reads the "draft with AI" form, stores any PDFs privately, and starts the run. */
export async function startDraftFromForm(form: FormData, ctx: { courseId: string; title: string; userId: string; unlimited: boolean }) {
  const fileIds: string[] = [];
  for (const file of form.getAll("files").slice(0, MAX_DRAFT_FILES)) {
    if (!(file instanceof File) || file.size === 0) continue;
    if (file.type && file.type !== "application/pdf") return { ok: false as const, error: "Please attach PDFs only." };
    const stored = await storeUpload({ kind: "document", file, ownerId: ctx.userId, isPublic: false });
    if (stored && !stored.ok) return { ok: false as const, error: stored.message };
    if (stored?.ok) fileIds.push(stored.file.id);
  }
  return startDraftRun({
    courseId: ctx.courseId,
    userId: ctx.userId,
    unlimited: ctx.unlimited,
    title: ctx.title,
    outline: String(form.get("outline") ?? "").slice(0, 8000),
    notes: String(form.get("notes") ?? ""),
    fileIds,
  });
}
