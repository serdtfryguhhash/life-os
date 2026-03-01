'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useLifeOS } from '@/stores';
import type { CalendarEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_COLORS: Record<string, string> = {
  work: '#6C5CE7',
  personal: '#FFD600',
  health: '#00E676',
  social: '#00D2FF',
  other: '#8888A0',
};

type ViewMode = 'month' | 'week' | 'day';

interface EventFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: CalendarEvent['category'];
  description: string;
}

const EMPTY_FORM: EventFormData = {
  title: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '',
  endTime: '',
  category: 'personal',
  description: '',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
} as const;

const cellVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const;

const fadeVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const;

// ---------------------------------------------------------------------------
// Calendar Page
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const events = useLifeOS((s) => s.events);
  const addEvent = useLifeOS((s) => s.addEvent);
  const updateEvent = useLifeOS((s) => s.updateEvent);
  const deleteEvent = useLifeOS((s) => s.deleteEvent);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM);

  // --- Navigation -----------------------------------------------------------

  const goForward = useCallback(() => {
    if (viewMode === 'month') setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  }, [viewMode]);

  const goBack = useCallback(() => {
    if (viewMode === 'month') setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  }, [viewMode]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  // --- Calendar days --------------------------------------------------------

  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const start = startOfWeek(monthStart);
      const end = endOfWeek(monthEnd);
      return eachDayOfInterval({ start, end });
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return eachDayOfInterval({ start, end });
    }
    // day view
    return [currentDate];
  }, [currentDate, viewMode]);

  // --- Events by date -------------------------------------------------------

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const key = ev.date;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    // sort each day's events by start time
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
    }
    return map;
  }, [events]);

  // --- Selected day events --------------------------------------------------

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return eventsByDate[key] ?? [];
  }, [selectedDay, eventsByDate]);

  // --- Dialog helpers -------------------------------------------------------

  const openNewEventDialog = useCallback(
    (date?: Date) => {
      setEditingEvent(null);
      setFormData({
        ...EMPTY_FORM,
        date: format(date ?? selectedDay ?? new Date(), 'yyyy-MM-dd'),
      });
      setDialogOpen(true);
    },
    [selectedDay]
  );

  const openEditEventDialog = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      startTime: event.startTime ?? '',
      endTime: event.endTime ?? '',
      category: event.category,
      description: event.description ?? '',
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.title.trim()) return;
    const color = CATEGORY_COLORS[formData.category] ?? '#8888A0';
    if (editingEvent) {
      updateEvent(editingEvent.id, {
        title: formData.title,
        date: formData.date,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        category: formData.category,
        description: formData.description || undefined,
        color,
      });
    } else {
      addEvent({
        title: formData.title,
        date: formData.date,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        category: formData.category,
        description: formData.description || undefined,
        color,
      });
    }
    setDialogOpen(false);
    setEditingEvent(null);
    setFormData(EMPTY_FORM);
  }, [formData, editingEvent, addEvent, updateEvent]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteEvent(id);
    },
    [deleteEvent]
  );

  // --- Day click ------------------------------------------------------------

  const handleDayClick = useCallback(
    (day: Date) => {
      setSelectedDay(day);
      setSheetOpen(true);
    },
    []
  );

  // --- Header title ---------------------------------------------------------

  const headerTitle = useMemo(() => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'week') {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      if (ws.getMonth() === we.getMonth()) {
        return `${format(ws, 'MMM d')} - ${format(we, 'd, yyyy')}`;
      }
      return `${format(ws, 'MMM d')} - ${format(we, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  }, [currentDate, viewMode]);

  // --- Render ---------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ==============================================================
            Header
           ============================================================== */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Left — navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="h-9 w-9 text-[#8888A0] hover:text-[#F0F0F5] hover:bg-[#1A1A25]"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-semibold text-[#F0F0F5] min-w-[220px] text-center sm:text-left">
              {headerTitle}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={goForward}
              className="h-9 w-9 text-[#8888A0] hover:text-[#F0F0F5] hover:bg-[#1A1A25]"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToday}
              className="ml-2 text-xs border-[#2A2A3A] text-[#8888A0] hover:text-[#F0F0F5] hover:bg-[#1A1A25]"
            >
              Today
            </Button>
          </div>

          {/* Right — view toggle + add */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-[#1A1A25] border border-[#2A2A3A] p-0.5">
              {(['month', 'week', 'day'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                    viewMode === mode
                      ? 'bg-[#6C5CE7] text-white shadow-sm'
                      : 'text-[#8888A0] hover:text-[#F0F0F5]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => openNewEventDialog()}
              className="gap-1.5 bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </div>
        </motion.div>

        {/* ==============================================================
            Calendar Body
           ============================================================== */}
        <AnimatePresence mode="wait">
          {viewMode === 'month' && (
            <motion.div
              key="month"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAY_HEADERS.map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-xs font-medium text-[#8888A0] uppercase tracking-wider"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Date cells */}
              <motion.div
                className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden bg-[#2A2A3A]/30"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {calendarDays.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate[dayStr] ?? [];
                  const inMonth = isSameMonth(day, currentDate);
                  const today = isToday(day);
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

                  return (
                    <motion.button
                      key={dayStr}
                      variants={cellVariants}
                      onClick={() => handleDayClick(day)}
                      className={`relative min-h-[100px] p-2 text-left transition-colors ${
                        inMonth
                          ? 'bg-[#13131A]/80 hover:bg-[#1A1A25]'
                          : 'bg-[#0A0A0F]/60'
                      } ${isSelected ? 'ring-1 ring-[#6C5CE7]/60' : ''}`}
                    >
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                          today
                            ? 'bg-[#6C5CE7] text-white'
                            : inMonth
                            ? 'text-[#F0F0F5]'
                            : 'text-[#55556A]'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Event pills */}
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white/90 truncate"
                            style={{ backgroundColor: `${ev.color}50` }}
                          >
                            <div
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: ev.color }}
                            />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[10px] text-[#8888A0] px-1.5">
                            +{dayEvents.length - 3} more
                          </p>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {viewMode === 'week' && (
            <motion.div
              key="week"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {calendarDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="py-2 text-center text-xs font-medium text-[#8888A0]"
                  >
                    <span className="uppercase">{format(day, 'EEE')}</span>
                    <span
                      className={`ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday(day) ? 'bg-[#6C5CE7] text-white' : 'text-[#F0F0F5]'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Week cells */}
              <motion.div
                className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden bg-[#2A2A3A]/30"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {calendarDays.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate[dayStr] ?? [];
                  return (
                    <motion.button
                      key={dayStr}
                      variants={cellVariants}
                      onClick={() => handleDayClick(day)}
                      className="min-h-[260px] bg-[#13131A]/80 hover:bg-[#1A1A25] p-2 text-left transition-colors"
                    >
                      <div className="space-y-1">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded-lg px-2 py-1.5 text-xs"
                            style={{ backgroundColor: `${ev.color}20`, borderLeft: `3px solid ${ev.color}` }}
                          >
                            <p className="text-[10px] text-[#8888A0]">
                              {ev.startTime ?? 'All day'}
                            </p>
                            <p className="font-medium text-[#F0F0F5] truncate">
                              {ev.title}
                            </p>
                          </div>
                        ))}
                        {dayEvents.length === 0 && (
                          <p className="text-[10px] text-[#55556A] pt-2 text-center">
                            No events
                          </p>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {viewMode === 'day' && (
            <motion.div
              key="day"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="rounded-2xl bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#F0F0F5]">
                    {format(currentDate, 'EEEE')}
                  </h2>
                  <p className="text-sm text-[#8888A0]">
                    {format(currentDate, 'MMMM d, yyyy')}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => openNewEventDialog(currentDate)}
                  className="gap-1.5 bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </div>

              {(() => {
                const dayStr = format(currentDate, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[dayStr] ?? [];
                if (dayEvents.length === 0) {
                  return (
                    <div className="flex items-center justify-center py-16 border border-dashed border-[#2A2A3A] rounded-xl">
                      <p className="text-[#55556A]">No events for this day</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-start gap-4 rounded-xl bg-[#1A1A25]/60 border border-[#2A2A3A] p-4 hover:border-[#6C5CE7]/30 transition-colors group"
                      >
                        <div
                          className="mt-1 h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: ev.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#F0F0F5]">{ev.title}</p>
                          {ev.startTime && (
                            <p className="flex items-center gap-1 text-xs text-[#8888A0] mt-1">
                              <Clock className="h-3 w-3" />
                              {ev.startTime}
                              {ev.endTime ? ` - ${ev.endTime}` : ''}
                            </p>
                          )}
                          {ev.description && (
                            <p className="text-xs text-[#8888A0] mt-1.5 line-clamp-2">
                              {ev.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#8888A0] hover:text-[#F0F0F5] hover:bg-[#2A2A3A]"
                            onClick={() => openEditEventDialog(ev)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#8888A0] hover:text-[#FF5252] hover:bg-[#FF5252]/10"
                            onClick={() => handleDelete(ev.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==============================================================
            Day Detail Sheet (slide-in from right)
           ============================================================== */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="right"
            className="w-[360px] bg-[#13131A] border-l border-[#2A2A3A] sm:max-w-[400px]"
          >
            <SheetHeader>
              <SheetTitle className="text-[#F0F0F5]">
                {selectedDay ? format(selectedDay, 'EEEE, MMMM d') : ''}
              </SheetTitle>
              <SheetDescription className="text-[#8888A0]">
                {selectedDayEvents.length === 0
                  ? 'No events scheduled'
                  : `${selectedDayEvents.length} event${selectedDayEvents.length > 1 ? 's' : ''}`}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex-1 overflow-y-auto space-y-3 px-1">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 rounded-xl bg-[#1A1A25]/60 border border-[#2A2A3A] p-3 group"
                >
                  <div
                    className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: ev.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F0F0F5]">
                      {ev.title}
                    </p>
                    {ev.startTime && (
                      <p className="flex items-center gap-1 text-xs text-[#8888A0] mt-0.5">
                        <Clock className="h-3 w-3" />
                        {ev.startTime}
                        {ev.endTime ? ` - ${ev.endTime}` : ''}
                      </p>
                    )}
                    {ev.description && (
                      <p className="text-xs text-[#8888A0] mt-1 line-clamp-2">
                        {ev.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-[#8888A0] hover:text-[#F0F0F5] hover:bg-[#2A2A3A]"
                      onClick={() => {
                        setSheetOpen(false);
                        openEditEventDialog(ev);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-[#8888A0] hover:text-[#FF5252] hover:bg-[#FF5252]/10"
                      onClick={() => handleDelete(ev.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 px-1 pb-2">
              <Button
                size="sm"
                onClick={() => {
                  setSheetOpen(false);
                  openNewEventDialog(selectedDay ?? undefined);
                }}
                className="w-full gap-1.5 bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white"
              >
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* ==============================================================
            Add / Edit Event Dialog
           ============================================================== */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#13131A] border-[#2A2A3A] sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-[#F0F0F5]">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </DialogTitle>
              <DialogDescription className="text-[#8888A0]">
                {editingEvent
                  ? 'Update the details for this event.'
                  : 'Fill in the details to create a new event.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="ev-title" className="text-[#8888A0] text-xs">
                  Title
                </Label>
                <Input
                  id="ev-title"
                  placeholder="Event title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, title: e.target.value }))
                  }
                  className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] placeholder:text-[#55556A] focus-visible:ring-[#6C5CE7]"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="ev-date" className="text-[#8888A0] text-xs">
                  Date
                </Label>
                <Input
                  id="ev-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, date: e.target.value }))
                  }
                  className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] focus-visible:ring-[#6C5CE7]"
                />
              </div>

              {/* Time row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ev-start" className="text-[#8888A0] text-xs">
                    Start Time
                  </Label>
                  <Input
                    id="ev-start"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, startTime: e.target.value }))
                    }
                    className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] focus-visible:ring-[#6C5CE7]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ev-end" className="text-[#8888A0] text-xs">
                    End Time
                  </Label>
                  <Input
                    id="ev-end"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, endTime: e.target.value }))
                    }
                    className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] focus-visible:ring-[#6C5CE7]"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-[#8888A0] text-xs">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) =>
                    setFormData((f) => ({
                      ...f,
                      category: val as CalendarEvent['category'],
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] focus:ring-[#6C5CE7]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A25] border-[#2A2A3A]">
                    {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                      <SelectItem key={cat} value={cat}>
                        <span className="flex items-center gap-2 capitalize">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {cat}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="ev-desc" className="text-[#8888A0] text-xs">
                  Description
                </Label>
                <Textarea
                  id="ev-desc"
                  placeholder="Optional description..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] placeholder:text-[#55556A] focus-visible:ring-[#6C5CE7] resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-[#2A2A3A] text-[#8888A0] hover:text-[#F0F0F5] hover:bg-[#1A1A25]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.title.trim()}
                className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white disabled:opacity-40"
              >
                {editingEvent ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
