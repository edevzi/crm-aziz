"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Car,
  Wallet,
  Fuel,
  Warehouse,
  LogOut,
  Map,
  ChevronRight,
  UserCog,
  Sliders,
  Phone,
  Recycle,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/lib/dictionaries";

export function Sidebar({ 
  lang = 'ru', 
  isCollapsed = false,
  userRole
}: { 
  lang?: string; 
  isCollapsed?: boolean;
  userRole?: string;
}) {
  const pathname = usePathname();
  const dict = getDictionary(lang);

  const routes = [
    { label: dict.dashboard,                     icon: LayoutDashboard, href: "/dashboard",  color: "text-blue-400" },
    { label: dict.live_tracking,                      icon: Map,             href: "/map",         color: "text-cyan-400" },
    { label: dict.orders,                        icon: ClipboardList,    href: "/orders",      color: "text-indigo-400" },
    { label: dict.clients,                       icon: Users,            href: "/clients",     color: "text-violet-400" },
    { label: dict.drivers,                       icon: Car,              href: "/drivers",     color: "text-amber-400" },
    { label: 'Диспетчеры', icon: Phone, href: "/dispatchers", color: "text-teal-400" },
    { label: dict.warehouse,                     icon: Warehouse,        href: "/warehouse",   color: "text-rose-400" },
    { label: dict.safe,                          icon: Wallet,           href: "/safe",        color: "text-green-400" },
    { label: 'Уведомления', icon: Bell,     href: "/notifications", color: "text-pink-400" },
  ];

  if (userRole === 'admin') {
    routes.push({ label: dict.operators_menu || ('Операторы'), icon: UserCog, href: "/operators", color: "text-teal-400" });
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden"
      style={{ background: 'linear-gradient(165deg, #0c1220 0%, #0f1729 60%, #0d1420 100%)' }}>
      
      {/* Logo */}
      <div className={cn("px-4 pt-6 pb-4 flex-shrink-0", isCollapsed && "px-3")}>
        <Link href="/dashboard"
          className={cn("flex items-center gap-3 rounded-2xl p-2.5 hover:bg-white/5 transition-colors", isCollapsed && "justify-center")}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Warehouse className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-[17px] font-black tracking-tight text-white leading-none">Adminka</h1>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{'CRM система'}</p>
            </div>
          )}
        </Link>
      </div>



      {/* Divider */}
      <div className={cn("mx-4 mb-3 border-t border-white/5", isCollapsed && "mx-3")} />

      {/* Nav items */}
      <nav className={cn("flex-1 px-3 space-y-0.5", isCollapsed && "px-2")}>
        {routes.map((route) => {
          const isActive = pathname === route.href || pathname.startsWith(route.href + '/');
          return (
            <Link
              key={route.href}
              href={route.href}
              title={isCollapsed ? route.label : undefined}
              className={cn(
                "group relative flex items-center rounded-xl px-3 py-2.5 transition-all duration-150 select-none",
                isCollapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-blue-400" />
              )}
              
              <route.icon className={cn(
                "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                isActive ? route.color : "text-slate-500 group-hover:text-slate-300"
              )} />

              {!isCollapsed && (
                <>
                  <span className={cn(
                    "flex-1 text-[13px] font-semibold truncate",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                  )}>
                    {route.label}
                  </span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={cn("px-3 py-4 border-t border-white/5 flex-shrink-0", isCollapsed && "px-2")}>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          title={isCollapsed ? dict.logout : undefined}
          className={cn(
            "group w-full flex items-center rounded-xl px-3 py-2.5 text-slate-500 hover:text-white hover:bg-red-500/10 transition-all duration-150",
            isCollapsed ? "justify-center" : "gap-3"
          )}
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0 group-hover:text-red-400 transition-colors" />
          {!isCollapsed && (
            <span className="text-[13px] font-semibold">{dict.logout}</span>
          )}
        </button>
      </div>
    </div>
  );
}
