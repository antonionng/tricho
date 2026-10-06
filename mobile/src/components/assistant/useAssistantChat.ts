import { useCallback, useEffect, useRef, useState } from "react";
import { fetch } from "expo/fetch";
import { authHeaders } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { applyChunk, createSseReader, emptyReply, friendlyError, toRequestMessages, type ChatMessage, type UIChunk } from "./stream";

export type ChatStatus = "ready" | "submitted" | "streaming";

let counter = 0;
const newId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;

/**
 * A conversation with the Assistant through the website's /api/ai/chat, signed
 * with this phone's token. The reply streams in with expo/fetch; if the body
 * can't be streamed it arrives all at once, read by the same parser.
 */
export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      const current = controller.current;
      controller.current = null;
      current?.abort();
    },
    []
  );

  const run = useCallback(async (history: ChatMessage[]) => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setError(null);
    setStatus("submitted");

    const id = newId();
    let state = emptyReply();
    // A reply that was replaced or cleared by "New conversation" stops touching the screen.
    const live = () => controller.current === abort;
    const show = () => live() && setMessages([...history, { id, role: "assistant", parts: state.parts }]);
    const apply = (chunks: UIChunk[]) => {
      for (const chunk of chunks) state = applyChunk(state, chunk);
    };

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "text/event-stream", ...authHeaders() },
        body: JSON.stringify({ messages: toRequestMessages(history) }),
        signal: abort.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (live()) setError(friendlyError(res.status, text));
        return;
      }
      if (live()) setStatus("streaming");
      const sse = createSseReader();
      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) apply(sse.push(decoder.decode(value, { stream: true })));
          show();
        }
      } else {
        apply(sse.push(await res.text()));
      }
      apply(sse.flush());
      show();
      if (state.error && live()) setError(friendlyError(200, state.error));
    } catch {
      // Stopped by the member: keep what arrived. Anything else is a failed reply.
      if (!abort.signal.aborted && live()) setError(friendlyError(0, ""));
    } finally {
      if (live()) {
        controller.current = null;
        // Drop an empty reply, so a retry starts cleanly.
        if (!state.parts.length) setMessages(history);
        setStatus("ready");
      }
    }
  }, []);

  const send = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || status !== "ready") return;
      const history = [...messages, { id: newId(), role: "user" as const, parts: [{ type: "text" as const, text: value }] }];
      setMessages(history);
      run(history);
    },
    [messages, run, status]
  );

  /** Asks again for the last reply. */
  const regenerate = useCallback(() => {
    const lastUser = messages.map((m) => m.role).lastIndexOf("user");
    if (lastUser < 0 || status !== "ready") return;
    const history = messages.slice(0, lastUser + 1);
    setMessages(history);
    run(history);
  }, [messages, run, status]);

  const stop = useCallback(() => controller.current?.abort(), []);

  const reset = useCallback(() => {
    const current = controller.current;
    controller.current = null;
    current?.abort();
    setMessages([]);
    setError(null);
    setStatus("ready");
  }, []);

  return { messages, status, error, send, regenerate, stop, reset, busy: status !== "ready" };
}
