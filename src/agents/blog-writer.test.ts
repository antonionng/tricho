import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { isFetchableUrl, htmlToText } = await import("./research");
const { cleanLinks, slugify } = await import("./blog-writer");

describe("the writer's source reader", () => {
  it("only reads public https pages", () => {
    expect(isFetchableUrl("https://www.nhs.uk/conditions/hair-loss/")).toBe(true);
    for (const bad of [
      "http://www.nhs.uk/",
      "https://localhost/admin",
      "https://127.0.0.1/",
      "https://[::1]/",
      "https://169.254.169.254/latest/meta-data",
      "https://intranet/",
      "https://printer.local/",
      "https://user:pass@example.com/",
      "https://example.com:8443/",
      "ftp://example.com/",
      "not a url",
    ])
      expect(isFetchableUrl(bad), bad).toBe(false);
  });

  it("keeps the main content and drops menus, scripts and footers", () => {
    const { title, text } = htmlToText(
      `<html><head><title>Hair loss - NHS</title><script>track()</script></head><body><nav>Menu</nav><main><h1>Hair loss</h1><p>It&#39;s normal to lose 50 to 100 hairs a day.</p><ul><li>One</li></ul></main><footer>Cookies</footer></body></html>`
    );
    expect(title).toBe("Hair loss - NHS");
    expect(text).toContain("It's normal to lose 50 to 100 hairs a day.");
    expect(text).toContain("- One");
    expect(text).not.toMatch(/Menu|Cookies|track/);
  });
});

describe("the writer's clean-up", () => {
  it("keeps links to pages that exist and turns the rest into plain words", () => {
    const allowed = new Set(["/guides/scalp-care-basics", "/directory"]);
    const md = "See [our guide](/guides/scalp-care-basics), [a made-up page](/guides/nope), [the directory](https://www.trichollective.net/directory/) and [a study](https://example.com/x).";
    expect(cleanLinks(md, allowed)).toBe("See [our guide](/guides/scalp-care-basics), a made-up page, [the directory](/directory) and a study.");
  });

  it("makes short, readable web addresses", () => {
    expect(slugify("What’s the difference between a trichologist and a dermatologist in Ireland and the UK?")).toMatch(/^[a-z0-9-]{1,60}$/);
    expect(slugify("Can a hairdresser spot alopecia areata?")).toBe("can-a-hairdresser-spot-alopecia-areata");
  });
});

describe("a full writer run", () => {
  it("plans, reads, writes, checks, revises and leaves a publishable draft", async () => {
    vi.resetModules();
    process.env.AI_GATEWAY_API_KEY = "test";
    const rows = new Map<string, Record<string, unknown>>();
    let tick = 0;
    const stamp = () => new Date(Date.UTC(2026, 9, 9, 12, 0, tick++));
    rows.set("a1", {
      id: "a1", slug: "can-a-hairdresser-spot-alopecia-areata", status: "writing", title: "Can a hairdresser spot alopecia areata?",
      description: "", category: "consultations", audience: "professional", tags: [], author: "editorial", image: "hairDetail",
      standfirst: "", answer: "", takeaways: [], body: "", faqs: [], sources: [], related: null, reviewer: null, featured: false,
      targetQuery: "Can a hairdresser spot alopecia areata?", brief: null, sourceUrls: [], origin: "studio", publishedAt: null,
      ai: { step: "planning" }, createdAt: stamp(), updatedAt: stamp(),
    });
    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        blogArticle: {
          findUnique: async ({ where }: { where: { id: string } }) => structuredClone(rows.get(where.id)) ?? null,
          findFirst: async () => null,
          findMany: async () => [],
          update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
            const next = { ...rows.get(where.id)!, ...data, updatedAt: stamp() };
            rows.set(where.id, next);
            return structuredClone(next);
          },
          updateMany: async ({ where, data }: { where: { id: string; updatedAt: Date }; data: Record<string, unknown> }) => {
            const row = rows.get(where.id)!;
            if ((row.updatedAt as Date).getTime() !== where.updatedAt.getTime()) return { count: 0 };
            rows.set(where.id, { ...row, ...data, updatedAt: stamp() });
            return { count: 1 };
          },
        },
      },
    }));
    vi.doMock("./research", async (orig) => ({
      ...(await orig<typeof import("./research")>()),
      readSource: async (url: string, label?: string) => ({ url, label: label ?? url, ok: true, text: "Alopecia areata causes round patches of hair loss. See a GP. ".repeat(20) }),
    }));

    const body = [
      "## What does alopecia areata look like?", "Round, smooth patches. See the [guide](/guides/hair-shedding-when-to-worry) and [a fake page](/guides/nope). A GP can confirm it.",
      "## Should a hairdresser name the condition?", "No. Describe what you see and suggest a GP, using the [directory](/directory).",
      "## What should go in the notes?", "What you saw and what you advised.",
      "## When is it urgent?", "When it spreads quickly or the skin changes.",
      "## How do you raise it kindly?", "Plainly and privately. " + "Short practical sentences help clients. ".repeat(130),
    ].join("\n\n");
    const draft = (title: string) => ({
      title, description: "How a hairdresser can recognise the signs of alopecia areata, what to say to the client and when to suggest they speak to their GP.",
      standfirst: "Hairdressers are often the first to see a patch. This explains what to look for and what to say.",
      answer: "A hairdresser can often notice the round, smooth patches of hair loss that alopecia areata causes, but cannot diagnose it. Describe what you see to the client in plain words, avoid naming the condition, suggest they see their GP, and note what you saw and advised in their record.",
      takeaways: ["Notice and describe, never diagnose.", "Suggest a GP visit.", "Write it in the notes."],
      body, faqs: [
        { q: "Is it contagious?", a: "No, alopecia areata is not contagious and cannot be caught from tools or towels." },
        { q: "Can I still cut their hair?", a: "Usually yes, but be gentle around the area and avoid harsh chemical treatments on it." },
        { q: "Does it grow back?", a: "Hair often regrows, but it varies and a GP or dermatologist can advise the client." },
      ], sourcesUsed: [1, 2],
    });
    const outputs: unknown[] = [
      { searchIntent: "A hairdresser wants to know what to look for.", titleOptions: ["Too short", "Can a hairdresser spot alopecia areata? What to look for"], slug: "can-a-hairdresser-spot-alopecia-areata", category: "consultations", audience: "professional", image: "salon", tags: ["alopecia areata", "referral", "salon"], outline: [{ heading: "What does it look like?", covers: "signs" }], sourceIds: ["nhs-hair-loss", "dermnet-aa"], relatedGuides: ["hair-shedding-when-to-worry", "made-up"], relatedGlossary: ["alopecia-areata"], discipline: "medical" },
      draft("Can a hairdresser spot alopecia areata? What to look for"),
      { verdict: "needs-work", summary: "Mostly supported.", unsupported: [{ claim: "cannot be caught from tools", why: "not in sources" }], safety: [], style: [] },
      draft("Can a hairdresser spot alopecia areata? Signs to look for"),
    ];
    const calls: string[] = [];
    vi.doMock("ai", async (orig) => ({
      ...(await orig<typeof import("ai")>()),
      generateText: async ({ prompt }: { prompt: string }) => {
        calls.push(prompt.slice(0, 40));
        return { output: outputs.shift() };
      },
    }));

    const { runBlogWriter } = await import("./blog-writer");
    const result = await runBlogWriter("a1");
    const row = rows.get("a1")!;
    const ai = row.ai as { step: string; fixed?: string[]; review?: { verdict: string }; lockedUntil?: string };

    expect(result).toMatchObject({ ok: true, done: true });
    expect(calls).toHaveLength(4);
    expect(row.status).toBe("draft");
    expect(ai.step).toBe("done");
    expect(ai.lockedUntil).toBeUndefined();
    expect(ai.fixed?.some((f) => f.includes("cannot be caught from tools"))).toBe(true);
    expect(row.title).toBe("Can a hairdresser spot alopecia areata? Signs to look for");
    expect(row.image).toBe("salon");
    expect(row.related).toEqual({ guides: ["hair-shedding-when-to-worry"], glossary: ["alopecia-areata"], discipline: "medical" });
    expect(row.body).toContain("[guide](/guides/hair-shedding-when-to-worry)");
    expect(row.body).not.toContain("/guides/nope");
    expect((row.sources as { url: string }[]).map((s) => s.url)).toEqual(["https://www.nhs.uk/conditions/hair-loss/", "https://dermnetnz.org/topics/alopecia-areata"]);

    const { BlogPostSchema } = await import("@/content/blog/schema");
    const { rowToPost } = await import("@/lib/blog");
    expect(BlogPostSchema.safeParse(rowToPost(row as never)).success).toBe(true);
  });
});
