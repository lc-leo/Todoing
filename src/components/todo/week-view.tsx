import { isToday } from "date-fns";
import { AddTask } from "@/components/todo/add-task";
import { TaskItem } from "@/components/todo/task-item";
import { PinButton } from "@/components/todo/pin-button";
import { formatMonthDay, formatWeekday, weekDays } from "@/lib/todo/dates";
import { sortTasks, tasksOnDate } from "@/lib/todo/selectors";
import { useTodoStore } from "@/lib/todo/store";
import { cn } from "@/lib/utils";

export function WeekView({ addInputId }: { addInputId: string }) {
  const tasks = useTodoStore((s) => s.tasks);
  const selectedTaskId = useTodoStore((s) => s.selectedTaskId);
  const sortMode = useTodoStore((s) => s.sortMode);
  const calendarDay = useTodoStore((s) => s.calendarDay);
  const setCalendarDay = useTodoStore((s) => s.setCalendarDay);
  const days = weekDays();

  return (
    <section className="flex h-full min-w-0 flex-col">
      <header className="flex items-start justify-between gap-3 px-1 pt-1 pb-4">
        <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">我的一周</h1>
          <p className="mt-1 text-sm text-muted">
            {formatMonthDay(days[0]!)} – {formatMonthDay(days[6]!)}
          </p>
        </div>
        <PinButton kind="week" />
      </header>

      <div className="mb-4">
        <AddTask inputId={addInputId} defaultDueDate={calendarDay} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-5">
          {days.map((day) => {
            const iso = formatIso(day);
            const items = sortTasks(tasksOnDate(tasks, iso), sortMode);
            const open = items.filter((task) => !task.completed);
            const today = isToday(day);
            return (
              <section key={iso}>
                <button
                  type="button"
                  onClick={() => setCalendarDay(iso)}
                  className="mb-2 flex w-full items-baseline gap-2 px-1 text-left"
                >
                  <h2 className={cn("text-sm font-medium", today && "text-accent")}>
                    {formatWeekday(day)}
                    {today ? " · 今天" : ""}
                  </h2>
                  <span className="text-xs text-subtle">{formatMonthDay(day)}</span>
                  <span className="ml-auto text-xs tabular-nums text-subtle">{open.length}</span>
                </button>
                {items.length === 0 ? (
                  <p className="rounded-lg bg-surface/70 px-3 py-3 text-sm text-subtle shadow-border">
                    暂无安排
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {items.map((task) => (
                      <li key={task.id}>
                        <TaskItem task={task} selected={selectedTaskId === task.id} showList />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function formatIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
