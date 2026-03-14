import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays, addDays } from 'date-fns';
import type {
  CalendarEvent,
  Task,
  Habit,
  Goal,
  JournalEntry,
  Transaction,
  Note,
  PomodoroSession,
  PomodoroSettings,
  TaskPriority,
  TaskStatus,
  Mood,
  TransactionType,
  GoalTimeframe,
} from '@/types';
import type { Achievement } from '@/lib/gamification';

// ============================================================
// New types for stickiness features
// ============================================================

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface WeeklyReport {
  id: string;
  weekOf: string;
  summary: string;
  generatedAt: string;
  data: {
    tasksCompleted: number;
    habitsCompleted: number;
    journalEntries: number;
    focusMinutes: number;
    moodAverage: number;
    netIncome: number;
  };
}

export interface Template {
  id: string;
  name: string;
  type: 'journal' | 'task' | 'goal';
  content: Record<string, unknown>;
  createdAt: string;
}

export interface DailyChallengeState {
  date: string;
  challengeId: string;
  completed: boolean;
}

// ============================================================
// Store interface
// ============================================================

interface LifeOSState {
  // --- Existing Data ---
  events: CalendarEvent[];
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  journalEntries: JournalEntry[];
  transactions: Transaction[];
  notes: Note[];
  pomodoroSessions: PomodoroSession[];
  pomodoroSettings: PomodoroSettings;

  // --- New Stickiness Data ---
  xp: number;
  level: number;
  achievements: Achievement[];
  streakData: { currentStreak: number; longestStreak: number };
  coachMessages: CoachMessage[];
  weeklyReports: WeeklyReport[];
  templates: Template[];
  dailyChallenges: DailyChallengeState[];
  lifeScoreHistory: { date: string; score: number }[];
  newAchievements: Achievement[]; // queue for toast display

  // --- Calendar Events ---
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // --- Tasks ---
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  // --- Habits ---
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions' | 'streak'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (habitId: string, date: string) => void;

  // --- Goals ---
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;

  // --- Journal ---
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  // --- Transactions ---
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // --- Notes ---
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // --- Pomodoro ---
  addPomodoroSession: (session: Omit<PomodoroSession, 'id'>) => void;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;

  // --- Gamification ---
  addXP: (amount: number) => void;
  dismissAchievement: () => void;

  // --- Coach ---
  addCoachMessage: (message: Omit<CoachMessage, 'id' | 'timestamp'>) => void;
  clearCoachMessages: () => void;

  // --- Weekly Reports ---
  addWeeklyReport: (report: Omit<WeeklyReport, 'id'>) => void;

  // --- Templates ---
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;

  // --- Daily Challenge ---
  completeDailyChallenge: (date: string, challengeId: string) => void;

  // --- Life Score ---
  addLifeScoreEntry: (date: string, score: number) => void;

  // --- Streak ---
  updateStreakData: (data: { currentStreak: number; longestStreak: number }) => void;
}

// ============================================================
// Seed data helpers
// ============================================================

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');
const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
const twoDaysAgoStr = format(subDays(today, 2), 'yyyy-MM-dd');
const threeDaysAgoStr = format(subDays(today, 3), 'yyyy-MM-dd');
const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
const dayAfterStr = format(addDays(today, 2), 'yyyy-MM-dd');
const nextWeekStr = format(addDays(today, 7), 'yyyy-MM-dd');
const nextMonthStr = format(addDays(today, 30), 'yyyy-MM-dd');

// ============================================================
// Seed data
// ============================================================

const seedEvents: CalendarEvent[] = [
  {
    id: uuidv4(),
    title: 'Team standup',
    description: 'Daily sync with the engineering team',
    date: todayStr,
    startTime: '09:30',
    endTime: '09:45',
    color: '#6C5CE7',
    category: 'work',
  },
  {
    id: uuidv4(),
    title: 'Gym - Upper body',
    description: 'Bench press, overhead press, rows',
    date: todayStr,
    startTime: '07:00',
    endTime: '08:00',
    color: '#00E676',
    category: 'health',
  },
  {
    id: uuidv4(),
    title: 'Product review meeting',
    description: 'Q2 roadmap review with stakeholders',
    date: tomorrowStr,
    startTime: '14:00',
    endTime: '15:30',
    color: '#6C5CE7',
    category: 'work',
  },
  {
    id: uuidv4(),
    title: 'Dinner with Alex',
    description: 'Trying the new ramen place downtown',
    date: dayAfterStr,
    startTime: '19:00',
    endTime: '21:00',
    color: '#00D2FF',
    category: 'social',
  },
  {
    id: uuidv4(),
    title: 'Dentist appointment',
    date: nextWeekStr,
    startTime: '10:00',
    endTime: '10:45',
    color: '#FFD600',
    category: 'personal',
  },
];

const seedTasks: Task[] = [
  {
    id: uuidv4(),
    title: 'Finish API integration for user dashboard',
    description: 'Connect the new REST endpoints to the frontend dashboard components',
    priority: 'high',
    status: 'in-progress',
    dueDate: tomorrowStr,
    project: 'Dashboard v2',
    tags: ['frontend', 'api'],
    createdAt: threeDaysAgoStr,
    subtasks: [
      { id: uuidv4(), title: 'Set up API client', done: true },
      { id: uuidv4(), title: 'Implement data fetching hooks', done: true },
      { id: uuidv4(), title: 'Build chart components', done: false },
      { id: uuidv4(), title: 'Add error handling', done: false },
    ],
  },
  {
    id: uuidv4(),
    title: 'Write unit tests for auth module',
    priority: 'urgent',
    status: 'todo',
    dueDate: todayStr,
    project: 'Dashboard v2',
    tags: ['testing', 'auth'],
    createdAt: twoDaysAgoStr,
    subtasks: [],
  },
  {
    id: uuidv4(),
    title: 'Grocery shopping',
    description: 'Weekly groceries - check the list on the fridge',
    priority: 'medium',
    status: 'todo',
    dueDate: tomorrowStr,
    tags: ['personal', 'errands'],
    createdAt: yesterdayStr,
    subtasks: [
      { id: uuidv4(), title: 'Vegetables & fruits', done: false },
      { id: uuidv4(), title: 'Protein (chicken, eggs, tofu)', done: false },
      { id: uuidv4(), title: 'Pantry staples', done: false },
    ],
  },
  {
    id: uuidv4(),
    title: 'Read "Designing Data-Intensive Applications" Ch. 5',
    priority: 'low',
    status: 'todo',
    tags: ['reading', 'learning'],
    createdAt: threeDaysAgoStr,
    subtasks: [],
  },
  {
    id: uuidv4(),
    title: 'Plan weekend hiking trip',
    description: 'Research trails, check weather, pack gear',
    priority: 'medium',
    status: 'todo',
    dueDate: nextWeekStr,
    tags: ['personal', 'outdoors'],
    createdAt: yesterdayStr,
    subtasks: [
      { id: uuidv4(), title: 'Pick a trail', done: false },
      { id: uuidv4(), title: 'Check weather forecast', done: false },
      { id: uuidv4(), title: 'Pack backpack', done: false },
    ],
  },
  {
    id: uuidv4(),
    title: 'Review pull request #247',
    priority: 'high',
    status: 'todo',
    dueDate: todayStr,
    project: 'Dashboard v2',
    tags: ['code-review'],
    createdAt: yesterdayStr,
    subtasks: [],
  },
  {
    id: uuidv4(),
    title: 'Update portfolio website',
    description: 'Add recent projects and refresh the design',
    priority: 'low',
    status: 'todo',
    tags: ['personal', 'design'],
    createdAt: threeDaysAgoStr,
    subtasks: [],
  },
  {
    id: uuidv4(),
    title: 'Prepare presentation slides',
    description: 'Q1 results presentation for the all-hands meeting',
    priority: 'high',
    status: 'done',
    dueDate: yesterdayStr,
    project: 'Dashboard v2',
    tags: ['work', 'presentation'],
    createdAt: subDays(today, 5).toISOString(),
    completedAt: yesterdayStr,
    subtasks: [
      { id: uuidv4(), title: 'Gather metrics', done: true },
      { id: uuidv4(), title: 'Design slides', done: true },
      { id: uuidv4(), title: 'Add speaker notes', done: true },
    ],
  },
];

const seedHabits: Habit[] = [
  {
    id: uuidv4(),
    name: 'Morning workout',
    icon: 'Dumbbell',
    color: '#00E676',
    frequency: 'daily',
    target: 1,
    unit: 'session',
    completions: {
      [yesterdayStr]: 1,
      [twoDaysAgoStr]: 1,
      [threeDaysAgoStr]: 1,
      [format(subDays(today, 4), 'yyyy-MM-dd')]: 1,
      [format(subDays(today, 5), 'yyyy-MM-dd')]: 1,
    },
    createdAt: format(subDays(today, 14), 'yyyy-MM-dd'),
    streak: 5,
  },
  {
    id: uuidv4(),
    name: 'Read 30 minutes',
    icon: 'BookOpen',
    color: '#FFD600',
    frequency: 'daily',
    target: 1,
    unit: 'session',
    completions: {
      [yesterdayStr]: 1,
      [twoDaysAgoStr]: 1,
      [format(subDays(today, 4), 'yyyy-MM-dd')]: 1,
    },
    createdAt: format(subDays(today, 10), 'yyyy-MM-dd'),
    streak: 2,
  },
  {
    id: uuidv4(),
    name: 'Meditate',
    icon: 'Brain',
    color: '#6C5CE7',
    frequency: 'daily',
    target: 1,
    unit: 'session',
    completions: {
      [todayStr]: 1,
      [yesterdayStr]: 1,
      [twoDaysAgoStr]: 1,
      [threeDaysAgoStr]: 1,
    },
    createdAt: format(subDays(today, 21), 'yyyy-MM-dd'),
    streak: 4,
  },
  {
    id: uuidv4(),
    name: 'Drink 8 glasses of water',
    icon: 'Droplets',
    color: '#00D2FF',
    frequency: 'daily',
    target: 8,
    unit: 'glasses',
    completions: {
      [todayStr]: 3,
      [yesterdayStr]: 8,
      [twoDaysAgoStr]: 7,
    },
    createdAt: format(subDays(today, 7), 'yyyy-MM-dd'),
    streak: 1,
  },
  {
    id: uuidv4(),
    name: 'Weekly review',
    icon: 'ClipboardCheck',
    color: '#FF5252',
    frequency: 'weekly',
    target: 1,
    unit: 'session',
    completions: {
      [format(subDays(today, 7), 'yyyy-MM-dd')]: 1,
    },
    createdAt: format(subDays(today, 14), 'yyyy-MM-dd'),
    streak: 1,
  },
];

const seedGoals: Goal[] = [
  {
    id: uuidv4(),
    title: 'Ship Dashboard v2',
    description: 'Complete the new analytics dashboard with real-time data',
    category: 'Career',
    timeframe: 'quarterly' as GoalTimeframe,
    progress: 65,
    milestones: [
      { id: uuidv4(), title: 'Design system finalized', done: true },
      { id: uuidv4(), title: 'API integration complete', done: true },
      { id: uuidv4(), title: 'Beta testing', done: false },
      { id: uuidv4(), title: 'Production deploy', done: false },
    ],
    deadline: nextMonthStr,
    createdAt: format(subDays(today, 30), 'yyyy-MM-dd'),
  },
  {
    id: uuidv4(),
    title: 'Run a half marathon',
    description: 'Train consistently and complete a half marathon race',
    category: 'Health',
    timeframe: 'yearly' as GoalTimeframe,
    progress: 30,
    milestones: [
      { id: uuidv4(), title: 'Run 5K without stopping', done: true },
      { id: uuidv4(), title: 'Run 10K under 55 min', done: false },
      { id: uuidv4(), title: 'Complete 15K training run', done: false },
      { id: uuidv4(), title: 'Race day', done: false },
    ],
    deadline: format(addDays(today, 180), 'yyyy-MM-dd'),
    createdAt: format(subDays(today, 60), 'yyyy-MM-dd'),
  },
  {
    id: uuidv4(),
    title: 'Build an emergency fund',
    description: 'Save 3 months of living expenses',
    category: 'Finance',
    timeframe: 'yearly' as GoalTimeframe,
    progress: 45,
    milestones: [
      { id: uuidv4(), title: 'Save first $1,000', done: true },
      { id: uuidv4(), title: 'Reach $3,000', done: true },
      { id: uuidv4(), title: 'Reach $6,000', done: false },
      { id: uuidv4(), title: 'Reach $9,000 (target)', done: false },
    ],
    createdAt: format(subDays(today, 90), 'yyyy-MM-dd'),
  },
];

const seedJournalEntries: JournalEntry[] = [
  {
    id: uuidv4(),
    date: todayStr,
    content:
      'Had a productive morning. Knocked out the standup early and made solid progress on the dashboard API. Feeling good about the direction of the project. Need to remember to take more breaks though - caught myself sitting for 3 hours straight.',
    mood: 4 as Mood,
    gratitude: [
      'Good coffee this morning',
      'Supportive teammate who helped debug an issue',
      'Clear weather for a walk at lunch',
    ],
    tags: ['productive', 'work'],
    createdAt: todayStr,
  },
  {
    id: uuidv4(),
    date: yesterdayStr,
    content:
      'Presentation went well! Got positive feedback from the team on the Q1 metrics. Celebrated with the new ramen place - it was incredible. Also finished a great chapter in the book. Trying to keep this momentum going.',
    mood: 5 as Mood,
    gratitude: [
      'Successful presentation',
      'Amazing ramen for dinner',
      'Progress on personal reading goal',
    ],
    tags: ['accomplishment', 'social'],
    createdAt: yesterdayStr,
  },
  {
    id: uuidv4(),
    date: threeDaysAgoStr,
    content:
      'Rough day. Slept poorly and it carried through the whole day. Struggled with focus and barely got anything done. Skipped the gym too. Need to prioritize sleep - it really is the foundation of everything else.',
    mood: 2 as Mood,
    gratitude: [
      'At least I recognized the pattern',
      'Cozy evening at home',
    ],
    tags: ['reflection', 'sleep'],
    createdAt: threeDaysAgoStr,
  },
];

const seedTransactions: Transaction[] = [
  {
    id: uuidv4(),
    title: 'Monthly salary',
    amount: 5200,
    type: 'income' as TransactionType,
    category: 'Salary',
    date: format(subDays(today, 5), 'yyyy-MM-dd'),
    recurring: true,
  },
  {
    id: uuidv4(),
    title: 'Rent payment',
    amount: 1650,
    type: 'expense' as TransactionType,
    category: 'Housing',
    date: format(subDays(today, 3), 'yyyy-MM-dd'),
    recurring: true,
  },
  {
    id: uuidv4(),
    title: 'Grocery run',
    amount: 87.43,
    type: 'expense' as TransactionType,
    category: 'Food',
    date: yesterdayStr,
  },
  {
    id: uuidv4(),
    title: 'Gym membership',
    amount: 49.99,
    type: 'expense' as TransactionType,
    category: 'Health',
    date: format(subDays(today, 7), 'yyyy-MM-dd'),
    recurring: true,
  },
  {
    id: uuidv4(),
    title: 'Freelance design project',
    amount: 800,
    type: 'income' as TransactionType,
    category: 'Freelance',
    date: twoDaysAgoStr,
    notes: 'Logo redesign for local bakery',
  },
  {
    id: uuidv4(),
    title: 'Electric bill',
    amount: 62.30,
    type: 'expense' as TransactionType,
    category: 'Utilities',
    date: format(subDays(today, 10), 'yyyy-MM-dd'),
    recurring: true,
  },
  {
    id: uuidv4(),
    title: 'Coffee & pastry',
    amount: 8.75,
    type: 'expense' as TransactionType,
    category: 'Food',
    date: todayStr,
  },
  {
    id: uuidv4(),
    title: 'Spotify subscription',
    amount: 10.99,
    type: 'expense' as TransactionType,
    category: 'Entertainment',
    date: format(subDays(today, 12), 'yyyy-MM-dd'),
    recurring: true,
  },
  {
    id: uuidv4(),
    title: 'New running shoes',
    amount: 129.95,
    type: 'expense' as TransactionType,
    category: 'Health',
    date: format(subDays(today, 4), 'yyyy-MM-dd'),
    notes: 'Nike Pegasus 41 for half marathon training',
  },
  {
    id: uuidv4(),
    title: 'Book - Designing Data-Intensive Applications',
    amount: 42.99,
    type: 'expense' as TransactionType,
    category: 'Education',
    date: format(subDays(today, 8), 'yyyy-MM-dd'),
  },
];

const seedNotes: Note[] = [
  {
    id: uuidv4(),
    title: 'Meeting notes - Product sync',
    content:
      '## Key takeaways\n- Push launch date to March 15\n- Need to align with marketing on messaging\n- Performance benchmarks look solid\n- Follow up with design on the new onboarding flow',
    category: 'Work',
    pinned: true,
    color: '#6C5CE7',
    createdAt: yesterdayStr,
    updatedAt: yesterdayStr,
  },
  {
    id: uuidv4(),
    title: 'Recipe - Spicy miso ramen',
    content:
      '## Ingredients\n- 2 tbsp white miso paste\n- 1 tbsp chili oil\n- Fresh ramen noodles\n- Soft-boiled eggs\n- Chashu pork\n- Green onions, nori, sesame\n\n## Steps\n1. Make tare: miso + chili oil + soy sauce\n2. Prepare broth (chicken + dashi)\n3. Cook noodles al dente\n4. Assemble and top with egg, pork, garnishes',
    category: 'Personal',
    pinned: false,
    color: '#FFD600',
    createdAt: twoDaysAgoStr,
    updatedAt: twoDaysAgoStr,
  },
  {
    id: uuidv4(),
    title: 'Book notes - Atomic Habits',
    content:
      '## Core ideas\n- Habits are the compound interest of self-improvement\n- Focus on systems, not goals\n- The 4 laws: make it obvious, attractive, easy, satisfying\n- Identity-based habits > outcome-based habits\n- Environment design is underrated',
    category: 'Learning',
    pinned: true,
    color: '#00E676',
    createdAt: threeDaysAgoStr,
    updatedAt: yesterdayStr,
  },
  {
    id: uuidv4(),
    title: 'Weekend trip packing list',
    content:
      '- Hiking boots\n- Rain jacket\n- Water bottle (32oz)\n- Trail mix & energy bars\n- First aid kit\n- Portable charger\n- Headlamp\n- Sunscreen',
    category: 'Personal',
    pinned: false,
    color: '#00D2FF',
    createdAt: todayStr,
    updatedAt: todayStr,
  },
];

// ============================================================
// Store
// ============================================================

export const useLifeOS = create<LifeOSState>()(
  persist(
    (set, get) => ({
      // ---- Initial data ----
      events: seedEvents,
      tasks: seedTasks,
      habits: seedHabits,
      goals: seedGoals,
      journalEntries: seedJournalEntries,
      transactions: seedTransactions,
      notes: seedNotes,
      pomodoroSessions: [],
      pomodoroSettings: {
        focusDuration: 25,
        shortBreak: 5,
        longBreak: 15,
      },

      // ---- Stickiness data ----
      xp: 150,
      level: 2,
      achievements: [],
      streakData: { currentStreak: 1, longestStreak: 1 },
      coachMessages: [],
      weeklyReports: [],
      templates: [],
      dailyChallenges: [],
      lifeScoreHistory: [],
      newAchievements: [],

      // ---- Calendar Events ----
      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, { ...event, id: uuidv4() }],
        })),
      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),

      // ---- Tasks (with XP for completion) ----
      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            { ...task, id: uuidv4(), createdAt: new Date().toISOString() },
          ],
        })),
      updateTask: (id, updates) =>
        set((state) => {
          const oldTask = state.tasks.find((t) => t.id === id);
          const isCompletingTask =
            oldTask &&
            oldTask.status !== 'done' &&
            updates.status === 'done';
          const xpGain = isCompletingTask ? 10 : 0;
          return {
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
            xp: state.xp + xpGain,
          };
        }),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, done: !s.done } : s
                  ),
                }
              : t
          ),
        })),

      // ---- Habits (with XP for toggling on) ----
      addHabit: (habit) =>
        set((state) => ({
          habits: [
            ...state.habits,
            {
              ...habit,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
              completions: {},
              streak: 0,
            },
          ],
        })),
      updateHabit: (id, updates) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        })),
      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        })),
      toggleHabitCompletion: (habitId, date) =>
        set((state) => {
          let xpGain = 0;
          const newHabits = state.habits.map((h) => {
            if (h.id !== habitId) return h;
            const current = h.completions[date] || 0;
            const next = current >= h.target ? 0 : current + 1;
            // Award XP when reaching target
            if (next === h.target && current < h.target) {
              xpGain = 15;
            }
            return {
              ...h,
              completions: { ...h.completions, [date]: next },
            };
          });
          return { habits: newHabits, xp: state.xp + xpGain };
        }),

      // ---- Goals (with XP for completing) ----
      addGoal: (goal) =>
        set((state) => ({
          goals: [
            ...state.goals,
            { ...goal, id: uuidv4(), createdAt: new Date().toISOString() },
          ],
        })),
      updateGoal: (id, updates) =>
        set((state) => {
          const oldGoal = state.goals.find((g) => g.id === id);
          const isCompletingGoal =
            oldGoal &&
            oldGoal.progress < 100 &&
            updates.progress === 100;
          const xpGain = isCompletingGoal ? 100 : 0;
          return {
            goals: state.goals.map((g) =>
              g.id === id ? { ...g, ...updates } : g
            ),
            xp: state.xp + xpGain,
          };
        }),
      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),
      toggleMilestone: (goalId, milestoneId) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  milestones: g.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, done: !m.done } : m
                  ),
                }
              : g
          ),
        })),

      // ---- Journal (with XP) ----
      addJournalEntry: (entry) =>
        set((state) => ({
          journalEntries: [
            ...state.journalEntries,
            { ...entry, id: uuidv4(), createdAt: new Date().toISOString() },
          ],
          xp: state.xp + 25,
        })),
      updateJournalEntry: (id, updates) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((j) =>
            j.id === id ? { ...j, ...updates } : j
          ),
        })),
      deleteJournalEntry: (id) =>
        set((state) => ({
          journalEntries: state.journalEntries.filter((j) => j.id !== id),
        })),

      // ---- Transactions ----
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...transaction, id: uuidv4() },
          ],
        })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      // ---- Notes ----
      addNote: (note) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            notes: [
              ...state.notes,
              { ...note, id: uuidv4(), createdAt: now, updatedAt: now },
            ],
          };
        }),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? { ...n, ...updates, updatedAt: new Date().toISOString() }
              : n
          ),
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),

      // ---- Pomodoro (with XP) ----
      addPomodoroSession: (session) =>
        set((state) => {
          const xpGain = session.completed && session.type === 'focus' ? 20 : 0;
          return {
            pomodoroSessions: [
              ...state.pomodoroSessions,
              { ...session, id: uuidv4() },
            ],
            xp: state.xp + xpGain,
          };
        }),
      updatePomodoroSettings: (settings) =>
        set((state) => ({
          pomodoroSettings: { ...state.pomodoroSettings, ...settings },
        })),

      // ---- Gamification ----
      addXP: (amount) =>
        set((state) => ({
          xp: state.xp + amount,
        })),
      dismissAchievement: () =>
        set((state) => ({
          newAchievements: state.newAchievements.slice(1),
        })),

      // ---- Coach ----
      addCoachMessage: (message) =>
        set((state) => ({
          coachMessages: [
            ...state.coachMessages,
            { ...message, id: uuidv4(), timestamp: new Date().toISOString() },
          ],
        })),
      clearCoachMessages: () => set({ coachMessages: [] }),

      // ---- Weekly Reports ----
      addWeeklyReport: (report) =>
        set((state) => ({
          weeklyReports: [
            ...state.weeklyReports,
            { ...report, id: uuidv4() },
          ],
        })),

      // ---- Templates ----
      addTemplate: (template) =>
        set((state) => ({
          templates: [
            ...state.templates,
            { ...template, id: uuidv4(), createdAt: new Date().toISOString() },
          ],
        })),
      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),

      // ---- Daily Challenge ----
      completeDailyChallenge: (date, challengeId) =>
        set((state) => {
          const existing = state.dailyChallenges.find(
            (c) => c.date === date && c.challengeId === challengeId
          );
          if (existing?.completed) return state;
          return {
            dailyChallenges: [
              ...state.dailyChallenges.filter((c) => c.date !== date),
              { date, challengeId, completed: true },
            ],
            xp: state.xp + 50,
          };
        }),

      // ---- Life Score ----
      addLifeScoreEntry: (date, score) =>
        set((state) => {
          const existing = state.lifeScoreHistory.filter((e) => e.date !== date);
          return {
            lifeScoreHistory: [...existing, { date, score }].slice(-90),
          };
        }),

      // ---- Streak ----
      updateStreakData: (data) =>
        set({ streakData: data }),
    }),
    {
      name: 'life-os-storage',
    }
  )
);
