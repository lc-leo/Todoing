import { useNavigate } from "@tanstack/react-router";
import { Pin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openWidgetWindow, WIDGET_PATH, type WidgetKind } from "@/lib/todo/widgets";

const LABELS: Record<WidgetKind, string> = {
  day: "把我的一天贴到桌面",
  week: "把我的一周贴到桌面",
  pomodoro: "把番茄钟贴到桌面",
};

export function PinButton({ kind }: { kind: WidgetKind }) {
  const navigate = useNavigate();

  function pin() {
    const opened = openWidgetWindow(kind);
    if (opened) {
      toast("已弹出桌面便签，可拖到屏幕角落常驻。");
      return;
    }
    void navigate({ to: WIDGET_PATH[kind] });
    toast("已切换为便签视图。安装到 Windows 后，可再弹出独立小窗。");
  }

  return (
    <Button variant="soft" size="sm" onClick={pin} aria-label={LABELS[kind]}>
      <Pin className="size-4" />
      贴到桌面
    </Button>
  );
}
