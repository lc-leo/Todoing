import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { title: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-fg/30 data-[state=open]:animate-[fade-in_var(--duration-fast)_var(--ease-fluent)] data-[state=closed]:animate-[fade-out_var(--duration-quick)_var(--ease-fluent)]" />
      <DialogPrimitive.Content
        className={cn(
          "dialog-sheet fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-5 text-fg shadow-elevated",
          "data-[state=open]:animate-[dialog-in_var(--duration-fast)_var(--ease-fluent)] data-[state=closed]:animate-[dialog-out_var(--duration-quick)_var(--ease-fluent)]",
          className,
        )}
        {...props}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <DialogPrimitive.Title className="text-lg font-semibold leading-snug">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon-sm" aria-label="关闭">
              <X className="size-4" />
            </Button>
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
