import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, BadgeCheck, Globe, MapPin, MessageCircle, Phone } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { Avatar } from "@/components/members/Avatar";
import { EmptyState, MemberPage, SectionLabel } from "@/components/members/MemberPage";
import { FollowButton } from "@/components/members/FollowButton";
import { SubmitButton } from "@/components/members/SubmitButton";
import { PostCard } from "@/components/community/PostCard";
import { getMemberContext } from "@/lib/member";
import { getPosts } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { professionById } from "@/config/rooms";
import { urlForFile } from "@/lib/storage";
import { SOCIAL_KEYS, SOCIAL_NETWORKS, membershipLabel, readQualifications, readSocials } from "@/lib/profile";
import { startConversation } from "../actions";

export const metadata = { title: "People" };

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/people");
  if (!ctx.allowed) return <Paywall title="People" body="Member profiles and messages are part of membership." />;
  const me = ctx.session.user.id;

  const { id } = await params;
  const person = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      isFounding: true,
      chapter: { select: { slug: true, city: true } },
      profile: {
        select: {
          profession: true,
          specialization: true,
          bio: true,
          location: true,
          photoFileId: true,
          headline: true,
          practiceName: true,
          city: true,
          country: true,
          specialisms: true,
          services: true,
          qualifications: true,
          memberships: true,
          yearsInPractice: true,
          website: true,
          socials: true,
          phone: true,
          showPhone: true,
          addressLine1: true,
          addressLine2: true,
          postcode: true,
          showAddress: true,
          isVerified: true,
        },
      },
      listings: {
        where: { status: "listed", slug: { not: null } },
        select: { slug: true, headline: true, photoUrl: true, isVerified: true },
        take: 1,
      },
      _count: { select: { followers: true, following: true } },
    },
  });
  if (!person) notFound();

  const [isFollowing, posts, uploadedPhoto] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followeeId: { followerId: me, followeeId: id } } }),
    getPosts({ userId: me, professional: ctx.professional, authorId: id, take: 10 }),
    urlForFile(person.profile?.photoFileId),
  ]);
  const listing = person.listings[0];
  const discipline = person.profile?.profession ? professionById(person.profile.profession) : null;
  const isMe = me === id;
  const profile = person.profile;
  const headline = profile?.headline || listing?.headline;
  const place = [profile?.city || profile?.location, profile?.country].filter(Boolean).join(", ");
  const qualifications = readQualifications(profile?.qualifications);
  const socials = readSocials(profile?.socials);
  const socialLinks = SOCIAL_KEYS.filter((k) => socials[k]).map((k) => ({ key: k, url: socials[k]!, label: SOCIAL_NETWORKS[k].label }));
  const address = profile?.showAddress
    ? [profile.addressLine1, profile.addressLine2, profile.city, profile.postcode].filter(Boolean).join(", ")
    : null;
  const verified = !!profile?.isVerified || !!listing?.isVerified;

  return (
    <MemberPage size="narrow">
      <section className="rounded-3xl border border-rule bg-card p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <Avatar name={person.name} src={[uploadedPhoto, listing?.photoUrl, person.image]} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="display flex items-center gap-2 text-3xl sm:text-4xl">
              {person.name || "Member"}
              {verified && <BadgeCheck className="h-6 w-6 shrink-0 text-positive" aria-label="Verified" />}
            </h1>
            {headline && <p className="mt-2 text-[15px] text-ink-2">{headline}</p>}
            {(profile?.practiceName || place) && (
              <p className="mt-1 text-sm text-muted-foreground">{[profile?.practiceName, place].filter(Boolean).join(" · ")}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {discipline && <Pill>{discipline.label}</Pill>}
              {person.isFounding && <Pill tone="ink">Founding member</Pill>}
              {person.chapter && (
                <Link href={`/members/chapters/${person.chapter.slug}`}>
                  <Pill className="hover:border-ink/40">
                    <MapPin className="h-3 w-3" /> {person.chapter.city}
                  </Pill>
                </Link>
              )}
            </div>
          </div>
        </div>

        {profile?.bio && <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{profile.bio}</p>}

        <dl className="mt-5 flex flex-col gap-4 text-[15px]">
          {(profile?.specialisms.length ? profile.specialisms : profile?.specialization ? [profile.specialization] : []).length > 0 && (
            <Detail label="Specialisms">
              <Chips items={profile!.specialisms.length ? profile!.specialisms : [profile!.specialization!]} />
            </Detail>
          )}
          {!!profile?.services.length && (
            <Detail label="Services">
              <Chips items={profile.services} />
            </Detail>
          )}
          {profile?.yearsInPractice != null && profile.yearsInPractice > 0 && (
            <Detail label="Experience">
              {profile.yearsInPractice} {profile.yearsInPractice === 1 ? "year" : "years"} in practice
            </Detail>
          )}
          {qualifications.length > 0 && (
            <Detail label="Qualifications">
              <ul className="flex flex-col gap-1">
                {qualifications.map((q, i) => (
                  <li key={i}>
                    {q.title}
                    {q.body ? `, ${q.body}` : ""}
                    {q.year ? <span className="text-muted-foreground"> ({q.year})</span> : null}
                  </li>
                ))}
              </ul>
            </Detail>
          )}
          {!!profile?.memberships.length && (
            <Detail label="Memberships">{profile.memberships.map(membershipLabel).join(", ")}</Detail>
          )}
          {(profile?.website || socialLinks.length > 0 || (profile?.showPhone && profile.phone) || address) && (
            <Detail label="Contact">
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-ink-2">
                {profile?.website && (
                  <a href={profile.website} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-1.5 underline underline-offset-4">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                )}
                {socialLinks.map((s) => (
                  <a key={s.key} href={s.url} target="_blank" rel="noopener nofollow" className="underline underline-offset-4">
                    {s.label}
                  </a>
                ))}
                {profile?.showPhone && profile.phone && (
                  <a href={`tel:${profile.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 underline underline-offset-4">
                    <Phone className="h-4 w-4" /> {profile.phone}
                  </a>
                )}
              </div>
              {address && <p className="mt-1.5 text-ink-2">{address}</p>}
            </Detail>
          )}
        </dl>

        <p className="mt-5 text-sm text-muted-foreground">
          {person._count.followers} {person._count.followers === 1 ? "follower" : "followers"} · following {person._count.following}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {isMe ? (
            <Link href="/members/profile" className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-medium text-paper">
              Edit your profile
            </Link>
          ) : (
            <>
              <FollowButton userId={person.id} following={!!isFollowing} size="lg" />
              <form action={startConversation}>
                <input type="hidden" name="userId" value={person.id} />
                <SubmitButton variant="outline" pending="Opening…">
                  <MessageCircle className="h-4 w-4" /> Message
                </SubmitButton>
              </form>
            </>
          )}
          {listing?.slug && (
            <Link
              href={`/directory/p/${listing.slug}`}
              className="inline-flex h-12 items-center gap-1.5 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-2"
            >
              Public profile <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel>Recent posts</SectionLabel>
        {posts.length === 0 ? (
          <EmptyState
            title={isMe ? "You haven't posted yet" : `${(person.name || "This member").split(" ")[0]} hasn't posted yet`}
            body={isMe ? "Introductions is a good place to start." : "Their posts will appear here when they do."}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>
    </MemberPage>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <li key={i} className="rounded-full border border-rule bg-paper-2 px-3 py-1 text-sm">
          {i}
        </li>
      ))}
    </ul>
  );
}
