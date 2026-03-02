'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { useLifeOS } from '@/stores';
import { Button } from '@/components/ui/button';

export function MorningBriefing() {
  const events = useLifeOS((s) => s.events);
  const tasks = useLifeOS((s) => s.tasks);
  const habits = useLifeOS((s) => s.habits);
  const journalEntries = useLifeOS((s) => s.journalEntries);

  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const generateBriefing = useCallback(async () => {
    setLoading(true);
    try {
      const todayEvents = events
        .filter((e) => e.date === todayStr)
        .map((e) => ({ title: e.title, time: e.startTime, end: e.endTime }));

      const dueTasks = tasks
        .filter((t) => t.status !== 'done' && t.dueDate === todayStr)
        .map((t) => ({ title: t.title, priority: t.priority }));

      const pendingTasks = tasks
        .filter((t) => t.status !== 'done')
        .sort((a, b) => {
          const order = { urgent: 0, high: 1, medium: 2, low: 3 };
          return order[a.priority] - order[b.priority];
        })
        .slice(0, 5)
        .map((t) => ({ title: t.title, priority: t.priority }));

      const dailyHabits = habits
        .filter((h) => h.frequency === 'daily')
        .map((h) => ({
          name: h.name,
          completedToday: (h.completions[todayStr] || 0) >= h.target,
          streak: h.streak,
        }));

      const recentMoods = journalEntries
        .slice(-5)
        .map((e) => ({ date: e.date, mood: e.mood }));

      const res = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          todayData: {
            date: todayStr,
            events: todayEvents,
            dueTasks,
            topTasks: pendingTasks,
            habits: dailyHabits,
            recentMoods,
          },
        }),
      });

      const data = await res.json();
      setBriefing(data.briefing || 'Unable to generate briefing.');
      setHasGenerated(true);
    } catch {
      setBriefing('Failed to generate briefing. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [events, tasks, habits, journalEntries, todayStr]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      className="rounded-2xl bg-gradient-to-br from-[#6C5CE7]/10 to-[#00D2FF]/5 border border-[#6C5CE7]/20 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFD600]/15">
            <Sun className="h-4 w-4 text-[#FFD600]" />
          </div>
          <h2 className="text-lg font-semibold text-[#F0F0F5]">Morning Briefing</h2>
        </div>
        {hasGenerated && (
          <Button
            onClick={generateBriefing}
            disabled={loading}
            size="sm"
            variant="ghost"
            className="text-[#8888A0] hover:text-[#F0F0F5]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!hasGenerated && !loading ? (
          <motion.div
            key="generate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <Sparkles className="h-8 w-8 text-[#6C5CE7] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[#8888A0] mb-4">
              Get a personalized AI-powered morning briefing
            </p>
            <Button
              onClick={generateBriefing}
              className="bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] hover:opacity-90 text-white"
            >
              <Sun className="h-4 w-4 mr-1" />
              Generate Briefing
            </Button>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8"
          >
            <Loader2 className="h-6 w-6 text-[#6C5CE7] animate-spin" />
            <span className="ml-2 text-sm text-[#8888A0]">
              Generating your briefing...
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="briefing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-[#F0F0F5]/80 whitespace-pre-wrap leading-relaxed"
          >
            {briefing}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
