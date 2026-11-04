/** The answers to "How did you hear about Trichollective?" on the sign-up form, in the order shown. */
export const HEARD_FROM = [
  { id: "colleague", label: "A colleague or friend" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "search", label: "A Google search" },
  { id: "event", label: "An event or conference" },
  { id: "trichozette", label: "Trichozette" },
  { id: "other", label: "Somewhere else" },
] as const;

export function heardFromLabel(id: string | null | undefined) {
  return HEARD_FROM.find((h) => h.id === id)?.label ?? null;
}
