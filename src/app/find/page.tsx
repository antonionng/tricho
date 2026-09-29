import Link from "next/link";
import { Button } from "@/components/ui/button";

const PATHS = [
  {
    title: "A stylist or cosmetic practitioner",
    body: "Best when the concern is about styling, breakage from tension, product use, or everyday scalp comfort — and there is no sudden patchy loss or signs of illness.",
  },
  {
    title: "A trichologist",
    body: "Best for shedding, patterned thinning, scalp conditions, and cases that need a structured consult and possible bloods or referral advice.",
  },
  {
    title: "A doctor",
    body: "Best when there are red flags: sudden patches, scarring, pain, systemic symptoms, paediatric complexity, or anything that may need medical investigation.",
  },
];

export default function FindPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="container mx-auto max-w-3xl space-y-10">
        <header className="space-y-4 text-center">
          <p className="tricho-caps text-foreground/40">Who should I see?</p>
          <h1 className="tricho-title text-4xl md:text-5xl">
            A plain guide before you open the directory
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            This is education and signposting only. It is not a diagnosis. If you are worried or
            something is changing quickly, speak to a GP or urgent care.
          </p>
        </header>

        <div className="space-y-4">
          {PATHS.map((path) => (
            <article
              key={path.title}
              className="rounded-3xl border border-black/10 bg-card/80 p-6 md:p-8 space-y-2"
            >
              <h2 className="text-xl font-bold tracking-tight">{path.title}</h2>
              <p className="text-muted-foreground leading-relaxed font-medium">{path.body}</p>
            </article>
          ))}
        </div>

        <div className="rounded-3xl bg-foreground text-primary-foreground p-8 text-center space-y-4">
          <h2 className="tricho-title text-2xl md:text-3xl">Ready to find someone?</h2>
          <p className="opacity-70 text-sm font-medium">
            The directory shows professionals who have asked to be listed. Members are marked.
          </p>
          <Button
            asChild
            className="rounded-2xl bg-primary-foreground text-foreground hover:bg-white"
          >
            <Link href="/directory">Open the directory</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
