import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PROFESSIONS } from "@/config/rooms";
import { submitFreeListing } from "@/app/directory/actions";

const ERRORS: Record<string, string> = {
  missing: "Please fill in your name, email, and city.",
  profession: "Choose a profession.",
  exists: "We already have a pending or live listing for that email.",
};

export default async function ListPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { submitted, error } = await searchParams;

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-background flex items-center justify-center px-4 py-16">
        <div className="max-w-lg text-center space-y-6 rounded-2xl bg-card border border-border/40 p-10 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Listing received
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Thanks — we&apos;ll review it
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Free listings are checked by Trichollective before they appear. This does not open
            membership, rooms, or Tricho-AI. When you are ready for those, join for £12 a month.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="rounded-full h-11 px-6">
              <Link href="/directory">View the directory</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full h-11 px-6">
              <Link href="/join">Become a member</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const listingProfessions = PROFESSIONS.filter((p) => p.id !== "brand");

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="container mx-auto max-w-xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Free directory listing
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            List your practice
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Be found by people looking for a stylist, trichologist, or doctor. No account and no
            card. This is not membership — rooms, Learn, and Tricho-AI stay with the £12 plan.
          </p>
        </header>

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {ERRORS[error] || "Something went wrong. Please try again."}
          </p>
        )}

        <form
          action={submitFreeListing}
          className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 space-y-5 shadow-sm"
        >
          {[
            { name: "name", label: "Full name", placeholder: "Dr Jane Adeyemi", required: true },
            {
              name: "email",
              label: "Email",
              placeholder: "you@practice.com",
              type: "email",
              required: true,
            },
            { name: "city", label: "City", placeholder: "London", required: true },
            {
              name: "specialization",
              label: "Specialisation",
              placeholder: "Hair loss, scalp health",
            },
            { name: "website", label: "Website", placeholder: "https://" },
            {
              name: "phone",
              label: "Phone (kept private — for our review only)",
              placeholder: "+44",
            },
          ].map((field) => (
            <label key={field.name} className="block space-y-2">
              <span className="text-sm font-medium text-foreground/80">{field.label}</span>
              <input
                name={field.name}
                type={field.type || "text"}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full h-12 px-4 rounded-xl border border-border/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          ))}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground/80">Profession</span>
            <select
              name="profession"
              required
              defaultValue=""
              className="w-full h-12 px-4 rounded-xl border border-border/60 bg-background text-sm outline-none"
            >
              <option value="" disabled>
                Choose one
              </option>
              {listingProfessions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {p.blurb}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground/80">Short bio</span>
            <textarea
              name="bio"
              rows={4}
              placeholder="Who you see, and how you work."
              className="w-full p-4 rounded-xl border border-border/60 bg-background text-sm outline-none resize-y"
            />
          </label>

          <Button type="submit" className="w-full h-12 rounded-full text-sm font-semibold">
            Submit for review
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Want the community and Tricho-AI too?{" "}
          <Link href="/join" className="text-primary underline-offset-4 hover:underline">
            Become a member for £12/month
          </Link>
        </p>
      </div>
    </div>
  );
}
