import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-border outline-none transition-[box-shadow,background-color] duration-quick ease-fluent placeholder:text-subtle",
        "focus-visible:shadow-focus",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-md bg-surface px-3 py-2 text-sm text-fg shadow-border outline-none transition-[box-shadow] duration-quick ease-fluent placeholder:text-subtle",
        "focus-visible:shadow-focus",
        className,
      )}
      {...props}
    />
  );
}
