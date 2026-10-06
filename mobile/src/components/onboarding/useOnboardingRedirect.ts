import { useEffect } from "react";
import { router } from "expo-router";
import { useMe } from "@/lib/me";

// Once per launch, so a member who leaves onboarding part way can still use the app.
let sent = false;

/**
 * Sends a member who hasn't finished onboarding to the first-run steps, once,
 * the way the website's home page sends them to /members/onboarding. Call it
 * from the Home tab.
 */
export function useOnboardingRedirect() {
  const { data } = useMe();
  const needed = !!data?.user && data.access.onboarded === false;
  useEffect(() => {
    if (!needed || sent) return;
    sent = true;
    router.push("/onboarding");
  }, [needed]);
}
