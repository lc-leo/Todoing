import { isInCurrentWeek, todayIso } from "./dates";
import { SMART_LISTS, type ListId, type SortMode, type Task, type TaskList } from "./types";

export type SmartMeta = {
  id: ListId;
  name: string;
  description: string;
};

export const SMART_META: Record<string, SmartMeta> = {
  [SMART_LISTS.myday]: {
    id: SMART_LISTS.myday,
    name: "我的一天",
    description: "今天要完成的事",
  },
  [SMART_LISTS.week]: {
    id: SMART_LISTS.week,
    name: "我的一周",
    description: "本周按天排好的计划",
  },
  [SMART_LISTS.calendar]: {
    id: SMART_LISTS.calendar,
    name: "日历",
    description: "按日期查看和安排",
  },
  [SMART_LISTS.important]: {
    id: SMART_LISTS.important,
    name: "重要",
    description: "标星的任务",
  },
  [SMART_LISTS.planned]: {
    id: SMART_LISTS.planned,
    name: "已计划",
    description: "有截止日期的任务",
  },
  [SMART_LISTS.all]: {
    id: SMART_LISTS.all,
    name: "全部任务",
    description: "所有未完成与已完成",
  },
  [SMART_LISTS.completed]: {
    id: SMART_LISTS.completed,
    name: "已完成",
    description: "已勾选的任务",
  },
};

export function listTitle(listId: ListId, lists: TaskList[]): string {
  if (SMART_META[listId]) return SMART_META[listId].name;
  return lists.find((list) => list.id === listId)?.name ?? "任务";
}

export function listDescription(listId: ListId, lists: TaskList[]): string {
  if (SMART_META[listId]) return SMART_META[listId].description;
  const list = lists.find((item) => item.id === listId);
  return list ? "自定义列表" : "";
}

export function matchesList(task: Task, listId: ListId): boolean {
  switch (listId) {
    case SMART_LISTS.myday:
      return task.myDay;
    case SMART_LISTS.week:
      return isInCurrentWeek(task.dueDate) || task.myDay;
    case SMART_LISTS.calendar:
      return Boolean(task.dueDate);
    case SMART_LISTS.important:
      return task.important;
    case SMART_LISTS.planned:
      return Boolean(task.dueDate);
    case SMART_LISTS.all:
      return true;
    case SMART_LISTS.completed:
      return task.completed;
    default:
      return task.listId === listId;
  }
}

export function visibleTasks(tasks: Task[], listId: ListId, search: string): Task[] {
  const query = search.trim().toLowerCase();
  if (query) {
    return tasks.filter((task) => {
      const inTitle = task.title.toLowerCase().includes(query);
      const inNotes = task.notes.toLowerCase().includes(query);
      const inSteps = task.steps.some((step) => step.title.toLowerCase().includes(query));
      return inTitle || inNotes || inSteps;
    });
  }
  return tasks.filter((task) => matchesList(task, listId));
}

export function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  const copy = [...tasks];
  copy.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (mode === "important" && a.important !== b.important) return a.important ? -1 : 1;
    if (mode === "alpha") return a.title.localeCompare(b.title, "zh-CN");
    if (mode === "due") {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
    }
    return b.createdAt - a.createdAt;
  });
  return copy;
}

export function countFor(tasks: Task[], listId: ListId): number {
  return tasks.filter(
    (task) => matchesList(task, listId) && (listId === SMART_LISTS.completed || !task.completed),
  ).length;
}

export function remainingInList(tasks: Task[], listId: string): { done: number; total: number } {
  const items = tasks.filter((task) => task.listId === listId);
  const done = items.filter((task) => task.completed).length;
  return { done, total: items.length };
}

export function suggestedForMyDay(tasks: Task[]): Task[] {
  const today = todayIso();
  return tasks.filter(
    (task) =>
      !task.completed &&
      !task.myDay &&
      (task.important || task.dueDate === today || (task.dueDate !== null && task.dueDate < today)),
  );
}

export function tasksOnDate(tasks: Task[], iso: string): Task[] {
  const today = todayIso();
  return tasks.filter((task) => {
    if (task.dueDate === iso) return true;
    if (iso === today && task.myDay && !task.dueDate) return true;
    return false;
  });
}

export function datesWithTasks(tasks: Task[]): Date[] {
  const seen = new Set<string>();
  const dates: Date[] = [];
  for (const task of tasks) {
    if (!task.dueDate || seen.has(task.dueDate)) continue;
    seen.add(task.dueDate);
    dates.push(new Date(`${task.dueDate}T12:00:00`));
  }
  return dates;
}
