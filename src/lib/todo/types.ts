export const SMART_LISTS = {
  myday: "myday",
  week: "week",
  calendar: "calendar",
  important: "important",
  planned: "planned",
  all: "all",
  completed: "completed",
} as const;

export type SmartListId = (typeof SMART_LISTS)[keyof typeof SMART_LISTS];

export type ListId = SmartListId | string;

export type ThemePreference = "light" | "dark" | "system";

export type SortMode = "default" | "due" | "alpha" | "important";

export type Step = {
  id: string;
  title: string;
  completed: boolean;
};

export type Task = {
  id: string;
  listId: string;
  title: string;
  notes: string;
  completed: boolean;
  important: boolean;
  myDay: boolean;
  dueDate: string | null;
  steps: Step[];
  createdAt: number;
  completedAt: number | null;
};

export type TaskList = {
  id: string;
  name: string;
  createdAt: number;
  locked?: boolean;
};

export type TodoState = {
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
};
