import { describe, expect, it } from "vitest";
import { canonicalOrigin } from "./site";

describe("the canonical address", () => {
  it("always uses www for the live domain, because the bare domain redirects there", () => {
    expect(canonicalOrigin("https://trichollective.net")).toBe("https://www.trichollective.net");
    expect(canonicalOrigin("https://trichollective.net/")).toBe("https://www.trichollective.net");
    expect(canonicalOrigin("http://trichollective.net")).toBe("https://www.trichollective.net");
    expect(canonicalOrigin("https://www.trichollective.net")).toBe("https://www.trichollective.net");
  });

  it("leaves other hosts alone", () => {
    expect(canonicalOrigin("http://localhost:3000")).toBe("http://localhost:3000");
    expect(canonicalOrigin("https://trichollective.network")).toBe("https://trichollective.network");
  });
});
