import { requireConsumer } from "@/lib/consumer-session";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Your settings" };

export default async function HubSettingsPage() {
  const me = await requireConsumer();
  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <section className="space-y-3">
        <h1 className="display text-4xl sm:text-5xl">You decide what we keep and what we send.</h1>
        <p className="lede">
          News from us and anything about your health stay off until you turn them on, and you can change your mind at any time.
        </p>
      </section>

      <SettingsForm
        marketing={me.user.emailUpdates}
        activity={me.user.emailActivity}
        healthConsent={!!me.profile.healthDataConsentAt}
        concerns={me.profile.concerns}
        region={me.profile.region ?? ""}
        country={me.profile.country ?? ""}
      />

      <section className="space-y-3 border-t border-rule pt-10">
        <h2 className="text-xl font-semibold text-ink">You can download everything we hold about you.</h2>
        <p className="text-[15px] text-ink-2">
          The download is a file with your account details, your choices, your saved professionals and the enquiries you have sent.
        </p>
        <a href="/hub/export" className="inline-flex rounded-full border border-rule px-4 py-2 text-sm text-ink hover:border-ink">
          Download my data
        </a>
      </section>
    </div>
  );
}
