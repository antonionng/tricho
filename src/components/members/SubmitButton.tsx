"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pending: pendingLabel,
  variant,
  size = "lg",
  className,
  disabled,
}: {
  children: React.ReactNode;
  pending?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </Button>
  );
}
