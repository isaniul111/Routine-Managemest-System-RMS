import React, { useState } from 'react';
import { X, Database, Download, Upload, RefreshCw, Check, Clock, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { ActivityEntry, exportEntriesToCSV, exportBackupJSON, fmtDate } from '../utils/helpers';
import { getBackupSnapshots, restoreFromSnapshot, syncWithServer, BackupSnapshot } from '../services/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: ActivityEntry[];
  onEntriesRestored: (newEntries: ActivityEntry[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  entries,
  onEntriesRestored,
}) => {
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(getBackupSnapshots());
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleServerSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    const res = await syncWithServer(entries);
    setSyncing(false);
    if (res.success) {
      setSyncStatus(`Successfully backed up ${res.count} records to server!`);
    } else {
      setSyncStatus('Server offline — saved to local auto-backup snapshot.');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const importedEntries = Array.isArray(parsed) ? parsed : parsed.entries || [];
        if (Array.isArray(importedEntries)) {
          onEntriesRestored(importedEntries);
          alert(`Restored ${importedEntries.length} entries successfully!`);
          onClose();
        }
      } catch {
        alert('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreSnapshot = (snapId: string) => {
    const restored = restoreFromSnapshot(snapId);
    if (restored) {
      onEntriesRestored(restored);
      alert('Restored data snapshot!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/50 backdrop-blur-xl rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 backdrop-blur-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Automatic Backup &amp; Sync</h3>
            <p className="text-xs text-slate-400">Keep your rides and earnings safe across devices</p>
          </div>
        </div>

        {/* Sync status alert */}
        {syncStatus && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          <button
            onClick={handleServerSync}
            disabled={syncing}
            className="p-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 backdrop-blur-sm"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold">Cloud Sync Now</span>
          </button>

          <button
            onClick={() => exportBackupJSON(entries)}
            className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm"
          >
            <Download className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold">Export Backup JSON</span>
          </button>

          <button
            onClick={() => exportEntriesToCSV(entries)}
            className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold">Export Excel CSV</span>
          </button>

          <label className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm">
            <Upload className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-bold">Restore JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>

        {/* Backup Snapshots list */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Auto-Backup Restore Points ({snapshots.length})
          </h4>
          {snapshots.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3 text-center">No snapshot history yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs backdrop-blur-sm"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{new Date(snap.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {snap.entriesCount} entries • Total ৳{snap.totalEarnings}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestoreSnapshot(snap.id)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold text-[11px] transition-colors cursor-pointer border border-indigo-400/30"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
