/**
 * Ticket codes as the browser sees them. Kept apart from attendees.ts (which
 * makes codes with node:crypto) so the check-in page can import it.
 */

/** Pull a code out of whatever the camera read: the bare code or the ticket page link. */
export function codeFromScan(raw: string) {
  const text = raw.trim();
  const fromUrl = text.match(/\/ticket\/([A-Za-z0-9]+)\/?(?:[?#].*)?$/);
  const code = (fromUrl ? fromUrl[1] : text).toUpperCase();
  return /^[A-Z0-9]{8,32}$/.test(code) ? code : null;
}

export const ticketPath = (slug: string, code: string) => `/events/${slug}/ticket/${code}`;
