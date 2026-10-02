/**
 * Who on the Trichollective team can do what in Studio. Pure data and
 * functions, so pages, client components and tests can all import it.
 */

export const STAFF_ROLES = ["owner", "editor", "events", "moderator", "support"] as const;
export type StaffRoleId = (typeof STAFF_ROLES)[number];

export const PERMISSIONS = [
  "overview.view",
  "audit.view",
  "staff.manage",
  "inbox.view",
  "members.view",
  "members.edit",
  "members.suspend",
  "members.ban",
  "members.notes",
  "members.export",
  "community.view",
  "community.moderate",
  "community.rooms",
  "events.view",
  "events.edit",
  "gazette.view",
  "gazette.edit",
  "gazette.publish",
  "podcast.view",
  "podcast.edit",
  "podcast.publish",
  "subscribers.view",
  "subscribers.export",
  "listings.view",
  "listings.review",
  "partners.view",
  "partners.manage",
  "invite.send",
  "emails.view",
  "emails.test",
  "agents.view",
  "agents.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const VIEW_ONLY = PERMISSIONS.filter((p) => p.endsWith(".view") && p !== "audit.view");

export const ROLE_PERMISSIONS: Record<StaffRoleId, readonly Permission[]> = {
  owner: PERMISSIONS,
  editor: [
    "overview.view",
    "inbox.view",
    "gazette.view",
    "gazette.edit",
    "gazette.publish",
    "podcast.view",
    "podcast.edit",
    "podcast.publish",
    "subscribers.view",
    "emails.view",
    "emails.test",
    "events.view",
    "agents.view",
  ],
  events: ["overview.view", "inbox.view", "events.view", "events.edit", "emails.view"],
  moderator: [
    "overview.view",
    "inbox.view",
    "members.view",
    "members.suspend",
    "members.notes",
    "community.view",
    "community.moderate",
    "community.rooms",
    "listings.view",
    "listings.review",
  ],
  support: VIEW_ONLY,
};

export const STAFF_ROLE_LABEL: Record<StaffRoleId, string> = {
  owner: "Owner",
  editor: "Editor",
  events: "Events",
  moderator: "Moderator",
  support: "Support",
};

/** Reads after "You are signed in as …". */
export const STAFF_ROLE_PHRASE: Record<StaffRoleId, string> = {
  owner: "an owner",
  editor: "an editor",
  events: "part of the events team",
  moderator: "a moderator",
  support: "part of the support team",
};

export const STAFF_ROLE_DESCRIPTION: Record<StaffRoleId, string> = {
  owner: "Owners can do everything in Studio, including choosing who is on the team and what each person can do.",
  editor: "Editors write and publish Trichozette editions, podcast episodes, newsletters and announcements.",
  events: "Events staff create and publish events, and approve the announcement emails that go with them.",
  moderator: "Moderators look after the community, review reports and listings, and can suspend members who break the rules.",
  support: "Support can see every part of Studio to help members, but cannot change anything or export personal data.",
};

export function isStaffRole(value: unknown): value is StaffRoleId {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);
}

export function permissionsFor(role: StaffRoleId | null | undefined): Set<Permission> {
  return new Set(role ? ROLE_PERMISSIONS[role] : []);
}

export function can(role: StaffRoleId | null | undefined, perm: Permission) {
  return !!role && ROLE_PERMISSIONS[role].includes(perm);
}

/**
 * The permission needed to approve or reject an inbox item. Anything
 * not listed here stays with owners.
 */
export function draftPermission(kind: string, payload?: unknown): Permission | "owner" {
  const type =
    payload && typeof payload === "object" && "type" in payload ? String((payload as { type: unknown }).type) : "";
  switch (kind) {
    case "newsletter":
    case "gazette_article":
      return "gazette.publish";
    case "announcement":
      if (type === "event") return "events.edit";
      if (type === "podcast") return "podcast.publish";
      return "gazette.publish";
    case "community_post":
      if (type === "podcast") return "podcast.publish";
      return "community.moderate";
    case "community_nudge":
      return "community.moderate";
    case "podcast_post":
      return "podcast.publish";
    case "event_prefill":
      return "events.edit";
    default:
      return "owner";
  }
}

export function canApproveDraft(role: StaffRoleId | null | undefined, kind: string, payload?: unknown) {
  const needed = draftPermission(kind, payload);
  if (needed === "owner") return role === "owner";
  return can(role, needed);
}

/**
 * Whether an owner can be demoted or removed. There must always be at least
 * one owner, and owners named in OWNER_EMAILS are owners whatever the
 * database says, so changing them in Studio would have no effect.
 */
export function canChangeOwner(opts: { ownersAfter: number; isEnvOwner: boolean }): { ok: true } | { ok: false; reason: string } {
  if (opts.isEnvOwner) {
    return { ok: false, reason: "This person is an owner through the site settings, so their role can't be changed in Studio." };
  }
  if (opts.ownersAfter < 1) {
    return { ok: false, reason: "The team needs at least one owner. Make someone else an owner first." };
  }
  return { ok: true };
}

export type NavIcon =
  | "overview"
  | "inbox"
  | "month"
  | "members"
  | "team"
  | "audit"
  | "listings"
  | "invite"
  | "partners"
  | "community"
  | "events"
  | "gazette"
  | "podcast"
  | "subscribers"
  | "emails"
  | "agents";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  perm: Permission;
  exact?: boolean;
  badge?: boolean;
  group: "run" | "publish" | "people" | "settings";
};

/** Studio navigation. The rail only shows what the signed-in role can open. */
export const NAV: NavItem[] = [
  { href: "/studio", label: "Overview", icon: "overview", perm: "overview.view", exact: true, group: "run" },
  { href: "/studio/inbox", label: "Inbox", icon: "inbox", perm: "inbox.view", badge: true, group: "run" },
  { href: "/studio/month", label: "This month", icon: "month", perm: "inbox.view", group: "run" },
  { href: "/studio/gazette", label: "Trichozette", icon: "gazette", perm: "gazette.view", group: "publish" },
  { href: "/studio/podcast", label: "Podcast", icon: "podcast", perm: "podcast.view", group: "publish" },
  { href: "/studio/events", label: "Events", icon: "events", perm: "events.view", group: "publish" },
  { href: "/studio/emails", label: "Emails", icon: "emails", perm: "emails.view", group: "publish" },
  { href: "/studio/members", label: "Members", icon: "members", perm: "members.view", group: "people" },
  { href: "/studio/community", label: "Community", icon: "community", perm: "community.view", group: "people" },
  { href: "/studio/listings", label: "Listings", icon: "listings", perm: "listings.view", group: "people" },
  { href: "/studio/partners", label: "Partners", icon: "partners", perm: "partners.view", group: "people" },
  { href: "/studio/invite", label: "Invite", icon: "invite", perm: "invite.send", group: "people" },
  { href: "/studio/subscribers", label: "Subscribers", icon: "subscribers", perm: "subscribers.view", group: "people" },
  { href: "/studio/team", label: "Team", icon: "team", perm: "staff.manage", group: "settings" },
  { href: "/studio/audit", label: "Audit log", icon: "audit", perm: "audit.view", group: "settings" },
  { href: "/studio/agents", label: "Agents", icon: "agents", perm: "agents.view", group: "settings" },
];

export const NAV_GROUP_LABEL: Record<NavItem["group"], string> = {
  run: "Run",
  publish: "Publish",
  people: "People",
  settings: "Team and settings",
};

export function navFor(perms: Iterable<Permission>) {
  const set = new Set(perms);
  return NAV.filter((item) => set.has(item.perm));
}
