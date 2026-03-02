'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  CheckCircle2,
  Plus,
  TrendingUp,
  Flame,
  Target,
  BookOpen,
  Wallet,
  Timer,
  Trophy,
  AlertTriangle,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
} from 'lucide-react';
import { useLifeOS } from '@/stores';

// ============================================================
// Constants
// ============================================================

const CARD_ANIMATE = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============================================================
// Helper: Glass card wrapper
// ============================================================

function GlassCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      {...CARD_ANIMATE}
      transition={{ duration: 0.4, delay }}
      className={`rounded-2xl border border-[#2A2A3A]/60 bg-[#13131A]/80 p-5 backdrop-blur-sm ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// Helper: Stat badge
// ============================================================

function StatBadge({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}15` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-[#8888A0]">{label}</p>
        <p className="text-lg font-bold text-[#F0F0F5]">{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// Custom Tooltip for Recharts
// ============================================================

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#2A2A3A] bg-[#13131A] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-[#F0F0F5]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[#8888A0]">
          {p.name}: <span className="font-medium text-[#F0F0F5]">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function ReviewPage() {
  const { tasks, habits, goals, journalEntries, transactions, pomodoroSessions } =
    useLifeOS();

  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => subDays(today, 6), [today]);

  const weekRange = useMemo(
    () =>
      `${format(weekStart, 'MMM d')} - ${format(today, 'MMM d, yyyy')}`,
    [weekStart, today]
  );

  // Generate last 7 days array
  const last7Days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i)),
    [today]
  );

  const isInWeek = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      return isWithinInterval(d, {
        start: startOfDay(weekStart),
        end: endOfDay(today),
      });
    } catch {
      return false;
    }
  };

  // ----------------------------------------------------------
  // Tasks Summary
  // ----------------------------------------------------------
  const taskStats = useMemo(() => {
    const completed = tasks.filter(
      (t) => t.status === 'done' && t.completedAt && isInWeek(t.completedAt)
    ).length;
    const added = tasks.filter((t) => isInWeek(t.createdAt)).length;
    const total = completed + tasks.filter((t) => t.status !== 'done' && isInWeek(t.createdAt)).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Tasks by day
    const byDay = last7Days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = tasks.filter(
        (t) =>
          t.status === 'done' &&
          t.completedAt &&
          t.completedAt.startsWith(dayStr)
      ).length;
      return {
        day: format(day, 'EEE'),
        completed: count,
      };
    });

    return { completed, added, rate, byDay };
  }, [tasks, last7Days, weekStart, today]);

  // ----------------------------------------------------------
  // Habits Summary
  // ----------------------------------------------------------
  const habitStats = useMemo(() => {
    const dailyHabits = habits.filter((h) => h.frequency === 'daily');
    if (dailyHabits.length === 0) {
      return {
        overallRate: 0,
        bestHabit: 'N/A',
        worstHabit: 'N/A',
        bestStreak: 0,
      };
    }

    let totalPossible = 0;
    let totalCompleted = 0;
    const habitRates: { name: string; rate: number; streak: number }[] = [];

    dailyHabits.forEach((habit) => {
      let completed = 0;
      last7Days.forEach((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        totalPossible++;
        if ((habit.completions[dayStr] || 0) >= habit.target) {
          completed++;
          totalCompleted++;
        }
      });
      habitRates.push({
        name: habit.name,
        rate: Math.round((completed / 7) * 100),
        streak: habit.streak,
      });
    });

    const sorted = [...habitRates].sort((a, b) => b.rate - a.rate);
    const overallRate =
      totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return {
      overallRate,
      bestHabit: sorted[0]?.name || 'N/A',
      worstHabit: sorted[sorted.length - 1]?.name || 'N/A',
      bestStreak: Math.max(...habitRates.map((h) => h.streak), 0),
    };
  }, [habits, last7Days]);

  // ----------------------------------------------------------
  // Goals Progress
  // ----------------------------------------------------------
  const goalStats = useMemo(() => {
    return goals.map((g) => ({
      title: g.title,
      progress: g.progress,
      category: g.category,
      milestonesTotal: g.milestones.length,
      milestonesDone: g.milestones.filter((m) => m.done).length,
    }));
  }, [goals]);

  // ----------------------------------------------------------
  // Journal Mood Trend
  // ----------------------------------------------------------
  const moodStats = useMemo(() => {
    const moodByDay = last7Days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const entry = journalEntries.find((j) => j.date === dayStr);
      return {
        day: format(day, 'EEE'),
        mood: entry?.mood || 0,
        hasEntry: !!entry,
      };
    });

    const entriesWithMood = moodByDay.filter((d) => d.hasEntry);
    const avgMood =
      entriesWithMood.length > 0
        ? entriesWithMood.reduce((acc, d) => acc + d.mood, 0) /
          entriesWithMood.length
        : 0;

    return { moodByDay, avgMood, entryCount: entriesWithMood.length };
  }, [journalEntries, last7Days]);

  // ----------------------------------------------------------
  // Finance Summary
  // ----------------------------------------------------------
  const financeStats = useMemo(() => {
    const weekTransactions = transactions.filter((t) => isInWeek(t.date));
    const income = weekTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = weekTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Top spending category
    const expensesByCategory: Record<string, number> = {};
    weekTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        expensesByCategory[t.category] =
          (expensesByCategory[t.category] || 0) + t.amount;
      });

    const topCategory = Object.entries(expensesByCategory).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const pieData = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

    return {
      income,
      expenses,
      net: income - expenses,
      topCategory: topCategory ? topCategory[0] : 'N/A',
      topCategoryAmount: topCategory ? topCategory[1] : 0,
      pieData,
    };
  }, [transactions, weekStart, today]);

  // ----------------------------------------------------------
  // Focus Stats
  // ----------------------------------------------------------
  const focusStats = useMemo(() => {
    const weekSessions = pomodoroSessions.filter(
      (s) => s.completed && isInWeek(s.startTime)
    );
    const totalMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    const sessionsCompleted = weekSessions.length;
    const avgPerDay = Math.round(totalMinutes / 7);

    return { totalMinutes, sessionsCompleted, avgPerDay };
  }, [pomodoroSessions, weekStart, today]);

  // ----------------------------------------------------------
  // Week Score (0-100)
  // ----------------------------------------------------------
  const weekScore = useMemo(() => {
    const taskScore = Math.min(taskStats.rate, 100);
    const habitScore = habitStats.overallRate;
    const goalScore =
      goalStats.length > 0
        ? goalStats.reduce((sum, g) => sum + g.progress, 0) / goalStats.length
        : 0;
    const moodScore = moodStats.avgMood > 0 ? (moodStats.avgMood / 5) * 100 : 50;
    const financeScore = financeStats.net >= 0 ? 100 : Math.max(0, 100 + (financeStats.net / financeStats.expenses) * 100);
    const focusScore = Math.min((focusStats.totalMinutes / (7 * 25)) * 100, 100); // 25 min/day target

    // Weighted average
    const weights = { task: 0.2, habit: 0.25, goal: 0.15, mood: 0.15, finance: 0.1, focus: 0.15 };
    const raw =
      taskScore * weights.task +
      habitScore * weights.habit +
      goalScore * weights.goal +
      moodScore * weights.mood +
      financeScore * weights.finance +
      focusScore * weights.focus;

    return Math.round(Math.min(Math.max(raw, 0), 100));
  }, [taskStats, habitStats, goalStats, moodStats, financeStats, focusStats]);

  const scoreColor =
    weekScore >= 80
      ? '#00E676'
      : weekScore >= 60
        ? '#FFD600'
        : weekScore >= 40
          ? '#FF9100'
          : '#FF5252';

  // Mood emoji
  const moodEmoji = (mood: number) => {
    if (mood >= 4.5) return 'Excellent';
    if (mood >= 3.5) return 'Good';
    if (mood >= 2.5) return 'Okay';
    if (mood >= 1.5) return 'Low';
    return 'N/A';
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-[#F0F0F5]">Weekly Review</h1>
        <p className="mt-1 text-sm text-[#8888A0]">{weekRange}</p>
      </motion.div>

      {/* Week Score — hero card */}
      <GlassCard className="relative overflow-hidden" delay={0.05}>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${scoreColor}, transparent)` }} />
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
          {/* Score circle */}
          <div className="relative flex h-32 w-32 flex-shrink-0 items-center justify-center">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#2A2A3A" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(weekScore / 100) * 314} 314`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-[#F0F0F5]">{weekScore}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#8888A0]">Score</span>
            </div>
          </div>

          {/* Summary stats row */}
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
            <StatBadge icon={<CheckCircle2 size={18} />} label="Tasks Done" value={taskStats.completed} color="#00E676" />
            <StatBadge icon={<Flame size={18} />} label="Habit Rate" value={`${habitStats.overallRate}%`} color="#FF9100" />
            <StatBadge icon={<BookOpen size={18} />} label="Avg Mood" value={moodStats.avgMood > 0 ? moodStats.avgMood.toFixed(1) : 'N/A'} color="#FFD600" />
            <StatBadge icon={<Wallet size={18} />} label="Net Income" value={`$${financeStats.net.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} color="#00D2FF" />
            <StatBadge icon={<Timer size={18} />} label="Focus Time" value={`${focusStats.totalMinutes}m`} color="#FF5252" />
            <StatBadge icon={<Target size={18} />} label="Goals" value={`${goalStats.length} active`} color="#6C5CE7" />
          </div>
        </div>
      </GlassCard>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks Summary */}
        <GlassCard delay={0.1}>
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#00E676]" />
            <h2 className="text-base font-semibold text-[#F0F0F5]">Tasks Summary</h2>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#1A1A25] p-3 text-center">
              <p className="text-xl font-bold text-[#00E676]">{taskStats.completed}</p>
              <p className="text-[11px] text-[#8888A0]">Completed</p>
            </div>
            <div className="rounded-xl bg-[#1A1A25] p-3 text-center">
              <p className="text-xl font-bold text-[#00D2FF]">{taskStats.added}</p>
              <p className="text-[11px] text-[#8888A0]">Added</p>
            </div>
            <div className="rounded-xl bg-[#1A1A25] p-3 text-center">
              <p className="text-xl font-bold text-[#FFD600]">{taskStats.rate}%</p>
              <p className="text-[11px] text-[#8888A0]">Rate</p>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStats.byDay} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" />
                <XAxis dataKey="day" tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="completed" name="Completed" radius={[6, 6, 0, 0]}>
                  {taskStats.byDay.map((_, idx) => (
                    <Cell key={idx} fill={idx === taskStats.byDay.length - 1 ? '#6C5CE7' : '#00E676'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Habits Summary */}
        <GlassCard delay={0.15}>
          <div className="mb-4 flex items-center gap-2">
            <Flame size={18} className="text-[#FF9100]" />
            <h2 className="text-base font-semibold text-[#F0F0F5]">Habits Summary</h2>
          </div>
          <div className="space-y-4">
            {/* Overall rate bar */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-[#8888A0]">Overall Completion</span>
                <span className="text-sm font-bold text-[#F0F0F5]">{habitStats.overallRate}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#1A1A25]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${habitStats.overallRate}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#FF9100] to-[#FFD600]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-[#1A1A25] p-3">
                <Trophy size={16} className="text-[#FFD600]" />
                <div>
                  <p className="text-[11px] text-[#8888A0]">Best Habit</p>
                  <p className="text-sm font-medium text-[#F0F0F5]">{habitStats.bestHabit}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-[#1A1A25] p-3">
                <AlertTriangle size={16} className="text-[#FF5252]" />
                <div>
                  <p className="text-[11px] text-[#8888A0]">Needs Attention</p>
                  <p className="text-sm font-medium text-[#F0F0F5]">{habitStats.worstHabit}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-[#1A1A25] p-3">
              <Zap size={16} className="text-[#6C5CE7]" />
              <div>
                <p className="text-[11px] text-[#8888A0]">Best Current Streak</p>
                <p className="text-sm font-medium text-[#F0F0F5]">{habitStats.bestStreak} days</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Goals Progress */}
        <GlassCard delay={0.2}>
          <div className="mb-4 flex items-center gap-2">
            <Target size={18} className="text-[#6C5CE7]" />
            <h2 className="text-base font-semibold text-[#F0F0F5]">Goals Progress</h2>
          </div>
          <div className="space-y-4">
            {goalStats.length === 0 ? (
              <p className="text-sm text-[#55556A]">No goals set</p>
            ) : (
              goalStats.map((goal) => (
                <div key={goal.title}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#F0F0F5]">{goal.title}</span>
                      <span className="rounded-full bg-[#1A1A25] px-2 py-0.5 text-[10px] text-[#8888A0]">
                        {goal.category}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#F0F0F5]">{goal.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#1A1A25]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF]"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#55556A]">
                    {goal.milestonesDone}/{goal.milestonesTotal} milestones completed
                  </p>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Journal Mood Trend */}
        <GlassCard delay={0.25}>
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-[#FFD600]" />
            <h2 className="text-base font-semibold text-[#F0F0F5]">Journal &amp; Mood</h2>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#1A1A25] p-3 text-center">
              <p className="text-xl font-bold text-[#FFD600]">
                {moodStats.avgMood > 0 ? moodStats.avgMood.toFixed(1) : '--'}
              </p>
              <p className="text-[11px] text-[#8888A0]">Avg Mood ({moodEmoji(moodStats.avgMood)})</p>
            </div>
            <div className="rounded-xl bg-[#1A1A25] p-3 text-center">
              <p className="text-xl font-bold text-[#00D2FF]">{moodStats.entryCount}</p>
              <p className="text-[11px] text-[#8888A0]">Journal Entries</p>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodStats.moodByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" />
                <XAxis dataKey="day" tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="mood"
                  name="Mood"
                  stroke="#FFD600"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#FFD600', stroke: '#13131A', strokeWidth: 2 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Finance Summary */}
        <GlassCard delay={0.3}>
          <div className="mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-[#00D2FF]" />
            <h2 className="text-base font-semibold text-[#F0F0F5]">Finance Summary</h2>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#1A1A25] p-3 text-center">
              <p className="flex items-center justify-center gap-1 text-lg font-bold text-[#00E676]">
                <ArrowUp size={14} />
                ${financeStats.income.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[11px] text-[#8888A0]">Income</p>
            </div>
            <div className="rounded-xl bg-[#1A1A25] p-3 text-center">
              <p className="flex items-center justify-center gap-1 text-lg font-bold text-[#FF5252]">
                <ArrowDown size={14} />
                ${financeStats.expenses.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[11px] text-[#8888A0]">Expenses</p>
            </div>
            <div className="rounded-xl bg-[#1A1A25] p-3 text-center">
              <p className={`text-lg font-bold ${financeStats.net >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'}`}>
                ${Math.abs(financeStats.net).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[11px] text-[#8888A0]">Net</p>
            </div>
          </div>
          {financeStats.pieData.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-[#8888A0]">Top Spending Categories</p>
              <div className="space-y-1.5">
                {financeStats.pieData.map((cat) => {
                  const pct =
                    financeStats.expenses > 0
                      ? Math.round((cat.value / financeStats.expenses) * 100)
                      : 0;
                  return (
                    <div key={cat.name} className="flex items-center gap-2">
                      <span className="w-20 text-xs text-[#8888A0]">{cat.name}</span>
                      <div className="flex-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#1A1A25]">
                          <div
                            className="h-full rounded-full bg-[#00D2FF]"
                            style={{ width: `${pct}%`, opacity: 0.8 }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right text-xs font-medium text-[#F0F0F5]">
                        ${cat.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Focus Stats */}
        <GlassCard delay={0.35}>
          <div className="mb-4 flex items-center gap-2">
            <Timer size={18} className="text-[#FF5252]" />
            <h2 className="text-base font-semibold text-[#F0F0F5]">Focus Stats</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#1A1A25] p-4 text-center">
              <p className="text-2xl font-bold text-[#FF5252]">{focusStats.totalMinutes}</p>
              <p className="text-[11px] text-[#8888A0]">Total Minutes</p>
            </div>
            <div className="rounded-xl bg-[#1A1A25] p-4 text-center">
              <p className="text-2xl font-bold text-[#6C5CE7]">{focusStats.sessionsCompleted}</p>
              <p className="text-[11px] text-[#8888A0]">Sessions</p>
            </div>
            <div className="rounded-xl bg-[#1A1A25] p-4 text-center">
              <p className="text-2xl font-bold text-[#00D2FF]">{focusStats.avgPerDay}</p>
              <p className="text-[11px] text-[#8888A0]">Avg Min/Day</p>
            </div>
          </div>
          {focusStats.totalMinutes === 0 && (
            <p className="mt-4 text-center text-sm text-[#55556A]">
              No focus sessions this week. Start a timer to track your deep work!
            </p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
