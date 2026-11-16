import type { ReactNode } from "react";

/**
 * What is behind each "page" door of the Trichozette advent. Server only: the advent pages
 * render this after checking the door has opened, so none of it is sent early.
 */

const RED = "#9b1b2a";

function H({ children }: { children: ReactNode }) {
  return <h2 className="label mt-10 mb-3 text-ink">{children}</h2>;
}

function Copy({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4 rounded-[18px] border border-rule bg-white p-6">
      <p className="label mb-3" style={{ color: RED }}>
        {title}
      </p>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink-2 [&_em]:not-italic [&_em]:rounded [&_em]:bg-paper-2 [&_em]:px-1">{children}</div>
    </div>
  );
}

/** Door 1: an A4 poster. The hours are editable on screen, then printed or saved as PDF. */
function Poster() {
  const days = [
    ["Mon 21 December", ""],
    ["Tue 22 December", ""],
    ["Wed 23 December", ""],
    ["Thu 24 December", ""],
    ["Fri 25 December", "Closed"],
    ["Sat 26 December", "Closed"],
    ["Mon 28 December", "Closed"],
    ["Tue 29 December", ""],
    ["Wed 30 December", ""],
    ["Thu 31 December", ""],
    ["Fri 1 January", "Closed"],
    ["Sat 2 January", ""],
    ["Mon 4 January", ""],
  ];
  return (
    <>
      <p className="text-[15px] leading-relaxed text-ink-2 print:hidden">
        Click any time on the poster to type your own hours, add your business name at the bottom, then print it or save it as a PDF. Christmas Day, Boxing Day (observed on Monday 28 December) and New Year&apos;s Day are filled in as closed; change anything you like.
      </p>
      <div className="advent-poster mx-auto mt-6 aspect-[210/297] w-full max-w-[560px] overflow-hidden rounded-[18px] bg-white text-center shadow-sm print:mt-0 print:max-w-none print:rounded-none print:shadow-none" style={{ border: `10px solid ${RED}` }}>
        <div className="px-[7%] pt-[8%]">
          <p className="label" style={{ color: RED }}>
            Christmas and New Year
          </p>
          <p className="mag-didone mt-3 text-[clamp(30px,7vw,48px)] leading-[1.05] text-ink">Our opening hours</p>
          <div className="mx-auto mt-4 flex items-center justify-center gap-3" aria-hidden>
            <span className="h-px w-16" style={{ background: RED }} />
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke={RED}>
              <path d="M10 1l2.4 5.6 6 .5-4.6 4 1.4 5.9L10 14l-5.2 3 1.4-5.9-4.6-4 6-.5z" />
            </svg>
            <span className="h-px w-16" style={{ background: RED }} />
          </div>
          <table className="mx-auto mt-5 w-full max-w-[400px] text-left text-[clamp(12px,2.6vw,15px)]">
            <tbody>
              {days.map(([d, v]) => (
                <tr key={d} className="border-b border-rule">
                  <td className="py-1.5 pr-3 text-ink">{d}</td>
                  <td className="py-1.5 text-right text-ink-2" contentEditable suppressContentEditableWarning aria-label={`Hours on ${d}`}>
                    {v || "9am to 5pm"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-5 text-[clamp(12px,2.6vw,14px)] text-ink-2" contentEditable suppressContentEditableWarning>
            Book online any time, or leave us a message and we&apos;ll reply when we reopen.
          </p>
          <p className="mag-didone mt-4 text-[clamp(18px,4vw,24px)] italic text-ink" contentEditable suppressContentEditableWarning>
            Your business name
          </p>
          <p className="label mt-2" style={{ color: RED }}>
            Happy Christmas
          </p>
        </div>
      </div>
    </>
  );
}

function Voicemail() {
  return (
    <>
      <p className="text-[15px] leading-relaxed text-ink-2">Read it through once, change the words in grey, then record it in one take. It runs to about 30 seconds.</p>
      <Copy title="Your holiday voicemail">
        <p>
          &ldquo;Hello, you&apos;ve reached <em>your business name</em>. Thank you for calling. We&apos;re closed for Christmas from <em>Thursday 24 December</em> and we reopen on <em>Monday 4 January</em>.
        </p>
        <p>
          You can book your next appointment any time at <em>your website</em>. Or leave your name, your number and a short message after the tone, and we&apos;ll call you back when we reopen.
        </p>
        <p>
          If your call is about something urgent with your health, please contact your GP or NHS 111. From all of us, have a very happy Christmas.&rdquo;
        </p>
      </Copy>
      <H>Before you record</H>
      <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-2">
        <li>Use the same dates as your website, booking page and email signature.</li>
        <li>Record somewhere quiet and smile while you speak: it carries.</li>
        <li>Set a reminder to switch back to your usual message the morning you reopen.</li>
      </ul>
    </>
  );
}

function Messages() {
  return (
    <>
      <p className="text-[15px] leading-relaxed text-ink-2">Copy, change the words in grey, and send. Each has a longer email version and a short text version.</p>
      <Copy title="1. A thank-you to your regulars (email)">
        <p>Hello <em>first name</em>,</p>
        <p>
          Before we close for Christmas, I wanted to say thank you. It has been a real pleasure looking after you this year, and I&apos;m grateful you trust us with your hair and scalp.
        </p>
        <p>Wishing you a peaceful Christmas, and I look forward to seeing you in the new year.</p>
        <p>
          <em>Your name</em>, <em>your business name</em>
        </p>
      </Copy>
      <Copy title="1. A thank-you to your regulars (text)">
        <p>
          Hi <em>first name</em>, thank you for a lovely year with us. Wishing you a peaceful Christmas, and see you in the new year. <em>Your name</em> at <em>your business name</em>
        </p>
      </Copy>
      <Copy title="2. A January rebooking note (email)">
        <p>Hello <em>first name</em>,</p>
        <p>
          The January diary is filling up. If you&apos;d like your next appointment in the new year, you can book it now at <em>your booking link</em>, or simply reply to this email and we&apos;ll find a time that suits you.
        </p>
        <p>
          <em>Your name</em>, <em>your business name</em>
        </p>
      </Copy>
      <Copy title="2. A January rebooking note (text)">
        <p>
          Hi <em>first name</em>, the January diary is filling up. Book your next visit at <em>your booking link</em> or reply here and we&apos;ll find you a time. <em>Your business name</em>
        </p>
      </Copy>
      <Copy title="3. A closed-for-Christmas reply (email auto-reply)">
        <p>Thank you for your message. We&apos;re closed for Christmas from <em>Thursday 24 December</em> and reopen on <em>Monday 4 January</em>, when we&apos;ll reply in the order messages arrived.</p>
        <p>You can book online any time at <em>your website</em>. If your message is about something urgent with your health, please contact your GP or NHS 111.</p>
        <p>Happy Christmas from all of us at <em>your business name</em>.</p>
      </Copy>
    </>
  );
}

function StockCheck() {
  return (
    <>
      <p className="text-[15px] leading-relaxed text-ink-2">
        The Cosmetic Products (Restriction of Chemical Substances) Regulations 2026 (SI 2026/23) add sixteen substances classed as carcinogenic, mutagenic or toxic for reproduction to the list of substances banned from cosmetics in Great Britain. Your suppliers will know which of their products are affected; this sheet helps you ask the right questions.
      </p>
      <H>What changed</H>
      <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-2">
        <li>From 15 August 2026, sixteen more substances are banned from cosmetics placed on the market in Great Britain. One of them is TPO, used in some gel nail products.</li>
        <li>Products already on the market before then may be sold until 14 February 2027. After that date they can&apos;t be sold or used on clients.</li>
        <li>The labelling threshold for formaldehyde-releasing preservatives has been lowered.</li>
        <li>In Ireland and Northern Ireland, EU rules apply instead, including new EU bans from 1 February 2027.</li>
      </ul>
      <H>Questions to ask each supplier, in writing</H>
      <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-2">
        <li>Which of the products I buy from you contain any substance added to the banned list by SI 2026/23?</li>
        <li>Has any product I stock been reformulated, and how can I tell the new formulation from the old?</li>
        <li>Will you take back or credit unsold stock that can&apos;t be sold after 14 February 2027?</li>
        <li>Has the labelling changed on any product because of the new formaldehyde-releaser threshold?</li>
        <li>For Ireland or Northern Ireland: which products are affected by the EU bans from 1 February 2027?</li>
      </ol>
      <H>Keep a record</H>
      <div className="overflow-hidden rounded-[18px] border border-rule bg-white">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-paper-2 text-ink">
            <tr>
              <th className="p-3 font-semibold">Product</th>
              <th className="p-3 font-semibold">Supplier</th>
              <th className="p-3 font-semibold">Affected?</th>
              <th className="p-3 font-semibold">Action and date</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }, (_, i) => (
              <tr key={i} className="border-t border-rule">
                {Array.from({ length: 4 }, (_, j) => (
                  <td key={j} className="h-10 p-3" contentEditable suppressContentEditableWarning />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-[14px] text-ink-2">
        Source:{" "}
        <a className="underline" href="https://www.legislation.gov.uk/uksi/2026/23/made">
          The Cosmetic Products (Restriction of Chemical Substances) Regulations 2026, legislation.gov.uk
        </a>
        . This is a checklist, not legal advice; your suppliers and the regulations are the final word.
      </p>
    </>
  );
}

function CalendarGift() {
  return (
    <p className="text-[15px] leading-relaxed text-ink-2">
      One file with every date in this edition: the Christmas and New Year bank holidays in the UK and Ireland, and the regulatory and business deadlines of 2027. Open it and your calendar app will add them all.
    </p>
  );
}

export const GIFT_PAGES: Record<number, { body: ReactNode; print?: boolean; download?: { href: string; label: string } }> = {
  1: { body: <Poster />, print: true },
  2: { body: <Voicemail />, print: true },
  3: { body: <Messages />, print: true },
  5: { body: <StockCheck />, print: true },
  6: { body: <CalendarGift />, download: { href: "/advent/calendar.ics", label: "Download the calendar file" } },
};
