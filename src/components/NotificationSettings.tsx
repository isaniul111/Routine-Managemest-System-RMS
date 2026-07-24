import React, { useState } from 'react';
import { X, Bell, Volume2, Check, Clock, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { NotificationSetting } from '../utils/helpers';
import {
  requestNotificationPermission,
  checkNotificationPermission,
  triggerDesktopNotification,
  playNotificationChime,
} from '../services/notifications';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationSetting[];
  onSave: (updated: NotificationSetting[]) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  isOpen,
  onClose,
  notifications,
  onSave,
}) => {
  const [list, setList] = useState<NotificationSetting[]>(notifications);
  const [permission, setPermission] = useState<NotificationPermission>(checkNotificationPermission());
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newType, setNewType] = useState<'ride' | 'research' | 'ielts' | 'class'>('ride');
  const [showAdd, setShowAdd] = useState(false);

  if (!isOpen) return null;

  const handleRequestPerm = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const handleToggle = (id: string) => {
    const next = list.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item));
    setList(next);
    onSave(next);
  };

  const handleDelete = (id: string) => {
    const next = list.filter((item) => item.id !== id);
    setList(next);
    onSave(next);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    const item: NotificationSetting = {
      id: `notif_${Date.now()}`,
      title: newTitle,
      time: newTime,
      enabled: true,
      type: newType,
    };
    const next = [...list, item];
    setList(next);
    onSave(next);
    setNewTitle('');
    setShowAdd(false);
  };

  const handleTestNotification = () => {
    playNotificationChime();
    triggerDesktopNotification('Ride & Routine Test', 'Your scheduled reminder notification is working perfectly!');
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

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 backdrop-blur-sm shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Notification Reminders</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Daily alerts for rides, IELTS &amp; research</p>
          </div>
        </div>

        {/* Permission status bar */}
        {permission !== 'granted' && (
          <div className="mb-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-2 text-xs backdrop-blur-sm">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Allow system notifications for timed alerts</span>
            </div>
            <button
              onClick={handleRequestPerm}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shrink-0 cursor-pointer border border-indigo-400/30"
            >
              Enable
            </button>
          </div>
        )}

        {/* Action test buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleTestNotification}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700/60 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-sm"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Test Sound &amp; Alert</span>
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-indigo-400/30 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 space-y-3 backdrop-blur-md">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Reminder Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Evening Ride Start"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Time (24h)</label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
                >
                  <option value="ride">Ride</option>
                  <option value="ielts">IELTS</option>
                  <option value="research">Research</option>
                  <option value="class">Class</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer border border-indigo-400/30"
              >
                Save Reminder
              </button>
            </div>
          </form>
        )}

        {/* Notifications list */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {list.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(item.id)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    item.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      item.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">{item.title}</h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>{item.time}</span>
                    <span className="capitalize text-slate-500">• {item.type}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
