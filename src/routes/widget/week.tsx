import { createFileRoute } from "@tanstack/react-router";
import { WeekSticky } from "@/components/todo/sticky-widget";

export const Route = createFileRoute("/widget/week")({
  component: WeekSticky,
  head: () => ({
    meta: [{ title: "我的一周 · Todoing" }],
  }),
});
