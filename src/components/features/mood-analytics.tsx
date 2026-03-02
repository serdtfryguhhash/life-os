'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2 } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useLifeOS } from '@/stores';
import { Button } from '@/components/ui/button';

const MOOD_COLORS: Record<number, string> = {
  1: '#FF5252',
  2: '#FF9800',
  3: '#FFD600',
  4: '#8BC34A',
  5: '#00E676',
};

function MoodTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.[0]) return null;
  const mood = payload[0].value;
  const labels: Record<number, string> = { 1: 'Terrible', 2: 'Bad', 3: 'Okay', 4: 'Good', 5: 'Great' };
  return (
    <div className="rounded-lg bg-[#1A1A25] border border-[#2A2A3A] px-3 py-2 shadow-xl">
      <p className="text-xs text-[#8888A0]">{label}</p>
      <p className="text-sm font-medium" style={{ color: MOOD_COLORS[mood] || '#8888A0' }}>
        {labels[mood] || mood} ({mood}/5)
      </p>
    </div>
  );
}

export function MoodAnalytics() {
  const journalEntries = useLifeOS((s) => s.journalEntries);
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const chartData = useMemo(() => {
    const data: { date: string; mood: number; label: string }[] = [];
    const sorted = [...journalEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    for (const entry of sorted.slice(-30)) {
      data.push({
        date: entry.date,
        mood: entry.mood,
        label: format(parseISO(entry.date), 'MMM d'),
      });
    }
    return data;
  }, [journalEntries]);

  const avgMood = useMemo(() => {
    if (chartData.length === 0) return 0;
    return +(chartData.reduce((s, d) => s + d.mood, 0) / chartData.length).toFixed(1);
  }, [chartData]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const moodData = journalEntries.slice(-14).map((e) => ({
        date: e.date,
        mood: e.mood,
        tags: e.tags,
        excerpt: e.content.slice(0, 100),
      }));

      const res = await fetch('/api/ai/mood-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moodData }),
      });

      const data = await res.json();
      setInsights(data.insights || 'Unable to generate insights.');
    } catch {
      setInsights('Failed to fetch insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
      className="rounded-2xl bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5CE7]/15">
            <Brain className="h-4 w-4 text-[#6C5CE7]" />
          </div>
          <h2 className="text-lg font-semibold text-[#F0F0F5]">Mood Analytics</h2>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#F0F0F5]">{avgMood}</p>
          <p className="text-[10px] text-[#8888A0]">avg mood</p>
        </div>
      </div>

      {chartData.length > 1 ? (
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#8888A0', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fill: '#8888A0', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<MoodTooltip />} />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#6C5CE7"
                strokeWidth={2}
                dot={(props: Record<string, unknown>) => {
                  const { cx, cy, payload } = props as { cx: number; cy: number; payload: { mood: number } };
                  return (
                    <circle
                      key={`${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={MOOD_COLORS[payload?.mood] || '#6C5CE7'}
                      stroke="none"
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-[#8888A0] text-center py-8 mb-4">
          Need at least 2 journal entries to show mood trends
        </p>
      )}

      <Button
        onClick={fetchInsights}
        disabled={loading || journalEntries.length < 2}
        size="sm"
        className="w-full bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Brain className="h-4 w-4 mr-1" />
            Get AI Insights
          </>
        )}
      </Button>

      {insights && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 rounded-xl bg-[#1A1A25] border border-[#2A2A3A] p-4"
        >
          <p className="text-xs font-medium text-[#6C5CE7] mb-2">AI Insights</p>
          <div className="text-sm text-[#F0F0F5]/80 whitespace-pre-wrap leading-relaxed">
            {insights}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
