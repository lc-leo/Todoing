import { createFileRoute } from "@tanstack/react-router";
import { PomodoroSticky } from "@/components/todo/sticky-widget";

export const Route = createFileRoute("/widget/pomodoro")({
  component: PomodoroSticky,
  head: () => ({
    meta: [{ title: "番茄钟 · Todoing" }],
  }),
});
