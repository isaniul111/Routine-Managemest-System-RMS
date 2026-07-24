/**
 * Helper utilities for Ride & Routine app
 */

export interface RoutineBlock {
  id: string;
  type: 'ride' | 'research' | 'ielts' | 'class' | 'custom';
  title: string;
  time: string;
  hours: number;
}

export interface DayRoutine {
  name: string;
  blocks: RoutineBlock[];
}

export interface ActivityEntry {
  id: string;
  userId?: string;
  dateKey: string; // YYYY-MM-DD
  blockId: string;
  type: 'ride' | 'research' | 'ielts' | 'class' | 'custom';
  title: string;
  hours: number;
  doneAt: string; // ISO string
  earning?: number | null;
  comment?: string;
  synced?: boolean;
}

export interface ExpenseEntry {
  id: string;
  userId?: string;
  dateKey: string; // YYYY-MM-DD
  category: 'fuel' | 'servicing' | 'toll' | 'other';
  title: string;
  amount: number; // in BDT
  doneAt: string; // ISO string
  comment?: string;
}

export const EXPENSE_CATEGORIES = {
  fuel: { label: 'Fuel / Octane', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  servicing: { label: 'Bike Servicing', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  toll: { label: 'Toll & Parking', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  other: { label: 'Other Expense', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' },
};

export interface UserProfile {
  id: string;
  uid?: string;
  name: string;
  email: string;
  avatar?: string;
  photoURL?: string;
  provider: 'email' | 'google';
  createdAt: string;
  dailyTarget?: number;
  bikeModel?: string;
  phone?: string;
}

export interface MonthlyGoals {
  monthKey?: string; // YYYY-MM
  incomeTarget: number; // in BDT (e.g. 25000)
  studyHoursTarget: number; // in hours for IELTS & Research (e.g. 50)
  rideHoursTarget: number; // in hours for Ride (e.g. 60)
}

export const DEFAULT_MONTHLY_GOALS: MonthlyGoals = {
  incomeTarget: 25000,
  studyHoursTarget: 50,
  rideHoursTarget: 60,
};

export interface NotificationSetting {
  id: string;
  title: string;
  time: string; // HH:mm
  enabled: boolean;
  type: 'ride' | 'research' | 'ielts' | 'class';
}

export const TYPE_META = {
  ride: { label: 'Ride', color: '#ffb627', bg: 'rgba(255, 182, 39, 0.15)' },
  research: { label: 'Research', color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.15)' },
  ielts: { label: 'IELTS', color: '#5b8def', bg: 'rgba(91, 141, 239, 0.15)' },
  class: { label: 'Class', color: '#b48cff', bg: 'rgba(180, 140, 255, 0.15)' },
  custom: { label: 'Activity', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
};

export const DEFAULT_ROUTINE: Record<number, DayRoutine> = {
  0: {
    name: 'Sunday',
    blocks: [
      { id: 'sun-ride', type: 'ride', title: 'Morning Ride', time: '07:00 AM – 11:00 AM', hours: 4 },
      { id: 'sun-ielts', type: 'ielts', title: 'IELTS Preparation', time: '02:00 PM – 04:00 PM', hours: 2 },
    ],
  },
  1: {
    name: 'Monday',
    blocks: [
      { id: 'mon-ride1', type: 'ride', title: 'Morning Ride', time: '07:00 AM – 11:00 AM', hours: 4 },
      { id: 'mon-research', type: 'research', title: 'Research Work', time: '01:00 PM – 04:00 PM', hours: 3 },
      { id: 'mon-ride2', type: 'ride', title: 'Evening Ride', time: '04:00 PM – 08:00 PM', hours: 4 },
    ],
  },
  2: {
    name: 'Tuesday',
    blocks: [
      { id: 'tue-ride', type: 'ride', title: 'Long Morning Ride', time: '07:00 AM – 01:00 PM', hours: 6 },
      { id: 'tue-ielts', type: 'ielts', title: 'IELTS Speaking & Practice', time: '03:00 PM – 05:30 PM', hours: 2.5 },
    ],
  },
  3: {
    name: 'Wednesday',
    blocks: [
      { id: 'wed-ride1', type: 'ride', title: 'Morning Ride', time: '07:00 AM – 01:00 PM', hours: 6 },
      { id: 'wed-ielts', type: 'ielts', title: 'IELTS Writing Task', time: '01:00 PM – 03:00 PM', hours: 2 },
      { id: 'wed-ride2', type: 'ride', title: 'Evening Ride', time: '04:00 PM – 08:00 PM', hours: 4 },
    ],
  },
  4: {
    name: 'Thursday',
    blocks: [
      { id: 'thu-ride', type: 'ride', title: 'Morning Ride', time: '07:00 AM – 12:00 PM', hours: 5 },
      { id: 'thu-class', type: 'class', title: 'University Class', time: '04:30 PM – 05:50 PM', hours: 1.33 },
      { id: 'thu-research', type: 'research', title: 'Research & Writing', time: '06:00 PM – 10:00 PM', hours: 4 },
    ],
  },
  5: {
    name: 'Friday',
    blocks: [
      { id: 'fri-research', type: 'research', title: 'Research Deep Dive', time: 'Morning (09:00 – 01:00)', hours: 4 },
      { id: 'fri-ielts', type: 'ielts', title: 'IELTS Full Mock Test', time: 'Afternoon (03:00 – 07:00)', hours: 4 },
    ],
  },
  6: {
    name: 'Saturday',
    blocks: [
      { id: 'sat-ride1', type: 'ride', title: 'Morning Ride', time: '07:00 AM – 01:00 PM', hours: 6 },
      { id: 'sat-class', type: 'class', title: 'University Class', time: '04:30 PM – 05:50 PM', hours: 1.33 },
      { id: 'sat-ride2', type: 'ride', title: 'Evening Ride', time: '06:00 PM – 08:00 PM', hours: 2 },
      { id: 'sat-research', type: 'research', title: 'Research Summary', time: '08:00 PM – 10:00 PM', hours: 2 },
    ],
  },
};

export const DEFAULT_NOTIFICATIONS: NotificationSetting[] = [
  { id: 'notif-1', title: 'Morning Ride Start', time: '06:45', enabled: true, type: 'ride' },
  { id: 'notif-2', title: 'IELTS Practice Time', time: '13:45', enabled: true, type: 'ielts' },
  { id: 'notif-3', title: 'Research Block Focus', time: '17:45', enabled: true, type: 'research' },
  { id: 'notif-4', title: 'University Class Reminder', time: '16:00', enabled: true, type: 'class' },
];

export const pad = (n: number) => String(n).padStart(2, '0');

export const toKey = (d: Date): string => {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const fromKey = (k: string): Date => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const monthKey = (k: string): string => k.slice(0, 7);

/**
 * 6:00 AM Daily Cycle Lock Logic
 * - Cycle for date D starts on date D at 06:00:00 AM.
 * - Cycle for date D ends on date D+1 at 06:00:00 AM (24 hours later).
 * - During this 24-hour window, the date is OPEN for logging & updates.
 * - After 6:00 AM of date D+1, date D is PERMANENTLY LOCKED & SAVED.
 */
export function getDailyCycleWindow(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const startTime = new Date(y, m - 1, d, 6, 0, 0, 0);
  const endTime = new Date(y, m - 1, d + 1, 6, 0, 0, 0);
  return { startTime, endTime };
}

export function getDateLockStatus(dateKey: string, now = new Date()) {
  const { startTime, endTime } = getDailyCycleWindow(dateKey);
  const nowMs = now.getTime();

  if (nowMs < startTime.getTime()) {
    return {
      isLocked: true,
      status: 'future' as const,
      message: `Unlocks at 6:00 AM on ${fmtDate(dateKey)}`,
      badgeText: 'Locked (Future)',
    };
  }

  if (nowMs >= endTime.getTime()) {
    return {
      isLocked: true,
      status: 'past_locked' as const,
      message: `Locked & Saved (24h window closed at 6:00 AM)`,
      badgeText: 'Locked & Saved',
    };
  }

  const diffMs = endTime.getTime() - nowMs;
  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    isLocked: false,
    status: 'open' as const,
    message: `Open for logging (Locks tomorrow at 6:00 AM • ${hoursLeft}h ${minsLeft}m left)`,
    badgeText: `Open (${hoursLeft}h ${minsLeft}m left)`,
    remainingMs: diffMs,
  };
}

export function getCurrentTrackingDateKey(now = new Date()): string {
  // If current local time is before 6:00 AM, the active tracking day is yesterday!
  if (now.getHours() < 6) {
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return toKey(yesterday);
  }
  return toKey(now);
}

export const fmtTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export const fmtDate = (k: string): string => {
  return fromKey(k).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString('en-IN')}`;
};

export function exportEntriesToCSV(entries: ActivityEntry[]): void {
  const header = ['Date', 'Day', 'Activity', 'Type', 'Hours', 'Logged At', 'Earning (BDT)', 'Comment'];
  const rows = entries
    .slice()
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1))
    .map((e) => {
      const dayName = DEFAULT_ROUTINE[fromKey(e.dateKey).getDay()]?.name || 'Day';
      return [
        e.dateKey,
        dayName,
        `"${e.title.replace(/"/g, '""')}"`,
        e.type,
        e.hours,
        new Date(e.doneAt).toLocaleString('en-US'),
        e.earning != null ? e.earning : '',
        e.comment ? `"${e.comment.replace(/"/g, '""')}"` : '',
      ];
    });

  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ride-routine-export-${toKey(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportBackupJSON(data: any): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ride-routine-backup-${toKey(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const start = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
  const end = { x: cx + r * Math.cos(toRad(endDeg)), y: cy + r * Math.sin(toRad(endDeg)) };
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
