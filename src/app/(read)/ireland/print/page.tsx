import { BrandMark } from "@/components/brand/BrandMark";
import { site } from "@/config/site";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import { images, img } from "@/content/images";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Trichollective Ireland print sheets", robots: { index: false, follow: false } };

const qr = (path: string, src: string) => `/qr?path=${encodeURIComponent(path)}&src=${src}`;

/** Print at 100% on A4. Page 1 is the poster, page 2 holds two A5 table cards. */
export default function IrelandPrint() {
  const shortUrl = new URL(site.url).host.replace(/^www\./, "") + "/ireland";
  return (
    <div className="bg-neutral-300 print:bg-white">
      <style>{`@page { size: A4; margin: 0 } @media print { .no-print { display: none } }`}</style>
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-4 bg-ink px-6 py-3 text-paper">
        <p className="text-sm">Print at 100% scale on A4. Page one is the poster; page two is two table cards to cut in half.</p>
        <PrintButton />
      </div>

      {/* A4 poster */}
      <section className="relative mx-auto my-8 overflow-hidden bg-paper print:my-0" style={{ width: "210mm", height: "297mm", breakAfter: "page" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img(images.heroPortrait, 1400)} alt="" className="absolute right-0 top-0 h-[62%] w-[58%] object-cover" />
        <div className="absolute right-[58%] top-0 h-[62%] w-[20%] bg-gradient-to-r from-paper to-transparent" style={{ right: "42%" }} />
        <div className="relative flex h-full flex-col px-[14mm] pt-[16mm]">
          <BrandMark size="md" sub />
          <p className="label mt-[18mm] text-[3.4mm] text-ink">{site.launch.title}</p>
          <h1 className="display mt-[5mm] max-w-[120mm] text-[17mm] leading-[0.92]">
            Join today <span className="text-fade">and keep the founding price for as long as you stay.</span>
          </h1>
          <p className="mt-[8mm] max-w-[100mm] text-[5mm] leading-snug text-ink-2">
            Trichollective is the year-round community for cosmetic, clinical and medical hair and scalp professionals.
          </p>
          <div className="mt-auto mb-[16mm] flex items-end justify-between gap-[10mm] border-t border-ink/20 pt-[8mm]">
            <div className="flex flex-col gap-[3mm]">
              <p className="label text-[3.4mm] text-ink">Scan the code to join from your phone</p>
              <p className="max-w-[95mm] text-[4.2mm] leading-snug text-ink-2">
                Become a founding member for the Case Room, the referral network and a directory listing, or add a free listing with your full profile free for {FREE_LISTING_DAYS} days.
              </p>
              <p className="label mt-[2mm] text-[3mm] text-muted-foreground">{shortUrl}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr("/ireland", "ireland")} alt="QR code to the Trichollective Ireland page" className="h-[46mm] w-[46mm]" />
          </div>
        </div>
      </section>

      {/* Two A5 table cards on one A4 sheet */}
      <section className="mx-auto my-8 flex flex-col bg-paper print:my-0" style={{ width: "210mm", height: "297mm" }}>
        {[0, 1].map((i) => (
          <div key={i} className={`flex flex-1 items-center gap-[10mm] px-[14mm] ${i === 0 ? "border-b border-dashed border-ink/30" : ""}`}>
            <div className="flex flex-1 flex-col gap-[5mm]">
              <BrandMark size="sm" sub />
              <p className="display text-[10mm] leading-[0.98]">
                Put your practice in the founding directory today.
              </p>
              <p className="text-[4mm] leading-snug text-ink-2">
                It&apos;s free and takes two minutes, and your full profile with enquiries is free for {FREE_LISTING_DAYS} days. Founding members keep their founding price for as long as they stay.
              </p>
              <p className="label text-[3mm] text-muted-foreground">
                {site.launch.title} · {shortUrl}
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr("/ireland", "ireland")} alt="QR code to the Trichollective Ireland page" className="h-[52mm] w-[52mm]" />
          </div>
        ))}
      </section>
    </div>
  );
}
