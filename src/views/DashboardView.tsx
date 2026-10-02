import React, { useMemo } from 'react';
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
  PlusCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenReceipt: (sale: Sale) => void;
  onOpenScanner: () => void;
  onOpenShiftModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenReceipt,
  onOpenScanner,
  onOpenShiftModal
}) => {
  const sales = storage.getSales();
  const products = storage.getProducts();
  const activeShift = storage.getActiveShift();
  const settings = storage.getSettings();

  const todayStr = new Date().toDateString();
  const todaySales = sales.filter(
    (s) => s.status !== 'refunded' && new Date(s.timestamp).toDateString() === todayStr
  );

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const lowStockItems = products.filter((p) => p.stock <= p.minThreshold);
  const recentSales = sales.slice(0, 5);

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
            onClick={onOpenShiftModal}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#d4af37]/15 text-[#f5d77f] border border-[#d4af37]/30 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Cash Shift</span>
          </button>
        </div>
      </div>

      {/* 4 Executive Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-1 hover:border-[#d4af37]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a39c90]">
              Today&apos;s Gross Sales
            </span>
            <TrendingUp className="w-4 h-4 text-[#f5d77f]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#f5d77f]">
            {settings.currencySymbol} {todayRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#8c8273]">
            {todaySales.length} retail checkouts today
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-1 hover:border-[#d4af37]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a39c90]">
              Register Cash Drawer
            </span>
            <DollarSign className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#f5d77f]">
            {settings.currencySymbol} {activeShift ? activeShift.expectedCash.toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-[#8c8273]">
            {activeShift ? `Shift #${activeShift.shiftNumber} active` : 'Register drawer closed'}
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-4 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-1 cursor-pointer hover:border-amber-500/70 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a39c90]">
              Low Stock Warnings
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {lowStockItems.length}
          </div>
          <div className="text-[11px] text-[#8c8273]">
            Items at or below reorder threshold
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-4 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-1 cursor-pointer hover:border-[#d4af37]/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a39c90]">
              Catalog Inventory SKUs
            </span>
            <Package className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#f5d77f]">
            {products.length}
          </div>
          <div className="text-[11px] text-[#8c8273]">
            Active stationery items tracked
          </div>
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
              Recent Register Transactions
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-[#f5d77f] hover:underline flex items-center gap-1"
            >
              <span>View Sales Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#26221c]">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-mono font-bold text-[#f5d77f]">
                    {sale.receiptNumber}
                  </div>
                  <div className="text-[10px] text-[#8c8273]">
                    {sale.customerName || 'Walk-in'} · {sale.items.length} items · {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#f5d77f]">
                    {settings.currencySymbol} {sale.total.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onOpenReceipt(sale)}
                    title="Print Receipt"
                    className="p-1 rounded-lg text-[#8c8273] hover:text-[#f5d77f]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
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
