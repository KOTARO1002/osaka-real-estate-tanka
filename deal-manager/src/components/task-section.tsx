"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Sparkles, MoreVertical } from "lucide-react";

import {
  taskFormSchema,
  taskFormDefaults,
  type TaskFormValues,
} from "@/lib/validations/task";
import { TASK_CATEGORIES, TASK_CATEGORY_COLORS } from "@/lib/domain";
import {
  addTask,
  toggleTask,
  updateTask,
  deleteTask,
} from "@/app/(app)/deals/[id]/task-actions";
import type { TaskRow } from "@/lib/supabase/types";
import type { StaffMini } from "@/lib/queries/deals";
import { formatDateShort } from "@/lib/format";
import { getDueStatus, DUE_STATUS_CLASS } from "@/lib/date-status";
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NONE = "__none__";

/** タスク追加・編集フォームの中身 */
function TaskFormFields({
  staff,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  staff: StaffMini[];
  defaultValues: TaskFormValues;
  submitLabel: string;
  onSubmit: (v: TaskFormValues) => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });

  return (
    <form
      onSubmit={handleSubmit((v) => startTransition(() => onSubmit(v)))}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="task-title" className="mb-1.5 block">
          やること
        </Label>
        <Input
          id="task-title"
          placeholder="例）ローン本申込"
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="task-due" className="mb-1.5 block">
            期限
          </Label>
          <Input id="task-due" type="date" {...register("due_date")} />
          {errors.due_date && (
            <p className="mt-1 text-xs text-destructive">
              {errors.due_date.message}
            </p>
          )}
        </div>
        <div>
          <Label className="mb-1.5 block">カテゴリ</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div>
        <Label className="mb-1.5 block">担当</Label>
        <Controller
          control={control}
          name="assignee_id"
          render={({ field }) => (
            <Select
              value={field.value === "" ? NONE : field.value}
              onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="担当を選択" />
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
          )}
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** 1件のタスク行 */
function TaskItem({
  task,
  staffMap,
  dealId,
  staff,
}: {
  task: TaskRow;
  staffMap: Map<string, string>;
  dealId: string;
  staff: StaffMini[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const dueStatus = getDueStatus(task.due_date);

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      await toggleTask(task.id, dealId, checked);
      router.refresh();
    });
  };

  return (
    <div className="flex items-start gap-3 py-2.5">
      <Checkbox
        checked={task.is_done}
        onCheckedChange={(c) => handleToggle(c === true)}
        className="mt-0.5"
        aria-label="完了"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm",
              task.is_done && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </span>
          {task.auto_generated && (
            <span
              className="inline-flex items-center gap-0.5 rounded bg-accent px-1 text-[10px] text-accent-foreground"
              title="逆算エンジンが自動生成したタスク"
            >
              <Sparkles className="h-2.5 w-2.5" />
              自動
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          {task.due_date && (
            <span className={cn(!task.is_done && DUE_STATUS_CLASS[dueStatus])}>
              {formatDateShort(task.due_date)}
              {!task.is_done && dueStatus === "overdue" && " （超過）"}
            </span>
          )}
          <span
            className="rounded px-1 text-[10px] text-white"
            style={{ backgroundColor: TASK_CATEGORY_COLORS[task.category] }}
          >
            {task.category}
          </span>
          {task.assignee_id && (
            <span className="text-muted-foreground">
              {staffMap.get(task.assignee_id) ?? ""}
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            編集
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() =>
              startTransition(async () => {
                await deleteTask(task.id, dealId);
                router.refresh();
              })
            }
          >
            <Trash2 className="h-4 w-4" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タスクを編集</DialogTitle>
          </DialogHeader>
          <TaskFormFields
            staff={staff}
            submitLabel="保存"
            defaultValues={{
              title: task.title,
              due_date: task.due_date ?? "",
              category: task.category,
              assignee_id: task.assignee_id ?? "",
            }}
            onCancel={() => setEditOpen(false)}
            onSubmit={async (v) => {
              await updateTask(task.id, dealId, v);
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TaskSection({
  dealId,
  tasks,
  staff,
}: {
  dealId: string;
  tasks: TaskRow[];
  staff: StaffMini[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const staffMap = new Map(staff.map((s) => [s.id, s.name]));

  const openTasks = tasks.filter((t) => !t.is_done);
  const doneTasks = tasks.filter((t) => t.is_done);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          タスク
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            未完 {openTasks.length} / 全 {tasks.length}
          </span>
        </h2>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </div>

      {tasks.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          タスクはまだありません。契約日・決済日を入れると自動生成されます。
        </p>
      ) : (
        <div className="divide-y">
          {openTasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              staffMap={staffMap}
              dealId={dealId}
              staff={staff}
            />
          ))}
          {doneTasks.length > 0 && (
            <div className="pt-2">
              <p className="py-1 text-xs text-muted-foreground">
                完了済み（{doneTasks.length}）
              </p>
              {doneTasks.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  staffMap={staffMap}
                  dealId={dealId}
                  staff={staff}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タスクを追加</DialogTitle>
          </DialogHeader>
          <TaskFormFields
            staff={staff}
            submitLabel="追加"
            defaultValues={taskFormDefaults}
            onCancel={() => setAddOpen(false)}
            onSubmit={async (v) => {
              await addTask(dealId, v);
              setAddOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
