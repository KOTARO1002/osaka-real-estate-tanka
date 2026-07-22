/**
 * Supabase データベース型定義。
 * supabase/migrations のDDLと一致させて手動管理している。
 * （supabase gen types typescript でも再生成可能）
 */

// ---- Enum 型 ----
export type StaffRole = "admin" | "member";

export type DealType = "売買仲介" | "買取再販" | "リノベ";

export type TransactionSide = "売主側" | "買主側" | "両手";

export type LoanStatus =
  | "事前審査前"
  | "事前承認"
  | "本審査中"
  | "本承認"
  | "融資利用なし";

export type DealStatus =
  | "反響・追客"
  | "媒介契約"
  | "売買契約準備"
  | "売買契約済"
  | "融資本審査"
  | "金消・決済準備"
  | "決済完了"
  | "失注・見送り";

export type TaskCategory = "契約前" | "契約〜決済" | "決済後" | "その他";

// ---- テーブル行の型 ----
// 注: これらの行型は Supabase の GenericSchema 制約
// （Record<string, unknown> への代入可能性）を満たすため、
// interface ではなく type エイリアスで定義する必要がある。
export type StaffRow = {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  created_at: string;
  updated_at: string;
};

export type DealRow = {
  id: string;
  name: string;
  deal_type: DealType;
  transaction_side: TransactionSide;
  customer_name: string | null;
  property_address: string | null;
  price: number | null;
  assignee_id: string | null;
  sub_assignee_id: string | null;
  bank: string | null;
  loan_status: LoanStatus;
  contract_date: string | null;
  settlement_date: string | null;
  status: DealStatus;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  deal_id: string;
  title: string;
  due_date: string | null;
  assignee_id: string | null;
  is_done: boolean;
  done_at: string | null;
  category: TaskCategory;
  auto_generated: boolean;
  /** 逆算テンプレートのキー。自動生成タスクの追従・重複判定に使う */
  template_key: string | null;
  /** 手動で期日や内容を編集したか。true の場合は逆算エンジンで上書きしない */
  manually_edited: boolean;
  created_at: string;
  updated_at: string;
};

export type DealActivityRow = {
  id: string;
  deal_id: string;
  staff_id: string | null;
  body: string;
  created_at: string;
};

// ---- Supabase クライアント用 Database 型 ----
type WithDefaults<T, Optional extends keyof T> = Omit<T, Optional> &
  Partial<Pick<T, Optional>>;

export interface Database {
  public: {
    Tables: {
      staff: {
        Row: StaffRow;
        Insert: WithDefaults<StaffRow, "created_at" | "updated_at" | "role">;
        Update: Partial<StaffRow>;
        Relationships: [];
      };
      deals: {
        Row: DealRow;
        Insert: WithDefaults<
          DealRow,
          | "id"
          | "created_at"
          | "updated_at"
          | "customer_name"
          | "property_address"
          | "price"
          | "assignee_id"
          | "sub_assignee_id"
          | "bank"
          | "loan_status"
          | "contract_date"
          | "settlement_date"
          | "status"
          | "memo"
          | "deal_type"
          | "transaction_side"
        >;
        Update: Partial<DealRow>;
        Relationships: [];
      };
      tasks: {
        Row: TaskRow;
        Insert: WithDefaults<
          TaskRow,
          | "id"
          | "created_at"
          | "updated_at"
          | "due_date"
          | "assignee_id"
          | "is_done"
          | "done_at"
          | "auto_generated"
          | "template_key"
          | "manually_edited"
          | "category"
        >;
        Update: Partial<TaskRow>;
        Relationships: [];
      };
      deal_activities: {
        Row: DealActivityRow;
        Insert: WithDefaults<
          DealActivityRow,
          "id" | "created_at" | "staff_id"
        >;
        Update: Partial<DealActivityRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      staff_role: StaffRole;
      deal_type: DealType;
      transaction_side: TransactionSide;
      loan_status: LoanStatus;
      deal_status: DealStatus;
      task_category: TaskCategory;
    };
    CompositeTypes: Record<string, never>;
  };
}
