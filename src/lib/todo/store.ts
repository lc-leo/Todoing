import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { todayIso } from "./dates";
import { DEFAULT_LIST_ID, SEED_LISTS, SEED_TASKS } from "./seed";
import { SMART_LISTS, type ListId, type SortMode, type Task, type TaskList } from "./types";

function uid(): string {
  return crypto.randomUUID();
}

type AddTaskInput = {
  title: string;
  listId?: string;
  myDay?: boolean;
  important?: boolean;
  dueDate?: string | null;
};

type TodoStore = {
  lists: TaskList[];
  tasks: Task[];
  selectedListId: ListId;
  selectedTaskId: string | null;
  searchQuery: string;
  sortMode: SortMode;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  calendarDay: string;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  selectList: (id: ListId) => void;
  selectTask: (id: string | null) => void;
  setSearch: (query: string) => void;
  setSortMode: (mode: SortMode) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCalendarDay: (iso: string) => void;
  addTask: (input: AddTaskInput) => string;
  updateTask: (id: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => void;
  toggleComplete: (id: string) => void;
  toggleImportant: (id: string) => void;
  toggleMyDay: (id: string) => void;
  deleteTask: (id: string) => Task | undefined;
  restoreTask: (task: Task) => void;
  addStep: (taskId: string, title: string) => void;
  toggleStep: (taskId: string, stepId: string) => void;
  deleteStep: (taskId: string, stepId: string) => void;
  addList: (name: string) => string;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
};

function targetListId(selected: ListId, override?: string): string {
  if (override) return override;
  if (
    selected === SMART_LISTS.myday ||
    selected === SMART_LISTS.week ||
    selected === SMART_LISTS.calendar ||
    selected === SMART_LISTS.important ||
    selected === SMART_LISTS.planned ||
    selected === SMART_LISTS.all ||
    selected === SMART_LISTS.completed
  ) {
    return DEFAULT_LIST_ID;
  }
  return selected;
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      lists: SEED_LISTS,
      tasks: SEED_TASKS,
      selectedListId: SMART_LISTS.myday,
      selectedTaskId: null,
      searchQuery: "",
      sortMode: "default",
      sidebarOpen: false,
      sidebarCollapsed: false,
      calendarDay: todayIso(),
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      selectList: (id) =>
        set({
          selectedListId: id,
          selectedTaskId: null,
          searchQuery: "",
          sidebarOpen: false,
        }),
      selectTask: (id) => set({ selectedTaskId: id }),
      setSearch: (query) => set({ searchQuery: query, selectedTaskId: null }),
      setSortMode: (mode) => set({ sortMode: mode }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCalendarDay: (iso) => set({ calendarDay: iso }),
      addTask: (input) => {
        const title = input.title.trim();
        if (!title) return "";
        const selected = get().selectedListId;
        const listId = targetListId(selected, input.listId);
        const known = get().lists.some((list) => list.id === listId);
        const id = uid();
        const defaultDue =
          selected === SMART_LISTS.planned
            ? todayIso()
            : selected === SMART_LISTS.week || selected === SMART_LISTS.calendar
              ? get().calendarDay || todayIso()
              : null;
        const task: Task = {
          id,
          listId: known ? listId : DEFAULT_LIST_ID,
          title,
          notes: "",
          completed: false,
          important: input.important ?? selected === SMART_LISTS.important,
          myDay: input.myDay ?? selected === SMART_LISTS.myday,
          dueDate: input.dueDate !== undefined ? input.dueDate : defaultDue,
          steps: [],
          createdAt: Date.now(),
          completedAt: null,
        };
        set((state) => ({ tasks: [task, ...state.tasks], selectedTaskId: id }));
        return id;
      },
      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
        })),
      toggleComplete: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completed: !task.completed,
                  completedAt: task.completed ? null : Date.now(),
                }
              : task,
          ),
        })),
      toggleImportant: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, important: !task.important } : task,
          ),
        })),
      toggleMyDay: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, myDay: !task.myDay } : task,
          ),
        })),
      deleteTask: (id) => {
        const task = get().tasks.find((item) => item.id === id);
        set((state) => ({
          tasks: state.tasks.filter((item) => item.id !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        }));
        return task;
      },
      restoreTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks.filter((item) => item.id !== task.id)],
        })),
      addStep: (taskId, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  steps: [...task.steps, { id: uid(), title: trimmed, completed: false }],
                }
              : task,
          ),
        }));
      },
      toggleStep: (taskId, stepId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  steps: task.steps.map((step) =>
                    step.id === stepId ? { ...step, completed: !step.completed } : step,
                  ),
                }
              : task,
          ),
        })),
      deleteStep: (taskId, stepId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, steps: task.steps.filter((step) => step.id !== stepId) }
              : task,
          ),
        })),
      addList: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return "";
        const id = uid();
        set((state) => ({
          lists: [...state.lists, { id, name: trimmed, createdAt: Date.now() }],
          selectedListId: id,
          selectedTaskId: null,
        }));
        return id;
      },
      renameList: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          lists: state.lists.map((list) => (list.id === id ? { ...list, name: trimmed } : list)),
        }));
      },
      deleteList: (id) => {
        const list = get().lists.find((item) => item.id === id);
        if (!list || list.locked) return;
        set((state) => ({
          lists: state.lists.filter((item) => item.id !== id),
          tasks: state.tasks.filter((task) => task.listId !== id),
          selectedListId:
            state.selectedListId === id ? SMART_LISTS.myday : state.selectedListId,
          selectedTaskId: null,
        }));
      },
    }),
    {
      name: "todoing-todo",
      skipHydration: true,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({
        lists: state.lists,
        tasks: state.tasks,
        selectedListId: state.selectedListId,
        sortMode: state.sortMode,
        calendarDay: state.calendarDay,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function useHydrateTodoStore() {
  const hasHydrated = useTodoStore((s) => s.hasHydrated);
  const setHasHydrated = useTodoStore((s) => s.setHasHydrated);

  useEffect(() => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      setHasHydrated(true);
    };
    try {
      const persistApi = useTodoStore.persist;
      persistApi?.onFinishHydration?.(finish);
      const result = persistApi?.rehydrate?.();
      void Promise.resolve(result).then(finish, finish);
    } catch {
      finish();
    }
    const timer = window.setTimeout(finish, 0);
    return () => window.clearTimeout(timer);
  }, [setHasHydrated]);

  return hasHydrated;
}
