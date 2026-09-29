import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/members/Paywall";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { publishMemberListing } from "@/app/directory/actions";
import { PROFESSIONS } from "@/config/rooms";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login");
  if (!ctx.allowed) {
    return (
      <Paywall title="Your listing" body="A public directory profile is part of membership." />
    );
  }

  const { error } = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    include: { profile: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary uppercase tracking-wide">Public listing</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-sm text-muted-foreground">
          This appears in the directory as a Member listing. Phone stays private.
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          Please choose a profession and city.
        </p>
      )}

      <form
        action={publishMemberListing}
        className="rounded-2xl border border-border/50 bg-card p-6 space-y-4 shadow-sm"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium">Name</span>
          <input
            name="name"
            defaultValue={user.name ?? ""}
            className="w-full h-11 px-3 rounded-xl border border-border/60 bg-background text-sm"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Profession</span>
          <select
            name="profession"
            defaultValue={user.profile?.profession ?? ctx.profession ?? "clinical"}
            className="w-full h-11 px-3 rounded-xl border border-border/60 bg-background text-sm"
          >
            {PROFESSIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">City</span>
          <input
            name="city"
            required
            defaultValue={user.profile?.location ?? ""}
            className="w-full h-11 px-3 rounded-xl border border-border/60 bg-background text-sm"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Specialisation</span>
          <input
            name="specialization"
            defaultValue={user.profile?.specialization ?? ""}
            className="w-full h-11 px-3 rounded-xl border border-border/60 bg-background text-sm"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Website</span>
          <input
            name="website"
            defaultValue={user.profile?.website ?? ""}
            className="w-full h-11 px-3 rounded-xl border border-border/60 bg-background text-sm"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Phone (private)</span>
          <input
            name="phone"
            defaultValue={user.profile?.phone ?? ""}
            className="w-full h-11 px-3 rounded-xl border border-border/60 bg-background text-sm"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Bio</span>
          <textarea
            name="bio"
            rows={5}
            defaultValue={user.profile?.bio ?? ""}
            className="w-full p-3 rounded-xl border border-border/60 bg-background text-sm resize-y"
          />
        </label>
        <Button type="submit" className="w-full rounded-full h-11">
          Publish to the directory
        </Button>
      </form>
    </div>
  );
}
