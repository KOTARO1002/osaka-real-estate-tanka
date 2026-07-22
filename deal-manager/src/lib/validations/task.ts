import { z } from "zod";

import { TASK_CATEGORIES } from "@/lib/domain";
import type { TaskCategory } from "@/lib/supabase/types";

/** タスクの作成・編集フォームスキーマ（フォーム上は文字列） */
export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "やることを入力してください")
    .max(120, "内容が長すぎます"),
  due_date: z
    .string()
    .refine(
      (v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "日付の形式が正しくありません"
    ),
  category: z.enum(TASK_CATEGORIES as [TaskCategory, ...TaskCategory[]]),
  assignee_id: z.string(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export interface NormalizedTask {
  title: string;
  due_date: string | null;
  category: TaskCategory;
  assignee_id: string | null;
}

/** フォーム値をDB書き込み用に変換 */
export function normalizeTask(values: TaskFormValues): NormalizedTask {
  return {
    title: values.title.trim(),
    due_date: values.due_date === "" ? null : values.due_date,
    category: values.category,
    assignee_id: values.assignee_id === "" ? null : values.assignee_id,
  };
}

export const taskFormDefaults: TaskFormValues = {
  title: "",
  due_date: "",
  category: "その他",
  assignee_id: "",
};
