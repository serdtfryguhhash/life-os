"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  isSameMonth,
} from "date-fns";
import {
  Plus,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useLifeOS } from "@/stores";
import type { JournalEntry, Mood } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const MOOD_EMOJIS: Record<Mood, string> = {
  1: "\uD83D\uDE22",
  2: "\uD83D\uDE15",
  3: "\uD83D\uDE10",
  4: "\uD83D\uDE42",
  5: "\uD83D\uDE0A",
};

const MOOD_COLORS: Record<Mood, string> = {
  1: "#FF5252",
  2: "#FF9800",
  3: "#FFD600",
  4: "#8BC34A",
  5: "#00E676",
};

const MOOD_LABELS: Record<Mood, string> = {
  1: "Terrible",
  2: "Bad",
  3: "Okay",
  4: "Good",
  5: "Great",
};

// -- Mood Calendar --
function MoodCalendar({
  currentMonth,
  entries,
  onDayClick,
}: {
  currentMonth: Date;
  entries: JournalEntry[];
  onDayClick: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const entryMap = useMemo(() => {
    const map: Record<string, JournalEntry> = {};
    entries.forEach((e) => {
      map[e.date] = e;
    });
    return map;
  }, [entries]);

  return (
    <div className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-5">
      <p className="text-xs font-medium text-[#8888A0] uppercase tracking-wider mb-3">
        Mood Overview
      </p>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d) => (
          <div
            key={d}
            className="text-center text-xs text-[#55556A] font-medium py-1"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const entry = entryMap[dateStr];
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(day)}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-all hover:ring-1 hover:ring-[#6C5CE7]/50 ${
                isToday ? "ring-1 ring-[#6C5CE7]" : ""
              }`}
              style={{
                backgroundColor: entry
                  ? `${MOOD_COLORS[entry.mood]}20`
                  : "transparent",
              }}
            >
              <span
                style={{
                  color: entry ? MOOD_COLORS[entry.mood] : "#55556A",
                }}
              >
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-[#2A2A3A]">
        {([1, 2, 3, 4, 5] as Mood[]).map((mood) => (
          <div key={mood} className="flex items-center gap-1">
            <div
              className="size-2.5 rounded-full"
              style={{ backgroundColor: MOOD_COLORS[mood] }}
            />
            <span className="text-xs text-[#55556A]">{MOOD_LABELS[mood]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Entry Card --
function EntryCard({
  entry,
  onClick,
}: {
  entry: JournalEntry;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      onClick={onClick}
      className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-5 text-left hover:border-[#6C5CE7]/30 transition-colors w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-[#F0F0F5]">
            {format(parseISO(entry.date), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{MOOD_EMOJIS[entry.mood]}</span>
        </div>
      </div>

      <p className="text-sm text-[#8888A0] line-clamp-2 mb-3">
        {entry.content}
      </p>

      {entry.gratitude.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {entry.gratitude
            .filter((g) => g.trim())
            .map((g, i) => (
              <Badge
                key={i}
                className="text-xs bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20"
              >
                {g}
              </Badge>
            ))}
        </div>
      )}

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs text-[#8888A0]"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </motion.button>
  );
}

// -- View Entry Dialog --
function ViewEntryDialog({
  open,
  onOpenChange,
  entry,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntry | null;
  onEdit: () => void;
}) {
  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#13131A] border-[#2A2A3A] sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{MOOD_EMOJIS[entry.mood]}</span>
            <div>
              <DialogTitle className="text-[#F0F0F5]">
                {format(parseISO(entry.date), "EEEE, MMMM d, yyyy")}
              </DialogTitle>
              <p className="text-sm text-[#8888A0] mt-0.5">
                Feeling {MOOD_LABELS[entry.mood].toLowerCase()}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-[#F0F0F5] whitespace-pre-wrap">{entry.content}</p>

          {entry.gratitude.filter((g) => g.trim()).length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#8888A0] uppercase tracking-wider mb-2">
                Grateful for
              </p>
              <div className="space-y-1.5">
                {entry.gratitude
                  .filter((g) => g.trim())
                  .map((g, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-[#00E676]" />
                      <span className="text-sm text-[#F0F0F5]">{g}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs text-[#8888A0]"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2A2A3A] text-[#8888A0]"
          >
            Close
          </Button>
          <Button
            onClick={onEdit}
            className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
          >
            Edit Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- Add/Edit Entry Dialog --
function EntryFormDialog({
  open,
  onOpenChange,
  entry,
  defaultDate,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntry | null;
  defaultDate?: string;
  onSave: (data: Omit<JournalEntry, "id" | "createdAt">) => void;
}) {
  const [date, setDate] = useState(
    entry?.date ?? defaultDate ?? format(new Date(), "yyyy-MM-dd")
  );
  const [mood, setMood] = useState<Mood>(entry?.mood ?? 3);
  const [content, setContent] = useState(entry?.content ?? "");
  const [gratitude1, setGratitude1] = useState(entry?.gratitude[0] ?? "");
  const [gratitude2, setGratitude2] = useState(entry?.gratitude[1] ?? "");
  const [gratitude3, setGratitude3] = useState(entry?.gratitude[2] ?? "");
  const [tagsInput, setTagsInput] = useState(
    entry?.tags.join(", ") ?? ""
  );

  const handleSave = () => {
    if (!content.trim()) return;
    const gratitude = [gratitude1, gratitude2, gratitude3].filter(
      (g) => g.trim()
    );
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({ date, mood, content: content.trim(), gratitude, tags });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#13131A] border-[#2A2A3A] sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F0F0F5]">
            {entry ? "Edit Entry" : "New Journal Entry"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Date */}
          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
            />
          </div>

          {/* Mood Selector */}
          <div>
            <label className="text-sm text-[#8888A0] mb-2 block">
              How are you feeling?
            </label>
            <div className="flex items-center justify-center gap-3">
              {([1, 2, 3, 4, 5] as Mood[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`text-4xl transition-all hover:scale-110 ${
                    mood === m
                      ? "scale-125 drop-shadow-lg"
                      : "opacity-50 grayscale"
                  }`}
                >
                  {MOOD_EMOJIS[m]}
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-[#8888A0] mt-1">
              {MOOD_LABELS[mood]}
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">
              What&apos;s on your mind?
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write about your day..."
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] min-h-[120px]"
            />
          </div>

          {/* Gratitude */}
          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">
              3 things you&apos;re grateful for
            </label>
            <div className="space-y-2">
              <Input
                value={gratitude1}
                onChange={(e) => setGratitude1(e.target.value)}
                placeholder="1. I'm grateful for..."
                className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
              />
              <Input
                value={gratitude2}
                onChange={(e) => setGratitude2(e.target.value)}
                placeholder="2. I'm grateful for..."
                className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
              />
              <Input
                value={gratitude3}
                onChange={(e) => setGratitude3(e.target.value)}
                placeholder="3. I'm grateful for..."
                className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">
              Tags (comma separated)
            </label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="productive, work, reflection"
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2A2A3A] text-[#8888A0]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!content.trim()}
            className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
          >
            {entry ? "Save Changes" : "Save Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- Main Page --
export default function JournalPage() {
  const {
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
  } = useLifeOS();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  const sortedEntries = useMemo(
    () =>
      [...journalEntries]
        .filter((e) => isSameMonth(parseISO(e.date), currentMonth))
        .sort(
          (a, b) =>
            parseISO(b.date).getTime() - parseISO(a.date).getTime()
        ),
    [journalEntries, currentMonth]
  );

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = journalEntries.find((e) => e.date === dateStr);
    if (existing) {
      setViewingEntry(existing);
      setViewOpen(true);
    } else {
      setDefaultDate(dateStr);
      setEditingEntry(null);
      setFormOpen(true);
    }
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    setDefaultDate(format(new Date(), "yyyy-MM-dd"));
    setFormOpen(true);
  };

  const handleEditFromView = () => {
    if (viewingEntry) {
      setViewOpen(false);
      setEditingEntry(viewingEntry);
      setFormOpen(true);
    }
  };

  const handleSave = (data: Omit<JournalEntry, "id" | "createdAt">) => {
    if (editingEntry) {
      updateJournalEntry(editingEntry.id, data);
    } else {
      addJournalEntry(data);
    }
    setEditingEntry(null);
    setDefaultDate(undefined);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#6C5CE7]/10">
              <BookOpen className="size-6 text-[#6C5CE7]" />
            </div>
            <h1 className="text-3xl font-bold text-[#F0F0F5]">Journal</h1>
          </div>

          <Button
            onClick={handleNewEntry}
            className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
          >
            <Plus className="size-4" />
            New Entry
          </Button>
        </motion.div>

        {/* Month Navigation + Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: [0.4, 0, 0.2, 1] as const,
          }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="text-[#8888A0] hover:text-[#F0F0F5]"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <h2 className="text-lg font-semibold text-[#F0F0F5]">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="text-[#8888A0] hover:text-[#F0F0F5]"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>

          <MoodCalendar
            currentMonth={currentMonth}
            entries={journalEntries}
            onDayClick={handleDayClick}
          />
        </motion.div>

        {/* Entry List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.2,
            ease: [0.4, 0, 0.2, 1] as const,
          }}
        >
          <h2 className="text-lg font-semibold text-[#F0F0F5] mb-4">
            Entries
          </h2>
          {sortedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <BookOpen className="size-12 text-[#2A2A3A] mb-3" />
              <p className="text-[#8888A0]">
                No entries this month
              </p>
              <p className="text-[#55556A] text-sm mt-1">
                Click a day or create a new entry to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {sortedEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => {
                      setViewingEntry(entry);
                      setViewOpen(true);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* View Dialog */}
      <ViewEntryDialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) setViewingEntry(null);
        }}
        entry={viewingEntry}
        onEdit={handleEditFromView}
      />

      {/* Form Dialog */}
      <EntryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingEntry(null);
            setDefaultDate(undefined);
          }
        }}
        entry={editingEntry}
        defaultDate={defaultDate}
        onSave={handleSave}
      />
    </div>
  );
}
