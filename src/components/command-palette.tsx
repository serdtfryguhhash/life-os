'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
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
  Plus,
  PenLine,
  Play,
  Command,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface CommandItem {
  id: string;
  label: string;
  section: 'Navigation' | 'Quick Actions';
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

// ============================================================
// Fuzzy search helper
// ============================================================

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ============================================================
// Command Palette Component
// ============================================================

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ----------------------------------------------------------
  // Build command list
  // ----------------------------------------------------------
  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        section: 'Navigation',
        icon: <LayoutDashboard size={18} />,
        shortcut: 'G D',
        action: () => router.push('/'),
      },
      {
        id: 'nav-calendar',
        label: 'Calendar',
        section: 'Navigation',
        icon: <CalendarDays size={18} />,
        shortcut: 'G C',
        action: () => router.push('/calendar'),
      },
      {
        id: 'nav-tasks',
        label: 'Tasks',
        section: 'Navigation',
        icon: <CheckSquare size={18} />,
        shortcut: 'G T',
        action: () => router.push('/tasks'),
      },
      {
        id: 'nav-habits',
        label: 'Habits',
        section: 'Navigation',
        icon: <Flame size={18} />,
        shortcut: 'G H',
        action: () => router.push('/habits'),
      },
      {
        id: 'nav-goals',
        label: 'Goals',
        section: 'Navigation',
        icon: <Target size={18} />,
        shortcut: 'G O',
        action: () => router.push('/goals'),
      },
      {
        id: 'nav-journal',
        label: 'Journal',
        section: 'Navigation',
        icon: <BookOpen size={18} />,
        shortcut: 'G J',
        action: () => router.push('/journal'),
      },
      {
        id: 'nav-finance',
        label: 'Finance',
        section: 'Navigation',
        icon: <Wallet size={18} />,
        shortcut: 'G F',
        action: () => router.push('/finance'),
      },
      {
        id: 'nav-notes',
        label: 'Notes',
        section: 'Navigation',
        icon: <StickyNote size={18} />,
        shortcut: 'G N',
        action: () => router.push('/notes'),
      },
      {
        id: 'nav-focus',
        label: 'Focus',
        section: 'Navigation',
        icon: <Timer size={18} />,
        shortcut: 'G P',
        action: () => router.push('/focus'),
      },
      {
        id: 'nav-review',
        label: 'Weekly Review',
        section: 'Navigation',
        icon: <ClipboardCheck size={18} />,
        shortcut: 'G R',
        action: () => router.push('/review'),
      },
      // Quick Actions
      {
        id: 'action-add-task',
        label: 'Add Task',
        section: 'Quick Actions',
        icon: <Plus size={18} />,
        action: () => router.push('/tasks'),
      },
      {
        id: 'action-add-event',
        label: 'Add Event',
        section: 'Quick Actions',
        icon: <CalendarDays size={18} />,
        action: () => router.push('/calendar'),
      },
      {
        id: 'action-add-note',
        label: 'Add Note',
        section: 'Quick Actions',
        icon: <PenLine size={18} />,
        action: () => router.push('/notes'),
      },
      {
        id: 'action-start-focus',
        label: 'Start Focus Timer',
        section: 'Quick Actions',
        icon: <Play size={18} />,
        action: () => router.push('/focus'),
      },
      {
        id: 'action-write-journal',
        label: 'Write Journal Entry',
        section: 'Quick Actions',
        icon: <BookOpen size={18} />,
        action: () => router.push('/journal'),
      },
    ],
    [router]
  );

  // ----------------------------------------------------------
  // Filter commands
  // ----------------------------------------------------------
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    return commands.filter((cmd) => fuzzyMatch(query, cmd.label));
  }, [query, commands]);

  const sections = useMemo(() => {
    const nav = filtered.filter((c) => c.section === 'Navigation');
    const actions = filtered.filter((c) => c.section === 'Quick Actions');
    return { nav, actions };
  }, [filtered]);

  const flatList = useMemo(
    () => [...sections.nav, ...sections.actions],
    [sections]
  );

  // ----------------------------------------------------------
  // Keyboard shortcut to open
  // ----------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ----------------------------------------------------------
  // Navigation within the palette
  // ----------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatList.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flatList.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (flatList[selectedIndex]) {
            flatList[selectedIndex].action();
            setOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [flatList, selectedIndex]
  );

  // Keep selected in view
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[15%] z-[101] w-full max-w-xl -translate-x-1/2"
            onKeyDown={handleKeyDown}
          >
            <div className="overflow-hidden rounded-2xl border border-[#2A2A3A]/60 bg-[#13131A]/90 shadow-2xl shadow-black/40 backdrop-blur-xl">
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-[#2A2A3A]/60 px-4 py-3">
                <Search size={18} className="flex-shrink-0 text-[#8888A0]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-sm text-[#F0F0F5] placeholder-[#55556A] outline-none"
                />
                <kbd className="hidden rounded-md border border-[#2A2A3A] bg-[#1A1A25] px-1.5 py-0.5 text-[10px] font-medium text-[#8888A0] sm:inline-block">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-[360px] overflow-y-auto p-2"
              >
                {flatList.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-[#55556A]">
                    No results found
                  </div>
                )}

                {/* Navigation section */}
                {sections.nav.length > 0 && (
                  <div className="mb-1">
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#55556A]">
                      Navigation
                    </div>
                    {sections.nav.map((cmd) => {
                      const idx = flatList.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          data-selected={idx === selectedIndex}
                          onClick={() => {
                            cmd.action();
                            setOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            idx === selectedIndex
                              ? 'bg-[#6C5CE7]/15 text-[#F0F0F5]'
                              : 'text-[#8888A0] hover:bg-[#1A1A25]'
                          }`}
                        >
                          <span
                            className={
                              idx === selectedIndex
                                ? 'text-[#6C5CE7]'
                                : 'text-[#8888A0]'
                            }
                          >
                            {cmd.icon}
                          </span>
                          <span className="flex-1 text-sm font-medium">
                            {cmd.label}
                          </span>
                          {cmd.shortcut && (
                            <kbd className="rounded-md border border-[#2A2A3A] bg-[#1A1A25] px-1.5 py-0.5 text-[10px] font-medium text-[#55556A]">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Quick Actions section */}
                {sections.actions.length > 0 && (
                  <div className="mb-1">
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#55556A]">
                      Quick Actions
                    </div>
                    {sections.actions.map((cmd) => {
                      const idx = flatList.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          data-selected={idx === selectedIndex}
                          onClick={() => {
                            cmd.action();
                            setOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            idx === selectedIndex
                              ? 'bg-[#6C5CE7]/15 text-[#F0F0F5]'
                              : 'text-[#8888A0] hover:bg-[#1A1A25]'
                          }`}
                        >
                          <span
                            className={
                              idx === selectedIndex
                                ? 'text-[#00D2FF]'
                                : 'text-[#8888A0]'
                            }
                          >
                            {cmd.icon}
                          </span>
                          <span className="flex-1 text-sm font-medium">
                            {cmd.label}
                          </span>
                          {cmd.shortcut && (
                            <kbd className="rounded-md border border-[#2A2A3A] bg-[#1A1A25] px-1.5 py-0.5 text-[10px] font-medium text-[#55556A]">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-[#2A2A3A]/60 px-4 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[#55556A]">
                  <kbd className="rounded border border-[#2A2A3A] bg-[#1A1A25] px-1 py-0.5 text-[10px]">
                    &uarr;&darr;
                  </kbd>
                  <span>navigate</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#55556A]">
                  <kbd className="rounded border border-[#2A2A3A] bg-[#1A1A25] px-1 py-0.5 text-[10px]">
                    &crarr;
                  </kbd>
                  <span>select</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-[11px] text-[#55556A]">
                  <Command size={11} />
                  <span>K to toggle</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
