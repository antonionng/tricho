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
        body="Member resources, services, and brand tools live here."
      />
    );
  }

  const items = await prisma.exchangeItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="min-h-screen bg-[#D1D0CB] pt-16 pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-14 space-y-4 max-w-2xl">
          <span className="tricho-caps text-black/40">Curated discovery</span>
          <h1 className="text-6xl md:text-8xl tricho-title uppercase tracking-tighter">
            The Exchange
          </h1>
          <p className="font-sans font-medium text-black/60">
            Tools, referral services, and exhibitor resources shared inside the membership.
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          <div className="grid sm:grid-cols-2 gap-4">
            {items.length === 0 && (
              <div className="sm:col-span-2 border border-black/10 bg-white/40 p-10">
                <p className="font-sans text-black/70">
                  No resources listed yet. Propose the first one.
                </p>
              </div>
            )}
            {items.map((item) => (
              <article key={item.id} className="border border-black/10 bg-white/40 p-8 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="tricho-caps text-[10px] text-black/40">
                    {TYPE_LABEL[item.type] || item.type}
                  </span>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" aria-label="Open link">
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <h2 className="text-2xl tricho-title uppercase leading-tight">{item.title}</h2>
                <p className="font-sans text-sm text-black/70 leading-relaxed">{item.description}</p>
              </article>
            ))}
          </div>

          <form
            action={proposeExchangeItem}
            className="border border-black bg-black text-[#D1D0CB] p-6 space-y-4 h-fit"
          >
            <p className="tricho-caps text-[10px] opacity-60">Propose an entry</p>
            <h2 className="text-3xl tricho-title uppercase">List a resource</h2>
            <input
              name="title"
              required
              placeholder="Title"
              className="w-full h-11 px-3 bg-transparent border border-white/20 text-sm outline-none"
            />
            <select
              name="type"
              className="w-full h-11 px-3 bg-black border border-white/20 text-sm outline-none"
              defaultValue="professional_service"
            >
              <option value="professional_service">Professional service</option>
              <option value="brand_tool">Brand resource</option>
            </select>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="What it is, and who it is for."
              className="w-full p-3 bg-transparent border border-white/20 text-sm outline-none resize-y"
            />
            <input
              name="link"
              placeholder="Link (optional)"
              className="w-full h-11 px-3 bg-transparent border border-white/20 text-sm outline-none"
            />
            <Button
              type="submit"
              className="tricho-caps w-full rounded-none bg-[#D1D0CB] text-black h-12"
            >
              Publish
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
