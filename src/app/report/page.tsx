'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Download, Calendar } from 'lucide-react';
import { format, subDays, isSameDay, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { useLifeOS } from '@/stores';
import { Button } from '@/components/ui/button';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="rounded-lg bg-[#1A1A25] border border-[#2A2A3A] px-3 py-2 shadow-xl">
      <p className="text-xs text-[#8888A0]">{label}</p>
      <p className="text-sm font-medium text-[#F0F0F5]">{payload[0].value}</p>
    </div>
  );
}

export default function ReportPage() {
  const {
    tasks,
    habits,
    journalEntries,
    transactions,
    pomodoroSessions,
    weeklyReports,
    addWeeklyReport,
  } = useLifeOS();

  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<string | null>(null);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  // Weekly data
  const weekData = useMemo(() => {
    const isThisWeek = (dateStr: string) => {
      try {
        const d = parseISO(dateStr);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      } catch {
        return false;
      }
    };

    const tasksCompleted = tasks.filter(
      (t) => t.status === 'done' && t.completedAt && isThisWeek(t.completedAt)
    ).length;

    const habitsCompleted = habits.reduce((sum, h) => {
      return (
        sum +
        Object.entries(h.completions).filter(
          ([date, count]) => isThisWeek(date) && count >= h.target
        ).length
      );
    }, 0);

    const weekJournals = journalEntries.filter((e) => isThisWeek(e.date));
    const moodAverage =
      weekJournals.length > 0
        ? +(weekJournals.reduce((s, e) => s + e.mood, 0) / weekJournals.length).toFixed(1)
        : 0;

    const focusMinutes = pomodoroSessions
      .filter((s) => s.completed && s.type === 'focus' && isThisWeek(s.startTime))
      .reduce((sum, s) => sum + s.duration, 0);

    const weekTransactions = transactions.filter((t) => isThisWeek(t.date));
    const income = weekTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expenses = weekTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    return {
      tasksCompleted,
      habitsCompleted,
      journalEntries: weekJournals.length,
      focusMinutes,
      moodAverage,
      netIncome: income - expenses,
      income,
      expenses,
    };
  }, [tasks, habits, journalEntries, transactions, pomodoroSessions, weekStart, weekEnd]);

  // Daily task chart for the week
  const dailyTaskData = useMemo(() => {
    const data: { day: string; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const completed = tasks.filter(
        (t) => t.completedAt && isSameDay(parseISO(t.completedAt), date)
      ).length;
      data.push({ day: format(date, 'EEE'), completed });
    }
    return data;
  }, [tasks]);

  // Mood chart
  const moodChartData = useMemo(() => {
    return journalEntries
      .slice(-7)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((e) => ({
        day: format(parseISO(e.date), 'EEE'),
        mood: e.mood,
      }));
  }, [journalEntries]);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekData }),
      });
      const data = await res.json();
      const report = data.report || 'Unable to generate report.';
      setCurrentReport(report);

      addWeeklyReport({
        weekOf: format(weekStart, 'yyyy-MM-dd'),
        summary: report,
        generatedAt: new Date().toISOString(),
        data: {
          tasksCompleted: weekData.tasksCompleted,
          habitsCompleted: weekData.habitsCompleted,
          journalEntries: weekData.journalEntries,
          focusMinutes: weekData.focusMinutes,
          moodAverage: weekData.moodAverage,
          netIncome: weekData.netIncome,
        },
      });
    } catch {
      setCurrentReport('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  }, [weekData, weekStart, addWeeklyReport]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00D2FF]/10">
              <FileText className="size-6 text-[#00D2FF]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#F0F0F5]">Weekly Report</h1>
              <p className="text-sm text-[#8888A0]">
                Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Button
            onClick={generateReport}
            disabled={loading}
            className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-1" />
                Generate Report
              </>
            )}
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8"
        >
          {[
            { label: 'Tasks Done', value: weekData.tasksCompleted, color: '#6C5CE7' },
            { label: 'Habits Done', value: weekData.habitsCompleted, color: '#00E676' },
            { label: 'Journal Entries', value: weekData.journalEntries, color: '#FFD600' },
            { label: 'Focus (min)', value: weekData.focusMinutes, color: '#00D2FF' },
            { label: 'Avg Mood', value: weekData.moodAverage, color: '#FF6B9D' },
            { label: 'Net Income', value: `$${weekData.netIncome.toFixed(0)}`, color: weekData.netIncome >= 0 ? '#00E676' : '#FF5252' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-[#13131A]/80 border border-[#2A2A3A] p-4 text-center"
            >
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs text-[#8888A0] mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-[#13131A]/80 border border-[#2A2A3A] p-5"
          >
            <h3 className="text-sm font-semibold text-[#F0F0F5] mb-4">Tasks Completed</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTaskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="completed" fill="#6C5CE7" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-[#13131A]/80 border border-[#2A2A3A] p-5"
          >
            <h3 className="text-sm font-semibold text-[#F0F0F5] mb-4">Mood Trend</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="mood" stroke="#FF6B9D" strokeWidth={2} dot={{ fill: '#FF6B9D', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* AI Report */}
        {currentReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-[#13131A]/80 border border-[#2A2A3A] p-6"
          >
            <h3 className="text-lg font-semibold text-[#F0F0F5] mb-4">
              AI Analysis
            </h3>
            <div className="text-sm text-[#F0F0F5]/80 whitespace-pre-wrap leading-relaxed">
              {currentReport}
            </div>
          </motion.div>
        )}

        {/* Past Reports */}
        {weeklyReports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <h3 className="text-lg font-semibold text-[#F0F0F5] mb-4">
              Past Reports
            </h3>
            <div className="space-y-3">
              {[...weeklyReports].reverse().slice(0, 5).map((report) => (
                <button
                  key={report.id}
                  onClick={() => setCurrentReport(report.summary)}
                  className="w-full text-left rounded-xl bg-[#13131A]/80 border border-[#2A2A3A] p-4 hover:border-[#6C5CE7]/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#8888A0]" />
                      <span className="text-sm text-[#F0F0F5]">
                        Week of {report.weekOf}
                      </span>
                    </div>
                    <span className="text-xs text-[#8888A0]">
                      {format(new Date(report.generatedAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-xs text-[#8888A0] mt-1 line-clamp-2">
                    {report.summary.slice(0, 150)}...
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
