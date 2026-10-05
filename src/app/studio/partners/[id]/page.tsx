import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Notice, NoAccess, Tag } from "@/components/studio/ui";
import { PhotoManager } from "@/components/forms/PhotoManager";
import { ShowcaseFields } from "@/components/partners/ShowcaseFields";
import { ShowcaseProfile } from "@/components/partners/ShowcaseProfile";
import { partnerTierLabel } from "@/lib/partners";
import { listPhotos } from "@/lib/photos";
import { partnerAllowance, readOfferings, readSections } from "@/lib/showcase";
import { isShowcaseStep, SHOWCASE_STEPS } from "@/lib/showcase-save";
import { socialLinks } from "@/lib/business-profile";
import { cn } from "@/lib/utils";
import { studioPage } from "../../_lib/guard";
import { saveShowcaseStudioAction, setPartnerPublishedAction } from "../actions";

export const dynamic = "force-dynamic";

/**
 * The Studio's page editor: the same steps a business sees in its portal, for any partner page,
 * so the team can build a page for a brand, a charity or a gifted Premium listing without code.
 */
export default async function StudioPartnerEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string; notice?: string; tone?: string }>;
}) {
  const { id } = await params;
  if (!(await studioPage(`/studio/partners/${id}`, "partners.manage"))) return <NoAccess what="partner pages" />;
  const sp = await searchParams;

  const page = await prisma.partner.findUnique({ where: { id }, include: { organisation: { select: { socials: true } } } });
  if (!page) notFound();
  const photos = await listPhotos({ partnerId: id });
  const allow = partnerAllowance(page);
  const step = isShowcaseStep(sp.step) ? sp.step : sp.step === "preview" ? "preview" : "logo";

  const done: Record<string, boolean> = {
    logo: !!page.logoUrl && !!page.coverUrl,
    story: !!page.tagline && !!page.story,
    offerings: readOfferings(page.offerings).length > 0,
    photos: photos.length > 0,
    extras: !!page.videoUrl || readSections(page.sections).length > 0,
    preview: page.published,
  };
  const steps = [...SHOWCASE_STEPS, { id: "preview", label: "Preview and publish" } as const];
  const kindLabel = page.kind === "charity" ? "Charity" : page.kind === "gifted" ? "Gifted Premium" : partnerTierLabel(page.tier, page.kind);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Link href="/studio/partners" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> All partners
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{page.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Tag tone="ink">{kindLabel}</Tag>
              <Tag>{page.category}</Tag>
              {page.hidden ? <Tag tone="warn">Paused</Tag> : page.published ? <Tag tone="positive">Live</Tag> : <Tag tone="warn">Not published</Tag>}
              {page.ownerEmail ? <Tag>Managed by {page.ownerEmail}</Tag> : <Tag>No owner yet</Tag>}
            </div>
            <p className="text-sm text-muted-foreground">
              This page can show up to {allow.photos} photos, {allow.offerings} products or services, {allow.highlights} headline numbers and{" "}
              {allow.sections} feature {allow.sections === 1 ? "section" : "sections"}
              {allow.video ? ", and a video" : ""}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/studio/partners?edit=${page.id}`}>Basic details</Link>
            </Button>
            {page.published && (
              <Button asChild variant="outline">
                <Link href={`/partners/${page.slug}`} target="_blank">
                  View live page <ArrowUpRight />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      <nav aria-label="Page editor steps">
        <ol className="flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <li key={s.id}>
              <Link
                href={`/studio/partners/${page.id}?step=${s.id}`}
                aria-current={s.id === step ? "step" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm",
                  s.id === step ? "border-ink bg-ink text-paper" : "border-rule bg-card hover:border-ink/40"
                )}
              >
                {done[s.id] ? <Check className="h-3.5 w-3.5" aria-label="Done" /> : <span aria-hidden>{i + 1}</span>}
                {s.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      {step === "preview" ? (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-rule bg-paper shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-rule bg-paper-2 px-4 py-2.5 text-xs text-muted-foreground">
              <span className="truncate">trichollective.net/partners/{page.slug}</span>
              <span className="shrink-0">{page.published ? "Live now" : "Preview"}</span>
            </div>
            <div className="max-h-[75vh] overflow-y-auto">
              <ShowcaseProfile
                partner={page}
                photos={photos.map((p) => ({ src: p.url, caption: p.caption }))}
                socials={socialLinks(page.organisation?.socials)}
                preview
              />
            </div>
          </div>
          <form action={setPartnerPublishedAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="id" value={page.id} />
            <input type="hidden" name="publish" value={page.published ? "0" : "1"} />
            <SubmitButton variant={page.published ? "outline" : "default"} pendingLabel="Saving…">
              {page.published ? "Hide this page" : "Publish this page"}
            </SubmitButton>
            <p className="text-sm text-muted-foreground">
              {page.published
                ? "The page is live. Hiding it takes it off the website straight away."
                : page.kind === "gifted"
                  ? "Publishing makes the page live and findable in directory search. It won't appear on the homepage or the partners page."
                  : "Publishing makes the page live on the website straight away."}
            </p>
          </form>
        </div>
      ) : step === "photos" ? (
        <div className="max-w-3xl rounded-2xl border border-rule bg-card p-5 sm:p-6">
          <PhotoManager
            action={saveShowcaseStudioAction}
            hidden={{ id: page.id, step: "photos" }}
            photos={photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))}
            limit={allow.photos}
            continueLabel="Save and continue"
          />
        </div>
      ) : (
        <form action={saveShowcaseStudioAction} className="flex max-w-3xl flex-col gap-4 rounded-2xl border border-rule bg-card p-5 sm:p-6">
          <input type="hidden" name="id" value={page.id} />
          <input type="hidden" name="step" value={step} />
          <ShowcaseFields step={step} page={page} />
          <div className="border-t border-rule pt-5">
            <SubmitButton pendingLabel="Saving…">Save and continue</SubmitButton>
          </div>
        </form>
      )}

    </div>
  );
}
