import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/members/Paywall";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { proposeExchangeItem } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  professional_service: "Professional service",
  brand_tool: "Brand resource",
};

export default async function ExchangePage() {
  const ctx = await getMemberContext();
  if (!ctx.session) redirect("/login");
  if (!ctx.allowed) {
    return (
      <Paywall
        title="The Exchange"
        body="Member resources and brand tools live here."
      />
    );
  }

  const items = await prisma.exchangeItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-10 space-y-2 max-w-2xl">
        <p className="tricho-caps text-foreground/40">Exchange</p>
        <h1 className="tricho-title text-4xl">Shared tools</h1>
        <p className="text-muted-foreground">
          Resources, referral services, and exhibitor tools from inside the membership.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="grid sm:grid-cols-2 gap-4">
          {items.length === 0 && (
            <div className="sm:col-span-2 rounded-2xl border border-border/50 bg-card p-8 text-sm text-muted-foreground">
              No resources listed yet.
            </div>
          )}
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border/50 bg-card p-6 space-y-3 shadow-sm"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs text-muted-foreground">
                  {TYPE_LABEL[item.type] || item.type}
                </span>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" aria-label="Open link">
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
              </div>
              <h2 className="text-xl font-semibold tracking-tight">{item.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </article>
          ))}
        </div>

        <form
          action={proposeExchangeItem}
          className="rounded-2xl bg-primary text-primary-foreground p-6 space-y-4 h-fit"
        >
          <p className="text-xs uppercase tracking-wide opacity-70">Propose an entry</p>
          <h2 className="tricho-title text-2xl">List a resource</h2>
          <input
            name="title"
            required
            placeholder="Title"
            className="w-full h-11 px-3 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-sm outline-none placeholder:text-primary-foreground/50"
          />
          <select
            name="type"
            defaultValue="professional_service"
            className="w-full h-11 px-3 rounded-xl bg-primary border border-primary-foreground/20 text-sm"
          >
            <option value="professional_service">Professional service</option>
            <option value="brand_tool">Brand resource</option>
          </select>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="What it is, and who it is for."
            className="w-full p-3 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-sm outline-none resize-y placeholder:text-primary-foreground/50"
          />
          <input
            name="link"
            placeholder="Link (optional)"
            className="w-full h-11 px-3 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-sm outline-none placeholder:text-primary-foreground/50"
          />
          <Button
            type="submit"
            className="w-full rounded-2xl h-11 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            Publish
          </Button>
        </form>
      </div>
    </div>
  );
}
