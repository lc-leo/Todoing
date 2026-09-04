import { useEffect, useRef, useState } from "react";
import { Download, Menu, Monitor, Moon, Pin, Search, Sun, Timer, X } from "lucide-react";
import { Toaster, toast } from "sonner";
import { PomodoroPanel, usePomodoroClock } from "@/components/todo/pomodoro-panel";
import { Sidebar } from "@/components/todo/sidebar";
import { TaskDetail } from "@/components/todo/task-detail";
import { TaskPanel } from "@/components/todo/task-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { applyTheme, isDarkTheme, readTheme } from "@/lib/theme";
import { formatClock } from "@/lib/todo/dates";
import { usePomodoroStore } from "@/lib/todo/pomodoro";
import { useHydrateTodoStore, useTodoStore } from "@/lib/todo/store";
import type { ThemePreference } from "@/lib/todo/types";
import { isStandaloneApp, openWidgetWindow, openWindowsInstall } from "@/lib/todo/widgets";
import { cn } from "@/lib/utils";

const ADD_INPUT_ID = "add-task-input";

export function AppShell() {
  const hasHydrated = useHydrateTodoStore();
  const sidebarOpen = useTodoStore((s) => s.sidebarOpen);
  const setSidebarOpen = useTodoStore((s) => s.setSidebarOpen);
  const sidebarCollapsed = useTodoStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useTodoStore((s) => s.setSidebarCollapsed);
  const selectedTaskId = useTodoStore((s) => s.selectedTaskId);
  const selectTask = useTodoStore((s) => s.selectTask);
  const searchQuery = useTodoStore((s) => s.searchQuery);
  const setSearch = useTodoStore((s) => s.setSearch);
  const deleteTask = useTodoStore((s) => s.deleteTask);
  const restoreTask = useTodoStore((s) => s.restoreTask);
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [standalone, setStandalone] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initial = readTheme();
    setTheme(initial);
    applyTheme(initial);
    setStandalone(isStandaloneApp());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readTheme() === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.ctrlKey || event.metaKey;
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        Boolean(target?.isContentEditable);
      if (meta && (event.key === "n" || event.key === "N")) {
        event.preventDefault();
        document.getElementById(ADD_INPUT_ID)?.focus();
        return;
      }
      if (meta && (event.key === "f" || event.key === "k" || event.key === "K")) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key === "Escape") {
        if (searchQuery) {
          setSearch("");
          searchRef.current?.blur();
          return;
        }
        if (selectedTaskId) {
          selectTask(null);
          return;
        }
        setSidebarOpen(false);
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedTaskId && !typing) {
        event.preventDefault();
        const snapshot = deleteTask(selectedTaskId);
        if (snapshot) {
          toast("任务已删除", {
            action: { label: "撤销", onClick: () => restoreTask(snapshot) },
          });
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteTask, restoreTask, searchQuery, selectTask, selectedTaskId, setSearch, setSidebarOpen]);

  function changeTheme(next: ThemePreference) {
    setTheme(next);
    applyTheme(next);
  }

  const dark = isDarkTheme(theme);

  return (
    <TooltipProvider>
      <div className="mica flex h-dvh flex-col overflow-hidden text-fg">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-3">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={sidebarCollapsed ? "展开导航" : "折叠导航"}
            onClick={() => {
              if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
                setSidebarCollapsed(!sidebarCollapsed);
                return;
              }
              setSidebarOpen(true);
            }}
          >
            <Menu className="size-4" />
          </Button>
          <div className="flex min-w-0 items-center gap-2 px-1">
            <AppMark />
            <div className="leading-tight">
              <p className="text-sm font-semibold">Todoing</p>
              <p className="hidden text-xs text-subtle sm:block">Windows 待办</p>
            </div>
          </div>
          <label className="relative mx-auto min-w-0 flex-1 max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索任务"
              aria-label="搜索任务"
              className="h-9 w-full rounded-md bg-surface pr-8 pl-9 text-sm text-fg shadow-border outline-none placeholder:text-subtle focus-visible:shadow-focus"
            />
            {searchQuery ? (
              <button
                type="button"
                aria-label="清除搜索"
                className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-subtle hover:bg-fg/6"
                onClick={() => setSearch("")}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </label>
          <PomodoroDock />
          {standalone ? null : (
            <Tooltip content="安装到 Windows">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="安装到 Windows"
                onClick={openWindowsInstall}
              >
                <Download className="size-4" />
              </Button>
            </Tooltip>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="外观">
                {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>外观</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => changeTheme("light")}>
                <Sun className="size-4" />
                浅色
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => changeTheme("dark")}>
                <Moon className="size-4" />
                深色
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => changeTheme("system")}>
                <Monitor className="size-4" />
                跟随系统
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>快捷键</DropdownMenuLabel>
              <DropdownMenuItem disabled>Ctrl + N 新建</DropdownMenuItem>
              <DropdownMenuItem disabled>Ctrl + F 搜索</DropdownMenuItem>
              <DropdownMenuItem disabled>Delete 删除</DropdownMenuItem>
              {standalone ? null : (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={openWindowsInstall}>
                    <Download className="size-4" />
                    安装到 Windows
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <aside
            className={cn(
              "hidden h-full shrink-0 overflow-hidden border-r border-border transition-[width] duration-fast ease-fluent lg:flex lg:flex-col",
              sidebarCollapsed ? "w-16" : "w-72",
            )}
            style={{ background: "var(--app-sidebar)" }}
          >
            {hasHydrated ? (
              <Sidebar
                compact={sidebarCollapsed}
                onToggleCompact={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            ) : (
              <SidebarSkeleton />
            )}
          </aside>

          {sidebarOpen ? (
            <div className="absolute inset-0 z-30 flex lg:hidden">
              <button
                type="button"
                aria-label="关闭导航"
                className="absolute inset-0 bg-fg/25"
                onClick={() => setSidebarOpen(false)}
              />
              <aside
                className="relative z-10 flex h-full w-72 flex-col shadow-elevated"
                style={{ background: "var(--app-surface)" }}
              >
                <div className="flex h-12 items-center justify-between px-3">
                  <span className="text-sm font-medium">列表</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="关闭导航"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                {hasHydrated ? <Sidebar /> : <SidebarSkeleton />}
              </aside>
            </div>
          ) : null}

          <main className="flex min-w-0 flex-1 overflow-hidden">
            <div className="min-w-0 flex-1 overflow-hidden px-3 py-4 sm:px-6">
              {hasHydrated ? (
                <TaskPanel addInputId={ADD_INPUT_ID} />
              ) : (
                <div className="flex h-full flex-col gap-3">
                  <div className="h-8 w-40 rounded-md bg-fg/8" />
                  <div className="h-12 rounded-lg bg-surface shadow-border" />
                  <div className="h-14 rounded-lg bg-surface shadow-border" />
                  <div className="h-14 rounded-lg bg-surface shadow-border" />
                </div>
              )}
            </div>
            <div
              className={cn(
                "hidden w-80 shrink-0 border-l border-border 2xl:w-96",
                selectedTaskId ? "xl:block" : "xl:hidden",
              )}
            >
              {hasHydrated && selectedTaskId ? <TaskDetail /> : null}
            </div>
          </main>

          {hasHydrated && selectedTaskId ? (
            <div className="absolute inset-0 z-20 xl:hidden">
              <button
                type="button"
                aria-label="关闭详情"
                className="absolute inset-0 bg-fg/25"
                onClick={() => selectTask(null)}
              />
              <div className="absolute inset-y-0 right-0 w-full max-w-md shadow-elevated">
                <TaskDetail />
              </div>
            </div>
          ) : null}
        </div>
        <Toaster theme={dark ? "dark" : "light"} position="bottom-right" />
      </div>
    </TooltipProvider>
  );
}

function PomodoroDock() {
  usePomodoroClock();
  const remainingMs = usePomodoroStore((s) => s.remainingMs);
  const running = usePomodoroStore((s) => s.running);
  const phase = usePomodoroStore((s) => s.phase);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="番茄钟"
          className={cn("gap-1.5 px-2", running && "text-accent")}
        >
          <Timer className="size-4" />
          <span className="hidden tabular-nums sm:inline">{formatClock(remainingMs)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <PomodoroPanel compact />
        <p className="mt-3 text-center text-xs text-subtle">
          当前：{phase === "focus" ? "专注" : phase === "short" ? "短休息" : "长休息"}
        </p>
        <Button
          variant="soft"
          size="sm"
          className="mt-3 w-full"
          onClick={() => {
            const opened = openWidgetWindow("pomodoro");
            toast(opened ? "已弹出番茄钟便签，可拖到桌面常驻。" : "已打开番茄钟窗口");
          }}
        >
          <Pin className="size-4" />
          贴到桌面
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function AppMark() {
  return (
    <span className="flex size-7 items-center justify-center rounded-sm bg-accent text-accent-fg">
      <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
        <path
          d="M3.6 8.2 6.4 11l6-6.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="h-10 rounded-md bg-fg/8" />
      <div className="h-10 rounded-md bg-fg/8" />
      <div className="h-10 rounded-md bg-fg/8" />
      <div className="mt-4 h-10 rounded-md bg-fg/8" />
      <div className="h-10 rounded-md bg-fg/8" />
    </div>
  );
}
