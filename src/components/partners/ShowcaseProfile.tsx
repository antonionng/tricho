import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Gift, Heart, Info, Mail, Phone, Sparkles } from "lucide-react";
import type { Partner } from "@prisma/client";
import type { TeamMember } from "@/lib/business-team";
import { employmentLabel } from "@/lib/jobs";
import { Container } from "@/components/site/primitives";
import { bodoni } from "@/components/gazette/fonts";
import { PhotoGallery, type GalleryPhoto } from "@/components/partners/PhotoGallery";
import { displayHost, partnerLogoSrc, partnerTierLabel, safeHttpUrl } from "@/lib/partners";
import {
  paragraphs,
  partnerAllowance,
  readHighlights,
  readOfferings,
  readSections,
  safeHex,
  textOn,
  tint,
  videoEmbedUrl,
} from "@/lib/showcase";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

export type ShowcasePartner = Pick<
  Partner,
  | "name"
  | "slug"
  | "tier"
  | "kind"
  | "category"
  | "blurb"
  | "logoUrl"
  | "coverUrl"
  | "website"
  | "perk"
  | "publicEmail"
  | "publicPhone"
  | "accentColor"
  | "charityNumber"
  | "tagline"
  | "story"
  | "highlights"
  | "offerings"
  | "sections"
  | "ctaLabel"
  | "ctaUrl"
  | "videoUrl"
>;

const display = "font-[family-name:var(--font-bodoni)] font-medium tracking-tight";
const eyebrow = "text-xs font-semibold uppercase tracking-[0.18em]";

/** A link a brand typed for a button: an anchor on the page, or an http(s) address. */
function buttonHref(value: string | null | undefined) {
  if (!value) return null;
  if (/^#section-\d$/.test(value) || value === "#photos" || value === "#contact") return value;
  return safeHttpUrl(value);
}

/**
 * Every partner page: paying Business and Premium partners, and charities we support. What shows
 * depends on what the page holds and on its package (src/lib/showcase.ts). The portal preview renders
 * this too, so owners see exactly what visitors see.
 */
export function ShowcaseProfile({
  partner,
  photos,
  socials,
  team = [],
  jobs = [],
  preview = false,
}: {
  partner: ShowcasePartner;
  photos: GalleryPhoto[];
  socials: { id: string; label: string; url: string }[];
  /** People from the business's team seats who are shown on the page. */
  team?: TeamMember[];
  /** Live roles from the jobs board. */
  jobs?: { slug: string; title: string; location: string; employment: string }[];
  preview?: boolean;
}) {
  const allow = partnerAllowance(partner);
  const charity = partner.kind === "charity";
  // A free Premium page: no partner label, no sponsored wording, nothing about payment.
  const gifted = partner.kind === "gifted";
  const accent = safeHex(allow.colour ? partner.accentColor : null);
  const onAccent = textOn(accent);
  // Numbers and headings use the brand colour only when it reads well on white.
  const strong = onAccent === "#FFFFFF" ? accent : "#0B0B0B";
  const vars = {
    "--c-accent": accent,
    "--c-on": onAccent,
    "--c-strong": strong,
    "--c-soft": tint(accent, 0.22),
    "--c-wash": tint(accent, 0.06),
  } as React.CSSProperties;

  const logo = partnerLogoSrc(partner.logoUrl);
  const cover = allow.cover ? partnerLogoSrc(partner.coverUrl) : null;
  const website = safeHttpUrl(partner.website);
  const host = displayHost(partner.website);
  const websiteHref = preview ? website : `/go/${partner.slug}`;
  const rel = charity ? "noopener" : gifted ? "noopener nofollow" : "noopener nofollow sponsored";
  const publicEmail = partner.publicEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partner.publicEmail) ? partner.publicEmail : null;
  const publicPhone = partner.publicPhone?.trim() || null;
  const telHref = publicPhone ? `tel:${publicPhone.replace(/[^\d+]/g, "")}` : null;

  const highlights = readHighlights(partner.highlights, allow.highlights);
  const offerings = readOfferings(partner.offerings, allow.offerings);
  const sections = readSections(partner.sections, allow.sections);
  const video = allow.video ? videoEmbedUrl(partner.videoUrl) : null;
  const gallery = photos.slice(0, allow.photos);
  const story = paragraphs(partner.story);
  const about = story.length ? story : paragraphs(partner.blurb);
  const ctaHref = allow.cta ? buttonHref(partner.ctaUrl) : null;
  const ctaExternal = ctaHref?.startsWith("http");
  const Heading = preview ? "h2" : "h1";

  return (
    <div className={cn(bodoni.variable, "text-ink")} style={vars}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--c-accent)] pb-14 pt-8 text-[var(--c-on)] md:pb-20">
        {charity && <Hearts />}
        <Container className="relative">
          {!preview && (
            <Link
              href={gifted ? "/directory?discipline=businesses" : "/partners"}
              className="inline-flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> {gifted ? "Directory" : "All partners"}
            </Link>
          )}

          <div className="mt-10 flex flex-col items-center gap-6 text-center md:mt-12">
            <div className="flex flex-wrap justify-center gap-2">
              {charity ? (
                <span className={cn(eyebrow, "inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5")}>
                  <Heart className="h-3.5 w-3.5 fill-current" aria-hidden /> Proudly supported by {site.name}
                </span>
              ) : (
                <>
                  {!gifted && (
                    <span className={cn(eyebrow, "rounded-full bg-[var(--c-on)] px-3 py-1.5 text-[10px] text-[var(--c-accent)]")}>
                      {partnerTierLabel(partner.tier, partner.kind)}
                    </span>
                  )}
                  <span className={cn(eyebrow, "rounded-full border border-current/30 px-3 py-1.5 text-[10px] opacity-90")}>
                    {partner.category}
                  </span>
                </>
              )}
            </div>

            {logo && (
              <div className="flex h-28 items-center justify-center rounded-3xl bg-white px-8 py-4 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.45)] md:h-32">
                {/* Logos come from uploads or the Studio; a plain img keeps transparent PNGs crisp. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt={`${partner.name} logo`} className="max-h-full max-w-[240px] object-contain" />
              </div>
            )}
            <Heading className={cn(display, "max-w-4xl text-5xl leading-[1.02] sm:text-6xl md:text-7xl")}>{partner.name}</Heading>
            {partner.tagline && <p className="max-w-2xl text-lg leading-relaxed opacity-95 md:text-xl">{partner.tagline}</p>}
            {partner.charityNumber && <p className="text-sm opacity-80">Registered charity number {partner.charityNumber}</p>}

            <div className="mt-1 flex flex-wrap justify-center gap-3">
              {ctaHref && partner.ctaLabel && (
                <a
                  href={ctaHref}
                  {...(ctaExternal ? { target: "_blank", rel } : {})}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--c-on)] px-6 text-[15px] font-semibold text-[var(--c-accent)] transition hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4" aria-hidden /> {partner.ctaLabel}
                </a>
              )}
              {website && websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel={rel}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-current/50 px-6 text-[15px] font-semibold transition hover:bg-white/10"
                >
                  Visit {host ?? "their website"} <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              )}
            </div>
          </div>

          {cover && (
            <div className="mx-auto mt-12 max-w-6xl overflow-hidden rounded-[28px] border-4 border-white/90 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.5)] md:mt-14">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt={`${partner.name}`} className="block max-h-[620px] w-full object-cover" />
            </div>
          )}
        </Container>
      </section>

      {/* Highlights */}
      {highlights.length > 0 && (
        <section className="bg-[var(--c-soft)] py-12 md:py-16">
          <Container>
            <ul className={cn("grid grid-cols-2 gap-x-6 gap-y-10", highlights.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4")}>
              {highlights.map((h) => (
                <li key={h.label} className="flex flex-col items-center gap-2 text-center">
                  <span className={cn(display, "text-5xl text-[var(--c-strong)] md:text-6xl")}>{h.value}</span>
                  <span className="max-w-[18ch] text-[15px] leading-snug text-ink-2">{h.label}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Story */}
      {about.length > 0 && (
        <section className="bg-[var(--c-wash)] py-20 md:py-28">
          <Container>
            <div className="grid gap-10 md:grid-cols-[1fr_1.3fr] md:gap-20">
              <div className="flex flex-col gap-4">
                <p className={cn(eyebrow, "text-[var(--c-strong)]")}>{charity ? "Their story" : "Our story"}</p>
                <h2 className={cn(display, "text-4xl leading-[1.05] md:text-5xl")}>
                  {about[0].startsWith("## ") ? about[0].slice(3) : `About ${partner.name}`}
                </h2>
              </div>
              <div className="flex flex-col gap-5 text-[17px] leading-relaxed text-ink-2">
                {about
                  .filter((p, i) => !(i === 0 && p.startsWith("## ")))
                  .map((p) =>
                    p.startsWith("## ") ? (
                      <h3 key={p} className="pt-2 text-xl font-semibold tracking-tight text-ink">
                        {p.slice(3)}
                      </h3>
                    ) : (
                      <p key={p}>{p}</p>
                    )
                  )}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* Offerings */}
      {offerings.length > 0 && (
        <section className="bg-white py-20 md:py-28">
          <Container>
            <div className="flex max-w-2xl flex-col gap-4">
              <p className={cn(eyebrow, "text-[var(--c-strong)]")}>{charity ? "What they give" : "What we offer"}</p>
              <h2 className={cn(display, "text-4xl leading-[1.05] md:text-5xl")}>
                {charity
                  ? "Everything is free to every family."
                  : gifted
                    ? `What ${partner.name} offers.`
                    : `What ${partner.name} offers hair and scalp professionals.`}
              </h2>
            </div>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {offerings.map((o) => (
                <li key={o.title} className="flex flex-col gap-3 rounded-3xl border-2 border-[var(--c-soft)] bg-[var(--c-wash)] p-7">
                  <span className="h-2 w-8 rounded-full bg-[var(--c-accent)]" aria-hidden />
                  <h3 className="text-xl font-semibold tracking-tight">{o.title}</h3>
                  {o.body && <p className="text-[15px] leading-relaxed text-ink-2">{o.body}</p>}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Team */}
      {team.length > 0 && (
        <section id="team" className="scroll-mt-20 bg-[var(--c-wash)] py-20 md:py-28">
          <Container>
            <div className="flex max-w-2xl flex-col gap-4">
              <p className={cn(eyebrow, "text-[var(--c-strong)]")}>Meet the team</p>
              <h2 className={cn(display, "text-4xl leading-[1.05] md:text-5xl")}>The people you&apos;ll work with at {partner.name}.</h2>
            </div>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((m) => (
                <li key={m.id} className="flex flex-col gap-4 rounded-3xl bg-white p-7">
                  {m.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo} alt={m.name} className="aspect-square w-full rounded-2xl object-cover" loading="lazy" />
                  ) : (
                    <span
                      aria-hidden
                      className="grid aspect-square w-full place-items-center rounded-2xl bg-[var(--c-soft)] text-5xl font-semibold text-[var(--c-strong)]"
                    >
                      {m.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                  )}
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-semibold tracking-tight">{m.name}</h3>
                    {m.role && <p className="text-[15px] text-[var(--c-strong)]">{m.role}</p>}
                  </div>
                  {m.bio && <p className="text-[15px] leading-relaxed text-ink-2">{m.bio}</p>}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Open roles */}
      {jobs.length > 0 && (
        <section id="jobs" className="scroll-mt-20 bg-white py-16 md:py-20">
          <Container>
            <div className="flex max-w-2xl flex-col gap-4">
              <p className={cn(eyebrow, "text-[var(--c-strong)]")}>Open roles</p>
              <h2 className={cn(display, "text-4xl leading-[1.05] md:text-5xl")}>{partner.name} is hiring.</h2>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {jobs.map((j) => (
                <li key={j.slug}>
                  <Link
                    href={`/jobs/${j.slug}`}
                    className="flex h-full flex-col gap-1 rounded-3xl border-2 border-[var(--c-soft)] bg-[var(--c-wash)] p-6 transition-colors hover:border-[var(--c-accent)]"
                  >
                    <span className="text-xl font-semibold tracking-tight">{j.title}</span>
                    <span className="text-[15px] text-ink-2">
                      {j.location} · {employmentLabel(j.employment)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Feature sections */}
      {sections.map((s, i) => {
        const href = buttonHref(s.ctaUrl);
        const bold = i % 2 === 0;
        return (
          <section key={s.title} id={`section-${i + 1}`} className={cn("scroll-mt-20 py-10 md:py-14", bold ? "bg-white" : "bg-[var(--c-wash)]")}>
            <Container>
              <div
                className={cn(
                  "relative overflow-hidden rounded-[32px] p-8 md:p-14",
                  bold ? "bg-[var(--c-accent)] text-[var(--c-on)]" : "bg-white"
                )}
              >
                {bold && charity && <Hearts />}
                <div className={cn("relative grid gap-10", s.steps?.length && "md:grid-cols-2 md:gap-14")}>
                  <div className="flex flex-col gap-5">
                    {s.eyebrow && <p className={cn(eyebrow, bold ? "opacity-85" : "text-[var(--c-strong)]")}>{s.eyebrow}</p>}
                    <h2 className={cn(display, "text-4xl leading-[1.05] md:text-5xl")}>{s.title}</h2>
                    {paragraphs(s.body).map((p) => (
                      <p key={p} className={cn("whitespace-pre-line text-[17px] leading-relaxed", bold ? "opacity-95" : "text-ink-2")}>
                        {p}
                      </p>
                    ))}
                    {href && s.ctaLabel && (
                      <a
                        href={href}
                        {...(href.startsWith("http") ? { target: "_blank", rel } : {})}
                        className={cn(
                          "mt-1 inline-flex h-12 items-center gap-2 self-start rounded-full px-6 text-[15px] font-semibold transition hover:opacity-90",
                          bold ? "bg-[var(--c-on)] text-[var(--c-accent)]" : "bg-[var(--c-accent)] text-[var(--c-on)]"
                        )}
                      >
                        {s.ctaLabel} <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </a>
                    )}
                  </div>
                  {s.steps && s.steps.length > 0 && (
                    <ol className="flex flex-col gap-3">
                      {s.steps.map((step, n) => (
                        <li key={step} className={cn("flex gap-4 rounded-2xl p-5", bold ? "bg-white/12" : "bg-[var(--c-wash)]")}>
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold",
                              bold ? "bg-[var(--c-on)] text-[var(--c-accent)]" : "bg-[var(--c-accent)] text-[var(--c-on)]"
                            )}
                          >
                            {n + 1}
                          </span>
                          <span className="pt-1 text-[15px] leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </Container>
          </section>
        );
      })}

      {/* Video */}
      {video && (
        <section className="bg-white py-16 md:py-20">
          <Container>
            <div className="mx-auto aspect-video max-w-5xl overflow-hidden rounded-[28px] bg-ink">
              <iframe
                src={video}
                title={`${partner.name} video`}
                className="h-full w-full"
                loading="lazy"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </Container>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section id="photos" className="scroll-mt-20 bg-[var(--c-soft)] py-16 md:py-20">
          <Container>
            <PhotoGallery photos={gallery} name={partner.name} />
          </Container>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 bg-white py-20 md:py-24">
        <Container>
          <div className="grid gap-10 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <p className={cn(eyebrow, "text-[var(--c-strong)]")}>Get in touch</p>
              <h2 className={cn(display, "text-4xl leading-[1.05] md:text-5xl")}>Talk to the {partner.name} team.</h2>
              {website && websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel={rel}
                  className="inline-flex items-center gap-1.5 self-start text-[15px] font-medium text-[var(--c-strong)] underline underline-offset-4"
                >
                  {host ?? "Their website"} <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              )}
            </div>
            <div className="flex flex-col gap-3 text-[16px]">
              {publicEmail && (
                <a href={`mailto:${publicEmail}`} className="inline-flex items-center gap-3 break-all hover:text-[var(--c-strong)]">
                  <Mail className="h-5 w-5 shrink-0 text-[var(--c-strong)]" aria-hidden /> {publicEmail}
                </a>
              )}
              {publicPhone && telHref && (
                <a href={telHref} className="inline-flex items-center gap-3 hover:text-[var(--c-strong)]">
                  <Phone className="h-5 w-5 shrink-0 text-[var(--c-strong)]" aria-hidden /> {publicPhone}
                </a>
              )}
              {socials.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel={charity || gifted ? "noopener noreferrer" : "noopener noreferrer sponsored"}
                      className="rounded-full bg-[var(--c-wash)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--c-soft)]"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
              {!publicEmail && !publicPhone && !socials.length && (
                <p className="text-[15px] text-muted-foreground">Contact details will appear here once they are added.</p>
              )}
            </div>
          </div>

          {partner.perk && (
            <aside className="mt-14 flex gap-4 rounded-3xl border-2 border-[var(--c-soft)] bg-[var(--c-wash)] p-6 md:p-8">
              <Gift className="mt-0.5 h-6 w-6 shrink-0 text-[var(--c-strong)]" aria-hidden />
              <div className="flex flex-col gap-2">
                <p className="text-lg font-medium">Members get an offer from {partner.name}.</p>
                <p className="text-[15px] leading-relaxed text-ink-2">
                  Members can see the full offer and how to claim it in the member area.{" "}
                  <Link href="/members/perks" className="font-medium text-ink underline underline-offset-4">
                    See member perks
                  </Link>
                </p>
              </div>
            </aside>
          )}

          {!gifted && (
          <p className="mt-14 flex gap-3 border-t border-[var(--c-soft)] pt-6 text-sm leading-relaxed text-muted-foreground">
            {charity ? (
              <>
                <Heart className="mt-0.5 h-4 w-4 shrink-0 text-[var(--c-strong)]" aria-hidden />
                <span>
                  {partner.name} is a charity that {site.name} supports free of charge. It has not paid for this page, and everything
                  on it comes from the charity.
                </span>
              </>
            ) : (
              <>
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  Sponsored. {partner.name} is a paying {partner.tier === "premium" ? "Premium" : "Business"} partner of {site.name}.
                  Partners support our work but do not decide what we teach or publish, and they never post in the clinical spaces.
                </span>
              </>
            )}
          </p>
          )}
        </Container>
      </section>
    </div>
  );
}

/** A few soft hearts drifting in the background of a charity's colour bands. */
function Hearts() {
  const hearts = [
    { left: "6%", top: "18%", size: 28, o: 0.18 },
    { left: "88%", top: "12%", size: 40, o: 0.14 },
    { left: "78%", top: "62%", size: 22, o: 0.2 },
    { left: "14%", top: "70%", size: 36, o: 0.12 },
    { left: "48%", top: "6%", size: 18, o: 0.16 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {hearts.map((h, i) => (
        <Heart
          key={i}
          className="absolute fill-white text-white"
          style={{ left: h.left, top: h.top, width: h.size, height: h.size, opacity: h.o }}
        />
      ))}
    </div>
  );
}
