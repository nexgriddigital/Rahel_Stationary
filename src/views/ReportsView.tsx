import React, { useState, useMemo } from 'react';
import { storage } from '../services/storage';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Package,
  CreditCard,
  User,
  ShoppingBag,
  Award,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export const ReportsView: React.FC = () => {
  const settings = storage.getSettings();
  const [reportTab, setReportTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Daily Report State (default today)
  const [dailyDate, setDailyDate] = useState<string>(() => storage.toLocalDateString(new Date()));

  // Weekly Report State (default today's week)
  const [weeklyDate, setWeeklyDate] = useState<string>(() => storage.toLocalDateString(new Date()));

  // Monthly Report State (default current year and month)
  const now = new Date();
  const [monthlyYear, setMonthlyYear] = useState<number>(now.getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState<number>(now.getMonth() + 1); // 1-12

  // Computed reports from storage transactions (single source of truth)
  const dailyReport = useMemo(() => {
    return storage.getDailyReport(dailyDate);
  }, [dailyDate]);

  const weeklyReport = useMemo(() => {
    return storage.getWeeklyReport(weeklyDate);
  }, [weeklyDate]);

  const monthlyReport = useMemo(() => {
    return storage.getMonthlyReport(monthlyYear, monthlyMonth);
  }, [monthlyYear, monthlyMonth]);

  // CSV Exporters for the specific reports
  const exportDailyCsv = () => {
    const headers = ['Product Name', 'SKU', 'Barcode', 'Category', 'Quantity Sold', 'Total Revenue', 'Avg Unit Price'];
    const rows = dailyReport.productBreakdown.map((p) => [
      `"${p.productName.replace(/"/g, '""')}"`,
      p.sku,
      p.barcode,
      `"${p.category}"`,
      p.quantitySold,
      p.totalRevenue.toFixed(2),
      p.averagePrice.toFixed(2)
    ]);
    const summary = [
      [],
      ['Summary', '', '', '', '', '', ''],
      ['Date', dailyReport.date, '', '', '', '', ''],
      ['Total Transactions', dailyReport.totalTransactions, '', '', '', '', ''],
      ['Total Items Sold', dailyReport.totalItemsSold, '', '', '', '', ''],
      ['Total Revenue', dailyReport.totalRevenue.toFixed(2), '', '', '', '', '']
    ];
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(',')), ...summary.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daily-Sales-Report-${dailyReport.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWeeklyCsv = () => {
    const headers = ['Day', 'Date', 'Transactions', 'Items Sold', 'Total Revenue'];
    const rows = weeklyReport.dailyTotals.map((d) => [
      d.dayName,
      d.date,
      d.totalTransactions,
      d.totalItemsSold,
      d.totalRevenue.toFixed(2)
    ]);
    const prodHeaders = ['', '', '', '', ''];
    const prodTitle = ['Product Sales Breakdown', '', '', '', ''];
    const prodCols = ['Product Name', 'SKU', 'Barcode', 'Quantity Sold', 'Total Revenue'];
    const prodRows = weeklyReport.productBreakdown.map((p) => [
      `"${p.productName.replace(/"/g, '""')}"`,
      p.sku,
      p.barcode,
      p.quantitySold,
      p.totalRevenue.toFixed(2)
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      prodHeaders.join(','),
      prodTitle.join(','),
      prodCols.join(','),
      ...prodRows.map((r) => r.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Weekly-Sales-Report-${weeklyReport.startDate}_to_${weeklyReport.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMonthlyCsv = () => {
    const headers = ['Date', 'Day', 'Transactions', 'Items Sold', 'Revenue'];
    const rows = monthlyReport.dailyBreakdown.map((d) => [
      d.date,
      d.dayName,
      d.totalTransactions,
      d.totalItemsSold,
      d.totalRevenue.toFixed(2)
    ]);
    const prodHeaders = ['', '', '', '', ''];
    const prodTitle = ['Product Sales Breakdown', '', '', '', ''];
    const prodCols = ['Product Name', 'SKU', 'Barcode', 'Quantity Sold', 'Total Revenue'];
    const prodRows = monthlyReport.productBreakdown.map((p) => [
      `"${p.productName.replace(/"/g, '""')}"`,
      p.sku,
      p.barcode,
      p.quantitySold,
      p.totalRevenue.toFixed(2)
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      prodHeaders.join(','),
      prodTitle.join(','),
      prodCols.join(','),
      ...prodRows.map((r) => r.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Monthly-Sales-Report-${monthlyYear}-${String(monthlyMonth).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-y-auto bg-[#0a0a0c] text-[#f4efe8] space-y-5">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#f5d77f]">Sales & Financial Reports</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/35">
              Live Audited
            </span>
          </div>
          <p className="text-xs text-[#998b7a] mt-0.5">
            Real-time daily, weekly, and monthly reports calculated directly from recorded sales transactions.
          </p>
        </div>

        {/* Report Tab Selector */}
        <div className="grid grid-cols-3 sm:flex items-center bg-[#141417] p-1 rounded-2xl border border-[#26221c] w-full sm:w-auto">
          {[
            { id: 'daily', label: 'Daily Report' },
            { id: 'weekly', label: 'Weekly Report' },
            { id: 'monthly', label: 'Monthly Report' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportTab(tab.id as typeof reportTab)}
              className={`px-3 py-2 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                reportTab === tab.id
                  ? 'bg-[#d4af37] text-black font-bold shadow-xs'
                  : 'text-[#c4bbb0] hover:text-[#f4efe8] hover:bg-[#1f1f26]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. DAILY REPORT SECTION */}
      {/* ======================================================== */}
      {reportTab === 'daily' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Daily Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141417] p-3.5 rounded-2xl border border-[#26221c]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#8c8273]">Select Date:</span>
              <div className="relative">
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => e.target.value && setDailyDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#18181d] border border-[#2a261f] text-xs font-semibold text-[#f4efe8] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <button
                onClick={() => setDailyDate(storage.toLocalDateString(new Date()))}
                className="px-2.5 py-1.5 rounded-xl bg-[#1f1f26] hover:bg-[#282832] text-xs text-[#f5d77f] font-medium border border-[#2a261f] cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => setDailyDate(storage.toLocalDateString(new Date(Date.now() - 86400000)))}
                className="px-2.5 py-1.5 rounded-xl bg-[#1f1f26] hover:bg-[#282832] text-xs text-[#c4bbb0] hover:text-[#f4efe8] font-medium border border-[#2a261f] cursor-pointer"
              >
                Yesterday
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#a39c90] hidden sm:inline font-medium">
                {dailyReport.formattedDate}
              </span>
              <button
                onClick={exportDailyCsv}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:brightness-110 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>Export Daily CSV</span>
              </button>
            </div>
          </div>

          {/* 4 Daily KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Revenue</span>
                <TrendingUp className="w-4 h-4 text-[#f5d77f]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f5d77f]">
                {settings.currencySymbol} {dailyReport.totalRevenue.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Daily gross sales revenue
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Transactions</span>
                <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f4efe8]">
                {dailyReport.totalTransactions}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Completed checkouts
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Items Sold</span>
                <Package className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f4efe8]">
                {dailyReport.totalItemsSold}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Units dispensed from catalog
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Ticket Value</span>
                <Award className="w-4 h-4 text-[#f5d77f]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f5d77f]">
                {settings.currencySymbol} {dailyReport.averageTransactionValue.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Average spend per customer
              </div>
            </div>
          </div>

          {/* Breakdown Section: Products, Payments, Staff */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Sales Breakdown by Product (2 Columns wide on desktop) */}
            <div className="lg:col-span-2 rounded-2xl bg-[#141417] border border-[#26221c] overflow-hidden flex flex-col shadow-2xs">
              <div className="p-4 border-b border-[#26221c] bg-[#18181d] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-[#f5d77f]">Sales Breakdown by Product</h3>
                  <p className="text-[11px] text-[#8c8273]">
                    Quantity and revenue generated by each stationery item today
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141417] text-[#a39c90] border border-[#26221c]">
                  {dailyReport.productBreakdown.length} products sold
                </span>
              </div>

              <div className="flex-1 overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#1a1a20] text-[#8c8273] font-medium border-b border-[#26221c]">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-2 font-mono">Barcode</th>
                      <th className="py-2.5 px-2 text-center">Qty Sold</th>
                      <th className="py-2.5 px-2 text-right">Avg Price</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26221c]">
                    {dailyReport.productBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-[#8c8273]">
                          No products sold on this date.
                        </td>
                      </tr>
                    ) : (
                      dailyReport.productBreakdown.map((p) => (
                        <tr key={p.productId} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3">
                            <div className="font-medium text-[#f4efe8]">{p.productName}</div>
                            <div className="font-mono text-[10px] text-[#8c8273]">SKU: {p.sku} · {p.category}</div>
                          </td>
                          <td className="py-2 px-2 font-mono text-[11px] text-[#a39c90]">{p.barcode}</td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-[#f5d77f]">
                            {p.quantitySold}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-[#a39c90]">
                            {settings.currencySymbol} {p.averagePrice.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#f4efe8]">
                            {settings.currencySymbol} {p.totalRevenue.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Payment Methods & Staff Breakdown */}
            <div className="space-y-4">
              {/* Payment Methods Breakdown */}
              <div className="rounded-2xl bg-[#141417] border border-[#26221c] p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#26221c] pb-2">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#f5d77f]" />
                    <h3 className="font-bold text-xs text-[#f5d77f]">Payment-Method Breakdown</h3>
                  </div>
                </div>

                <div className="space-y-2">
                  {dailyReport.paymentMethodBreakdown.map((pm) => (
                    <div key={pm.method} className="p-2.5 rounded-xl bg-[#18181d] border border-[#2a261f] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#f4efe8]">{pm.label}</span>
                        <span className="font-mono font-bold text-[#f5d77f]">
                          {settings.currencySymbol} {pm.totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#8c8273]">
                        <span>{pm.count} {pm.count === 1 ? 'sale' : 'sales'}</span>
                        <span className="font-mono">{pm.percentage}%</span>
                      </div>
                      {/* Visual progress bar */}
                      <div className="h-1 rounded-full bg-[#26221c] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#d4af37] to-[#f5d77f]"
                          style={{ width: `${Math.min(100, pm.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales by Staff / User */}
              <div className="rounded-2xl bg-[#141417] border border-[#26221c] p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#26221c] pb-2">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#f5d77f]" />
                    <h3 className="font-bold text-xs text-[#f5d77f]">Sales by Staff Member</h3>
                  </div>
                </div>

                <div className="space-y-2">
                  {dailyReport.staffBreakdown.length === 0 ? (
                    <div className="text-center py-4 text-xs text-[#8c8273]">
                      No staff sales recorded today.
                    </div>
                  ) : (
                    dailyReport.staffBreakdown.map((staff) => (
                      <div key={staff.staffId} className="p-2.5 rounded-xl bg-[#18181d] border border-[#2a261f] space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#f4efe8]">{staff.staffName}</span>
                          <span className="font-mono font-bold text-[#f5d77f]">
                            {settings.currencySymbol} {staff.totalRevenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#8c8273]">
                          <span>{staff.transactionsCount} checkouts</span>
                          <span>{staff.itemsSold} items sold</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. WEEKLY REPORT SECTION */}
      {/* ======================================================== */}
      {reportTab === 'weekly' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Weekly Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141417] p-3.5 rounded-2xl border border-[#26221c]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#8c8273]">Select Week Reference:</span>
              <input
                type="date"
                value={weeklyDate}
                onChange={(e) => e.target.value && setWeeklyDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#18181d] border border-[#2a261f] text-xs font-semibold text-[#f4efe8] focus:outline-none focus:border-[#d4af37]"
              />

              <button
                onClick={() => setWeeklyDate(storage.toLocalDateString(new Date()))}
                className="px-2.5 py-1.5 rounded-xl bg-[#1f1f26] hover:bg-[#282832] text-xs text-[#f5d77f] font-medium border border-[#2a261f] cursor-pointer"
              >
                Current Week
              </button>
              <button
                onClick={() => setWeeklyDate(storage.toLocalDateString(new Date(Date.now() - 7 * 86400000)))}
                className="px-2.5 py-1.5 rounded-xl bg-[#1f1f26] hover:bg-[#282832] text-xs text-[#c4bbb0] hover:text-[#f4efe8] font-medium border border-[#2a261f] cursor-pointer"
              >
                Previous Week
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#f5d77f] font-bold font-mono">
                Week: {weeklyReport.label}
              </span>
              <button
                onClick={exportWeeklyCsv}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:brightness-110 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>Export Weekly CSV</span>
              </button>
            </div>
          </div>

          {/* 4 Weekly KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Weekly Revenue</span>
                <TrendingUp className="w-4 h-4 text-[#f5d77f]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f5d77f]">
                {settings.currencySymbol} {weeklyReport.totalRevenue.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Gross total across 7 days
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Transactions</span>
                <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f4efe8]">
                {weeklyReport.totalTransactions}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Sales checkouts recorded
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Items Sold</span>
                <Package className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f4efe8]">
                {weeklyReport.totalItemsSold}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Total items dispensed
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Daily Average</span>
                <Award className="w-4 h-4 text-[#f5d77f]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f5d77f]">
                {settings.currencySymbol} {weeklyReport.averageDailyRevenue.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Average daily store volume
              </div>
            </div>
          </div>

          {/* Daily Sales Totals Chart & Table (Monday - Sunday) */}
          <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#26221c] pb-2">
              <div>
                <h3 className="font-bold text-sm text-[#f5d77f]">Daily Sales Totals (Monday to Sunday)</h3>
                <p className="text-xs text-[#8c8273]">
                  Day-by-day sales revenue and checkout count for the selected week
                </p>
              </div>
            </div>

            {/* Daily Totals Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181d] text-[#8c8273] font-medium border-b border-[#26221c]">
                  <tr>
                    <th className="py-2.5 px-3">Day of Week</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Transactions</th>
                    <th className="py-2.5 px-3 text-center">Items Sold</th>
                    <th className="py-2.5 px-3 text-right">Daily Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26221c]">
                  {weeklyReport.dailyTotals.map((d) => (
                    <tr key={d.date} className="hover:bg-white/[0.02]">
                      <td className="py-2 px-3 font-semibold text-[#f5d77f]">{d.dayName}</td>
                      <td className="py-2 px-3 text-[#a39c90] font-mono">{d.shortDate} ({d.date})</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-[#f4efe8]">{d.totalTransactions}</td>
                      <td className="py-2 px-3 text-center font-mono text-[#c4bbb0]">{d.totalItemsSold}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#f5d77f]">
                        {settings.currencySymbol} {d.totalRevenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recharts Bar Chart: Daily Totals */}
            <div className="w-full h-56 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyReport.dailyTotals} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26221c" vertical={false} />
                  <XAxis dataKey="dayName" stroke="#8c8273" tick={{ fill: '#a39c90', fontSize: 11 }} />
                  <YAxis stroke="#8c8273" tick={{ fill: '#a39c90', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#141417', borderColor: '#26221c', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val: unknown) => [`${settings.currencySymbol} ${Number(val || 0).toFixed(2)}`, 'Revenue']}
                  />
                  <Bar dataKey="totalRevenue" fill="#d4af37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Best-Selling Products & Weekly Staff */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Best-Selling Products */}
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#26221c] pb-2">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#f5d77f]" />
                  <h3 className="font-bold text-xs text-[#f5d77f]">Best-Selling Products (by Quantity)</h3>
                </div>
              </div>

              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181d] text-[#8c8273] border-b border-[#26221c]">
                    <tr>
                      <th className="py-2 px-2 text-center">Rank</th>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-2 text-center">Units Sold</th>
                      <th className="py-2 px-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26221c]">
                    {weeklyReport.bestSellingProducts.slice(0, 10).map((p, idx) => (
                      <tr key={p.productId} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-2 text-center font-mono font-bold text-[#8c8273]">#{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-medium text-[#f4efe8]">{p.productName}</div>
                          <div className="font-mono text-[10px] text-[#8c8273]">SKU: {p.sku}</div>
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-[#f5d77f]">{p.quantitySold}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#f4efe8]">
                          {settings.currencySymbol} {p.totalRevenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales by Staff & Payment Breakdown */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] space-y-3 shadow-2xs">
                <div className="flex items-center gap-1.5 border-b border-[#26221c] pb-2">
                  <User className="w-3.5 h-3.5 text-[#f5d77f]" />
                  <h3 className="font-bold text-xs text-[#f5d77f]">Weekly Sales by Staff Member</h3>
                </div>
                <div className="space-y-2">
                  {weeklyReport.staffBreakdown.map((staff) => (
                    <div key={staff.staffId} className="p-2.5 rounded-xl bg-[#18181d] border border-[#2a261f] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#f4efe8]">{staff.staffName}</span>
                        <span className="font-mono font-bold text-[#f5d77f]">
                          {settings.currencySymbol} {staff.totalRevenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#8c8273]">
                        <span>{staff.transactionsCount} checkouts recorded</span>
                        <span>{staff.itemsSold} items sold</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 border-b border-[#26221c] pb-2">
                  <CreditCard className="w-3.5 h-3.5 text-[#f5d77f]" />
                  <h3 className="font-bold text-xs text-[#f5d77f]">Weekly Payment Distribution</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {weeklyReport.paymentMethodBreakdown.map((pm) => (
                    <div key={pm.method} className="p-2.5 rounded-xl bg-[#18181d] border border-[#2a261f]">
                      <div className="text-[10px] text-[#8c8273] uppercase">{pm.label}</div>
                      <div className="font-mono font-bold text-xs text-[#f5d77f]">
                        {settings.currencySymbol} {pm.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#8c8273] mt-0.5">{pm.count} sales ({pm.percentage}%)</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MONTHLY REPORT SECTION */}
      {/* ======================================================== */}
      {reportTab === 'monthly' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Monthly Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141417] p-3.5 rounded-2xl border border-[#26221c]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#8c8273]">Select Month & Year:</span>
              <select
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-[#18181d] border border-[#2a261f] text-xs font-semibold text-[#f4efe8] focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((name, idx) => (
                  <option key={name} value={idx + 1} className="bg-[#141417]">
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={monthlyYear}
                onChange={(e) => setMonthlyYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-[#18181d] border border-[#2a261f] text-xs font-semibold text-[#f4efe8] focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-[#141417]">
                    {y}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  const curr = new Date();
                  setMonthlyYear(curr.getFullYear());
                  setMonthlyMonth(curr.getMonth() + 1);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#1f1f26] hover:bg-[#282832] text-xs text-[#f5d77f] font-medium border border-[#2a261f] cursor-pointer"
              >
                Current Month
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#f5d77f] font-bold">
                {monthlyReport.monthName}
              </span>
              <button
                onClick={exportMonthlyCsv}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:brightness-110 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>Export Monthly CSV</span>
              </button>
            </div>
          </div>

          {/* 4 Monthly KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Monthly Revenue</span>
                <TrendingUp className="w-4 h-4 text-[#f5d77f]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f5d77f]">
                {settings.currencySymbol} {monthlyReport.totalRevenue.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Total revenue in {monthlyReport.monthName}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Transactions</span>
                <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f4efe8]">
                {monthlyReport.totalTransactions}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Total retail sales recorded
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Items Sold</span>
                <Package className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f4efe8]">
                {monthlyReport.totalItemsSold}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Stationery units sold
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#8c8273]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Daily Average</span>
                <Award className="w-4 h-4 text-[#f5d77f]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#f5d77f]">
                {settings.currencySymbol} {monthlyReport.averageDailyRevenue.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#8c8273]">
                Average daily performance
              </div>
            </div>
          </div>

          {/* Daily Sales Breakdown across the month */}
          <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#26221c] pb-2">
              <div>
                <h3 className="font-bold text-sm text-[#f5d77f]">Daily Sales Breakdown</h3>
                <p className="text-xs text-[#8c8273]">
                  Revenue, transactions, and items sold for each calendar day of {monthlyReport.monthName}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#1a1a20] text-[#8c8273] font-medium border-b border-[#26221c]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3 text-center">Transactions</th>
                    <th className="py-2.5 px-3 text-center">Items Sold</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26221c]">
                  {monthlyReport.dailyBreakdown.map((d) => (
                    <tr key={d.date} className="hover:bg-white/[0.02]">
                      <td className="py-2 px-3 font-mono font-medium text-[#f4efe8]">{d.shortDate}</td>
                      <td className="py-2 px-3 text-[#a39c90]">{d.dayName}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-[#f5d77f]">
                        {d.totalTransactions > 0 ? d.totalTransactions : <span className="text-[#665b4d] font-normal">0</span>}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[#c4bbb0]">
                        {d.totalItemsSold > 0 ? d.totalItemsSold : <span className="text-[#665b4d]">0</span>}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#f5d77f]">
                        {d.totalRevenue > 0 ? `${settings.currencySymbol} ${d.totalRevenue.toFixed(2)}` : <span className="text-[#665b4d] font-normal">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Sales Breakdown & Best Selling Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Product Breakdown */}
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#26221c] pb-2">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#f5d77f]" />
                  <h3 className="font-bold text-xs text-[#f5d77f]">Product Sales Breakdown (Revenue)</h3>
                </div>
              </div>

              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181d] text-[#8c8273] border-b border-[#26221c]">
                    <tr>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-2 text-center">Qty Sold</th>
                      <th className="py-2 px-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26221c]">
                    {monthlyReport.productBreakdown.map((p) => (
                      <tr key={p.productId} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-3">
                          <div className="font-medium text-[#f4efe8]">{p.productName}</div>
                          <div className="font-mono text-[10px] text-[#8c8273]">Barcode: {p.barcode}</div>
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-[#f5d77f]">{p.quantitySold}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#f4efe8]">
                          {settings.currencySymbol} {p.totalRevenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Best Selling Products (Quantity) & Staff Breakdown */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] space-y-3 shadow-2xs">
                <div className="flex items-center gap-1.5 border-b border-[#26221c] pb-2">
                  <Award className="w-4 h-4 text-[#f5d77f]" />
                  <h3 className="font-bold text-xs text-[#f5d77f]">Best-Selling Products (Quantity Sold)</h3>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {monthlyReport.bestSellingProducts.slice(0, 5).map((p, idx) => (
                    <div key={p.productId} className="p-2.5 rounded-xl bg-[#18181d] border border-[#2a261f] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#d4af37]/20 text-[#f5d77f] text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-medium text-xs text-[#f4efe8] max-w-[200px] truncate">{p.productName}</div>
                          <div className="text-[10px] text-[#8c8273] font-mono">{p.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-[#f5d77f] block">{p.quantitySold} sold</span>
                        <span className="font-mono text-[10px] text-[#8c8273]">{settings.currencySymbol} {p.totalRevenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Staff Breakdown */}
              <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 border-b border-[#26221c] pb-2">
                  <User className="w-3.5 h-3.5 text-[#f5d77f]" />
                  <h3 className="font-bold text-xs text-[#f5d77f]">Sales by Staff Member (Month)</h3>
                </div>
                <div className="space-y-1.5">
                  {monthlyReport.staffBreakdown.map((staff) => (
                    <div key={staff.staffId} className="p-2.5 rounded-xl bg-[#18181d] border border-[#2a261f] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-[#f4efe8]">{staff.staffName}</div>
                        <div className="text-[10px] text-[#8c8273]">{staff.transactionsCount} checkouts · {staff.itemsSold} items</div>
                      </div>
                      <span className="font-mono font-bold text-[#f5d77f]">
                        {settings.currencySymbol} {staff.totalRevenue.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
