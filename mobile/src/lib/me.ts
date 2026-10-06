import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type Me = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    isFounding: boolean;
    chapter: { slug: string; city: string; country: string } | null;
  } | null;
  access: {
    member: boolean;
    professional: boolean;
    consultation: boolean;
    admin: boolean;
    business: boolean;
    onboarded: boolean;
    muted: string | null;
    profession: string | null;
    plan: string | null;
  };
  membership: {
    isActive: boolean;
    tierId?: string;
    tierName?: string;
    currentPeriodEnd?: string | null;
    via?: string;
    complimentary?: boolean;
    /** "app_store" | "play_store" | "web" | "team" | null */
    managedIn: string | null;
  };
  counts: { notifications: number; messages: number; referrals: number };
};

export const meKey = ["me"] as const;

/** The signed-in member, their access and the badge counts. */
export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: () => api<Me>("me"), staleTime: 15_000 });
}
