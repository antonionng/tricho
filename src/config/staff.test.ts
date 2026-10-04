import { describe, expect, it } from "vitest";
import {
  NAV,
  NAV_GROUPS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  STAFF_ROLES,
  can,
  canApproveDraft,
  canChangeOwner,
  draftPermission,
  navFor,
} from "./staff";

describe("staff roles", () => {
  it("gives owners every permission", () => {
    expect([...ROLE_PERMISSIONS.owner].sort()).toEqual([...PERMISSIONS].sort());
  });

  it("only uses known permissions", () => {
    for (const role of STAFF_ROLES) for (const p of ROLE_PERMISSIONS[role]) expect(PERMISSIONS).toContain(p);
  });

  it("keeps support read-only, with no exports or audit log", () => {
    for (const p of ROLE_PERMISSIONS.support) expect(p.endsWith(".view")).toBe(true);
    expect(can("support", "members.export")).toBe(false);
    expect(can("support", "subscribers.export")).toBe(false);
    expect(can("support", "audit.view")).toBe(false);
  });

  it("keeps team management and exports with owners", () => {
    for (const role of STAFF_ROLES.filter((r) => r !== "owner")) {
      expect(can(role, "staff.manage")).toBe(false);
      expect(can(role, "members.export")).toBe(false);
      expect(can(role, "members.ban")).toBe(false);
    }
  });

  it("matches each role to its work", () => {
    expect(can("editor", "gazette.publish")).toBe(true);
    expect(can("editor", "podcast.publish")).toBe(true);
    expect(can("editor", "events.edit")).toBe(false);
    expect(can("events", "events.edit")).toBe(true);
    expect(can("events", "gazette.edit")).toBe(false);
    expect(can("moderator", "members.suspend")).toBe(true);
    expect(can("moderator", "community.rooms")).toBe(true);
    expect(can("moderator", "members.edit")).toBe(false);
    expect(can(null, "overview.view")).toBe(false);
  });

  it("gives every role the overview", () => {
    for (const role of STAFF_ROLES) expect(can(role, "overview.view")).toBe(true);
  });
});

describe("inbox decisions", () => {
  it("routes each kind of draft to the right role", () => {
    expect(draftPermission("newsletter")).toBe("gazette.publish");
    expect(draftPermission("announcement", { type: "event" })).toBe("events.edit");
    expect(draftPermission("announcement", { type: "podcast" })).toBe("podcast.publish");
    expect(draftPermission("announcement", { type: "edition" })).toBe("gazette.publish");
    expect(draftPermission("community_post")).toBe("community.moderate");
    expect(draftPermission("community_post", { type: "podcast" })).toBe("podcast.publish");
    expect(canApproveDraft("editor", "community_post", { type: "podcast" })).toBe(true);
    expect(canApproveDraft("editor", "community_post")).toBe(false);
    expect(draftPermission("partner_enquiry")).toBe("owner");
  });

  it("lets only owners decide on anything unlisted", () => {
    expect(canApproveDraft("owner", "email")).toBe(true);
    expect(canApproveDraft("editor", "email")).toBe(false);
    expect(canApproveDraft("events", "announcement", { type: "event" })).toBe(true);
    expect(canApproveDraft("events", "newsletter")).toBe(false);
    expect(canApproveDraft("support", "newsletter")).toBe(false);
  });
});

describe("owners", () => {
  it("refuses to remove the last owner", () => {
    expect(canChangeOwner({ ownersAfter: 0, isEnvOwner: false }).ok).toBe(false);
    expect(canChangeOwner({ ownersAfter: 1, isEnvOwner: false }).ok).toBe(true);
  });

  it("refuses to change owners set in the site settings", () => {
    expect(canChangeOwner({ ownersAfter: 3, isEnvOwner: true }).ok).toBe(false);
  });
});

describe("navigation", () => {
  it("shows each role only what it can open", () => {
    expect(navFor(ROLE_PERMISSIONS.owner)).toHaveLength(NAV.length);
    const events = navFor(ROLE_PERMISSIONS.events).map((n) => n.href);
    expect(events).toContain("/studio/events");
    expect(events).not.toContain("/studio/team");
    expect(events).not.toContain("/studio/members");
  });

  it("puts every page in one of the five groups, in order", () => {
    for (const item of NAV) expect(NAV_GROUPS).toContain(item.group);
    const order = NAV.map((n) => NAV_GROUPS.indexOf(n.group));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(NAV.filter((n) => n.group === "today").map((n) => n.label)).toEqual(["Overview", "Inbox", "This month"]);
  });
});
