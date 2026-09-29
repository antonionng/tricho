import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
const resendEnabled = !!process.env.AUTH_RESEND_KEY;
const devEnabled = process.env.NODE_ENV !== "production";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#D1D0CB] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-4">
          <span className="tricho-caps text-black/40">Member Access</span>
          <h1 className="text-5xl md:text-6xl tricho-title uppercase tracking-tighter">
            Sign In
          </h1>
          <p className="font-sans font-medium text-black/60 text-sm">
            Welcome back to the collective.
          </p>
        </div>

        <div className="space-y-8">
          {googleEnabled && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/members" });
              }}
            >
              <Button
                type="submit"
                variant="outline"
                className="tricho-caps w-full rounded-none border-black h-14 hover:bg-black hover:text-[#D1D0CB] transition-all"
              >
                Continue with Google
              </Button>
            </form>
          )}

          {resendEnabled && (
            <form
              action={async (formData: FormData) => {
                "use server";
                await signIn("resend", {
                  email: String(formData.get("email")),
                  redirectTo: "/members",
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="tricho-caps text-[10px]">
                  Email a magic link
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@practice.com"
                  className="h-14 rounded-none border-black/20 bg-white/50"
                />
              </div>
              <Button
                type="submit"
                className="tricho-caps w-full rounded-none bg-black text-[#D1D0CB] h-14 hover:bg-black/80"
              >
                Send Magic Link
              </Button>
            </form>
          )}

          {devEnabled && (
            <form
              action={async (formData: FormData) => {
                "use server";
                await signIn("dev", {
                  email: String(formData.get("email")),
                  name: String(formData.get("name") || ""),
                  redirectTo: "/members",
                });
              }}
              className="space-y-4 border border-black/10 p-6 bg-white/30"
            >
              <p className="tricho-caps text-[10px] text-black/40">
                Dev Login (local only)
              </p>
              <div className="space-y-2">
                <Label htmlFor="dev-email" className="tricho-caps text-[10px]">
                  Email
                </Label>
                <Input
                  id="dev-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="h-12 rounded-none border-black/20 bg-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dev-name" className="tricho-caps text-[10px]">
                  Name (optional)
                </Label>
                <Input
                  id="dev-name"
                  name="name"
                  type="text"
                  placeholder="Dr. Jane Doe"
                  className="h-12 rounded-none border-black/20 bg-white/50"
                />
              </div>
              <Button
                type="submit"
                className="tricho-caps w-full rounded-none bg-black text-[#D1D0CB] h-12 hover:bg-black/80"
              >
                Enter
              </Button>
            </form>
          )}

          {!googleEnabled && !resendEnabled && !devEnabled && (
            <p className="text-center text-sm text-black/50">
              No sign-in methods are configured. Set <code>AUTH_GOOGLE_ID</code> or{" "}
              <code>AUTH_RESEND_KEY</code> in your environment.
            </p>
          )}
        </div>

        <p className="text-center tricho-caps text-[10px] text-black/40">
          Not a member yet?{" "}
          <Link href="/join" className="border-b border-black pb-0.5 text-black">
            View Membership
          </Link>
        </p>
      </div>
    </div>
  );
}
