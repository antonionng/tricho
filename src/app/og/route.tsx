import { ImageResponse } from "next/og";

export const runtime = "edge";

const PAPER = "#f4f3f0";
const INK = "#0b0b0b";
const MUTE = "#8a8a87";

/** Inter Tight from Google Fonts as TTF (Satori can't read woff2). Falls back to the default font. */
async function font(weight: number) {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter+Tight:wght@${weight}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1)" },
    }).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

/** Only our own image host, so the route can't be used to proxy arbitrary images. */
function safeImage(src: string | null) {
  if (!src) return null;
  try {
    const u = new URL(src);
    return u.protocol === "https:" && u.hostname === "images.unsplash.com" ? src : null;
  } catch {
    return null;
  }
}

/**
 * Branded share images, 1200×630.
 *   /og?title=…&eyebrow=…&sub=…            text card (paper)
 *   /og?…&img=<unsplash>&variant=photo      title left, photograph bleeding off the right (the poster)
 *   /og?…&img=<unsplash>&variant=cover      Trichozette cover (dark, full-bleed photo)
 *   /og?…&img=<unsplash>&variant=profile    directory profile with portrait
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const title = (q.get("title") || "A stronger hair industry, together").slice(0, 110);
  const eyebrow = (q.get("eyebrow") || "Trichollective Online").slice(0, 60).toUpperCase();
  const sub = q.get("sub")?.slice(0, 140) ?? null;
  const img = safeImage(q.get("img"));
  const variant = (q.get("variant") as "text" | "photo" | "cover" | "profile") || (img ? "photo" : "text");

  const [bold, medium] = await Promise.all([font(700), font(500)]);
  const fonts = [
    ...(bold ? [{ name: "Inter Tight", data: bold, weight: 700 as const, style: "normal" as const }] : []),
    ...(medium ? [{ name: "Inter Tight", data: medium, weight: 500 as const, style: "normal" as const }] : []),
  ];
  const family = fonts.length ? "Inter Tight" : "sans-serif";
  const titleSize = title.length > 70 ? 58 : title.length > 40 ? 70 : 84;

  const Wordmark = ({ dark }: { dark?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 34, fontWeight: 700, letterSpacing: -1.5, textTransform: "uppercase" }}>
        <span style={{ color: dark ? PAPER : INK }}>Tricho</span>
        <span style={{ color: MUTE }}>llective.</span>
      </div>
      <div style={{ fontSize: 12, letterSpacing: 9, color: dark ? PAPER : INK, marginTop: 4, fontWeight: 500 }}>ONLINE</div>
    </div>
  );

  const Footer = ({ dark, compact }: { dark?: boolean; compact?: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14, letterSpacing: 5, color: dark ? "rgba(244,243,240,0.7)" : "#5c5c59", fontWeight: 500 }}>
      {!compact && <span>TRICHOLLECTIVE ONLINE</span>}
      <div style={{ width: 40, height: 1, background: dark ? "rgba(244,243,240,0.6)" : INK }} />
      <span>A STRONGER HAIR INDUSTRY. TOGETHER.</span>
    </div>
  );

  let body: React.ReactElement;

  if (variant === "cover" && img) {
    body = (
      <div style={{ display: "flex", width: "100%", height: "100%", background: INK, position: "relative", fontFamily: family }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${img}?w=1200&h=630&fit=crop&q=70`} width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.55 }} alt="" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,11,11,0.7) 0%, rgba(11,11,11,0.15) 45%, rgba(11,11,11,0.85) 100%)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 72px", width: "100%", color: PAPER }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -3, textTransform: "uppercase", lineHeight: 1 }}>Trichozette</div>
              <div style={{ fontSize: 14, letterSpacing: 8, marginTop: 8, opacity: 0.7 }}>TRICHOLLECTIVE</div>
            </div>
            <div style={{ fontSize: 16, letterSpacing: 6, opacity: 0.85 }}>{eyebrow}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: titleSize, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>{title}</div>
            {sub && <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: -1, opacity: 0.65, lineHeight: 1.15 }}>{sub}</div>}
          </div>
        </div>
      </div>
    );
  } else if (variant === "profile" && img) {
    body = (
      <div style={{ display: "flex", width: "100%", height: "100%", background: PAPER, fontFamily: family }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 64px", width: 700 }}>
          <Wordmark />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 16, letterSpacing: 6, color: "#5c5c59", fontWeight: 500 }}>{eyebrow}</div>
            <div style={{ fontSize: titleSize > 70 ? 72 : titleSize, fontWeight: 700, letterSpacing: -3, lineHeight: 1, color: INK }}>{title}</div>
            {sub && <div style={{ fontSize: 28, color: "#5c5c59", lineHeight: 1.3 }}>{sub}</div>}
          </div>
          <div style={{ fontSize: 15, letterSpacing: 5, color: INK, fontWeight: 500 }}>THE FOUNDING DIRECTORY</div>
        </div>
        <div style={{ display: "flex", width: 500, height: 630, position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${img}?w=500&h=630&fit=crop&crop=faces&q=75`} width={500} height={630} style={{ objectFit: "cover" }} alt="" />
        </div>
      </div>
    );
  } else if (variant === "photo" && img) {
    body = (
      <div style={{ display: "flex", width: "100%", height: "100%", background: PAPER, position: "relative", fontFamily: family }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${img}?w=640&h=630&fit=crop&q=75`} width={640} height={630} style={{ position: "absolute", right: 0, top: 0, objectFit: "cover" }} alt="" />
        <div style={{ position: "absolute", right: 440, top: 0, width: 200, height: 630, background: `linear-gradient(90deg, ${PAPER} 0%, rgba(244,243,240,0) 100%)` }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 72px", width: 760 }}>
          <Wordmark />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 16, letterSpacing: 6, color: "#5c5c59", fontWeight: 500 }}>{eyebrow}</div>
            <div style={{ fontSize: titleSize, fontWeight: 700, letterSpacing: -3, lineHeight: 0.98, color: INK }}>{title}</div>
            {sub && <div style={{ fontSize: titleSize * 0.8, fontWeight: 700, letterSpacing: -3, lineHeight: 0.98, color: MUTE }}>{sub}</div>}
          </div>
          <Footer compact />
        </div>
      </div>
    );
  } else {
    body = (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", background: PAPER, padding: "60px 72px", fontFamily: family }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Wordmark />
          <div style={{ fontSize: 15, letterSpacing: 6, color: "#5c5c59", fontWeight: 500 }}>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 1040 }}>
          <div style={{ fontSize: titleSize + 6, fontWeight: 700, letterSpacing: -3.5, lineHeight: 0.98, color: INK }}>{title}</div>
          {sub && <div style={{ fontSize: Math.min(titleSize, 64), fontWeight: 700, letterSpacing: -3, lineHeight: 1, color: MUTE }}>{sub}</div>}
        </div>
        <Footer />
      </div>
    );
  }

  return new ImageResponse(body, {
    width: 1200,
    height: 630,
    fonts: fonts.length ? fonts : undefined,
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" },
  });
}
