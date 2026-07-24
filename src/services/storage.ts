/**
 * Storage & Sync Service for Ride & Routine Pro
 */

import { ActivityEntry, DayRoutine, DEFAULT_ROUTINE, DEFAULT_NOTIFICATIONS, NotificationSetting, ExpenseEntry, MonthlyGoals, DEFAULT_MONTHLY_GOALS } from '../utils/helpers';

const ENTRIES_KEY = 'ride_routine_entries';
const EXPENSES_KEY = 'ride_routine_expenses';
const GOALS_KEY = 'ride_routine_goals';
const ROUTINE_KEY = 'ride_routine_schedule';
const NOTIFICATIONS_KEY = 'ride_routine_notifications';
const BACKUP_HISTORY_KEY = 'ride_routine_backups_snapshots';

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  entriesCount: number;
  totalEarnings: number;
}

export function getLocalEntries(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing local entries:', e);
    return [];
  }
}

export function saveLocalEntries(entries: ActivityEntry[]): void {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    // Trigger auto-backup snapshot in storage
    createAutoSnapshot(entries);
  } catch (e) {
    console.error('Error saving local entries:', e);
  }
}

export function getLocalExpenses(): ExpenseEntry[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing local expenses:', e);
    return [];
  }
}

export function saveLocalExpenses(expenses: ExpenseEntry[]): void {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Error saving local expenses:', e);
  }
}

export function getLocalGoals(): MonthlyGoals {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return DEFAULT_MONTHLY_GOALS;
    return { ...DEFAULT_MONTHLY_GOALS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_MONTHLY_GOALS;
  }
}

export function saveLocalGoals(goals: MonthlyGoals): void {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch (e) {
    console.error('Error saving goals:', e);
  }
}

export function getLocalRoutine(): Record<number, DayRoutine> {
  try {
    const raw = localStorage.getItem(ROUTINE_KEY);
    if (!raw) return DEFAULT_ROUTINE;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ROUTINE;
  }
}

export function saveLocalRoutine(routine: Record<number, DayRoutine>): void {
  try {
    localStorage.setItem(ROUTINE_KEY, JSON.stringify(routine));
  } catch (e) {
    console.error('Error saving routine:', e);
  }
}

export function getLocalNotifications(): NotificationSetting[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return DEFAULT_NOTIFICATIONS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

export function saveLocalNotifications(settings: NotificationSetting[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving notifications:', e);
  }
}

// Backup Snapshots Engine
export function getBackupSnapshots(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function createAutoSnapshot(entries: ActivityEntry[]): void {
  try {
    const snapshots = getBackupSnapshots();
    const totalEarnings = entries.reduce((sum, e) => sum + (e.earning || 0), 0);
    const newSnap: BackupSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      entriesCount: entries.length,
      totalEarnings,
    };
    // Keep last 10 snapshots max
    const updated = [newSnap, ...snapshots.slice(0, 9)];
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(updated));
    // Save raw snapshot contents in key
    localStorage.setItem(`ride_snap_${newSnap.id}`, JSON.stringify(entries));
  } catch (e) {
    console.error('Error creating backup snapshot:', e);
  }
}

export function restoreFromSnapshot(snapId: string): ActivityEntry[] | null {
  try {
    const raw = localStorage.getItem(`ride_snap_${snapId}`);
    if (!raw) return null;
    const entries = JSON.parse(raw);
    saveLocalEntries(entries);
    return entries;
  } catch {
    return null;
  }
}

// Server API Sync fallback
export async function syncWithServer(entries: ActivityEntry[]): Promise<{ success: boolean; count: number }> {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries, timestamp: new Date().toISOString() }),
    });
    if (response.ok) {
      const data = await response.json();
      return { success: true, count: data.count || entries.length };
    }
  } catch (err) {
    // Silent failover to offline local storage
  }
  return { success: false, count: entries.length };
}
