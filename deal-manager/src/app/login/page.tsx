import { LoginForm } from "./login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center space-y-2 text-center">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md text-lg font-bold text-white"
              style={{ backgroundColor: "#58A1AA" }}
            >
              S
            </div>
            <span className="font-heading text-xl font-semibold">案件管理</span>
          </div>
          <p className="text-sm text-muted-foreground">
            シンプルハウス 社内ログイン
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            アカウントは管理者が発行します。ログインできない場合は管理者にお問い合わせください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
