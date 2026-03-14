'use client';

import { usePathname } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/command-palette';
import { AchievementToast } from '@/components/shared/AchievementToast';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Sidebar />
      <CommandPalette />
      <AchievementToast />
      {/* Main content - padded for desktop sidebar (72px collapsed) */}
      <main className="min-h-screen pl-0 pt-14 md:pl-[72px] md:pt-0">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </TooltipProvider>
  );
}
