// ============================================================
// LifeOS - Type Definitions
// ============================================================

// ------------------------------------------------------------
// Calendar
// ------------------------------------------------------------
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  startTime?: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  color: string;
  category: 'work' | 'personal' | 'health' | 'social' | 'other';
  completed?: boolean;
}

// ------------------------------------------------------------
// Tasks
// ------------------------------------------------------------
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  project?: string;
  tags: string[];
  createdAt: string;
  completedAt?: string;
  subtasks: Subtask[];
}

// ------------------------------------------------------------
// Habits
// ------------------------------------------------------------
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  target: number; // times per frequency
  unit: string;
  completions: Record<string, number>; // date string -> count
  createdAt: string;
  streak: number;
}

// ------------------------------------------------------------
// Goals
// ------------------------------------------------------------
export type GoalTimeframe = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Milestone {
  id: string;
  title: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  timeframe: GoalTimeframe;
  progress: number; // 0-100
  milestones: Milestone[];
  deadline?: string;
  createdAt: string;
}

// ------------------------------------------------------------
// Journal
// ------------------------------------------------------------
export type Mood = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: Mood;
  gratitude: string[];
  tags: string[];
  createdAt: string;
}

// ------------------------------------------------------------
// Finance
// ------------------------------------------------------------
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  recurring?: boolean;
  notes?: string;
}

// ------------------------------------------------------------
// Notes
// ------------------------------------------------------------
export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// Pomodoro
// ------------------------------------------------------------
export type PomodoroType = 'focus' | 'short-break' | 'long-break';

export interface PomodoroSession {
  id: string;
  taskId?: string;
  startTime: string;
  duration: number; // minutes
  type: PomodoroType;
  completed: boolean;
}

export interface PomodoroSettings {
  focusDuration: number;
  shortBreak: number;
  longBreak: number;
}

// ------------------------------------------------------------
// Navigation
// ------------------------------------------------------------
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  color: string;
}
