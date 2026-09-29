import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Mic, Play, Download } from "lucide-react";
import Link from "next/link";

export default async function MembersPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userName = session.user?.name || "Member";
  const userRole = session.user?.role || "individual";

  return (
    <div className="min-h-screen bg-[#D1D0CB] pt-12 pb-20">
      <div className="container mx-auto px-4">
        <header className="mb-20 space-y-4">
          <span className="tricho-caps text-black/40">Member Access</span>
          <h1 className="text-5xl md:text-7xl tricho-title uppercase text-black tracking-tighter">
            Welcome, <br /> {userName}
          </h1>
          <p className="tricho-caps text-xs font-bold text-black/60 tracking-widest">{userRole} Status</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
            {/* Magazine Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <h2 className="tricho-caps text-sm flex items-center gap-3">
                  <BookOpen className="h-4 w-4" />
                  Current Circulation
                </h2>
                <Link href="/magazine" className="tricho-caps text-[10px] opacity-40 hover:opacity-100 transition-opacity">The Archive</Link>
              </div>
              <Card className="rounded-none border-black/10 shadow-none bg-transparent overflow-hidden group">
                <div className="aspect-[16/9] bg-black relative group-hover:bg-[#C4C3BE] transition-colors duration-700">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white group-hover:text-black tricho-title text-3xl md:text-5xl uppercase tracking-tighter transition-colors duration-700">JANUARY 2026</span>
                  </div>
                </div>
                <CardContent className="p-8 bg-transparent">
                  <h3 className="text-2xl font-sans font-black uppercase mb-3 tracking-tight">The Science of Scalp Health: 2026 Trends</h3>
                  <p className="text-black/60 font-sans font-medium text-sm mb-6 max-w-xl italic leading-relaxed">Discover the latest research on microbiome care and clinical advancements in trichology.</p>
                  <button className="tricho-caps text-[10px] border-b border-black pb-1 hover:opacity-50 transition-opacity inline-flex items-center gap-2">
                    Open Circulation <Play className="h-2 w-2 fill-current" />
                  </button>
                </CardContent>
              </Card>
            </section>

            {/* Podcast Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <h2 className="tricho-caps text-sm flex items-center gap-3">
                  <Mic className="h-4 w-4" />
                  Recent Dispatches
                </h2>
                <Link href="/podcast" className="tricho-caps text-[10px] opacity-40 hover:opacity-100 transition-opacity">Full Archive</Link>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Episode 42: Navigating Clinical Referrals", duration: "45 min", date: "Jan 15, 2026" },
                  { title: "Episode 41: Ethics in Cosmetic Hair Care", duration: "38 min", date: "Jan 08, 2026" },
                ].map((ep, i) => (
                  <Card key={i} className="rounded-none border-black/10 shadow-none bg-transparent hover:bg-white/30 transition-colors">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-black flex items-center justify-center">
                          <Play className="h-4 w-4 text-white fill-current" />
                        </div>
                        <div>
                          <h4 className="font-sans font-black uppercase text-sm tracking-tight">{ep.title}</h4>
                          <p className="tricho-caps text-[10px] opacity-40 mt-1 font-bold">{ep.date} • {ep.duration}</p>
                        </div>
                      </div>
                      <button className="text-black/30 hover:text-black transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-12">
            {/* Upcoming Events/Zooms */}
            <Card className="rounded-none border-none shadow-none bg-black text-[#D1D0CB]">
              <CardHeader className="p-8">
                <CardTitle className="tricho-caps text-xs opacity-50">Upcoming Education</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-10">
                <div className="space-y-2">
                  <p className="tricho-caps text-[9px] font-black text-white/40 mb-2">Live Zoom • Feb 05</p>
                  <h4 className="font-sans font-black uppercase text-lg leading-tight">Advanced Consultation Techniques</h4>
                  <p className="tricho-caps text-[10px] font-bold text-white/30 mt-2 italic">Exclusive for Professionals</p>
                </div>
                <div className="space-y-2">
                  <p className="tricho-caps text-[9px] font-black text-white/40 mb-2">Annual Event • June 12</p>
                  <h4 className="font-sans font-black uppercase text-lg leading-tight">The Trichollective Summit 2026</h4>
                  <p className="tricho-caps text-[10px] font-bold text-white/30 mt-2 italic">London, UK • Open for Registration</p>
                </div>
                <Button className="tricho-caps w-full bg-white text-black hover:bg-gray-200 rounded-none h-14 font-black">
                  View Registry
                </Button>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="space-y-6">
              <h3 className="tricho-caps text-[10px] font-black text-black/40 border-b border-black/10 pb-4">Collective Access</h3>
              <div className="flex flex-col space-y-2">
                <Link href="/members/assistant" className="tricho-caps text-sm py-4 border-b border-black/5 hover:opacity-50 transition-opacity flex justify-between">
                  <span>Tricho-AI Assistant</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/members/community" className="tricho-caps text-sm py-4 border-b border-black/5 hover:opacity-50 transition-opacity flex justify-between">
                  <span>The Hub</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/members/exchange" className="tricho-caps text-sm py-4 border-b border-black/5 hover:opacity-50 transition-opacity flex justify-between">
                  <span>The Exchange</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/members/profile" className="tricho-caps text-sm py-4 border-b border-black/5 hover:opacity-50 transition-opacity flex justify-between">
                  <span>Your Directory Listing</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/directory" className="tricho-caps text-sm py-4 hover:opacity-50 transition-opacity flex justify-between">
                  <span>The Directory</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);
