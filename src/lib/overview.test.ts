import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/agents/publish", () => ({ SYSTEM_USER_EMAIL: "team@trichollective.local" }));

import { signupsBySource } from "./overview";

describe("today's sign-ups", () => {
  it("splits paid and free and counts dublin and ireland as one source", () => {
    const today = signupsBySource([
      { plan: "professional", signupSource: "dublin" },
      { plan: null, signupSource: "ireland" },
      { plan: null, signupSource: "Ireland" },
      { plan: "community", signupSource: null },
      { plan: null, signupSource: "instagram" },
    ]);
    expect(today.total).toBe(5);
    expect(today.paid).toBe(2);
    expect(today.free).toBe(3);
    expect(today.sources[0]).toEqual({ key: "ireland", label: "Trichollective Ireland", paid: 1, free: 2, total: 3 });
    expect(today.sources.map((s) => s.label)).toEqual(["Trichollective Ireland", "Direct", "Instagram"]);
  });

  it("is empty when nobody has joined", () => {
    expect(signupsBySource([])).toEqual({ total: 0, paid: 0, free: 0, sources: [] });
  });
});
