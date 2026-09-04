import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { isToday } from "date-fns";
import { FluentCheck } from "@/components/todo/fluent-check";
import { PomodoroPanel, usePomodoroClock } from "@/components/todo/pomodoro-panel";
import { formatLongDate, formatMonthDay, formatWeekday, greeting, weekDays } from "@/lib/todo/dates";
import { sortTasks, tasksOnDate } from "@/lib/todo/selectors";
import { useHydrateTodoStore, useTodoStore } from "@/lib/todo/store";
import type { Task } from "@/lib/todo/types";
import { cn } from "@/lib/utils";

export function StickyShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const hasHydrated = useHydrateTodoStore();
  usePomodoroClock();
  return (
    <div className="mica flex min-h-dvh flex-col text-fg">
      <header className="flex h-11 items-center justify-between gap-2 border-b border-border px-3">
        <p className="truncate text-sm font-semibold">{title}</p>
        <Link to="/" className="text-xs text-accent hover:underline">
          打开 Todoing
        </Link>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {hasHydrated ? children : <div className="h-24 rounded-lg bg-fg/8" />}
      </div>
    </div>
  );
}

export function DaySticky() {
  const tasks = useTodoStore((s) => s.tasks);
  const toggleComplete = useTodoStore((s) => s.toggleComplete);
  const today = new Date();
  const iso = isoOf(today);
  const items = sortTasks(tasksOnDate(tasks, iso), "default");
  const open = items.filter((task) => !task.completed);
  const done = items.filter((task) => task.completed);

  return (
    <StickyShell title="我的一天">
      <p className="text-xs text-muted">
        {greeting()} · {formatLongDate(today)}
      </p>
      <p className="mt-1 mb-3 text-xs tabular-nums text-subtle">
        剩余 {open.length} / 共 {items.length}
      </p>
      {items.length === 0 ? (
        <p className="rounded-lg bg-surface px-3 py-6 text-center text-sm text-muted shadow-border">
          今天还没有安排
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {open.map((task) => (
            <StickyTask key={task.id} task={task} onToggle={() => toggleComplete(task.id)} />
          ))}
          {done.map((task) => (
            <StickyTask key={task.id} task={task} onToggle={() => toggleComplete(task.id)} />
          ))}
        </ul>
      )}
    </StickyShell>
  );
}

export function WeekSticky() {
  const tasks = useTodoStore((s) => s.tasks);
  const toggleComplete = useTodoStore((s) => s.toggleComplete);
  const days = weekDays();

  return (
    <StickyShell title="我的一周">
      <p className="mb-3 text-xs text-muted">
        {formatMonthDay(days[0]!)} – {formatMonthDay(days[6]!)}
      </p>
      <div className="flex flex-col gap-3">
        {days.map((day) => {
          const iso = isoOf(day);
          const items = sortTasks(tasksOnDate(tasks, iso), "default").filter((task) => !task.completed);
          return (
            <section key={iso}>
              <h2 className={cn("mb-1 text-xs font-medium", isToday(day) && "text-accent")}>
                {formatWeekday(day)}
                {isToday(day) ? " · 今天" : ""}
                <span className="ml-2 font-normal text-subtle tabular-nums">{items.length}</span>
              </h2>
              {items.length === 0 ? (
                <p className="text-xs text-subtle">无安排</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {items.slice(0, 4).map((task) => (
                    <StickyTask key={task.id} task={task} onToggle={() => toggleComplete(task.id)} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </StickyShell>
  );
}

export function PomodoroSticky() {
  return (
    <StickyShell title="番茄钟">
      <div className="pt-4">
        <PomodoroPanel compact />
      </div>
    </StickyShell>
  );
}

function StickyTask({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <li className="flex items-center rounded-md bg-surface pr-2 shadow-border">
      <FluentCheck
        size="sm"
        checked={task.completed}
        onToggle={onToggle}
        label={task.completed ? "标为未完成" : "标为完成"}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          task.completed ? "text-subtle line-through" : "text-fg",
        )}
      >
        {task.title}
      </span>
    </li>
  );
}

function isoOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
