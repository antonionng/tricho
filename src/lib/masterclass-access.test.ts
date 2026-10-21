import { describe, expect, it } from "vitest";
import {
  hasMasterclassAccess,
  includedAsMemberForEvent,
  isMasterclassEventKind,
  isMasterclassRecording,
} from "./masterclass-access";

describe("isMasterclassEventKind", () => {
  it("is only the taught monthly masterclass", () => {
    expect(isMasterclassEventKind("masterclass")).toBe(true);
    expect(isMasterclassEventKind("case_round")).toBe(false);
    expect(isMasterclassEventKind("gathering")).toBe(false);
    expect(isMasterclassEventKind("chapter_meetup")).toBe(false);
    expect(isMasterclassEventKind("welcome")).toBe(false);
    expect(isMasterclassEventKind(null)).toBe(false);
  });
});

describe("hasMasterclassAccess", () => {
  it("includes Professional, Business and admin, and excludes Community", () => {
    expect(hasMasterclassAccess({ isActive: true, tierId: "professional" })).toBe(true);
    expect(hasMasterclassAccess({ isActive: true, tierId: "business" })).toBe(true);
    expect(hasMasterclassAccess({ isActive: true, tierId: "community", role: "admin" })).toBe(true);
    expect(hasMasterclassAccess({ isActive: false, role: "admin" })).toBe(true);
    expect(hasMasterclassAccess({ isActive: true, tierId: "community" })).toBe(false);
    expect(hasMasterclassAccess({ isActive: false, tierId: "professional" })).toBe(false);
    expect(hasMasterclassAccess({ isActive: true })).toBe(false);
  });
});

describe("includedAsMemberForEvent", () => {
  const community = { isActive: true, tierId: "community" as const };
  const professional = { isActive: true, tierId: "professional" as const };

  it("treats Community as a guest on masterclasses and as a member elsewhere", () => {
    expect(includedAsMemberForEvent("masterclass", community)).toBe(false);
    expect(includedAsMemberForEvent("case_round", community)).toBe(true);
    expect(includedAsMemberForEvent("gathering", community)).toBe(true);
    expect(includedAsMemberForEvent("chapter_meetup", community)).toBe(true);
  });

  it("includes Professional on every kind", () => {
    expect(includedAsMemberForEvent("masterclass", professional)).toBe(true);
    expect(includedAsMemberForEvent("case_round", professional)).toBe(true);
  });

  it("never includes an inactive membership", () => {
    expect(includedAsMemberForEvent("gathering", { isActive: false, tierId: "community" })).toBe(false);
    expect(includedAsMemberForEvent("masterclass", { isActive: false, tierId: "professional" })).toBe(false);
  });

  it("includes the team even without a paid plan", () => {
    expect(includedAsMemberForEvent("masterclass", { isActive: false }, "admin")).toBe(true);
  });
});

describe("isMasterclassRecording", () => {
  it("gates recording and masterclass kinds, and titles that name a masterclass", () => {
    expect(isMasterclassRecording({ kind: "recording", title: "October replay" })).toBe(true);
    expect(isMasterclassRecording({ kind: "masterclass", title: "The five-minute scalp check" })).toBe(true);
    expect(isMasterclassRecording({ kind: "guide", title: "Masterclass: shedding after illness" })).toBe(true);
    expect(isMasterclassRecording({ kind: "guide", title: "How to take a scalp history" })).toBe(false);
    expect(isMasterclassRecording({ kind: "talk-note", title: "Client note: telogen timing" })).toBe(false);
  });
});
