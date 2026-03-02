"use client";

import { useState, useMemo, useCallback } from "react";
import { useLifeOS } from "@/stores";
import type { Habit } from "@/types";
import { HabitHeatmap } from "@/components/features/habit-heatmap";
import {
  format,
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  isToday,
  subDays,
  parseISO,
  differenceInDays,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  TrendingUp,
  AlertCircle,
  X,
  Dumbbell,
  BookOpen,
  Brain,
  Droplets,
  ClipboardCheck,
  Heart,
  Music,
  Sunrise,
  Moon,
  Coffee,
  Apple,
  Bike,
  Pencil,
  Smile,
  Star,
  Zap,
  Target,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ----------------------------------------------------------------
// Constants & icon mapping
// ----------------------------------------------------------------

const ICON_MAP: Record<string, React.ReactNode> = {
  Dumbbell: <Dumbbell className="size-5" />,
  BookOpen: <BookOpen className="size-5" />,
  Brain: <Brain className="size-5" />,
  Droplets: <Droplets className="size-5" />,
  ClipboardCheck: <ClipboardCheck className="size-5" />,
  Heart: <Heart className="size-5" />,
  Music: <Music className="size-5" />,
  Sunrise: <Sunrise className="size-5" />,
  Moon: <Moon className="size-5" />,
  Coffee: <Coffee className="size-5" />,
  Apple: <Apple className="size-5" />,
  Bike: <Bike className="size-5" />,
  Pencil: <Pencil className="size-5" />,
  Smile: <Smile className="size-5" />,
  Star: <Star className="size-5" />,
  Zap: <Zap className="size-5" />,
  Target: <Target className="size-5" />,
  Flame: <Flame className="size-5" />,
  Trophy: <Trophy className="size-5" />,
  TrendingUp: <TrendingUp className="size-5" />,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const COLOR_OPTIONS = [
  "#00E676",
  "#FFD600",
  "#6C5CE7",
  "#00D2FF",
  "#FF5252",
  "#FF9800",
  "#E91E63",
  "#8888A0",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 },
} as const;

// ----------------------------------------------------------------
// Form data
// ----------------------------------------------------------------

interface HabitFormData {
  name: string;
  icon: string;
  color: string;
  frequency: "daily" | "weekly";
  target: number;
  unit: string;
}

const emptyForm: HabitFormData = {
  name: "",
  icon: "Star",
  color: "#6C5CE7",
  frequency: "daily",
  target: 1,
  unit: "times",
};

// ----------------------------------------------------------------
// Progress Ring
// ----------------------------------------------------------------

function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  color,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(progress, 1) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#2A2A3A"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as const }}
      />
    </svg>
  );
}

// ----------------------------------------------------------------
// Streak helpers
// ----------------------------------------------------------------

function computeStreak(habit: Habit): { current: number; best: number } {
  const today = format(new Date(), "yyyy-MM-dd");
  let current = 0;
  let best = 0;
  let tempStreak = 0;

  // Walk backwards from today
  for (let i = 0; i < 365; i++) {
    const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
    const count = habit.completions[dateStr] || 0;
    const met = count >= habit.target;

    if (i === 0 && !met) {
      // Today not done yet, check from yesterday
      continue;
    }

    if (met) {
      if (i <= 1 || tempStreak > 0) {
        tempStreak++;
      } else {
        break;
      }
    } else if (tempStreak > 0) {
      if (current === 0) current = tempStreak;
      best = Math.max(best, tempStreak);
      tempStreak = 0;
      if (current > 0) break;
    }
  }

  if (tempStreak > 0) {
    if (current === 0) current = tempStreak;
    best = Math.max(best, tempStreak);
  }

  // Also scan all completions for best streak
  const dates = Object.keys(habit.completions)
    .filter((d) => (habit.completions[d] || 0) >= habit.target)
    .sort();

  let scanStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInDays(parseISO(dates[i]), parseISO(dates[i - 1]));
    if (diff === 1) {
      scanStreak++;
    } else {
      best = Math.max(best, scanStreak);
      scanStreak = 1;
    }
  }
  best = Math.max(best, scanStreak);

  return { current, best };
}

// ----------------------------------------------------------------
// HabitDialog (Add / Edit)
// ----------------------------------------------------------------

function HabitDialog({
  open,
  onOpenChange,
  editingHabit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingHabit: Habit | null;
  onSave: (data: HabitFormData) => void;
}) {
  const [form, setForm] = useState<HabitFormData>(emptyForm);

  const handleOpenChange = (open: boolean) => {
    if (open && editingHabit) {
      setForm({
        name: editingHabit.name,
        icon: editingHabit.icon,
        color: editingHabit.color,
        frequency: editingHabit.frequency,
        target: editingHabit.target,
        unit: editingHabit.unit,
      });
    } else if (open) {
      setForm(emptyForm);
    }
    onOpenChange(open);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#13131A] border-[#2A2A3A] text-[#F0F0F5] sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F0F0F5]">
            {editingHabit ? "Edit Habit" : "Add Habit"}
          </DialogTitle>
          <DialogDescription className="text-[#8888A0]">
            {editingHabit
              ? "Update your habit details."
              : "Create a new habit to build consistency."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
              Name
            </label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Morning workout"
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] placeholder:text-[#8888A0]/50 focus-visible:border-[#6C5CE7] focus-visible:ring-[#6C5CE7]/20"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
              Icon
            </label>
            <div className="grid grid-cols-10 gap-1.5">
              {ICON_OPTIONS.map((iconName) => (
                <button
                  key={iconName}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, icon: iconName }))
                  }
                  className={`flex items-center justify-center rounded-lg p-2 transition-all ${
                    form.icon === iconName
                      ? "bg-[#6C5CE7]/20 text-[#6C5CE7] ring-1 ring-[#6C5CE7]"
                      : "bg-[#1A1A25] text-[#8888A0] hover:bg-[#2A2A3A] hover:text-[#F0F0F5]"
                  }`}
                >
                  {ICON_MAP[iconName]}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
              Color
            </label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, color }))
                  }
                  className={`size-8 rounded-full transition-all ${
                    form.color === color
                      ? "ring-2 ring-offset-2 ring-offset-[#13131A]"
                      : "hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: color,
                    outlineColor: form.color === color ? color : undefined,
                    ["--tw-ring-color" as string]: form.color === color ? color : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
              Frequency
            </label>
            <Select
              value={form.frequency}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  frequency: v as "daily" | "weekly",
                }))
              }
            >
              <SelectTrigger className="w-full bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]">
                <SelectItem value="daily" className="focus:bg-[#2A2A3A]">
                  Daily
                </SelectItem>
                <SelectItem value="weekly" className="focus:bg-[#2A2A3A]">
                  Weekly
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
                Target
              </label>
              <Input
                type="number"
                min={1}
                value={form.target}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    target: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
                className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] focus-visible:border-[#6C5CE7] focus-visible:ring-[#6C5CE7]/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
                Unit
              </label>
              <Input
                value={form.unit}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, unit: e.target.value }))
                }
                placeholder="e.g. times, minutes"
                className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] placeholder:text-[#8888A0]/50 focus-visible:border-[#6C5CE7] focus-visible:ring-[#6C5CE7]/20"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#8888A0] hover:bg-[#2A2A3A] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim()}
            className="rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {editingHabit ? "Save Changes" : "Add Habit"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// Custom Tooltip for Recharts
// ----------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { color: string } }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg bg-[#1A1A25] border border-[#2A2A3A] px-3 py-2 text-xs shadow-xl">
      <p className="text-[#F0F0F5] font-medium">{label}</p>
      <p className="text-[#8888A0]">
        {Math.round(payload[0].value)}% completion
      </p>
    </div>
  );
}

// ----------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------

export default function HabitsPage() {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabitCompletion } =
    useLifeOS();

  const [weekOffset, setWeekOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Compute the week dates
  const weekDates = useMemo(() => {
    const base = weekOffset === 0 ? new Date() : addWeeks(new Date(), weekOffset);
    const start = startOfWeek(base, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekOffset]);

  const weekDateStrs = useMemo(
    () => weekDates.map((d) => format(d, "yyyy-MM-dd")),
    [weekDates]
  );

  // Streaks data
  const streakData = useMemo(
    () =>
      habits.map((h) => ({
        habit: h,
        ...computeStreak(h),
      })),
    [habits]
  );

  // 30-day completion data for chart
  const chartData = useMemo(() => {
    return habits.map((habit) => {
      let completedDays = 0;
      const totalDays = 30;
      for (let i = 0; i < totalDays; i++) {
        const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
        if ((habit.completions[dateStr] || 0) >= habit.target) {
          completedDays++;
        }
      }
      return {
        name: habit.name.length > 12 ? habit.name.slice(0, 12) + "..." : habit.name,
        fullName: habit.name,
        rate: Math.round((completedDays / totalDays) * 100),
        color: habit.color,
      };
    });
  }, [habits]);

  // Overall completion rate
  const overallRate = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, d) => acc + d.rate, 0);
    return Math.round(sum / chartData.length);
  }, [chartData]);

  // Most consistent / needs attention
  const mostConsistent = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((a, b) => (a.rate >= b.rate ? a : b));
  }, [chartData]);

  const needsAttention = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((a, b) => (a.rate <= b.rate ? a : b));
  }, [chartData]);

  // Handlers
  const handleAdd = () => {
    setEditingHabit(null);
    setDialogOpen(true);
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setDialogOpen(true);
  };

  const handleSave = (data: HabitFormData) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, {
        name: data.name,
        icon: data.icon,
        color: data.color,
        frequency: data.frequency,
        target: data.target,
        unit: data.unit,
      });
    } else {
      addHabit({
        name: data.name,
        icon: data.icon,
        color: data.color,
        frequency: data.frequency,
        target: data.target,
        unit: data.unit,
      });
    }
  };

  const handleToggle = useCallback(
    (habitId: string, dateStr: string) => {
      toggleHabitCompletion(habitId, dateStr);
    },
    [toggleHabitCompletion]
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F5]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] bg-clip-text text-transparent">
                Habits
              </h1>
              <Flame className="size-7 text-[#FF5252]" />
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#6C5CE7]/20 hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" />
              Add Habit
            </button>
          </div>

          {/* Date navigation */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setWeekOffset((p) => p - 1)}
              className="rounded-lg p-2 text-[#8888A0] hover:bg-[#1A1A25] hover:text-[#F0F0F5] transition-colors"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-sm font-medium text-[#8888A0]">
              {format(weekDates[0], "MMM d")} -{" "}
              {format(weekDates[6], "MMM d, yyyy")}
            </span>
            <button
              onClick={() => setWeekOffset((p) => p + 1)}
              disabled={weekOffset >= 0}
              className="rounded-lg p-2 text-[#8888A0] hover:bg-[#1A1A25] hover:text-[#F0F0F5] transition-colors disabled:opacity-30"
            >
              <ChevronRight className="size-5" />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="rounded-full bg-[#6C5CE7]/15 px-3 py-1 text-xs font-medium text-[#6C5CE7] hover:bg-[#6C5CE7]/25 transition-colors"
              >
                Today
              </button>
            )}
          </div>
        </motion.div>

        {habits.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A2A3A] py-16"
          >
            <Flame className="size-12 text-[#2A2A3A]" />
            <p className="mt-4 text-sm text-[#8888A0]">
              No habits yet. Add one to start building streaks!
            </p>
          </motion.div>
        ) : (
          <>
            {/* Today's Habits */}
            <motion.section
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mb-10"
            >
              <h2 className="mb-4 text-lg font-semibold text-[#F0F0F5]">
                Today&apos;s Habits
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {habits.map((habit) => {
                  const todayCount = habit.completions[todayStr] || 0;
                  const progress = Math.min(todayCount / habit.target, 1);
                  const completed = todayCount >= habit.target;
                  const streakInfo = streakData.find(
                    (s) => s.habit.id === habit.id
                  );

                  return (
                    <motion.div
                      key={habit.id}
                      variants={itemVariants}
                      transition={{ type: "spring", stiffness: 400, damping: 30 } as const}
                      className="group relative bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-5 hover:border-opacity-60 transition-colors overflow-hidden"
                      style={{
                        borderColor: completed
                          ? `${habit.color}40`
                          : undefined,
                      }}
                    >
                      {/* Completed glow */}
                      {completed && (
                        <div
                          className="pointer-events-none absolute inset-0 opacity-5 rounded-2xl"
                          style={{ backgroundColor: habit.color }}
                        />
                      )}

                      <div className="flex items-center gap-4">
                        {/* Progress ring with click area */}
                        <button
                          onClick={() => handleToggle(habit.id, todayStr)}
                          className="relative shrink-0"
                        >
                          <ProgressRing
                            progress={progress}
                            size={64}
                            strokeWidth={4}
                            color={habit.color}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {completed ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 15,
                                } as const}
                              >
                                <Check
                                  className="size-6"
                                  style={{ color: habit.color }}
                                />
                              </motion.div>
                            ) : (
                              <span
                                className="text-sm font-bold"
                                style={{ color: habit.color }}
                              >
                                <motion.span
                                  key={todayCount}
                                  initial={{ scale: 1.4, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
                                >
                                  {todayCount}
                                </motion.span>
                                /{habit.target}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span style={{ color: habit.color }}>
                              {ICON_MAP[habit.icon] || (
                                <Star className="size-5" />
                              )}
                            </span>
                            <h3 className="text-sm font-medium text-[#F0F0F5] truncate">
                              {habit.name}
                            </h3>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <Flame className="size-3.5 text-[#FF5252]" />
                            <span className="text-xs text-[#8888A0]">
                              {streakInfo?.current || 0} day streak
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-[#8888A0]/70">
                            {habit.target} {habit.unit} / {habit.frequency}
                          </p>
                        </div>

                        {/* Edit button */}
                        <button
                          onClick={() => handleEdit(habit)}
                          className="shrink-0 rounded-lg p-1.5 text-[#8888A0] opacity-0 group-hover:opacity-100 hover:bg-[#2A2A3A] hover:text-[#F0F0F5] transition-all"
                        >
                          <Pencil className="size-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* Weekly Grid */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.4, 0, 0.2, 1] as const }}
              className="mb-10"
            >
              <h2 className="mb-4 text-lg font-semibold text-[#F0F0F5]">
                Weekly Overview
              </h2>
              <div className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-[minmax(120px,1fr)_repeat(7,1fr)] border-b border-[#2A2A3A]">
                  <div className="p-3" />
                  {weekDates.map((date, i) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const today = isToday(date);
                    return (
                      <div
                        key={dateStr}
                        className={`flex flex-col items-center justify-center p-3 text-center ${
                          today
                            ? "bg-[#6C5CE7]/10"
                            : ""
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider text-[#8888A0]">
                          {format(date, "EEE")}
                        </span>
                        <span
                          className={`mt-0.5 text-xs font-medium ${
                            today ? "text-[#6C5CE7]" : "text-[#F0F0F5]"
                          }`}
                        >
                          {format(date, "d")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Habit rows */}
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="grid grid-cols-[minmax(120px,1fr)_repeat(7,1fr)] border-b border-[#2A2A3A] last:border-b-0"
                  >
                    {/* Habit label */}
                    <div className="flex items-center gap-2 p-3">
                      <span
                        className="shrink-0"
                        style={{ color: habit.color }}
                      >
                        {ICON_MAP[habit.icon] || <Star className="size-4" />}
                      </span>
                      <span className="text-xs font-medium text-[#F0F0F5] truncate">
                        {habit.name}
                      </span>
                    </div>

                    {/* Cells */}
                    {weekDateStrs.map((dateStr, i) => {
                      const count = habit.completions[dateStr] || 0;
                      const met = count >= habit.target;
                      const partial =
                        count > 0 && count < habit.target;
                      const today = isToday(weekDates[i]);

                      return (
                        <button
                          key={dateStr}
                          onClick={() => handleToggle(habit.id, dateStr)}
                          className={`flex items-center justify-center p-3 transition-colors hover:bg-[#1A1A25] ${
                            today ? "bg-[#6C5CE7]/5" : ""
                          }`}
                        >
                          <motion.div
                            whileTap={{ scale: 0.85 }}
                            className={`size-7 rounded-full flex items-center justify-center transition-all ${
                              met
                                ? "shadow-sm"
                                : partial
                                  ? "border-2"
                                  : "border border-[#2A2A3A]"
                            }`}
                            style={{
                              backgroundColor: met
                                ? habit.color
                                : "transparent",
                              borderColor: partial
                                ? habit.color
                                : met
                                  ? "transparent"
                                  : undefined,
                            }}
                          >
                            {met && (
                              <Check className="size-3.5 text-white" />
                            )}
                            {partial && (
                              <span
                                className="text-[9px] font-bold"
                                style={{ color: habit.color }}
                              >
                                {count}
                              </span>
                            )}
                          </motion.div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Streak Board */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: [0.4, 0, 0.2, 1] as const }}
              className="mb-10"
            >
              <h2 className="mb-4 text-lg font-semibold text-[#F0F0F5]">
                Streaks
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {streakData.map(({ habit, current, best }) => (
                  <motion.div
                    key={habit.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span style={{ color: habit.color }}>
                        {ICON_MAP[habit.icon] || <Star className="size-5" />}
                      </span>
                      <span className="text-sm font-medium text-[#F0F0F5] truncate">
                        {habit.name}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {current > 0 && (
                            <motion.div
                              animate={{ scale: [1, 1.15, 1] }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "easeInOut" as const,
                              }}
                            >
                              <Flame className="size-5 text-[#FF5252]" />
                            </motion.div>
                          )}
                          <span className="text-2xl font-bold text-[#F0F0F5]">
                            {current}
                          </span>
                          <span className="text-xs text-[#8888A0]">
                            day{current !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#8888A0]/70 mt-1">
                          Current streak
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Trophy className="size-3.5 text-[#FFD600]" />
                          <span className="text-sm font-semibold text-[#FFD600]">
                            {best}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#8888A0]/70 mt-0.5">
                          Best
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Statistics */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35, ease: [0.4, 0, 0.2, 1] as const }}
              className="mb-10"
            >
              <h2 className="mb-4 text-lg font-semibold text-[#F0F0F5]">
                Statistics
              </h2>

              {/* Stats cards */}
              <div className="grid gap-3 sm:grid-cols-3 mb-6">
                <div className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-4">
                  <p className="text-xs text-[#8888A0]">
                    Overall Completion (30d)
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#6C5CE7]">
                    {overallRate}%
                  </p>
                </div>
                {mostConsistent && (
                  <div className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-4">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="size-3.5 text-[#00E676]" />
                      <p className="text-xs text-[#8888A0]">
                        Most Consistent
                      </p>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#00E676] truncate">
                      {mostConsistent.fullName}
                    </p>
                    <p className="text-xs text-[#8888A0]">
                      {mostConsistent.rate}% completion
                    </p>
                  </div>
                )}
                {needsAttention &&
                  needsAttention.fullName !== mostConsistent?.fullName && (
                    <div className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-4">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="size-3.5 text-[#FFD600]" />
                        <p className="text-xs text-[#8888A0]">
                          Needs Attention
                        </p>
                      </div>
                      <p className="mt-1 text-sm font-medium text-[#FFD600] truncate">
                        {needsAttention.fullName}
                      </p>
                      <p className="text-xs text-[#8888A0]">
                        {needsAttention.rate}% completion
                      </p>
                    </div>
                  )}
              </div>

              {/* Bar Chart */}
              <div className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-6">
                <h3 className="mb-4 text-sm font-medium text-[#8888A0]">
                  30-Day Completion Rate by Habit
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barCategoryGap="20%">
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#8888A0", fontSize: 11 }}
                        axisLine={{ stroke: "#2A2A3A" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#8888A0", fontSize: 11 }}
                        axisLine={{ stroke: "#2A2A3A" }}
                        tickLine={false}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "#2A2A3A", opacity: 0.3 }}
                      />
                      <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.section>
          </>
        )}


        {/* Habit Heatmaps */}
        {habits.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
            className="mt-8 space-y-4"
          >
            <h2 className="text-lg font-semibold text-[#F0F0F5]">Activity Heatmaps</h2>
            {habits.map((habit) => (
              <HabitHeatmap key={habit.id} habit={habit} />
            ))}
          </motion.section>
        )}
        {/* Dialog */}
        <HabitDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingHabit={editingHabit}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
