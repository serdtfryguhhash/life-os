'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import type { Habit } from '@/types';

interface HabitHeatmapProps {
  habit: Habit;
}

export function HabitHeatmap({ habit }: HabitHeatmapProps) {
  const today = new Date();

  const days = useMemo(() => {
    const start = subDays(today, 364);
    return eachDayOfInterval({ start, end: today });
  }, []);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let currentWeek: Date[] = [];

    for (const day of days) {
      if (day.getDay() === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    return result;
  }, [days]);

  const getIntensity = (dateStr: string): number => {
    const count = habit.completions[dateStr] || 0;
    if (count === 0) return 0;
    if (count >= habit.target) return 4;
    const ratio = count / habit.target;
    if (ratio >= 0.75) return 3;
    if (ratio >= 0.5) return 2;
    return 1;
  };

  const colorMap: Record<number, string> = {
    0: '#1A1A25',
    1: `${habit.color}30`,
    2: `${habit.color}60`,
    3: `${habit.color}90`,
    4: habit.color,
  };

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0];
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        labels.push({ label: format(firstDay, 'MMM'), col: i });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  const totalCompleted = useMemo(() => {
    return days.filter((d) => {
      const dateStr = format(d, 'yyyy-MM-dd');
      return (habit.completions[dateStr] || 0) >= habit.target;
    }).length;
  }, [days, habit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#F0F0F5]">{habit.name}</h3>
        <span className="text-xs text-[#8888A0]">
          {totalCompleted} days completed
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-1 ml-[18px]" style={{ gap: 0 }}>
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-[10px] text-[#55556A]"
                style={{
                  position: 'relative',
                  left: `${m.col * 13}px`,
                  width: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-[1px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[1px] pr-1">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <span key={i} className="text-[9px] text-[#55556A] h-[11px] leading-[11px]">
                  {d}
                </span>
              ))}
            </div>

            {/* Heatmap grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[1px]">
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week.find((d) => d.getDay() === di);
                  if (!day) {
                    return <div key={di} className="w-[11px] h-[11px]" />;
                  }
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const intensity = getIntensity(dateStr);
                  return (
                    <div
                      key={di}
                      className="w-[11px] h-[11px] rounded-[2px] transition-colors"
                      style={{ backgroundColor: colorMap[intensity] }}
                      title={`${dateStr}: ${habit.completions[dateStr] || 0}/${habit.target}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1 mt-2 justify-end">
            <span className="text-[9px] text-[#55556A]">Less</span>
            {[0, 1, 2, 3, 4].map((intensity) => (
              <div
                key={intensity}
                className="w-[11px] h-[11px] rounded-[2px]"
                style={{ backgroundColor: colorMap[intensity] }}
              />
            ))}
            <span className="text-[9px] text-[#55556A]">More</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
