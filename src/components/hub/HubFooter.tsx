import Link from "next/link";
import { site } from "@/config/site";

const LINKS = [
  { href: "/directory", label: "Find a professional" },
  { href: "/guides", label: "Guides" },
  { href: "/blog", label: "Articles" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact us" },
];

/** A short footer for the hub. Unlike the site footer, it has no links to membership or the community. */
export function HubFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-ink-2 sm:px-6 lg:px-10">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-ink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <p>
          If you need help with your account, email{" "}
          <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
            {site.contactEmail}
          </a>{" "}
          and our team will reply personally.
        </p>
      </div>
    </footer>
  );
}
