import { images } from "@/content/images";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { submitFreeListing } from "@/lib/actions/directory";
import { DISCIPLINES } from "@/content/disciplines";
import { LISTING_COUNTRIES } from "@/content/chapters";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import { pageMetadata } from "@/lib/seo";
import { SourceField } from "@/components/site/SourceCapture";

export const metadata = pageMetadata({
  title: "Add your founding listing",
  description: `Be found by people searching for a trichologist, doctor or scalp specialist near them. List free in the Trichollective founding directory for ${FREE_LISTING_DAYS} days, with no card needed.`,
  path: "/directory/list",
    og: { title: "Be found by people searching near you,", sub: "with a free listing for 90 days.", eyebrow: "The founding directory", img: images.heroPortrait.src, variant: "photo" },
});

const ERRORS: Record<string, string> = {
  missing: "Please add your name, email and town or city.",
  profession: "Please choose your discipline.",
  exists: "We already have a listing for that email address. Check your inbox, or get in touch and we'll help.",
};

const field =
  "w-full h-12 rounded-xl border border-input bg-card px-4 text-base outline-none transition-colors focus:border-ink";

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { submitted, error } = await searchParams;

  if (submitted) {
    return (
      <Container size="narrow" className="py-24 md:py-32">
        <p className="label text-muted-foreground">Listing received</p>
        <h1 className="display mt-5 text-5xl md:text-6xl">
          Thank you, we&apos;ll check your listing
          <br />
          <span className="text-fade">and email you when it goes live.</span>
        </h1>
        <p className="lede mt-6">
          A member of the team checks every listing by hand, usually within two working days. We&apos;ll
          email you when yours is live. Your {FREE_LISTING_DAYS} free days start then.
        </p>
        <div className="mt-10 rounded-3xl border border-rule bg-card p-6 md:p-8">
          <p className="font-semibold">Want more than a basic listing?</p>
          <p className="mt-2 text-ink-2">
            With the Professional plan your listing becomes a full profile with your photo, services and
            website. Enquiries from the public come straight to you, and you join the community.
          </p>
          <Button asChild className="mt-6">
            <Link href="/pricing#professional">See the Professional plan <ArrowRight /></Link>
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16 md:py-24">
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col gap-6">
          <p className="label text-muted-foreground">The founding directory</p>
          <h1 className="display text-5xl md:text-6xl">
            Be found by people searching near you,
            <br />
            <span className="text-fade">with a free listing for {FREE_LISTING_DAYS} days.</span>
          </h1>
          <p className="lede">
            Add a basic listing so people looking for a trichologist, doctor, head spa therapist or stylist in
            your area can find you. It takes two minutes and there&apos;s no card.
          </p>
          <ul className="flex flex-col gap-3 border-t border-rule pt-6">
            {[
              "Your name, discipline, town and specialism, checked by a person",
              "The founding badge, which you keep if you stay on",
              "A reminder before your free period ends, so nothing is a surprise",
            ].map((t) => (
              <li key={t} className="flex gap-3 text-[15px] text-ink-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" /> {t}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            After {FREE_LISTING_DAYS} days, the Professional plan keeps you listed and adds your full profile and
            enquiries. If you don&apos;t choose a plan, your listing is simply hidden.
          </p>
        </div>

        <div className="lg:col-span-7">
          <form action={submitFreeListing} className="flex flex-col gap-5 rounded-3xl border border-rule bg-card p-6 md:p-10">
            <SourceField />
            {error && (
              <p role="alert" className="rounded-xl bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {ERRORS[error] ?? "Something went wrong. Please try again."}
              </p>
            )}

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-sm font-medium">Your discipline</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {DISCIPLINES.map((d) => (
                  <label
                    key={d.id}
                    className="flex cursor-pointer flex-col gap-1 rounded-2xl border border-rule p-4 transition-colors has-[:checked]:border-ink has-[:checked]:bg-paper"
                  >
                    <input type="radio" name="profession" value={d.id} required className="sr-only" />
                    <span className="font-medium">{d.name}</span>
                    <span className="text-xs leading-snug text-muted-foreground">{d.who}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Full name, as clients know you</span>
                <input name="name" required autoComplete="name" className={field} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Email</span>
                <input name="email" type="email" required autoComplete="email" className={field} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Town or city</span>
                <input name="city" required autoComplete="address-level2" placeholder="Dublin" className={field} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Country</span>
                <select name="country" defaultValue="Ireland" className={field}>
                  {LISTING_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c === "Europe" ? "Elsewhere in Europe" : c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Specialism</span>
                <input name="specialization" placeholder="Japanese head spa, hair loss…" className={field} />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                Phone <span className="font-normal text-muted-foreground">(private, only for our check)</span>
              </span>
              <input name="phone" type="tel" autoComplete="tel" className={field} />
            </label>

            <Button type="submit" size="lg" className="mt-2">
              Add my founding listing <ArrowRight />
            </Button>
            <p className="text-xs text-muted-foreground">
              By adding a listing you agree to our <Link href="/terms" className="underline">terms</Link> and{" "}
              <Link href="/privacy" className="underline">privacy policy</Link>.
            </p>
          </form>
        </div>
      </div>
    </Container>
  );
}
