import React, { useState } from 'react';
import { Bike, BookOpen, GraduationCap, School, Activity, Plus, RotateCcw, Trash2, Pencil, Check, Clock } from 'lucide-react';
import { DayRoutine, DEFAULT_ROUTINE, RoutineBlock, TYPE_META } from '../utils/helpers';

interface RoutineProps {
  routine: Record<number, DayRoutine>;
  onUpdateRoutine: (updated: Record<number, DayRoutine>) => void;
}

export const Routine: React.FC<RoutineProps> = ({ routine, onUpdateRoutine }) => {
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newHours, setNewHours] = useState('2');
  const [newType, setNewType] = useState<'ride' | 'research' | 'ielts' | 'class'>('ride');

  const daysOrder = [0, 1, 2, 3, 4, 5, 6]; // Sun to Sat

  const handleResetDefaults = () => {
    if (confirm('Reset routine schedule to default weekly plan?')) {
      onUpdateRoutine(DEFAULT_ROUTINE);
    }
  };

  const handleAddBlock = (dow: number) => {
    if (!newTitle || !newTime) return;
    const block: RoutineBlock = {
      id: `custom_${dow}_${Date.now()}`,
      title: newTitle,
      time: newTime,
      hours: Number(newHours) || 1,
      type: newType,
    };

    const currentDay = routine[dow] || { name: 'Day', blocks: [] };
    const nextDay = { ...currentDay, blocks: [...currentDay.blocks, block] };
    const nextRoutine = { ...routine, [dow]: nextDay };

    onUpdateRoutine(nextRoutine);
    setNewTitle('');
    setNewTime('');
    setShowAddForm(false);
  };

  const handleRemoveBlock = (dow: number, blockId: string) => {
    const currentDay = routine[dow];
    if (!currentDay) return;
    const nextDay = {
      ...currentDay,
      blocks: currentDay.blocks.filter((b) => b.id !== blockId),
    };
    onUpdateRoutine({ ...routine, [dow]: nextDay });
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
      {/* Header Controls - Frosted Glass */}
      <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md dark:shadow-xl flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Weekly Master Routine
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Fixed schedule for Rides, IELTS, Research &amp; Classes</p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-sm"
          title="Restore original plan"
        >
          <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">Reset Defaults</span>
        </button>
      </div>

      {/* Days Schedule */}
      <div className="space-y-4">
        {daysOrder.map((dow) => {
          const plan = routine[dow] || { name: `Day ${dow}`, blocks: [] };
          const isAdding = editingDay === dow && showAddForm;

          return (
            <div key={dow} className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md dark:shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
                <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {plan.name}
                </h4>
                <button
                  onClick={() => {
                    setEditingDay(dow);
                    setShowAddForm(true);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Block</span>
                </button>
              </div>

              {/* Add Block Form */}
              {isAdding && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl space-y-2.5 backdrop-blur-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Activity Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Night Ride"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Category
                      </label>
                      <select
                        value={newType}
                        onChange={(e: any) => setNewType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
                      >
                        <option value="ride">Ride</option>
                        <option value="ielts">IELTS</option>
                        <option value="research">Research</option>
                        <option value="class">Class</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Time Slot
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 08:00 – 10:00 PM"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Hours
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={newHours}
                        onChange={(e) => setNewHours(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddBlock(dow)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer border border-indigo-400/30"
                    >
                      Save Block
                    </button>
                  </div>
                </div>
              )}

              {/* Blocks list */}
              <div className="space-y-2">
                {plan.blocks.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">Rest Day / No scheduled routine.</p>
                ) : (
                  plan.blocks.map((block) => {
                    const meta = TYPE_META[block.type] || TYPE_META.custom;
                    const Icon = getIcon(block.type);

                    return (
                      <div
                        key={block.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border backdrop-blur-sm"
                            style={{ backgroundColor: meta.bg, color: meta.color, borderColor: `${meta.color}40` }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{block.title}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {block.time} • <span className="font-semibold">{block.hours}h</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveBlock(dow, block.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
