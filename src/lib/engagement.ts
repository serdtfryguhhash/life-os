// ============================================================
// Streak & Daily Visit Tracking
// ============================================================

const STORAGE_KEY = 'life-os-engagement';

export interface EngagementData {
  visitedDates: string[];
  currentStreak: number;
  longestStreak: number;
  lastVisit: string | null;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadEngagement(): EngagementData {
  if (typeof window === 'undefined') {
    return { visitedDates: [], currentStreak: 0, longestStreak: 0, lastVisit: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return { visitedDates: [], currentStreak: 0, longestStreak: 0, lastVisit: null };
}

export function saveEngagement(data: EngagementData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function trackDailyVisit(): EngagementData {
  const data = loadEngagement();
  const today = getToday();
  const yesterday = getYesterday();

  if (data.lastVisit === today) {
    return data; // Already tracked today
  }

  // Add today to visited dates
  if (!data.visitedDates.includes(today)) {
    data.visitedDates.push(today);
  }

  // Calculate streak
  if (data.lastVisit === yesterday) {
    data.currentStreak += 1;
  } else if (data.lastVisit !== today) {
    data.currentStreak = 1;
  }

  data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  data.lastVisit = today;

  // Keep only last 400 dates to prevent unbounded growth
  if (data.visitedDates.length > 400) {
    data.visitedDates = data.visitedDates.slice(-400);
  }

  saveEngagement(data);
  return data;
}
