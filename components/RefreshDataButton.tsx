'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshOperatorData } from '@/app/actions/refresh-data';
import { getDictionary } from '@/lib/dictionaries';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RefreshDataButton({
  lang,
  className,
  compact,
}: {
  lang: string;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const dict = getDictionary(lang);

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshOperatorData();
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'sm' : 'default'}
      onClick={handleRefresh}
      disabled={pending}
      className={cn(
        'gap-2 border-slate-200 bg-white/90 shadow-sm hover:bg-slate-50',
        compact && 'h-9 px-2.5',
        className
      )}
      title={dict.refresh_data}
    >
      <RefreshCw className={cn('h-4 w-4 text-primary', pending && 'animate-spin')} />
      {!compact && (
        <span className="text-slate-700 font-semibold">
          {pending ? dict.refreshing : dict.refresh_data}
        </span>
      )}
    </Button>
  );
}
