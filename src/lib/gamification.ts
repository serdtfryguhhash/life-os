// ============================================================
// XP & Levels System
// ============================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface LevelInfo {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  progress: number; // 0-1
}

const LEVEL_THRESHOLDS = [
  { min: 0, max: 99, name: 'Beginner' },
  { min: 100, max: 499, name: 'Organized' },
  { min: 500, max: 1499, name: 'Productive' },
  { min: 1500, max: 4999, name: 'Achiever' },
  { min: 5000, max: Infinity, name: 'Life Master' },
] as const;

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].min) return i + 1;
  }
  return 1;
}

export function getLevelName(xp: number): string {
  const level = getLevel(xp);
  return LEVEL_THRESHOLDS[level - 1].name;
}

export function getLevelInfo(xp: number): LevelInfo {
  const level = getLevel(xp);
  const threshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level] || null;
  const minXP = threshold.min;
  const maxXP = nextThreshold ? nextThreshold.min : threshold.min + 5000;
  const progress = Math.min((xp - minXP) / (maxXP - minXP), 1);

  return {
    level,
    name: threshold.name,
    minXP,
    maxXP,
    progress,
  };
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  xp: number;
  tasksCompleted: number;
  journalEntries: number;
  habitsCompleted: number;
  goalsCompleted: number;
  pomodoroSessions: number;
  streak: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first-task',
    title: 'Getting Started',
    description: 'Complete your first task',
    icon: 'CheckCircle2',
    check: (s) => s.tasksCompleted >= 1,
  },
  {
    id: 'five-tasks',
    title: 'Task Slayer',
    description: 'Complete 5 tasks',
    icon: 'ListChecks',
    check: (s) => s.tasksCompleted >= 5,
  },
  {
    id: 'first-journal',
    title: 'Dear Diary',
    description: 'Write your first journal entry',
    icon: 'BookOpen',
    check: (s) => s.journalEntries >= 1,
  },
  {
    id: 'ten-journals',
    title: 'Storyteller',
    description: 'Write 10 journal entries',
    icon: 'PenLine',
    check: (s) => s.journalEntries >= 10,
  },
  {
    id: 'habit-starter',
    title: 'Habit Former',
    description: 'Complete 10 habit check-ins',
    icon: 'Flame',
    check: (s) => s.habitsCompleted >= 10,
  },
  {
    id: 'streak-3',
    title: 'Consistency',
    description: 'Maintain a 3-day streak',
    icon: 'Zap',
    check: (s) => s.streak >= 3,
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'Shield',
    check: (s) => s.streak >= 7,
  },
  {
    id: 'streak-30',
    title: 'Monthly Legend',
    description: 'Maintain a 30-day streak',
    icon: 'Crown',
    check: (s) => s.streak >= 30,
  },
  {
    id: 'focus-5',
    title: 'Deep Focus',
    description: 'Complete 5 pomodoro sessions',
    icon: 'Brain',
    check: (s) => s.pomodoroSessions >= 5,
  },
  {
    id: 'focus-25',
    title: 'Flow State',
    description: 'Complete 25 pomodoro sessions',
    icon: 'Timer',
    check: (s) => s.pomodoroSessions >= 25,
  },
  {
    id: 'level-2',
    title: 'Leveling Up',
    description: 'Reach level 2 (Organized)',
    icon: 'TrendingUp',
    check: (s) => s.xp >= 100,
  },
  {
    id: 'level-3',
    title: 'Productivity Pro',
    description: 'Reach level 3 (Productive)',
    icon: 'Award',
    check: (s) => s.xp >= 500,
  },
  {
    id: 'level-4',
    title: 'High Achiever',
    description: 'Reach level 4 (Achiever)',
    icon: 'Trophy',
    check: (s) => s.xp >= 1500,
  },
  {
    id: 'level-5',
    title: 'Life Master',
    description: 'Reach the highest level',
    icon: 'Star',
    check: (s) => s.xp >= 5000,
  },
  {
    id: 'goal-complete',
    title: 'Goal Crusher',
    description: 'Complete your first goal',
    icon: 'Target',
    check: (s) => s.goalsCompleted >= 1,
  },
];

export function checkAchievements(
  stats: AchievementStats,
  existingAchievements: Achievement[]
): Achievement[] {
  const existingIds = new Set(existingAchievements.map((a) => a.id));
  const newAchievements: Achievement[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (!existingIds.has(def.id) && def.check(stats)) {
      newAchievements.push({
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        unlockedAt: new Date().toISOString(),
      });
    }
  }

  return newAchievements;
}
