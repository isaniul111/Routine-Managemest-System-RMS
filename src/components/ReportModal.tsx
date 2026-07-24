import React, { useState } from 'react';
import { X, FileText, Download, Calendar, Printer, DollarSign, Fuel, Clock, GraduationCap, Bike, CheckCircle2 } from 'lucide-react';
import { ActivityEntry, ExpenseEntry, UserProfile, formatCurrency, EXPENSE_CATEGORIES, TYPE_META } from '../utils/helpers';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  entries: ActivityEntry[];
  expenses: ExpenseEntry[];
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  user,
  entries,
  expenses,
}) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Calculate dates for report filtering
  const now = new Date();

  // Weekly: Last 7 Days vs Past 7-14 Days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [weekRange, setWeekRange] = useState<'current_week' | 'previous_week'>('current_week');

  if (!isOpen) return null;

  // Filter entries based on selection
  let filteredEntries: ActivityEntry[] = [];
  let filteredExpenses: ExpenseEntry[] = [];
  let periodTitle = '';

  if (reportType === 'weekly') {
    if (weekRange === 'current_week') {
      periodTitle = 'Current Week (Last 7 Days)';
      filteredEntries = entries.filter((e) => {
        const ed = new Date(e.dateKey);
        return ed >= sevenDaysAgo && ed <= now;
      });
      filteredExpenses = expenses.filter((e) => {
        const ed = new Date(e.dateKey);
        return ed >= sevenDaysAgo && ed <= now;
      });
    } else {
      periodTitle = 'Previous Week (Days 8-14 ago)';
      filteredEntries = entries.filter((e) => {
        const ed = new Date(e.dateKey);
        return ed >= fourteenDaysAgo && ed < sevenDaysAgo;
      });
      filteredExpenses = expenses.filter((e) => {
        const ed = new Date(e.dateKey);
        return ed >= fourteenDaysAgo && ed < sevenDaysAgo;
      });
    }
  } else {
    // Monthly
    periodTitle = `Month of ${selectedMonth}`;
    filteredEntries = entries.filter((e) => e.dateKey.startsWith(selectedMonth));
    filteredExpenses = expenses.filter((e) => e.dateKey.startsWith(selectedMonth));
  }

  // Metrics
  const grossIncome = filteredEntries.reduce((sum, e) => sum + (e.earning || 0), 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossIncome - totalExpense;

  const rideHours = filteredEntries
    .filter((e) => e.type === 'ride')
    .reduce((sum, e) => sum + e.hours, 0);

  const studyHours = filteredEntries
    .filter((e) => e.type === 'ielts' || e.type === 'research')
    .reduce((sum, e) => sum + e.hours, 0);

  const totalHours = filteredEntries.reduce((sum, e) => sum + e.hours, 0);

  // Trigger Print/Download PDF
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download/print PDF reports.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>RMS Executive Performance Report - ${periodTitle}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 30px;
              color: #1e293b;
              background-color: #ffffff;
            }
            .header {
              border-bottom: 3px solid #4f46e5;
              padding-bottom: 15px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo {
              font-size: 22px;
              font-weight: 900;
              color: #4f46e5;
              letter-spacing: 1px;
            }
            .subtitle {
              font-size: 12px;
              color: #64748b;
              margin-top: 4px;
            }
            .profile-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 20px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 25px;
            }
            .card {
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 12px;
              background: #fafafa;
            }
            .card-title {
              font-size: 10px;
              text-transform: uppercase;
              font-weight: 800;
              color: #64748b;
            }
            .card-value {
              font-size: 18px;
              font-weight: 800;
              margin-top: 5px;
            }
            .green { color: #16a34a; }
            .red { color: #dc2626; }
            .blue { color: #2563eb; }
            .purple { color: #9333ea; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              margin-bottom: 25px;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f1f5f9;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 10px;
              color: #334155;
            }
            .section-title {
              font-size: 14px;
              font-weight: 800;
              border-left: 4px solid #4f46e5;
              padding-left: 8px;
              margin-top: 25px;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-size: 10px;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">RIDE & ROUTINE MANAGEMENT SYSTEM</div>
              <div class="subtitle">Official Executive Performance & Financial Statement</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; font-size: 14px;">${periodTitle}</div>
              <div class="subtitle">Generated: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="profile-box">
            <strong style="font-size: 14px;">Rider Details:</strong><br/>
            <span>Name: ${user?.name || 'Rider Guest'}</span> | 
            <span>Email: ${user?.email || 'N/A'}</span> | 
            <span>Bike: ${user?.bikeModel || 'Yamaha FZs V3'}</span>
          </div>

          <div class="metrics-grid">
            <div class="card">
              <div class="card-title">Gross Income</div>
              <div class="card-value green">${formatCurrency(grossIncome)}</div>
            </div>
            <div class="card">
              <div class="card-title">Fuel & Bike Cost</div>
              <div class="card-value red">-${formatCurrency(totalExpense)}</div>
            </div>
            <div class="card">
              <div class="card-title">Net Profit</div>
              <div class="card-value blue">${formatCurrency(netProfit)}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Work Hours</div>
              <div class="card-value purple">${totalHours} Hours</div>
            </div>
          </div>

          <div class="section-title">1. Itemized Bike & Fuel Expenses</div>
          ${
            filteredExpenses.length === 0
              ? '<p style="font-size: 12px; color: #64748b;">No expense records logged in this period.</p>'
              : `
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Title / Description</th>
                    <th>Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredExpenses
                    .map(
                      (exp) => `
                    <tr>
                      <td>${exp.dateKey}</td>
                      <td>${EXPENSE_CATEGORIES[exp.category]?.label || exp.category}</td>
                      <td>${exp.title || '-'}</td>
                      <td style="color: #dc2626; font-weight: bold;">-${formatCurrency(exp.amount)}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            `
          }

          <div class="section-title">2. Activity & Work Schedule Summary</div>
          ${
            filteredEntries.length === 0
              ? '<p style="font-size: 12px; color: #64748b;">No activity logs in this period.</p>'
              : `
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Session Title</th>
                    <th>Duration</th>
                    <th>Earnings (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredEntries
                    .map(
                      (ent) => `
                    <tr>
                      <td>${ent.dateKey}</td>
                      <td>${TYPE_META[ent.type]?.label || ent.type}</td>
                      <td>${ent.title}</td>
                      <td>${ent.hours} hrs</td>
                      <td style="color: #16a34a; font-weight: bold;">${formatCurrency(ent.earning || 0)}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            `
          }

          <div class="footer">
            Generated automatically by RMS Pro. This document serves as official verification of ride performance and financial statement.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-scale-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30">
              <FileText className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Executive Report &amp; PDF Download</h3>
              <p className="text-xs text-indigo-200/80">Generate Weekly or Monthly official statements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Controls */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Controls bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            {/* Report Type Selector */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Report Type
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setReportType('weekly')}
                  className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    reportType === 'weekly'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Weekly Report
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('monthly')}
                  className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    reportType === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Monthly Report
                </button>
              </div>
            </div>

            {/* Range Selector */}
            <div>
              {reportType === 'weekly' ? (
                <>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Week Period
                  </label>
                  <select
                    value={weekRange}
                    onChange={(e: any) => setWeekRange(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                  >
                    <option value="current_week">Current Week (Last 7 Days)</option>
                    <option value="previous_week">Previous Week (Days 8-14)</option>
                  </select>
                </>
              ) : (
                <>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                  />
                </>
              )}
            </div>
          </div>

          {/* Statement Live Preview Banner */}
          <div className="border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-4 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-800/60 pb-2">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {reportType.toUpperCase()} STATEMENT PREVIEW
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{periodTitle}</h4>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                {user?.name || 'Rider Guest'}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500">Gross Income</span>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {formatCurrency(grossIncome)}
                </div>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500">Fuel &amp; Servicing</span>
                <div className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                  -{formatCurrency(totalExpense)}
                </div>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500">Net Profit</span>
                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                  {formatCurrency(netProfit)}
                </div>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500">Total Work</span>
                <div className="text-sm font-black text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                  {totalHours} Hours
                </div>
              </div>
            </div>

            {/* Quick breakdown stats */}
            <div className="flex items-center justify-around text-[11px] text-slate-600 dark:text-slate-300 font-medium pt-1">
              <span className="flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-indigo-500" />
                Ride Hours: {rideHours}h
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-cyan-500" />
                IELTS &amp; Study: {studyHours}h
              </span>
              <span className="flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-amber-500" />
                Expenses logged: {filteredExpenses.length}
              </span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-500">
            Click Download PDF to save or print official formatted report
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrintPDF}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
