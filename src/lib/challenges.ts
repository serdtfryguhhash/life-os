// ============================================================
// Daily Challenge System
// ============================================================

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'productivity' | 'wellness' | 'creativity' | 'social' | 'learning' | 'finance';
  icon: string;
  xpReward: number;
}

export const CHALLENGE_POOL: Challenge[] = [
  { id: 'c01', title: 'Write 500 words', description: 'Write at least 500 words in your journal today', category: 'creativity', icon: 'PenLine', xpReward: 50 },
  { id: 'c02', title: 'Complete 4 pomodoros', description: 'Finish 4 focus sessions today', category: 'productivity', icon: 'Timer', xpReward: 50 },
  { id: 'c03', title: 'Log all meals', description: 'Record every meal you eat today in your journal', category: 'wellness', icon: 'Apple', xpReward: 50 },
  { id: 'c04', title: 'Zero inbox', description: 'Complete all tasks due today', category: 'productivity', icon: 'CheckCircle2', xpReward: 50 },
  { id: 'c05', title: 'Gratitude triple', description: 'Write 3 things you are grateful for', category: 'wellness', icon: 'Heart', xpReward: 50 },
  { id: 'c06', title: 'Read for 30 minutes', description: 'Spend at least 30 minutes reading', category: 'learning', icon: 'BookOpen', xpReward: 50 },
  { id: 'c07', title: 'No social media', description: 'Avoid social media for the entire day', category: 'wellness', icon: 'ShieldOff', xpReward: 50 },
  { id: 'c08', title: 'Plan tomorrow', description: 'Create a detailed plan for tomorrow', category: 'productivity', icon: 'CalendarPlus', xpReward: 50 },
  { id: 'c09', title: 'Walk 10,000 steps', description: 'Get moving and walk at least 10,000 steps', category: 'wellness', icon: 'Footprints', xpReward: 50 },
  { id: 'c10', title: 'Learn something new', description: 'Spend 20 minutes learning a new skill', category: 'learning', icon: 'Lightbulb', xpReward: 50 },
  { id: 'c11', title: 'Deep work block', description: 'Complete a 90-minute deep work session', category: 'productivity', icon: 'Brain', xpReward: 50 },
  { id: 'c12', title: 'Connect with someone', description: 'Reach out to a friend or colleague', category: 'social', icon: 'Users', xpReward: 50 },
  { id: 'c13', title: 'Budget review', description: 'Review your spending for the week', category: 'finance', icon: 'Wallet', xpReward: 50 },
  { id: 'c14', title: 'Meditate for 15 min', description: 'Complete a 15-minute meditation session', category: 'wellness', icon: 'Brain', xpReward: 50 },
  { id: 'c15', title: 'Complete all habits', description: 'Check off every daily habit today', category: 'productivity', icon: 'Flame', xpReward: 50 },
  { id: 'c16', title: 'Write a thank you note', description: 'Send a genuine thank you to someone', category: 'social', icon: 'Mail', xpReward: 50 },
  { id: 'c17', title: 'Organize workspace', description: 'Clean and organize your physical workspace', category: 'productivity', icon: 'Layout', xpReward: 50 },
  { id: 'c18', title: 'Cook a healthy meal', description: 'Prepare a nutritious meal from scratch', category: 'wellness', icon: 'ChefHat', xpReward: 50 },
  { id: 'c19', title: 'Review goals', description: 'Review and update your progress on goals', category: 'productivity', icon: 'Target', xpReward: 50 },
  { id: 'c20', title: 'Digital declutter', description: 'Delete old files and organize your digital space', category: 'productivity', icon: 'FolderOpen', xpReward: 50 },
  { id: 'c21', title: 'Stretch for 10 min', description: 'Complete a 10-minute stretching routine', category: 'wellness', icon: 'Activity', xpReward: 50 },
  { id: 'c22', title: 'Write a reflection', description: 'Reflect on your biggest win this week', category: 'creativity', icon: 'Star', xpReward: 50 },
  { id: 'c23', title: 'Save $10 today', description: 'Find a way to save $10 today', category: 'finance', icon: 'PiggyBank', xpReward: 50 },
  { id: 'c24', title: 'Take a photo walk', description: 'Go for a walk and take 5 interesting photos', category: 'creativity', icon: 'Camera', xpReward: 50 },
  { id: 'c25', title: 'Help someone', description: 'Do something helpful for another person', category: 'social', icon: 'HandHeart', xpReward: 50 },
  { id: 'c26', title: 'Drink 8 glasses of water', description: 'Stay hydrated throughout the day', category: 'wellness', icon: 'Droplets', xpReward: 50 },
  { id: 'c27', title: 'Listen to a podcast', description: 'Listen to an educational podcast episode', category: 'learning', icon: 'Headphones', xpReward: 50 },
  { id: 'c28', title: 'Early morning start', description: 'Start your first task before 8 AM', category: 'productivity', icon: 'Sunrise', xpReward: 50 },
  { id: 'c29', title: 'Evening review', description: 'Write a detailed end-of-day review', category: 'productivity', icon: 'Moon', xpReward: 50 },
  { id: 'c30', title: 'Try a new recipe', description: 'Cook something you have never made before', category: 'creativity', icon: 'ChefHat', xpReward: 50 },
  { id: 'c31', title: 'Update a goal milestone', description: 'Complete a milestone on one of your goals', category: 'productivity', icon: 'Flag', xpReward: 50 },
  { id: 'c32', title: 'Practice mindfulness', description: 'Spend 10 minutes practicing mindful breathing', category: 'wellness', icon: 'Wind', xpReward: 50 },
  { id: 'c33', title: 'Teach someone something', description: 'Share your knowledge with another person', category: 'social', icon: 'GraduationCap', xpReward: 50 },
  { id: 'c34', title: 'Do 20 pushups', description: 'Complete 20 pushups throughout the day', category: 'wellness', icon: 'Dumbbell', xpReward: 50 },
  { id: 'c35', title: 'Write a note', description: 'Create a detailed note on something you learned', category: 'learning', icon: 'StickyNote', xpReward: 50 },
  { id: 'c36', title: 'Plan a budget', description: 'Create or update your monthly budget', category: 'finance', icon: 'Calculator', xpReward: 50 },
  { id: 'c37', title: 'Create a task list', description: 'Plan out at least 5 tasks for tomorrow', category: 'productivity', icon: 'ListTodo', xpReward: 50 },
  { id: 'c38', title: 'Screen-free hour', description: 'Spend one hour without screens', category: 'wellness', icon: 'MonitorOff', xpReward: 50 },
  { id: 'c39', title: 'Start a new note', description: 'Begin writing on a topic that interests you', category: 'creativity', icon: 'Sparkles', xpReward: 50 },
  { id: 'c40', title: 'Track all expenses', description: 'Record every expense today', category: 'finance', icon: 'Receipt', xpReward: 50 },
  { id: 'c41', title: 'Compliment 3 people', description: 'Give genuine compliments to 3 different people', category: 'social', icon: 'MessageCircleHeart', xpReward: 50 },
  { id: 'c42', title: 'Take a cold shower', description: 'End your shower with 30 seconds of cold water', category: 'wellness', icon: 'Snowflake', xpReward: 50 },
  { id: 'c43', title: 'Finish a book chapter', description: 'Read and complete one full chapter', category: 'learning', icon: 'Book', xpReward: 50 },
  { id: 'c44', title: 'Creative writing', description: 'Write a short story or poem', category: 'creativity', icon: 'Feather', xpReward: 50 },
  { id: 'c45', title: 'Unsubscribe spree', description: 'Unsubscribe from 5 unnecessary emails', category: 'productivity', icon: 'MailMinus', xpReward: 50 },
  { id: 'c46', title: 'Set 3 priorities', description: 'Identify your top 3 priorities for the day', category: 'productivity', icon: 'ListOrdered', xpReward: 50 },
  { id: 'c47', title: 'Practice gratitude', description: 'Write 5 things you are thankful for', category: 'wellness', icon: 'Smile', xpReward: 50 },
  { id: 'c48', title: 'Review subscriptions', description: 'Review and cancel unused subscriptions', category: 'finance', icon: 'CreditCard', xpReward: 50 },
  { id: 'c49', title: 'Focus on one task', description: 'Work on a single task for 2 hours straight', category: 'productivity', icon: 'Crosshair', xpReward: 50 },
  { id: 'c50', title: 'Brain dump', description: 'Write down everything on your mind in 10 minutes', category: 'creativity', icon: 'Zap', xpReward: 50 },
  { id: 'c51', title: 'Bed by 10 PM', description: 'Get to bed before 10 PM tonight', category: 'wellness', icon: 'BedDouble', xpReward: 50 },
  { id: 'c52', title: 'Review finances', description: 'Check your bank balance and recent transactions', category: 'finance', icon: 'DollarSign', xpReward: 50 },
];

export function getDailyChallenge(dateStr?: string): Challenge {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  // Deterministic hash from date string
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    const char = date.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % CHALLENGE_POOL.length;
  return CHALLENGE_POOL[index];
}
