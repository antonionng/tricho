"use client";

import { useState } from "react";
import { Check, Link2, Linkedin, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Print or save as PDF, copy the public link, or add the certificate to LinkedIn. */
export function CertificateActions({ url, linkedIn }: { url: string; linkedIn: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={() => window.print()}>
        <Printer /> Print or save as PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copy this link", url);
          }
        }}
      >
        {copied ? <Check /> : <Link2 />} {copied ? "Link copied" : "Copy the public link"}
      </Button>
      <Button asChild variant="outline">
        <a href={linkedIn} target="_blank" rel="noopener noreferrer">
          <Linkedin /> Add to LinkedIn
        </a>
      </Button>
    </div>
  );
}
