"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Wallet,
  Warehouse,
  LogOut,
  Menu,
  X,
  Map,
  UserCog,
  Fuel,
  Users,
  Car,
  Sliders,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/lib/dictionaries";
import { RefreshDataButton } from "@/components/RefreshDataButton";

export function MobileSidebar({ lang = 'ru', userRole }: { lang?: string, userRole?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const dict = getDictionary(lang);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const routes = [
    { label: dict.dashboard, icon: LayoutDashboard, href: "/dashboard" },
    { label: dict.live_tracking || "Onlayn xarita", icon: Map, href: "/map" },
    { label: dict.orders, icon: ClipboardList, href: "/orders" },
    { label: dict.clients, icon: Users, href: "/clients" },
    { label: dict.drivers, icon: Car, href: "/drivers" },
    { label: 'Диспетчеры', icon: Phone, href: "/dispatchers" },
    { label: dict.warehouse, icon: Warehouse, href: "/warehouse" },
    { label: dict.safe, icon: Wallet, href: "/safe" },
  ];

  if (userRole === 'admin') {
    routes.push({ label: (dict as any).operators || "Operatorlar", icon: UserCog, href: "/operators" });
  }

  return (
    <>
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200/60 shadow-sm z-[70] md:hidden flex items-center justify-between px-4 backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/dashboard" className="flex items-center">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-2.5 shadow-md shadow-primary/25">
              <Warehouse className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">Adminka</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 scale-90 origin-right">
          <RefreshDataButton lang={lang} compact />
        </div>
      </header>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[90] md:hidden transition-all duration-300 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Content */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 w-64 bg-[#0B0F19] text-white z-[100] md:hidden flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-4 py-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between pl-2 mb-8 mt-2">
            <Link href="/dashboard" className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-primary/30">
                <Warehouse className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Adminka</h1>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close Menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>


          <nav className="space-y-1.5 flex-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200",
                  pathname === route.href ? "text-white bg-primary/20 font-semibold" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn("h-5 w-5 mr-3 transition-colors", pathname === route.href ? "text-primary" : "text-slate-400 group-hover:text-white")} />
                  {route.label}
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <div className="px-3 py-4 border-t border-slate-800/60">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-slate-400"
          >
            <div className="flex items-center flex-1">
              <LogOut className="h-5 w-5 mr-3" />
              {dict.logout}
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
