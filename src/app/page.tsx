import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { MEMBERSHIP_PRICE } from "@/config/subscriptions";

export default function HomePage() {
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e7efe9_0%,_transparent_55%)]" />
        <div className="container relative mx-auto px-4 py-20 md:py-28 max-w-4xl text-center space-y-8">
          <p className="text-sm font-medium text-primary uppercase tracking-wide">
            Cosmetic · Clinical · Medical
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.05]">
            The year-round home of the Trichollective network
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Find a hair and scalp professional. Or join the private community that meets at the
            Trichollective conference — with rooms, education, and Tricho-AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="rounded-full h-12 px-8 text-base">
              <Link href="/find">
                I need to find someone <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full h-12 px-8 text-base bg-card"
            >
              <Link href="/join">I work in hair & scalp — £{MEMBERSHIP_PRICE}/mo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Brand or exhibitor?{" "}
            <Link href="/join#business" className="text-primary hover:underline">
              See Business plans
            </Link>
          </p>
        </div>
      </section>

      <section className="py-20 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-border/50 bg-card p-8 md:p-10 space-y-4 shadow-sm">
              <p className="text-sm font-medium text-primary">For people seeking help</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Find the right kind of professional
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Not sure if you need a stylist, a trichologist, or a doctor? A short guide explains
                the difference, then points you to the public directory. Free. No diagnosis.
              </p>
              <Button asChild className="rounded-full">
                <Link href="/find">Who should I see?</Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card p-8 md:p-10 space-y-4 shadow-sm">
              <p className="text-sm font-medium text-primary">For professionals</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                List for free, or join the community
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Be found in the directory without paying. Or become a member for £{MEMBERSHIP_PRICE}
                /month and get private rooms, Learn, and Tricho-AI.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/directory/list">List your practice</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/join">Join membership</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-border/40 bg-card/40">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="text-sm font-medium text-primary uppercase tracking-wide">Tricho-AI</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
              Clinical support for the people who already practice
            </h2>
            <p className="text-muted-foreground">
              Educational decision support for members — not a diagnosis, and not a replacement for
              your judgement.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
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
                className="rounded-2xl border border-border/50 bg-background p-6 space-y-3"
              >
                <h3 className="font-semibold text-lg">{item.who}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.what}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button asChild className="rounded-full h-11 px-8">
              <Link href="/join">Included with membership</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Built around the conference you already attend
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Trichollective is the network that meets in person. This platform is where that same
            mix of stylists, trichologists, doctors, and exhibitors stays connected between events.
          </p>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/directory">Browse the directory</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
