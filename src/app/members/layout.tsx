import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MemberShell } from "@/components/layout/MemberShell";

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <MemberShell name={session.user.name}>{children}</MemberShell>;
}
