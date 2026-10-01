import { describe, expect, it } from "vitest";
import { canPostInRoom, canReadRoom, normalizeSpace, ROOMS } from "./rooms";

describe("community spaces", () => {
  it("keeps the Case Room for professionals", () => {
    expect(canReadRoom("case-room", false)).toBe(false);
    expect(canReadRoom("case-room", true)).toBe(true);
    expect(canPostInRoom("case-room", { professional: false, profession: "clinical" })).toBe(false);
    expect(canPostInRoom("case-room", { professional: true, profession: "clinical" })).toBe(true);
  });

  it("keeps brands out of clinical discussion", () => {
    expect(canPostInRoom("hair-loss", { professional: true, profession: "brand" })).toBe(false);
    expect(canPostInRoom("case-room", { professional: true, profession: "brand" })).toBe(false);
    expect(canPostInRoom("business", { professional: true, profession: "brand" })).toBe(true);
  });

  it("lets every member post in open spaces", () => {
    for (const r of ROOMS.filter((r) => !r.professionalOnly && !r.noBrands)) {
      expect(canPostInRoom(r.id, { professional: false, profession: "cosmetic" })).toBe(true);
    }
  });

  it("gives posts from earlier builds a home", () => {
    expect(normalizeSpace("everyone")).toBe("lounge");
    expect(normalizeSpace("consultation")).toBe("case-room");
    expect(normalizeSpace("clinical")).toBe("hair-loss");
    expect(normalizeSpace("not-a-space")).toBe("lounge");
  });
});
