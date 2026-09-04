import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Dropdown.Root;
export const DropdownMenuTrigger = Dropdown.Trigger;
export const DropdownMenuGroup = Dropdown.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof Dropdown.Content>) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-44 overflow-hidden rounded-lg bg-surface p-1 text-sm text-fg shadow-elevated",
          "data-[state=open]:animate-[menu-in_var(--duration-fast)_var(--ease-fluent)] data-[state=closed]:animate-[menu-out_var(--duration-quick)_var(--ease-fluent)]",
          className,
        )}
        {...props}
      />
    </Dropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  inset,
  variant,
  ...props
}: ComponentProps<typeof Dropdown.Item> & { inset?: boolean; variant?: "danger" }) {
  return (
    <Dropdown.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-2 outline-none select-none",
        "data-[highlighted]:bg-fg/6",
        variant === "danger" ? "text-danger" : "text-fg",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof Dropdown.Separator>) {
  return <Dropdown.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Dropdown.Label>) {
  return <Dropdown.Label className={cn("px-2.5 py-1.5 text-xs font-medium text-subtle", className)} {...props} />;
}
