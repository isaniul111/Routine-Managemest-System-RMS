import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, ListChecks, CalendarDays, Wallet, Route, Bell, X, CloudCheck, Cloud, Bike } from 'lucide-react';
import {
  ActivityEntry,
  ExpenseEntry,
  DayRoutine,
  NotificationSetting,
  RoutineBlock,
  UserProfile,
  MonthlyGoals,
  DEFAULT_MONTHLY_GOALS,
  monthKey,
  toKey,
  getCurrentTrackingDateKey,
} from './utils/helpers';
import {
  getLocalEntries,
  saveLocalEntries,
  getLocalExpenses,
  saveLocalExpenses,
  getLocalGoals,
  saveLocalGoals,
  getLocalRoutine,
  saveLocalRoutine,
  getLocalNotifications,
  saveLocalNotifications,
} from './services/storage';
import { getStoredUser, logoutUser, removeUser, updateUserProfile, GUEST_USER } from './services/auth';
import {
  listenToUserActivities,
  saveCloudActivity,
  deleteCloudActivity,
  listenToUserExpenses,
  saveCloudExpense,
  deleteCloudExpense,
  listenToUserGoals,
  saveCloudGoals,
  testFirestoreConnection,
  subscribeToAuth,
} from './services/firebase';
import { scheduleActiveReminders } from './services/notifications';

import { Splash } from './components/Splash';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Today } from './components/Today';
import { Monthly } from './components/Monthly';
import { History } from './components/History';
import { Routine } from './components/Routine';
import { AuthModal } from './components/AuthModal';
import { NotificationSettings } from './components/NotificationSettings';
import { BackupModal } from './components/BackupModal';
import { ProfileModal } from './components/ProfileModal';
import { ReportModal } from './components/ReportModal';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('rms_theme') as 'dark' | 'light') || 'dark';
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tab, setTab] = useState<'dashboard' | 'today' | 'history' | 'monthly' | 'routine'>('dashboard');
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState('Loading Workspace...');

  const handleTabChange = (nextTab: 'dashboard' | 'today' | 'history' | 'monthly' | 'routine') => {
    if (nextTab === tab && !isTabLoading) return;
    const titles: Record<string, string> = {
      dashboard: 'Loading Dashboard...',
      today: 'Loading Today Tracker...',
      history: 'Loading Activity History...',
      monthly: 'Loading Monthly Ledger...',
      routine: 'Loading Daily Routine...',
    };
    setLoadingTitle(titles[nextTab] || 'Updating View...');
    setIsTabLoading(true);
    setTimeout(() => {
      setTab(nextTab);
      setIsTabLoading(false);
    }, 500);
  };

  // App core state
  const [user, setUser] = useState<UserProfile | null>(getStoredUser() || GUEST_USER);
  const [entries, setEntries] = useState<ActivityEntry[]>(() => getLocalEntries());
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() => getLocalExpenses());
  const [goals, setGoals] = useState<MonthlyGoals>(() => getLocalGoals());
  const [routine, setRoutine] = useState<Record<number, DayRoutine>>(() => getLocalRoutine());
  const [notifications, setNotifications] = useState<NotificationSetting[]>(() => getLocalNotifications());

  // Date cursors - Default initialized to active 6:00 AM cycle tracking key
  const [cursorKey, setCursorKey] = useState<string>(() => getCurrentTrackingDateKey());
  const [monthCursor, setMonthCursor] = useState<string>(() => monthKey(getCurrentTrackingDateKey()));

  // Modals
  const [authOpen, setAuthOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Online / Offline network listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    testFirestoreConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsub = subscribeToAuth((fbUser) => {
      if (fbUser) {
        setUser(fbUser);
      }
    });
    return () => unsub();
  }, []);

  // Real-time Firestore listeners for active logged-in user
  useEffect(() => {
    const uId = user?.uid || user?.id;
    if (!uId || uId === 'guest_user') return;

    const unsub1 = listenToUserActivities(uId, (cloudEntries) => {
      if (cloudEntries && cloudEntries.length > 0) {
        setEntries(cloudEntries);
      }
    });

    const unsub2 = listenToUserExpenses(uId, (cloudExpenses) => {
      if (cloudExpenses && cloudExpenses.length > 0) {
        setExpenses(cloudExpenses);
      }
    });

    const unsub3 = listenToUserGoals(uId, (cloudGoals) => {
      if (cloudGoals) {
        setGoals(cloudGoals);
      }
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [user]);

  // Theme application and local storage persistence
  useEffect(() => {
    localStorage.setItem('rms_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [activeToast, setActiveToast] = useState<{ title: string; time?: string; type?: string } | null>(null);

  // Scheduled notifications listener
  useEffect(() => {
    const unsubscribe = scheduleActiveReminders(notifications, (triggered) => {
      setActiveToast({
        title: triggered.title,
        time: triggered.time,
        type: triggered.type,
      });
      setTimeout(() => setActiveToast(null), 8000);
    });
    return () => unsubscribe();
  }, [notifications]);

  // Handlers
  const handleSaveEntry = (
    block: RoutineBlock,
    dateKey: string,
    earning: number | null,
    comment: string,
    existingId?: string | null
  ) => {
    const uId = user?.uid || user?.id;
    let entryToSave: ActivityEntry;

    if (existingId) {
      const existing = entries.find((e) => e.id === existingId);
      entryToSave = {
        ...(existing || {
          id: existingId,
          userId: uId,
          dateKey,
          blockId: block.id,
          type: block.type,
          title: block.title,
          hours: block.hours,
        }),
        earning,
        comment,
        doneAt: new Date().toISOString(),
      };
    } else {
      entryToSave = {
        id: `${dateKey}-${block.id}-${Date.now()}`,
        userId: uId,
        dateKey,
        blockId: block.id,
        type: block.type,
        title: block.title,
        hours: block.hours,
        doneAt: new Date().toISOString(),
        earning,
        comment,
      };
    }

    const next = existingId
      ? entries.map((e) => (e.id === existingId ? entryToSave : e))
      : [...entries, entryToSave];

    setEntries(next);

    // Save to Cloud Firestore if logged in
    if (uId && uId !== 'guest_user') {
      saveCloudActivity(uId, entryToSave);
    } else {
      saveLocalEntries(next);
    }
  };

  const handleRemoveEntry = (id: string) => {
    const uId = user?.uid || user?.id;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);

    if (uId && uId !== 'guest_user') {
      deleteCloudActivity(uId, id);
    } else {
      saveLocalEntries(next);
    }
  };

  const handleSaveExpense = (
    category: 'fuel' | 'servicing' | 'toll' | 'other',
    title: string,
    amount: number,
    dateKey: string,
    comment?: string
  ) => {
    const uId = user?.uid || user?.id;
    const newExp: ExpenseEntry = {
      id: `exp-${dateKey}-${Date.now()}`,
      userId: uId,
      dateKey,
      category,
      title: title.trim() || (category === 'fuel' ? 'Fuel / Octane' : 'Bike Expense'),
      amount,
      doneAt: new Date().toISOString(),
      comment: comment?.trim(),
    };
    const next = [...expenses, newExp];
    setExpenses(next);

    if (uId && uId !== 'guest_user') {
      saveCloudExpense(uId, newExp);
    } else {
      saveLocalExpenses(next);
    }
  };

  const handleRemoveExpense = (id: string) => {
    const uId = user?.uid || user?.id;
    const next = expenses.filter((e) => e.id !== id);
    setExpenses(next);

    if (uId && uId !== 'guest_user') {
      deleteCloudExpense(uId, id);
    } else {
      saveLocalExpenses(next);
    }
  };

  const handleSaveGoals = (newGoals: MonthlyGoals) => {
    const uId = user?.uid || user?.id;
    setGoals(newGoals);

    if (uId && uId !== 'guest_user') {
      saveCloudGoals(uId, newGoals);
    } else {
      saveLocalGoals(newGoals);
    }
  };

  const handleUpdateRoutine = (updated: Record<number, DayRoutine>) => {
    setRoutine(updated);
    saveLocalRoutine(updated);
  };

  const handleUpdateNotifications = (updated: NotificationSetting[]) => {
    setNotifications(updated);
    saveLocalNotifications(updated);
  };

  const handleLoginSuccess = (u: UserProfile) => {
    setLoadingTitle(`Signing In as ${u.name.split(' ')[0]}...`);
    setIsTabLoading(true);
    setUser(u);
    setAuthOpen(false);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 500);
  };

  const handleLogout = async () => {
    setLoadingTitle('Signing Out...');
    setIsTabLoading(true);
    setAuthOpen(false);
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
    removeUser();
    setUser(GUEST_USER);
    setEntries(getLocalEntries());
    setExpenses(getLocalExpenses());
    setTimeout(() => {
      setIsTabLoading(false);
    }, 500);
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Ambient Gradient Glow */}
      <div className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-tr from-indigo-950/40 via-purple-900/20 to-slate-950'
          : 'bg-gradient-to-tr from-indigo-100/60 via-purple-100/40 to-slate-50'
      }`} />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Splash Screen */}
      {showSplash && <Splash onFinish={() => setShowSplash(false)} />}

      {/* 1-Second Tab & View Loader Overlay */}
      {isTabLoading && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center max-w-xs w-full text-center relative overflow-hidden">
            {/* Top Glowing Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 animate-pulse" />
            
            <div className="relative my-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                <Bike className="w-7 h-7 animate-bounce-short" />
              </div>
              <div className="absolute -inset-2 rounded-3xl bg-indigo-500/20 blur-lg -z-10 animate-pulse" />
            </div>

            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 mt-2">
              {loadingTitle}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
              Synchronizing RMS Pro workspace
            </p>

            {/* 1-Second Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/80">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 h-full rounded-full animate-progress-fill" />
            </div>
          </div>
        </div>
      )}

      {/* Active Notification Toast Alert Banner */}
      {activeToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-bounce-short">
          <div className="bg-indigo-600 dark:bg-indigo-950 text-white p-3.5 rounded-2xl shadow-2xl border border-indigo-400/40 backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs uppercase tracking-wider">{activeToast.title}</span>
                  {activeToast.time && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono font-bold">
                      {activeToast.time}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-indigo-100 mt-0.5">
                  Scheduled {activeToast.type || 'activity'} reminder triggered!
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        isOnline={isOnline}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenNotifications={() => setNotifOpen(true)}
        onOpenBackup={() => setBackupOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenReport={() => setReportOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area - Clean, slide-animation-free display */}
      <main className="relative z-10 max-w-xl mx-auto px-4 py-4 min-h-[calc(100vh-120px)]">
        {tab === 'dashboard' && (
          <Dashboard
            user={user}
            entries={entries}
            expenses={expenses}
            goals={goals}
            cursorKey={cursorKey}
            monthCursor={monthCursor}
            onNavigate={(t) => handleTabChange(t)}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}

        {tab === 'today' && (
          <Today
            cursorKey={cursorKey}
            onChangeCursorKey={setCursorKey}
            routine={routine}
            onUpdateRoutine={handleUpdateRoutine}
            entries={entries}
            expenses={expenses}
            onSaveEntry={handleSaveEntry}
            onRemoveEntry={handleRemoveEntry}
            onSaveExpense={handleSaveExpense}
            onRemoveExpense={handleRemoveExpense}
          />
        )}

        {tab === 'monthly' && (
          <Monthly
            entries={entries}
            expenses={expenses}
            goals={goals}
            onSaveGoals={handleSaveGoals}
            user={user}
            monthCursor={monthCursor}
            onChangeMonthCursor={setMonthCursor}
            onSelectDate={(key) => {
              setCursorKey(key);
              handleTabChange('today');
            }}
          />
        )}

        {tab === 'history' && (
          <History
            entries={entries}
            expenses={expenses}
            onRemoveEntry={handleRemoveEntry}
            onRemoveExpense={handleRemoveExpense}
            onEditEntry={(entry) => {
              setCursorKey(entry.dateKey);
              handleTabChange('today');
            }}
          />
        )}

        {tab === 'routine' && (
          <Routine
            routine={routine}
            onUpdateRoutine={handleUpdateRoutine}
          />
        )}
      </main>

      {/* Navigation Tab Bar - Frosted Glass */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-950/60 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-2.5 shadow-xl dark:shadow-2xl transition-colors">
        <div className="max-w-xl mx-auto flex items-center justify-around px-1">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 sm:px-2.5 rounded-xl transition-all cursor-pointer ${
              tab === 'dashboard'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 shadow-sm scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold">Dashboard</span>
          </button>

          <button
            onClick={() => handleTabChange('today')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 sm:px-2.5 rounded-xl transition-all cursor-pointer ${
              tab === 'today'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 shadow-sm scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ListChecks className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold">Today</span>
          </button>

          <button
            onClick={() => handleTabChange('history')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 sm:px-2.5 rounded-xl transition-all cursor-pointer ${
              tab === 'history'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 shadow-sm scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold">History</span>
          </button>

          <button
            onClick={() => handleTabChange('monthly')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 sm:px-2.5 rounded-xl transition-all cursor-pointer ${
              tab === 'monthly'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 shadow-sm scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold">Monthly</span>
          </button>

          <button
            onClick={() => handleTabChange('routine')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 sm:px-2.5 rounded-xl transition-all cursor-pointer ${
              tab === 'routine'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 shadow-sm scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Route className="w-5 h-5" />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold">Routine</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        currentUser={user}
        onSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      <NotificationSettings
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onSave={handleUpdateNotifications}
      />

      <BackupModal
        isOpen={backupOpen}
        onClose={() => setBackupOpen(false)}
        entries={entries}
        onEntriesRestored={(newEntries) => {
          setEntries(newEntries);
          saveLocalEntries(newEntries);
        }}
      />

      {user && (
        <ProfileModal
          user={user}
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          onSaveProfile={(updated) => {
            setUser(updated);
            updateUserProfile(updated);
          }}
        />
      )}

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        user={user}
        entries={entries}
        expenses={expenses}
      />
    </div>
  );
}
