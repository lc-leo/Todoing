import { useEffect } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/todo/dates";
import { POMO_LABEL, POMO_SECONDS, usePomodoroStore, type PomoPhase } from "@/lib/todo/pomodoro";
import { useTodoStore } from "@/lib/todo/store";
import { cn } from "@/lib/utils";

const PHASES: PomoPhase[] = ["focus", "short", "long"];

export function usePomodoroClock() {
  const tick = usePomodoroStore((s) => s.tick);
  const running = usePomodoroStore((s) => s.running);

  useEffect(() => {
    void usePomodoroStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    tick();
    if (!running) return;
    const id = window.setInterval(() => tick(), 250);
    return () => window.clearInterval(id);
  }, [running, tick]);
}

export function PomodoroPanel({ compact = false }: { compact?: boolean }) {
  const phase = usePomodoroStore((s) => s.phase);
  const running = usePomodoroStore((s) => s.running);
  const remainingMs = usePomodoroStore((s) => s.remainingMs);
  const focusCount = usePomodoroStore((s) => s.focusCount);
  const taskId = usePomodoroStore((s) => s.taskId);
  const setPhase = usePomodoroStore((s) => s.setPhase);
  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const reset = usePomodoroStore((s) => s.reset);
  const skip = usePomodoroStore((s) => s.skip);
  const setTaskId = usePomodoroStore((s) => s.setTaskId);
  const selectedTaskId = useTodoStore((s) => s.selectedTaskId);
  const task = useTodoStore((s) => s.tasks.find((item) => item.id === taskId));

  const total = POMO_SECONDS[phase] * 1000;
  const progress = 1 - remainingMs / total;
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dash = circ * Math.min(1, Math.max(0, progress));

  return (
    <div className={cn("flex flex-col items-center", compact ? "gap-3" : "gap-4")}>
      <div className="flex gap-1 rounded-md bg-surface-2 p-1">
        {PHASES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setPhase(item)}
            className={cn(
              "h-8 rounded-sm px-3 text-xs font-medium transition-colors duration-quick",
              phase === item ? "bg-surface text-fg shadow-border" : "text-muted hover:text-fg",
            )}
          >
            {POMO_LABEL[item]}
          </button>
        ))}
      </div>

      <div className="relative size-36">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} fill="none" className="stroke-border" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            className="stroke-accent"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-medium text-2xl tabular-nums leading-none tracking-tight">
            {formatClock(remainingMs)}
          </p>
          <p className="mt-1 text-xs text-subtle">{POMO_LABEL[phase]}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="重置" onClick={reset}>
          <RotateCcw className="size-4" />
        </Button>
        <Button size="lg" onClick={running ? pause : start} aria-label={running ? "暂停" : "开始"}>
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "暂停" : "开始"}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="跳过" onClick={skip}>
          <SkipForward className="size-4" />
        </Button>
      </div>

      <p className="text-xs tabular-nums text-subtle">今日完成 {focusCount} 个番茄</p>

      {task ? (
        <p className="max-w-56 truncate text-center text-xs text-muted">正在做：{task.title}</p>
      ) : selectedTaskId ? (
        <Button variant="ghost" size="sm" onClick={() => setTaskId(selectedTaskId)}>
          绑定当前任务
        </Button>
      ) : null}
    </div>
  );
}
