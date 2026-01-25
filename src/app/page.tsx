import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpen, Mic, Users, Calendar, Minus, AlertTriangle, Network, FileText, Check } from "lucide-react";

const AlertIcon = AlertTriangle;
const NetworkIcon = Network;
const FileIcon = FileText;
const CheckIcon = Check;

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#D1D0CB]">
      {/* Hero Section - Brand Style */}
      <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden bg-[#D1D0CB] border-b border-black/10">
        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="flex flex-col items-center text-center space-y-8 md:space-y-12">
            <div className="flex items-center gap-3 md:gap-4 text-black">
              <Minus className="h-4 w-6 md:w-8" />
              <span className="tricho-caps text-[10px] md:text-xs mr-[-0.2em]">Collective Awareness</span>
              <Minus className="h-4 w-6 md:w-8" />
            </div>
            
            <h1 className="text-6xl sm:text-8xl md:text-[10vw] lg:text-[12vw] tricho-title uppercase text-black max-w-full tracking-tighter flex flex-wrap justify-center">
              <span className="text-black">Tricho</span>
              <span className="text-[#6A6A6A]">llective</span>
              <span className="text-[#6A6A6A]">.</span>
            </h1>
            
            <p className="text-base md:text-xl font-sans font-medium text-black/60 max-w-2xl leading-relaxed px-4">
              An ecosystem connecting cosmetic, clinical, and medical hair professionals.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full pt-8">
              <Link 
                href="/join" 
                className="tricho-caps text-sm border-b-2 border-black pb-1 hover:opacity-50 transition-opacity"
              >
                Become a Member
              </Link>
              <Link 
                href="/directory" 
                className="tricho-caps text-sm border-b-2 border-black pb-1 hover:opacity-50 transition-opacity"
              >
                Browse Directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 bg-[#D1D0CB]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-8">
              <span className="tricho-caps text-black/40">Our Vision</span>
              <h2 className="text-5xl md:text-7xl tricho-title uppercase leading-tight">
                Raising <br /> Standards <br /> through <br /> Collaboration.
              </h2>
            </div>
            <div className="space-y-8 text-lg font-sans font-medium text-black/70 leading-relaxed">
              <p>
                The Trichollective is more than a platform; it's a movement towards ethical, 
                evidence-based hair and scalp care. By bridging the gap between 
                cosmetic artistry and medical science, we ensure better outcomes 
                for professionals and patients alike.
              </p>
              <p>
                From monthly digital publications to biannual summits, we provide 
                the tools, education, and network required to lead in a complex 
                and evolving industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Areas - Brand Contrast */}
      <section className="bg-black text-[#D1D0CB] py-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-square flex flex-col justify-center p-12 lg:p-24 border-b md:border-b-0 md:border-r border-white/10 group cursor-pointer hover:bg-[#D1D0CB] hover:text-black transition-colors duration-700">
            <span className="tricho-caps opacity-50 mb-8">Editorial</span>
            <h3 className="text-4xl lg:text-6xl tricho-title uppercase mb-6">The <br /> Gazette</h3>
            <p className="font-sans font-medium opacity-70 mb-12 max-w-md">Monthly circulations of clinical research, business growth, and ethical practices.</p>
            <ArrowRight className="h-8 w-8" />
          </div>
          <div className="aspect-square flex flex-col justify-center p-12 lg:p-24 border-b border-white/10 group cursor-pointer hover:bg-[#D1D0CB] hover:text-black transition-colors duration-700">
            <span className="tricho-caps opacity-50 mb-8">Auditory</span>
            <h3 className="text-4xl lg:text-6xl tricho-title uppercase mb-6">The Audio <br /> Dispatch</h3>
            <p className="font-sans font-medium opacity-70 mb-12 max-w-md">Interviews with the minds shaping the future of trichology and medical hair care.</p>
            <ArrowRight className="h-8 w-8" />
          </div>
        </div>
      </section>

      {/* B2B Section */}
      <section className="bg-black text-[#D1D0CB] py-32 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <span className="tricho-caps opacity-50 mb-4 block">Industry & Brands</span>
          <h2 className="text-5xl md:text-8xl tricho-title uppercase mb-12">The B2B Collective</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <div className="space-y-4">
              <h4 className="tricho-caps text-sm border-b border-[#D1D0CB]/20 pb-2">Advanced Registry</h4>
              <p className="font-sans text-sm opacity-70 leading-relaxed">
                Exclusive professional directory listings and advanced industry signposting for premium brand partners.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="tricho-caps text-sm border-b border-[#D1D0CB]/20 pb-2">Strategic Education</h4>
              <p className="font-sans text-sm opacity-70 leading-relaxed">
                Advanced clinical education modules and brand-partnered training sessions for the collective.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="tricho-caps text-sm border-b border-[#D1D0CB]/20 pb-2">Industry Content</h4>
              <p className="font-sans text-sm opacity-70 leading-relaxed">
                B2B-only resources, market trend reporting, and aggregate research insights for scaled growth.
              </p>
            </div>
          </div>
          <div className="mt-16">
            <Button className="tricho-caps rounded-none bg-[#D1D0CB] text-black hover:bg-white transition-all px-12 py-6 h-auto border-none">
              Explore B2B Partnerships
            </Button>
          </div>
        </div>
      </section>

      {/* Tiers Section - Minimalist */}
      <section className="py-32 bg-[#D1D0CB]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center mb-24">
            <span className="tricho-caps mb-4">Membership</span>
            <h2 className="text-5xl tricho-title uppercase">The Tiers</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/10">
            {/* Individual */}
            <div className="p-12 flex flex-col items-center text-center space-y-8">
              <h3 className="tricho-caps text-xl">Individual</h3>
              <p className="text-4xl font-sans font-black">£4.99<span className="text-base font-medium opacity-60">/month</span></p>
              <ul className="space-y-4 font-sans font-medium text-black/50 text-sm">
                <li>The Digital Gazette</li>
                <li>The Audio Archive</li>
                <li>Community Access</li>
                <li>Monthly Zoom Education</li>
              </ul>
              <Button variant="outline" className="tricho-caps rounded-none border-black hover:bg-black hover:text-[#D1D0CB] transition-all px-8 py-6 h-auto">Register</Button>
            </div>

            {/* Trichologist */}
            <div className="p-12 flex flex-col items-center text-center space-y-8 bg-black text-[#D1D0CB] md:scale-105 shadow-2xl z-10 border border-white/10">
              <h3 className="tricho-caps text-xl">Trichologist</h3>
              <p className="text-4xl font-sans font-black">£9.99<span className="text-base font-medium opacity-60">/month</span></p>
              <ul className="space-y-4 font-sans font-medium opacity-80 text-sm">
                <li>All Individual Access</li>
                <li>25% Off Event Tickets</li>
                <li>Directory Listing</li>
                <li>Professional Networking</li>
              </ul>
              <Button className="tricho-caps rounded-none bg-[#D1D0CB] text-black px-8 py-6 h-auto hover:bg-white transition-colors">Apply Now</Button>
            </div>

            {/* Business */}
            <div className="p-12 flex flex-col items-center text-center space-y-8">
              <h3 className="tricho-caps text-xl">Business</h3>
              <p className="text-2xl font-sans font-black">From £150<span className="text-sm font-medium opacity-60">/month</span></p>
              <ul className="space-y-4 font-serif text-black/50 text-sm">
                <li>Circulation Features</li>
                <li>Registry Exhibition</li>
                <li>Speaking Opportunities</li>
                <li>Audio Dispatch Partnerships</li>
              </ul>
              <Button variant="outline" className="tricho-caps rounded-none border-black hover:bg-black hover:text-[#D1D0CB] transition-all px-8 py-6 h-auto">Enquire</Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section - Expanded */}
      <section className="py-32 bg-black text-[#D1D0CB]">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-20 space-y-6">
            <span className="tricho-caps opacity-50 block">Clinical Intelligence</span>
            <h2 className="text-6xl md:text-9xl tricho-title uppercase tracking-tighter">Tricho-AI</h2>
            <p className="text-xl md:text-2xl font-sans font-medium opacity-60 max-w-3xl mx-auto leading-relaxed">
              AI-powered symptom analysis that helps identify the right specialists for your hair and scalp concerns.
            </p>
          </div>

          {/* Dual Value Proposition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-20 border border-white/10">
            {/* Consumer Side */}
            <div className="p-12 lg:p-16 border-b md:border-b-0 md:border-r border-white/10 space-y-8">
              <div className="space-y-2">
                <span className="tricho-caps text-xs opacity-40">For Individuals</span>
                <h3 className="text-3xl md:text-4xl tricho-title uppercase">Understand Your Symptoms</h3>
              </div>
              <p className="font-sans text-lg opacity-70 leading-relaxed">
                Not sure who to see about your hair or scalp concerns? Our AI guides you through a simple questionnaire and suggests the right type of specialist.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <span className="font-sans font-bold block mb-1">Describe Your Symptoms</span>
                    <span className="font-sans text-sm opacity-50">Answer guided questions about your hair and scalp</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <span className="font-sans font-bold block mb-1">Get Educational Insights</span>
                    <span className="font-sans text-sm opacity-50">Learn what your symptoms might indicate (not a diagnosis)</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <div>
                    <span className="font-sans font-bold block mb-1">Find the Right Specialist</span>
                    <span className="font-sans text-sm opacity-50">Trichologist, dermatologist, endocrinologist, or GP</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Professional Side */}
            <div className="p-12 lg:p-16 space-y-8">
              <div className="space-y-2">
                <span className="tricho-caps text-xs opacity-40">For Trichologists</span>
                <h3 className="text-3xl md:text-4xl tricho-title uppercase">Clinical Decision Support</h3>
              </div>
              <p className="font-sans text-lg opacity-70 leading-relaxed">
                Enhance your consultations with AI-powered tools that help identify red flags, suggest referral pathways, and generate structured reports.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/10 flex items-center justify-center shrink-0">
                    <AlertIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-sans font-bold block mb-1">Red Flag Detection</span>
                    <span className="font-sans text-sm opacity-50">Automatic alerts for symptoms requiring urgent referral</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/10 flex items-center justify-center shrink-0">
                    <NetworkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-sans font-bold block mb-1">Referral Pathways</span>
                    <span className="font-sans text-sm opacity-50">Suggested specialists based on symptom patterns</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/10 flex items-center justify-center shrink-0">
                    <FileIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-sans font-bold block mb-1">Consultation Summaries</span>
                    <span className="font-sans text-sm opacity-50">Structured reports for client education and records</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Interactive Demo */}
          <div className="border border-white/10 p-8 md:p-12">
            <div className="text-center mb-12">
              <span className="tricho-caps text-xs opacity-40 block mb-2">Live Demo</span>
              <h4 className="text-2xl md:text-3xl tricho-title uppercase">See How It Works</h4>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Step 1: Input */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#D1D0CB] text-black flex items-center justify-center font-black">1</div>
                  <span className="tricho-caps text-xs">Symptom Input</span>
                </div>
                <div className="bg-white/5 p-6 border border-white/10 space-y-4 min-h-[200px]">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="font-mono text-[10px] opacity-50">SYMPTOM ENTRY</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-3 h-3 text-green-400" />
                      <span className="font-mono text-xs ai-typing">Diffuse thinning (6 months)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-3 h-3 text-green-400" />
                      <span className="font-mono text-xs ai-typing-delay-1">Scalp sensitivity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-3 h-3 text-green-400" />
                      <span className="font-mono text-xs ai-typing-delay-2">Fatigue reported</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-40">
                      <div className="w-3 h-3 border border-white/30" />
                      <span className="font-mono text-xs ai-typing-delay-3">Recent stress event</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Analysis */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#D1D0CB] text-black flex items-center justify-center font-black">2</div>
                  <span className="tricho-caps text-xs">AI Analysis</span>
                </div>
                <div className="bg-white/5 p-6 border border-white/10 space-y-4 min-h-[200px]">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 ai-analyzing" />
                    <span className="font-mono text-[10px] opacity-50">PROCESSING</span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#D1D0CB] w-full ai-progress" />
                    </div>
                    <div className="font-mono text-[10px] opacity-50 space-y-1">
                      <div className="ai-fade-in">Analyzing symptom patterns...</div>
                      <div className="ai-fade-in-delay-1">Cross-referencing clinical database...</div>
                      <div className="ai-fade-in-delay-2">Identifying potential causes...</div>
                      <div className="ai-fade-in-delay-3">Generating referral suggestions...</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Output */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#D1D0CB] text-black flex items-center justify-center font-black">3</div>
                  <span className="tricho-caps text-xs">Referral Output</span>
                </div>
                <div className="bg-white/5 p-6 border border-white/10 space-y-4 min-h-[200px]">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="font-mono text-[10px] opacity-50">RECOMMENDATIONS</span>
                  </div>
                  <div className="space-y-3 ai-results-fade">
                    <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-500/30">
                      <span className="tricho-caps text-[9px] text-red-400">Urgent</span>
                      <span className="font-mono text-xs">Blood Panel (Ferritin, Thyroid)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5">
                      <span className="tricho-caps text-[9px] opacity-50">Refer</span>
                      <span className="font-mono text-xs">Endocrinologist</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5">
                      <span className="tricho-caps text-[9px] opacity-50">Refer</span>
                      <span className="font-mono text-xs">Dermatologist</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-12 p-6 border border-white/10 bg-white/5 text-center">
              <p className="font-sans text-sm opacity-50 italic">
                Tricho-AI provides educational guidance and signposting only. It is not a diagnostic tool and does not replace professional medical advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-[#D1D0CB] border-t border-black/5">
        <div className="container mx-auto px-4 text-center space-y-12">
          <h2 className="text-4xl md:text-6xl tricho-title uppercase tracking-tighter">
            <span className="text-black">Tricho</span>
            <span className="text-[#6A6A6A]">llective</span>
            <span className="text-[#6A6A6A]">.</span>
          </h2>
          <div className="flex justify-center gap-12">
            <Link href="#" className="tricho-caps text-xs opacity-50 hover:opacity-100 transition-opacity">Instagram</Link>
            <Link href="#" className="tricho-caps text-xs opacity-50 hover:opacity-100 transition-opacity">LinkedIn</Link>
            <Link href="#" className="tricho-caps text-xs opacity-50 hover:opacity-100 transition-opacity">Spotify</Link>
          </div>
          <p className="tricho-caps text-[10px] opacity-30">
            © 2026 The Trichollective Collective Awareness. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
