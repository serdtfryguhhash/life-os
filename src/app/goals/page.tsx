"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, parseISO } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  Target,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Calendar,
} from "lucide-react";
import { useLifeOS } from "@/stores";
import type { Goal, GoalTimeframe, Milestone } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORIES = [
  "Health",
  "Career",
  "Finance",
  "Personal",
  "Education",
  "Relationships",
] as const;

const TIMEFRAMES: { value: GoalTimeframe; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Health: "#00E676",
  Career: "#6C5CE7",
  Finance: "#FFD600",
  Personal: "#00D2FF",
  Education: "#FF5252",
  Relationships: "#FF6B81",
};

// -- Circular Progress Ring --
function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2A3A"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#6C5CE7" />
            <stop offset="100%" stopColor="#00D2FF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-[#F0F0F5]">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

// -- Goal Card --
function GoalCard({
  goal,
  onEdit,
  onDelete,
  onToggleMilestone,
}: {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
}) {
  const daysLeft = goal.deadline
    ? differenceInDays(parseISO(goal.deadline), new Date())
    : null;

  const completedMilestones = goal.milestones.filter((m) => m.done).length;
  const totalMilestones = goal.milestones.length;
  const computedProgress =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : goal.progress;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-6 hover:border-[#6C5CE7]/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-[#F0F0F5] truncate">
              {goal.title}
            </h3>
          </div>
          {goal.description && (
            <p className="text-sm text-[#8888A0] line-clamp-2">
              {goal.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className="text-xs"
              style={{
                backgroundColor: `${CATEGORY_COLORS[goal.category] || "#6C5CE7"}20`,
                color: CATEGORY_COLORS[goal.category] || "#6C5CE7",
                borderColor: `${CATEGORY_COLORS[goal.category] || "#6C5CE7"}40`,
              }}
            >
              {goal.category}
            </Badge>
            <Badge variant="outline" className="text-xs text-[#8888A0]">
              {goal.timeframe}
            </Badge>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" className="shrink-0">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[#1A1A25] border-[#2A2A3A]"
          >
            <DropdownMenuItem onClick={() => onEdit(goal)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(goal.id)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress Ring */}
      <div className="flex justify-center my-4">
        <ProgressRing progress={computedProgress} />
      </div>

      {/* Deadline */}
      {daysLeft !== null && (
        <div className="flex items-center justify-center gap-1.5 text-sm mb-4">
          <Calendar className="size-3.5 text-[#8888A0]" />
          <span
            className={
              daysLeft < 0
                ? "text-[#FF5252]"
                : daysLeft <= 7
                  ? "text-[#FFD600]"
                  : "text-[#8888A0]"
            }
          >
            {daysLeft < 0
              ? `${Math.abs(daysLeft)} days overdue`
              : daysLeft === 0
                ? "Due today"
                : `${daysLeft} days left`}
          </span>
        </div>
      )}

      {/* Milestones */}
      {goal.milestones.length > 0 && (
        <div className="space-y-2 border-t border-[#2A2A3A] pt-4">
          <p className="text-xs font-medium text-[#8888A0] uppercase tracking-wider">
            Milestones ({completedMilestones}/{totalMilestones})
          </p>
          {goal.milestones.map((milestone) => (
            <button
              key={milestone.id}
              onClick={() => onToggleMilestone(goal.id, milestone.id)}
              className="flex items-center gap-2 w-full text-left group"
            >
              <div
                className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  milestone.done
                    ? "bg-[#6C5CE7] border-[#6C5CE7]"
                    : "border-[#2A2A3A] group-hover:border-[#6C5CE7]/50"
                }`}
              >
                {milestone.done && (
                  <svg
                    viewBox="0 0 12 12"
                    className="size-2.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </div>
              <span
                className={`text-sm transition-colors ${
                  milestone.done
                    ? "line-through text-[#8888A0]"
                    : "text-[#F0F0F5] group-hover:text-[#6C5CE7]"
                }`}
              >
                {milestone.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// -- Add/Edit Goal Dialog --
function GoalDialog({
  open,
  onOpenChange,
  goal,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  onSave: (data: Omit<Goal, "id" | "createdAt">) => void;
}) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [category, setCategory] = useState(goal?.category ?? "Personal");
  const [timeframe, setTimeframe] = useState<GoalTimeframe>(
    goal?.timeframe ?? "monthly"
  );
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [milestones, setMilestones] = useState<Milestone[]>(
    goal?.milestones ?? []
  );
  const [newMilestone, setNewMilestone] = useState("");

  const handleAddMilestone = () => {
    if (!newMilestone.trim()) return;
    setMilestones([
      ...milestones,
      { id: uuidv4(), title: newMilestone.trim(), done: false },
    ]);
    setNewMilestone("");
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const completedCount = milestones.filter((m) => m.done).length;
    const progress =
      milestones.length > 0
        ? Math.round((completedCount / milestones.length) * 100)
        : 0;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      timeframe,
      deadline: deadline || undefined,
      milestones,
      progress,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#13131A] border-[#2A2A3A] sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F0F0F5]">
            {goal ? "Edit Goal" : "Add Goal"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
            />
          </div>

          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your goal..."
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#8888A0] mb-1.5 block">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A25] border-[#2A2A3A]">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-[#8888A0] mb-1.5 block">
                Timeframe
              </label>
              <Select
                value={timeframe}
                onValueChange={(v) => setTimeframe(v as GoalTimeframe)}
              >
                <SelectTrigger className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A25] border-[#2A2A3A]">
                  {TIMEFRAMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">
              Deadline
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
            />
          </div>

          {/* Milestones */}
          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">
              Milestones
            </label>
            <div className="space-y-2">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 bg-[#1A1A25] rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-[#F0F0F5] flex-1">
                    {m.title}
                  </span>
                  <button
                    onClick={() => handleRemoveMilestone(m.id)}
                    className="text-[#8888A0] hover:text-[#FF5252] transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  placeholder="Add a milestone..."
                  className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMilestone();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddMilestone}
                  className="border-[#2A2A3A] text-[#8888A0] shrink-0"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2A2A3A] text-[#8888A0]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
          >
            {goal ? "Save Changes" : "Create Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- Main Page --
export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, toggleMilestone } =
    useLifeOS();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filterTimeframe, setFilterTimeframe] = useState<string>("all");

  const filteredGoals = useMemo(() => {
    if (filterTimeframe === "all") return goals;
    return goals.filter((g) => g.timeframe === filterTimeframe);
  }, [goals, filterTimeframe]);

  const handleSave = (data: Omit<Goal, "id" | "createdAt">) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, data);
    } else {
      addGoal(data);
    }
    setEditingGoal(null);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingGoal(null);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#6C5CE7]/10">
              <Target className="size-6 text-[#6C5CE7]" />
            </div>
            <h1 className="text-3xl font-bold text-[#F0F0F5]">Goals</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeframe Filter */}
            <div className="flex bg-[#13131A] border border-[#2A2A3A] rounded-xl p-1">
              <button
                onClick={() => setFilterTimeframe("all")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterTimeframe === "all"
                    ? "bg-[#6C5CE7] text-white"
                    : "text-[#8888A0] hover:text-[#F0F0F5]"
                }`}
              >
                All
              </button>
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFilterTimeframe(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterTimeframe === t.value
                      ? "bg-[#6C5CE7] text-white"
                      : "text-[#8888A0] hover:text-[#F0F0F5]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <Button
              onClick={handleAdd}
              className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
            >
              <Plus className="size-4" />
              Add Goal
            </Button>
          </div>
        </motion.div>

        {/* Goals Grid */}
        {filteredGoals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Target className="size-16 text-[#2A2A3A] mb-4" />
            <p className="text-[#8888A0] text-lg">No goals yet</p>
            <p className="text-[#55556A] text-sm mt-1">
              Create your first goal to start tracking progress
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={deleteGoal}
                  onToggleMilestone={toggleMilestone}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Dialog */}
      <GoalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
        goal={editingGoal}
        onSave={handleSave}
      />
    </div>
  );
}
