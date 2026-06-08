"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/lib/dictionaries";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Warehouse, Lock, User, Loader2, AlertCircle } from "lucide-react";

export default function LoginForm({ lang }: { lang: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dict = getDictionary(lang);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(dict.invalid_credentials || "Неверное имя пользователя или пароль");
        setLoading(false);
      }
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-mesh p-4 overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-sky-400/15 blur-3xl" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle variant="light" collapsed className="!px-2.5 !py-2.5" />
      </div>

      <div className="relative w-full max-w-[400px] animate-scale-in">
        <div className="rounded-3xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/40 p-8">
          {/* Brand */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 animate-pop">
              <Warehouse className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {dict.login_title || "Adminka"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-[280px]">
              {dict.login_description || "Введите данные для входа в панель управления"}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/90">
                {dict.username || "Имя пользователя"}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  autoComplete="username"
                  className="pl-10 h-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/90">
                {dict.password || "Пароль"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20 px-3 py-2.5 text-sm font-medium animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Вход…
                </>
              ) : (
                dict.sign_in || "Войти"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
