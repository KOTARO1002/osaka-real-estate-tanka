import Link from "next/link";
import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfToday,
} from "date-fns";
import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";

import { requireStaff } from "@/lib/auth";
import {
  getOpenTasksAcrossDeals,
  getUpcomingKeyDates,
  type DashboardTask,
} from "@/lib/queries/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateShort } from "@/lib/format";
import { TASK_CATEGORY_COLORS } from "@/lib/domain";
import { cn } from "@/lib/utils";

/** タスク1行（案件名リンク付き） */
function TaskRow({ task, tone }: { task: DashboardTask; tone?: "overdue" }) {
  return (
    <Link
      href={task.deal ? `/deals/${task.deal.id}` : "#"}
      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50"
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: TASK_CATEGORY_COLORS[task.category] }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{task.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {task.deal?.name ?? "（案件不明）"}
          {task.assignee_name && ` ・ ${task.assignee_name}`}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-xs",
          tone === "overdue"
            ? "font-medium text-destructive"
            : "text-muted-foreground"
        )}
      >
        {task.due_date ? formatDateShort(task.due_date) : "期限なし"}
      </span>
    </Link>
  );
}

function Section({
  title,
  count,
  children,
  icon,
  accent,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  icon?: React.ReactNode;
  accent?: "danger" | "primary";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle
          className={cn(
            "flex items-center gap-2 text-sm",
            accent === "danger" && "text-destructive"
          )}
        >
          {icon}
          {title}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {count} 件
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

const EMPTY = (
  <p className="px-2 py-3 text-xs text-muted-foreground">対象のタスクはありません。</p>
);

export default async function DashboardPage() {
  const staff = await requireStaff();
  const today = startOfToday();
  const todayISO = format(today, "yyyy-MM-dd");

  const [tasks, keyDates] = await Promise.all([
    getOpenTasksAcrossDeals(),
    getUpcomingKeyDates(todayISO),
  ]);

  // 期限で仕分け
  const overdue: DashboardTask[] = [];
  const todayTasks: DashboardTask[] = [];
  const thisWeek: DashboardTask[] = [];
  for (const t of tasks) {
    if (!t.due_date) continue;
    const diff = differenceInCalendarDays(parseISO(t.due_date), today);
    if (diff < 0) overdue.push(t);
    else if (diff === 0) todayTasks.push(t);
    else if (diff <= 7) thisWeek.push(t);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">ダッシュボード</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          こんにちは、{staff.name} さん
        </p>
      </div>

      {/* サマリ指標 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">未完タスク</p>
            <p className="mt-1 font-heading text-2xl font-semibold">
              {tasks.length}
            </p>
          </CardContent>
        </Card>
        <Card className={overdue.length > 0 ? "border-destructive/40" : ""}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">期限超過</p>
            <p
              className={cn(
                "mt-1 font-heading text-2xl font-semibold",
                overdue.length > 0 && "text-destructive"
              )}
            >
              {overdue.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">今日のタスク</p>
            <p className="mt-1 font-heading text-2xl font-semibold">
              {todayTasks.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">今週のタスク</p>
            <p className="mt-1 font-heading text-2xl font-semibold">
              {thisWeek.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* 期限超過（赤で警告） */}
          <Section
            title="期限超過"
            count={overdue.length}
            accent="danger"
            icon={<AlertTriangle className="h-4 w-4" />}
          >
            {overdue.length === 0 ? (
              <p className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                期限超過のタスクはありません。
              </p>
            ) : (
              <div className="divide-y">
                {overdue.map((t) => (
                  <TaskRow key={t.id} task={t} tone="overdue" />
                ))}
              </div>
            )}
          </Section>

          {/* 今日 */}
          <Section title="今日やるべきこと" count={todayTasks.length}>
            {todayTasks.length === 0 ? (
              EMPTY
            ) : (
              <div className="divide-y">
                {todayTasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
          </Section>

          {/* 今週 */}
          <Section title="今週（7日以内）" count={thisWeek.length}>
            {thisWeek.length === 0 ? (
              EMPTY
            ) : (
              <div className="divide-y">
                {thisWeek.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* 直近の契約日・決済日 */}
        <div>
          <Section
            title="直近の契約・決済"
            count={keyDates.length}
            icon={<CalendarClock className="h-4 w-4" />}
            accent="primary"
          >
            {keyDates.length === 0 ? (
              EMPTY
            ) : (
              <div className="divide-y">
                {keyDates.map((k) => (
                  <Link
                    key={`${k.deal_id}-${k.kind}`}
                    href={`/deals/${k.deal_id}`}
                    className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50"
                  >
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white",
                        k.kind === "決済" ? "bg-primary" : "bg-sky-500"
                      )}
                    >
                      {k.kind}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {k.deal_name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateShort(k.date)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
