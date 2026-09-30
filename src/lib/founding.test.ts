import { beforeEach, describe, expect, it, vi } from "vitest";

const userCount = vi.fn();
const partnerCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { count: (...args: unknown[]) => userCount(...args) },
    partner: { count: (...args: unknown[]) => partnerCount(...args) },
  },
}));

import { foundingMemberPlacesLeft, foundingPartnerPlacesLeft, placesLeft } from "./founding";
import { FOUNDING_MEMBER_PLACES, premiumBusiness } from "@/config/subscriptions";

describe("placesLeft", () => {
  it("subtracts places taken from the total", () => {
    expect(placesLeft(200, 57)).toBe(143);
    expect(placesLeft(6, 1)).toBe(5);
  });

  it("returns the full total when nothing is taken", () => {
    expect(placesLeft(200, 0)).toBe(200);
  });

  it("returns zero when exactly full", () => {
    expect(placesLeft(6, 6)).toBe(0);
  });

  it("never goes negative when more are taken than exist", () => {
    expect(placesLeft(6, 9)).toBe(0);
    expect(placesLeft(200, 1000)).toBe(0);
  });

  it("never exceeds the total, even with a nonsense negative count", () => {
    expect(placesLeft(200, -5)).toBe(200);
  });

  it("handles a total of zero", () => {
    expect(placesLeft(0, 0)).toBe(0);
    expect(placesLeft(0, 3)).toBe(0);
  });
});

describe("founding place counts", () => {
  beforeEach(() => {
    userCount.mockReset();
    partnerCount.mockReset();
  });

  it("counts founding members who hold a plan", async () => {
    userCount.mockResolvedValue(57);
    expect(await foundingMemberPlacesLeft()).toBe(FOUNDING_MEMBER_PLACES - 57);
    expect(userCount).toHaveBeenCalledWith({ where: { isFounding: true, plan: { not: null } } });
  });

  it("counts founding premium partners against the six places", async () => {
    partnerCount.mockResolvedValue(2);
    expect(await foundingPartnerPlacesLeft()).toBe(premiumBusiness.foundingPlaces - 2);
    expect(partnerCount).toHaveBeenCalledWith({ where: { tier: "premium", isFounding: true } });
  });

  it("shows no founding partner places over the limit", async () => {
    partnerCount.mockResolvedValue(premiumBusiness.foundingPlaces + 1);
    expect(await foundingPartnerPlacesLeft()).toBe(0);
  });

  it("falls back to all partner places if the partner table can't be read", async () => {
    partnerCount.mockRejectedValue(new Error("relation does not exist"));
    expect(await foundingPartnerPlacesLeft()).toBe(premiumBusiness.foundingPlaces);
  });
});
