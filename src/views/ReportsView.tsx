import React, { useState } from 'react';
import { storage } from '../services/storage';
import { BarChart3, Download, TrendingUp, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const sales = storage.getSales().filter((s) => s.status !== 'refunded');
  const products = storage.getProducts();
  const settings = storage.getSettings();

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCost = sales.reduce((sum, s) => {
    return sum + s.items.reduce((iSum, item) => iSum + item.costPrice * item.quantity, 0);
  }, 0);
  const grossProfit = totalRevenue - totalCost;
  const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;
  const totalTax = sales.reduce((sum, s) => sum + s.taxAmount, 0);

  // Payment Breakdown
  const paymentBreakdown: Record<string, number> = {};
  sales.forEach((s) => {
    s.payments.forEach((p) => {
      paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + p.amount;
    });
  });

  // Top products
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  sales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.total;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const exportSalesCsv = () => {
    const headers = ['Receipt #', 'Date', 'Cashier', 'Customer', 'Subtotal', 'Tax', 'Total', 'Payment Methods'];
    const rows = sales.map((s) => [
      s.receiptNumber,
      new Date(s.timestamp).toISOString(),
      s.cashierName,
      s.customerName || 'Walk-in',
      s.subtotal.toFixed(2),
      s.taxAmount.toFixed(2),
      s.total.toFixed(2),
      s.payments.map((p) => `${p.method}:${p.amount}`).join(';')
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rahel-POS-Sales-Export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInventoryCsv = () => {
    const headers = ['Product Name', 'Category', 'SKU', 'Barcode', 'Cost', 'Retail', 'Stock', 'Unit'];
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.sku,
      p.barcode,
      p.costPrice.toFixed(2),
      p.retailPrice.toFixed(2),
      p.stock,
      p.unit
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rahel-POS-Inventory-Export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-y-auto bg-[#0a0a0c] text-[#f4efe8] space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <h2 className="text-xl font-bold text-[#f5d77f]">
            Store Performance & Financial Reports
          </h2>
          <p className="text-xs text-[#998b7a]">
            Audited store sales volume, gross margins, payment distribution & official CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSalesCsv}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#1a1714] border border-[#26221c] text-[#c4bbb0] hover:text-[#f5d77f] hover:border-[#d4af37]/40 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Sales CSV</span>
          </button>
          <button
            onClick={exportInventoryCsv}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] hover:to-[#b88c14] text-black flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Export Stock CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#998b7a]">
            Gross Sales Revenue
          </span>
          <div className="text-2xl font-bold font-mono text-[#f5d77f]">
            {settings.currencySymbol} {totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#998b7a]">
            Across {sales.length} completed transactions
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#998b7a]">
            Estimated Gross Margin
          </span>
          <div className="text-2xl font-bold font-mono text-[#e6ca65]">
            {settings.currencySymbol} {grossProfit.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#998b7a]">
            {totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}% net return on retail stock
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#998b7a]">
            Average Basket Size (AOV)
          </span>
          <div className="text-2xl font-bold font-mono text-[#f5d77f]">
            {settings.currencySymbol} {avgOrderValue.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#998b7a]">
            Per customer counter checkout
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#998b7a]">
            Tax Collected (FY 2026)
          </span>
          <div className="text-2xl font-bold font-mono text-[#f4efe8]">
            {settings.currencySymbol} {totalTax.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#998b7a]">
            Based on {settings.taxRatePercent}% store tax rate
          </div>
        </div>
      </div>

      {/* Two columns: Top Products & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top stationery items */}
        <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-3">
          <div className="font-bold text-sm text-[#f4efe8] flex items-center justify-between">
            <span className="text-[#f5d77f]">Top Revenue Stationery & Services</span>
            <span className="text-xs text-[#998b7a]">Ranked by Volume</span>
          </div>

          <div className="divide-y divide-[#26221c]">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#736657]">No product sales yet.</div>
            ) : (
              topProducts.map((tp, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f5d77f] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold truncate text-[#f4efe8]">{tp.name}</div>
                      <div className="text-[10px] text-[#998b7a]">{tp.qty} units sold</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-xs text-[#f5d77f] shrink-0">
                    {settings.currencySymbol} {tp.revenue.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-3">
          <div className="font-bold text-sm text-[#f4efe8] flex items-center justify-between">
            <span className="text-[#f5d77f]">Payment Methods Breakdown</span>
            <span className="text-xs text-[#998b7a]">Channel Split</span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(paymentBreakdown).map(([method, amount]) => {
              const pct = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold capitalize text-[#f4efe8]">
                      {method.replace('_', ' ')}
                    </span>
                    <span className="font-mono font-bold text-[#f5d77f]">
                      {settings.currencySymbol} {amount.toFixed(2)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#26221c] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#d4af37] to-[#aa8010] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
