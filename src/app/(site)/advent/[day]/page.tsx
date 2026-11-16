import Link from "next/link";
import { gazetteFonts } from "@/components/gazette/fonts";
import { notFound } from "next/navigation";
import { adventDoor } from "@/content/gazette/advent";
import { GIFT_PAGES } from "../gifts";
import { adventAccess } from "../access";
import { PrintButton } from "../PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trichozette advent", robots: { index: false } };

const RED = "#9b1b2a";

export default async function AdventGiftPage({
  params,
  searchParams,
}: {
  params: Promise<{ day: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const day = Number((await params).day);
  const door = adventDoor(day);
  if (!door) notFound();
  if (door.kind === "claim") notFound();
  const { open } = await adventAccess(day, `/advent/${day}`, searchParams);
  const gift = GIFT_PAGES[day];

  return (
    <div className={`mag bg-paper ${gazetteFonts}`}>
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
        <Link href="/trichozette/ready-for-2027#advent" className="label text-ink-2 print:hidden">
          &larr; Back to the advent
        </Link>
        <p className="label mt-8" style={{ color: RED }}>
          Door {day} · {day} December
        </p>
        {!open ? (
          <>
            <h1 className="mag-didone mt-3 text-[40px] leading-[1.08] text-ink">This door is still wrapped.</h1>
            <p className="mt-4 text-[16px] text-ink-2">It opens on {day} December, and we&apos;ll email you that morning.</p>
          </>
        ) : door.pending || !gift ? (
          <>
            <h1 className="mag-didone mt-3 text-[40px] leading-[1.08] text-ink">{door.title}</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{door.text}</p>
            <p className="label mt-8 inline-block rounded-full border px-5 py-3" style={{ borderColor: RED, color: RED }}>
              Coming soon
            </p>
            <p className="mt-3 text-[14px] text-ink-2">We&apos;re putting the finishing touches to this gift and will email you when it&apos;s ready.</p>
          </>
        ) : (
          <>
            <h1 className="mag-didone mt-3 text-[40px] leading-[1.08] text-ink print:hidden">{door.title}</h1>
            <div className="mt-6">{gift.body}</div>
            <div className="mt-10 flex flex-wrap items-center gap-4 print:hidden">
              {gift.print && <PrintButton />}
              {gift.download && (
                <a href={gift.download.href} className="rounded-full px-6 py-3 text-[15px] font-semibold text-white" style={{ background: RED }}>
                  {gift.download.label} &rarr;
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
