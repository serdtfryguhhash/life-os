'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Flame,
  Target,
  BookOpen,
  Wallet,
  StickyNote,
  Timer,
  ClipboardCheck,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { DataExport } from '@/components/data-export';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

// ============================================================
// Navigation config
// ============================================================

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, color: '#6C5CE7' },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays, color: '#00D2FF' },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare, color: '#00E676' },
  { label: 'Habits', href: '/habits', icon: Flame, color: '#FF9100' },
  { label: 'Goals', href: '/goals', icon: Target, color: '#FF6B9D' },
  { label: 'Journal', href: '/journal', icon: BookOpen, color: '#FFD600' },
  { label: 'Finance', href: '/finance', icon: Wallet, color: '#00E676' },
  { label: 'Notes', href: '/notes', icon: StickyNote, color: '#00D2FF' },
  { label: 'Focus', href: '/focus', icon: Timer, color: '#FF5252' },
  { label: 'Review', href: '/review', icon: ClipboardCheck, color: '#2DD4BF' },
] as const;

// ============================================================
// Sidebar component
// ============================================================

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // ----------------------------------------------------------
  // Shared nav link renderer
  // ----------------------------------------------------------
  const renderNavItem = (
    item: (typeof NAV_ITEMS)[number],
    showLabel: boolean
  ) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`
          group relative flex items-center gap-3 rounded-xl px-3 py-2.5
          transition-all duration-200
          ${
            active
              ? 'bg-gradient-to-r from-[#6C5CE7]/20 to-[#00D2FF]/10 glow'
              : 'hover:bg-[#1A1A25]'
          }
        `}
      >
        {/* Active indicator bar */}
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#6C5CE7] to-[#00D2FF]"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}

        {/* Icon with color dot */}
        <div className="relative flex-shrink-0">
          <Icon
            size={20}
            className={`transition-colors ${
              active ? 'text-[#F0F0F5]' : 'text-[#8888A0] group-hover:text-[#F0F0F5]'
            }`}
          />
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
        </div>

        {/* Label (visible when expanded or in mobile sheet) */}
        {showLabel && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className={`whitespace-nowrap text-sm font-medium ${
              active ? 'text-[#F0F0F5]' : 'text-[#8888A0] group-hover:text-[#F0F0F5]'
            }`}
          >
            {item.label}
          </motion.span>
        )}
      </Link>
    );

    // Wrap in tooltip only when collapsed (desktop)
    if (!showLabel) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{linkContent}</div>;
  };

  // ----------------------------------------------------------
  // Desktop sidebar
  // ----------------------------------------------------------
  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-[#13131A] text-[#8888A0] hover:text-[#F0F0F5] md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile sheet overlay */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 border-r border-[#2A2A3A] bg-[#0A0A0F] p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-full flex-col px-3 py-4">
            {/* Mobile header */}
            <div className="mb-6 flex items-center justify-between px-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C5CE7] to-[#00D2FF] text-sm font-bold text-white">
                  L
                </div>
                <span className="text-lg font-semibold text-[#F0F0F5]">
                  LifeOS
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8888A0] hover:text-[#F0F0F5]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile nav items */}
            <nav className="flex flex-1 flex-col gap-1">
              {NAV_ITEMS.map((item) => renderNavItem(item, true))}
            </nav>

            {/* Mobile footer */}
            <div className="mt-auto flex flex-col gap-1 border-t border-[#2A2A3A] pt-3">
              <DataExport />
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[#8888A0] hover:bg-[#1A1A25] hover:text-[#F0F0F5]"
              >
                <Settings size={20} />
                <span className="text-sm font-medium">Settings</span>
              </Link>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00D2FF] text-xs font-bold text-white">
                  S
                </div>
                <span className="text-sm font-medium text-[#8888A0]">
                  User
                </span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: expanded ? 240 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[#2A2A3A] bg-[#0A0A0F]/80 backdrop-blur-xl md:flex"
      >
        <div className="flex h-full flex-col px-3 py-4">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3 px-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#00D2FF] text-sm font-bold text-white shadow-lg shadow-[#6C5CE7]/20">
              L
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap text-lg font-semibold text-[#F0F0F5]"
                >
                  LifeOS
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map((item) => renderNavItem(item, expanded))}
          </nav>

          {/* Footer — data export + settings + avatar */}
          <div className="mt-auto flex flex-col gap-1 border-t border-[#2A2A3A] pt-3">
            {/* Data Export */}
            {expanded ? (
              <DataExport />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DataExport />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  Data
                </TooltipContent>
              </Tooltip>
            )}

            {/* Settings */}
            {expanded ? (
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[#8888A0] hover:bg-[#1A1A25] hover:text-[#F0F0F5]"
              >
                <Settings size={20} className="flex-shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium"
                    >
                      Settings
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/settings"
                    className="flex items-center justify-center rounded-xl px-3 py-2.5 text-[#8888A0] hover:bg-[#1A1A25] hover:text-[#F0F0F5]"
                  >
                    <Settings size={20} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  Settings
                </TooltipContent>
              </Tooltip>
            )}

            {/* User avatar */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00D2FF] text-xs font-bold text-white">
                S
              </div>
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium text-[#8888A0]"
                  >
                    User
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
