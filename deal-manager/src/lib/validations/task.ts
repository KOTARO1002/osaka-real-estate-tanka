import { z } from "zod";

import { TASK_CATEGORIES } from "@/lib/domain";
import type { TaskCategory, TaskItemType } from "@/lib/supabase/types";

/** タスクの作成・編集フォームスキーマ（フォーム上は文字列） */
export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "内容を入力してください")
    .max(120, "内容が長すぎます"),
  due_date: z
    .string()
    .refine(
      (v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "日付の形式が正しくありません"
    ),
  item_type: z.enum(["todo", "due"]),
  category: z.enum(TASK_CATEGORIES as [TaskCategory, ...TaskCategory[]]),
  assignee_id: z.string(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export interface NormalizedTask {
  title: string;
  due_date: string | null;
  item_type: TaskItemType;
  category: TaskCategory;
  assignee_id: string | null;
}

/** フォーム値をDB書き込み用に変換 */
export function normalizeTask(values: TaskFormValues): NormalizedTask {
  return {
    title: values.title.trim(),
    due_date: values.due_date === "" ? null : values.due_date,
    item_type: values.item_type,
    category: values.category,
    assignee_id: values.assignee_id === "" ? null : values.assignee_id,
  };
}

export const taskFormDefaults: TaskFormValues = {
  title: "",
  due_date: "",
  item_type: "todo",
  category: "その他",
  assignee_id: "",
};
