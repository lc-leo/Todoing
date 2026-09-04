import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { AddTask } from "@/components/todo/add-task";
import { TaskItem } from "@/components/todo/task-item";
import { Calendar } from "@/components/ui/calendar";
import { datesWithTasks, sortTasks, tasksOnDate } from "@/lib/todo/selectors";
import { useTodoStore } from "@/lib/todo/store";

export function CalendarView({ addInputId }: { addInputId: string }) {
  const tasks = useTodoStore((s) => s.tasks);
  const calendarDay = useTodoStore((s) => s.calendarDay);
  const setCalendarDay = useTodoStore((s) => s.setCalendarDay);
  const selectedTaskId = useTodoStore((s) => s.selectedTaskId);
  const sortMode = useTodoStore((s) => s.sortMode);
  const selected = parseISO(`${calendarDay}T12:00:00`);
  const dayTasks = sortTasks(tasksOnDate(tasks, calendarDay), sortMode);
  const openTasks = dayTasks.filter((task) => !task.completed);
  const doneTasks = dayTasks.filter((task) => task.completed);
  const busy = datesWithTasks(tasks);

  return (
    <section className="flex h-full min-w-0 flex-col">
      <header className="px-1 pt-1 pb-4">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight">日历</h1>
        <p className="mt-1 text-sm text-muted">点选日期查看当天安排，也可直接添加任务。</p>
      </header>

      <div className="mb-4 overflow-hidden rounded-xl bg-surface p-3 shadow-border">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) setCalendarDay(format(date, "yyyy-MM-dd"));
          }}
          modifiers={{ busy }}
          modifiersClassNames={{
            busy:
              "relative after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-accent",
          }}
          className="mx-auto w-full max-w-sm"
          classNames={{
            day: "size-10 p-0 text-center text-sm",
            day_button:
              "size-10 rounded-sm font-normal hover:bg-fg/6 aria-selected:bg-accent aria-selected:text-accent-fg",
            weekday: "size-10 text-center text-xs font-medium text-subtle",
          }}
        />
      </div>

      <h2 className="mb-3 px-1 text-sm font-medium">
        {format(selected, "M月d日 EEEE", { locale: zhCN })}
        <span className="ml-2 font-normal text-subtle tabular-nums">{openTasks.length} 项未完成</span>
      </h2>

      <div className="mb-3">
        <AddTask inputId={addInputId} defaultDueDate={calendarDay} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {openTasks.length === 0 && doneTasks.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl bg-surface/70 px-4 text-center text-sm text-muted shadow-border">
            这一天还没有安排
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {openTasks.map((task) => (
              <li key={task.id}>
                <TaskItem task={task} selected={selectedTaskId === task.id} showList />
              </li>
            ))}
            {doneTasks.map((task) => (
              <li key={task.id}>
                <TaskItem task={task} selected={selectedTaskId === task.id} showList />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
