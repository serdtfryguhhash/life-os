"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subMonths,
} from "date-fns";
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useLifeOS } from "@/stores";
import type { Transaction, TransactionType } from "@/types";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Bills",
  "Shopping",
  "Health",
  "Education",
  "Housing",
  "Utilities",
  "Other",
] as const;

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Other",
] as const;

const PIE_COLORS = [
  "#6C5CE7",
  "#00D2FF",
  "#00E676",
  "#FFD600",
  "#FF5252",
  "#FF6B81",
  "#A855F7",
  "#38BDF8",
  "#FB923C",
  "#8888A0",
];

// -- Summary Card --
function SummaryCard({
  title,
  amount,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  amount: number;
  icon: typeof TrendingUp;
  color: string;
  trend?: "up" | "down";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[#8888A0]">{title}</p>
        <div
          className="p-2 rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="size-5" style={{ color }} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold" style={{ color }}>
          ${Math.abs(amount).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        {trend && (
          <div className="flex items-center gap-0.5 mb-1">
            {trend === "up" ? (
              <ArrowUpRight className="size-4 text-[#00E676]" />
            ) : (
              <ArrowDownRight className="size-4 text-[#FF5252]" />
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-[#55556A] mt-1">This month</p>
    </motion.div>
  );
}

// Custom Recharts tooltip
function CustomBarTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1A1A25] border border-[#2A2A3A] rounded-lg p-3 shadow-xl">
      <p className="text-sm text-[#F0F0F5] font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.dataKey === "income" ? "Income" : "Expenses"}: $
          {p.value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0];
  return (
    <div className="bg-[#1A1A25] border border-[#2A2A3A] rounded-lg p-3 shadow-xl">
      <p className="text-sm text-[#F0F0F5] font-medium">{data.name}</p>
      <p className="text-xs" style={{ color: data.payload.fill }}>
        ${data.value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}

// -- Transaction Dialog --
function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSave: (data: Omit<Transaction, "id">) => void;
}) {
  const [title, setTitle] = useState(transaction?.title ?? "");
  const [amount, setAmount] = useState(
    transaction?.amount?.toString() ?? ""
  );
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "expense"
  );
  const [category, setCategory] = useState(transaction?.category ?? "Food");
  const [date, setDate] = useState(
    transaction?.date ?? format(new Date(), "yyyy-MM-dd")
  );
  const [recurring, setRecurring] = useState(
    transaction?.recurring ?? false
  );
  const [notes, setNotes] = useState(transaction?.notes ?? "");

  const categories =
    type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSave = () => {
    if (!title.trim() || !amount) return;
    onSave({
      title: title.trim(),
      amount: parseFloat(amount),
      type,
      category,
      date,
      recurring: recurring || undefined,
      notes: notes.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#13131A] border-[#2A2A3A] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#F0F0F5]">
            {transaction ? "Edit Transaction" : "Add Transaction"}
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
              placeholder="Transaction title"
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#8888A0] mb-1.5 block">
                Amount
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
              />
            </div>
            <div>
              <label className="text-sm text-[#8888A0] mb-1.5 block">
                Type
              </label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as TransactionType);
                  setCategory(
                    v === "income" ? "Salary" : "Food"
                  );
                }}
              >
                <SelectTrigger className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A25] border-[#2A2A3A]">
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-[#8888A0] mb-1.5 block">
                Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={recurring}
              onCheckedChange={setRecurring}
            />
            <Label className="text-sm text-[#8888A0]">
              Recurring transaction
            </Label>
          </div>

          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">
              Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note..."
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] min-h-[60px]"
            />
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
            disabled={!title.trim() || !amount}
            className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
          >
            {transaction ? "Save Changes" : "Add Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- Main Page --
export default function FinancePage() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } =
    useLifeOS();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");

  // Current month totals
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const thisMonthTransactions = useMemo(
    () =>
      transactions.filter((t) =>
        isWithinInterval(parseISO(t.date), {
          start: monthStart,
          end: monthEnd,
        })
      ),
    [transactions, monthStart, monthEnd]
  );

  const totalIncome = useMemo(
    () =>
      thisMonthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [thisMonthTransactions]
  );

  const totalExpenses = useMemo(
    () =>
      thisMonthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [thisMonthTransactions]
  );

  const netBalance = totalIncome - totalExpenses;

  // Bar chart data (last 6 months)
  const barData = useMemo(() => {
    const months: { name: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const monthTransactions = transactions.filter((t) =>
        isWithinInterval(parseISO(t.date), { start: mStart, end: mEnd })
      );
      months.push({
        name: format(monthDate, "MMM"),
        income: monthTransactions
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0),
        expense: monthTransactions
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [transactions, now]);

  // Pie chart data (expense categories this month)
  const pieData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    thisMonthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [thisMonthTransactions]);

  // Filtered & sorted transaction list
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (filter !== "all") list = list.filter((t) => t.type === filter);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(s) ||
          t.category.toLowerCase().includes(s)
      );
    }
    return list.sort(
      (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
    );
  }, [transactions, filter, search]);

  const handleSave = (data: Omit<Transaction, "id">) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, data);
    } else {
      addTransaction(data);
    }
    setEditingTransaction(null);
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTransaction(null);
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
              <DollarSign className="size-6 text-[#6C5CE7]" />
            </div>
            <h1 className="text-3xl font-bold text-[#F0F0F5]">Finance</h1>
          </div>

          <Button
            onClick={handleAdd}
            className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
          >
            <Plus className="size-4" />
            Add Transaction
          </Button>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            title="Total Income"
            amount={totalIncome}
            icon={TrendingUp}
            color="#00E676"
            trend="up"
          />
          <SummaryCard
            title="Total Expenses"
            amount={totalExpenses}
            icon={TrendingDown}
            color="#FF5252"
            trend="down"
          />
          <SummaryCard
            title="Net Balance"
            amount={netBalance}
            icon={DollarSign}
            color={netBalance >= 0 ? "#00E676" : "#FF5252"}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.1,
              ease: [0.4, 0, 0.2, 1] as const,
            }}
            className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-5"
          >
            <p className="text-sm font-medium text-[#8888A0] uppercase tracking-wider mb-4">
              Income vs Expenses (6 Months)
            </p>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2A2A3A"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#8888A0", fontSize: 12 }}
                    axisLine={{ stroke: "#2A2A3A" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8888A0", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={<CustomBarTooltip />}
                    cursor={{ fill: "rgba(108,92,231,0.08)" }}
                  />
                  <Bar
                    dataKey="income"
                    fill="#00E676"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="expense"
                    fill="#FF5252"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.2,
              ease: [0.4, 0, 0.2, 1] as const,
            }}
            className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-5"
          >
            <p className="text-sm font-medium text-[#8888A0] uppercase tracking-wider mb-4">
              Expense Breakdown
            </p>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-[#55556A] text-sm">
                No expenses this month
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      formatter={(value: string) => (
                        <span className="text-xs text-[#8888A0]">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>

        {/* Transaction List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.3,
            ease: [0.4, 0, 0.2, 1] as const,
          }}
          className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl p-5"
        >
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="flex bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl p-1">
              {(["all", "income", "expense"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                    filter === f
                      ? "bg-[#6C5CE7] text-white"
                      : "text-[#8888A0] hover:text-[#F0F0F5]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#55556A]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="pl-9 bg-[#0A0A0F] border-[#2A2A3A] text-[#F0F0F5]"
              />
            </div>
          </div>

          {/* List */}
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-[#55556A]">
              No transactions found
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {filteredTransactions.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.2,
                      ease: [0.4, 0, 0.2, 1] as const,
                    }}
                    className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-[#1A1A25]/50 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                          t.type === "income"
                            ? "bg-[#00E676]/10"
                            : "bg-[#FF5252]/10"
                        }`}
                      >
                        {t.type === "income" ? (
                          <ArrowUpRight className="size-4 text-[#00E676]" />
                        ) : (
                          <ArrowDownRight className="size-4 text-[#FF5252]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#F0F0F5] truncate">
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#55556A]">
                            {format(parseISO(t.date), "MMM d, yyyy")}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs text-[#8888A0] py-0"
                          >
                            {t.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          t.type === "income"
                            ? "text-[#00E676]"
                            : "text-[#FF5252]"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}$
                        {t.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#1A1A25] border-[#2A2A3A]"
                        >
                          <DropdownMenuItem onClick={() => handleEdit(t)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => deleteTransaction(t.id)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dialog */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onSave={handleSave}
      />
    </div>
  );
}
