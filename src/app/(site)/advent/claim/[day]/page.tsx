import Link from "next/link";
import { gazetteFonts } from "@/components/gazette/fonts";
import { notFound } from "next/navigation";
import { adventDoor } from "@/content/gazette/advent";
import { adventAccess } from "../../access";
import { ClaimForm } from "./ClaimForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trichozette advent", robots: { index: false } };

const RED = "#9b1b2a";

export default async function AdventClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ day: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const day = Number((await params).day);
  const door = adventDoor(day);
  if (!door || door.kind !== "claim") notFound();
  const { open, review } = await adventAccess(day, `/advent/claim/${day}`, searchParams);

  return (
    <div className={`mag bg-paper ${gazetteFonts}`}>
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
        <Link href="/trichozette/ready-for-2027#advent" className="label text-ink-2">
          &larr; Back to the advent
        </Link>
        <p className="label mt-8" style={{ color: RED }}>
          Door {day} · {day} December
        </p>
        {open ? (
          <>
            <h1 className="mag-didone mt-3 text-[40px] leading-[1.08] text-ink">{door.title}</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{door.text}</p>
            {review && <p className="mt-4 text-[13px] text-ink-2">Review link: the form shows here, but claims only go through once the door has really opened.</p>}
            <ClaimForm day={day} />
          </>
        ) : (
          <>
            <h1 className="mag-didone mt-3 text-[40px] leading-[1.08] text-ink">This door is still wrapped.</h1>
            <p className="mt-4 text-[16px] text-ink-2">It opens on {day} December, and we&apos;ll email you that morning.</p>
          </>
        )}
      </div>
    </div>
  );
}
