import { requireConsumer } from "@/lib/consumer-session";
import { ConsumerAvatar } from "@/components/hub/ConsumerAvatar";
import { newAlias, newAvatar } from "../actions";
import { ProfileForm } from "./ProfileForm";
import { DeleteAccountForm } from "./DeleteAccountForm";

export const metadata = { title: "Your profile" };

export default async function HubProfilePage() {
  const me = await requireConsumer();
  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <section className="space-y-3">
        <h1 className="display text-4xl sm:text-5xl">Your profile is yours to shape.</h1>
        <p className="lede">
          Choose how other people on Trichollective see you. Our team can always see your real name and email, so we can help you
          if you get in touch.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border border-rule bg-card p-6">
        <div className="flex items-center gap-4">
          <ConsumerAvatar seed={me.profile.avatarSeed} size={72} />
          <div className="space-y-1">
            <p className="text-sm text-ink-2">Your alias is</p>
            <p className="text-xl font-semibold text-ink">{me.profile.alias}</p>
          </div>
        </div>
        <p className="text-[15px] text-ink-2">
          Your alias and picture were chosen at random, so they say nothing about who you are. You can pick new ones whenever you
          like.
        </p>
        <div className="flex flex-wrap gap-3">
          <form action={newAlias}>
            <button type="submit" className="rounded-full border border-rule px-4 py-2 text-sm text-ink hover:border-ink">
              Choose a new alias
            </button>
          </form>
          <form action={newAvatar}>
            <button type="submit" className="rounded-full border border-rule px-4 py-2 text-sm text-ink hover:border-ink">
              Choose a new picture
            </button>
          </form>
        </div>
      </section>

      <ProfileForm firstName={me.user.name ?? ""} displayMode={me.profile.displayMode} alias={me.profile.alias} />

      <section className="space-y-4 border-t border-rule pt-10">
        <h2 className="text-xl font-semibold text-ink">You can delete your account at any time.</h2>
        <p className="text-[15px] text-ink-2">
          Deleting your account removes your profile, your saved professionals and your settings straight away. Enquiries you have
          already sent stay with the professionals who received them, because they need them to reply, but they will no longer be
          linked to an account. You may want to download your data first from your settings.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
