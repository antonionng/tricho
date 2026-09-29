import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/members/Paywall";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { saveProfile } from "./actions";

export default async function ProfilePage() {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login");
  if (!ctx.allowed) {
    return (
      <Paywall
        title="Your listing"
        body="A public directory profile is part of membership."
      />
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    include: { profile: true },
  });
  if (!user) redirect("/login");

  const fields = [
    { name: "name", label: "Name", value: user.name ?? "", placeholder: "Dr. Jane Adeyemi" },
    {
      name: "specialization",
      label: "Specialisation",
      value: user.profile?.specialization ?? "",
      placeholder: "Clinical trichology, hair loss",
    },
    {
      name: "location",
      label: "Location",
      value: user.profile?.location ?? "",
      placeholder: "London, UK",
    },
    {
      name: "website",
      label: "Website",
      value: user.profile?.website ?? "",
      placeholder: "https://",
    },
    {
      name: "phone",
      label: "Phone (kept off the public directory)",
      value: user.profile?.phone ?? "",
      placeholder: "+44",
    },
  ];

  return (
    <div className="min-h-screen bg-[#D1D0CB] pt-16 pb-24">
      <div className="container mx-auto px-4 max-w-xl space-y-10">
        <header className="space-y-3">
          <span className="tricho-caps text-black/40">Public listing</span>
          <h1 className="text-5xl tricho-title uppercase tracking-tighter">Your profile</h1>
          <p className="font-sans text-sm text-black/60">
            This is what clients and peers see in the Directory. Verification is added by the
            Trichollective team.
          </p>
        </header>

        <form action={saveProfile} className="space-y-5 border border-black/10 bg-white/40 p-6">
          {fields.map((field) => (
            <label key={field.name} className="block space-y-2">
              <span className="tricho-caps text-[10px] text-black/50">{field.label}</span>
              <input
                name={field.name}
                defaultValue={field.value}
                placeholder={field.placeholder}
                className="w-full h-12 px-3 bg-white/70 border border-black/15 text-sm outline-none"
              />
            </label>
          ))}
          <label className="block space-y-2">
            <span className="tricho-caps text-[10px] text-black/50">Bio</span>
            <textarea
              name="bio"
              defaultValue={user.profile?.bio ?? ""}
              rows={5}
              placeholder="Who you see, and how you work."
              className="w-full p-3 bg-white/70 border border-black/15 text-sm outline-none resize-y"
            />
          </label>
          <Button
            type="submit"
            className="tricho-caps w-full rounded-none bg-black text-[#D1D0CB] h-12"
          >
            Publish to the Directory
          </Button>
        </form>
      </div>
    </div>
  );
}
