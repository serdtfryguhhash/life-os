"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  Plus,
  StickyNote,
  Search,
  Pin,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { useLifeOS } from "@/stores";
import type { Note } from "@/types";
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

const NOTE_CATEGORIES = [
  "All",
  "Personal",
  "Work",
  "Ideas",
  "Learning",
  "Other",
] as const;

const NOTE_COLORS = [
  "#6C5CE7",
  "#00D2FF",
  "#00E676",
  "#FFD600",
  "#FF5252",
  "#FF6B81",
];

// -- Note Card --
function NoteCard({
  note,
  onClick,
  onPin,
  onEdit,
  onDelete,
}: {
  note: Note;
  onClick: () => void;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      className="bg-[#13131A]/80 backdrop-blur-xl border border-[#2A2A3A] rounded-2xl overflow-hidden hover:border-[#6C5CE7]/30 transition-colors group cursor-pointer"
      onClick={onClick}
    >
      {/* Color top border */}
      <div className="h-1" style={{ backgroundColor: note.color }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-[#F0F0F5] line-clamp-1 flex-1">
            {note.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            {note.pinned && (
              <Pin className="size-3.5 text-[#FFD600] fill-[#FFD600]" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#1A1A25] border-[#2A2A3A]"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin();
                  }}
                >
                  <Pin className="size-4" />
                  {note.pinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content preview */}
        <p className="text-xs text-[#8888A0] line-clamp-3 mb-3 whitespace-pre-wrap">
          {note.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="text-xs text-[#8888A0] py-0"
          >
            {note.category}
          </Badge>
          <span className="text-xs text-[#55556A]">
            {format(parseISO(note.updatedAt), "MMM d")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// -- View Note Dialog --
function ViewNoteDialog({
  open,
  onOpenChange,
  note,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onEdit: () => void;
}) {
  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#13131A] border-[#2A2A3A] sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <div
          className="h-1 -mx-6 -mt-6 mb-4 rounded-t-lg"
          style={{ backgroundColor: note.color }}
        />
        <DialogHeader>
          <div className="flex items-center gap-2">
            {note.pinned && (
              <Pin className="size-4 text-[#FFD600] fill-[#FFD600] shrink-0" />
            )}
            <DialogTitle className="text-[#F0F0F5]">
              {note.title}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs text-[#8888A0]">
              {note.category}
            </Badge>
            <span className="text-xs text-[#55556A]">
              Updated {format(parseISO(note.updatedAt), "MMM d, yyyy")}
            </span>
          </div>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-[#F0F0F5] whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2A2A3A] text-[#8888A0]"
          >
            Close
          </Button>
          <Button
            onClick={onEdit}
            className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
          >
            Edit Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- Add/Edit Note Dialog --
function NoteFormDialog({
  open,
  onOpenChange,
  note,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onSave: (data: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [category, setCategory] = useState(note?.category ?? "Personal");
  const [color, setColor] = useState(note?.color ?? NOTE_COLORS[0]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      color,
      pinned: note?.pinned ?? false,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#13131A] border-[#2A2A3A] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#F0F0F5]">
            {note ? "Edit Note" : "New Note"}
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
              placeholder="Note title"
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
            />
          </div>

          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note..."
              className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] min-h-[160px]"
            />
          </div>

          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A25] border-[#2A2A3A]">
                {NOTE_CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-[#8888A0] mb-1.5 block">
              Color
            </label>
            <div className="flex items-center gap-3">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`size-8 rounded-full transition-all ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-[#13131A] scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: c,
                    ["--tw-ring-color" as string]: color === c ? c : undefined,
                  }}
                />
              ))}
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
            {note ? "Save Changes" : "Create Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- Main Page --
export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote } = useLifeOS();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  const filteredNotes = useMemo(() => {
    let list = [...notes];
    if (categoryFilter !== "All") {
      list = list.filter((n) => n.category === categoryFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(s) ||
          n.content.toLowerCase().includes(s)
      );
    }
    // Pinned first, then by updatedAt
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (
        parseISO(b.updatedAt).getTime() - parseISO(a.updatedAt).getTime()
      );
    });
  }, [notes, categoryFilter, search]);

  const handleSave = (data: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    if (editingNote) {
      updateNote(editingNote.id, data);
    } else {
      addNote(data);
    }
    setEditingNote(null);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setViewOpen(false);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingNote(null);
    setFormOpen(true);
  };

  const handleTogglePin = (note: Note) => {
    updateNote(note.id, { pinned: !note.pinned });
  };

  const handleViewNote = (note: Note) => {
    setViewingNote(note);
    setViewOpen(true);
  };

  const handleEditFromView = () => {
    if (viewingNote) {
      handleEdit(viewingNote);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#6C5CE7]/10">
              <StickyNote className="size-6 text-[#6C5CE7]" />
            </div>
            <h1 className="text-3xl font-bold text-[#F0F0F5]">Notes</h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#55556A]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="pl-9 bg-[#13131A] border-[#2A2A3A] text-[#F0F0F5]"
              />
            </div>
            <Button
              onClick={handleAdd}
              className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white shrink-0"
            >
              <Plus className="size-4" />
              New Note
            </Button>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.1,
            ease: [0.4, 0, 0.2, 1] as const,
          }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {NOTE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors border ${
                categoryFilter === cat
                  ? "bg-[#6C5CE7] text-white border-[#6C5CE7]"
                  : "bg-transparent text-[#8888A0] border-[#2A2A3A] hover:text-[#F0F0F5] hover:border-[#6C5CE7]/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <StickyNote className="size-16 text-[#2A2A3A] mb-4" />
            <p className="text-[#8888A0] text-lg">No notes found</p>
            <p className="text-[#55556A] text-sm mt-1">
              Create your first note to get started
            </p>
          </motion.div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note) => (
                <div key={note.id} className="break-inside-avoid">
                  <NoteCard
                    note={note}
                    onClick={() => handleViewNote(note)}
                    onPin={() => handleTogglePin(note)}
                    onEdit={() => handleEdit(note)}
                    onDelete={() => deleteNote(note.id)}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* View Dialog */}
      <ViewNoteDialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) setViewingNote(null);
        }}
        note={viewingNote}
        onEdit={handleEditFromView}
      />

      {/* Form Dialog */}
      <NoteFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingNote(null);
        }}
        note={editingNote}
        onSave={handleSave}
      />
    </div>
  );
}
