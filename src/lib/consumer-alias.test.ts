import { describe, expect, it } from "vitest";
import { isAliasFormat, randomAlias, randomAvatarSeed } from "./consumer-alias";

describe("randomAlias", () => {
  it("is a word and a three-digit number", () => {
    for (let i = 0; i < 200; i++) {
      const alias = randomAlias();
      expect(alias).toMatch(/^[A-Z][a-z]+-\d{3}$/);
      expect(isAliasFormat(alias)).toBe(true);
    }
  });

  it("takes nothing from the person: it only reads the random source", () => {
    expect(randomAlias(() => 0)).toBe("Alder-100");
    expect(randomAlias((max) => max - 1)).toBe("Willow-999");
    // The signature has no way to pass a name or email in.
    expect(randomAlias.length).toBe(0);
  });

  it("varies", () => {
    expect(new Set(Array.from({ length: 50 }, () => randomAlias())).size).toBeGreaterThan(40);
  });
});

describe("randomAvatarSeed", () => {
  it("is random hex", () => {
    expect(randomAvatarSeed()).toMatch(/^[0-9a-f]{16}$/);
    expect(randomAvatarSeed()).not.toBe(randomAvatarSeed());
  });
});
