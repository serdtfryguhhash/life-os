'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, isSameDay, isSameWeek, parseISO, subWeeks } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useLifeOS } from '@/stores';

function FocusTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="rounded-lg bg-[#1A1A25] border border-[#2A2A3A] px-3 py-2 shadow-xl">
      <p className="text-xs text-[#8888A0]">{label}</p>
      <p className="text-sm font-medium text-[#F0F0F5]">{payload[0].value} min</p>
    </div>
  );
}

export function FocusStats() {
  const pomodoroSessions = useLifeOS((s) => s.pomodoroSessions);

  const focusSessions = useMemo(
    () => pomodoroSessions.filter((s) => s.completed && s.type === 'focus'),
    [pomodoroSessions]
  );

  const totalHours = useMemo(
    () => +(focusSessions.reduce((s, p) => s + p.duration, 0) / 60).toFixed(1),
    [focusSessions]
  );

  const todayMinutes = useMemo(
    () =>
      focusSessions
        .filter((s) => isSameDay(parseISO(s.startTime), new Date()))
        .reduce((sum, s) => sum + s.duration, 0),
    [focusSessions]
  );

  const thisWeekMinutes = useMemo(
    () =>
      focusSessions
        .filter((s) => isSameWeek(parseISO(s.startTime), new Date(), { weekStartsOn: 1 }))
        .reduce((sum, s) => sum + s.duration, 0),
    [focusSessions]
  );

  const lastWeekMinutes = useMemo(
    () => {
      const lastWeekDate = subWeeks(new Date(), 1);
      return focusSessions
        .filter((s) => isSameWeek(parseISO(s.startTime), lastWeekDate, { weekStartsOn: 1 }))
        .reduce((sum, s) => sum + s.duration, 0);
    },
    [focusSessions]
  );

  const weekComparison = lastWeekMinutes > 0
    ? Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100)
    : thisWeekMinutes > 0 ? 100 : 0;

  const dailyData = useMemo(() => {
    const data: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const minutes = focusSessions
        .filter((s) => isSameDay(parseISO(s.startTime), date))
        .reduce((sum, s) => sum + s.duration, 0);
      data.push({ day: format(date, 'EEE'), minutes });
    }
    return data;
  }, [focusSessions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
      className="rounded-2xl bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5CE7]/15">
          <BarChart3 className="h-4 w-4 text-[#6C5CE7]" />
        </div>
        <h2 className="text-lg font-semibold text-[#F0F0F5]">Focus Stats</h2>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-[#1A1A25] p-3 text-center">
          <Clock className="h-4 w-4 text-[#6C5CE7] mx-auto mb-1" />
          <p className="text-xl font-bold text-[#F0F0F5]">{totalHours}h</p>
          <p className="text-[10px] text-[#8888A0]">Total</p>
        </div>
        <div className="rounded-xl bg-[#1A1A25] p-3 text-center">
          <Clock className="h-4 w-4 text-[#00D2FF] mx-auto mb-1" />
          <p className="text-xl font-bold text-[#F0F0F5]">{todayMinutes}m</p>
          <p className="text-[10px] text-[#8888A0]">Today</p>
        </div>
        <div className="rounded-xl bg-[#1A1A25] p-3 text-center">
          <TrendingUp className="h-4 w-4 mx-auto mb-1" style={{ color: weekComparison >= 0 ? '#00E676' : '#FF5252' }} />
          <p className="text-xl font-bold text-[#F0F0F5]">
            {weekComparison >= 0 ? '+' : ''}{weekComparison}%
          </p>
          <p className="text-[10px] text-[#8888A0]">vs Last Week</p>
        </div>
      </div>

      <p className="text-xs text-[#55556A] mb-2">Last 7 Days</p>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#8888A0', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8888A0', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<FocusTooltip />} />
            <Bar
              dataKey="minutes"
              radius={[4, 4, 0, 0]}
              fill="#6C5CE7"
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
