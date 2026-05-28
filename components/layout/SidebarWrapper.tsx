'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { MobileSidebar } from './mobile-sidebar';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RefreshDataButton } from '@/components/RefreshDataButton';

export function SidebarWrapper({ 
  lang, 
  userRole,
  children 
}: { 
  lang: string; 
  userRole?: string;
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem('sidebar-collapsed', String(nextValue));
  };

  if (!isMounted) {
    return (
    <div className="h-full relative bg-mesh min-h-screen font-sans antialiased">
        <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80]">
          <Sidebar lang={lang} isCollapsed={false} userRole={userRole} />
        </div>
        <main className="md:pl-64 h-full relative z-10 pt-16 md:pt-0">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="hidden md:flex justify-end mb-4">
              <RefreshDataButton lang={lang} />
            </div>
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-mesh min-h-screen font-sans antialiased">
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-blue-50/40 to-transparent pointer-events-none z-0" />
      
      {/* Mobile Sidebar & Header */}
      <MobileSidebar lang={lang} userRole={userRole} />

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] transition-all duration-300 ease-in-out",
        isCollapsed ? "md:w-20" : "md:w-64"
      )}>
        <Sidebar lang={lang} isCollapsed={isCollapsed} userRole={userRole} />
        
        {/* Toggle Collapse Button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-slate-700 bg-[#0B0F19] text-white flex items-center justify-center hover:bg-slate-800 shadow-md cursor-pointer transition-transform duration-200 z-[90]"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
      
      <main className={cn(
        "h-full relative z-10 pt-16 md:pt-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "md:pl-20" : "md:pl-64"
      )}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <div className="hidden md:flex justify-end mb-4">
            <RefreshDataButton lang={lang} />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
