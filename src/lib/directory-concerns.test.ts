import { describe, expect, it } from "vitest";
import { concernWhere } from "./directory-concerns";
import { consumerEnquiryStatus } from "./enquiry-status";

describe("concernWhere", () => {
  it("matches the concern's terms across specialism, headline, bio and services", () => {
    const where = concernWhere("patches");
    const or = where.OR ?? [];
    expect(or).toContainEqual({ specialization: { contains: "alopecia", mode: "insensitive" } });
    expect(or).toContainEqual({ bio: { contains: "areata", mode: "insensitive" } });
    expect(or).toContainEqual({ services: { hasSome: ["alopecia", "Alopecia"] } });
  });

  it("adds no filter for no concern or an unknown one", () => {
    expect(concernWhere(undefined)).toEqual({});
    expect(concernWhere("made-up" as never)).toEqual({});
  });
});

describe("consumerEnquiryStatus", () => {
  it("explains each status in plain words", () => {
    expect(consumerEnquiryStatus("forwarded", "Niamh")).toMatchObject({ label: "Sent" });
    expect(consumerEnquiryStatus("closed", "Niamh")).toMatchObject({ label: "Closed" });
    expect(consumerEnquiryStatus("new", "Niamh").label).toBe("Waiting");
    expect(consumerEnquiryStatus("new", "Niamh").detail).toMatch(/^Niamh has not claimed/);
  });
});
