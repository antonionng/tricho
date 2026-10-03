import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DEFAULT_ROOMS } from "@/config/rooms";
import { getAllRoomsForStudio } from "@/lib/rooms";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, Field, Notice, PageHeader, Section, Tag, dateOnly, fieldClass, NoAccess } from "@/components/studio/ui";
import { studioPage } from "../../_lib/guard";
import { archiveRoomAction, createRoomAction, moveRoomAction, saveRoomAction } from "../actions";

export const dynamic = "force-dynamic";

type RoomValues = {
  label: string;
  blurb: string;
  prompt: string;
  professionalOnly: boolean;
  noBrands: boolean;
  aiModeration: boolean;
};

function RoomFields({ room }: { room?: RoomValues }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" hint="Members see this in the list of spaces.">
          <input name="label" defaultValue={room?.label} required maxLength={60} className={fieldClass} />
        </Field>
        <Field label="Composer prompt" hint="Shown in the box where members start a post.">
          <input name="prompt" defaultValue={room?.prompt} maxLength={240} className={fieldClass} />
        </Field>
      </div>
      <Field label="Description" hint="One sentence that tells members what belongs in this room.">
        <textarea name="blurb" defaultValue={room?.blurb} required rows={2} maxLength={240} className={`${fieldClass} resize-y`} />
      </Field>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="professionalOnly" defaultChecked={room?.professionalOnly} className="accent-[var(--ink)]" />
          Only Professional and Business members can read and post
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="noBrands" defaultChecked={room?.noBrands} className="accent-[var(--ink)]" />
          Businesses can read but not post
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="aiModeration" defaultChecked={room?.aiModeration} className="accent-[var(--ink)]" />
          The moderation assistant checks new posts and replies
        </label>
      </div>
    </div>
  );
}

export default async function RoomsPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  if (!(await studioPage("/studio/community/rooms", "community.rooms"))) return <NoAccess what="community rooms" />;
  const { notice, error } = await searchParams;

  const saved = await getAllRoomsForStudio();
  const usingDefaults = saved.length === 0;
  const rooms = usingDefaults
    ? DEFAULT_ROOMS.map((r) => ({
        id: r.id,
        label: r.label,
        blurb: r.blurb,
        prompt: r.prompt,
        professionalOnly: !!r.professionalOnly,
        noBrands: !!r.noBrands,
        aiModeration: !!r.aiModeration,
        archivedAt: null as Date | null,
      }))
    : saved;
  const active = rooms.filter((r) => !r.archivedAt);
  const archived = rooms.filter((r) => r.archivedAt);

  return (
    <div className="space-y-12">
      <PageHeader
        title="Rooms"
        intro="Choose which spaces members see in the community, what each one is for, who can post there, and where the moderation assistant keeps watch."
        actions={
          <Button asChild variant="outline">
            <Link href="/studio/community">Back to moderation</Link>
          </Button>
        }
      />

      {notice && <Notice>{notice}</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}
      {usingDefaults && (
        <Notice>The community is using the built-in rooms. Your first change will save them so you can edit them here.</Notice>
      )}

      <Section title={`Open rooms (${active.length})`} intro="Rooms appear to members in this order. Changes show in the community straight away.">
        {active.length === 0 ? (
          <Empty>There are no open rooms, so members cannot post anywhere until you add or restore one.</Empty>
        ) : (
          <div className="space-y-4">
            {active.map((room, index) => (
              <Card key={room.id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{room.label}</p>
                    <span className="text-xs text-muted-foreground">/{room.id}</span>
                    {room.professionalOnly && <Tag>Professional only</Tag>}
                    {room.noBrands && <Tag>No business posts</Tag>}
                    {room.aiModeration && <Tag tone="ink">Moderation assistant on</Tag>}
                  </div>
                  <div className="flex items-center gap-1">
                    <form action={moveRoomAction}>
                      <input type="hidden" name="id" value={room.id} />
                      <input type="hidden" name="direction" value="up" />
                      <Button type="submit" size="xs" variant="ghost" disabled={index === 0} aria-label={`Move ${room.label} up`}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                    <form action={moveRoomAction}>
                      <input type="hidden" name="id" value={room.id} />
                      <input type="hidden" name="direction" value="down" />
                      <Button
                        type="submit"
                        size="xs"
                        variant="ghost"
                        disabled={index === active.length - 1}
                        aria-label={`Move ${room.label} down`}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                </div>
                <form action={saveRoomAction} className="space-y-4">
                  <input type="hidden" name="id" value={room.id} />
                  <RoomFields room={room} />
                  <div className="flex flex-wrap items-center gap-2">
                    <SubmitButton size="sm" pendingLabel="Saving…">
                      Save changes
                    </SubmitButton>
                  </div>
                </form>
                {room.id !== "lounge" && (
                  <form action={archiveRoomAction} className="border-t border-rule pt-3">
                    <input type="hidden" name="id" value={room.id} />
                    <input type="hidden" name="archive" value="yes" />
                    <SubmitButton size="xs" variant="outline" pendingLabel="Archiving…">
                      Archive this room
                    </SubmitButton>
                    <span className="ml-3 text-xs text-muted-foreground">
                      Archiving hides the room from members and stops new posts, but its existing posts stay readable.
                    </span>
                  </form>
                )}
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Add a room" intro="The room's web address is made from its name and cannot be changed later.">
        <Card>
          <form action={createRoomAction} className="space-y-4">
            <RoomFields />
            <SubmitButton size="sm" pendingLabel="Creating…">
              Create room
            </SubmitButton>
          </form>
        </Card>
      </Section>

      <Section title={`Archived rooms (${archived.length})`} intro="Restoring a room puts it back at its old place in the list and opens it to new posts.">
        {archived.length === 0 ? (
          <Empty>No rooms have been archived.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {archived.map((room) => (
              <li key={room.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-ink">{room.label}</p>
                  <p className="text-xs text-muted-foreground">
                    /{room.id} · archived {dateOnly(room.archivedAt)}
                  </p>
                </div>
                <form action={archiveRoomAction}>
                  <input type="hidden" name="id" value={room.id} />
                  <input type="hidden" name="archive" value="no" />
                  <SubmitButton size="xs" variant="outline" pendingLabel="Restoring…">
                    Restore
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
