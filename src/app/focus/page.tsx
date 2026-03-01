"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, startOfDay, subDays, isSameDay } from "date-fns";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Timer,
  Coffee,
  Brain,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useLifeOS } from "@/stores";
import type { PomodoroType } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// -- Timer Ring SVG --
function TimerRing({
  progress,
  size = 280,
  strokeWidth = 10,
  mode,
}: {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  mode: PomodoroType;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const gradientId = `timerGradient-${mode}`;
  const colors: Record<PomodoroType, [string, string]> = {
    focus: ["#6C5CE7", "#00D2FF"],
    "short-break": ["#00E676", "#00D2FF"],
    "long-break": ["#FFD600", "#FF6B81"],
  };

  const [c1, c2] = colors[mode];

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1A1A25"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-linear"
      />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// -- Mode Labels --
const MODE_CONFIG: Record<
  PomodoroType,
  { label: string; icon: typeof Timer; color: string }
> = {
  focus: { label: "Focus", icon: Brain, color: "#6C5CE7" },
  "short-break": { label: "Short Break", icon: Coffee, color: "#00E676" },
  "long-break": { label: "Long Break", icon: Coffee, color: "#FFD600" },
};

// -- Slider component (custom since we don't have shadcn slider) --
function CustomSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  unit,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  label: string;
  unit: string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-[#8888A0]">{label}</Label>
        <span className="text-sm font-medium text-[#F0F0F5]">
          {value} {unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #6C5CE7 0%, #00D2FF ${percentage}%, #2A2A3A ${percentage}%, #2A2A3A 100%)`,
          }}
        />
      </div>
    </div>
  );
}

// -- Chart tooltip --
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-[#1A1A25] border border-[#2A2A3A] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-[#8888A0]">{label}</p>
      <p className="text-sm font-medium text-[#F0F0F5]">
        {payload[0].value} min
      </p>
    </div>
  );
}

// -- Notification Banner --
function CompletionBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#13131A] border border-[#6C5CE7]/50 rounded-2xl px-6 py-3 shadow-2xl shadow-[#6C5CE7]/10 flex items-center gap-3"
    >
      <CheckCircle2 className="size-5 text-[#00E676]" />
      <span className="text-sm text-[#F0F0F5]">{message}</span>
      <button
        onClick={onDismiss}
        className="text-[#8888A0] hover:text-[#F0F0F5] text-sm ml-2"
      >
        Dismiss
      </button>
    </motion.div>
  );
}

// -- Main Page --
export default function FocusPage() {
  const { pomodoroSettings, pomodoroSessions, updatePomodoroSettings, addPomodoroSession } =
    useLifeOS();

  const [mode, setMode] = useState<PomodoroType>("focus");
  const [timeLeft, setTimeLeft] = useState(pomodoroSettings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionsBeforeLong, setSessionsBeforeLong] = useState(4);
  const [notification, setNotification] = useState<string | null>(null);

  // Track session start time
  const sessionStartRef = useRef<string | null>(null);

  // Get duration for current mode
  const getDuration = useCallback(
    (m: PomodoroType) => {
      switch (m) {
        case "focus":
          return pomodoroSettings.focusDuration * 60;
        case "short-break":
          return pomodoroSettings.shortBreak * 60;
        case "long-break":
          return pomodoroSettings.longBreak * 60;
      }
    },
    [pomodoroSettings]
  );

  const totalTime = getDuration(mode);
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Switch to next mode
  const switchToNextMode = useCallback(() => {
    if (mode === "focus") {
      // Record completed focus session
      addPomodoroSession({
        startTime: sessionStartRef.current || new Date().toISOString(),
        duration: pomodoroSettings.focusDuration,
        type: "focus",
        completed: true,
      });

      const nextSessionCount = sessionCount + 1;
      setSessionCount(nextSessionCount);

      if (nextSessionCount >= sessionsBeforeLong) {
        setMode("long-break");
        setTimeLeft(pomodoroSettings.longBreak * 60);
        setNotification("Focus session complete! Time for a long break.");
        setSessionCount(0);
      } else {
        setMode("short-break");
        setTimeLeft(pomodoroSettings.shortBreak * 60);
        setNotification("Focus session complete! Take a short break.");
      }
    } else {
      // Record break session
      addPomodoroSession({
        startTime: sessionStartRef.current || new Date().toISOString(),
        duration:
          mode === "short-break"
            ? pomodoroSettings.shortBreak
            : pomodoroSettings.longBreak,
        type: mode,
        completed: true,
      });

      setMode("focus");
      setTimeLeft(pomodoroSettings.focusDuration * 60);
      setNotification("Break over! Time to focus.");
    }
    setIsRunning(false);
    sessionStartRef.current = null;
  }, [
    mode,
    sessionCount,
    sessionsBeforeLong,
    pomodoroSettings,
    addPomodoroSession,
  ]);

  // Timer interval
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          switchToNextMode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, switchToNextMode]);

  // Start/pause
  const handleToggle = () => {
    if (!isRunning && !sessionStartRef.current) {
      sessionStartRef.current = new Date().toISOString();
    }
    setIsRunning(!isRunning);
  };

  // Skip
  const handleSkip = () => {
    setIsRunning(false);
    switchToNextMode();
  };

  // Reset
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
    sessionStartRef.current = null;
  };

  // Today's stats
  const today = startOfDay(new Date());
  const todaysSessions = useMemo(
    () =>
      pomodoroSessions.filter(
        (s) =>
          s.type === "focus" &&
          s.completed &&
          isSameDay(parseISO(s.startTime), today)
      ),
    [pomodoroSessions, today]
  );

  const todaysFocusMinutes = useMemo(
    () => todaysSessions.reduce((sum, s) => sum + s.duration, 0),
    [todaysSessions]
  );

  // Last 7 days chart data
  const chartData = useMemo(() => {
    const data: { name: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayMinutes = pomodoroSessions
        .filter(
          (s) =>
            s.type === "focus" &&
            s.completed &&
            isSameDay(parseISO(s.startTime), day)
        )
        .reduce((sum, s) => sum + s.duration, 0);
      data.push({
        name: format(day, "EEE"),
        minutes: dayMinutes,
      });
    }
    return data;
  }, [pomodoroSessions]);

  // Session dots
  const sessionDots = Array.from({ length: sessionsBeforeLong }).map(
    (_, i) => i < sessionCount
  );

  // Mode icon
  const ModeIcon = MODE_CONFIG[mode].icon;

  // Update timer when settings change while not running
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(getDuration(mode));
    }
  }, [pomodoroSettings, mode, isRunning, getDuration]);

  // Dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timeout = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [notification]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 md:p-8">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <CompletionBanner
            message={notification}
            onDismiss={() => setNotification(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
          className="flex items-center gap-3 mb-10"
        >
          <div className="p-2 rounded-xl bg-[#6C5CE7]/10">
            <Timer className="size-6 text-[#6C5CE7]" />
          </div>
          <h1 className="text-3xl font-bold text-[#F0F0F5]">Focus</h1>
        </motion.div>

        {/* Timer Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
          className="flex flex-col items-center mb-10"
        >
          {/* Mode Label */}
          <div
            className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
            style={{
              backgroundColor: `${MODE_CONFIG[mode].color}15`,
            }}
          >
            <ModeIcon
              className="size-4"
              style={{ color: MODE_CONFIG[mode].color }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: MODE_CONFIG[mode].color }}
            >
              {MODE_CONFIG[mode].label}
            </span>
          </div>

          {/* Timer Ring */}
          <div className="relative mb-6">
            <TimerRing progress={progress} mode={mode} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-[#F0F0F5] tabular-nums tracking-wider">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="border-[#2A2A3A] text-[#8888A0] hover:text-[#F0F0F5] size-10"
            >
              <RotateCcw className="size-4" />
            </Button>

            <button
              onClick={handleToggle}
              className="size-16 rounded-full flex items-center justify-center text-white shadow-lg shadow-[#6C5CE7]/30 hover:shadow-[#6C5CE7]/50 transition-shadow"
              style={{
                background: `linear-gradient(135deg, ${
                  MODE_CONFIG[mode].color
                }, ${
                  mode === "focus"
                    ? "#00D2FF"
                    : mode === "short-break"
                      ? "#00D2FF"
                      : "#FF6B81"
                })`,
              }}
            >
              {isRunning ? (
                <Pause className="size-7" />
              ) : (
                <Play className="size-7 ml-0.5" />
              )}
            </button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSkip}
              className="border-[#2A2A3A] text-[#8888A0] hover:text-[#F0F0F5] size-10"
            >
              <SkipForward className="size-4" />
            </Button>
          </div>

          {/* Session Counter */}
          <div className="flex items-center gap-3 mt-6">
            <span className="text-sm text-[#8888A0]">
              Session {Math.min(sessionCount + 1, sessionsBeforeLong)} of{" "}
              {sessionsBeforeLong}
            </span>
            <div className="flex items-center gap-1.5">
              {sessionDots.map((filled, i) => (
                <div
                  key={i}
                  className={`size-2.5 rounded-full transition-colors ${
                    filled ? "bg-[#6C5CE7]" : "bg-[#2A2A3A]"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom Section: Settings + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.2,
              ease: [0.4, 0, 0.2, 1] as const,
            }}
            className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-6"
          >
            <p className="text-sm font-medium text-[#8888A0] uppercase tracking-wider mb-5">
              Settings
            </p>
            <div className="space-y-5">
              <CustomSlider
                value={pomodoroSettings.focusDuration}
                min={15}
                max={60}
                onChange={(val) =>
                  updatePomodoroSettings({ focusDuration: val })
                }
                label="Focus Duration"
                unit="min"
              />
              <CustomSlider
                value={pomodoroSettings.shortBreak}
                min={3}
                max={10}
                onChange={(val) =>
                  updatePomodoroSettings({ shortBreak: val })
                }
                label="Short Break"
                unit="min"
              />
              <CustomSlider
                value={pomodoroSettings.longBreak}
                min={10}
                max={30}
                onChange={(val) =>
                  updatePomodoroSettings({ longBreak: val })
                }
                label="Long Break"
                unit="min"
              />
              <CustomSlider
                value={sessionsBeforeLong}
                min={2}
                max={8}
                onChange={(val) => setSessionsBeforeLong(val)}
                label="Sessions Before Long Break"
                unit=""
              />
            </div>
          </motion.div>

          {/* Today's Focus Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.3,
              ease: [0.4, 0, 0.2, 1] as const,
            }}
            className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-6"
          >
            <p className="text-sm font-medium text-[#8888A0] uppercase tracking-wider mb-5">
              Today&apos;s Stats
            </p>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-[#1A1A25] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#6C5CE7]">
                  {todaysFocusMinutes}
                </p>
                <p className="text-xs text-[#8888A0] mt-1">Minutes Focused</p>
              </div>
              <div className="bg-[#1A1A25] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#00D2FF]">
                  {todaysSessions.length}
                </p>
                <p className="text-xs text-[#8888A0] mt-1">
                  Sessions Completed
                </p>
              </div>
            </div>

            {/* Weekly Chart */}
            <p className="text-xs text-[#55556A] mb-2">Last 7 Days</p>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#55556A", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="#6C5CE7"
                    strokeWidth={2}
                    dot={{ fill: "#6C5CE7", r: 3 }}
                    activeDot={{ r: 5, fill: "#00D2FF" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
