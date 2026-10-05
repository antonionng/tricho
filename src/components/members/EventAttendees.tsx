import { Avatar } from "@/components/members/Avatar";

export type Attendee = { id: string; name: string | null; image: string | null };

/** "You and 3 others are going." Written as one sentence so it reads well in the card. */
export function goingSentence(count: number, includesYou: boolean) {
  if (count === 0) return "Nobody has said they're going yet, so you could be the first.";
  if (includesYou) {
    const others = count - 1;
    if (others === 0) return "You're the first member going.";
    return `You and ${others} ${others === 1 ? "other member are" : "other members are"} going.`;
  }
  return `${count} ${count === 1 ? "member is" : "members are"} going.`;
}

/** Overlapping faces of the first few attendees, followed by the count. */
export function AttendeeFaces({ attendees, userId, max = 5 }: { attendees: Attendee[]; userId: string; max?: number }) {
  const shown = attendees.slice(0, max);
  const includesYou = attendees.some((a) => a.id === userId);
  return (
    <div className="flex items-center gap-2.5">
      {shown.length > 0 && (
        <span className="flex -space-x-2">
          {shown.map((a) => (
            <Avatar key={a.id} name={a.name} src={a.image} size="sm" className="ring-2 ring-card" />
          ))}
        </span>
      )}
      <span className="text-[13px] text-muted-foreground">{goingSentence(attendees.length, includesYou)}</span>
    </div>
  );
}
