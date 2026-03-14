'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Check,
  X,
  AlertCircle,
  Package,
} from 'lucide-react';
import { useLifeOS } from '@/stores';

// ============================================================
// Types
// ============================================================

type ModuleKey =
  | 'events'
  | 'tasks'
  | 'habits'
  | 'goals'
  | 'journalEntries'
  | 'transactions'
  | 'notes'
  | 'pomodoroSessions';

type ExportFormat = 'json' | 'csv';

interface ModuleOption {
  key: ModuleKey;
  label: string;
  checked: boolean;
}

// ============================================================
// CSV flattening helper
// ============================================================

function flattenForCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  // Collect all keys
  const allKeys = new Set<string>();
  data.forEach((item) => {
    Object.keys(item).forEach((k) => allKeys.add(k));
  });
  const keys = Array.from(allKeys);

  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = keys.map(escapeCSV).join(',');
  const rows = data.map((item) =>
    keys.map((k) => escapeCSV(item[k])).join(',')
  );

  return [header, ...rows].join('\n');
}

// ============================================================
// Toast component
// ============================================================

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${
        type === 'success'
          ? 'border-[#00E676]/30 bg-[#00E676]/10 text-[#00E676]'
          : 'border-[#FF5252]/30 bg-[#FF5252]/10 text-[#FF5252]'
      }`}
    >
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ============================================================
// Data Export Modal Component
// ============================================================

export function DataExport() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [format, setFormat] = useState<ExportFormat>('json');
  const [exportAll, setExportAll] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const store = useLifeOS;

  const [modules, setModules] = useState<ModuleOption[]>([
    { key: 'events', label: 'Calendar Events', checked: true },
    { key: 'tasks', label: 'Tasks', checked: true },
    { key: 'habits', label: 'Habits', checked: true },
    { key: 'goals', label: 'Goals', checked: true },
    { key: 'journalEntries', label: 'Journal', checked: true },
    { key: 'transactions', label: 'Finance', checked: true },
    { key: 'notes', label: 'Notes', checked: true },
    { key: 'pomodoroSessions', label: 'Focus Sessions', checked: true },
  ]);

  const toggleModule = (key: ModuleKey) => {
    setModules((prev) =>
      prev.map((m) => (m.key === key ? { ...m, checked: !m.checked } : m))
    );
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ----------------------------------------------------------
  // Export logic
  // ----------------------------------------------------------
  const handleExport = useCallback(() => {
    const state = store.getState();
    const selectedKeys = exportAll
      ? modules.map((m) => m.key)
      : modules.filter((m) => m.checked).map((m) => m.key);

    if (selectedKeys.length === 0) {
      showToast('Select at least one module to export', 'error');
      return;
    }

    // Build data object
    const exportData: Record<string, unknown> = {};
    selectedKeys.forEach((key) => {
      exportData[key] = state[key];
    });

    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      // CSV - combine all modules with a module column
      const allRows: Record<string, unknown>[] = [];
      selectedKeys.forEach((key) => {
        const items = state[key];
        if (Array.isArray(items)) {
          items.forEach((item) => {
            allRows.push({ _module: key, ...item });
          });
        }
      });
      content = flattenForCSV(allRows);
      mimeType = 'text/csv';
      extension = 'csv';
    }

    // Download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-export-${new Date().toISOString().slice(0, 10)}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Data exported as ${extension.toUpperCase()} successfully!`, 'success');
    setOpen(false);
  }, [store, format, exportAll, modules]);

  // ----------------------------------------------------------
  // Import logic
  // ----------------------------------------------------------
  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          const state = store.getState();

          // Validate and import each module
          const validKeys: ModuleKey[] = [
            'events',
            'tasks',
            'habits',
            'goals',
            'journalEntries',
            'transactions',
            'notes',
            'pomodoroSessions',
          ];

          let imported = 0;
          validKeys.forEach((key) => {
            if (data[key] && Array.isArray(data[key])) {
              // Use setState to directly set the data
              store.setState({ [key]: data[key] });
              imported++;
            }
          });

          if (imported > 0) {
            showToast(`Imported ${imported} module(s) successfully!`, 'success');
          } else {
            showToast('No valid data found in file', 'error');
          }
          setOpen(false);
        } catch {
          showToast('Invalid JSON file. Please check the format.', 'error');
        }
      };
      reader.readAsText(file);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [store]
  );

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => {
          setOpen(true);
          setMode('export');
        }}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[#8888A0] hover:bg-[#1A1A25] hover:text-[#F0F0F5]"
      >
        <Package size={20} className="flex-shrink-0" />
        <span className="text-sm font-medium">Data</span>
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-1/2 top-1/2 z-[91] w-full max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <div className="overflow-hidden rounded-2xl border border-[#2A2A3A]/60 bg-[#13131A]/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#2A2A3A]/60 px-5 py-4">
                  <h2 className="text-base font-semibold text-[#F0F0F5]">
                    Data Management
                  </h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1 text-[#8888A0] hover:bg-[#1A1A25] hover:text-[#F0F0F5]"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Mode tabs */}
                <div className="flex gap-1 border-b border-[#2A2A3A]/60 px-5 py-2">
                  <button
                    onClick={() => setMode('export')}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      mode === 'export'
                        ? 'bg-[#6C5CE7]/15 text-[#6C5CE7]'
                        : 'text-[#8888A0] hover:text-[#F0F0F5]'
                    }`}
                  >
                    <Download size={15} />
                    Export
                  </button>
                  <button
                    onClick={() => setMode('import')}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      mode === 'import'
                        ? 'bg-[#6C5CE7]/15 text-[#6C5CE7]'
                        : 'text-[#8888A0] hover:text-[#F0F0F5]'
                    }`}
                  >
                    <Upload size={15} />
                    Import
                  </button>
                </div>

                {/* Content */}
                <div className="p-5">
                  {mode === 'export' ? (
                    <div className="space-y-4">
                      {/* Format selector */}
                      <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#8888A0]">
                          Format
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFormat('json')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                              format === 'json'
                                ? 'border-[#6C5CE7]/50 bg-[#6C5CE7]/10 text-[#6C5CE7]'
                                : 'border-[#2A2A3A] text-[#8888A0] hover:border-[#55556A]'
                            }`}
                          >
                            <FileJson size={16} />
                            JSON
                          </button>
                          <button
                            onClick={() => setFormat('csv')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                              format === 'csv'
                                ? 'border-[#00D2FF]/50 bg-[#00D2FF]/10 text-[#00D2FF]'
                                : 'border-[#2A2A3A] text-[#8888A0] hover:border-[#55556A]'
                            }`}
                          >
                            <FileSpreadsheet size={16} />
                            CSV
                          </button>
                        </div>
                      </div>

                      {/* Scope */}
                      <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#8888A0]">
                          Data
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExportAll(true)}
                            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                              exportAll
                                ? 'border-[#6C5CE7]/50 bg-[#6C5CE7]/10 text-[#6C5CE7]'
                                : 'border-[#2A2A3A] text-[#8888A0] hover:border-[#55556A]'
                            }`}
                          >
                            Export All
                          </button>
                          <button
                            onClick={() => setExportAll(false)}
                            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                              !exportAll
                                ? 'border-[#6C5CE7]/50 bg-[#6C5CE7]/10 text-[#6C5CE7]'
                                : 'border-[#2A2A3A] text-[#8888A0] hover:border-[#55556A]'
                            }`}
                          >
                            Select Modules
                          </button>
                        </div>
                      </div>

                      {/* Module checkboxes */}
                      {!exportAll && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-1"
                        >
                          {modules.map((mod) => (
                            <label
                              key={mod.key}
                              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#1A1A25]"
                            >
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleModule(mod.key);
                                }}
                                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                                  mod.checked
                                    ? 'border-[#6C5CE7] bg-[#6C5CE7]'
                                    : 'border-[#2A2A3A]'
                                }`}
                              >
                                {mod.checked && <Check size={10} className="text-white" />}
                              </div>
                              <span className="text-sm text-[#F0F0F5]">{mod.label}</span>
                            </label>
                          ))}
                        </motion.div>
                      )}

                      {/* Export button */}
                      <button
                        onClick={handleExport}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6C5CE7]/20 transition-shadow hover:shadow-[#6C5CE7]/30"
                      >
                        <Download size={16} />
                        Export Data
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-dashed border-[#2A2A3A] bg-[#1A1A25]/50 p-8 text-center">
                        <Upload size={32} className="mx-auto mb-3 text-[#8888A0]" />
                        <p className="mb-1 text-sm font-medium text-[#F0F0F5]">
                          Import from JSON
                        </p>
                        <p className="mb-4 text-xs text-[#55556A]">
                          Select a previously exported LifeOS JSON file.
                          This will replace existing data for imported modules.
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6C5CE7]/20 transition-shadow hover:shadow-[#6C5CE7]/30"
                        >
                          <Upload size={16} />
                          Choose File
                        </button>
                      </div>
                      <div className="flex items-start gap-2 rounded-xl bg-[#FFD600]/5 border border-[#FFD600]/20 px-3 py-2.5">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-[#FFD600]" />
                        <p className="text-xs text-[#FFD600]/80">
                          Importing data will overwrite existing data for matching modules.
                          Consider exporting a backup first.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
