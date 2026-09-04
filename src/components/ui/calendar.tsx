import { DayPicker, type DayPickerProps } from "react-day-picker";
import { zhCN } from "react-day-picker/locale";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      locale={zhCN}
      weekStartsOn={1}
      className={cn("p-1", className)}
      classNames={{
        months: "flex flex-col",
        month: "flex flex-col gap-3",
        month_caption: "flex items-center justify-center relative h-9",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between px-1",
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8"),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8"),
        weekdays: "flex",
        weekday: "size-9 text-center text-xs font-medium text-subtle",
        week: "flex",
        day: "size-9 p-0 text-center text-sm",
        day_button: cn(
          "size-9 rounded-sm font-normal hover:bg-fg/6 aria-selected:bg-accent aria-selected:text-accent-fg",
        ),
        selected: "rounded-sm",
        today: "font-semibold text-accent",
        outside: "text-subtle/70",
        disabled: "text-subtle opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : orientation === "up"
                  ? ChevronUp
                  : ChevronDown;
          return <Icon className="size-4" />;
        },
      }}
      {...props}
    />
  );
}
