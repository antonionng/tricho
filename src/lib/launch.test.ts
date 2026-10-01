import { describe, expect, it } from "vitest";
import { freeListingOfferLive } from "./launch";

describe("free listing offer", () => {
  it("runs from launch day to the end of 3 January", () => {
    expect(freeListingOfferLive(new Date("2026-10-04T22:59:00Z"))).toBe(false);
    expect(freeListingOfferLive(new Date("2026-10-04T23:00:00Z"))).toBe(true);
    expect(freeListingOfferLive(new Date("2027-01-03T23:59:00Z"))).toBe(true);
    expect(freeListingOfferLive(new Date("2027-01-04T00:00:00Z"))).toBe(false);
  });
});
