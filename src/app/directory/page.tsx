import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, Star, Verified } from "lucide-react";
import Image from "next/image";

// Mock data for initial directory
const trichologists = [
  {
    id: "1",
    name: "Dr. Sarah Mitchell",
    specialization: "Clinical Trichology",
    location: "London, UK",
    image: "https://images.unsplash.com/photo-1559839734-2b71f1e3c770?q=80&w=200&h=200&auto=format&fit=crop",
    isVerified: true,
  },
  {
    id: "2",
    name: "James Wilson",
    specialization: "Hair Loss Specialist",
    location: "Manchester, UK",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&h=200&auto=format&fit=crop",
    isVerified: true,
  },
  {
    id: "3",
    name: "Emma Thompson",
    specialization: "Scalp Health & Nutrition",
    location: "Edinburgh, UK",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=200&h=200&auto=format&fit=crop",
    isVerified: false,
  },
];

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-[#D1D0CB]">
      {/* Header */}
      <section className="py-20 border-b border-black/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <span className="tricho-caps text-black/40">The Professional Network</span>
            <h1 className="text-5xl md:text-7xl tricho-title uppercase text-black tracking-tighter">The Directory</h1>
            <p className="text-lg font-sans font-medium text-black/60 mb-8 max-w-2xl mx-auto italic">
              Find qualified hair and scalp professionals near you. Verified by the Trichollective.
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />
              <Input 
                placeholder="Search by name, specialization, or location..." 
                className="pl-12 h-14 rounded-none border-black/20 focus-visible:ring-black bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Directory List */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trichologists.map((pro) => (
              <Card key={pro.id} className="border border-black/10 rounded-none shadow-none hover:bg-white/50 transition-colors bg-transparent group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex p-8 gap-6">
                    <div className="relative h-24 w-24 shrink-0">
                      <Image
                        src={pro.image}
                        alt={pro.name}
                        fill
                        className="rounded-none object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      />
                    </div>
                    <div className="flex-grow space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-sans font-black text-xl uppercase tracking-tight leading-none">{pro.name}</h3>
                        {pro.isVerified && <Verified className="h-4 w-4 text-black" />}
                      </div>
                      <p className="tricho-caps text-[10px] text-black/50 font-bold">{pro.specialization}</p>
                      <div className="flex items-center text-black/40 text-xs font-sans font-bold">
                        <MapPin className="h-3 w-3 mr-1" />
                        {pro.location}
                      </div>
                    </div>
                  </div>
                  <div className="px-8 pb-8 pt-4 flex items-center justify-between border-t border-black/5">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-black fill-current" />
                      <span className="text-xs font-black">4.9</span>
                      <span className="text-[10px] text-black/30 font-bold uppercase tracking-wider ml-1">24 reviews</span>
                    </div>
                    <Button variant="ghost" size="sm" className="tricho-caps text-[10px] hover:bg-black hover:text-white rounded-none transition-all">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-20 text-center space-y-8">
            <p className="tricho-caps text-xs text-black/40">Are you a hair professional? Join our registry.</p>
            <Button asChild variant="outline" className="tricho-caps rounded-none border-black hover:bg-black hover:text-[#D1D0CB] px-8 py-6 h-auto">
              <a href="/join">Register as a Trichologist</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
