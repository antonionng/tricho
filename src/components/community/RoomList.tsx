import Link from "next/link";
import { ROOMS, type RoomId } from "@/config/rooms";
import { cn } from "@/lib/utils";

export function RoomList({ active }: { active?: RoomId }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-2 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-2">
        Rooms
      </p>
      {ROOMS.map((room) => (
        <Link
          key={room.id}
          href={`/members/community?space=${room.id}`}
          className={cn(
            "block rounded-xl px-3 py-2.5 transition-colors",
            active === room.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"
          )}
        >
          <span className="text-sm font-medium block">{room.label}</span>
          <span className="text-xs text-muted-foreground line-clamp-2">{room.blurb}</span>
        </Link>
      ))}
    </div>
  );
}
