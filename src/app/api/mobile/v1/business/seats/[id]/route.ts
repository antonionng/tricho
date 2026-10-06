import { body, formData, withMember } from "@/lib/mobile/api";
import { removeSeat, saveSeatProfile } from "@/app/members/business/actions";
import { businessAction } from "../../_outcome";

/** How a team member is introduced on the business page: { name, role, bio, showOnPage }. Their photo stays as it is. */
export const PATCH = withMember<{ id: string }>(async (req, _ctx, { id }) => {
  const b = await body<{ name: string; role: string; bio: string; showOnPage: boolean }>(req);
  return businessAction(() =>
    saveSeatProfile(formData({ id, name: b.name, role: b.role, bio: b.bio, showOnPage: b.showOnPage ? "on" : undefined }))
  );
});

/** Frees a seat. */
export const DELETE = withMember<{ id: string }>(async (_req, _ctx, { id }) => businessAction(() => removeSeat(formData({ id }))));
