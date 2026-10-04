import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fileUrl } from "@/lib/files";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Empty, NoAccess, PageHeader, Section, dateOnly } from "@/components/studio/ui";
import { studioPage } from "../_lib/guard";
import { removeCoverAction, removePhotoAction } from "./actions";

export const dynamic = "force-dynamic";

/** Every photo members and partners have added to their public pages, newest first, so the team can take one down. */
export default async function PhotosPage() {
  if (!(await studioPage("/studio/photos", "listings.view"))) return <NoAccess what="photos" />;

  const [photos, partnerCovers, memberCovers] = await Promise.all([
    prisma.profilePhoto.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        partner: { select: { name: true, slug: true } },
        user: { select: { name: true, listings: { select: { slug: true }, take: 1, orderBy: { createdAt: "desc" } } } },
      },
    }),
    prisma.partner.findMany({ where: { coverUrl: { not: null } }, select: { id: true, name: true, slug: true, coverUrl: true }, orderBy: { updatedAt: "desc" }, take: 60 }),
    prisma.trichologistProfile.findMany({
      where: { coverFileId: { not: null } },
      select: { userId: true, coverFileId: true, user: { select: { name: true, listings: { select: { slug: true }, take: 1 } } } },
      orderBy: { updatedAt: "desc" },
      take: 60,
    }),
  ]);
  const coverFiles = await prisma.storedFile.findMany({
    where: { id: { in: memberCovers.map((c) => c.coverFileId!) } },
    select: { id: true, driver: true, bucket: true, path: true, isPublic: true },
  });
  const coverUrl = new Map(coverFiles.map((f) => [f.id, fileUrl(f)]));

  const covers = [
    ...partnerCovers.map((p) => ({ key: `p-${p.id}`, url: p.coverUrl!, name: p.name, href: `/partners/${p.slug}`, field: { partnerId: p.id } })),
    ...memberCovers.flatMap((m) => {
      const url = coverUrl.get(m.coverFileId!);
      const slug = m.user.listings[0]?.slug;
      return url ? [{ key: `u-${m.userId}`, url, name: m.user.name ?? "Member", href: slug ? `/directory/p/${slug}` : null, field: { userId: m.userId } }] : [];
    }),
  ];

  return (
    <div className="space-y-12">
      <PageHeader
        title="Photos"
        intro="Every gallery and cover photo on partner pages and member profiles. Removing one takes it off the public page straight away, deletes the file and is recorded in the audit log."
      />

      <Section title={`Gallery photos (${photos.length})`}>
        {photos.length === 0 ? (
          <Empty>No one has added gallery photos yet.</Empty>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {photos.map((p) => {
              const name = p.partner?.name ?? p.user?.name ?? "Unknown";
              const href = p.partner ? `/partners/${p.partner.slug}` : p.user?.listings[0]?.slug ? `/directory/p/${p.user.listings[0].slug}` : null;
              return (
                <li key={p.id} className="flex flex-col gap-2 rounded-2xl border border-rule bg-card p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption ?? ""} className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
                  <p className="text-sm font-medium">
                    {href ? <Link href={href} className="hover:underline">{name}</Link> : name}
                    <span className="font-normal text-muted-foreground"> · {p.partner ? "Partner" : "Member"} · {dateOnly(p.createdAt)}</span>
                  </p>
                  {p.caption && <p className="text-xs text-muted-foreground">{p.caption}</p>}
                  <form action={removePhotoAction} className="mt-auto">
                    <input type="hidden" name="id" value={p.id} />
                    <SubmitButton variant="outline" size="sm" pendingLabel="Removing…">Remove photo</SubmitButton>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={`Cover photos (${covers.length})`}>
        {covers.length === 0 ? (
          <Empty>No one has added a cover photo yet.</Empty>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {covers.map((c) => (
              <li key={c.key} className="flex flex-col gap-2 rounded-2xl border border-rule bg-card p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.url} alt="" className="aspect-[21/9] w-full rounded-xl object-cover" loading="lazy" />
                <p className="text-sm font-medium">{c.href ? <Link href={c.href} className="hover:underline">{c.name}</Link> : c.name}</p>
                <form action={removeCoverAction}>
                  {Object.entries(c.field).map(([k, v]) => (
                    <input key={k} type="hidden" name={k} value={v} />
                  ))}
                  <SubmitButton variant="outline" size="sm" pendingLabel="Removing…">Remove cover</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
