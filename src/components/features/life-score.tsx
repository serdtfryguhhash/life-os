'use client';

import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useLifeOS } from '@/stores';
import { calculateLifeScore } from '@/lib/life-score';

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  const getColor = (s: number) => {
    if (s >= 80) return '#00E676';
    if (s >= 60) return '#00D2FF';
    if (s >= 40) return '#FFD600';
    return '#FF5252';
  };

  const color = getColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A1A25"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold text-[#F0F0F5]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-[#8888A0]">/ 100</span>
      </div>
    </div>
  );
}

function ScoreTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="rounded-lg bg-[#1A1A25] border border-[#2A2A3A] px-3 py-2 shadow-xl">
      <p className="text-xs text-[#8888A0]">{label}</p>
      <p className="text-sm font-medium text-[#F0F0F5]">{payload[0].value}</p>
    </div>
  );
}

export function LifeScore() {
  const tasks = useLifeOS((s) => s.tasks);
  const habits = useLifeOS((s) => s.habits);
  const journalEntries = useLifeOS((s) => s.journalEntries);
  const transactions = useLifeOS((s) => s.transactions);
  const goals = useLifeOS((s) => s.goals);
  const lifeScoreHistory = useLifeOS((s) => s.lifeScoreHistory);
  const addLifeScoreEntry = useLifeOS((s) => s.addLifeScoreEntry);

  const breakdown = useMemo(
    () =>
      calculateLifeScore({
        tasks,
        habits,
        journalEntries,
        transactions,
        goals,
      }),
    [tasks, habits, journalEntries, transactions, goals]
  );

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    addLifeScoreEntry(todayStr, breakdown.total);
  }, [breakdown.total, todayStr, addLifeScoreEntry]);

  const chartData = useMemo(() => {
    return lifeScoreHistory
      .slice(-14)
      .map((entry) => ({
        date: entry.date.slice(5), // MM-DD
        score: entry.score,
      }));
  }, [lifeScoreHistory]);

  const categories = [
    { label: 'Habits', value: breakdown.habits, max: 20, color: '#00E676' },
    { label: 'Tasks', value: breakdown.tasks, max: 20, color: '#6C5CE7' },
    { label: 'Journal', value: breakdown.journal, max: 20, color: '#FFD600' },
    { label: 'Finance', value: breakdown.finance, max: 20, color: '#00D2FF' },
    { label: 'Goals', value: breakdown.goals, max: 20, color: '#FF6B9D' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      className="rounded-2xl bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D2FF]/15">
          <Activity className="h-4 w-4 text-[#00D2FF]" />
        </div>
        <h2 className="text-lg font-semibold text-[#F0F0F5]">Life Score</h2>
      </div>

      <div className="flex items-center gap-6">
        <ScoreRing score={breakdown.total} />

        <div className="flex-1 space-y-2">
          {categories.map((cat) => (
            <div key={cat.label} className="flex items-center gap-2">
              <span className="text-xs text-[#8888A0] w-14">{cat.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-[#1A1A25] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(cat.value / cat.max) * 100}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                />
              </div>
              <span className="text-xs text-[#8888A0] w-8 text-right">
                {cat.value}/{cat.max}
              </span>
            </div>
          ))}
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="mt-4 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" hide />
              <Tooltip content={<ScoreTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#00D2FF"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
