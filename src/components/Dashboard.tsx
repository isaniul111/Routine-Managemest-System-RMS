import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Bike,
  BookOpen,
  GraduationCap,
  Fuel,
  Wrench,
  Receipt,
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Sparkles,
  UserCheck,
  UserX,
  ArrowRight,
  Target,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import {
  ActivityEntry,
  ExpenseEntry,
  MonthlyGoals,
  UserProfile,
  formatCurrency,
  monthKey,
  toKey,
  TYPE_META,
  EXPENSE_CATEGORIES,
} from '../utils/helpers';

interface DashboardProps {
  user: UserProfile | null;
  entries: ActivityEntry[];
  expenses: ExpenseEntry[];
  goals: MonthlyGoals;
  cursorKey: string;
  monthCursor: string;
  onNavigate: (tab: 'today' | 'history' | 'monthly' | 'routine') => void;
  onOpenAuth: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface NoteItem {
  id: string;
  text: string;
  category: 'rider' | 'maintenance' | 'study' | 'general';
  createdAt: string;
  isDone: boolean;
}

const DASHBOARD_CHAT_KEY = 'rms_dashboard_chat_history';
const DASHBOARD_NOTES_KEY = 'rms_dashboard_rider_notes';

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  entries,
  expenses,
  goals,
  cursorKey,
  monthCursor,
  onNavigate,
  onOpenAuth,
}) => {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_CHAT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error(err);
    }
    return [
      {
        id: 'msg-1',
        sender: 'assistant',
        text: 'Hello Rider! I am your RMS Smart Assistant. How can I assist with your ride schedule, fuel calculations, or IELTS study plan today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Quick Notes state
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_NOTES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error(err);
    }
    return [
      {
        id: 'note-1',
        text: 'Check engine oil & chain tension before tomorrow morning ride',
        category: 'maintenance',
        createdAt: new Date().toISOString(),
        isDone: false,
      },
      {
        id: 'note-[2]',
        text: 'Complete IELTS Speaking Cue Card practice 2 topics',
        category: 'study',
        createdAt: new Date().toISOString(),
        isDone: false,
      },
    ];
  });
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'rider' | 'maintenance' | 'study' | 'general'>('rider');

  // Persist chat & notes locally
  useEffect(() => {
    localStorage.setItem(DASHBOARD_CHAT_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  // Today's metrics
  const todayEntries = entries.filter((e) => e.dateKey === cursorKey);
  const todayExpenses = expenses.filter((e) => e.dateKey === cursorKey);
  const todayGross = todayEntries.reduce((sum, e) => sum + (e.earning || 0), 0);
  const todayExp = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayNet = todayGross - todayExp;

  // Monthly metrics
  const currentMonthEntries = entries.filter((e) => e.dateKey.startsWith(monthCursor));
  const currentMonthExpenses = expenses.filter((e) => e.dateKey.startsWith(monthCursor));
  
  const monthGross = currentMonthEntries.reduce((sum, e) => sum + (e.earning || 0), 0);
  const monthExp = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthNet = monthGross - monthExp;

  const monthRideHours = currentMonthEntries
    .filter((e) => e.type === 'ride')
    .reduce((sum, e) => sum + e.hours, 0);

  const monthStudyHours = currentMonthEntries
    .filter((e) => e.type === 'ielts' || e.type === 'research')
    .reduce((sum, e) => sum + e.hours, 0);

  // Goal progress percentages
  const incomeGoal = goals.incomeTarget || 25000;
  const incomePct = Math.min(Math.round((monthGross / incomeGoal) * 100), 100);

  const studyGoal = goals.studyHoursTarget || 50;
  const studyPct = Math.min(Math.round((monthStudyHours / studyGoal) * 100), 100);

  // Send message in Chat Assistant
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMsg('');
    setIsTyping(true);

    // AI smart assistant simulated response logic based on rider context
    setTimeout(() => {
      let reply = "I've logged your note! Keep pushing towards your daily ride target and IELTS study milestones.";
      const lower = text.toLowerCase();

      if (lower.includes('fuel') || lower.includes('expense') || lower.includes('cost')) {
        reply = `Your total bike expenses for this month are ${formatCurrency(monthExp)}. Today you spent ${formatCurrency(todayExp)} on bike expenses. Tip: Keeping steady speeds at 40-50 km/h optimizes fuel economy!`;
      } else if (lower.includes('profit') || lower.includes('income') || lower.includes('earning')) {
        reply = `Great progress! Your gross earnings for this month are ${formatCurrency(monthGross)} with a net profit of ${formatCurrency(monthNet)}. Today's net profit stands at ${formatCurrency(todayNet)}.`;
      } else if (lower.includes('ielts') || lower.includes('study') || lower.includes('research')) {
        reply = `You have completed ${monthStudyHours} hours of IELTS & Research preparation this month (${studyPct}% of your ${studyGoal}h goal). Keep up 2 hours daily focus!`;
      } else if (lower.includes('routine') || lower.includes('schedule') || lower.includes('time')) {
        reply = `Your master weekly routine balances morning rides with afternoon study blocks. Make sure to lock your records before 6:00 AM every cycle!`;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const item: NoteItem = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      category: newNoteCategory,
      createdAt: new Date().toISOString(),
      isDone: false,
    };
    setNotes((prev) => [item, ...prev]);
    setNewNoteText('');
  };

  const toggleNoteDone = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isDone: !n.isDone } : n))
    );
  };

  const removeNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* Rider Welcome Banner & Login Profile Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-800/60 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.name || 'User'}
                className="w-14 h-14 rounded-2xl border-2 border-indigo-400/50 object-cover shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">
                  {user ? user.name : 'Guest Rider'}
                </h2>
                {user ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>Logged In</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <UserX className="w-3 h-3" />
                    <span>Guest Mode</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {user ? user.email : 'Login to save your rides & expenses to Firebase Cloud'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-amber-300/40"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Login Account</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-indigo-900/80 border border-indigo-700/60 text-xs font-mono font-bold text-indigo-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Cloud Sync Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Metric Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Today's Profit */}
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Today's Net</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(todayNet)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Gross: {formatCurrency(todayGross)}</span>
          </div>
        </div>

        {/* Monthly Net Profit */}
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Month Profit</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
            {formatCurrency(monthNet)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>Goal: {incomePct}% achieved</span>
          </div>
        </div>

        {/* Total Bike Expenses */}
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Fuel &amp; Expenses</span>
            <Fuel className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
            -{formatCurrency(monthExp)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>Today: -{formatCurrency(todayExp)}</span>
          </div>
        </div>

        {/* Study Hours */}
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">IELTS / Study</span>
            <GraduationCap className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-lg font-black font-mono text-cyan-600 dark:text-cyan-400">
            {monthStudyHours} Hours
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>Target: {goals.studyHoursTarget || 50}h</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Shortcuts */}
      <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Quick Actions &amp; Workspaces</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => onNavigate('today')}
            className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer"
          >
            <Bike className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Log Today's Ride</span>
          </button>

          <button
            onClick={() => onNavigate('monthly')}
            className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer"
          >
            <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Monthly Goals</span>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer"
          >
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Activity History</span>
          </button>

          <button
            onClick={() => onNavigate('routine')}
            className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-800/60 text-cyan-700 dark:text-cyan-300 font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer"
          >
            <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>Weekly Routine</span>
          </button>
        </div>
      </div>

      {/* Rider Assistant & Chat Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Interactive Rider Chat Assistant */}
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md flex flex-col h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-500/15 text-indigo-500">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 dark:text-slate-100">
                  Rider AI Assistant &amp; Chat
                </h3>
                <p className="text-[10px] text-slate-500">Ask about fuel math, routine, or study advice</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs mb-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`text-[9px] block text-right mt-1 opacity-70 font-mono`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="text-[10px] text-slate-400 italic">RMS Assistant typing...</div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 text-[10px] shrink-0">
            <button
              onClick={() => handleSendMessage('Calculate my monthly profit summary')}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              💰 Profit Summary
            </button>
            <button
              onClick={() => handleSendMessage('Give me fuel efficiency tips for my bike')}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              ⛽ Fuel Tips
            </button>
            <button
              onClick={() => handleSendMessage('How are my IELTS study hours doing?')}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              🎓 IELTS Progress
            </button>
          </div>

          {/* Chat input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask Assistant or log a quick reminder..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-all shadow-md shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Rider Quick Notes & Reminders Scratchpad */}
        <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md flex flex-col h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 dark:text-slate-100">
                  Rider Scratchpad &amp; Reminders
                </h3>
                <p className="text-[10px] text-slate-500">Quick list for bike care &amp; study tasks</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {notes.filter((n) => !n.isDone).length} active
            </span>
          </div>

          {/* Add note form */}
          <form onSubmit={handleAddNote} className="space-y-2 mb-3 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add new reminder or note..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <select
                value={newNoteCategory}
                onChange={(e: any) => setNewNoteCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="rider">Ride</option>
                <option value="maintenance">Bike Care</option>
                <option value="study">IELTS</option>
                <option value="general">Note</option>
              </select>
              <button
                type="submit"
                className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {notes.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs italic">
                No active notes. Add a reminder above!
              </div>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    n.isDone
                      ? 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => toggleNoteDone(n.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                        n.isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {n.isDone && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                    <span
                      className={`truncate ${
                        n.isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'
                      }`}
                    >
                      {n.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                      {n.category}
                    </span>
                    <button
                      onClick={() => removeNote(n.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
