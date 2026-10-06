import { currentMobileSession, revokeMobileSession } from "@/lib/mobile/session";
import { json } from "@/lib/mobile/api";

/** Signs this phone out. Other phones and the website stay signed in. */
export async function POST() {
  const session = await currentMobileSession();
  if (session) await revokeMobileSession(session.id);
  return json({ ok: true });
}
