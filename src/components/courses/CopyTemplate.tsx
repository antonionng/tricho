"use client";

import { useState } from "react";
import { Check, Copy, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A template the learner can copy into their own records, or save as a text file. */
export function CopyTemplate({ id, title, body }: { id: string; title: string; body: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the text is still selectable on the page.
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "template"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-2xl border border-rule bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3.5">
        <p id={id} className="inline-flex items-center gap-2 font-semibold">
          <FileText className="h-4 w-4 stroke-[1.6]" aria-hidden /> {title}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={download}>
            <Download /> Save
          </Button>
        </div>
      </div>
      <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap p-5 font-mono text-[13.5px] leading-relaxed text-ink-2">{body}</pre>
    </section>
  );
}
