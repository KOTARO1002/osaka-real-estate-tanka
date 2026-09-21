"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  dealFormSchema,
  dealFormDefaults,
  type DealFormValues,
} from "@/lib/validations/deal";
import {
  DEAL_STATUSES,
  DEAL_TYPES,
  LOAN_STATUSES,
  TRANSACTION_SIDES,
  BANK_SUGGESTIONS,
} from "@/lib/domain";
import { createDeal, updateDeal } from "@/app/(app)/deals/actions";
import type { DealRow } from "@/lib/supabase/types";
import type { StaffMini } from "@/lib/queries/deals";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";

/** DB行をフォーム値（すべて文字列）へ変換 */
function dealToFormValues(deal: DealRow): DealFormValues {
  return {
    name: deal.name,
    deal_type: deal.deal_type,
    transaction_side: deal.transaction_side,
    status: deal.status,
    loan_status: deal.loan_status,
    customer_name: deal.customer_name ?? "",
    property_address: deal.property_address ?? "",
    price: deal.price != null ? String(deal.price) : "",
    assignee_id: deal.assignee_id ?? "",
    sub_assignee_id: deal.sub_assignee_id ?? "",
    bank: deal.bank ?? "",
    contract_date: deal.contract_date ?? "",
    settlement_date: deal.settlement_date ?? "",
    memo: deal.memo ?? "",
  };
}

function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 block">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** enum用のセレクト */
function EnumSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** 担当者セレクト（未設定を許可、値は空文字） */
function StaffSelect({
  value,
  onChange,
  staff,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  staff: StaffMini[];
  placeholder: string;
}) {
  return (
    <Select
      value={value === "" ? NONE : value}
      onValueChange={(v) => onChange(v === NONE ? "" : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
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
  );
}

export function DealForm({
  staff,
  deal,
}: {
  staff: StaffMini[];
  deal?: DealRow;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEdit = !!deal;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: deal ? dealToFormValues(deal) : dealFormDefaults,
  });

  const onSubmit = (values: DealFormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateDeal(deal!.id, values)
        : await createDeal(values);
      if (result.ok) {
        router.push(`/deals/${result.dealId}`);
        router.refresh();
      } else {
        setServerError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="案件名 / 物件名"
          htmlFor="name"
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          <Input
            id="name"
            placeholder="例）グランドメゾン天王寺 3F"
            {...register("name")}
          />
        </Field>

        <Field label="案件種別" error={errors.deal_type?.message}>
          <Controller
            control={control}
            name="deal_type"
            render={({ field }) => (
              <EnumSelect
                value={field.value}
                onChange={field.onChange}
                options={DEAL_TYPES}
              />
            )}
          />
        </Field>

        <Field label="取引形態" error={errors.transaction_side?.message}>
          <Controller
            control={control}
            name="transaction_side"
            render={({ field }) => (
              <EnumSelect
                value={field.value}
                onChange={field.onChange}
                options={TRANSACTION_SIDES}
              />
            )}
          />
        </Field>

        <Field label="顧客名" htmlFor="customer_name">
          <Input id="customer_name" {...register("customer_name")} />
        </Field>

        <Field label="物件所在地" htmlFor="property_address">
          <Input id="property_address" {...register("property_address")} />
        </Field>

        <Field label="価格（円）" htmlFor="price" error={errors.price?.message}>
          <Input
            id="price"
            type="number"
            inputMode="numeric"
            placeholder="48000000"
            {...register("price")}
          />
        </Field>

        <Field label="ステータス" error={errors.status?.message}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <EnumSelect
                value={field.value}
                onChange={field.onChange}
                options={DEAL_STATUSES}
              />
            )}
          />
        </Field>

        <Field label="主担当">
          <Controller
            control={control}
            name="assignee_id"
            render={({ field }) => (
              <StaffSelect
                value={field.value}
                onChange={field.onChange}
                staff={staff}
                placeholder="主担当を選択"
              />
            )}
          />
        </Field>

        <Field label="副担当">
          <Controller
            control={control}
            name="sub_assignee_id"
            render={({ field }) => (
              <StaffSelect
                value={field.value}
                onChange={field.onChange}
                staff={staff}
                placeholder="副担当を選択"
              />
            )}
          />
        </Field>

        <Field label="採用銀行" htmlFor="bank">
          <Input
            id="bank"
            list="bank-suggestions"
            placeholder="銀行名を入力"
            {...register("bank")}
          />
          <datalist id="bank-suggestions">
            {BANK_SUGGESTIONS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>

        <Field label="融資状況" error={errors.loan_status?.message}>
          <Controller
            control={control}
            name="loan_status"
            render={({ field }) => (
              <EnumSelect
                value={field.value}
                onChange={field.onChange}
                options={LOAN_STATUSES}
              />
            )}
          />
        </Field>

        <Field
          label="売買契約日"
          htmlFor="contract_date"
          error={errors.contract_date?.message}
        >
          <Input id="contract_date" type="date" {...register("contract_date")} />
        </Field>

        <Field
          label="決済・引渡し日"
          htmlFor="settlement_date"
          error={errors.settlement_date?.message}
        >
          <Input
            id="settlement_date"
            type="date"
            {...register("settlement_date")}
          />
        </Field>

        <Field label="備考" htmlFor="memo" className="sm:col-span-2">
          <Textarea id="memo" rows={3} {...register("memo")} />
        </Field>
      </div>

      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : isEdit ? "変更を保存" : "案件を作成"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          キャンセル
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        ※ 契約日・決済日を入力して保存すると、期日逆算タスクが自動生成されます。
      </p>
    </form>
  );
}
