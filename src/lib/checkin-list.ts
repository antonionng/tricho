/**
 * The door list as the check-in page sees it. Pure, so the phone can sort and
 * search the preloaded list without asking the server.
 */

export type CheckInPerson = {
  id: string;
  name: string;
  email: string;
  code: string;
  ticketType: string | null;
  dietary: string | null;
  accessNeeds: string | null;
  checkedInAt: string | null;
};

export type CheckInResult =
  | { status: "checked_in"; person: CheckInPerson }
  | { status: "already"; person: CheckInPerson; at: string }
  | { status: "cancelled"; person: CheckInPerson }
  | { status: "unpaid"; person: CheckInPerson }
  | { status: "other_event"; eventTitle: string }
  | { status: "not_found" };

/** Sort by surname, then first name, the way a printed door list is read. */
export function bySurname(a: { name: string }, b: { name: string }) {
  const key = (n: string) => {
    const parts = n.trim().split(/\s+/);
    return `${parts.at(-1)} ${parts.slice(0, -1).join(" ")}`.toLocaleLowerCase("en-GB");
  };
  return key(a.name).localeCompare(key(b.name), "en-GB");
}

/** Whether a person matches what was typed in the search box: name, email or the start of their code. */
export function matchesSearch(p: Pick<CheckInPerson, "name" | "email" | "code">, query: string) {
  const q = query.trim().toLocaleLowerCase("en-GB");
  if (!q) return true;
  const plain = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("en-GB");
  return plain(p.name).includes(plain(q)) || p.email.toLowerCase().includes(q) || p.code.toLowerCase().startsWith(q);
}
