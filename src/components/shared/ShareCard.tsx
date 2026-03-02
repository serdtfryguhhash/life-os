'use client';

import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, Copy, Sparkles, Flame, Trophy, Activity, Check } from 'lucide-react';
import { useLifeOS } from '@/stores';
import { getLevelInfo } from '@/lib/gamification';
import { Button } from '@/components/ui/button';

export function ShareCard() {
  const xp = useLifeOS((s) => s.xp);
  const streakData = useLifeOS((s) => s.streakData);
  const achievements = useLifeOS((s) => s.achievements);
  const [copied, setCopied] = useState(false);

  const info = getLevelInfo(xp);

  const getStatsText = useCallback(() => {
    return `LifeOS Stats\nLevel ${info.level} ${info.name} | ${xp} XP\nStreak: ${streakData.currentStreak} days (Best: ${streakData.longestStreak})\nAchievements: ${achievements.length} unlocked\n#LifeOS #Productivity`;
  }, [info, xp, streakData, achievements]);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(getStatsText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getStatsText]);

  const downloadAsText = useCallback(() => {
    const blob = new Blob([getStatsText()], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = 'lifeos-stats.txt';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [getStatsText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="rounded-2xl bg-gradient-to-br from-[#13131A] to-[#1A1A25] border border-[#2A2A3A] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#00D2FF] text-sm font-bold text-white">
            L
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#F0F0F5]">LifeOS</h3>
            <p className="text-xs text-[#8888A0]">Personal Operating System</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-[#6C5CE7]" />
              <span className="text-xs text-[#8888A0]">Level</span>
            </div>
            <p className="text-lg font-bold text-[#F0F0F5]">
              {info.level} — {info.name}
            </p>
            <p className="text-xs text-[#8888A0]">{xp} XP</p>
          </div>

          <div className="rounded-xl bg-[#FF9100]/10 border border-[#FF9100]/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-[#FF9100]" />
              <span className="text-xs text-[#8888A0]">Streak</span>
            </div>
            <p className="text-lg font-bold text-[#FFD600]">
              {streakData.currentStreak} days
            </p>
            <p className="text-xs text-[#8888A0]">
              Best: {streakData.longestStreak}d
            </p>
          </div>

          <div className="rounded-xl bg-[#FFD600]/10 border border-[#FFD600]/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-[#FFD600]" />
              <span className="text-xs text-[#8888A0]">Achievements</span>
            </div>
            <p className="text-lg font-bold text-[#F0F0F5]">
              {achievements.length}
            </p>
            <p className="text-xs text-[#8888A0]">unlocked</p>
          </div>

          <div className="rounded-xl bg-[#00D2FF]/10 border border-[#00D2FF]/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-[#00D2FF]" />
              <span className="text-xs text-[#8888A0]">Progress</span>
            </div>
            <p className="text-lg font-bold text-[#F0F0F5]">
              {Math.round(info.progress * 100)}%
            </p>
            <p className="text-xs text-[#8888A0]">to next level</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex-1 border-[#2A2A3A] text-[#8888A0] hover:text-[#F0F0F5]"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1 text-[#00E676]" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy Stats
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadAsText}
          className="flex-1 border-[#2A2A3A] text-[#8888A0] hover:text-[#F0F0F5]"
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
        <Button
          size="sm"
          onClick={copyToClipboard}
          className="flex-1 bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white"
        >
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>
    </motion.div>
  );
}
