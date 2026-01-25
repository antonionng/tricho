import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function CommunityHubPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userRole = session.user?.role || "individual";

  return (
    <div className="min-h-screen bg-white pt-20 pb-32">
      <div className="container mx-auto px-4">
        {/* Editorial Header */}
        <div className="max-w-4xl mx-auto text-center mb-24 space-y-8">
          <span className="vogue-caps text-gray-400">The Collective Network</span>
          <h1 className="text-6xl md:text-8xl vogue-title uppercase tracking-tighter">
            The Hub
          </h1>
          <p className="text-xl font-serif italic text-gray-500 max-w-2xl mx-auto">
            A private space for discourse, referrals, and professional consultation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* General Lounge - All Members */}
          <Card className="rounded-none border-black/5 shadow-none group cursor-pointer hover:bg-gray-50 transition-colors h-full flex flex-col">
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start mb-6">
                <MessageSquare className="h-6 w-6" />
                <span className="vogue-caps text-[10px] bg-black text-white px-2 py-1">Open Access</span>
              </div>
              <CardTitle className="text-3xl vogue-title uppercase">The Lounge</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex-grow">
              <p className="font-serif text-gray-500 mb-8 leading-relaxed">
                General discussion, awareness journeys, and community support for all members of the collective.
              </p>
              <div className="mt-auto pt-8 border-t border-black/5 flex items-center justify-between">
                <span className="vogue-caps text-xs">Enter Space</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-2 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* The Consultation Room - Trichologists Only */}
          <Card className={`rounded-none border-black/5 shadow-none h-full flex flex-col ${userRole !== 'trichologist' && userRole !== 'admin' ? 'opacity-50' : 'group cursor-pointer hover:bg-gray-50 transition-colors'}`}>
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start mb-6">
                <Lock className="h-6 w-6" />
                <span className="vogue-caps text-[10px] border border-black px-2 py-1">Trichologists Only</span>
              </div>
              <CardTitle className="text-3xl vogue-title uppercase">The Consultation Room</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex-grow">
              <p className="font-serif text-gray-500 mb-8 leading-relaxed">
                Advanced clinical discourse, referral networking, and ethical business collaboration for hair professionals.
              </p>
              {userRole === 'trichologist' || userRole === 'admin' ? (
                <div className="mt-auto pt-8 border-t border-black/5 flex items-center justify-between">
                  <span className="vogue-caps text-xs">Enter Space</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-2 transition-transform" />
                </div>
              ) : (
                <div className="mt-auto pt-8 border-t border-black/5">
                  <span className="vogue-caps text-[10px] text-gray-400">Requires Trichologist Tier</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Member Directory - Peers */}
          <Card className="rounded-none border-black/5 shadow-none group cursor-pointer hover:bg-gray-50 transition-colors h-full flex flex-col">
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start mb-6">
                <Users className="h-6 w-6" />
                <span className="vogue-caps text-[10px] bg-black text-white px-2 py-1">Peer Access</span>
              </div>
              <CardTitle className="text-3xl vogue-title uppercase">Peer Connect</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex-grow">
              <p className="font-serif text-gray-500 mb-8 leading-relaxed">
                Connect with other members, find collaboration partners, and manage your private profile.
              </p>
              <div className="mt-auto pt-8 border-t border-black/5 flex items-center justify-between">
                <span className="vogue-caps text-xs">Browse Registry</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-2 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Community Guidelines Footer */}
        <div className="mt-32 max-w-2xl mx-auto text-center">
          <hr className="border-black/10 mb-12" />
          <h4 className="vogue-caps text-xs mb-4">A Note on Discourse</h4>
          <p className="font-serif italic text-gray-400 text-sm leading-loose">
            The Trichollective is built on trust and evidence. All communications 
            must remain ethical, professional, and supportive of the collective's 
            vision for better hair and scalp care.
          </p>
        </div>
      </div>
    </div>
  );
}
