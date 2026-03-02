'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader2, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';
import { useLifeOS } from '@/stores';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function CoachPage() {
  const {
    coachMessages,
    addCoachMessage,
    clearCoachMessages,
    tasks,
    habits,
    goals,
    journalEntries,
    transactions,
    xp,
    streakData,
  } = useLifeOS();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [coachMessages]);

  const buildContext = useCallback(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'done').length;
    const dailyHabits = habits.filter((h) => h.frequency === 'daily');
    const habitsCompletedToday = dailyHabits.filter(
      (h) => (h.completions[todayStr] || 0) >= h.target
    ).length;
    const recentMood = journalEntries.length > 0
      ? journalEntries[journalEntries.length - 1].mood
      : 'unknown';
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    return `
Tasks: ${completedTasks} completed, ${pendingTasks} pending
Habits: ${habitsCompletedToday}/${dailyHabits.length} daily habits done today
Goals: ${goals.length} active goals (avg progress: ${goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0}%)
Journal: ${journalEntries.length} entries, latest mood: ${recentMood}/5
Finance: $${income} income, $${expenses.toFixed(2)} expenses (net: $${(income - expenses).toFixed(2)})
Streak: ${streakData.currentStreak} day(s), XP: ${xp}
Recent journal excerpt: "${journalEntries[journalEntries.length - 1]?.content.slice(0, 200) || 'none'}"
    `.trim();
  }, [tasks, habits, goals, journalEntries, transactions, xp, streakData]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    addCoachMessage({ role: 'user', content: userMessage });
    setLoading(true);

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: buildContext(),
        }),
      });

      const data = await res.json();
      addCoachMessage({
        role: 'assistant',
        content: data.reply || 'Sorry, I was unable to respond.',
      });
    } catch {
      addCoachMessage({
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#6C5CE7]/10">
              <Bot className="size-6 text-[#6C5CE7]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#F0F0F5]">AI Life Coach</h1>
              <p className="text-sm text-[#8888A0]">
                Personalized advice based on your LifeOS data
              </p>
            </div>
          </div>
          {coachMessages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCoachMessages}
              className="text-[#8888A0] hover:text-[#FF5252]"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </motion.div>

        {/* Messages */}
        <div className="space-y-4 mb-6 min-h-[300px]">
          {coachMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Bot className="h-12 w-12 text-[#2A2A3A] mx-auto mb-3" />
              <p className="text-[#8888A0] mb-1">
                Your AI Life Coach is ready
              </p>
              <p className="text-sm text-[#55556A]">
                Ask about your productivity, habits, goals, or get personalized advice
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  'How am I doing this week?',
                  'What should I focus on today?',
                  'How can I improve my habits?',
                  'Give me a productivity tip',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border border-[#2A2A3A] text-[#8888A0] hover:border-[#6C5CE7] hover:text-[#6C5CE7] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {coachMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6C5CE7]/15">
                    <Bot className="h-4 w-4 text-[#6C5CE7]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-[#6C5CE7] text-white'
                      : 'bg-[#13131A] border border-[#2A2A3A] text-[#F0F0F5]'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                  <p className="text-[10px] mt-1 opacity-50">
                    {format(new Date(msg.timestamp), 'h:mm a')}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00D2FF]/15">
                    <User className="h-4 w-4 text-[#00D2FF]" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6C5CE7]/15">
                <Bot className="h-4 w-4 text-[#6C5CE7]" />
              </div>
              <div className="rounded-2xl bg-[#13131A] border border-[#2A2A3A] px-4 py-3">
                <Loader2 className="h-4 w-4 text-[#6C5CE7] animate-spin" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sticky bottom-4"
        >
          <div className="flex gap-2 rounded-2xl bg-[#13131A] border border-[#2A2A3A] p-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI coach anything..."
              className="bg-transparent border-none text-[#F0F0F5] resize-none min-h-[44px] max-h-[120px] focus-visible:ring-0"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              size="icon"
              className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white shrink-0 h-10 w-10 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
