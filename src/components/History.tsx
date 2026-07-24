import React, { useMemo, useState } from 'react';
import { Search, Filter, Trash2, Pencil, Download, Calendar, Wallet, Bike, BookOpen, GraduationCap, School, Activity, Lock, Fuel, Wrench, Receipt } from 'lucide-react';
import { ActivityEntry, ExpenseEntry, exportEntriesToCSV, fmtDate, fmtTime, formatCurrency, TYPE_META, EXPENSE_CATEGORIES, getDateLockStatus } from '../utils/helpers';

interface HistoryProps {
  entries: ActivityEntry[];
  expenses?: ExpenseEntry[];
  onRemoveEntry: (id: string) => void;
  onRemoveExpense?: (id: string) => void;
  onEditEntry: (entry: ActivityEntry) => void;
}

export const History: React.FC<HistoryProps> = ({
  entries,
  expenses = [],
  onRemoveEntry,
  onRemoveExpense,
  onEditEntry,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchType = typeFilter === 'all' || e.type === typeFilter;
      const matchSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.comment && e.comment.toLowerCase().includes(search.toLowerCase())) ||
        e.dateKey.includes(search);
      return matchType && matchSearch;
    });
  }, [entries, search, typeFilter]);

  const filteredExpenses = useMemo(() => {
    if (typeFilter !== 'all' && typeFilter !== 'expense') return [];
    return expenses.filter((e) => {
      return (
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.comment && e.comment.toLowerCase().includes(search.toLowerCase())) ||
        e.dateKey.includes(search)
      );
    });
  }, [expenses, search, typeFilter]);

  const groupedByDate = useMemo(() => {
    const map: Record<string, { entries: ActivityEntry[]; expenses: ExpenseEntry[] }> = {};
    filteredEntries.forEach((e) => {
      if (!map[e.dateKey]) map[e.dateKey] = { entries: [], expenses: [] };
      map[e.dateKey].entries.push(e);
    });
    filteredExpenses.forEach((exp) => {
      if (!map[exp.dateKey]) map[exp.dateKey] = { entries: [], expenses: [] };
      map[exp.dateKey].expenses.push(exp);
    });
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filteredEntries, filteredExpenses]);

  const totalFilteredEarnings = filteredEntries.reduce((sum, e) => sum + (e.earning || 0), 0);
  const totalFilteredExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFilteredNet = totalFilteredEarnings - totalFilteredExpenses;

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
      {/* Search & Filter Header - Frosted Glass */}
      <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md dark:shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Activity History Logs ({filteredEntries.length})
          </h3>
          <button
            onClick={() => exportEntriesToCSV(entries)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rides, comments, or date YYYY-MM-DD..."
            className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['all', 'ride', 'expense', 'ielts', 'research', 'class'].map((cat) => (
            <button
              key={cat}
              onClick={() => setTypeFilter(cat)}
              className={`px-3 py-1 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                typeFilter === cat
                  ? 'bg-indigo-600 text-white shadow-md border border-indigo-400/30'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60 backdrop-blur-sm'
              }`}
            >
              {cat === 'expense' ? '⛽ Bike Expense' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered Income & Expense Summary - Frosted Glass */}
      {(totalFilteredEarnings > 0 || totalFilteredExpenses > 0) && (
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-md flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-600 dark:text-slate-400">
              Gross: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalFilteredEarnings)}</strong>
            </span>
            <span className="font-bold text-slate-600 dark:text-slate-400">
              Expense: <strong className="text-rose-600 dark:text-rose-400">-{formatCurrency(totalFilteredExpenses)}</strong>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Filtered Net Profit</span>
            <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
              {formatCurrency(totalFilteredNet)}
            </span>
          </div>
        </div>
      )}

      {/* History Timeline - Frosted Glass */}
      <div className="space-y-4">
        {groupedByDate.length === 0 ? (
          <div className="text-center py-12 bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl text-slate-500 dark:text-slate-400 text-xs">
            No logged activity or expense matches your search or filters.
          </div>
        ) : (
          groupedByDate.map(([dateKey, group]) => {
            const isLocked = getDateLockStatus(dateKey).isLocked;
            const dayGross = group.entries.reduce((sum, e) => sum + (e.earning || 0), 0);
            const dayExp = group.expenses.reduce((sum, e) => sum + e.amount, 0);
            const dayNet = dayGross - dayExp;

            return (
              <div key={dateKey} className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{fmtDate(dateKey)}</span>
                    {(dayGross > 0 || dayExp > 0) && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded-full border border-emerald-500/20">
                        Net: {formatCurrency(dayNet)}
                      </span>
                    )}
                  </div>
                  {isLocked && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Saved &amp; Locked</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Activity entries */}
                  {group.entries.map((item) => {
                    const meta = TYPE_META[item.type] || TYPE_META.custom;
                    const Icon = getIcon(item.type);

                    return (
                      <div
                        key={item.id}
                        className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-md dark:shadow-xl flex items-center justify-between gap-3 hover:border-indigo-500/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border backdrop-blur-sm"
                            style={{ backgroundColor: meta.bg, color: meta.color, borderColor: `${meta.color}40` }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <span>{item.title}</span>
                              {item.earning != null && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                  • {formatCurrency(item.earning)}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Logged at {fmtTime(item.doneAt)} • {item.hours}h
                              {item.comment && <span className="italic text-slate-700 dark:text-slate-300"> — "{item.comment}"</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {isLocked ? (
                            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500" title="Locked - Cannot be changed after 24h 6 AM cycle">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => onEditEntry(item)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onRemoveEntry(item.id)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Expense entries */}
                  {group.expenses.map((exp) => {
                    const catMeta = EXPENSE_CATEGORIES[exp.category] || EXPENSE_CATEGORIES.other;

                    return (
                      <div
                        key={exp.id}
                        className="bg-amber-500/5 dark:bg-slate-900/40 border border-amber-500/30 backdrop-blur-md rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border backdrop-blur-sm"
                            style={{ backgroundColor: catMeta.bg, color: catMeta.color, borderColor: `${catMeta.color}40` }}
                          >
                            <Fuel className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <span>{exp.title}</span>
                              <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                                • -{formatCurrency(exp.amount)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {catMeta.label} • {fmtTime(exp.doneAt)}
                              {exp.comment && <span className="italic text-slate-700 dark:text-slate-300"> — "{exp.comment}"</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {isLocked ? (
                            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500" title="Locked">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            onRemoveExpense && (
                              <button
                                onClick={() => onRemoveExpense(exp.id)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
