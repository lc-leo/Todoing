import { createFileRoute } from "@tanstack/react-router";
import { DaySticky } from "@/components/todo/sticky-widget";

export const Route = createFileRoute("/widget/day")({
  component: DaySticky,
  head: () => ({
    meta: [{ title: "我的一天 · Todoing" }],
  }),
});
