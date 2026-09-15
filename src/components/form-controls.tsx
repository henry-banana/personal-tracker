import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "../lib/cn";

const base =
  "w-full rounded-[var(--radius-inner)] bg-surface-muted px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-ink-faint outline-none transition-colors " +
  "focus:bg-surface-sunken focus:ring-2 focus:ring-accent/40";

export function TextField({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "resize-none", className)} {...props} />;
}

export function FieldLabel({ children }: { children: string }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-ink-soft">
      {children}
    </label>
  );
}
