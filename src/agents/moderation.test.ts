import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ROOMS, type Room } from "@/config/rooms";

const generateStructured = vi.fn();
const aiAvailable = vi.fn(() => true);
vi.mock("./ai", () => ({ generateStructured, aiAvailable }));

const prisma = {
  report: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  communityPost: { update: vi.fn() },
  comment: { update: vi.fn(), findUnique: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma }));

const rooms: Room[] = [
  ...DEFAULT_ROOMS,
  { id: "open-checked", label: "Open and checked", blurb: "An open room.", prompt: "Ask.", aiModeration: true },
];
vi.mock("@/lib/rooms", () => ({ getAllRooms: async () => rooms }));

const { assessContent, assessReport, moderateNewContent } = await import("./moderation");

const high = { severity: "high", category: "privacy", rationale: "It names the client.", suggestedAction: "hide" } as const;

beforeEach(() => {
  vi.clearAllMocks();
  aiAvailable.mockReturnValue(true);
});

describe("moderation assistant", () => {
  it("returns null when the model is unavailable, and changes nothing", async () => {
    generateStructured.mockResolvedValue(null);
    expect(await assessContent({ text: "Hello", room: DEFAULT_ROOMS[0] })).toBeNull();
    expect(await moderateNewContent({ postId: "p1", text: "Hello", roomId: "case-room" })).toBeNull();
    expect(prisma.report.create).not.toHaveBeenCalled();
    expect(prisma.communityPost.update).not.toHaveBeenCalled();
  });

  it("does nothing at all without an AI key", async () => {
    aiAvailable.mockReturnValue(false);
    expect(await moderateNewContent({ postId: "p1", text: "Hello", roomId: "case-room" })).toBeNull();
    expect(await assessReport("r1")).toBeNull();
    expect(generateStructured).not.toHaveBeenCalled();
    expect(prisma.report.findUnique).not.toHaveBeenCalled();
  });

  it("skips rooms without the assistant switched on", async () => {
    generateStructured.mockResolvedValue(high);
    expect(await moderateNewContent({ postId: "p1", text: "Hello", roomId: "lounge" })).toBeNull();
    expect(generateStructured).not.toHaveBeenCalled();
  });

  it("reports and hides high-severity content in a professional room", async () => {
    generateStructured.mockResolvedValue(high);
    await moderateNewContent({ postId: "p1", text: "Mrs Smith, 42, from Galway", roomId: "case-room" });
    expect(prisma.report.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ postId: "p1", commentId: null, source: "moderation", reason: high.rationale, aiVerdict: high }),
    });
    expect(prisma.communityPost.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: expect.objectContaining({ hiddenAt: expect.any(Date) }),
    });
  });

  it("hides only the reply when a reply is flagged", async () => {
    generateStructured.mockResolvedValue(high);
    await moderateNewContent({ postId: "p1", commentId: "c1", text: "Her name is Jane", roomId: "case-room" });
    expect(prisma.report.create).toHaveBeenCalledWith({ data: expect.objectContaining({ postId: "p1", commentId: "c1" }) });
    expect(prisma.comment.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: expect.objectContaining({ hiddenAt: expect.any(Date) }) });
    expect(prisma.communityPost.update).not.toHaveBeenCalled();
  });

  it("only reports high-severity content in an open room", async () => {
    generateStructured.mockResolvedValue({ ...high, category: "promotion" });
    await moderateNewContent({ postId: "p2", text: "Use my code for 20% off", roomId: "open-checked" });
    expect(prisma.report.create).toHaveBeenCalledTimes(1);
    expect(prisma.communityPost.update).not.toHaveBeenCalled();
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it("files nothing for low-severity content", async () => {
    generateStructured.mockResolvedValue({ severity: "low", category: "other", rationale: "Probably fine.", suggestedAction: "review" });
    await moderateNewContent({ postId: "p3", text: "A question", roomId: "case-room" });
    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it("attaches a verdict to a member's report", async () => {
    prisma.report.findUnique.mockResolvedValue({
      aiVerdict: null,
      post: { title: "A title", content: "Body", space: "lounge" },
      comment: null,
    });
    generateStructured.mockResolvedValue(high);
    await assessReport("r1");
    expect(prisma.report.update).toHaveBeenCalledWith({ where: { id: "r1" }, data: { aiVerdict: high } });
  });
});
