"use client";

import { useEffect } from "react";
import { captureSource, getSource, rememberSource } from "@/lib/source";

/** Remembers where a visitor first arrived from. Renders nothing. */
export function SourceCapture() {
  useEffect(() => captureSource(), []);
  return null;
}

/** A hidden form field carrying the remembered source. */
export function SourceField({ name = "source" }: { name?: string }) {
  useEffect(() => {
    const el = document.querySelectorAll<HTMLInputElement>(`input[data-source-field="${name}"]`);
    const v = getSource() ?? "";
    el.forEach((i) => (i.value = v));
  }, [name]);
  return <input type="hidden" name={name} defaultValue="" data-source-field={name} />;
}

/** Landing pages that are their own source (e.g. /dublin, /tricho). */
export function RememberSource({ value }: { value: string }) {
  useEffect(() => {
    captureSource();
    rememberSource(value);
  }, [value]);
  return null;
}
