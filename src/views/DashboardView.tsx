import React, { useMemo, useState } from 'react';
import { storage } from '../services/storage';
import { Sale, Product } from '../types';
import { NavTab } from '../components/Sidebar';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Package,
  Camera,
  History,
  ShieldCheck,
  Clock,
  Printer,
  BarChart3,
  Flame,
  PlusCircle,
  Calendar,
  Layers,
  Wallet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenScanner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenScanner
}) => {
  const sales = storage.getSales();
  const products = storage.getProducts();
  const settings = storage.getSettings();
  const metrics = storage.getDashboardSalesMetrics();

  const [areaChartMode, setAreaChartMode] = useState<'daily' | 'cumulative'>('daily');

  const todayStr = new Date().toDateString();
  const todaySales = sales.filter(
    (s) => s.status !== 'refunded' && new Date(s.timestamp).toDateString() === todayStr
  );

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

  // Payment method metrics breakdown for Today's Sales
  const todayPaymentBreakdown = useMemo(() => {
    const methods: Record<string, { label: string; count: number; amount: number; badgeColor: string }> = {
      cash: { label: 'Cash', count: 0, amount: 0, badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
      cbe: { label: 'CBE (Commercial Bank)', count: 0, amount: 0, badgeColor: 'text-purple-400 bg-purple-950/40 border-purple-800/50' },
      telebirr: { label: 'Telebirr', count: 0, amount: 0, badgeColor: 'text-sky-400 bg-sky-950/40 border-sky-800/50' },
      awash_bank: { label: 'Awash Bank', count: 0, amount: 0, badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/50' },
      dashen_bank: { label: 'Dashen Bank', count: 0, amount: 0, badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-800/50' },
      bank_of_abyssinia: { label: 'Bank of Abyssinia', count: 0, amount: 0, badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-800/50' }
    };

    todaySales.forEach((sale) => {
      sale.payments.forEach((p) => {
        let key = p.method;
        if (key === 'card') key = 'cbe';
        if (key === 'mobile_transfer') key = 'telebirr';
        if (!methods[key]) {
          methods[key] = { label: p.method, count: 0, amount: 0, badgeColor: 'text-zinc-400 bg-zinc-900 border-zinc-700' };
        }
        methods[key].count += 1;
        methods[key].amount += p.amount;
      });
    });

    return Object.entries(methods).map(([key, data]) => ({ key, ...data }));
  }, [todaySales]);

  const lowStockItems = products.filter((p) => p.stock <= p.minThreshold);
  const recentSales = sales.slice(0, 5);

  // 7-day daily sales revenue trend
  const dailySalesData = useMemo(() => {
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

      const dayLabel =
        i === 0
          ? 'Today'
          : i === 1
          ? 'Yesterday'
          : d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
      const fullDateLabel = d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Filter non-refunded sales matching this day
      const daySales = sales.filter((s) => {
        if (s.status === 'refunded') return false;
        const saleTime = new Date(s.timestamp).getTime();
        return saleTime >= startOfDay && saleTime <= endOfDay;
      });

      const revenue = Number(daySales.reduce((sum, s) => sum + s.total, 0).toFixed(2));

      days.push({
        dayKey: d.toISOString().split('T')[0],
        dayLabel,
        fullDateLabel,
        revenue,
        transactionCount: daySales.length,
        isToday: i === 0
      });
    }

    return days;
  }, [sales]);

  const total7DayRevenue = useMemo(() => {
    return dailySalesData.reduce((sum, d) => sum + d.revenue, 0);
  }, [dailySalesData]);

  const total7DayTransactions = useMemo(() => {
    return dailySalesData.reduce((sum, d) => sum + d.transactionCount, 0);
  }, [dailySalesData]);

  const averageDailyRevenue = useMemo(() => {
    return total7DayRevenue / 7;
  }, [total7DayRevenue]);

  // Month-over-Month Sales Trend Data (Current Month vs Previous Month)
  const monthlyComparisonData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth(); // 0-indexed
    const todayDate = now.getDate();

    const prevMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
    const prevYear = currentMonthIdx === 0 ? currentYear - 1 : currentYear;

    const daysInCurrentMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
    const daysInPrevMonth = new Date(prevYear, prevMonthIdx + 1, 0).getDate();
    const maxDays = Math.max(daysInCurrentMonth, daysInPrevMonth);

    const currentMonthName = now.toLocaleString(undefined, { month: 'long' });
    const currentMonthShort = now.toLocaleString(undefined, { month: 'short' });
    const prevMonthName = new Date(prevYear, prevMonthIdx, 1).toLocaleString(undefined, { month: 'long' });
    const prevMonthShort = new Date(prevYear, prevMonthIdx, 1).toLocaleString(undefined, { month: 'short' });

    let runningCurrent = 0;
    let runningPrev = 0;

    const points = [];

    for (let day = 1; day <= maxDays; day++) {
      // Previous Month sales on this day
      let prevDaySales = 0;
      let prevTxCount = 0;
      if (day <= daysInPrevMonth) {
        const matchingPrevSales = sales.filter((s) => {
          if (s.status === 'refunded') return false;
          const st = new Date(s.timestamp);
          return (
            st.getFullYear() === prevYear &&
            st.getMonth() === prevMonthIdx &&
            st.getDate() === day
          );
        });
        prevDaySales = Number(matchingPrevSales.reduce((sum, s) => sum + s.total, 0).toFixed(2));
        prevTxCount = matchingPrevSales.length;
        runningPrev += prevDaySales;
      }

      // Current Month sales on this day (recorded up to today)
      let currentDaySales: number | null = null;
      let currentTxCount = 0;
      if (day <= todayDate) {
        const matchingCurrSales = sales.filter((s) => {
          if (s.status === 'refunded') return false;
          const st = new Date(s.timestamp);
          return (
            st.getFullYear() === currentYear &&
            st.getMonth() === currentMonthIdx &&
            st.getDate() === day
          );
        });
        currentDaySales = Number(matchingCurrSales.reduce((sum, s) => sum + s.total, 0).toFixed(2));
        currentTxCount = matchingCurrSales.length;
        runningCurrent += currentDaySales;
      }

      points.push({
        dayNumber: day,
        dayLabel: `Day ${day}`,
        currentRevenue: currentDaySales,
        previousRevenue: prevDaySales,
        cumulativeCurrent: currentDaySales !== null ? Number(runningCurrent.toFixed(2)) : null,
        cumulativePrevious: Number(runningPrev.toFixed(2)),
        currentTxCount,
        prevTxCount,
        isFuture: day > todayDate,
        isToday: day === todayDate
      });
    }

    return {
      points,
      currentMonthName,
      currentMonthShort,
      prevMonthName,
      prevMonthShort,
      currentYear,
      prevYear,
      todayDate,
      daysInCurrentMonth,
      daysInPrevMonth
    };
  }, [sales]);

  const momStats = useMemo(() => {
    const today = monthlyComparisonData.todayDate;
    const currentPoints = monthlyComparisonData.points.filter((p) => p.currentRevenue !== null);
    const currentMTD = currentPoints.reduce((sum, p) => sum + (p.currentRevenue || 0), 0);

    const prevPointsSamePeriod = monthlyComparisonData.points.filter((p) => p.dayNumber <= today);
    const prevSamePeriod = prevPointsSamePeriod.reduce((sum, p) => sum + (p.previousRevenue || 0), 0);

    const prevFullTotal = monthlyComparisonData.points.reduce((sum, p) => sum + (p.previousRevenue || 0), 0);

    const growthDiff = currentMTD - prevSamePeriod;
    const growthPercent = prevSamePeriod > 0 ? (growthDiff / prevSamePeriod) * 100 : 0;

    return {
      currentMTD: Number(currentMTD.toFixed(2)),
      prevSamePeriod: Number(prevSamePeriod.toFixed(2)),
      prevFullTotal: Number(prevFullTotal.toFixed(2)),
      growthDiff: Number(growthDiff.toFixed(2)),
      growthPercent: Number(growthPercent.toFixed(1))
    };
  }, [monthlyComparisonData]);

  // Top 10 items approaching or below their minimum thresholds
  const criticalStockData = useMemo(() => {
    return [...products]
      .map((p) => {
        const diff = p.stock - p.minThreshold;
        return {
          id: p.id,
          fullName: p.name,
          name: p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name,
          sku: p.sku,
          category: p.category,
          unit: p.unit,
          stock: p.stock,
          minThreshold: p.minThreshold,
          diff,
          isDepleted: p.stock <= 0,
          isCritical: p.stock <= p.minThreshold
        };
      })
      .sort((a, b) => a.diff - b.diff || a.stock - b.stock)
      .slice(0, 10);
  }, [products]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-y-auto bg-[#0a0a0c] text-[#f4efe8] space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <h2 className="text-xl font-bold text-[#f5d77f]">
            Welcome to {settings.storeName}
          </h2>
          <p className="text-xs text-[#a39c90]">
            Stationery retail POS counter overview, live cash balance & inventory alert status.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('pos')}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] hover:brightness-110 text-black flex items-center gap-1.5 shadow-sm shadow-[#d4af37]/20 transition-all active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-black" />
            <span>Launch POS Register</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#d4af37]/15 text-[#f5d77f] border border-[#d4af37]/30 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Scan Code</span>
          </button>

          <button
            onClick={() => onNavigate('sales')}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#d4af37]/15 text-[#f5d77f] border border-[#d4af37]/30 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Sales History</span>
          </button>
        </div>
      </div>

      {/* 6 Executive Metric KPI Cards (Calculated directly from recorded transactions) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Metric 1: Today's Sales */}
        <div className="p-3.5 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-1 hover:border-[#d4af37]/40 transition-colors">
          <div className="flex items-center justify-between text-[#a39c90]">
            <span className="text-[10px] font-semibold uppercase tracking-wider truncate">
              Today&apos;s Sales
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-[#f5d77f] shrink-0" />
          </div>
          <div className="text-xl font-bold font-mono text-[#f5d77f] truncate">
            {settings.currencySymbol} {metrics.todaySales.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#8c8273] truncate">
            Gross sales today
          </div>
        </div>

        {/* Metric 2: Today's Transactions */}
        <div className="p-3.5 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-1 hover:border-[#d4af37]/40 transition-colors">
          <div className="flex items-center justify-between text-[#a39c90]">
            <span className="text-[10px] font-semibold uppercase tracking-wider truncate">
              Today&apos;s Orders
            </span>
            <ShoppingBag className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
          </div>
          <div className="text-xl font-bold font-mono text-[#f4efe8]">
            {metrics.todayTransactions}
          </div>
          <div className="text-[10px] text-[#8c8273] truncate">
            Transactions today
          </div>
        </div>

        {/* Metric 3: This Week's Sales */}
        <div className="p-3.5 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-1 hover:border-[#d4af37]/40 transition-colors">
          <div className="flex items-center justify-between text-[#a39c90]">
            <span className="text-[10px] font-semibold uppercase tracking-wider truncate">
              This Week&apos;s Sales
            </span>
            <Calendar className="w-3.5 h-3.5 text-[#f5d77f] shrink-0" />
          </div>
          <div className="text-xl font-bold font-mono text-[#f5d77f] truncate">
            {settings.currencySymbol} {metrics.thisWeekSales.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#8c8273] truncate">
            {metrics.thisWeekTransactions} checkouts this week
          </div>
        </div>

        {/* Metric 4: This Month's Sales */}
        <div className="p-3.5 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-1 hover:border-[#d4af37]/40 transition-colors">
          <div className="flex items-center justify-between text-[#a39c90]">
            <span className="text-[10px] font-semibold uppercase tracking-wider truncate">
              This Month&apos;s Sales
            </span>
            <Layers className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
          </div>
          <div className="text-xl font-bold font-mono text-[#f5d77f] truncate">
            {settings.currencySymbol} {metrics.thisMonthSales.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#8c8273] truncate">
            {metrics.thisMonthTransactions} monthly sales
          </div>
        </div>

        {/* Metric 5: Total Products Sold */}
        <div className="p-3.5 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-1 hover:border-[#d4af37]/40 transition-colors">
          <div className="flex items-center justify-between text-[#a39c90]">
            <span className="text-[10px] font-semibold uppercase tracking-wider truncate">
              Total Units Sold
            </span>
            <Package className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
          </div>
          <div className="text-xl font-bold font-mono text-[#f4efe8]">
            {metrics.totalProductsSold}
          </div>
          <div className="text-[10px] text-[#8c8273] truncate">
            Catalog items sold
          </div>
        </div>

        {/* Metric 6: Low Stock Products */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-3.5 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-1 cursor-pointer hover:border-amber-500/70 transition-colors"
        >
          <div className="flex items-center justify-between text-[#a39c90]">
            <span className="text-[10px] font-semibold uppercase tracking-wider truncate">
              Low-Stock Warnings
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {metrics.lowStockCount}
          </div>
          <div className="text-[10px] text-[#8c8273] truncate">
            At/below threshold
          </div>
        </div>
      </div>

      {/* Payment Methods Summary Breakdown (Today's Receipts by Channel) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-3 hover:border-[#d4af37]/30 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#26221c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5d77f] flex items-center justify-center shadow-2xs shrink-0">
              <Wallet className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#f4efe8]">
                  Today&apos;s Payment Channels
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/35">
                  Live Tender Breakdown
                </span>
              </div>
              <p className="text-xs text-[#a39c90]">
                Breakdown of receipts across Cash, CBE, Telebirr, and private commercial banks.
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-[#26221c] sm:pl-4">
            <div className="text-[10px] text-[#8c8273]">Today&apos;s Gross Collected</div>
            <div className="font-mono font-bold text-base text-[#f5d77f]">
              {settings.currencySymbol} {todayRevenue.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {todayPaymentBreakdown.map((pm) => (
            <div
              key={pm.key}
              className="p-3 rounded-xl bg-[#18181c] border border-[#2a261f] space-y-1 hover:border-[#d4af37]/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#f4efe8] truncate">
                  {pm.label}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${pm.badgeColor}`}>
                  {pm.count} txn
                </span>
              </div>
              <div className="text-base font-bold font-mono text-[#f5d77f]">
                {settings.currencySymbol} {pm.amount.toFixed(2)}
              </div>
              <div className="text-[10px] text-[#8c8273]">
                {todayRevenue > 0
                  ? `${((pm.amount / todayRevenue) * 100).toFixed(0)}% of today`
                  : '0%'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recharts Line Chart: Daily Sales Revenue (Last 7 Days) */}
      <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-4 hover:border-[#d4af37]/30 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#26221c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5d77f] flex items-center justify-center shadow-2xs shrink-0">
              <TrendingUp className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-[#f4efe8]">
                  Daily Sales Revenue
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/35">
                  Last 7 Days
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1a1714] text-[#a39c90] border border-[#26221c] font-mono">
                  7-Day Total: <strong className="text-[#f5d77f]">{settings.currencySymbol} {total7DayRevenue.toFixed(2)}</strong>
                </span>
              </div>
              <p className="text-xs text-[#a39c90] mt-0.5">
                Plotted total sales revenue across daily retail checkouts over the last 7 days.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-xs pr-2 border-r border-[#26221c]">
              <div className="text-right">
                <div className="text-[10px] text-[#8c8273]">7-Day Volume</div>
                <div className="font-mono font-bold text-[#f4efe8]">
                  {total7DayTransactions} receipts
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#8c8273]">Daily Average</div>
                <div className="font-mono font-bold text-[#f5d77f]">
                  {settings.currencySymbol} {averageDailyRevenue.toFixed(2)}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('sales')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#1a1a20] hover:bg-[#22222a] text-[#f5d77f] border border-[#26221c] hover:border-[#d4af37]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
            </button>
          </div>
        </div>

        {/* Line Chart Container */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dailySalesData}
              margin={{ top: 15, right: 25, left: 10, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#26221c"
                vertical={false}
              />
              <XAxis
                dataKey="dayLabel"
                stroke="#8c8273"
                tick={{ fill: '#a39c90', fontSize: 11 }}
                dy={8}
              />
              <YAxis
                stroke="#8c8273"
                tick={{ fill: '#a39c90', fontSize: 11 }}
                tickFormatter={(val) => `${val}`}
                dx={-5}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(212, 175, 55, 0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#141417] border border-[#d4af37]/60 p-3 rounded-xl shadow-2xl text-xs space-y-2 min-w-[200px] text-[#f4efe8]">
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#26221c]">
                          <span className="font-bold text-[#f5d77f]">{d.dayLabel}</span>
                          {d.isToday && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/40">
                              Live Today
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#8c8273]">
                          {d.fullDateLabel}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[#a39c90]">Sales Revenue:</span>
                          <span className="font-mono font-bold text-sm text-[#f5d77f]">
                            {settings.currencySymbol} {d.revenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#a39c90]">Total Receipts:</span>
                          <span className="font-mono text-[#c4bbb0]">
                            {d.transactionCount} {d.transactionCount === 1 ? 'sale' : 'sales'}
                          </span>
                        </div>
                        {d.transactionCount > 0 && (
                          <div className="flex items-center justify-between text-[10px] text-[#8c8273] pt-0.5">
                            <span>Average Ticket:</span>
                            <span className="font-mono text-[#c4bbb0]">
                              {settings.currencySymbol} {(d.revenue / d.transactionCount).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12 }}
                formatter={(value) => (
                  <span className="text-xs text-[#c4bbb0]">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name={`Daily Sales Revenue (${settings.currencySymbol})`}
                stroke="#f5d77f"
                strokeWidth={3}
                dot={{ fill: '#d4af37', stroke: '#0a0a0c', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, fill: '#f5d77f', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recharts Area Chart: Monthly Sales Trends (Current vs Previous Month) */}
      <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-4 hover:border-[#d4af37]/30 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#26221c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#818cf8]/15 border border-[#818cf8]/30 text-[#818cf8] flex items-center justify-center shadow-2xs shrink-0">
              <Layers className="w-4 h-4 text-[#818cf8]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-[#f4efe8]">
                  Monthly Sales Trend (Area Chart)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/35">
                  {monthlyComparisonData.currentMonthName} vs {monthlyComparisonData.prevMonthName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                    momStats.growthDiff >= 0
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50'
                      : 'bg-rose-950/70 text-rose-300 border-rose-800/50'
                  }`}
                >
                  <span>
                    MoM {momStats.growthDiff >= 0 ? '+' : ''}
                    {momStats.growthPercent}%
                  </span>
                </span>
              </div>
              <p className="text-xs text-[#a39c90] mt-0.5">
                Visualizing sales trajectory over the current month ({monthlyComparisonData.currentMonthName}) compared to the previous month ({monthlyComparisonData.prevMonthName}).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Daily vs Cumulative */}
            <div className="p-1 rounded-xl bg-[#18181c] border border-[#2a261f] flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setAreaChartMode('daily')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  areaChartMode === 'daily'
                    ? 'bg-[#d4af37] text-black shadow-xs font-bold'
                    : 'text-[#a39c90] hover:text-[#f4efe8]'
                }`}
              >
                Daily Sales
              </button>
              <button
                type="button"
                onClick={() => setAreaChartMode('cumulative')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  areaChartMode === 'cumulative'
                    ? 'bg-[#d4af37] text-black shadow-xs font-bold'
                    : 'text-[#a39c90] hover:text-[#f4efe8]'
                }`}
              >
                Cumulative (MTD)
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-3 pl-2 border-l border-[#26221c] text-xs">
              <div className="text-right">
                <div className="text-[10px] text-[#8c8273]">
                  {monthlyComparisonData.currentMonthShort} MTD (Day 1–{monthlyComparisonData.todayDate})
                </div>
                <div className="font-mono font-bold text-[#f5d77f]">
                  {settings.currencySymbol} {momStats.currentMTD.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#8c8273]">
                  {monthlyComparisonData.prevMonthShort} (Same Days)
                </div>
                <div className="font-mono text-[#818cf8] font-bold">
                  {settings.currencySymbol} {momStats.prevSamePeriod.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Area Chart Container */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyComparisonData.points}
              margin={{ top: 15, right: 25, left: 10, bottom: 20 }}
            >
              <defs>
                {/* Current Month Gold Area Gradient */}
                <linearGradient id="currentMonthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f5d77f" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                </linearGradient>
                {/* Previous Month Indigo Area Gradient */}
                <linearGradient id="prevMonthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#26221c"
                vertical={false}
              />
              <XAxis
                dataKey="dayNumber"
                stroke="#8c8273"
                tick={{ fill: '#a39c90', fontSize: 11 }}
                tickFormatter={(d) => `Day ${d}`}
                dy={8}
                interval={2}
              />
              <YAxis
                stroke="#8c8273"
                tick={{ fill: '#a39c90', fontSize: 11 }}
                tickFormatter={(val) => `${val}`}
                dx={-5}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(212, 175, 55, 0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    const isCumulative = areaChartMode === 'cumulative';
                    const currVal = isCumulative ? d.cumulativeCurrent : d.currentRevenue;
                    const prevVal = isCumulative ? d.cumulativePrevious : d.previousRevenue;
                    const hasCurrent = currVal !== null && currVal !== undefined;
                    const diff = hasCurrent ? currVal - prevVal : null;

                    return (
                      <div className="bg-[#141417] border border-[#d4af37]/60 p-3 rounded-xl shadow-2xl text-xs space-y-2 min-w-[220px] text-[#f4efe8]">
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#26221c]">
                          <span className="font-bold text-[#f5d77f]">
                            Day {d.dayNumber} of Month
                          </span>
                          <span className="text-[10px] text-[#a39c90]">
                            {isCumulative ? 'Cumulative Pace' : 'Daily Revenue'}
                          </span>
                        </div>

                        {/* Current Month Row */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#f5d77f] font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#f5d77f]"></span>
                            {monthlyComparisonData.currentMonthName} {monthlyComparisonData.currentYear}:
                          </span>
                          <span className="font-mono font-bold text-[#f5d77f]">
                            {hasCurrent ? `${settings.currencySymbol} ${currVal.toFixed(2)}` : 'Upcoming'}
                          </span>
                        </div>

                        {/* Previous Month Row */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#818cf8] font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#818cf8]"></span>
                            {monthlyComparisonData.prevMonthName} {monthlyComparisonData.prevYear}:
                          </span>
                          <span className="font-mono font-bold text-[#c4bbb0]">
                            {settings.currencySymbol} {prevVal.toFixed(2)}
                          </span>
                        </div>

                        {/* Difference Row if data exists */}
                        {diff !== null && (
                          <div className="pt-1.5 border-t border-[#26221c] flex items-center justify-between text-[11px]">
                            <span className="text-[#a39c90]">Performance Variance:</span>
                            <span
                              className={`font-mono font-bold ${
                                diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {diff >= 0 ? '+' : ''}
                              {settings.currencySymbol} {diff.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {d.isToday && (
                          <div className="pt-1 text-[10px] text-[#f5d77f] font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#d4af37]" />
                            <span>Current Day (Live Store Hours)</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12 }}
                formatter={(value) => (
                  <span className="text-xs text-[#c4bbb0]">{value}</span>
                )}
              />
              {/* Previous Month Area: Layered behind current month */}
              <Area
                type="monotone"
                dataKey={areaChartMode === 'daily' ? 'previousRevenue' : 'cumulativePrevious'}
                name={`${monthlyComparisonData.prevMonthName} ${monthlyComparisonData.prevYear} (Previous Month)`}
                stroke="#818cf8"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#prevMonthAreaGradient)"
              />
              {/* Current Month Area: Layered in front with gold theme */}
              <Area
                type="monotone"
                dataKey={areaChartMode === 'daily' ? 'currentRevenue' : 'cumulativeCurrent'}
                name={`${monthlyComparisonData.currentMonthName} ${monthlyComparisonData.currentYear} (Current Month)`}
                stroke="#f5d77f"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#currentMonthAreaGradient)"
                dot={{ fill: '#d4af37', stroke: '#0a0a0c', strokeWidth: 2, r: 3.5 }}
                activeDot={{ r: 7, fill: '#f5d77f', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recharts Bar Chart: Critical Inventory Levels */}
      <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-4 hover:border-[#d4af37]/30 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#26221c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5d77f] flex items-center justify-center shadow-2xs shrink-0">
              <BarChart3 className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-[#f4efe8]">
                  Critical Inventory Levels
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/35">
                  Top 10 Depleted & At-Risk Items
                </span>
                {lowStockItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-800/50 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>{lowStockItems.length} below threshold</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a39c90] mt-0.5">
                Visualizing physical stock quantities vs minimum reorder thresholds for items closest to replenishment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('inventory')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#1a1a20] hover:bg-[#22222a] text-[#f5d77f] border border-[#26221c] hover:border-[#d4af37]/40 flex items-center gap-1.5 transition-colors"
            >
              <span>Manage Inventory</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        {criticalStockData.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8c8273]">
            No catalog items available to evaluate inventory thresholds.
          </div>
        ) : (
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={criticalStockData}
                margin={{ top: 15, right: 25, left: 0, bottom: 50 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#26221c"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#8c8273"
                  tick={{ fill: '#a39c90', fontSize: 11 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={55}
                />
                <YAxis
                  stroke="#8c8273"
                  tick={{ fill: '#a39c90', fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#141417] border border-[#d4af37]/50 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 max-w-[260px] text-[#f4efe8]">
                          <div className="font-bold text-[#f5d77f] leading-snug">
                            {d.fullName}
                          </div>
                          <div className="text-[10px] text-[#8c8273] font-mono">
                            SKU: {d.sku} · {d.category}
                          </div>
                          <div className="pt-1.5 border-t border-[#26221c] flex items-center justify-between">
                            <span className="text-[#a39c90]">Current Stock:</span>
                            <span
                              className={`font-mono font-bold ${
                                d.isDepleted
                                  ? 'text-rose-400'
                                  : d.isCritical
                                  ? 'text-amber-400'
                                  : 'text-[#f5d77f]'
                              }`}
                            >
                              {d.stock} {d.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#a39c90]">Min Threshold:</span>
                            <span className="font-mono text-[#c4bbb0]">
                              {d.minThreshold} {d.unit}
                            </span>
                          </div>
                          <div className="pt-1">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                d.isDepleted
                                  ? 'bg-rose-950/70 text-rose-300 border border-rose-800/50'
                                  : d.isCritical
                                  ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50'
                                  : 'bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/35'
                              }`}
                            >
                              {d.isDepleted
                                ? '🚨 Depleted (0 in stock)'
                                : d.isCritical
                                ? '⚠️ Below Reorder Threshold'
                                : '⚡ Approaching Threshold'}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 12 }}
                  formatter={(value) => (
                    <span className="text-xs text-[#c4bbb0]">{value}</span>
                  )}
                />
                <Bar
                  dataKey="stock"
                  name="Current Stock"
                  radius={[5, 5, 0, 0]}
                >
                  {criticalStockData.map((entry, index) => {
                    const barColor = entry.isDepleted
                      ? '#ef4444' // Rose for depleted
                      : entry.isCritical
                      ? '#f59e0b' // Amber for low stock
                      : '#d4af37'; // Gold for approaching threshold
                    return <Cell key={`cell-stock-${index}`} fill={barColor} />;
                  })}
                </Bar>
                <Bar
                  dataKey="minThreshold"
                  name="Min Threshold"
                  fill="#3d3528"
                  stroke="#d4af37"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Two columns: Recent Sales Feed & Low Stock Action List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="p-5 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-sm text-[#f4efe8]">
              Recent Recorded Sales
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-[#f5d77f] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Sales History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#26221c]">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                onClick={() => onNavigate('sales')}
                className="py-2.5 flex items-center justify-between text-xs hover:bg-white/[0.02] px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-mono font-bold text-[#f5d77f]">
                    {sale.transactionId || sale.receiptNumber}
                  </div>
                  <div className="text-[10px] text-[#8c8273]">
                    {sale.customerName || 'Walk-in'} · {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'} · {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#f5d77f]">
                    {settings.currencySymbol} {sale.total.toFixed(2)}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1f1f26] text-[#c4bbb0] border border-[#2a261f]">
                    {sale.payments.map((p) => p.method.replace('_', ' ')).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Attention List */}
        <div className="p-5 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-sm text-[#f4efe8] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Low Stock Reorder Alerts</span>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-[#f5d77f] hover:underline flex items-center gap-1"
            >
              <span>Manage Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#26221c]">
            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8c8273]">
                All inventory items are well-stocked above thresholds!
              </div>
            ) : (
              lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-semibold truncate text-[#f4efe8]">{item.name}</div>
                    <div className="text-[10px] text-[#8c8273] font-mono">
                      SKU: {item.sku} · Reorder at: {item.minThreshold} {item.unit}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-400">
                      {item.stock} {item.unit} left
                    </span>
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
