import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/site/primitives";
import { auth } from "@/auth";
import { isEmailList, verifyUnsubscribeToken, type EmailList } from "@/lib/mail/send";
import { pageMetadata } from "@/lib/seo";
import { confirmUnsubscribe } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Unsubscribe",
  description: "Choose which emails you receive from Trichollective.",
  path: "/email/unsubscribe",
  noindex: true,
});

const LISTS: Record<EmailList, { name: string; explain: string; done: string }> = {
  updates: {
    name: "news and new releases",
    explain:
      "This stops the monthly newsletter and the emails announcing new Trichozette editions, courses and events. Emails about your account, bookings and payments will still arrive.",
    done: "You won't receive the newsletter or announcements of new editions, courses and events any more.",
  },
  activity: {
    name: "replies and messages",
    explain:
      "This stops the emails telling you about replies to your posts and new private messages. You will still see them in the app, under notifications.",
    done: "You won't receive emails about replies and messages any more. You'll still see them in the app.",
  },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; l?: string; t?: string; done?: string }>;
}) {
  const { e = "", l = "", t = "", done } = await searchParams;
  const email = e.toLowerCase();
  const valid = !!email && isEmailList(l) && verifyUnsubscribeToken(email, l, t);
  const session = await auth();
  const signedIn = !!session?.user?.id;
  const manage = signedIn ? "/members/profile#emails" : `/login?next=${encodeURIComponent("/members/profile#emails")}`;

  return (
    <section className="bg-paper">
      <Container size="narrow">
        <div className="flex flex-col gap-7 py-20 md:py-28">
          <Eyebrow rule>Your emails</Eyebrow>

          {!valid ? (
            <>
              <h1 className="display text-4xl sm:text-5xl">This unsubscribe link has expired or isn&apos;t complete.</h1>
              <p className="lede max-w-xl">
                Please use the link at the bottom of the latest email you received from us, or sign in and choose which
                emails you receive in your profile.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={manage}>{signedIn ? "Manage your emails" : "Sign in to manage your emails"}</Link>
                </Button>
              </div>
            </>
          ) : done ? (
            <>
              <h1 className="display text-4xl sm:text-5xl">You&apos;re unsubscribed from {LISTS[l].name}.</h1>
              <p className="lede max-w-xl">{LISTS[l].done}</p>
              <p className="text-sm text-muted-foreground">This applies to {email}.</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" variant={signedIn ? "default" : "outline"}>
                  <Link href={manage}>{signedIn ? "Change your email preferences" : "Sign in to change your mind"}</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/">Back to Trichollective</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="display text-4xl sm:text-5xl">Stop emails about {LISTS[l].name}?</h1>
              <p className="lede max-w-xl">{LISTS[l].explain}</p>
              <p className="text-sm text-muted-foreground">This applies to {email}.</p>
              <form action={confirmUnsubscribe} className="flex flex-wrap gap-3">
                <input type="hidden" name="e" value={email} />
                <input type="hidden" name="l" value={l} />
                <input type="hidden" name="t" value={t} />
                <Button type="submit" size="lg">
                  Unsubscribe
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/">Keep receiving them</Link>
                </Button>
              </form>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
