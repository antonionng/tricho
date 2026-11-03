import { HubShell } from "@/components/hub/HubShell";
import { requireConsumer } from "@/lib/consumer-session";
import { consumerPublicName } from "@/lib/consumer";
import { HUB_LABEL } from "@/config/consumer";
import { signOutAction } from "./actions";

export const metadata = { title: HUB_LABEL, robots: { index: false, follow: false } };

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const me = await requireConsumer();
  return (
    <HubShell displayName={consumerPublicName(me.profile, me.user)} avatarSeed={me.profile.avatarSeed} signOut={signOutAction}>
      {children}
    </HubShell>
  );
}
