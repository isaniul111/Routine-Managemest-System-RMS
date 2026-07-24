import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Wallet, Bike, BookOpen, GraduationCap, Calendar, Lock, LockOpen, ArrowRight, X, Fuel, TrendingUp, Target, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { ActivityEntry, ExpenseEntry, MonthlyGoals, UserProfile, formatCurrency, fromKey, monthKey, pad, DEFAULT_ROUTINE, toKey, getDateLockStatus, EXPENSE_CATEGORIES, DEFAULT_MONTHLY_GOALS } from '../utils/helpers';

interface MonthlyProps {
  entries: ActivityEntry[];
  expenses?: ExpenseEntry[];
  goals?: MonthlyGoals;
  onSaveGoals?: (g: MonthlyGoals) => void;
  user?: UserProfile | null;
  monthCursor: string; // YYYY-MM
  onChangeMonthCursor: (m: string) => void;
  onSelectDate: (dateKey: string) => void;
}

export const Monthly: React.FC<MonthlyProps> = ({
  entries,
  expenses = [],
  goals = DEFAULT_MONTHLY_GOALS,
  onSaveGoals,
  user,
  monthCursor,
  onChangeMonthCursor,
  onSelectDate,
}) => {
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Form state for goals modal
  const [incomeTarget, setIncomeTarget] = useState(goals.incomeTarget || 25000);
  const [studyHoursTarget, setStudyHoursTarget] = useState(goals.studyHoursTarget || 50);
  const [rideHoursTarget, setRideHoursTarget] = useState(goals.rideHoursTarget || 60);

  const monthEntries = useMemo(() => {
    return entries.filter((e) => monthKey(e.dateKey) === monthCursor);
  }, [entries, monthCursor]);

  const monthExpensesList = useMemo(() => {
    return expenses.filter((e) => monthKey(e.dateKey) === monthCursor);
  }, [expenses, monthCursor]);

  const monthTotals = useMemo(() => {
    const totals = { ride: 0, research: 0, ielts: 0, class: 0, custom: 0, earnings: 0, expenses: 0, netProfit: 0 };
    monthEntries.forEach((e) => {
      totals[e.type] = (totals[e.type] || 0) + e.hours;
      totals.earnings += e.earning || 0;
    });
    monthExpensesList.forEach((exp) => {
      totals.expenses += exp.amount;
    });
    totals.netProfit = totals.earnings - totals.expenses;
    return totals;
  }, [monthEntries, monthExpensesList]);

  const monthDays = useMemo(() => {
    const [y, m] = monthCursor.split('-').map(Number);
    const totalDays = new Date(y, m, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(y, m - 1, i + 1);
      const k = toKey(d);
      const dayOfWeek = d.getDay();
      const planned = (DEFAULT_ROUTINE as any)[dayOfWeek]?.blocks?.length || 0;
      const dayLogged = entries.filter((e) => e.dateKey === k);
      const dayExp = expenses.filter((e) => e.dateKey === k);
      const done = dayLogged.length;
      const earnings = dayLogged.reduce((sum, e) => sum + (e.earning || 0), 0);
      const expenseAmt = dayExp.reduce((sum, e) => sum + e.amount, 0);
      const net = earnings - expenseAmt;
      return { key: k, dayNum: i + 1, planned, done, earnings, expenseAmt, net, dayLogged, dayExp };
    });
  }, [monthCursor, entries, expenses]);

  const selectedDayData = useMemo(() => {
    if (!selectedDayKey) return null;
    return monthDays.find((d) => d.key === selectedDayKey);
  }, [selectedDayKey, monthDays]);

  const monthStudyHours = monthTotals.ielts + monthTotals.research;
  const incomeGoalPct = Math.min(100, Math.round((monthTotals.earnings / (goals.incomeTarget || 1)) * 100));
  const studyGoalPct = Math.min(100, Math.round((monthStudyHours / (goals.studyHoursTarget || 1)) * 100));
  const rideGoalPct = Math.min(100, Math.round((monthTotals.ride / (goals.rideHoursTarget || 1)) * 100));

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Month Navigation & PDF Export - Frosted Glass */}
      <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3 shadow-md dark:shadow-xl">
        <button
          onClick={() => {
            const [y, m] = monthCursor.split('-').map(Number);
            const prev = new Date(y, m - 2, 1);
            onChangeMonthCursor(`${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`);
          }}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm border border-slate-200 dark:border-slate-700/50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {fromKey(`${monthCursor}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{monthEntries.length} Activities Recorded</div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setReportModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer border border-indigo-400/30"
            title="Export Printable PDF Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF Report</span>
          </button>

          <button
            onClick={() => {
              const [y, m] = monthCursor.split('-').map(Number);
              const next = new Date(y, m, 1);
              onChangeMonthCursor(`${next.getFullYear()}-${pad(next.getMonth() + 1)}`);
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm border border-slate-200 dark:border-slate-700/50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 🎯 Monthly Targets & Goal Tracker Card */}
      <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md dark:shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Monthly Goal Tracker
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Target vs Actual Monthly Progress</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIncomeTarget(goals.incomeTarget || 25000);
              setStudyHoursTarget(goals.studyHoursTarget || 50);
              setRideHoursTarget(goals.rideHoursTarget || 60);
              setGoalsModalOpen(true);
            }}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20"
          >
            Set Targets
          </button>
        </div>

        {/* Goal Bars */}
        <div className="space-y-3">
          {/* Income Goal */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" />
                Income Target: {formatCurrency(goals.incomeTarget || 25000)}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(monthTotals.earnings)} ({incomeGoalPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${incomeGoalPct}%` }}
              />
            </div>
          </div>

          {/* IELTS & Research Study Hours Goal */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-cyan-700 dark:text-cyan-400 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                IELTS &amp; Research Target: {goals.studyHoursTarget || 50}h
              </span>
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">
                {monthStudyHours}h ({studyGoalPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${studyGoalPct}%` }}
              />
            </div>
          </div>

          {/* Ride Hours Goal */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Bike className="w-3.5 h-3.5" />
                Ride Hours Target: {goals.rideHoursTarget || 60}h
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-mono">
                {monthTotals.ride}h ({rideGoalPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${rideGoalPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Stat Cards Grid - Net Profit & Expenses */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-md dark:shadow-xl">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Gross Income</span>
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {formatCurrency(monthTotals.earnings)}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-md dark:shadow-xl">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-rose-500" />
            <span>Bike Cost</span>
          </div>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
            -{formatCurrency(monthTotals.expenses)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900/10 to-purple-900/10 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-500/30 backdrop-blur-md rounded-2xl p-3.5 shadow-md dark:shadow-xl col-span-2 sm:col-span-2">
          <div className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Monthly Net Profit (নিট লাভ)</span>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 flex items-center gap-2">
            <span>{formatCurrency(monthTotals.netProfit)}</span>
            {monthTotals.earnings > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {Math.round((monthTotals.netProfit / monthTotals.earnings) * 100)}% Profit Margin
              </span>
            )}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-md dark:shadow-xl">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Rides</span>
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
            {monthTotals.ride}h
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-md dark:shadow-xl">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>IELTS</span>
          </div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            {monthTotals.ielts}h
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-md dark:shadow-xl">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Research</span>
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
            {monthTotals.research}h
          </div>
        </div>
      </div>

      {/* Calendar Month Grid - Frosted Glass */}
      <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md dark:shadow-xl">
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {monthDays.map((d) => {
            const isSelected = selectedDayKey === d.key;
            return (
              <button
                key={d.key}
                onClick={() => setSelectedDayKey(d.key)}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-between p-1.5 text-xs transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/20 shadow-md backdrop-blur-sm'
                    : d.done > 0
                    ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700/80 hover:border-indigo-400 backdrop-blur-sm'
                    : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/40 opacity-60'
                }`}
              >
                <span className={`font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {d.dayNum}
                </span>

                {/* Activity status dots */}
                <div className="flex gap-0.5 items-center my-0.5">
                  {Array.from({ length: Math.min(d.done, 3) }).map((_, idx) => (
                    <span key={idx} className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                  ))}
                </div>

                {d.earnings > 0 ? (
                  <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 font-mono truncate max-w-full">
                    ৳{d.earnings}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">
                    {d.done ? `${d.done} done` : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Modal Popup */}
      {selectedDayData && (() => {
        const lockInfo = getDateLockStatus(selectedDayData.key);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 backdrop-blur-2xl rounded-3xl max-w-md w-full p-5 shadow-2xl relative text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3 pr-6">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      {fromKey(selectedDayData.key).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </h4>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        lockInfo.isLocked
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {lockInfo.isLocked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                      <span>{lockInfo.badgeText}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedDayData.done} activities logged • Income: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedDayData.earnings)}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedDayKey(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lock status banner message */}
              <div
                className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                  lockInfo.isLocked
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {lockInfo.isLocked ? (
                  <>
                    <Lock className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>24-Hour Cycle Locked. Past day entries are read-only to ensure history integrity.</span>
                  </>
                ) : (
                  <>
                    <LockOpen className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Active 24-Hour Cycle Open! You can log, update or edit activities.</span>
                  </>
                )}
              </div>

              {/* Activities list */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Logged Activities List
                  </h5>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Total: {selectedDayData.dayLogged.reduce((sum, e) => sum + e.hours, 0)} hours
                  </span>
                </div>

                {selectedDayData.dayLogged.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">No activity logged on this date.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedDayData.dayLogged.map((e) => (
                      <div
                        key={e.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs backdrop-blur-sm space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{e.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-lg text-[11px]">
                              {e.hours}h
                            </span>
                            {e.earning != null && e.earning > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg text-[11px]">
                                ৳{e.earning}
                              </span>
                            )}
                          </div>
                        </div>
                        {e.comment && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            "{e.comment}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setSelectedDayKey(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onSelectDate(selectedDayData.key);
                    setSelectedDayKey(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md backdrop-blur-sm border border-indigo-400/30 cursor-pointer flex items-center gap-2"
                >
                  <span>Open Date Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 🎯 EDIT GOALS MODAL */}
      {goalsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Set Monthly Targets
                </h3>
              </div>
              <button
                onClick={() => setGoalsModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Income Target (BDT ৳)
                </label>
                <input
                  type="number"
                  value={incomeTarget}
                  onChange={(e) => setIncomeTarget(Number(e.target.value))}
                  placeholder="25000"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly IELTS &amp; Research Study Target (Hours)
                </label>
                <input
                  type="number"
                  value={studyHoursTarget}
                  onChange={(e) => setStudyHoursTarget(Number(e.target.value))}
                  placeholder="50"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Ride Hours Target (Hours)
                </label>
                <input
                  type="number"
                  value={rideHoursTarget}
                  onChange={(e) => setRideHoursTarget(Number(e.target.value))}
                  placeholder="60"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setGoalsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onSaveGoals) {
                    onSaveGoals({
                      incomeTarget,
                      studyHoursTarget,
                      rideHoursTarget,
                    });
                  }
                  setGoalsModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Save Targets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 EXPORT PRINTABLE PDF REPORT MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative my-8 print:shadow-none print:m-0 print:p-0">
            {/* Header / Actions for Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Monthly Activity &amp; Financial PDF Report
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE DOCUMENT BODY */}
            <div className="space-y-6 print-container text-slate-900">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">Ride &amp; Routine Pro</h1>
                  <p className="text-xs text-slate-600 font-bold">Official Monthly Summary &amp; Activity Log Report</p>
                </div>
                <div className="text-right text-xs text-slate-600 font-mono">
                  <div className="font-bold text-slate-900 text-sm">
                    {fromKey(`${monthCursor}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <div>Report Generated: {new Date().toLocaleDateString()}</div>
                  <div>User: {user?.name || 'Ride & Routine User'}</div>
                </div>
              </div>

              {/* Financial Executive Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  1. Financial Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Gross Earnings</div>
                    <div className="text-lg font-black text-emerald-600 font-mono mt-1">
                      {formatCurrency(monthTotals.earnings)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Bike Fuel / Expenses</div>
                    <div className="text-lg font-black text-rose-600 font-mono mt-1">
                      -{formatCurrency(monthTotals.expenses)}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300">
                    <div className="text-[10px] uppercase font-bold text-emerald-800">Net Profit</div>
                    <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                      {formatCurrency(monthTotals.netProfit)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  2. Activity &amp; Time Summary
                </h4>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Ride Time</span>
                    <span className="text-base font-black font-mono text-amber-600">{monthTotals.ride}h</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">IELTS Prep</span>
                    <span className="text-base font-black font-mono text-blue-600">{monthTotals.ielts}h</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Research</span>
                    <span className="text-base font-black font-mono text-teal-600">{monthTotals.research}h</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Classes</span>
                    <span className="text-base font-black font-mono text-purple-600">{monthTotals.class}h</span>
                  </div>
                </div>
              </div>

              {/* Goal Progress Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  3. Goal Achievement Status
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Income Goal ({formatCurrency(goals.incomeTarget || 25000)}):</span>
                    <span className="font-bold font-mono text-emerald-600">
                      {formatCurrency(monthTotals.earnings)} ({incomeGoalPct}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>IELTS &amp; Research Goal ({goals.studyHoursTarget || 50}h):</span>
                    <span className="font-bold font-mono text-cyan-600">
                      {monthStudyHours}h ({studyGoalPct}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span>Ride Hours Goal ({goals.rideHoursTarget || 60}h):</span>
                    <span className="font-bold font-mono text-amber-600">
                      {monthTotals.ride}h ({rideGoalPct}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 flex items-center justify-between">
                <span>Verified by Ride &amp; Routine Pro System</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
