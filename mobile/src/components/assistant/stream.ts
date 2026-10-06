/**
 * Reading the Assistant's reply from /api/ai/chat. The route answers with the
 * Vercel AI SDK (v6) UI message stream: server-sent events, one JSON chunk per
 * `data:` line, ending with `data: [DONE]`. Pure functions, so they can be tested
 * without a phone (src/lib/mobile/assistant-stream.test.ts in the repo root).
 */

export type ReplyPart = { type: "text"; text: string } | { type: "tool"; id: string; name: string; done: boolean };

export type ChatMessage = { id: string; role: "user" | "assistant"; parts: ReplyPart[] };

export type ReplyState = {
  parts: ReplyPart[];
  /** A failure the server reported inside the stream. */
  error: string | null;
  finished: boolean;
};

export const emptyReply = (): ReplyState => ({ parts: [], error: null, finished: false });

/** One chunk of the UI message stream. Only the fields the app uses are typed. */
export type UIChunk = { type: string; id?: string; delta?: string; toolCallId?: string; toolName?: string; errorText?: string };

/**
 * Splits streamed text into SSE events. Feed it text as it arrives with push();
 * it returns the JSON chunks completed so far and keeps any partial event for
 * the next push. Call flush() when the body ends.
 */
export function createSseReader() {
  let buffer = "";
  const parse = (event: string): UIChunk[] => {
    const data = event
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""))
      .join("\n");
    if (!data || data === "[DONE]") return [];
    try {
      const value = JSON.parse(data);
      return value && typeof value === "object" && typeof value.type === "string" ? [value as UIChunk] : [];
    } catch {
      return [];
    }
  };
  return {
    push(text: string): UIChunk[] {
      // A CRLF split across two pushes is joined here before it is read.
      buffer = (buffer + text).replace(/\r\n/g, "\n");
      const out: UIChunk[] = [];
      let end = buffer.indexOf("\n\n");
      while (end >= 0) {
        out.push(...parse(buffer.slice(0, end)));
        buffer = buffer.slice(end + 2);
        end = buffer.indexOf("\n\n");
      }
      return out;
    },
    flush(): UIChunk[] {
      const rest = buffer;
      buffer = "";
      return rest.trim() ? parse(rest) : [];
    },
  };
}

/** Applies one chunk to the reply so far, returning a new state for React. */
export function applyChunk(state: ReplyState, chunk: UIChunk): ReplyState {
  switch (chunk.type) {
    case "text-start":
      return { ...state, parts: [...state.parts, { type: "text", text: "" }] };
    case "text-delta": {
      if (!chunk.delta) return state;
      const parts = [...state.parts];
      const last = parts[parts.length - 1];
      if (last?.type === "text") parts[parts.length - 1] = { type: "text", text: last.text + chunk.delta };
      else parts.push({ type: "text", text: chunk.delta });
      return { ...state, parts };
    }
    case "tool-input-start":
    case "tool-input-available": {
      const id = chunk.toolCallId ?? "";
      if (state.parts.some((p) => p.type === "tool" && p.id === id)) return state;
      return { ...state, parts: [...state.parts, { type: "tool", id, name: chunk.toolName ?? "", done: false }] };
    }
    case "tool-output-available":
    case "tool-output-error":
    case "tool-input-error":
      return {
        ...state,
        parts: state.parts.map((p) => (p.type === "tool" && p.id === chunk.toolCallId ? { ...p, done: true } : p)),
      };
    case "error":
      return { ...state, error: chunk.errorText || "The reply failed." };
    case "finish":
    case "abort":
      return { ...state, finished: true };
    default:
      return state;
  }
}

/** The reply's text, for copying. */
export function textOf(parts: ReplyPart[]) {
  return parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

/**
 * The conversation in the shape the route expects (AI SDK UIMessage). Only text
 * is sent back: tool calls were the server's own and need not be replayed.
 */
export function toRequestMessages(messages: ChatMessage[]) {
  return messages
    .map((m) => ({ id: m.id, role: m.role, parts: m.parts.filter((p) => p.type === "text" && p.text).map((p) => ({ type: "text" as const, text: (p as { text: string }).text })) }))
    .filter((m) => m.parts.length > 0);
}

/** Turns whatever the server said into one sentence a member can act on. Mirrors the website's chat. */
export function friendlyError(status: number, message: string) {
  if (status === 503 || /not (configured|switched on)|AI_GATEWAY_API_KEY|unauthenticated|api key/i.test(message)) {
    return "The Assistant can't reach its AI service right now, so it can't reply. Please try again later.";
  }
  if (status === 402 || /Professional plan/i.test(message)) return "The Assistant is part of Professional membership.";
  if (status === 401 || /unauthori[sz]ed/i.test(message)) return "Your session has ended. Please sign in again to keep using the Assistant.";
  if (status === 429 || /rate|429|too many/i.test(message)) return "The Assistant is busy right now. Please wait a moment and try again.";
  if (status === 0) return "You seem to be offline. Please check your connection and try again.";
  return "The Assistant couldn't finish that reply. Please try again.";
}
