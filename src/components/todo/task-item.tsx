import { CalendarDays, ListTodo, Star } from "lucide-react";
import { FluentCheck } from "@/components/todo/fluent-check";
import { formatDueLabel, isOverdue } from "@/lib/todo/dates";
import { useTodoStore } from "@/lib/todo/store";
import type { Task } from "@/lib/todo/types";
import { cn } from "@/lib/utils";

export function TaskItem({
  task,
  showList,
  selected,
}: {
  task: Task;
  showList?: boolean;
  selected: boolean;
}) {
  const lists = useTodoStore((s) => s.lists);
  const selectTask = useTodoStore((s) => s.selectTask);
  const toggleComplete = useTodoStore((s) => s.toggleComplete);
  const toggleImportant = useTodoStore((s) => s.toggleImportant);
  const listName = lists.find((list) => list.id === task.listId)?.name;
  const overdue = isOverdue(task.dueDate) && !task.completed;
  const stepDone = task.steps.filter((step) => step.completed).length;

  return (
    <div
      className={cn(
        "group flex min-h-14 items-center gap-1 rounded-lg bg-surface px-1 shadow-border transition-[background-color,box-shadow] duration-quick ease-fluent",
        selected && "ring-2 ring-accent/70",
      )}
    >
      <FluentCheck
        checked={task.completed}
        onToggle={() => toggleComplete(task.id)}
        label={task.completed ? "标为未完成" : "标为完成"}
      />
      <button
        type="button"
        onClick={() => selectTask(task.id)}
        className="min-w-0 flex-1 py-2.5 text-left"
      >
        <p
          className={cn(
            "strike-title truncate text-sm",
            task.completed ? "is-done text-subtle" : "text-fg",
          )}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-subtle">
          {task.dueDate ? (
            <span className={cn("inline-flex items-center gap-1", overdue && "text-overdue")}>
              <CalendarDays className="size-3" />
              {overdue ? "已过期 · " : ""}
              {formatDueLabel(task.dueDate)}
            </span>
          ) : null}
          {task.steps.length > 0 ? (
            <span className="tabular-nums">
              {stepDone}/{task.steps.length} 步骤
            </span>
          ) : null}
          {showList && listName ? (
            <span className="inline-flex items-center gap-1">
              <ListTodo className="size-3" />
              {listName}
            </span>
          ) : null}
        </div>
      </button>
      <button
        type="button"
        aria-label={task.important ? "取消星标" : "标为重要"}
        aria-pressed={task.important}
        onClick={() => toggleImportant(task.id)}
        className="relative flex size-11 shrink-0 items-center justify-center rounded-md text-subtle hover:bg-fg/6"
      >
        <Star
          className={cn(
            "size-4 transition-[fill,color,transform] duration-fast ease-fluent",
            task.important ? "fill-accent text-accent scale-100" : "text-subtle",
          )}
        />
      </button>
    </div>
  );
}
