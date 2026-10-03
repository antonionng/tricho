import { describe, expect, it } from "vitest";
import { canPostInRoom, canReadRoom, DEFAULT_ROOMS, normalizeSpace, roomById, ROOMS, type Room } from "./rooms";

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

  it("flags the Case Room for the moderation assistant", () => {
    expect(roomById("case-room")?.aiModeration).toBe(true);
    expect(roomById("lounge")?.aiModeration).toBeFalsy();
  });
});

describe("rooms managed in Studio", () => {
  const custom: Room[] = [
    ...DEFAULT_ROOMS,
    { id: "colour", label: "Colour", blurb: "Colour work.", prompt: "Ask away." },
    { id: "clinic-owners", label: "Clinic owners", blurb: "Owners only.", prompt: "Ask.", professionalOnly: true },
    { id: "old-room", label: "Old room", blurb: "Retired.", prompt: "Ask.", archived: true },
  ];

  it("finds and normalises custom rooms", () => {
    expect(roomById("colour", custom)?.label).toBe("Colour");
    expect(roomById("colour")).toBeUndefined();
    expect(normalizeSpace("colour", custom)).toBe("colour");
    expect(normalizeSpace("colour")).toBe("lounge");
  });

  it("never lets a custom room take over legacy Case Room posts", () => {
    const sneaky: Room[] = [...custom, { id: "medical", label: "Medical", blurb: "", prompt: "" }];
    expect(normalizeSpace("medical", sneaky)).toBe("case-room");
  });

  it("applies professional and brand rules to custom rooms", () => {
    expect(canReadRoom("clinic-owners", false, custom)).toBe(false);
    expect(canReadRoom("clinic-owners", true, custom)).toBe(true);
    expect(canPostInRoom("colour", { professional: false, profession: "brand" }, custom)).toBe(true);
  });

  it("keeps archived rooms readable but closed to new posts", () => {
    expect(canReadRoom("old-room", false, custom)).toBe(true);
    expect(canPostInRoom("old-room", { professional: true, profession: "clinical" }, custom)).toBe(false);
    expect(canPostInRoom("old-room", { professional: true, unlocked: true }, custom)).toBe(false);
  });

  it("treats a room missing from the list as closed", () => {
    const withoutCaseRoom = DEFAULT_ROOMS.filter((r) => r.id !== "case-room");
    expect(canReadRoom("case-room", true, withoutCaseRoom)).toBe(false);
  });
});
