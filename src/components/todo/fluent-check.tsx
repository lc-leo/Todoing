import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function FluentCheck({
  checked,
  onToggle,
  label,
  size = "md",
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  size?: "sm" | "md";
}) {
  const hit = size === "sm" ? "size-9" : "size-11";
  const ring = size === "sm" ? "size-4" : "size-5";
  const icon = size === "sm" ? "size-3" : "size-3.5";
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn("relative flex shrink-0 items-center justify-center rounded-md", hit)}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-fast ease-fluent",
          ring,
          checked
            ? "border-accent bg-accent text-accent-fg scale-100"
            : "border-muted bg-transparent text-transparent",
        )}
      >
        <Check
          className={cn(
            "transition-[opacity,transform,filter] duration-fast ease-fluent",
            icon,
            checked ? "scale-100 opacity-100" : "scale-[0.25] opacity-0 blur-[2px]",
          )}
          strokeWidth={3}
        />
      </span>
    </button>
  );
}
