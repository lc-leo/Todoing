import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { todayIso } from "./dates";

export type PomoPhase = "focus" | "short" | "long";

export const POMO_SECONDS: Record<PomoPhase, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

export const POMO_LABEL: Record<PomoPhase, string> = {
  focus: "专注",
  short: "短休息",
  long: "长休息",
};

type PomoStore = {
  phase: PomoPhase;
  running: boolean;
  endsAt: number | null;
  remainingMs: number;
  focusCount: number;
  focusDate: string;
  taskId: string | null;
  setPhase: (phase: PomoPhase) => void;
  setTaskId: (id: string | null) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  tick: (now?: number) => void;
};

function nextPhase(phase: PomoPhase, focusCount: number): PomoPhase {
  if (phase === "focus") return focusCount % 4 === 0 ? "long" : "short";
  return "focus";
}

function playChime() {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  [0, 0.18].forEach((offset, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = index === 0 ? 880 : 1320;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.08, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.18);
  });
  window.setTimeout(() => void ctx.close(), 600);
}

function notify(title: string, body: string) {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body });
  } catch {
    /* ignore */
  }
}

export const usePomodoroStore = create<PomoStore>()(
  persist(
    (set, get) => ({
      phase: "focus",
      running: false,
      endsAt: null,
      remainingMs: POMO_SECONDS.focus * 1000,
      focusCount: 0,
      focusDate: todayIso(),
      taskId: null,
      setPhase: (phase) =>
        set({
          phase,
          running: false,
          endsAt: null,
          remainingMs: POMO_SECONDS[phase] * 1000,
        }),
      setTaskId: (id) => set({ taskId: id }),
      start: () => {
        const { remainingMs } = get();
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
          void Notification.requestPermission();
        }
        set({ running: true, endsAt: Date.now() + remainingMs });
      },
      pause: () => {
        const { endsAt, remainingMs } = get();
        const left = endsAt ? Math.max(0, endsAt - Date.now()) : remainingMs;
        set({ running: false, endsAt: null, remainingMs: left });
      },
      reset: () => {
        const { phase } = get();
        set({ running: false, endsAt: null, remainingMs: POMO_SECONDS[phase] * 1000 });
      },
      skip: () => {
        const { phase, focusCount, focusDate } = get();
        const today = todayIso();
        const count = focusDate === today ? focusCount : 0;
        const nextCount = phase === "focus" ? count + 1 : count;
        const next = nextPhase(phase, nextCount);
        set({
          phase: next,
          running: false,
          endsAt: null,
          remainingMs: POMO_SECONDS[next] * 1000,
          focusCount: nextCount,
          focusDate: today,
        });
      },
      tick: (now = Date.now()) => {
        const state = get();
        const today = todayIso();
        if (state.focusDate !== today) {
          set({ focusCount: 0, focusDate: today });
        }
        if (!state.running || !state.endsAt) return;
        const left = state.endsAt - now;
        if (left > 0) {
          set({ remainingMs: left });
          return;
        }
        const count = state.focusDate === today ? state.focusCount : 0;
        const nextCount = state.phase === "focus" ? count + 1 : count;
        const next = nextPhase(state.phase, nextCount);
        playChime();
        if (state.phase === "focus") {
          notify("专注结束", "休息一下，下一轮随时可以开始。");
        } else {
          notify("休息结束", "准备开始下一轮专注。");
        }
        set({
          phase: next,
          running: false,
          endsAt: null,
          remainingMs: POMO_SECONDS[next] * 1000,
          focusCount: nextCount,
          focusDate: today,
        });
      },
    }),
    {
      name: "todoing-pomodoro",
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
    },
  ),
);
