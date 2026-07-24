import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Wallet,
  Pencil,
  Trash2,
  Bike,
  BookOpen,
  GraduationCap,
  School,
  Activity,
  Lock,
  LockOpen,
  Clock,
  Calendar,
  Fuel,
  Wrench,
  Receipt,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  X,
  Tag,
  Sparkles,
} from 'lucide-react';
import {
  ActivityEntry,
  ExpenseEntry,
  DayRoutine,
  RoutineBlock,
  TYPE_META,
  EXPENSE_CATEGORIES,
  describeArc,
  fmtDate,
  fmtTime,
  fromKey,
  toKey,
  formatCurrency,
  getDateLockStatus,
  getCurrentTrackingDateKey,
} from '../utils/helpers';

interface TodayProps {
  cursorKey: string;
  onChangeCursorKey: (key: string) => void;
  routine: Record<number, DayRoutine>;
  onUpdateRoutine?: (updated: Record<number, DayRoutine>) => void;
  entries: ActivityEntry[];
  expenses: ExpenseEntry[];
  onSaveEntry: (
    block: RoutineBlock,
    dateKey: string,
    earning: number | null,
    comment: string,
    existingId?: string | null
  ) => void;
  onRemoveEntry: (id: string) => void;
  onSaveExpense: (
    category: 'fuel' | 'servicing' | 'toll' | 'other',
    title: string,
    amount: number,
    dateKey: string,
    comment?: string
  ) => void;
  onRemoveExpense: (id: string) => void;
}

export const Today: React.FC<TodayProps> = ({
  cursorKey,
  onChangeCursorKey,
  routine,
  onUpdateRoutine,
  entries,
  expenses,
  onSaveEntry,
  onRemoveEntry,
  onSaveExpense,
  onRemoveExpense,
}) => {
  const [activeFormBlockId, setActiveFormBlockId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<ActivityEntry | null>(null);
  const [earningInput, setEarningInput] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');

  // Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState<'fuel' | 'servicing' | 'toll' | 'other'>('fuel');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expNote, setExpNote] = useState('');

  // Unscheduled / Extra Activity modal state
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraType, setExtraType] = useState<'ride' | 'research' | 'ielts' | 'class' | 'custom'>('ride');
  const [extraTitle, setExtraTitle] = useState('Extra Ride Session');
  const [extraHours, setExtraHours] = useState(2);
  const [extraEarning, setExtraEarning] = useState('');
  const [extraComment, setExtraComment] = useState('');

  const dateObj = fromKey(cursorKey);
  const dow = dateObj.getDay();
  const dayPlan = routine[dow] || { name: 'Today', blocks: [] };
  const dayEntries = entries.filter((e) => e.dateKey === cursorKey);
  const dayExpenses = expenses.filter((e) => e.dateKey === cursorKey);

  // Separate scheduled entries vs unscheduled extra logged entries
  const unscheduledEntries = dayEntries.filter((e) => !dayPlan.blocks.some((b) => b.id === e.blockId));

  const doneCount = dayEntries.length;
  const totalCount = dayPlan.blocks.length;
  const pct = totalCount ? Math.min(100, Math.round((doneCount / totalCount) * 100)) : (doneCount > 0 ? 100 : 0);

  // Net Income & Expense calculations
  const grossIncome = dayEntries.reduce((sum, e) => sum + (e.earning || 0), 0);
  const totalExpense = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = grossIncome - totalExpense;
  const netProfitMargin = grossIncome > 0 ? Math.round((netIncome / grossIncome) * 100) : 0;

  // Daily 6 AM Lock status check
  const lockStatus = getDateLockStatus(cursorKey);
  const activeCycleKey = getCurrentTrackingDateKey();

  const arcBgPath = describeArc(60, 62, 48, -90, 90);
  const arcPath = describeArc(60, 62, 48, -90, -90 + (Math.min(pct, 100) / 100) * 180);

  // Handler to adjust block hours on the fly
  const handleAdjustBlockHours = (blockId: string, delta: number) => {
    if (lockStatus.isLocked || !onUpdateRoutine) return;
    const currentDayPlan = routine[dow];
    if (!currentDayPlan) return;

    const updatedBlocks = currentDayPlan.blocks.map((b) => {
      if (b.id === blockId) {
        const newHours = Math.max(0.5, Math.min(24, Math.round((b.hours + delta) * 2) / 2));
        return { ...b, hours: newHours };
      }
      return b;
    });

    const updatedRoutine = {
      ...routine,
      [dow]: {
        ...currentDayPlan,
        blocks: updatedBlocks,
      },
    };

    onUpdateRoutine(updatedRoutine);
  };

  const handleOpenForm = (block: RoutineBlock, existing?: ActivityEntry | null) => {
    if (lockStatus.isLocked) return;
    setActiveFormBlockId(block.id);
    if (existing) {
      setEditingEntry(existing);
      setEarningInput(existing.earning != null ? String(existing.earning) : '');
      setCommentInput(existing.comment || '');
    } else {
      setEditingEntry(null);
      setEarningInput('');
      setCommentInput('');
    }
  };

  const handleQuickDone = (block: RoutineBlock) => {
    if (lockStatus.isLocked) return;
    onSaveEntry(block, cursorKey, null, '');
  };

  const handleFormSubmit = (block: RoutineBlock) => {
    if (lockStatus.isLocked) return;
    const earningNum = earningInput.trim() === '' ? null : Number(earningInput);
    onSaveEntry(block, cursorKey, earningNum, commentInput, editingEntry ? editingEntry.id : null);
    setActiveFormBlockId(null);
  };

  const handleRemove = (id: string) => {
    if (lockStatus.isLocked) return;
    onRemoveEntry(id);
  };

  const handleSaveExtraActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockStatus.isLocked) return;

    const extraBlock: RoutineBlock = {
      id: `custom-${extraType}-${Date.now()}`,
      type: extraType,
      title: extraTitle.trim() || `${TYPE_META[extraType].label} Session`,
      time: 'Unscheduled / Extra',
      hours: extraHours,
    };

    const earningNum = extraType === 'ride' && extraEarning.trim() ? Number(extraEarning) : null;
    onSaveEntry(extraBlock, cursorKey, earningNum, extraComment.trim());

    setShowExtraModal(false);
    setExtraTitle('Extra Ride Session');
    setExtraHours(2);
    setExtraEarning('');
    setExtraComment('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return Bike;
      case 'research':
        return BookOpen;
      case 'ielts':
        return GraduationCap;
      case 'class':
        return School;
      default:
        return Activity;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Date Navigation - Frosted Glass */}
      <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3 shadow-md dark:shadow-xl">
        <button
          onClick={() => onChangeCursorKey(toKey(new Date(dateObj.getTime() - 86400000)))}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm border border-slate-200 dark:border-slate-700/50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
            <span>{dayPlan.name}</span>
            {cursorKey === activeCycleKey && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                ACTIVE CYCLE
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(cursorKey)}</div>
        </div>

        <div className="flex items-center gap-1">
          {cursorKey !== activeCycleKey && (
            <button
              onClick={() => onChangeCursorKey(activeCycleKey)}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800/50"
              title="Jump to current active 6 AM tracking window"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Active Window</span>
            </button>
          )}

          <button
            onClick={() => onChangeCursorKey(toKey(new Date(dateObj.getTime() + 86400000)))}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm border border-slate-200 dark:border-slate-700/50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 6:00 AM Daily Cycle Lock Alert Bar */}
      <div
        className={`p-3.5 rounded-2xl border backdrop-blur-md flex items-center justify-between gap-3 text-xs shadow-md ${
          lockStatus.isLocked
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              lockStatus.isLocked
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {lockStatus.isLocked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
          </div>
          <div>
            <div className="font-bold flex items-center gap-1.5">
              <span>{lockStatus.isLocked ? 'Daily Record Locked' : '24-Hour Cycle Open'}</span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                  lockStatus.isLocked
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {lockStatus.badgeText}
              </span>
            </div>
            <p className="text-[11px] opacity-90 mt-0.5">{lockStatus.message}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] opacity-80 shrink-0 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>6 AM Cycle Rule</span>
        </div>
      </div>

      {/* Daily Progress Gauge & Net Earnings Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Progress Gauge */}
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md dark:shadow-xl flex items-center gap-4">
          <div className="shrink-0 relative">
            <svg width="100" height="60" viewBox="0 0 120 72">
              <path d={arcBgPath} className="stroke-slate-200 dark:stroke-slate-700/60" strokeWidth="10" fill="none" strokeLinecap="round" />
              <path d={arcPath} stroke="#6366f1" strokeWidth="10" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">{pct}%</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
              {doneCount} of {totalCount} activities logged
            </div>
          </div>
        </div>

        {/* Net Income & Expense Overview Card */}
        <div className="bg-gradient-to-br from-indigo-900/10 via-white/80 to-purple-900/10 dark:from-indigo-950/40 dark:via-slate-900/50 dark:to-purple-950/30 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md dark:shadow-xl flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Net Profit (Net Earnings)
              </span>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span>{formatCurrency(netIncome)}</span>
                {grossIncome > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                    netIncome >= 0 
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}>
                    {netProfitMargin}% Net
                  </span>
                )}
              </div>
            </div>

            {!lockStatus.isLocked && (
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setExtraType('ride');
                    setExtraTitle('Extra Ride Session');
                    setExtraHours(2);
                    setExtraEarning('');
                    setExtraComment('');
                    setShowExtraModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-md cursor-pointer border border-indigo-400/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Extra Activity</span>
                </button>

                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all shadow-md cursor-pointer border border-amber-300/40"
                >
                  <Fuel className="w-3.5 h-3.5" />
                  <span>+ Bike Expense</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
            <div className="bg-slate-100/80 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Gross Income</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(grossIncome)}</span>
            </div>
            <div className="bg-slate-100/80 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Fuel &amp; Bike Cost</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">-{formatCurrency(totalExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logged Expenses List Section (if any expenses exist for this date) */}
      {dayExpenses.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                Logged Bike Expenses
              </h4>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">
              Total: -{formatCurrency(totalExpense)}
            </span>
          </div>

          <div className="space-y-2">
            {dayExpenses.map((exp) => {
              const catMeta = EXPENSE_CATEGORIES[exp.category] || EXPENSE_CATEGORIES.other;
              return (
                <div
                  key={exp.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="p-1.5 rounded-lg shrink-0"
                      style={{ backgroundColor: catMeta.bg, color: catMeta.color }}
                    >
                      {exp.category === 'fuel' ? (
                        <Fuel className="w-3.5 h-3.5" />
                      ) : exp.category === 'servicing' ? (
                        <Wrench className="w-3.5 h-3.5" />
                      ) : (
                        <Receipt className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{exp.title}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {catMeta.label} {exp.comment ? `• "${exp.comment}"` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg text-xs">
                      -{formatCurrency(exp.amount)}
                    </span>
                    {!lockStatus.isLocked && (
                      <button
                        onClick={() => onRemoveExpense(exp.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bike / Fuel Expense Log Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 backdrop-blur-2xl rounded-3xl max-w-md w-full p-5 shadow-2xl relative text-slate-900 dark:text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Log Bike Expense</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Record fuel, octane or bike servicing cost</p>
                </div>
              </div>

              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = Number(expAmount);
                if (!amt || amt <= 0) return;
                onSaveExpense(expCategory, expTitle, amt, cursorKey, expNote);
                setShowExpenseModal(false);
                setExpAmount('');
                setExpTitle('');
                setExpNote('');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(EXPENSE_CATEGORIES) as Array<keyof typeof EXPENSE_CATEGORIES>).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setExpCategory(cat)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        expCategory === cat
                          ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cat === 'fuel' ? <Fuel className="w-4 h-4 text-amber-500" /> : cat === 'servicing' ? <Wrench className="w-4 h-4 text-rose-500" /> : <Receipt className="w-4 h-4 text-purple-500" />}
                      <span className="truncate">{EXPENSE_CATEGORIES[cat].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (BDT ৳)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 350"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Item Description / Title
                </label>
                <input
                  type="text"
                  placeholder={expCategory === 'fuel' ? 'e.g. Octane 3 Liters' : expCategory === 'servicing' ? 'e.g. Mobil change & chain lube' : 'e.g. Expressway Toll'}
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Note / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. From Padma Oil filling station"
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer border border-amber-300/40"
                >
                  Save Expense Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Routine Blocks List */}
      <div className="space-y-3">
        {dayPlan.blocks.length === 0 ? (
          <div className="text-center py-10 bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl text-slate-500 dark:text-slate-400 text-xs">
            No schedule blocks set for this day.
          </div>
        ) : (
          dayPlan.blocks.map((block) => {
            const entry = dayEntries.find((e) => e.blockId === block.id);
            const meta = TYPE_META[block.type] || TYPE_META.custom;
            const Icon = getIcon(block.type);
            const isFormOpen = activeFormBlockId === block.id;

            return (
              <div
                key={block.id}
                className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md dark:shadow-xl transition-all hover:border-indigo-500/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border backdrop-blur-sm"
                      style={{ backgroundColor: meta.bg, color: meta.color, borderColor: `${meta.color}40` }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{block.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{block.time}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60 font-semibold text-slate-700 dark:text-slate-300">
                          {!lockStatus.isLocked && onUpdateRoutine && (
                            <button
                              type="button"
                              onClick={() => handleAdjustBlockHours(block.id, -0.5)}
                              disabled={block.hours <= 0.5}
                              className="w-4 h-4 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Decrease daily set time (-0.5h)"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          )}
                          <span>{block.hours}h</span>
                          {!lockStatus.isLocked && onUpdateRoutine && (
                            <button
                              type="button"
                              onClick={() => handleAdjustBlockHours(block.id, 0.5)}
                              disabled={block.hours >= 24}
                              className="w-4 h-4 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Increase daily set time (+0.5h)"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Locked badge if day is locked */}
                    {lockStatus.isLocked ? (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 font-bold text-xs flex items-center gap-1.5 backdrop-blur-sm">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked</span>
                      </span>
                    ) : (
                      <>
                        {!entry && block.type !== 'ride' && (
                          <button
                            onClick={() => handleQuickDone(block)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                            <span>Done</span>
                          </button>
                        )}

                        {!entry && block.type === 'ride' && (
                          <button
                            onClick={() => handleOpenForm(block, null)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-indigo-400/30 backdrop-blur-sm"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Log Ride</span>
                          </button>
                        )}

                        {entry && !isFormOpen && (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                              <Check className="w-3.5 h-3.5" />
                              <span>Logged</span>
                            </span>
                            <button
                              onClick={() => handleOpenForm(block, entry)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemove(entry.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Entry Metadata Note / Income display */}
                {entry && !isFormOpen && (entry.earning != null || entry.comment) && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <span>Logged at <strong className="text-slate-800 dark:text-slate-200">{fmtTime(entry.doneAt)}</strong></span>
                    {entry.earning != null && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Income: {formatCurrency(entry.earning)}
                      </span>
                    )}
                    {entry.comment && (
                      <span className="text-slate-700 dark:text-slate-300 italic">"{entry.comment}"</span>
                    )}
                  </div>
                )}

                {/* Inline Earnings & Comment Form */}
                {isFormOpen && !lockStatus.isLocked && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
                    {block.type === 'ride' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                          Income Earned (BDT ৳)
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="e.g. 550"
                          value={earningInput}
                          onChange={(e) => setEarningInput(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        {block.type === 'ride'
                          ? 'Ride Trips & Earnings Note'
                          : block.type === 'research'
                          ? 'Research Notes & Progress'
                          : block.type === 'ielts'
                          ? 'IELTS Practice & Score Note'
                          : block.type === 'class'
                          ? 'Class & Lecture Notes'
                          : 'Activity Note / Remarks'}
                      </label>
                      <textarea
                        rows={2}
                        placeholder={
                          block.type === 'ride'
                            ? 'e.g. Gulshan to Dhanmondi 4 trips, rain heavy'
                            : block.type === 'research'
                            ? 'e.g. Literature review completed, 10 IEEE papers summarized'
                            : block.type === 'ielts'
                            ? 'e.g. Writing Task 2 practice score 7.5, speaking vocabulary focus'
                            : block.type === 'class'
                            ? 'e.g. Algorithm analysis lecture notes and assignment discussion'
                            : 'Write details or remarks...'
                        }
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveFormBlockId(null)}
                        className="px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFormSubmit(block)}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer border border-indigo-400/30"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Record</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Unscheduled / Extra Logged Activities (e.g. Extra Ride, IELTS, Research) */}
      {unscheduledEntries.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                Unscheduled / Extra Logged Activities
              </h4>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {unscheduledEntries.length} Extra {unscheduledEntries.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          <div className="space-y-2">
            {unscheduledEntries.map((entry) => {
              const meta = TYPE_META[entry.type] || TYPE_META.custom;
              const Icon = getIcon(entry.type);

              return (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="p-1.5 rounded-lg shrink-0 border"
                        style={{ backgroundColor: meta.bg, color: meta.color, borderColor: `${meta.color}40` }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{entry.title}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
                            {entry.hours} Hours
                          </span>
                          <span>• Logged at {fmtTime(entry.doneAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {entry.earning != null && (
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-xs">
                          +{formatCurrency(entry.earning)}
                        </span>
                      )}

                      {!lockStatus.isLocked && (
                        <button
                          onClick={() => onRemoveEntry(entry.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Delete extra activity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {entry.comment && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 italic pl-1 border-l-2 border-indigo-400">
                      "{entry.comment}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unscheduled / Extra Activity Modal */}
      {showExtraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 backdrop-blur-2xl rounded-3xl max-w-md w-full p-5 shadow-2xl relative text-slate-900 dark:text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Log Extra / Unscheduled Activity</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add an unscheduled Ride, IELTS, or Research session</p>
                </div>
              </div>

              <button
                onClick={() => setShowExtraModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExtraActivity} className="space-y-3.5">
              {/* Activity Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Activity Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['ride', 'research', 'ielts', 'class', 'custom'] as const).map((t) => {
                    const meta = TYPE_META[t];
                    const Icon = getIcon(t);
                    const isSel = extraType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setExtraType(t);
                          if (t === 'ride') setExtraTitle('Extra Ride Session');
                          else if (t === 'research') setExtraTitle('Extra Research Session');
                          else if (t === 'ielts') setExtraTitle('Extra IELTS Practice');
                          else if (t === 'class') setExtraTitle('Extra Class / Lecture');
                          else setExtraTitle('Custom Activity');
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSel
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md scale-[1.02]'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="capitalize">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Activity Title
                </label>
                <input
                  type="text"
                  required
                  value={extraTitle}
                  onChange={(e) => setExtraTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              {/* Hours Stepper & Quick Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Duration / Hours Spent
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {extraHours} {extraHours === 1 ? 'Hour' : 'Hours'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setExtraHours((h) => Math.max(0.5, h - 0.5))}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl py-2 text-center text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                    {extraHours} Hours
                  </div>

                  <button
                    type="button"
                    onClick={() => setExtraHours((h) => Math.min(24, h + 0.5))}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[1, 1.5, 2, 3, 4, 5, 6].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setExtraHours(hrs)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        extraHours === hrs
                          ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50'
                      }`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Income Earned for Rides */}
              {extraType === 'ride' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Income Earned (BDT ৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 600"
                    value={extraEarning}
                    onChange={(e) => setExtraEarning(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              )}

              {/* Notes / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    extraType === 'ride'
                      ? 'e.g. 3 trips from Uttara to Banani'
                      : extraType === 'research'
                      ? 'e.g. IEEE conference paper section 3 drafting'
                      : extraType === 'ielts'
                      ? 'e.g. Cambridge IELTS 18 Test 2 Listening'
                      : 'Add any extra details...'
                  }
                  value={extraComment}
                  onChange={(e) => setExtraComment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExtraModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer border border-indigo-400/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Extra Activity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
