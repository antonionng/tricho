import { describe, expect, it } from "vitest";
import {
  applyChunk,
  createSseReader,
  emptyReply,
  friendlyError,
  textOf,
  toRequestMessages,
  type ReplyState,
} from "../../../mobile/src/components/assistant/stream";
import { parseBlocks, parseInline } from "../../../mobile/src/components/assistant/parse-markdown";

const sse = (...chunks: unknown[]) => chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n";

function run(text: string, splitEvery = 0) {
  const reader = createSseReader();
  let state: ReplyState = emptyReply();
  const pieces = splitEvery ? text.match(new RegExp(`[\\s\\S]{1,${splitEvery}}`, "g"))! : [text];
  for (const piece of pieces) for (const chunk of reader.push(piece)) state = applyChunk(state, chunk);
  for (const chunk of reader.flush()) state = applyChunk(state, chunk);
  return state;
}

const reply = sse(
  { type: "start", messageId: "m1" },
  { type: "start-step" },
  { type: "tool-input-start", toolCallId: "t1", toolName: "searchDirectory" },
  { type: "tool-input-available", toolCallId: "t1", toolName: "searchDirectory", input: { discipline: "clinical" } },
  { type: "tool-output-available", toolCallId: "t1", output: [] },
  { type: "finish-step" },
  { type: "start-step" },
  { type: "text-start", id: "a" },
  { type: "text-delta", id: "a", delta: "Refer to a " },
  { type: "text-delta", id: "a", delta: "trichologist — soon." },
  { type: "text-end", id: "a" },
  { type: "finish-step" },
  { type: "finish" }
);

describe("the Assistant's stream reader", () => {
  it("builds the reply from a whole response", () => {
    const state = run(reply);
    expect(state.finished).toBe(true);
    expect(state.error).toBeNull();
    expect(state.parts).toEqual([
      { type: "tool", id: "t1", name: "searchDirectory", done: true },
      { type: "text", text: "Refer to a trichologist — soon." },
    ]);
    expect(textOf(state.parts)).toBe("Refer to a trichologist — soon.");
  });

  it("gives the same reply however the network splits it", () => {
    const whole = run(reply);
    for (const n of [1, 3, 7, 50]) expect(run(reply, n)).toEqual(whole);
  });

  it("copes with CRLF line endings and ignores junk", () => {
    const text = reply.replace(/\n/g, "\r\n") + ": comment\r\n\r\ndata: not json\r\n\r\n";
    expect(textOf(run(text).parts)).toBe("Refer to a trichologist — soon.");
    expect(textOf(run(text, 1).parts)).toBe("Refer to a trichologist — soon.");
  });

  it("records an error sent inside the stream", () => {
    const state = run(sse({ type: "start" }, { type: "error", errorText: "Rate limited (429)." }));
    expect(state.error).toBe("Rate limited (429).");
  });

  it("reads a final event that has no trailing blank line", () => {
    const state = run(`data: ${JSON.stringify({ type: "text-delta", id: "a", delta: "Hi" })}`);
    expect(textOf(state.parts)).toBe("Hi");
  });
});

describe("the request the app sends", () => {
  it("sends only text, in the AI SDK's message shape", () => {
    expect(
      toRequestMessages([
        { id: "u1", role: "user", parts: [{ type: "text", text: "Patchy loss in a child" }] },
        { id: "a1", role: "assistant", parts: [{ type: "tool", id: "t", name: "searchDirectory", done: true }, { type: "text", text: "See a GP first." }] },
        { id: "a2", role: "assistant", parts: [] },
      ])
    ).toEqual([
      { id: "u1", role: "user", parts: [{ type: "text", text: "Patchy loss in a child" }] },
      { id: "a1", role: "assistant", parts: [{ type: "text", text: "See a GP first." }] },
    ]);
  });
});

describe("friendly errors", () => {
  it("explains each failure in a sentence", () => {
    expect(friendlyError(402, "The Assistant is part of the Professional plan.")).toMatch(/Professional membership/);
    expect(friendlyError(503, "")).toMatch(/can't reach its AI service/);
    expect(friendlyError(401, "Unauthorized")).toMatch(/sign in again/);
    expect(friendlyError(200, "Rate limited (429).")).toMatch(/busy/);
    expect(friendlyError(0, "")).toMatch(/offline/);
    expect(friendlyError(500, "boom")).toMatch(/couldn't finish/);
  });
});

describe("Assistant markdown", () => {
  it("splits headings, paragraphs, lists and code", () => {
    const md = "## Red flags\nSudden loss\nin a child.\n\n- Pain\n- Burning\n\n- Pus\n\n1. See a GP\n2. Then dermatology\n\n```\nnote\n```\n---";
    expect(parseBlocks(md)).toEqual([
      { type: "heading", level: 2, text: "Red flags" },
      { type: "paragraph", text: "Sudden loss in a child." },
      { type: "list", ordered: false, items: ["Pain", "Burning", "Pus"] },
      { type: "list", ordered: true, items: ["See a GP", "Then dermatology"] },
      { type: "code", text: "note" },
      { type: "rule" },
    ]);
  });

  it("reads bold, italics, code and links", () => {
    expect(parseInline("See **a GP** and *then* `derm` via [the directory](/directory/p/x).")).toEqual([
      { text: "See " },
      { text: "a GP", bold: true },
      { text: " and " },
      { text: "then", italic: true },
      { text: " " },
      { text: "derm", code: true },
      { text: " via " },
      { text: "the directory", href: "/directory/p/x" },
      { text: "." },
    ]);
  });
});
