'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { trackDailyVisit, type EngagementData } from '@/lib/engagement';
import { useLifeOS } from '@/stores';

export function StreakBadge({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<EngagementData | null>(null);
  const updateStreakData = useLifeOS((s) => s.updateStreakData);

  useEffect(() => {
    const engagement = trackDailyVisit();
    setData(engagement);
    updateStreakData({
      currentStreak: engagement.currentStreak,
      longestStreak: engagement.longestStreak,
    });
  }, [updateStreakData]);

  if (!data) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Flame className="h-4 w-4 text-[#FF9100]" />
        <span className="text-sm font-semibold text-[#FFD600]">
          {data.currentStreak}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 rounded-xl bg-[#FF9100]/10 border border-[#FF9100]/20 px-3 py-2"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
      >
        <Flame className="h-5 w-5 text-[#FF9100]" />
      </motion.div>
      <div>
        <p className="text-sm font-bold text-[#FFD600]">
          {data.currentStreak} day{data.currentStreak !== 1 ? 's' : ''}
        </p>
        <p className="text-[10px] text-[#8888A0]">
          Best: {data.longestStreak}d
        </p>
      </div>
    </motion.div>
  );
}
