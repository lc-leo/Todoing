import { useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Home,
  LayoutGrid,
  ListTodo,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Plus,
  Star,
  Sun,
  Trash2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { countFor } from "@/lib/todo/selectors";
import { useTodoStore } from "@/lib/todo/store";
import { SMART_LISTS, type ListId } from "@/lib/todo/types";
import { openWidgetWindow, WIDGET_PATH, type WidgetKind } from "@/lib/todo/widgets";
import { cn } from "@/lib/utils";

const SMART_ITEMS: Array<{
  id: ListId;
  name: string;
  icon: typeof Sun;
}> = [
  { id: SMART_LISTS.myday, name: "我的一天", icon: Sun },
  { id: SMART_LISTS.week, name: "我的一周", icon: CalendarRange },
  { id: SMART_LISTS.calendar, name: "日历", icon: LayoutGrid },
  { id: SMART_LISTS.important, name: "重要", icon: Star },
  { id: SMART_LISTS.planned, name: "已计划", icon: CalendarDays },
  { id: SMART_LISTS.all, name: "全部任务", icon: Home },
  { id: SMART_LISTS.completed, name: "已完成", icon: CheckCircle2 },
];

export function Sidebar({
  compact = false,
  onToggleCompact,
}: {
  compact?: boolean;
  onToggleCompact?: () => void;
}) {
  const lists = useTodoStore((s) => s.lists);
  const tasks = useTodoStore((s) => s.tasks);
  const selectedListId = useTodoStore((s) => s.selectedListId);
  const selectList = useTodoStore((s) => s.selectList);
  const addList = useTodoStore((s) => s.addList);
  const renameList = useTodoStore((s) => s.renameList);
  const deleteList = useTodoStore((s) => s.deleteList);
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteTarget = useMemo(
    () => lists.find((list) => list.id === deleteId) ?? null,
    [lists, deleteId],
  );

  function submitNewList() {
    const id = addList(draft);
    if (id) {
      setDraft("");
      setCreating(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
        <ul className="flex flex-col gap-0.5">
          {SMART_ITEMS.map((item) => {
            const Icon = item.icon;
            const count = countFor(tasks, item.id);
            const active = selectedListId === item.id;
            const button = (
              <button
                type="button"
                onClick={() => selectList(item.id)}
                aria-label={item.name}
                className={cn(
                  "flex h-11 w-full items-center rounded-md text-left text-sm transition-colors duration-quick ease-fluent",
                  compact ? "justify-center px-0" : "gap-3 px-3",
                  active ? "bg-accent-soft text-accent" : "text-fg hover:bg-fg/6",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                {compact ? null : <span className="flex-1 truncate">{item.name}</span>}
                {compact || count === 0 ? null : (
                  <span className="tabular-nums text-xs text-subtle">{count}</span>
                )}
              </button>
            );
            return (
              <li key={item.id}>
                {compact ? (
                  <Tooltip content={item.name} side="right">
                    {button}
                  </Tooltip>
                ) : (
                  button
                )}
              </li>
            );
          })}
        </ul>

        {compact ? (
          <div className="mt-3 flex flex-col gap-0.5">
            <DesktopPin kind="day" label="我的一天" compact />
            <DesktopPin kind="week" label="我的一周" compact />
            <DesktopPin kind="pomodoro" label="番茄钟" compact />
          </div>
        ) : (
          <>
            <div className="mt-4 mb-2 px-3 text-xs font-medium tracking-wide text-subtle">
              桌面便签
            </div>
            <div className="flex flex-col gap-0.5 px-1">
              <DesktopPin kind="day" label="我的一天" />
              <DesktopPin kind="week" label="我的一周" />
              <DesktopPin kind="pomodoro" label="番茄钟" />
            </div>
          </>
        )}

        {compact ? null : (
          <div className="mt-4 mb-2 px-3 text-xs font-medium tracking-wide text-subtle">列表</div>
        )}
        <ul className={cn("flex flex-col gap-0.5", compact && "mt-3")}>
          {lists.map((list) => {
            const count = countFor(tasks, list.id);
            const active = selectedListId === list.id;
            const button = (
              <button
                type="button"
                onClick={() => selectList(list.id)}
                aria-label={list.name}
                className={cn(
                  "flex h-11 w-full items-center rounded-md text-left text-sm transition-colors duration-quick ease-fluent",
                  compact ? "justify-center px-0" : "gap-3 px-3 pr-10",
                  active ? "bg-accent-soft text-accent" : "text-fg hover:bg-fg/6",
                )}
              >
                <ListTodo className="size-4 shrink-0" strokeWidth={1.75} />
                {compact ? null : <span className="flex-1 truncate">{list.name}</span>}
                {compact || count === 0 ? null : (
                  <span className="tabular-nums text-xs text-subtle">{count}</span>
                )}
              </button>
            );
            return (
              <li key={list.id} className="group relative">
                {compact ? (
                  <Tooltip content={list.name} side="right">
                    {button}
                  </Tooltip>
                ) : (
                  button
                )}
                {compact ? null : (
                  <div className="absolute top-1.5 right-1.5 opacity-100 transition-opacity duration-quick sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${list.name} 更多操作`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onSelect={() => {
                            setRenameId(list.id);
                            setRenameValue(list.name);
                          }}
                        >
                          重命名
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="danger"
                          disabled={list.locked}
                          onSelect={() => {
                            if (!list.locked) setDeleteId(list.id);
                          }}
                        >
                          <Trash2 className="size-4" />
                          删除列表
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-2">
        {compact ? (
          <Tooltip content="新建列表" side="right">
            <Button
              variant="ghost"
              size="icon"
              className="w-full"
              aria-label="新建列表"
              onClick={() => {
                onToggleCompact?.();
                setCreating(true);
              }}
            >
              <Plus className="size-4" />
            </Button>
          </Tooltip>
        ) : creating ? (
          <form
            className="flex gap-2 p-1"
            onSubmit={(event) => {
              event.preventDefault();
              submitNewList();
            }}
          >
            <Input
              autoFocus
              value={draft}
              placeholder="列表名称"
              aria-label="新列表名称"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setCreating(false);
                  setDraft("");
                }
              }}
            />
            <Button type="submit" size="icon" aria-label="创建列表">
              <Plus className="size-4" />
            </Button>
          </form>
        ) : (
          <Button
            variant="ghost"
            className="h-11 w-full justify-start px-3"
            onClick={() => setCreating(true)}
          >
            <Plus className="size-4" />
            新建列表
          </Button>
        )}
        {onToggleCompact ? (
          compact ? (
            <Tooltip content="展开侧边栏" side="right">
              <Button
                variant="ghost"
                size="icon"
                className="mt-1 w-full"
                aria-label="展开侧边栏"
                onClick={onToggleCompact}
              >
                <PanelLeftOpen className="size-4" />
              </Button>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="mt-1 h-11 w-full justify-start px-3"
              onClick={onToggleCompact}
            >
              <PanelLeftClose className="size-4" />
              折叠侧边栏
            </Button>
          )
        ) : null}
      </div>

      <Dialog
        open={Boolean(renameId)}
        onOpenChange={(open) => {
          if (!open) setRenameId(null);
        }}
      >
        <DialogContent title="重命名列表">
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (renameId) renameList(renameId, renameValue);
              setRenameId(null);
            }}
          >
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              autoFocus
              aria-label="列表名称"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setRenameId(null)}>
                取消
              </Button>
              <Button type="submit">保存</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent title="删除列表？">
          <p className="text-sm text-muted">
            「{deleteTarget?.name}」中的任务也会被删除，此操作无法撤销。
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              className="bg-danger text-surface hover:brightness-110"
              onClick={() => {
                if (deleteTarget) {
                  deleteList(deleteTarget.id);
                  toast("列表已删除");
                }
                setDeleteId(null);
              }}
            >
              删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DesktopPin({
  kind,
  label,
  compact = false,
}: {
  kind: WidgetKind;
  label: string;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const button = (
    <button
      type="button"
      aria-label={`把${label}贴到桌面`}
      onClick={() => {
        const opened = openWidgetWindow(kind);
        if (opened) {
          toast(`已弹出「${label}」便签`);
          return;
        }
        void navigate({ to: WIDGET_PATH[kind] });
      }}
      className={cn(
        "flex h-10 w-full items-center rounded-md text-left text-sm text-fg hover:bg-fg/6",
        compact ? "justify-center px-0" : "gap-3 px-3",
      )}
    >
      <Pin className="size-4 shrink-0" strokeWidth={1.75} />
      {compact ? null : <span className="truncate">{label}</span>}
    </button>
  );
  if (compact) {
    return (
      <Tooltip content={`贴到桌面：${label}`} side="right">
        {button}
      </Tooltip>
    );
  }
  return button;
}
