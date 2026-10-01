import Link from "next/link";
import { Container, Eyebrow, Section } from "@/components/site/primitives";
import { ContactForm } from "@/components/site/ContactForm";
import { CONTACT_TOPICS } from "@/lib/mail/templates/leads";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { images } from "@/content/images";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "Contact Trichollective",
  description:
    "Send a message to the Trichollective team about membership, your directory listing, partnerships, events or press. A real person replies within two working days.",
  path: "/contact",
  og: { title: "Send us a message and a real person will reply within two working days.", eyebrow: "Contact", img: images.ed07.src, variant: "photo" },
});

const shortcuts = [
  { q: "Want to add or update your practice in the directory?", href: "/directory/list", label: "Go to your listing" },
  { q: "Looking for a professional near you?", href: "/find", label: "Find a professional" },
  { q: "Interested in a partnership or Premium Business?", href: "/for-business#apply", label: "Apply to become a partner" },
];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;

  return (
    <>
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="flex flex-col gap-8 lg:col-span-5">
              <Eyebrow rule>Contact</Eyebrow>
              <h1 className="display text-5xl sm:text-6xl">
                Send us a message
                <br />
                <span className="text-fade">and a real person will reply within two working days.</span>
              </h1>
              <p className="lede max-w-xl">
                Whether you are a head spa therapist, a trichologist or a GP, your message comes to the small team
                behind Trichollective, led by {site.founderFull}. Tell us what you need and we will answer it
                properly.
              </p>
              <ul className="flex flex-col divide-y divide-rule border-y border-rule">
                {shortcuts.map((s) => (
                  <li key={s.href} className="flex flex-col gap-1 py-4">
                    <p className="text-[15px] text-ink-2">{s.q}</p>
                    <Link href={s.href} className="text-[15px] font-medium text-ink underline underline-offset-4">
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7">
              <ContactForm topics={CONTACT_TOPICS} defaultTopic={topic} />
            </div>
          </div>
        </Container>
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
    </>
  );
}
