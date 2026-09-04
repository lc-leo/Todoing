import { useState } from "react";
import { CalendarDays, Plus, Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { todayIso } from "@/lib/todo/dates";
import { useTodoStore } from "@/lib/todo/store";
import { cn } from "@/lib/utils";

export function AddTask({
  inputId,
  defaultDueDate,
}: {
  inputId: string;
  defaultDueDate?: string;
}) {
  const addTask = useTodoStore((s) => s.addTask);
  const [title, setTitle] = useState("");
  const [important, setImportant] = useState(false);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const marked = dueDate ?? defaultDueDate ?? null;

  function submit() {
    const resolved = dueDate ?? defaultDueDate;
    const id = addTask({
      title,
      important,
      ...(resolved ? { dueDate: resolved } : {}),
    });
    if (id) {
      setTitle("");
      setImportant(false);
      setDueDate(null);
    }
  }

  return (
    <form
      className="flex min-h-12 items-center gap-1 rounded-lg bg-surface px-1 shadow-border"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <span className="flex size-11 items-center justify-center text-accent">
        <Plus className="size-4" />
      </span>
      <input
        id={inputId}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="添加任务"
        aria-label="添加任务"
        className="h-12 min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="设置截止日期"
            className={cn("mr-0.5", marked && "text-accent")}
          >
            <CalendarDays className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={marked ? parseISO(`${marked}T12:00:00`) : undefined}
            onSelect={(date) => {
              setDueDate(date ? format(date, "yyyy-MM-dd") : null);
              setOpen(false);
            }}
            disabled={{ before: parseISO(`${todayIso()}T00:00:00`) }}
          />
          {dueDate ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full"
              onClick={() => {
                setDueDate(null);
                setOpen(false);
              }}
            >
              清除日期
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="标为重要"
        aria-pressed={important}
        className="mr-1"
        onClick={() => setImportant((value) => !value)}
      >
        <Star className={cn("size-4", important ? "fill-accent text-accent" : "text-subtle")} />
      </Button>
    </form>
  );
}
