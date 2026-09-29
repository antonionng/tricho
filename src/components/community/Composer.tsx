import { Button } from "@/components/ui/button";
import { createPost } from "@/app/members/community/actions";
import type { RoomId } from "@/config/rooms";

export function Composer({
  space,
  canPost,
}: {
  space: RoomId;
  canPost: boolean;
}) {
  if (!canPost) {
    return (
      <div className="rounded-2xl border border-border/50 bg-muted/50 p-5 text-sm text-muted-foreground">
        This room is for the professionals who practise here. You can read along, or post in
        Everyone and the Exchange.
      </div>
    );
  }

  return (
    <form
      action={createPost}
      className="rounded-2xl border border-border/50 bg-card p-5 space-y-3 shadow-sm"
    >
      <input type="hidden" name="space" value={space} />
      <p className="text-sm font-medium">Share a case, question, or resource</p>
      <input
        name="title"
        placeholder="Title (optional)"
        className="w-full h-11 px-3 rounded-xl border border-border/60 bg-background text-sm outline-none"
      />
      <select
        name="category"
        defaultValue="discussion"
        className="w-full h-11 px-3 rounded-xl border border-border/60 bg-background text-sm"
      >
        <option value="discussion">Discussion</option>
        <option value="referral">Referral</option>
        <option value="resource">Resource</option>
      </select>
      <textarea
        name="content"
        required
        minLength={2}
        rows={4}
        placeholder="What do you want the room to weigh in on?"
        className="w-full p-3 rounded-xl border border-border/60 bg-background text-sm outline-none resize-y"
      />
      <Button type="submit" className="rounded-2xl h-10 px-6">
        Post
      </Button>
    </form>
  );
}
