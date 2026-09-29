import { JoinPlans } from "./JoinPlans";
import { subscriptionTiers } from "@/config/subscriptions";

export default function JoinPage() {
  const tiers = subscriptionTiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    price: tier.price,
    interval: tier.interval,
    featured: tier.featured,
    tagline: tier.tagline,
    features: tier.features,
    stripePriceId: tier.stripePriceId,
  }));

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <p className="tricho-caps text-foreground/40">Membership</p>
          <h1 className="tricho-title text-4xl md:text-6xl">Join the collective</h1>
          <p className="text-muted-foreground leading-relaxed font-medium">
            One membership for cosmetic, clinical, and medical professionals. Private rooms,
            Learn, a directory listing, and Tricho-AI. Brands use the Business plans below.
          </p>
        </div>

        <JoinPlans tiers={tiers} />
      </div>
    </div>
  );
}
