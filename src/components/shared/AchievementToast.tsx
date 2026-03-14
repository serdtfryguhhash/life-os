'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { useLifeOS } from '@/stores';
import {
  checkAchievements,
  type AchievementStats,
} from '@/lib/gamification';
import { loadEngagement } from '@/lib/engagement';

export function AchievementToast() {
  const xp = useLifeOS((s) => s.xp);
  const tasks = useLifeOS((s) => s.tasks);
  const journalEntries = useLifeOS((s) => s.journalEntries);
  const habits = useLifeOS((s) => s.habits);
  const goals = useLifeOS((s) => s.goals);
  const pomodoroSessions = useLifeOS((s) => s.pomodoroSessions);
  const achievements = useLifeOS((s) => s.achievements);
  const newAchievements = useLifeOS((s) => s.newAchievements);
  const dismissAchievement = useLifeOS((s) => s.dismissAchievement);

  useEffect(() => {
    const engagement = loadEngagement();
    const stats: AchievementStats = {
      xp,
      tasksCompleted: tasks.filter((t) => t.status === 'done').length,
      journalEntries: journalEntries.length,
      habitsCompleted: habits.reduce(
        (sum, h) =>
          sum +
          Object.values(h.completions).filter((v) => v >= h.target).length,
        0
      ),
      goalsCompleted: goals.filter((g) => g.progress >= 100).length,
      pomodoroSessions: pomodoroSessions.filter(
        (s) => s.completed && s.type === 'focus'
      ).length,
      streak: engagement.currentStreak,
    };

    const newOnes = checkAchievements(stats, achievements);
    if (newOnes.length > 0) {
      useLifeOS.setState((state) => ({
        achievements: [...state.achievements, ...newOnes],
        newAchievements: [...state.newAchievements, ...newOnes],
      }));
    }
  }, [xp, tasks, journalEntries, habits, goals, pomodoroSessions, achievements]);

  const current = newAchievements[0] || null;

  useEffect(() => {
    if (current) {
      const timer = setTimeout(() => {
        dismissAchievement();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [current, dismissAchievement]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0, y: -80, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -80, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed left-1/2 top-4 z-[100] flex items-center gap-3 rounded-2xl bg-[#13131A] border border-[#6C5CE7]/50 px-5 py-3 shadow-2xl shadow-[#6C5CE7]/20"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD600]/15">
            <Trophy className="h-5 w-5 text-[#FFD600]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F0F0F5]">
              Achievement Unlocked!
            </p>
            <p className="text-xs text-[#8888A0]">
              {current.title} - {current.description}
            </p>
          </div>
          <button
            onClick={dismissAchievement}
            className="ml-2 text-[#8888A0] hover:text-[#F0F0F5]"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
