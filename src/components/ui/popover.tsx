import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({
  className,
  align = "start",
  sideOffset = 8,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-auto rounded-xl bg-surface p-3 text-fg shadow-elevated outline-none",
          "data-[state=open]:animate-[menu-in_var(--duration-fast)_var(--ease-fluent)] data-[state=closed]:animate-[menu-out_var(--duration-quick)_var(--ease-fluent)]",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
