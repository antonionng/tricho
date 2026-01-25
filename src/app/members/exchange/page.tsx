import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Search, SlidersHorizontal, Package, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const exchangeItems = [
  {
    id: "1",
    title: "Scalp Analysis Framework",
    type: "Professional Service",
    provider: "Dr. Sarah Mitchell",
    description: "A comprehensive digital framework for clinical scalp assessments, optimized for remote consultations.",
    tag: "Consultation Tool"
  },
  {
    id: "2",
    title: "Eco-Friendly Basin Solutions",
    type: "Brand Resource",
    provider: "PureStream Brands",
    description: "Exclusive member discount on the 2026 water-saving basin range for clinical settings.",
    tag: "Equipment"
  },
  {
    id: "3",
    title: "Client Education Templates",
    type: "Professional Service",
    provider: "Trichollective HQ",
    description: "A set of 12 white-label templates for educating clients on common hair and scalp conditions.",
    tag: "Educational"
  },
  {
    id: "4",
    title: "Nutritional Hair Protocol",
    type: "Professional Service",
    provider: "James Wilson",
    description: "Advanced referral service for complex nutritional hair loss cases.",
    tag: "Referral"
  },
];

export default async function ExchangePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white pt-20 pb-32">
      <div className="container mx-auto px-4">
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8 border-b border-black/5 pb-12">
          <div className="max-w-2xl space-y-4">
            <span className="vogue-caps text-gray-400">Curated Discovery</span>
            <h1 className="text-6xl md:text-8xl vogue-title uppercase tracking-tighter">
              The Exchange
            </h1>
            <p className="text-xl font-serif italic text-gray-500">
              A curated repository of professional services, brand tools, and collective resources.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search resources..." 
                className="pl-10 h-12 rounded-none border-black/10 focus-visible:ring-black w-full sm:w-64"
              />
            </div>
            <Button variant="outline" className="h-12 rounded-none border-black/10 px-6 vogue-caps">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-black/5">
          {exchangeItems.map((item) => (
            <div 
              key={item.id} 
              className="border-r border-b border-black/5 p-12 hover:bg-gray-50 transition-colors group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-12">
                <div className="flex flex-col gap-1">
                  <span className="vogue-caps text-[10px] text-gray-400">{item.type}</span>
                  <span className="vogue-caps text-[9px] bg-black text-white px-2 py-0.5 w-fit">{item.tag}</span>
                </div>
                <ArrowUpRight className="h-5 w-5 opacity-20 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <h3 className="text-3xl vogue-title uppercase mb-4 leading-tight">
                {item.title}
              </h3>
              
              <p className="font-serif text-gray-500 mb-8 text-sm leading-loose">
                {item.description}
              </p>
              
              <div className="mt-auto pt-8 border-t border-black/5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-[8px] font-bold">{item.provider.charAt(0)}</span>
                  </div>
                  <span className="vogue-caps text-[10px] opacity-60">Provided by {item.provider}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Business Call to Action */}
          <div className="border-r border-b border-black/5 p-12 bg-black text-white flex flex-col justify-center space-y-8">
            <span className="vogue-caps opacity-50">Contribute</span>
            <h3 className="text-4xl vogue-title uppercase">List Your <br /> Resource</h3>
            <p className="font-serif italic opacity-60 text-sm leading-loose">
              Business and Trichologist members can propose items for inclusion 
              in The Exchange. All entries are subject to editorial review.
            </p>
            <Button className="vogue-caps bg-white text-black hover:bg-gray-200 rounded-none h-12 w-fit px-8">
              Propose Entry
            </Button>
          </div>
        </div>

        {/* Pagination style footer */}
        <div className="mt-24 flex items-center justify-center gap-12">
          <button className="vogue-caps text-[10px] opacity-30 cursor-not-allowed">Previous Page</button>
          <div className="flex gap-4 items-center">
            <span className="vogue-caps text-xs">Page 1 of 1</span>
          </div>
          <button className="vogue-caps text-[10px] opacity-30 cursor-not-allowed">Next Page</button>
        </div>
      </div>
    </div>
  );
}
