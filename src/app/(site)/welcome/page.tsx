import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow, Section, SectionHeader } from "@/components/site/primitives";
import { images, img } from "@/content/images";
import { premiumBusiness, tierById } from "@/config/subscriptions";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { paidCheckout } from "@/lib/signin-email";
import { continueToSignIn } from "./actions";

export const metadata = pageMetadata({
  title: "Welcome, and thank you",
  description: "Thank you for joining Trichollective. Sign in with the email you paid with to set up your membership.",
  path: "/welcome",
  noindex: true,
});

const SIGN_IN = "/login?next=/members/onboarding";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; session_id?: string }>;
}) {
  const { plan: planParam, session_id } = await searchParams;
  // Stripe sends people back with the session id, so we can read the email they paid with.
  const paid = session_id ? await paidCheckout(session_id) : null;
  const plan = paid?.plan ?? planParam;
  const premium = plan === premiumBusiness.id;
  const tier = tierById(premium ? "business" : plan);
  // Business customers go straight to the guided setup for their partner page.
  const businessCustomer = premium || plan === "business";
  const signIn = businessCustomer ? "/login?next=/members/business/setup" : SIGN_IN;

  const steps = [
    {
      t: "Sign in with the email you paid with",
      d: "Your account was created from the email address you used at checkout. Enter that address on the sign-in page and we'll email you a sign-in link, or continue with Google if it is a Google address. There is no password to remember.",
    },
    ...(businessCustomer
      ? [
          {
            t: "Make your partner page your own",
            d: premium
              ? "Your partner page is already live. After you sign in, a short guided setup helps you add your logo, describe what you offer and give five of your team Professional membership."
              : "Your partner page is ready for you to finish. After you sign in, a short guided setup helps you add your logo, describe what you offer, give five of your team Professional membership and publish your page.",
          },
        ]
      : []),
    {
      t: "Set up your profile",
      d:
        tier?.id === "professional" || tier?.id === "business" ? (
          <>
            Onboarding takes a few minutes. Tell us your discipline and what you work on, and claim your directory listing. If
            you would like the verified badge, send proof of training or registration from{" "}
            <Link href="/members/profile/verification" className="underline underline-offset-4">
              your verification page
            </Link>{" "}
            and the team will check it by hand.
          </>
        ) : (
          "Onboarding takes a few minutes. Tell us your discipline and what you work on."
        ),
    },
    {
      t: "Choose your chapter",
      d: "Pick the chapter for the country where you practise, so you meet the colleagues you will refer to and hear about local meet-ups first.",
    },
    {
      t: "Come to the welcome session",
      d: `We'll email you the date of the next live welcome session with ${site.founder}. It is a relaxed hour to meet other new members and ask anything you like.`,
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute inset-y-0 right-0 hidden w-[44%] lg:block">
          <Image
            src={img(images.ed23, 1400)}
            alt={images.ed23.alt}
            fill
            priority
            sizes="44vw"
            className="mag-bw object-cover object-top"
          />
          <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-paper to-transparent" />
        </div>
        <Container className="relative">
          <div className="grid py-12 md:py-28 lg:grid-cols-12">
            <div className="flex flex-col gap-6 animate-rise md:gap-8 lg:col-span-7">
              <Eyebrow rule>{premium ? premiumBusiness.name : tier ? `${tier.name} membership` : "Membership"}</Eyebrow>
              <h1 className="display text-[2.6rem] leading-[0.98] sm:text-6xl lg:text-7xl">
                Thank you, your membership
                <br />
                <span className="text-fade">is being set up now.</span>
              </h1>
              <p className="lede max-w-xl">
                Your payment went through, and your account is ready for you to sign in with the email address you paid
                with.
              </p>
              <form action={continueToSignIn.bind(null, paid ? session_id ?? null : null, signIn)} className="flex flex-col gap-4">
                <Button type="submit" size="xl" className="h-14 w-full text-base sm:w-auto sm:self-start">
                  {businessCustomer ? "Sign in to set up your business" : "Sign in to set up your profile"} <ArrowRight />
                </Button>
              </form>
              <div className="flex max-w-xl flex-col gap-3 rounded-2xl border border-rule bg-card p-5 text-[15px] leading-relaxed text-ink-2">
                {paid?.email ? (
                  <p>
                    You paid with <strong className="font-semibold text-ink">{paid.email}</strong>, and we will fill it in for
                    you on the next page.
                  </p>
                ) : (
                  <p>Use the same email address you paid with, which is also the address your Stripe receipt was sent to.</p>
                )}
                <p>We will email you a sign-in link. The link opens your account, so there is no password to set up.</p>
                <p>If the email has not arrived within a couple of minutes, please check your spam or junk folder.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Section tone="paper-2">
        <Container>
          <SectionHeader eyebrow="What happens next" title="Four short steps take you from sign-in" fade="to your first conversation with colleagues." />
          <ol className="mt-12 grid gap-5 md:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s.t} className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-7 md:p-8">
                <p className="label text-muted-foreground">Step {i + 1}</p>
                <h2 className="text-xl font-semibold leading-snug tracking-tight">{s.t}</h2>
                <p className="text-[15px] leading-relaxed text-ink-2">{s.d}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section>
        <Container size="narrow">
          <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-ink-2">
            <h2 className="display text-3xl text-ink">If something isn&apos;t right</h2>
            <p>
              If the sign-in link doesn&apos;t arrive, check your spam folder and make sure you are using the
              same email address you paid with. It can take a minute or two for a new account to be ready.
            </p>
            <p>
              Still stuck? Email{" "}
              <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
                {site.contactEmail}
              </a>{" "}
              and a person will sort it out for you.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
