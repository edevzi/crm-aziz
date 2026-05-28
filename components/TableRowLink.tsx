'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export function TableRowLink({ 
  href, 
  children, 
  className 
}: { 
  href: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'select' || tagName === 'option' || tagName === 'button' || tagName === 'a' || target.closest('button') || target.closest('a')) {
      return;
    }
    router.push(href);
  };
  
  return (
    <tr 
      onClick={handleClick} 
      className={`border-b transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-50 cursor-pointer ${className || ''}`}
    >
      {children}
    </tr>
  );
}
