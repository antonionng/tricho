import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/BrandMark";
import { MEMBERSHIP_PRICE } from "@/config/subscriptions";

export default function HomePage() {
  return (
    <div className="bg-background">
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden border-b border-black/10">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.45), transparent 60%)",
          }}
        />
        <div className="container relative mx-auto px-4 py-16 md:py-20 max-w-5xl text-center space-y-8 md:space-y-10">
          <p className="tricho-caps text-foreground/40 tracking-[0.18em]">
            Cosmetic · Clinical · Medical
          </p>
          <BrandMark as="h1" size="hero" className="justify-center max-w-full" />
          <p className="text-base md:text-xl font-medium text-foreground/55 max-w-2xl mx-auto leading-relaxed">
            Find a hair and scalp professional — or join the private community that meets at the
            Trichollective conference.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="rounded-2xl h-12 px-8 text-base">
              <Link href="/find">I need to find someone</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl h-12 px-8 text-base border-foreground/20 bg-background/60"
            >
              <Link href="/join">I work in hair & scalp — £{MEMBERSHIP_PRICE}/mo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Brand or exhibitor?{" "}
            <Link href="/join#business" className="underline underline-offset-4 hover:opacity-70">
              See Business plans
            </Link>
          </p>
        </div>
      </section>

      <section className="py-20 md:py-28 border-b border-black/10">
        <div className="container mx-auto px-4 max-w-5xl grid md:grid-cols-2 gap-16 md:gap-20">
          <div className="space-y-5">
            <p className="tricho-caps text-foreground/40">For people seeking help</p>
            <h2 className="tricho-title text-4xl md:text-5xl">
              Find the right
              <br />
              kind of professional
            </h2>
            <p className="text-muted-foreground leading-relaxed font-medium">
              Not sure if you need a stylist, a trichologist, or a doctor? A short guide explains
              the difference, then points you to the public directory. Free. No diagnosis.
            </p>
            <Button asChild className="rounded-2xl">
              <Link href="/find">Who should I see?</Link>
            </Button>
          </div>
          <div className="space-y-5">
            <p className="tricho-caps text-foreground/40">For professionals</p>
            <h2 className="tricho-title text-4xl md:text-5xl">
              List for free,
              <br />
              or join the community
            </h2>
            <p className="text-muted-foreground leading-relaxed font-medium">
              Be found in the directory without paying. Or become a member for £{MEMBERSHIP_PRICE}
              /month and get private rooms, Learn, and Tricho-AI.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-2xl border-foreground/20">
                <Link href="/directory/list">List your practice</Link>
              </Button>
              <Button asChild className="rounded-2xl">
                <Link href="/join">Join membership</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-foreground text-primary-foreground">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <p className="tricho-caps opacity-50">Tricho-AI</p>
            <h2 className="tricho-title text-4xl md:text-6xl">
              Clinical support for the people who already practice
            </h2>
            <p className="opacity-60 font-medium">
              Educational decision support for members — not a diagnosis, and not a replacement for
              your judgement.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                who: "Cosmetic",
                what: "Explain what you are seeing in the chair, and when to refer on.",
              },
              {
                who: "Clinical",
                what: "Structure a consult, notice red flags, and draft a client note.",
              },
              {
                who: "Medical",
                what: "Clarify referral pathways and what to ask before sending someone on.",
              },
            ].map((item) => (
              <div
                key={item.who}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3"
              >
                <h3 className="tricho-caps text-sm opacity-80">{item.who}</h3>
                <p className="text-sm opacity-60 leading-relaxed font-medium">{item.what}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button
              asChild
              className="rounded-2xl h-11 px-8 bg-primary-foreground text-foreground hover:bg-white"
            >
              <Link href="/join">Included with membership</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
          <h2 className="tricho-title text-3xl md:text-5xl">
            Built around the conference you already attend
          </h2>
          <p className="text-muted-foreground leading-relaxed font-medium">
            Trichollective is the network that meets in person. This platform is where that same
            mix of stylists, trichologists, doctors, and exhibitors stays connected between events.
          </p>
          <Button asChild variant="outline" className="rounded-2xl border-foreground/20">
            <Link href="/directory">Browse the directory</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
