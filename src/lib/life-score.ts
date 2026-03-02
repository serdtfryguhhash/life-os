// ============================================================
// Life Score Calculator (0–100)
// ============================================================

import { format, subDays } from 'date-fns';
import type { Task, Habit, JournalEntry, Transaction, Goal } from '@/types';

export interface LifeScoreBreakdown {
  total: number;
  habits: number;
  tasks: number;
  journal: number;
  finance: number;
  goals: number;
}

export function calculateLifeScore(data: {
  tasks: Task[];
  habits: Habit[];
  journalEntries: JournalEntry[];
  transactions: Transaction[];
  goals: Goal[];
}): LifeScoreBreakdown {
  const { tasks, habits, journalEntries, transactions, goals } = data;

  // 1. Habit Consistency (0-20 points)
  // Based on last 7 days completion rate for daily habits
  let habitScore = 0;
  const dailyHabits = habits.filter((h) => h.frequency === 'daily');
  if (dailyHabits.length > 0) {
    let totalCompletions = 0;
    let totalPossible = 0;
    for (let i = 0; i < 7; i++) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      for (const habit of dailyHabits) {
        totalPossible++;
        if ((habit.completions[dateStr] || 0) >= habit.target) {
          totalCompletions++;
        }
      }
    }
    habitScore = totalPossible > 0 ? (totalCompletions / totalPossible) * 20 : 0;
  } else {
    habitScore = 10; // neutral if no habits
  }

  // 2. Task Completion (0-20 points)
  // Percentage of tasks that are done
  let taskScore = 0;
  if (tasks.length > 0) {
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    taskScore = (completedTasks / tasks.length) * 20;
  } else {
    taskScore = 10;
  }

  // 3. Journal Frequency (0-20 points)
  // Based on journaling in the last 7 days
  let journalScore = 0;
  const last7Days = new Set<string>();
  for (let i = 0; i < 7; i++) {
    last7Days.add(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  const recentEntries = journalEntries.filter((e) => last7Days.has(e.date));
  journalScore = Math.min(recentEntries.length / 5, 1) * 20;

  // 4. Financial Health (0-20 points)
  // Net income vs expenses ratio
  let financeScore = 0;
  if (transactions.length > 0) {
    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    if (income > 0) {
      const savingsRate = (income - expenses) / income;
      financeScore = Math.min(Math.max(savingsRate * 40, 0), 20); // 50% savings = max score
    } else {
      financeScore = 5;
    }
  } else {
    financeScore = 10;
  }

  // 5. Goal Progress (0-20 points)
  // Average progress across all goals
  let goalScore = 0;
  if (goals.length > 0) {
    const avgProgress = goals.reduce((s, g) => s + g.progress, 0) / goals.length;
    goalScore = (avgProgress / 100) * 20;
  } else {
    goalScore = 10;
  }

  const total = Math.round(habitScore + taskScore + journalScore + financeScore + goalScore);

  return {
    total: Math.min(total, 100),
    habits: Math.round(habitScore),
    tasks: Math.round(taskScore),
    journal: Math.round(journalScore),
    finance: Math.round(financeScore),
    goals: Math.round(goalScore),
  };
}
