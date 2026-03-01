"use client";

import { useState, useMemo } from "react";
import { useLifeOS } from "@/stores";
import type { Task, TaskPriority, TaskStatus, Subtask } from "@/types";
import { format, isPast, isToday, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Pencil,
  Trash2,
  ListTodo,
  ArrowUpDown,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: "#FF5252",
  high: "#FFD600",
  medium: "#6C5CE7",
  low: "#8888A0",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  todo: <Circle className="size-5" />,
  "in-progress": <Clock className="size-5" />,
  done: <CheckCircle2 className="size-5" />,
};

type SortOption = "dueDate" | "priority" | "created";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -20 },
} as const;

// ----------------------------------------------------------------
// Empty form state
// ----------------------------------------------------------------

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  project: string;
  tags: string;
  subtasks: { id: string; title: string; done: boolean }[];
}

const emptyForm: TaskFormData = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  dueDate: "",
  project: "",
  tags: "",
  subtasks: [],
};

// ----------------------------------------------------------------
// Helper: Due date badge
// ----------------------------------------------------------------

function DueDateBadge({ dueDate }: { dueDate?: string }) {
  if (!dueDate) return null;
  const date = parseISO(dueDate);
  const overdue = isPast(date) && !isToday(date);
  const today = isToday(date);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        overdue
          ? "bg-[#FF5252]/15 text-[#FF5252]"
          : today
            ? "bg-[#FFD600]/15 text-[#FFD600]"
            : "bg-[#2A2A3A] text-[#8888A0]"
      }`}
    >
      <Clock className="size-3" />
      {format(date, "MMM d")}
    </span>
  );
}

// ----------------------------------------------------------------
// TaskCard component
// ----------------------------------------------------------------

function TaskCard({
  task,
  onEdit,
  onDelete,
  onCycleStatus,
  onToggleSubtask,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onCycleStatus: (task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const completedSubtasks = task.subtasks.filter((s) => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <motion.div
      layout
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: "spring", stiffness: 400, damping: 30 } as const}
      className="group bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl overflow-hidden hover:border-[#6C5CE7]/40 transition-colors"
    >
      {/* Priority stripe */}
      <div className="flex">
        <div
          className="w-1 shrink-0 rounded-l-2xl"
          style={{ backgroundColor: priorityColor }}
        />
        <div className="flex-1 p-4">
          {/* Top row */}
          <div className="flex items-start gap-3">
            {/* Status toggle */}
            <button
              onClick={() => onCycleStatus(task)}
              className="mt-0.5 shrink-0 transition-colors"
              style={{
                color:
                  task.status === "done"
                    ? "#00E676"
                    : task.status === "in-progress"
                      ? "#FFD600"
                      : "#8888A0",
              }}
            >
              {STATUS_ICONS[task.status]}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`text-sm font-medium ${
                    task.status === "done"
                      ? "line-through text-[#8888A0]"
                      : "text-[#F0F0F5]"
                  }`}
                >
                  {task.title}
                </h3>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${priorityColor}20`,
                    color: priorityColor,
                  }}
                >
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>

              {task.description && (
                <p className="mt-1 text-xs text-[#8888A0] line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Meta row */}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <DueDateBadge dueDate={task.dueDate} />

                {task.project && (
                  <span className="inline-flex items-center rounded-full bg-[#6C5CE7]/15 px-2 py-0.5 text-xs font-medium text-[#6C5CE7]">
                    {task.project}
                  </span>
                )}

                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-[#2A2A3A] px-2 py-0.5 text-[10px] text-[#8888A0]"
                  >
                    {tag}
                  </span>
                ))}

                {totalSubtasks > 0 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#2A2A3A] px-2 py-0.5 text-xs text-[#8888A0] hover:text-[#F0F0F5] transition-colors"
                  >
                    <ListTodo className="size-3" />
                    {completedSubtasks}/{totalSubtasks}
                    {expanded ? (
                      <ChevronUp className="size-3" />
                    ) : (
                      <ChevronDown className="size-3" />
                    )}
                  </button>
                )}
              </div>

              {/* Subtask progress bar */}
              {totalSubtasks > 0 && (
                <div className="mt-2 h-1 w-full rounded-full bg-[#2A2A3A] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#6C5CE7]"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                    }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="shrink-0 rounded-lg p-1.5 text-[#8888A0] opacity-0 group-hover:opacity-100 hover:bg-[#2A2A3A] hover:text-[#F0F0F5] transition-all">
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
              >
                <DropdownMenuItem
                  onClick={() => onEdit(task)}
                  className="gap-2 hover:bg-[#2A2A3A] focus:bg-[#2A2A3A]"
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="gap-2 text-[#FF5252] hover:bg-[#FF5252]/10 focus:bg-[#FF5252]/10 focus:text-[#FF5252]"
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Expanded subtasks */}
          <AnimatePresence>
            {expanded && totalSubtasks > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-1 border-t border-[#2A2A3A] pt-3">
                  {task.subtasks.map((subtask) => (
                    <button
                      key={subtask.id}
                      onClick={() => onToggleSubtask(task.id, subtask.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-[#2A2A3A]/50 transition-colors"
                    >
                      {subtask.done ? (
                        <CheckCircle2 className="size-4 shrink-0 text-[#00E676]" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-[#8888A0]" />
                      )}
                      <span
                        className={
                          subtask.done
                            ? "line-through text-[#8888A0]"
                            : "text-[#F0F0F5]"
                        }
                      >
                        {subtask.title}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------
// TaskDialog (Add / Edit)
// ----------------------------------------------------------------

function TaskDialog({
  open,
  onOpenChange,
  editingTask,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask: Task | null;
  onSave: (data: TaskFormData) => void;
}) {
  const [form, setForm] = useState<TaskFormData>(emptyForm);
  const [newSubtask, setNewSubtask] = useState("");

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && editingTask) {
      setForm({
        title: editingTask.title,
        description: editingTask.description || "",
        priority: editingTask.priority,
        status: editingTask.status,
        dueDate: editingTask.dueDate || "",
        project: editingTask.project || "",
        tags: editingTask.tags.join(", "),
        subtasks: editingTask.subtasks.map((s) => ({ ...s })),
      });
    } else if (open) {
      setForm(emptyForm);
    }
    setNewSubtask("");
    onOpenChange(open);
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setForm((prev) => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        { id: uuidv4(), title: newSubtask.trim(), done: false },
      ],
    }));
    setNewSubtask("");
  };

  const removeSubtask = (id: string) => {
    setForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((s) => s.id !== id),
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#13131A] border-[#2A2A3A] text-[#F0F0F5] sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F0F0F5]">
            {editingTask ? "Edit Task" : "Add Task"}
          </DialogTitle>
          <DialogDescription className="text-[#8888A0]">
            {editingTask
              ? "Update the details of your task."
              : "Create a new task to track your work."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
              Title
            </label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Task title..."
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] placeholder:text-[#8888A0]/50 focus-visible:border-[#6C5CE7] focus-visible:ring-[#6C5CE7]/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Add a description..."
              rows={3}
              className="w-full rounded-md border border-[#2A2A3A] bg-[#1A1A25] px-3 py-2 text-sm text-[#F0F0F5] placeholder:text-[#8888A0]/50 focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7]/20 focus:outline-none resize-none"
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
                Priority
              </label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: v as TaskPriority,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]">
                  {(
                    ["urgent", "high", "medium", "low"] as TaskPriority[]
                  ).map((p) => (
                    <SelectItem
                      key={p}
                      value={p}
                      className="focus:bg-[#2A2A3A]"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2 rounded-full"
                          style={{ backgroundColor: PRIORITY_COLORS[p] }}
                        />
                        {PRIORITY_LABELS[p]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
                Status
              </label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, status: v as TaskStatus }))
                }
              >
                <SelectTrigger className="w-full bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]">
                  {(
                    ["todo", "in-progress", "done"] as TaskStatus[]
                  ).map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="focus:bg-[#2A2A3A]"
                    >
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
              Due Date
            </label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] focus-visible:border-[#6C5CE7] focus-visible:ring-[#6C5CE7]/20 [color-scheme:dark]"
            />
          </div>

          {/* Project */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
              Project
            </label>
            <Input
              value={form.project}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, project: e.target.value }))
              }
              placeholder="e.g. Dashboard v2"
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] placeholder:text-[#8888A0]/50 focus-visible:border-[#6C5CE7] focus-visible:ring-[#6C5CE7]/20"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
              Tags (comma-separated)
            </label>
            <Input
              value={form.tags}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tags: e.target.value }))
              }
              placeholder="e.g. frontend, api, testing"
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] placeholder:text-[#8888A0]/50 focus-visible:border-[#6C5CE7] focus-visible:ring-[#6C5CE7]/20"
            />
          </div>

          {/* Subtasks */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8888A0]">
              Subtasks
            </label>
            <div className="space-y-1.5">
              {form.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 rounded-lg bg-[#1A1A25] px-3 py-2"
                >
                  <span className="flex-1 text-sm text-[#F0F0F5]">
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => removeSubtask(subtask.id)}
                    className="shrink-0 text-[#8888A0] hover:text-[#FF5252] transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                  placeholder="Add subtask..."
                  className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] placeholder:text-[#8888A0]/50 focus-visible:border-[#6C5CE7] focus-visible:ring-[#6C5CE7]/20"
                />
                <button
                  onClick={addSubtask}
                  className="shrink-0 rounded-lg bg-[#2A2A3A] p-2 text-[#8888A0] hover:bg-[#6C5CE7] hover:text-white transition-colors"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-4 py-2 text-sm font-medium text-[#8888A0] hover:bg-[#2A2A3A] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim()}
            className="rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {editingTask ? "Save Changes" : "Add Task"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, toggleSubtask } =
    useLifeOS();

  // Filters & search
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<
    TaskPriority | "all"
  >("all");
  const [sortBy, setSortBy] = useState<SortOption>("dueDate");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Computed stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter(
      (t) => t.status === "in-progress"
    ).length;
    const overdue = tasks.filter(
      (t) =>
        t.dueDate &&
        t.status !== "done" &&
        isPast(parseISO(t.dueDate)) &&
        !isToday(parseISO(t.dueDate))
    ).length;
    return { total, completed, inProgress, overdue };
  }, [tasks]);

  // Filtered & sorted tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.project?.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "dueDate": {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return (
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          );
        }
        case "priority":
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case "created":
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, statusFilter, priorityFilter, sortBy, searchQuery]);

  // Handlers
  const handleCycleStatus = (task: Task) => {
    const cycle: Record<TaskStatus, TaskStatus> = {
      todo: "in-progress",
      "in-progress": "done",
      done: "todo",
    };
    const newStatus = cycle[task.status];
    updateTask(task.id, {
      status: newStatus,
      completedAt: newStatus === "done" ? new Date().toISOString() : undefined,
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleSave = (data: TaskFormData) => {
    const tags = data.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const subtasks: Subtask[] = data.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      done: s.done,
    }));

    if (editingTask) {
      updateTask(editingTask.id, {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate || undefined,
        project: data.project || undefined,
        tags,
        subtasks,
        completedAt:
          data.status === "done" ? new Date().toISOString() : undefined,
      });
    } else {
      addTask({
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate || undefined,
        project: data.project || undefined,
        tags,
        subtasks,
        completedAt:
          data.status === "done" ? new Date().toISOString() : undefined,
      });
    }
  };

  // Filter pill component
  const FilterPill = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-[#6C5CE7] text-white shadow-lg shadow-[#6C5CE7]/20"
          : "bg-[#1A1A25] text-[#8888A0] hover:text-[#F0F0F5] hover:bg-[#2A2A3A]"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F5]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] bg-clip-text text-transparent">
                Tasks
              </h1>
              <p className="mt-1 text-sm text-[#8888A0]">
                Manage your work and stay on track
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#6C5CE7]/20 hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" />
              Add Task
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Total",
                value: stats.total,
                color: "#6C5CE7",
                icon: <ListTodo className="size-4" />,
              },
              {
                label: "Completed",
                value: stats.completed,
                color: "#00E676",
                icon: <CheckCircle2 className="size-4" />,
              },
              {
                label: "In Progress",
                value: stats.inProgress,
                color: "#FFD600",
                icon: <Clock className="size-4" />,
              },
              {
                label: "Overdue",
                value: stats.overdue,
                color: "#FF5252",
                icon: <AlertTriangle className="size-4" />,
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
                className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-lg p-1.5"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <span style={{ color: stat.color }}>{stat.icon}</span>
                  </div>
                  <span className="text-xs text-[#8888A0]">{stat.label}</span>
                </div>
                <p
                  className="mt-2 text-2xl font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Filter / Sort Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] as const }}
          className="mb-6 space-y-3"
        >
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8888A0]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="bg-[#13131A]/80 border-[#2A2A3A] pl-10 text-[#F0F0F5] placeholder:text-[#8888A0]/50 focus-visible:border-[#6C5CE7] focus-visible:ring-[#6C5CE7]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status filter */}
            <div className="flex items-center gap-1.5">
              <span className="mr-1 text-xs text-[#8888A0]">Status:</span>
              <FilterPill
                active={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              >
                All
              </FilterPill>
              <FilterPill
                active={statusFilter === "todo"}
                onClick={() => setStatusFilter("todo")}
              >
                To Do
              </FilterPill>
              <FilterPill
                active={statusFilter === "in-progress"}
                onClick={() => setStatusFilter("in-progress")}
              >
                In Progress
              </FilterPill>
              <FilterPill
                active={statusFilter === "done"}
                onClick={() => setStatusFilter("done")}
              >
                Done
              </FilterPill>
            </div>

            {/* Priority filter */}
            <div className="flex items-center gap-1.5">
              <span className="mr-1 text-xs text-[#8888A0]">Priority:</span>
              <FilterPill
                active={priorityFilter === "all"}
                onClick={() => setPriorityFilter("all")}
              >
                All
              </FilterPill>
              {(["urgent", "high", "medium", "low"] as TaskPriority[]).map(
                (p) => (
                  <FilterPill
                    key={p}
                    active={priorityFilter === p}
                    onClick={() => setPriorityFilter(p)}
                  >
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block size-1.5 rounded-full"
                        style={{ backgroundColor: PRIORITY_COLORS[p] }}
                      />
                      {PRIORITY_LABELS[p]}
                    </span>
                  </FilterPill>
                )
              )}
            </div>

            {/* Sort */}
            <div className="ml-auto flex items-center gap-1.5">
              <ArrowUpDown className="size-3.5 text-[#8888A0]" />
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="h-8 bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]">
                  <SelectItem
                    value="dueDate"
                    className="text-xs focus:bg-[#2A2A3A]"
                  >
                    Due Date
                  </SelectItem>
                  <SelectItem
                    value="priority"
                    className="text-xs focus:bg-[#2A2A3A]"
                  >
                    Priority
                  </SelectItem>
                  <SelectItem
                    value="created"
                    className="text-xs focus:bg-[#2A2A3A]"
                  >
                    Created
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Task List */}
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A2A3A] py-16"
            >
              <ListTodo className="size-12 text-[#2A2A3A]" />
              <p className="mt-4 text-sm text-[#8888A0]">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                  ? "No tasks match your filters"
                  : "No tasks yet. Add one to get started!"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={deleteTask}
                  onCycleStatus={handleCycleStatus}
                  onToggleSubtask={toggleSubtask}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialog */}
        <TaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingTask={editingTask}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
