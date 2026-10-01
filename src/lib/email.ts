/**
 * Outgoing email. Uses the Resend REST API when AUTH_RESEND_KEY is set,
 * otherwise logs to the console so local development never sends anything.
 */

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  /** Where replies go, e.g. the person who sent an enquiry. Defaults to EMAIL_REPLY_TO. */
  replyTo?: string;
  /** One-click unsubscribe for anything that isn't strictly transactional. */
  unsubscribeUrl?: string;
  /** Resend tag, e.g. "owner-alert" or "release", so sends can be filtered in Resend. */
  tag?: string;
};

export type SendEmailResult = { ok: true; id?: string; skipped?: boolean };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Turns the plain-text house format (blank-line paragraphs, "## " subheadings,
 * "- " bullets) into simple, email-safe HTML.
 */
export function textToHtml(text: string) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("## ")) {
        return `<h2 style="font-size:20px;line-height:1.3;margin:28px 0 8px;color:#0b0b0b">${escapeHtml(trimmed.slice(3))}</h2>`;
      }
      const lines = trimmed.split("\n");
      if (lines.every((l) => l.trim().startsWith("- "))) {
        return `<ul style="padding-left:20px;margin:0 0 16px">${lines
          .map((l) => `<li style="margin:0 0 6px">${escapeHtml(l.trim().slice(2))}</li>`)
          .join("")}</ul>`;
      }
      return `<p style="margin:0 0 16px">${lines.map(escapeHtml).join("<br>")}</p>`;
    })
    .join("\n");
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#3a3a3a;max-width:600px">${html}</div>`;
}

export async function sendEmail({ to, subject, text, html, replyTo, unsubscribeUrl, tag }: SendEmailInput): Promise<SendEmailResult> {
  const key = process.env.AUTH_RESEND_KEY;
  const from = process.env.AUTH_EMAIL_FROM || "Trichollective <onboarding@resend.dev>";
  const recipients = (Array.isArray(to) ? to : [to]).filter((r) => r && !r.endsWith(".local"));
  if (!recipients.length) return { ok: true, skipped: true };
  const reply = replyTo || process.env.EMAIL_REPLY_TO || undefined;

  if (!key) {
    console.info(
      `[email] AUTH_RESEND_KEY not set, not sending.\n  to: ${recipients.join(", ")}\n  subject: ${subject}\n  ---\n${text
        .split("\n")
        .slice(0, 12)
        .join("\n")}${text.split("\n").length > 12 ? "\n  ..." : ""}`
    );
    return { ok: true, skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      text,
      html: html ?? textToHtml(text),
      ...(reply ? { reply_to: reply } : {}),
      ...(unsubscribeUrl
        ? { headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }
        : {}),
      ...(tag ? { tags: [{ name: "kind", value: tag.replace(/[^a-zA-Z0-9_-]/g, "_") }] } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend returned ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true, id: data.id };
}
