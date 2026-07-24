import React from 'react';
import { Bike, Sun, Moon, Bell, Database, Wifi, WifiOff, User as UserIcon, LogOut, FileText, Settings } from 'lucide-react';
import { UserProfile } from '../utils/helpers';

interface NavbarProps {
  user: UserProfile | null;
  isOnline: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  onOpenBackup: () => void;
  onOpenProfile: () => void;
  onOpenReport: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isOnline,
  theme,
  onToggleTheme,
  onOpenAuth,
  onOpenNotifications,
  onOpenBackup,
  onOpenProfile,
  onOpenReport,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 transition-colors shadow-sm dark:shadow-lg">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        {/* Branding & Logo */}
        <div className="flex items-center gap-2.5">
          {/* Stylized RMS Monogram Logo Emblem */}
          <div className="relative group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                <div className="flex items-center justify-center gap-0.5 font-black text-white text-[11px] tracking-tighter z-10 select-none">
                  <span className="text-indigo-400">R</span>
                  <span className="text-amber-400">M</span>
                  <span className="text-purple-400">S</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm border border-white dark:border-slate-900">
              <Bike className="w-2.5 h-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-wider uppercase bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-slate-100 bg-clip-text text-transparent">
                RMS
              </h1>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Pro
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[10px]">Cloud Sync</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    <span className="text-amber-600 dark:text-amber-400 font-medium text-[10px]">Offline Mode</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Reports Export PDF */}
          <button
            onClick={onOpenReport}
            className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shrink-0"
            title="Download PDF Reports"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all relative cursor-pointer backdrop-blur-md shrink-0"
            title="Notification Reminders"
          >
            <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full border border-white dark:border-slate-900" />
          </button>

          {/* Backup Button */}
          <button
            onClick={onOpenBackup}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shrink-0"
            title="Backup & Data Sync"
          >
            <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shrink-0"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* User Account / Auth Chip */}
          {user && user.id !== 'guest_user' && user.uid !== 'guest_user' ? (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 backdrop-blur-md rounded-lg pl-1.5 pr-1 py-1 shrink-0">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 hover:opacity-80 cursor-pointer transition-opacity"
                title="Edit Profile Settings"
              >
                <img
                  src={user.avatar || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'user')}`}
                  alt={user.name}
                  className="w-6 h-6 rounded-full border border-indigo-500/50 object-cover"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[70px] truncate hidden sm:inline">
                  {user.name.split(' ')[0]}
                </span>
                <Settings className="w-3 h-3 text-slate-400 hover:text-indigo-400" />
              </button>

              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors ml-0.5"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md backdrop-blur-md border border-indigo-400/30 cursor-pointer shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
