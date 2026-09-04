import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { AddTask } from "@/components/todo/add-task";
import { CalendarView } from "@/components/todo/calendar-view";
import { PinButton } from "@/components/todo/pin-button";
import { TaskItem } from "@/components/todo/task-item";
import { WeekView } from "@/components/todo/week-view";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatLongDate, greeting } from "@/lib/todo/dates";
import {
  listDescription,
  listTitle,
  remainingInList,
  sortTasks,
  suggestedForMyDay,
  visibleTasks,
} from "@/lib/todo/selectors";
import { useTodoStore } from "@/lib/todo/store";
import { SMART_LISTS, type SortMode } from "@/lib/todo/types";
import { cn } from "@/lib/utils";

const SORT_LABEL: Record<SortMode, string> = {
  default: "创建时间",
  due: "截止日期",
  alpha: "字母顺序",
  important: "重要性",
};

export function TaskPanel({ addInputId }: { addInputId: string }) {
  const lists = useTodoStore((s) => s.lists);
  const tasks = useTodoStore((s) => s.tasks);
  const selectedListId = useTodoStore((s) => s.selectedListId);
  const selectedTaskId = useTodoStore((s) => s.selectedTaskId);
  const searchQuery = useTodoStore((s) => s.searchQuery);
  const sortMode = useTodoStore((s) => s.sortMode);
  const setSortMode = useTodoStore((s) => s.setSortMode);
  const toggleMyDay = useTodoStore((s) => s.toggleMyDay);
  const [showCompleted, setShowCompleted] = useState(true);

  const isSearch = searchQuery.trim().length > 0;
  const isSmart =
    selectedListId === SMART_LISTS.myday ||
    selectedListId === SMART_LISTS.week ||
    selectedListId === SMART_LISTS.calendar ||
    selectedListId === SMART_LISTS.important ||
    selectedListId === SMART_LISTS.planned ||
    selectedListId === SMART_LISTS.all ||
    selectedListId === SMART_LISTS.completed;

  const filtered = useMemo(
    () => sortTasks(visibleTasks(tasks, selectedListId, searchQuery), sortMode),
    [tasks, selectedListId, searchQuery, sortMode],
  );
  const openTasks = filtered.filter((task) => !task.completed);
  const doneTasks = filtered.filter((task) => task.completed);
  const suggestions =
    !isSearch && selectedListId === SMART_LISTS.myday ? suggestedForMyDay(tasks) : [];
  const progress =
    !isSmart && !isSearch ? remainingInList(tasks, selectedListId) : null;

  if (!isSearch && selectedListId === SMART_LISTS.calendar) {
    return <CalendarView addInputId={addInputId} />;
  }
  if (!isSearch && selectedListId === SMART_LISTS.week) {
    return <WeekView addInputId={addInputId} />;
  }

  const title = isSearch ? `搜索「${searchQuery.trim()}」` : listTitle(selectedListId, lists);
  const subtitle = isSearch
    ? `${filtered.length} 个匹配`
    : selectedListId === SMART_LISTS.myday
      ? `${greeting()} · ${formatLongDate()}`
      : listDescription(selectedListId, lists);

  const displayOpen =
    selectedListId === SMART_LISTS.completed && !isSearch ? [] : openTasks;
  const displayDone =
    selectedListId === SMART_LISTS.completed && !isSearch ? doneTasks : doneTasks;

  return (
    <section className="flex h-full min-w-0 flex-col">
      <header className="flex items-start justify-between gap-3 px-1 pt-1 pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-fg">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          {progress && progress.total > 0 ? (
            <p className="mt-2 text-xs tabular-nums text-subtle">
              已完成 {progress.done} / {progress.total}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {selectedListId === SMART_LISTS.myday && !isSearch ? <PinButton kind="day" /> : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="排序">
                <ArrowUpDown className="size-4" />
                {SORT_LABEL[sortMode]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(SORT_LABEL) as SortMode[]).map((mode) => (
                <DropdownMenuItem key={mode} onSelect={() => setSortMode(mode)}>
                  {SORT_LABEL[mode]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {selectedListId !== SMART_LISTS.completed || isSearch ? (
        <div className="mb-4">
          <AddTask inputId={addInputId} />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {displayOpen.length === 0 && displayDone.length === 0 ? (
          <EmptyState searching={isSearch} />
        ) : (
          <ul className="flex flex-col gap-2">
            {displayOpen.map((task) => (
              <li key={task.id} className="animate-[rise-in_var(--duration-fast)_var(--ease-fluent)]">
                <TaskItem
                  task={task}
                  selected={selectedTaskId === task.id}
                  showList={isSmart || isSearch}
                />
              </li>
            ))}
          </ul>
        )}

        {displayDone.length > 0 && selectedListId !== SMART_LISTS.completed ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowCompleted((value) => !value)}
              className="mb-2 flex h-10 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-fg/6"
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-fast ease-fluent",
                  showCompleted ? "rotate-0" : "-rotate-90",
                )}
              />
              已完成 {displayDone.length}
            </button>
            {showCompleted ? (
              <ul className="flex flex-col gap-2">
                {displayDone.map((task) => (
                  <li key={task.id}>
                    <TaskItem
                      task={task}
                      selected={selectedTaskId === task.id}
                      showList={isSmart || isSearch}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {selectedListId === SMART_LISTS.completed && displayDone.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {displayDone.map((task) => (
              <li key={task.id}>
                <TaskItem task={task} selected={selectedTaskId === task.id} showList />
              </li>
            ))}
          </ul>
        ) : null}

        {suggestions.length > 0 ? (
          <div className="mt-8">
            <h2 className="mb-2 px-1 text-xs font-medium tracking-wide text-subtle">建议</h2>
            <ul className="flex flex-col gap-2">
              {suggestions.map((task) => (
                <li key={task.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <TaskItem task={task} selected={selectedTaskId === task.id} showList />
                  </div>
                  <Button
                    variant="soft"
                    size="sm"
                    className="h-11 shrink-0 sm:h-8"
                    onClick={() => toggleMyDay(task.id)}
                  >
                    加入今天
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-surface/70 px-6 text-center shadow-border">
      <p className="text-sm font-medium text-fg">
        {searching ? "没有找到匹配的任务" : "这一页还很清爽"}
      </p>
      <p className="mt-1 max-w-xs text-sm text-muted">
        {searching
          ? "试试其他关键词，或清空搜索查看全部列表。"
          : "按 Ctrl + N 快速添加，或从下方输入框开始。"}
      </p>
    </div>
  );
}
