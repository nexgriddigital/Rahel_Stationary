import React, { useState } from 'react';
import { Sale } from '../types';
import { storage } from '../services/storage';
import { Receipt, Search, Printer, RotateCcw, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface SalesLedgerViewProps {
  onOpenReceipt: (sale: Sale) => void;
}

export const SalesLedgerView: React.FC<SalesLedgerViewProps> = ({ onOpenReceipt }) => {
  const [sales, setSales] = useState<Sale[]>(storage.getSales());
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [refundingSale, setRefundingSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('Customer return with receipt');
  const settings = storage.getSettings();

  const refreshList = () => {
    setSales(storage.getSales());
  };

  const handleRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingSale) return;
    storage.refundSale(refundingSale.id, refundReason);
    refreshList();
    setRefundingSale(null);
  };

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.cashierName.toLowerCase().includes(search.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
      s.items.some((i) => i.productName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (dateFilter === 'today') {
      const todayStr = new Date().toDateString();
      return new Date(s.timestamp).toDateString() === todayStr;
    }
    if (dateFilter === 'week') {
      const oneWeekAgo = Date.now() - 7 * 86400000;
      return new Date(s.timestamp).getTime() >= oneWeekAgo;
    }
    return true;
  });

  const totalRevenue = filteredSales
    .filter((s) => s.status !== 'refunded')
    .reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-hidden bg-[#0a0a0c] text-[#f4efe8]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <h2 className="text-xl font-bold text-[#f5d77f]">
            Sales & Receipts Ledger
          </h2>
          <p className="text-xs text-[#a89f91]">
            Audited transaction ledger, thermal reprint, refund management & customer tickets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5d77f] text-xs font-semibold">
            Filtered Volume: <strong className="font-mono text-sm text-[#d4af37]">{settings.currencySymbol} {totalRevenue.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8271]" />
          <input
            type="text"
            placeholder="Search by receipt number, customer, cashier, or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#141417] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#141417] p-1 rounded-xl border border-[#26221c] text-xs">
          {(['all', 'today', 'week'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDateFilter(mode)}
              className={`px-3 py-1 rounded-lg font-medium capitalize transition-colors ${
                dateFilter === mode
                  ? 'bg-[#d4af37] text-black font-bold shadow-xs'
                  : 'text-[#c4bbb0] hover:text-[#f4efe8] hover:bg-[#1f1f26]'
              }`}
            >
              {mode === 'all' ? 'All Time' : mode === 'today' ? 'Today' : 'Past 7 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      <div className="flex-1 rounded-2xl border border-[#26221c] bg-[#141417] overflow-hidden flex flex-col shadow-2xs">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#1a1a20] text-[#a89f91] font-medium border-b border-[#26221c] z-10">
              <tr>
                <th className="py-2.5 px-4 font-mono">Receipt #</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3 text-center">Items</th>
                <th className="py-2.5 px-3">Payment Split</th>
                <th className="py-2.5 px-3 text-right">Total Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26221c] text-[#f4efe8]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8e8271]">
                    No sales receipts match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#f5d77f]">
                      {s.receiptNumber}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-[#a89f91]">
                      {new Date(s.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5 px-3 text-[#c4bbb0]">{s.cashierName}</td>
                    <td className="py-2.5 px-3 truncate max-w-[130px] text-[#f4efe8]">
                      {s.customerName || 'Walk-in Client'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#a89f91]">
                      {s.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] capitalize text-[#c4bbb0]">
                      {s.payments.map((p) => `${p.method.replace('_', ' ')} (${settings.currencySymbol} ${p.amount.toFixed(2)})`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#d4af37]">
                      {settings.currencySymbol} {s.total.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          s.status === 'completed'
                            ? 'bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/30'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenReceipt(s)}
                          title="View & Re-print Thermal Receipt"
                          className="p-1 rounded-lg text-[#f5d77f] hover:bg-[#1f1f26] transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {s.status === 'completed' && (
                          <button
                            onClick={() => setRefundingSale(s)}
                            title="Process Full Refund / Void"
                            className="p-1 rounded-lg text-[#8e8271] hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      {refundingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#1a1a20]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="font-semibold text-sm text-[#f5d77f]">Void / Refund Transaction</h3>
              </div>
              <button
                onClick={() => setRefundingSale(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8271] hover:text-[#f4efe8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRefund} className="p-5 space-y-3">
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs space-y-1">
                <div className="font-bold text-rose-300">
                  Refunding Receipt #{refundingSale.receiptNumber} ({settings.currencySymbol} {refundingSale.total.toFixed(2)})
                </div>
                <div className="text-[11px] text-rose-400">
                  Items in this sale will automatically be restored to the inventory stock count.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Reason for Refund / Void
                </label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Defective print, duplicate charge, customer returned unopened item"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#26221c]">
                <button
                  type="button"
                  onClick={() => setRefundingSale(null)}
                  className="px-3 py-1.5 text-xs rounded-lg text-[#8e8271] hover:text-[#f4efe8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-700 hover:bg-rose-800 text-white"
                >
                  Confirm Refund & Restock Items
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
