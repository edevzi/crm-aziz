"use client";

import { usePathname } from "next/navigation";

/**
 * Re-runs the page enter animation on every route change by keying the
 * wrapper on the pathname. Pure CSS animation — cheap, no layout thrash.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-in">
      {children}
    </div>
  );
}
