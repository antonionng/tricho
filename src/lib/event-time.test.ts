import { describe, expect, it } from "vitest";
import { eventTimeZone, mapHref, timeZoneLabel } from "./event-time";

describe("event time zones", () => {
  it("defaults to London and rejects zones Intl does not know", () => {
    expect(eventTimeZone(null)).toBe("Europe/London");
    expect(eventTimeZone("")).toBe("Europe/London");
    expect(eventTimeZone("Mars/Olympus")).toBe("Europe/London");
    expect(eventTimeZone("Europe/Dublin")).toBe("Europe/Dublin");
  });

  it("calls the shared Dublin and London clock Irish and UK time", () => {
    expect(timeZoneLabel("Europe/London")).toBe("Irish and UK time");
    expect(timeZoneLabel("Europe/Dublin")).toBe("Irish and UK time");
    expect(timeZoneLabel("America/New_York")).toBe("New York time");
  });

  it("builds a map search from whatever parts are given", () => {
    expect(mapHref(["Whittlebury Hall", null, " NN12 8QH "])).toBe("https://www.google.com/maps/search/?api=1&query=Whittlebury%20Hall%2C%20NN12%208QH");
    expect(mapHref([null, ""])).toBeNull();
  });
});
