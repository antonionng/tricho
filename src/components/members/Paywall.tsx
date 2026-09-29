import Link from "next/link";
import { Button } from "@/components/ui/button";
import { flagshipTier } from "@/config/subscriptions";

export function Paywall({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#D1D0CB] flex items-center justify-center px-4">
      <div className="max-w-lg text-center space-y-8">
        <span className="tricho-caps text-black/40">Members Only</span>
        <h1 className="text-5xl tricho-title uppercase tracking-tighter">{title}</h1>
        <p className="font-sans font-medium text-black/60">
          {body} Included with Membership at £{flagshipTier.price}/month.
        </p>
        <Button
          asChild
          className="tricho-caps rounded-none bg-black text-[#D1D0CB] h-14 px-10 hover:bg-black/80"
        >
          <Link href="/join">Become a Member</Link>
        </Button>
      </div>
    </div>
  );
}
