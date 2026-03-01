'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, isToday, isSameDay, parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle2,
  Flame,
  CalendarDays,
  Timer,
  Plus,
  ChevronRight,
  BookOpen,
  Dumbbell,
  Brain,
  Droplets,
  ClipboardCheck,
  PenLine,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import { useLifeOS } from '@/stores';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOTIVATIONAL_QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Small daily improvements lead to stunning results.', author: 'Robin Sharma' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'What you do today can improve all your tomorrows.', author: 'Ralph Marston' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
];

const MOOD_EMOJIS: Record<number, string> = {
  1: '\u{1F629}',
  2: '\u{1F614}',
  3: '\u{1F610}',
  4: '\u{1F60A}',
  5: '\u{1F929}',
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Dumbbell,
  BookOpen,
  Brain,
  Droplets,
  ClipboardCheck,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GlassCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className={`rounded-2xl bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] p-5 hover:border-[#6C5CE7]/30 hover:shadow-[0_0_30px_rgba(108,92,231,0.08)] transition-all ${className}`}
    >
      {children}
    </motion.div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#1A1A25]/60 border border-[#2A2A3A] px-4 py-3 flex-1 min-w-[140px]">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-[#8888A0]">{label}</p>
        <p className="text-lg font-semibold text-[#F0F0F5]">{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Recharts Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#1A1A25] border border-[#2A2A3A] px-3 py-2 shadow-xl">
      <p className="text-xs text-[#8888A0]">{label}</p>
      <p className="text-sm font-semibold text-[#F0F0F5]">
        {payload[0].value} tasks
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const events = useLifeOS((s) => s.events);
  const tasks = useLifeOS((s) => s.tasks);
  const habits = useLifeOS((s) => s.habits);
  const goals = useLifeOS((s) => s.goals);
  const journalEntries = useLifeOS((s) => s.journalEntries);
  const transactions = useLifeOS((s) => s.transactions);
  const pomodoroSessions = useLifeOS((s) => s.pomodoroSessions);
  const updateTask = useLifeOS((s) => s.updateTask);
  const toggleHabitCompletion = useLifeOS((s) => s.toggleHabitCompletion);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // --- Derived data -----------------------------------------------------------

  const todayEvents = useMemo(
    () =>
      events
        .filter((e) => e.date === todayStr)
        .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')),
    [events, todayStr]
  );

  const tasksCompletedToday = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === 'done' && t.completedAt && isSameDay(parseISO(t.completedAt), new Date())
      ).length,
    [tasks]
  );

  const currentStreak = useMemo(() => {
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
    return maxStreak;
  }, [habits]);

  const focusMinutesToday = useMemo(
    () =>
      pomodoroSessions
        .filter(
          (s) =>
            s.completed &&
            s.type === 'focus' &&
            isToday(parseISO(s.startTime))
        )
        .reduce((sum, s) => sum + s.duration, 0),
    [pomodoroSessions]
  );

  const urgentTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'done')
        .sort((a, b) => {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, 3),
    [tasks]
  );

  const taskCompletionPercent = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100);
  }, [tasks]);

  const weeklyChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const completed = tasks.filter(
        (t) => t.completedAt && isSameDay(parseISO(t.completedAt), date)
      ).length;
      data.push({
        day: format(date, 'EEE'),
        tasks: completed,
      });
    }
    return data;
  }, [tasks]);

  const latestJournal = useMemo(
    () =>
      [...journalEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0],
    [journalEntries]
  );

  const monthlyFinance = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTransactions = transactions.filter(
      (t) => new Date(t.date) >= monthStart
    );
    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [transactions]);

  const topGoals = useMemo(() => goals.slice(0, 3), [goals]);

  const dailyHabits = useMemo(
    () => habits.filter((h) => h.frequency === 'daily'),
    [habits]
  );

  const quote = getDailyQuote();

  // --- Render -----------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mx-auto max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ============================================================
            Section 1 -- Welcome Header
           ============================================================ */}
        <motion.header variants={cardVariants} className="mb-8">
          <h1 className="text-3xl font-semibold text-[#F0F0F5] sm:text-4xl">
            {getGreeting()},{' '}
            <span className="gradient-text">User</span>
          </h1>
          <p className="mt-1 text-[#8888A0]">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
          <p className="mt-3 text-sm italic text-[#8888A0]">
            &ldquo;{quote.text}&rdquo;{' '}
            <span className="text-[#6C5CE7]">&mdash; {quote.author}</span>
          </p>

          {/* Quick stats */}
          <div className="mt-6 flex flex-wrap gap-3">
            <StatPill
              icon={CheckCircle2}
              label="Tasks done today"
              value={tasksCompletedToday}
              color="#00E676"
            />
            <StatPill
              icon={Flame}
              label="Best streak"
              value={`${currentStreak}d`}
              color="#FFD600"
            />
            <StatPill
              icon={CalendarDays}
              label="Events today"
              value={todayEvents.length}
              color="#00D2FF"
            />
            <StatPill
              icon={Timer}
              label="Focus minutes"
              value={focusMinutesToday}
              color="#6C5CE7"
            />
          </div>
        </motion.header>

        {/* ============================================================
            Section 2 -- Widget Grid
           ============================================================ */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* ----------------------------------------------------------
              Card 1 -- Today's Schedule (tall, left)
             ---------------------------------------------------------- */}
          <GlassCard className="row-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#F0F0F5]">
                Today&apos;s Schedule
              </h2>
              <Link href="/calendar">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1 text-xs text-[#6C5CE7] hover:text-[#6C5CE7] hover:bg-[#6C5CE7]/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </Link>
            </div>

            {todayEvents.length === 0 ? (
              <p className="text-sm text-[#8888A0] text-center py-8">
                No events scheduled today
              </p>
            ) : (
              <div className="space-y-1">
                {todayEvents.map((event, idx) => (
                  <div
                    key={event.id}
                    className="group relative flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-[#1A1A25]/60 transition-colors"
                  >
                    {/* Timeline line */}
                    <div className="flex flex-col items-center pt-1">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      {idx < todayEvents.length - 1 && (
                        <div className="w-px flex-1 bg-[#2A2A3A] mt-1 min-h-[32px]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#8888A0]">
                        {event.startTime}
                        {event.endTime ? ` - ${event.endTime}` : ''}
                      </p>
                      <p className="text-sm font-medium text-[#F0F0F5] truncate">
                        {event.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* ----------------------------------------------------------
              Card 2 -- Tasks Overview
             ---------------------------------------------------------- */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#F0F0F5]">
                Tasks Overview
              </h2>
              <Link
                href="/tasks"
                className="flex items-center gap-1 text-xs text-[#6C5CE7] hover:underline"
              >
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex items-center gap-5">
              {/* Circular progress ring */}
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="#2A2A3A"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="url(#progressGrad)"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - taskCompletionPercent / 100)}`}
                  />
                  <defs>
                    <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6C5CE7" />
                      <stop offset="100%" stopColor="#00D2FF" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[#F0F0F5]">
                  {taskCompletionPercent}%
                </span>
              </div>

              {/* Urgent tasks list */}
              <div className="flex-1 space-y-2 min-w-0">
                {urgentTasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <Checkbox
                      checked={task.status === 'done'}
                      onCheckedChange={() =>
                        updateTask(task.id, {
                          status: task.status === 'done' ? 'todo' : 'done',
                          completedAt:
                            task.status === 'done'
                              ? undefined
                              : new Date().toISOString(),
                        })
                      }
                      className="border-[#2A2A3A] data-[state=checked]:bg-[#6C5CE7] data-[state=checked]:border-[#6C5CE7]"
                    />
                    <span className="text-sm text-[#F0F0F5] truncate group-hover:text-[#00D2FF] transition-colors">
                      {task.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* ----------------------------------------------------------
              Card 3 -- Habit Streak
             ---------------------------------------------------------- */}
          <GlassCard>
            <h2 className="text-lg font-semibold text-[#F0F0F5] mb-4">
              Habit Streak
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {dailyHabits.map((habit) => {
                const IconComp = ICON_MAP[habit.icon] ?? CheckCircle2;
                const completedToday =
                  (habit.completions[todayStr] ?? 0) >= habit.target;
                return (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabitCompletion(habit.id, todayStr)}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                        completedToday
                          ? 'border-transparent'
                          : 'border-[#2A2A3A] hover:border-[#6C5CE7]/50'
                      }`}
                      style={{
                        backgroundColor: completedToday
                          ? `${habit.color}25`
                          : 'transparent',
                        borderColor: completedToday
                          ? habit.color
                          : undefined,
                      }}
                    >
                      <IconComp
                        className="h-5 w-5 transition-colors"
                        style={{
                          color: completedToday ? habit.color : '#8888A0',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[#8888A0] max-w-[56px] truncate text-center">
                      {habit.name}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: habit.color }}
                    >
                      {habit.streak}d
                    </span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* ----------------------------------------------------------
              Card 4 -- Goals Progress
             ---------------------------------------------------------- */}
          <GlassCard>
            <h2 className="text-lg font-semibold text-[#F0F0F5] mb-4">
              Goals Progress
            </h2>
            <div className="space-y-4">
              {topGoals.map((goal) => (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#F0F0F5] truncate">
                      {goal.title}
                    </span>
                    <span className="text-xs font-semibold text-[#6C5CE7] ml-2 shrink-0">
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1A1A25] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF]"
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* ----------------------------------------------------------
              Card 5 -- Weekly Activity Chart (wide)
             ---------------------------------------------------------- */}
          <GlassCard className="md:col-span-2">
            <h2 className="text-lg font-semibold text-[#F0F0F5] mb-4">
              Weekly Activity
            </h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyChartData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6C5CE7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2A2A3A"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#8888A0', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#8888A0', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stroke="#00D2FF"
                    strokeWidth={2}
                    fill="url(#areaFill)"
                    dot={{ r: 4, fill: '#6C5CE7', stroke: '#00D2FF', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#00D2FF' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* ----------------------------------------------------------
              Card 6 -- Recent Journal
             ---------------------------------------------------------- */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#F0F0F5]">
                Recent Journal
              </h2>
              {latestJournal && (
                <span className="text-2xl" role="img" aria-label="mood">
                  {MOOD_EMOJIS[latestJournal.mood] ?? ''}
                </span>
              )}
            </div>

            {latestJournal ? (
              <>
                <p className="text-xs text-[#8888A0] mb-2">
                  {format(parseISO(latestJournal.date), 'MMMM d, yyyy')}
                </p>
                <p className="text-sm text-[#F0F0F5]/80 line-clamp-4 leading-relaxed">
                  {latestJournal.content}
                </p>
                <Link href="/journal">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 gap-1.5 text-xs text-[#6C5CE7] hover:text-[#6C5CE7] hover:bg-[#6C5CE7]/10 px-0"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Write Today
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-[#8888A0] mb-3">No entries yet</p>
                <Link href="/journal">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-[#6C5CE7] hover:bg-[#6C5CE7]/80"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Write Today
                  </Button>
                </Link>
              </div>
            )}
          </GlassCard>

          {/* ----------------------------------------------------------
              Card 7 -- Finance Summary
             ---------------------------------------------------------- */}
          <GlassCard>
            <h2 className="text-lg font-semibold text-[#F0F0F5] mb-4">
              Finance Summary
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E676]/15">
                    <TrendingUp className="h-4 w-4 text-[#00E676]" />
                  </div>
                  <span className="text-sm text-[#8888A0]">Income</span>
                </div>
                <span className="text-sm font-semibold text-[#00E676]">
                  ${monthlyFinance.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5252]/15">
                    <TrendingDown className="h-4 w-4 text-[#FF5252]" />
                  </div>
                  <span className="text-sm text-[#8888A0]">Expenses</span>
                </div>
                <span className="text-sm font-semibold text-[#FF5252]">
                  ${monthlyFinance.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="h-px bg-[#2A2A3A]" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5CE7]/15">
                    <DollarSign className="h-4 w-4 text-[#6C5CE7]" />
                  </div>
                  <span className="text-sm text-[#8888A0]">Net</span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    monthlyFinance.net >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                  }`}
                >
                  {monthlyFinance.net >= 0 ? '+' : '-'}$
                  {Math.abs(monthlyFinance.net).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  );
}
