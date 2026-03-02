'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle2, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { useLifeOS } from '@/stores';
import { getDailyChallenge } from '@/lib/challenges';
import { Button } from '@/components/ui/button';

export function DailyChallenge() {
  const dailyChallenges = useLifeOS((s) => s.dailyChallenges);
  const completeDailyChallenge = useLifeOS((s) => s.completeDailyChallenge);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const challenge = useMemo(() => getDailyChallenge(todayStr), [todayStr]);

  const isCompleted = dailyChallenges.some(
    (c) => c.date === todayStr && c.challengeId === challenge.id && c.completed
  );

  const handleComplete = () => {
    if (!isCompleted) {
      completeDailyChallenge(todayStr, challenge.id);
    }
  };

  const categoryColors: Record<string, string> = {
    productivity: '#6C5CE7',
    wellness: '#00E676',
    creativity: '#FFD600',
    social: '#00D2FF',
    learning: '#FF6B9D',
    finance: '#FF9100',
  };

  const color = categoryColors[challenge.category] || '#6C5CE7';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      className={`rounded-2xl border p-5 ${
        isCompleted
          ? 'bg-[#00E676]/5 border-[#00E676]/20'
          : 'bg-[#13131A]/80 border-[#2A2A3A]'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-[#00E676]" />
            ) : (
              <Zap className="h-4 w-4" style={{ color }} />
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#8888A0]">
              Daily Challenge
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[#FFD600]/10 px-2 py-1">
          <Gift className="h-3 w-3 text-[#FFD600]" />
          <span className="text-xs font-semibold text-[#FFD600]">+{challenge.xpReward} XP</span>
        </div>
      </div>

      <h3 className={`text-base font-semibold mb-1 ${isCompleted ? 'text-[#00E676]' : 'text-[#F0F0F5]'}`}>
        {challenge.title}
      </h3>
      <p className="text-sm text-[#8888A0] mb-4">
        {challenge.description}
      </p>

      {isCompleted ? (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#00E676]" />
          <span className="text-sm font-medium text-[#00E676]">
            Challenge completed! +{challenge.xpReward} XP earned
          </span>
        </div>
      ) : (
        <Button
          onClick={handleComplete}
          size="sm"
          className="bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] hover:opacity-90 text-white"
        >
          Mark as Complete
        </Button>
      )}
    </motion.div>
  );
}
