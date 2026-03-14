'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CalendarDays,
  CheckSquare,
  Flame,
  Target,
  BookOpen,
  Wallet,
  Timer,
  StickyNote,
  ArrowRight,
  Sparkles,
  BarChart3,
  Shield,
  Zap,
  ChevronRight,
  Bot,
  LayoutDashboard,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const features = [
  {
    icon: CalendarDays,
    title: 'Calendar',
    desc: 'Plan your days with a beautiful interactive calendar. Schedule events, set reminders, and stay on top of your commitments.',
    color: '#00D2FF',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    desc: 'Organize tasks by priority, track progress with visual indicators, and never miss a deadline with smart sorting.',
    color: '#00E676',
  },
  {
    icon: Flame,
    title: 'Habit Tracking',
    desc: 'Build lasting habits with streak tracking, daily completions, and visual progress rings that keep you accountable.',
    color: '#FF9100',
  },
  {
    icon: Target,
    title: 'Goal Setting',
    desc: 'Define ambitious goals, break them into milestones, and watch your progress bars fill up as you make headway.',
    color: '#FF6B9D',
  },
  {
    icon: BookOpen,
    title: 'Journal',
    desc: 'Reflect daily with mood tracking, gratitude entries, and free-form writing. Spot patterns in your emotional wellbeing.',
    color: '#FFD600',
  },
  {
    icon: Wallet,
    title: 'Finance Tracker',
    desc: 'Monitor income and expenses, visualize your net cash flow, and make smarter financial decisions month over month.',
    color: '#00E676',
  },
  {
    icon: Timer,
    title: 'Focus Timer',
    desc: 'Deep work sessions powered by Pomodoro technique. Track focus minutes, take smart breaks, and boost productivity.',
    color: '#FF5252',
  },
  {
    icon: StickyNote,
    title: 'Notes',
    desc: 'Capture ideas, create checklists, and organize your thoughts in a clean, distraction-free writing environment.',
    color: '#00D2FF',
  },
  {
    icon: Bot,
    title: 'AI Life Coach',
    desc: 'Get personalized guidance, weekly insights, and motivational nudges from an intelligent coaching assistant.',
    color: '#6C5CE7',
  },
];

const highlights = [
  {
    icon: Sparkles,
    title: 'Gamified Progress',
    desc: 'Earn XP, level up, unlock achievements, and maintain streaks to stay motivated every single day.',
  },
  {
    icon: BarChart3,
    title: 'Weekly Reports',
    desc: 'Automated summaries of your productivity, habits, mood trends, and finances delivered every week.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'Your data stays on your device. No cloud sync required, no tracking, no ads. Completely private.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'Built with modern web tech for instant interactions. No loading spinners, no lag, just flow.',
  },
];

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F5]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#2A2A3A]/50 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-bg">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              Life<span className="gradient-text">OS</span>
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-[#8888A0] transition-colors hover:text-[#6C5CE7]"
            >
              Features
            </a>
            <a
              href="#highlights"
              className="text-sm text-[#8888A0] transition-colors hover:text-[#6C5CE7]"
            >
              Why LifeOS
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#8888A0] transition-colors hover:text-[#F0F0F5]"
            >
              Log In
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg gradient-bg px-5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[#6C5CE7]/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#6C5CE7]/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-[#00D2FF]/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#6C5CE7]/20 bg-[#6C5CE7]/10 px-4 py-1.5 text-sm text-[#6C5CE7]"
          >
            <Sparkles className="h-4 w-4" />
            Your Personal Operating System
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
          >
            One App to Run{' '}
            <span className="gradient-text">Your Entire Life</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="mx-auto mb-8 max-w-2xl text-lg text-[#8888A0] sm:text-xl"
          >
            Calendar, tasks, habits, goals, journal, finances, focus timer,
            notes, and AI coaching -- all unified in one beautiful dashboard.
            Stop juggling ten apps. Start living intentionally.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 rounded-xl gradient-bg px-8 py-3.5 text-lg font-semibold text-white transition-all hover:opacity-90 hover:shadow-xl hover:shadow-[#6C5CE7]/25"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 rounded-xl border border-[#2A2A3A] px-8 py-3.5 text-lg font-semibold text-[#8888A0] transition-all hover:border-[#6C5CE7]/50 hover:text-[#F0F0F5]"
            >
              Explore Features
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-16"
          >
            {[
              { value: '9+', label: 'Built-in Modules' },
              { value: '100%', label: 'Private & Local' },
              { value: '0', label: 'Subscriptions Needed' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-[#55556A]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Everything You Need,{' '}
              <span className="gradient-text">Nothing You Don&apos;t</span>
            </h2>
            <p className="mx-auto max-w-2xl text-[#8888A0]">
              Nine powerful modules working together seamlessly. Each one
              designed to replace a standalone app you&apos;re currently paying for.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="group rounded-2xl border border-[#2A2A3A] bg-[#13131A]/80 backdrop-blur-xl p-6 transition-all hover:border-[#6C5CE7]/30 hover:shadow-[0_0_30px_rgba(108,92,231,0.08)]"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon
                    className="h-6 w-6"
                    style={{ color: feature.color }}
                  />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#F0F0F5]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#8888A0]">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section id="highlights" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Why Choose{' '}
              <span className="gradient-text">LifeOS</span>
            </h2>
            <p className="mx-auto max-w-2xl text-[#8888A0]">
              Built for people who want to take control of every dimension of
              their life without the complexity of managing multiple tools.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex gap-4 rounded-2xl border border-[#2A2A3A] bg-[#13131A]/80 backdrop-blur-xl p-6 transition-all hover:border-[#6C5CE7]/30"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6C5CE7]/15">
                  <item.icon className="h-6 w-6 text-[#6C5CE7]" />
                </div>
                <div>
                  <h3 className="mb-1.5 text-lg font-semibold text-[#F0F0F5]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#8888A0]">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="rounded-2xl border border-[#2A2A3A] bg-[#13131A]/60 backdrop-blur-xl p-8 sm:p-12"
          >
            <div className="text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Your Command Center{' '}
                <span className="gradient-text">Awaits</span>
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-[#8888A0]">
                A unified dashboard shows today&apos;s schedule, task progress,
                habit streaks, goals, journal entries, finances, and more --
                all at a glance. No more switching between apps.
              </p>

              {/* Mini preview cards */}
              <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Tasks Done', value: '12', color: '#00E676' },
                  { label: 'Streak', value: '23d', color: '#FFD600' },
                  { label: 'Focus', value: '90m', color: '#6C5CE7' },
                  { label: 'Life Score', value: '78', color: '#00D2FF' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-[#2A2A3A] bg-[#1A1A25]/60 p-4"
                  >
                    <p className="text-xs text-[#8888A0]">{stat.label}</p>
                    <p
                      className="mt-1 text-2xl font-bold"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-xl gradient-bg px-8 py-4 text-lg font-semibold text-white transition-all hover:opacity-90 hover:shadow-xl hover:shadow-[#6C5CE7]/25"
              >
                Launch Dashboard
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2A3A] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md gradient-bg">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">
              Life<span className="gradient-text">OS</span>
            </span>
          </div>
          <p className="text-sm text-[#55556A]">
            2025 LifeOS. Your life, your system, your data.
          </p>
        </div>
      </footer>
    </div>
  );
}
