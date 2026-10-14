"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared inputs for the course builder, in the members' field style. */

export const inputClass =
  "w-full rounded-xl border border-rule bg-card px-3.5 py-2.5 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-ink/50";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[14px] font-medium">{label}</span>
      {children}
      {hint && <span className="text-[13px] leading-snug text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TextInput({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return <input {...rest} value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, rest.className)} />;
}

export function TextArea({ value, onChange, rows = 3, ...rest }: { value: string; onChange: (v: string) => void; rows?: number } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  return <textarea {...rest} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, "resize-y", rest.className)} />;
}

export function NumberInput({ value, onChange, min = 0, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Math.max(min, Math.min(max ?? Infinity, Math.round(Number(e.target.value) || 0))))}
      className={cn(inputClass, "tabular-nums")}
    />
  );
}

/** One item per line, for lists of short sentences. Blank lines are kept while typing. */
export function LinesField({ value, onChange, rows = 4, placeholder }: { value: string[]; onChange: (v: string[]) => void; rows?: number; placeholder?: string }) {
  return <TextArea value={value.join("\n")} onChange={(v) => onChange(v.split("\n"))} rows={rows} placeholder={placeholder} />;
}

/** Small icon buttons for moving and removing items. */
export function ItemControls({ onUp, onDown, onRemove, label }: { onUp?: () => void; onDown?: () => void; onRemove?: () => void; label: string }) {
  const btn = "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-30";
  return (
    <span className="flex shrink-0 items-center">
      <button type="button" className={btn} onClick={onUp} disabled={!onUp} aria-label={`Move ${label} up`}>
        <ArrowUp className="h-4 w-4" />
      </button>
      <button type="button" className={btn} onClick={onDown} disabled={!onDown} aria-label={`Move ${label} down`}>
        <ArrowDown className="h-4 w-4" />
      </button>
      {onRemove && (
        <button type="button" className={cn(btn, "hover:text-destructive")} onClick={onRemove} aria-label={`Remove ${label}`}>
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </span>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 self-start rounded-full border border-dashed border-ink/25 px-3.5 py-2 text-[14px] font-medium transition-colors hover:border-ink hover:bg-paper-2"
    >
      <Plus className="h-4 w-4" /> {children}
    </button>
  );
}

/** Pairs of short and long text, such as steps or key terms. */
export function PairsField({
  value,
  onChange,
  firstLabel,
  secondLabel,
  addLabel,
}: {
  value: { a: string; b: string }[];
  onChange: (v: { a: string; b: string }[]) => void;
  firstLabel: string;
  secondLabel: string;
  addLabel: string;
}) {
  const set = (i: number, patch: Partial<{ a: string; b: string }>) => onChange(value.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <div className="flex flex-col gap-3">
      {value.map((p, i) => (
        <div key={i} className="flex gap-2 rounded-xl border border-rule p-3">
          <div className="grid flex-1 gap-2">
            <TextInput value={p.a} onChange={(a) => set(i, { a })} placeholder={firstLabel} aria-label={firstLabel} />
            <TextArea value={p.b} onChange={(b) => set(i, { b })} placeholder={secondLabel} aria-label={secondLabel} rows={2} />
          </div>
          <ItemControls
            label={firstLabel.toLowerCase()}
            onUp={i > 0 ? () => onChange(move(value, i, -1)) : undefined}
            onDown={i < value.length - 1 ? () => onChange(move(value, i, 1)) : undefined}
            onRemove={() => onChange(value.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <AddButton onClick={() => onChange([...value, { a: "", b: "" }])}>{addLabel}</AddButton>
    </div>
  );
}

export function move<T>(list: T[], index: number, by: -1 | 1): T[] {
  const to = index + by;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

/** A short random id for new questions. */
export function newId(prefix: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `${prefix}-${Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 7)}`;
}

/** A lesson web address from its title. */
export function slugFrom(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
