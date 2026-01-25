"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { subscriptionTiers } from "@/config/subscriptions";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const onSubscribe = async (priceId: string | undefined) => {
    if (!priceId) return;
    try {
      setLoading(priceId);
      const response = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-20 px-4">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-bold mb-4">Choose Your Membership</h1>
        <p className="text-gray-600">
          Join the Trichollective today and gain access to exclusive content, events, and a community of hair professionals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {subscriptionTiers.map((tier) => (
          <Card key={tier.id} className="flex flex-col border-brand-gold/20 shadow-sm">
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-black">£{tier.price}</span>
                <span className="text-gray-500">/{tier.interval}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-brand-gold mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => onSubscribe(tier.stripePriceId)}
                disabled={loading !== null}
                className="w-full bg-brand-gold text-white hover:bg-brand-gold/90"
              >
                {loading === tier.stripePriceId ? "Loading..." : `Join as ${tier.name}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
