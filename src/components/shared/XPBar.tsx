'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useLifeOS } from '@/stores';
import { getLevelInfo } from '@/lib/gamification';

export function XPBar({ compact = false }: { compact?: boolean }) {
  const xp = useLifeOS((s) => s.xp);
  const info = getLevelInfo(xp);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#6C5CE7]" />
        <span className="text-sm font-semibold text-[#6C5CE7]">
          Lv{info.level}
        </span>
        <div className="h-1.5 w-16 rounded-full bg-[#2A2A3A] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF]"
            initial={{ width: 0 }}
            animate={{ width: `${info.progress * 100}%` }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-[#13131A]/80 border border-[#2A2A3A] p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5CE7]/15">
            <Sparkles className="h-4 w-4 text-[#6C5CE7]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F0F0F5]">
              Level {info.level} — {info.name}
            </p>
            <p className="text-xs text-[#8888A0]">
              {xp} XP
            </p>
          </div>
        </div>
        <span className="text-xs text-[#8888A0]">
          {Math.round(info.progress * 100)}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#1A1A25] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF]"
          initial={{ width: 0 }}
          animate={{ width: `${info.progress * 100}%` }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        />
      </div>
      <p className="text-[10px] text-[#55556A] mt-1">
        {info.maxXP - xp > 0 ? `${info.maxXP - xp} XP to next level` : 'Max level reached!'}
      </p>
    </motion.div>
  );
}
