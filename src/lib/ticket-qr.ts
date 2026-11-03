import QRCode from "qrcode";
import { site } from "@/config/site";
import { ticketPath } from "@/lib/attendees";

/**
 * The QR code on an e-ticket encodes the attendee's ticket page link. The door
 * reads the code from the end of it; anyone else who scans it lands on the
 * ticket page, which is where the attendee would want to be anyway.
 */

export function ticketLink(slug: string, code: string) {
  return `${site.url.replace(/\/$/, "")}${ticketPath(slug, code)}`;
}

const options = { errorCorrectionLevel: "M" as const, margin: 1, width: 400, color: { dark: "#0b0b0b", light: "#ffffff" } };

/** A PNG, base64, for an inline email attachment. */
export async function ticketQrPngBase64(slug: string, code: string) {
  const png = await QRCode.toBuffer(ticketLink(slug, code), { ...options, type: "png" });
  return png.toString("base64");
}

/** A data URL for the ticket page. */
export function ticketQrDataUrl(slug: string, code: string) {
  return QRCode.toDataURL(ticketLink(slug, code), options);
}
