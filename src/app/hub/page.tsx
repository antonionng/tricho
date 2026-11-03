import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { getAllPosts } from "@/lib/blog";
import { guides } from "@/content/guides";
import { prisma } from "@/lib/prisma";
import { requireConsumer } from "@/lib/consumer-session";
import { consumerPublicName } from "@/lib/consumer";
import { FEED_KIND_LABEL, hubFeed } from "@/lib/hub-feed";
import { HUB_LABEL } from "@/config/consumer";

export default async function HubHome() {
  const me = await requireConsumer();
  const [posts, pieces, saved] = await Promise.all([
    getAllPosts(),
    prisma.educationPiece
      .findMany({ where: { published: true, audience: "public" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] })
      .catch(() => []),
    prisma.savedListing.count({ where: { userId: me.userId } }),
  ]);
  const feed = hubFeed({ posts, guides, pieces });
  const first = me.user.name?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="label text-ink-2">{HUB_LABEL}</p>
        <h1 className="display text-4xl leading-tight sm:text-5xl">
          {first ? `Welcome back, ${first}.` : "Welcome back."} Here is reading our team has chosen for you.
        </h1>
        <p className="lede max-w-2xl">
          Everything here is written for the public and checked by our editorial team. Other people on Trichollective see you as{" "}
          <strong className="font-semibold text-ink">{consumerPublicName(me.profile, me.user)}</strong>, and you can change that in your profile.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/directory" className="group rounded-3xl border border-rule bg-card p-6 hover:border-ink">
          <h2 className="text-lg font-semibold text-ink">Find a professional near you.</h2>
          <p className="mt-2 text-[15px] text-ink-2">
            Search the directory of trichologists, head spa and scalp specialists, and medical professionals.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink">
            Search the directory <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link href={saved ? "/hub/saved" : "/find"} className="group rounded-3xl border border-rule bg-card p-6 hover:border-ink">
          <h2 className="text-lg font-semibold text-ink">
            {saved ? `You have saved ${saved === 1 ? "one professional" : `${saved} professionals`}.` : "Not sure who to see?"}
          </h2>
          <p className="mt-2 text-[15px] text-ink-2">
            {saved
              ? "Come back to them whenever you are ready to get in touch."
              : "Answer three short questions and we will suggest the right kind of professional."}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink">
            {saved ? "See your saved professionals" : "Answer the questions"}{" "}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>

      <section className="space-y-5">
        <h2 className="display text-3xl">Reading for you</h2>
        {feed.length === 0 ? (
          <p className="text-[15px] text-ink-2">Our team is preparing reading for you, and it will appear here soon.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {feed.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex h-full flex-col gap-3 rounded-3xl border border-rule bg-card p-6 hover:border-ink">
                  <Pill className="self-start">{FEED_KIND_LABEL[item.kind]}</Pill>
                  <h3 className="text-lg font-semibold leading-snug text-ink">{item.title}</h3>
                  <p className="text-[15px] leading-relaxed text-ink-2">{item.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
