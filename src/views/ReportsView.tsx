import React, { useState, useMemo } from 'react';
import { storage } from '../services/storage';
import { LOW_STOCK_THRESHOLD } from '../types';
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
  ArrowUpRight,
  FileText,
  Wallet,
  AlertTriangle,
  Receipt
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
import {
  exportDailySalesReportPDF,
  exportWeeklySalesReportPDF,
  exportMonthlySalesReportPDF,
  exportSalesHistoryPDF,
  exportInventoryReportPDF,
  exportLowStockReportPDF,
  exportExpenseReportPDF,
  exportCreditAccountsReportPDF,
  exportPaymentMethodsReportPDF
} from '../services/pdfReportGenerator';

export const ReportsView: React.FC = () => {
  const settings = storage.getSettings();
  const [reportTab, setReportTab] = useState<'daily' | 'weekly' | 'monthly' | 'export_hub'>('daily');

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

  const allProducts = useMemo(() => storage.getProducts(), []);
  const allSales = useMemo(() => storage.getSales(), []);
  const allExpenses = useMemo(() => storage.getExpenses(), []);
  const allCreditAccounts = useMemo(() => storage.getCreditAccounts(), []);

  // Structured PDF Exporters for all reports
  const handleExportDailyPDF = () => {
    exportDailySalesReportPDF(dailyReport, settings);
  };

  const handleExportWeeklyPDF = () => {
    exportWeeklySalesReportPDF(weeklyReport, settings);
  };

  const handleExportMonthlyPDF = () => {
    exportMonthlySalesReportPDF(monthlyReport, settings);
  };

  const handleExportSalesHistoryPDF = () => {
    exportSalesHistoryPDF(allSales, 'Complete Transaction Ledger (All Time)', settings);
  };

  const handleExportInventoryPDF = () => {
    exportInventoryReportPDF(allProducts, settings);
  };

  const handleExportLowStockPDF = () => {
    exportLowStockReportPDF(allProducts, settings);
  };

  const handleExportExpensePDF = () => {
    exportExpenseReportPDF(allExpenses, settings);
  };

  const handleExportCreditAccountsPDF = () => {
    exportCreditAccountsReportPDF(allCreditAccounts, settings);
  };

  const handleExportPaymentMethodsPDF = () => {
    exportPaymentMethodsReportPDF(allSales, 'All Recorded Transactions', settings);
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
            Real-time daily, weekly, monthly, and catalog reports calculated directly from recorded retail transactions.
          </p>
        </div>

        {/* Report Tab Selector */}
        <div className="grid grid-cols-2 sm:flex items-center bg-[#141417] p-1 rounded-2xl border border-[#26221c] w-full sm:w-auto gap-1">
          {[
            { id: 'daily', label: 'Daily Report' },
            { id: 'weekly', label: 'Weekly Report' },
            { id: 'monthly', label: 'Monthly Report' },
            { id: 'export_hub', label: 'All PDF Reports Hub' }
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
                type="button"
                onClick={handleExportDailyPDF}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:brightness-110 cursor-pointer transition-all active:scale-95"
                title="Download formatted Daily Sales PDF Report"
              >
                <FileText className="w-3.5 h-3.5 text-black" />
                <span>Export Daily PDF</span>
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
                  <h3 className="font-bold text-xs text-[#f5d77f]">Sales Breakdown by Product & Service</h3>
                  <p className="text-[11px] text-[#8c8273]">
                    Quantity and revenue generated by each stationery product and commercial service today
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141417] text-[#a39c90] border border-[#26221c]">
                  {dailyReport.productBreakdown.length} items sold
                </span>
              </div>

              <div className="flex-1 overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#1a1a20] text-[#8c8273] font-medium border-b border-[#26221c]">
                    <tr>
                      <th className="py-2.5 px-3">Item / Service Name</th>
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
                          No products or services sold on this date.
                        </td>
                      </tr>
                    ) : (
                      dailyReport.productBreakdown.map((p) => (
                        <tr key={p.productId} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3">
                            <div className="font-medium text-[#f4efe8] flex items-center gap-1.5">
                              <span>{p.productName}</span>
                              {p.category === 'Services' && (
                                <span className="px-1.5 py-0.2 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 text-[9px] font-mono">
                                  Service
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[10px] text-[#8c8273]">SKU: {p.sku} · {p.category}</div>
                          </td>
                          <td className="py-2 px-2 font-mono text-[11px] text-[#a39c90]">
                            {p.barcode || '— (No Barcode)'}
                          </td>
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
                type="button"
                onClick={handleExportWeeklyPDF}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:brightness-110 cursor-pointer transition-all active:scale-95"
                title="Download formatted Weekly Sales PDF Report"
              >
                <FileText className="w-3.5 h-3.5 text-black" />
                <span>Export Weekly PDF</span>
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
                type="button"
                onClick={handleExportMonthlyPDF}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:brightness-110 cursor-pointer transition-all active:scale-95"
                title="Download formatted Monthly Sales PDF Report"
              >
                <FileText className="w-3.5 h-3.5 text-black" />
                <span>Export Monthly PDF</span>
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

      {/* ======================================================== */}
      {/* 4. ALL PDF REPORTS HUB SECTION */}
      {/* ======================================================== */}
      {reportTab === 'export_hub' && (
        <div className="space-y-6 animate-in fade-in duration-150 pb-8">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#f5d77f]" />
                <h3 className="text-base font-bold text-[#f5d77f]">PDF Export Center</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/35">
                  All Reports PDF
                </span>
              </div>
              <p className="text-xs text-[#998b7a] mt-1">
                Download publication-ready, professional PDF documents formatted specifically for printing, financial audits, and store management.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8c8273]">
                Standard format: <strong className="text-[#f4efe8]">A4 Portrait PDF</strong>
              </span>
            </div>
          </div>

          {/* Grid of Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Daily Sales PDF */}
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] flex flex-col justify-between shadow-2xs hover:border-[#d4af37]/40 transition-colors space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#f5d77f] border border-[#d4af37]/30">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181d] border border-[#2a261f] text-[#8c8273]">
                    Daily
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#f4efe8]">Daily Sales Report</h4>
                <p className="text-xs text-[#8c8273] leading-relaxed">
                  Gross revenue, order counts, units dispensed, tender channel breakdowns, and item-by-item sales ledger.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-[#8c8273]">Selected: </span>
                  <span className="text-[11px] font-semibold text-[#f5d77f]">{dailyReport.formattedDate}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportDailyPDF}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-2xs hover:brightness-110 cursor-pointer transition-all active:scale-98"
              >
                <FileText className="w-3.5 h-3.5 text-black" />
                <span>Export Daily PDF</span>
              </button>
            </div>

            {/* 2. Weekly Sales PDF */}
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] flex flex-col justify-between shadow-2xs hover:border-[#d4af37]/40 transition-colors space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#f5d77f] border border-[#d4af37]/30">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181d] border border-[#2a261f] text-[#8c8273]">
                    Weekly
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#f4efe8]">Weekly Sales Report</h4>
                <p className="text-xs text-[#8c8273] leading-relaxed">
                  7-day revenue performance, daily pacing, payment breakdown, top stationery lines, and cashier productivity.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-[#8c8273]">Period: </span>
                  <span className="text-[11px] font-semibold text-[#f5d77f]">Week {weeklyReport.label}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportWeeklyPDF}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-2xs hover:brightness-110 cursor-pointer transition-all active:scale-98"
              >
                <FileText className="w-3.5 h-3.5 text-black" />
                <span>Export Weekly PDF</span>
              </button>
            </div>

            {/* 3. Monthly Sales PDF */}
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] flex flex-col justify-between shadow-2xs hover:border-[#d4af37]/40 transition-colors space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#f5d77f] border border-[#d4af37]/30">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181d] border border-[#2a261f] text-[#8c8273]">
                    Monthly
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#f4efe8]">Monthly Sales Report</h4>
                <p className="text-xs text-[#8c8273] leading-relaxed">
                  Full calendar month sales audit with daily revenue breakdown, category shares, and monthly staff revenue rankings.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-[#8c8273]">Month: </span>
                  <span className="text-[11px] font-semibold text-[#f5d77f]">{monthlyReport.monthName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportMonthlyPDF}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-2xs hover:brightness-110 cursor-pointer transition-all active:scale-98"
              >
                <FileText className="w-3.5 h-3.5 text-black" />
                <span>Export Monthly PDF</span>
              </button>
            </div>

            {/* 4. Sales History & Ledger PDF */}
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] flex flex-col justify-between shadow-2xs hover:border-[#d4af37]/40 transition-colors space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#f5d77f] border border-[#d4af37]/30">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181d] border border-[#2a261f] text-[#8c8273]">
                    Ledger
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#f4efe8]">Sales History & Transaction Ledger</h4>
                <p className="text-xs text-[#8c8273] leading-relaxed">
                  Comprehensive audit trail of transactions, customer IDs, cashier names, items sold, and payment methods.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-[#8c8273]">Total Records: </span>
                  <span className="text-[11px] font-semibold text-[#f5d77f]">{allSales.length} Transactions</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportSalesHistoryPDF}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1f1f26] hover:bg-[#282834] text-[#f5d77f] border border-[#2a261f] hover:border-[#d4af37]/50 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-98"
              >
                <FileText className="w-3.5 h-3.5 text-[#f5d77f]" />
                <span>Export Sales History PDF</span>
              </button>
            </div>

            {/* 5. Inventory & Catalog PDF */}
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] flex flex-col justify-between shadow-2xs hover:border-[#d4af37]/40 transition-colors space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#f5d77f] border border-[#d4af37]/30">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181d] border border-[#2a261f] text-[#8c8273]">
                    Catalog
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#f4efe8]">Inventory & Stock Valuation</h4>
                <p className="text-xs text-[#8c8273] leading-relaxed">
                  Active merchandise list, product SKU, barcode numbers, unit cost, retail price, stock levels, and total retail valuation.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-[#8c8273]">Total Catalog: </span>
                  <span className="text-[11px] font-semibold text-[#f5d77f]">{allProducts.length} Items</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportInventoryPDF}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1f1f26] hover:bg-[#282834] text-[#f5d77f] border border-[#2a261f] hover:border-[#d4af37]/50 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-98"
              >
                <FileText className="w-3.5 h-3.5 text-[#f5d77f]" />
                <span>Export Inventory PDF</span>
              </button>
            </div>

            {/* 6. Critical Low Stock Report PDF */}
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] flex flex-col justify-between shadow-2xs hover:border-[#d4af37]/40 transition-colors space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181d] border border-[#2a261f] text-amber-400">
                    Urgent
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#f4efe8]">Low Stock & Reorder Alert</h4>
                <p className="text-xs text-[#8c8273] leading-relaxed">
                  Filtered procurement sheet highlighting stationery items at or below reorder threshold with suggested order units.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-[#8c8273]">Below Threshold: </span>
                  <span className="text-[11px] font-semibold text-amber-400">
                    {allProducts.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length} items
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportLowStockPDF}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1f1f26] hover:bg-[#282834] text-amber-300 border border-amber-500/30 hover:border-amber-400/60 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-98"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>Export Low Stock PDF</span>
              </button>
            </div>

            {/* 7. Store Operational Expenses PDF */}
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] flex flex-col justify-between shadow-2xs hover:border-[#d4af37]/40 transition-colors space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#f5d77f] border border-[#d4af37]/30">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181d] border border-[#2a261f] text-[#8c8273]">
                    Expenses
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#f4efe8]">Store Expenses & Overhead</h4>
                <p className="text-xs text-[#8c8273] leading-relaxed">
                  Operational expenditure records, ink & toner refills, utility bills, maintenance disbursements, and cash register payouts.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-[#8c8273]">Total Expenses: </span>
                  <span className="text-[11px] font-semibold text-[#f5d77f]">{allExpenses.length} Records</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportExpensePDF}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1f1f26] hover:bg-[#282834] text-[#f5d77f] border border-[#2a261f] hover:border-[#d4af37]/50 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-98"
              >
                <FileText className="w-3.5 h-3.5 text-[#f5d77f]" />
                <span>Export Expense PDF</span>
              </button>
            </div>

            {/* 8. Customer Credit Accounts PDF */}
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] flex flex-col justify-between shadow-2xs hover:border-[#d4af37]/40 transition-colors space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#f5d77f] border border-[#d4af37]/30">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181d] border border-[#2a261f] text-[#8c8273]">
                    Credit
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#f4efe8]">Customer Credit & Receivables</h4>
                <p className="text-xs text-[#8c8273] leading-relaxed">
                  Client debtor ledgers, credit limits, available balances, payment histories, and total outstanding receivables.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-[#8c8273]">Registered Accounts: </span>
                  <span className="text-[11px] font-semibold text-[#f5d77f]">{allCreditAccounts.length} Customers</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportCreditAccountsPDF}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1f1f26] hover:bg-[#282834] text-[#f5d77f] border border-[#2a261f] hover:border-[#d4af37]/50 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-98"
              >
                <FileText className="w-3.5 h-3.5 text-[#f5d77f]" />
                <span>Export Credit Accounts PDF</span>
              </button>
            </div>

            {/* 9. Payment Methods Breakdown PDF */}
            <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] flex flex-col justify-between shadow-2xs hover:border-[#d4af37]/40 transition-colors space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 flex items-center justify-center text-[#f5d77f] border border-[#d4af37]/30">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181d] border border-[#2a261f] text-[#8c8273]">
                    Tender
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#f4efe8]">Payment Channels Breakdown</h4>
                <p className="text-xs text-[#8c8273] leading-relaxed">
                  Detailed distribution across Cash, CBE, Telebirr, Awash Bank, Dashen Bank, and Bank of Abyssinia with volume shares.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-[#8c8273]">Payment Channels: </span>
                  <span className="text-[11px] font-semibold text-[#f5d77f]">6 Supported Methods</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportPaymentMethodsPDF}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1f1f26] hover:bg-[#282834] text-[#f5d77f] border border-[#2a261f] hover:border-[#d4af37]/50 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-98"
              >
                <FileText className="w-3.5 h-3.5 text-[#f5d77f]" />
                <span>Export Payment Methods PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
