"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { UserPlus, Trash2 } from "lucide-react";

import {
  inviteStaff,
  updateStaffRole,
  deleteStaff,
  type InviteInput,
} from "./actions";
import type { StaffRow, StaffRole } from "@/lib/supabase/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_LABEL: Record<StaffRole, string> = {
  admin: "管理者",
  member: "メンバー",
};

function InviteDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteInput>({
    defaultValues: { name: "", email: "", role: "member" },
  });
  const role = watch("role");

  const submit = (values: InviteInput) => {
    setServerError(null);
    startTransition(async () => {
      const res = await inviteStaff(values);
      if (res.ok) {
        reset();
        setOpen(false);
        onDone();
      } else {
        setServerError(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        スタッフを招待
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>スタッフを招待</DialogTitle>
          <DialogDescription>
            入力したメールアドレスに招待メールが送信されます。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <Label htmlFor="staff-name" className="mb-1.5 block">
              表示名
            </Label>
            <Input id="staff-name" {...register("name")} />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="staff-email" className="mb-1.5 block">
              メールアドレス
            </Label>
            <Input id="staff-email" type="email" {...register("email")} />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1.5 block">ロール</Label>
            <Select
              value={role}
              onValueChange={(v) => setValue("role", v as StaffRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">メンバー</SelectItem>
                <SelectItem value="admin">管理者</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "招待中..." : "招待を送信"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StaffRowItem({
  member,
  isSelf,
}: {
  member: StaffRow;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const changeRole = (role: StaffRole) => {
    setError(null);
    startTransition(async () => {
      const res = await updateStaffRole(member.id, role);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  const remove = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteStaff(member.id);
      if (!res.ok) setError(res.error);
      else {
        setConfirmOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{member.name}</span>
          {isSelf && (
            <Badge variant="secondary" className="text-[10px]">
              自分
            </Badge>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {member.email}
      </td>
      <td className="px-4 py-3">
        <Select
          value={member.role}
          onValueChange={(v) => changeRole(v as StaffRole)}
          disabled={isPending}
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">{ROLE_LABEL.member}</SelectItem>
            <SelectItem value="admin">{ROLE_LABEL.admin}</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3 text-right">
        {!isSelf && (
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setConfirmOpen(true)}
              aria-label="削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>スタッフを削除しますか？</DialogTitle>
                <DialogDescription>
                  {member.name} さんのアカウントを削除します。この操作は取り消せません。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  disabled={isPending}
                >
                  キャンセル
                </Button>
                <Button
                  variant="destructive"
                  onClick={remove}
                  disabled={isPending}
                >
                  {isPending ? "削除中..." : "削除する"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </td>
    </tr>
  );
}

export function StaffManager({
  staff,
  currentStaffId,
}: {
  staff: StaffRow[];
  currentStaffId: string;
}) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteDialog onDone={() => router.refresh()} />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">名前</th>
                <th className="px-4 py-3 font-medium">メールアドレス</th>
                <th className="px-4 py-3 font-medium">ロール</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {staff.map((m) => (
                <StaffRowItem
                  key={m.id}
                  member={m}
                  isSelf={m.id === currentStaffId}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
