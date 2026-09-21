"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Flag,
} from "lucide-react";

import {
  addTask,
  toggleTask,
  updateTask,
  deleteTask,
} from "@/app/(app)/deals/[id]/task-actions";
import type { TaskRow, TaskItemType } from "@/lib/supabase/types";
import type { StaffMini } from "@/lib/queries/deals";
import {
  EVENT_PRESETS,
  TODO_PRESETS,
  type TaskPreset,
} from "@/lib/domain";
import type { TaskFormValues } from "@/lib/validations/task";
import { formatDateShort } from "@/lib/format";
import { getDueStatus } from "@/lib/date-status";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const NONE = "__none__";
const PRESET_PLACEHOLDER = "__pick__";

/** yyyy-MM-dd */
function iso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

// ============================================================
// 追加・編集ダイアログ
// ============================================================
function TaskDialog({
  open,
  onOpenChange,
  staff,
  initial,
  title,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  staff: StaffMini[];
  initial: TaskFormValues;
  title: string;
  onSubmit: (v: TaskFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [values, setValues] = useState<TaskFormValues>(initial);
  const [isPending, startTransition] = useTransition();

  // ダイアログを開くたびに初期値へ同期
  const [syncKey, setSyncKey] = useState("");
  const key = `${open}-${initial.title}-${initial.due_date}-${initial.item_type}`;
  if (open && key !== syncKey) {
    setSyncKey(key);
    setValues(initial);
  }

  const set = (patch: Partial<TaskFormValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  const applyPreset = (p: TaskPreset) => {
    set({ title: p.title, item_type: p.type, category: p.category });
  };

  const submit = () => {
    if (!values.title.trim()) return;
    startTransition(async () => {
      await onSubmit(values);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 種別トグル */}
          <div>
            <Label className="mb-1.5 block">種別</Label>
            <div className="flex w-fit overflow-hidden rounded-md border">
              {(["todo", "due"] as TaskItemType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set({ item_type: t })}
                  className={cn(
                    "px-4 py-1.5 text-sm transition-colors",
                    values.item_type === t
                      ? t === "due"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground"
                  )}
                >
                  {t === "todo" ? "やること" : "期日"}
                </button>
              ))}
            </div>
          </div>

          {/* プルダウン（よく使う項目） */}
          <div>
            <Label className="mb-1.5 block">よく使う項目から選択（任意）</Label>
            <Select
              value={PRESET_PLACEHOLDER}
              onValueChange={(v) => {
                const all = [...EVENT_PRESETS, ...TODO_PRESETS];
                const found = all.find((p) => `${p.type}|${p.title}` === v);
                if (found) applyPreset(found);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PRESET_PLACEHOLDER} disabled>
                  選択してください
                </SelectItem>
                <SelectLabel>必ずあるイベント（期日）</SelectLabel>
                {EVENT_PRESETS.map((p) => (
                  <SelectItem key={p.title} value={`${p.type}|${p.title}`}>
                    {p.title}
                  </SelectItem>
                ))}
                <SelectLabel>よく使うやること</SelectLabel>
                {TODO_PRESETS.map((p) => (
                  <SelectItem key={p.title} value={`${p.type}|${p.title}`}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 内容 */}
          <div>
            <Label htmlFor="ti" className="mb-1.5 block">
              内容
            </Label>
            <Input
              id="ti"
              value={values.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder={
                values.item_type === "due"
                  ? "例）売買契約"
                  : "例）内見同行"
              }
            />
          </div>

          {/* 日付・担当 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="td" className="mb-1.5 block">
                日付
              </Label>
              <Input
                id="td"
                type="date"
                value={values.due_date}
                onChange={(e) => set({ due_date: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block">担当</Label>
              <Select
                value={values.assignee_id === "" ? NONE : values.assignee_id}
                onValueChange={(v) =>
                  set({ assignee_id: v === NONE ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="担当" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>未設定</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 items-center">
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-destructive"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await onDelete();
                  onOpenChange(false);
                })
              }
            >
              <Trash2 className="h-4 w-4" />
              削除
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// カレンダー本体
// ============================================================
export function DealCalendar({
  dealId,
  tasks,
  staff,
  initialMonth,
}: {
  dealId: string;
  tasks: TaskRow[];
  staff: StaffMini[];
  /** 初期表示する月（yyyy-MM-dd）。契約日など案件の日付を渡す */
  initialMonth: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [cursor, setCursor] = useState<Date>(
    startOfMonth(parseISO(initialMonth))
  );
  const [addState, setAddState] = useState<{ open: boolean; date: string }>({
    open: false,
    date: "",
  });
  const [editTask, setEditTask] = useState<TaskRow | null>(null);

  const staffMap = useMemo(
    () => new Map(staff.map((s) => [s.id, s.name])),
    [staff]
  );

  // 日付ごとのタスク
  const byDate = useMemo(() => {
    const m = new Map<string, TaskRow[]>();
    for (const t of tasks) {
      if (!t.due_date) continue;
      const arr = m.get(t.due_date) ?? [];
      arr.push(t);
      m.set(t.due_date, arr);
    }
    return m;
  }, [tasks]);

  // カレンダーのマス目（週始まり日曜）
  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const out: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [cursor]);

  const today = new Date();

  const openAdd = (date: string) => setAddState({ open: true, date });

  const handleAdd = async (v: TaskFormValues) => {
    await addTask(dealId, v);
    router.refresh();
  };
  const handleUpdate = async (v: TaskFormValues) => {
    if (!editTask) return;
    await updateTask(editTask.id, dealId, v);
    router.refresh();
  };
  const handleDelete = async () => {
    if (!editTask) return;
    await deleteTask(editTask.id, dealId);
    router.refresh();
  };

  // アジェンダ（日付順）
  const agenda = useMemo(
    () =>
      tasks
        .filter((t) => t.due_date)
        .slice()
        .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1)),
    [tasks]
  );
  const noDate = useMemo(() => tasks.filter((t) => !t.due_date), [tasks]);

  return (
    <div className="space-y-6">
      {/* カレンダー */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-heading text-base font-semibold">
            {format(cursor, "yyyy年 M月")}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCursor((c) => addMonths(c, -1))}
              aria-label="前の月"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCursor((c) => addMonths(c, 1))}
              aria-label="次の月"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-7 bg-muted/50">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={cn(
                  "py-1.5 text-center text-[11px] font-medium text-muted-foreground",
                  i === 0 && "text-destructive",
                  i === 6 && "text-blue-600"
                )}
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d, i) => {
              const key = iso(d);
              const items = byDate.get(key) ?? [];
              const inMonth = isSameMonth(d, cursor);
              const dow = d.getDay();
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => openAdd(key)}
                  className={cn(
                    "min-h-[62px] border-l border-t p-1 text-left align-top transition-colors hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring",
                    i % 7 === 0 && "border-l-0",
                    !inMonth && "bg-muted/20"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block px-1 text-[10px] tabular-nums",
                      !inMonth && "text-muted-foreground/50",
                      inMonth && dow === 0 && "text-destructive",
                      inMonth && dow === 6 && "text-blue-600",
                      isSameDay(d, today) &&
                        "rounded-full bg-primary px-1.5 font-medium text-primary-foreground"
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <span className="mt-0.5 block space-y-0.5">
                    {items.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTask(t);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            setEditTask(t);
                          }
                        }}
                        className={cn(
                          "block cursor-pointer truncate rounded px-1 py-px text-[8.5px] leading-tight",
                          t.item_type === "due"
                            ? "bg-destructive/10 font-semibold text-destructive"
                            : t.is_done
                              ? "bg-muted text-muted-foreground line-through"
                              : "bg-muted text-foreground"
                        )}
                      >
                        {t.item_type === "due" ? "● " : ""}
                        {t.title}
                      </span>
                    ))}
                    {items.length > 3 && (
                      <span className="block px-1 text-[8.5px] text-muted-foreground">
                        +{items.length - 3}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-destructive/20" />
            期日（赤字・表示のみ）
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted" />
            やること
          </span>
        </div>
      </div>

      {/* この先の予定・やること */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">この先の予定・やること</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openAdd(iso(today))}
          >
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>

        {agenda.length === 0 && noDate.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            まだ予定はありません。カレンダーの日付をタップして追加できます。
          </p>
        ) : (
          <div className="divide-y">
            {agenda.map((t) => (
              <AgendaRow
                key={t.id}
                task={t}
                dealId={dealId}
                staffName={t.assignee_id ? staffMap.get(t.assignee_id) : null}
                onEdit={() => setEditTask(t)}
                onToggle={(checked) =>
                  startTransition(async () => {
                    await toggleTask(t.id, dealId, checked);
                    router.refresh();
                  })
                }
              />
            ))}
            {noDate.map((t) => (
              <AgendaRow
                key={t.id}
                task={t}
                dealId={dealId}
                staffName={t.assignee_id ? staffMap.get(t.assignee_id) : null}
                onEdit={() => setEditTask(t)}
                onToggle={(checked) =>
                  startTransition(async () => {
                    await toggleTask(t.id, dealId, checked);
                    router.refresh();
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* 追加ダイアログ */}
      <TaskDialog
        open={addState.open}
        onOpenChange={(o) => setAddState((s) => ({ ...s, open: o }))}
        staff={staff}
        title="予定・やることを追加"
        initial={{
          title: "",
          due_date: addState.date,
          item_type: "todo",
          category: "その他",
          assignee_id: "",
        }}
        onSubmit={handleAdd}
      />

      {/* 編集ダイアログ */}
      <TaskDialog
        open={!!editTask}
        onOpenChange={(o) => !o && setEditTask(null)}
        staff={staff}
        title="予定・やることを編集"
        initial={{
          title: editTask?.title ?? "",
          due_date: editTask?.due_date ?? "",
          item_type: editTask?.item_type ?? "todo",
          category: editTask?.category ?? "その他",
          assignee_id: editTask?.assignee_id ?? "",
        }}
        onSubmit={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}

// アジェンダの1行
function AgendaRow({
  task,
  staffName,
  onEdit,
  onToggle,
}: {
  task: TaskRow;
  dealId: string;
  staffName: string | null | undefined;
  onEdit: () => void;
  onToggle: (checked: boolean) => void;
}) {
  const isDue = task.item_type === "due";
  const dueStatus = getDueStatus(task.due_date);

  return (
    <div className="flex items-center gap-3 py-2.5">
      {isDue ? (
        <Flag className="h-4 w-4 shrink-0 text-destructive" />
      ) : (
        <Checkbox
          checked={task.is_done}
          onCheckedChange={(c) => onToggle(c === true)}
          aria-label="完了"
        />
      )}
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 flex-col items-start text-left"
      >
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-sm",
              isDue && "font-semibold text-destructive",
              !isDue && task.is_done && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </span>
          {task.auto_generated && (
            <Sparkles className="h-3 w-3 text-primary/60" />
          )}
        </span>
        {staffName && (
          <span className="text-xs text-muted-foreground">{staffName}</span>
        )}
      </button>
      <span
        className={cn(
          "shrink-0 text-xs tabular-nums",
          isDue
            ? "font-medium text-destructive"
            : dueStatus === "overdue" && !task.is_done
              ? "font-medium text-destructive"
              : "text-muted-foreground"
        )}
      >
        {task.due_date ? formatDateShort(task.due_date) : "日付なし"}
        {isDue && (
          <span className="ml-1 rounded border border-destructive/30 bg-destructive/10 px-1 text-[10px]">
            期日
          </span>
        )}
      </span>
    </div>
  );
}
