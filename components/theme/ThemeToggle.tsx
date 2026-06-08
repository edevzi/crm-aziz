"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact day/night toggle.
 * - `variant="dark"` is for placement on the dark sidebar.
 * - `variant="light"` is for light surfaces (mobile header, login).
 */
export function ThemeToggle({
  variant = "dark",
  className,
  collapsed = false,
}: {
  variant?: "dark" | "light";
  className?: string;
  collapsed?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");
  // Neutral label until mounted to avoid SSR/client hydration mismatch.
  const label = !mounted ? "Сменить тему" : isDark ? "Светлая тема" : "Тёмная тема";

  const base =
    variant === "dark"
      ? "text-slate-400 hover:text-white hover:bg-white/10"
      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10";

  // Avoid hydration mismatch: render a stable, theme-agnostic shell until mounted.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "group relative flex items-center rounded-xl px-3 py-2.5 transition-all duration-200 press",
        collapsed ? "justify-center" : "gap-3 w-full",
        base,
        className
      )}
    >
      <span className="relative flex h-[18px] w-[18px] items-center justify-center flex-shrink-0">
        <Sun
          className={cn(
            "absolute h-[18px] w-[18px] transition-all duration-300",
            mounted && isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
        <Moon
          className={cn(
            "absolute h-[18px] w-[18px] transition-all duration-300",
            mounted && !isDark
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0"
          )}
        />
      </span>
      {!collapsed && (
        <span className="text-[13px] font-semibold">{label}</span>
      )}
    </button>
  );
}
