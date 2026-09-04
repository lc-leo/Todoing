import { useEffect, useState } from "react";
import { CalendarDays, Sun, Trash2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { FluentCheck } from "@/components/todo/fluent-check";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/input";
import { formatDueLabel, isOverdue } from "@/lib/todo/dates";
import { useTodoStore } from "@/lib/todo/store";
import { cn } from "@/lib/utils";

export function TaskDetail() {
  const selectedTaskId = useTodoStore((s) => s.selectedTaskId);
  const task = useTodoStore((s) => s.tasks.find((item) => item.id === selectedTaskId));
  const lists = useTodoStore((s) => s.lists);
  const selectTask = useTodoStore((s) => s.selectTask);
  const updateTask = useTodoStore((s) => s.updateTask);
  const toggleComplete = useTodoStore((s) => s.toggleComplete);
  const toggleMyDay = useTodoStore((s) => s.toggleMyDay);
  const deleteTask = useTodoStore((s) => s.deleteTask);
  const restoreTask = useTodoStore((s) => s.restoreTask);
  const addStep = useTodoStore((s) => s.addStep);
  const toggleStep = useTodoStore((s) => s.toggleStep);
  const deleteStep = useTodoStore((s) => s.deleteStep);
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [stepDraft, setStepDraft] = useState("");
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => {
    setTitle(task?.title ?? "");
    setNotes(task?.notes ?? "");
    setStepDraft("");
  }, [task?.id, task?.title, task?.notes]);

  if (!task) return null;

  const current = task;
  const listName = lists.find((list) => list.id === current.listId)?.name ?? "任务";
  const overdue = isOverdue(current.dueDate) && !current.completed;

  function removeTask() {
    const snapshot = deleteTask(current.id);
    if (snapshot) {
      toast("任务已删除", {
        action: {
          label: "撤销",
          onClick: () => restoreTask(snapshot),
        },
      });
    }
  }

  return (
    <aside className="flex h-full flex-col bg-surface shadow-border">
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <p className="px-2 text-xs font-medium text-subtle">{listName}</p>
        <Button variant="ghost" size="icon-sm" aria-label="关闭详情" onClick={() => selectTask(null)}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex items-start gap-1 px-2">
        <FluentCheck
          checked={task.completed}
          onToggle={() => toggleComplete(task.id)}
          label={task.completed ? "标为未完成" : "标为完成"}
        />
        <textarea
          value={title}
          rows={2}
          aria-label="任务标题"
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            const next = title.trim();
            if (next && next !== task.title) updateTask(task.id, { title: next });
            else setTitle(task.title);
          }}
          className={cn(
            "mt-2 min-h-14 w-full resize-none bg-transparent text-lg font-medium leading-snug outline-none",
            task.completed && "text-subtle",
          )}
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
        <button
          type="button"
          onClick={() => toggleMyDay(task.id)}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-quick",
            task.myDay ? "bg-accent-soft text-accent" : "bg-surface-2 text-fg hover:bg-fg/6",
          )}
        >
          <Sun className="size-4" />
          {task.myDay ? "已添加到我的一天" : "添加到我的一天"}
        </button>

        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors duration-quick",
                task.dueDate ? "bg-surface-2" : "bg-surface-2 hover:bg-fg/6",
                overdue && "text-overdue",
              )}
            >
              <CalendarDays className="size-4" />
              {task.dueDate
                ? `${overdue ? "已过期 · " : "截止 "}${formatDueLabel(task.dueDate)}`
                : "添加截止日期"}
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="single"
              selected={task.dueDate ? parseISO(`${task.dueDate}T12:00:00`) : undefined}
              onSelect={(date) => {
                updateTask(task.id, { dueDate: date ? format(date, "yyyy-MM-dd") : null });
                setCalOpen(false);
              }}
            />
            {task.dueDate ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 w-full"
                onClick={() => {
                  updateTask(task.id, { dueDate: null });
                  setCalOpen(false);
                }}
              >
                清除日期
              </Button>
            ) : null}
          </PopoverContent>
        </Popover>

        <div className="rounded-lg bg-surface-2 p-2">
          <p className="px-2 pt-1 text-xs font-medium text-subtle">步骤</p>
          <ul className="mt-1 flex flex-col">
            {task.steps.map((step) => (
              <li key={step.id} className="group flex items-center">
                <FluentCheck
                  checked={step.completed}
                  onToggle={() => toggleStep(task.id, step.id)}
                  label={step.completed ? "取消完成步骤" : "完成步骤"}
                />
                <span
                  className={cn(
                    "flex-1 truncate text-sm",
                    step.completed ? "text-subtle line-through" : "text-fg",
                  )}
                >
                  {step.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="删除步骤"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => deleteStep(task.id, step.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
          <form
            className="px-2 pb-1"
            onSubmit={(event) => {
              event.preventDefault();
              addStep(task.id, stepDraft);
              setStepDraft("");
            }}
          >
            <input
              value={stepDraft}
              onChange={(event) => setStepDraft(event.target.value)}
              placeholder="下一步"
              aria-label="添加步骤"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-subtle"
            />
          </form>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="px-1 text-xs font-medium text-subtle">备注</span>
          <Textarea
            value={notes}
            placeholder="添加备注"
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => {
              if (notes !== task.notes) updateTask(task.id, { notes });
            }}
          />
        </label>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-xs text-subtle">
          创建于 {format(task.createdAt, "M月d日")}
        </p>
        <Button variant="danger" size="icon-sm" aria-label="删除任务" onClick={removeTask}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
