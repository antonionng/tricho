import Link from "next/link";
import { Lock } from "lucide-react";
import { canReadRoom, type Room, type RoomId } from "@/config/rooms";
import { cn } from "@/lib/utils";

/** Chips that scroll sideways on mobile, a quiet list on desktop. */
export function SpaceNav({ active, professional, rooms }: { active?: RoomId; professional: boolean; rooms: Room[] }) {
  const items = [{ id: undefined, label: "All spaces" }, ...rooms];
  return (
    <nav aria-label="Spaces">
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
        {items.map((r) => {
          const locked = r.id ? !canReadRoom(r.id, professional, rooms) : false;
          const isActive = active === r.id;
          return (
            <li key={r.id ?? "all"} className="shrink-0">
              <Link
                href={r.id ? `/members/community?space=${r.id}` : "/members/community"}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm transition-colors lg:h-auto lg:rounded-xl lg:border-0 lg:px-3 lg:py-2.5 lg:text-[15px]",
                  isActive
                    ? "border-ink bg-ink text-paper"
                    : "border-rule bg-card text-ink-2 hover:border-ink/40 lg:bg-transparent lg:hover:bg-paper-2",
                  locked && !isActive && "text-muted-foreground"
                )}
              >
                <span className="lg:flex-1">{r.label}</span>
                {locked && <Lock className="h-3.5 w-3.5" aria-label="Professional only" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
