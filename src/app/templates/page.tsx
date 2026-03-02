'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutTemplate,
  Plus,
  Trash2,
  BookOpen,
  CheckSquare,
  Target,
  Copy,
  X,
} from 'lucide-react';
import { useLifeOS } from '@/stores';
import type { Template } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const TYPE_CONFIG = {
  journal: { icon: BookOpen, color: '#FFD600', label: 'Journal' },
  task: { icon: CheckSquare, color: '#6C5CE7', label: 'Task' },
  goal: { icon: Target, color: '#FF6B9D', label: 'Goal' },
} as const;

export default function TemplatesPage() {
  const { templates, addTemplate, deleteTemplate, addJournalEntry, addTask, addGoal } =
    useLifeOS();
  const [formOpen, setFormOpen] = useState(false);
  const [templateType, setTemplateType] = useState<'journal' | 'task' | 'goal'>('journal');
  const [name, setName] = useState('');

  // Journal fields
  const [journalContent, setJournalContent] = useState('');
  const [journalTags, setJournalTags] = useState('');

  // Task fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Goal fields
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState('');

  const resetForm = () => {
    setName('');
    setJournalContent('');
    setJournalTags('');
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('medium');
    setGoalTitle('');
    setGoalDescription('');
    setGoalCategory('');
  };

  const handleSave = () => {
    if (!name.trim()) return;

    let content: Record<string, unknown> = {};

    if (templateType === 'journal') {
      content = { content: journalContent, tags: journalTags.split(',').map((t) => t.trim()).filter(Boolean) };
    } else if (templateType === 'task') {
      content = { title: taskTitle, description: taskDescription, priority: taskPriority };
    } else {
      content = { title: goalTitle, description: goalDescription, category: goalCategory };
    }

    addTemplate({ name: name.trim(), type: templateType, content });
    resetForm();
    setFormOpen(false);
  };

  const handleUseTemplate = (template: Template) => {
    const c = template.content;
    if (template.type === 'journal') {
      addJournalEntry({
        date: new Date().toISOString().slice(0, 10),
        content: (c.content as string) || '',
        mood: 3,
        gratitude: [],
        tags: (c.tags as string[]) || [],
      });
    } else if (template.type === 'task') {
      addTask({
        title: (c.title as string) || 'New Task',
        description: (c.description as string) || '',
        priority: (c.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
        status: 'todo',
        tags: [],
        subtasks: [],
      });
    } else {
      addGoal({
        title: (c.title as string) || 'New Goal',
        description: (c.description as string) || '',
        category: (c.category as string) || 'General',
        timeframe: 'monthly',
        progress: 0,
        milestones: [],
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00E676]/10">
              <LayoutTemplate className="size-6 text-[#00E676]" />
            </div>
            <h1 className="text-3xl font-bold text-[#F0F0F5]">Templates</h1>
          </div>
          <Button
            onClick={() => setFormOpen(true)}
            className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </Button>
        </motion.div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <LayoutTemplate className="h-12 w-12 text-[#2A2A3A] mx-auto mb-3" />
            <p className="text-[#8888A0]">No templates yet</p>
            <p className="text-sm text-[#55556A] mt-1">
              Create templates for journals, tasks, and goals
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {templates.map((template) => {
                const config = TYPE_CONFIG[template.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-2xl bg-[#13131A]/80 border border-[#2A2A3A] p-5 hover:border-[#6C5CE7]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <Icon className="h-4 w-4" style={{ color: config.color }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#F0F0F5]">
                            {template.name}
                          </h3>
                          <p className="text-[10px] text-[#8888A0]">
                            {config.label}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-[#8888A0] hover:text-[#FF5252]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="text-xs text-[#8888A0] mb-4 line-clamp-2">
                      {JSON.stringify(template.content).slice(0, 100)}
                    </div>

                    <Button
                      onClick={() => handleUseTemplate(template)}
                      size="sm"
                      variant="outline"
                      className="w-full border-[#2A2A3A] text-[#8888A0] hover:text-[#F0F0F5]"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Use Template
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#13131A] border-[#2A2A3A] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5]">New Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#8888A0] mb-1.5 block">Template Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My template"
                className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
              />
            </div>

            <div>
              <label className="text-sm text-[#8888A0] mb-1.5 block">Type</label>
              <Select
                value={templateType}
                onValueChange={(v) => setTemplateType(v as 'journal' | 'task' | 'goal')}
              >
                <SelectTrigger className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A25] border-[#2A2A3A]">
                  <SelectItem value="journal">Journal</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="goal">Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {templateType === 'journal' && (
              <>
                <div>
                  <label className="text-sm text-[#8888A0] mb-1.5 block">Content Template</label>
                  <Textarea
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    placeholder="Write your journal template..."
                    className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5] min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#8888A0] mb-1.5 block">Tags (comma separated)</label>
                  <Input
                    value={journalTags}
                    onChange={(e) => setJournalTags(e.target.value)}
                    placeholder="reflection, weekly"
                    className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
                  />
                </div>
              </>
            )}

            {templateType === 'task' && (
              <>
                <div>
                  <label className="text-sm text-[#8888A0] mb-1.5 block">Task Title</label>
                  <Input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Task title"
                    className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#8888A0] mb-1.5 block">Description</label>
                  <Textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Task description"
                    className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#8888A0] mb-1.5 block">Priority</label>
                  <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v as typeof taskPriority)}>
                    <SelectTrigger className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A25] border-[#2A2A3A]">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {templateType === 'goal' && (
              <>
                <div>
                  <label className="text-sm text-[#8888A0] mb-1.5 block">Goal Title</label>
                  <Input
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="Goal title"
                    className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#8888A0] mb-1.5 block">Description</label>
                  <Textarea
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="Goal description"
                    className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#8888A0] mb-1.5 block">Category</label>
                  <Input
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    placeholder="Health, Career, Finance..."
                    className="bg-[#1A1A25] border-[#2A2A3A] text-[#F0F0F5]"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { resetForm(); setFormOpen(false); }}
              className="border-[#2A2A3A] text-[#8888A0]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim()}
              className="bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-white"
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
