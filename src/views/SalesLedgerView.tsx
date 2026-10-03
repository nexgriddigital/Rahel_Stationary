import React, { useState } from 'react';
import { Sale, PaymentMethod } from '../types';
import { storage } from '../services/storage';
import {
  History,
  Search,
  RotateCcw,
  AlertCircle,
  X,
  ShieldAlert,
  Eye,
  Calendar,
  Filter,
  User,
  CreditCard,
  Package,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

interface SalesLedgerViewProps {
  onNavigateToPOS?: () => void;
}

export const SalesLedgerView: React.FC<SalesLedgerViewProps> = ({ onNavigateToPOS }) => {
  const [sales, setSales] = useState<Sale[]>(() => storage.getSales());
  const [search, setSearch] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState<
    'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  >('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');

  // Modals
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [refundingSale, setRefundingSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('Customer returned unused merchandise');

  const settings = storage.getSettings();
  const products = storage.getProducts();
  const staffMembers = storage.getStaff();

  const refreshList = () => {
    setSales(storage.getSales());
  };

  const handleRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingSale) return;
    storage.refundSale(refundingSale.id, refundReason);
    refreshList();
    if (viewingSale && viewingSale.id === refundingSale.id) {
      setViewingSale(null);
    }
    setRefundingSale(null);
  };

  // Filter Sales Logic
  const filteredSales = sales.filter((s) => {
    // 1. Transaction ID, customer, cashier, item search query
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (s.transactionId && s.transactionId.toLowerCase().includes(query)) ||
      s.receiptNumber.toLowerCase().includes(query) ||
      s.cashierName.toLowerCase().includes(query) ||
      (s.customerName && s.customerName.toLowerCase().includes(query)) ||
      s.items.some(
        (i) =>
          i.productName.toLowerCase().includes(query) ||
          i.sku.toLowerCase().includes(query) ||
          i.barcode.includes(query)
      );

    if (!matchesSearch) return false;

    // 2. Staff / User filter
    if (selectedStaff !== 'all') {
      const matchStaff = s.cashierId === selectedStaff || s.cashierName.toLowerCase() === selectedStaff.toLowerCase();
      if (!matchStaff) return false;
    }

    // 3. Product filter
    if (selectedProduct !== 'all') {
      const matchProd = s.items.some((i) => i.productId === selectedProduct);
      if (!matchProd) return false;
    }

    // 4. Payment Method filter
    if (selectedPaymentMethod !== 'all') {
      const matchPay = s.payments.some((p) => p.method === selectedPaymentMethod);
      if (!matchPay) return false;
    }

    // 5. Date filter
    const saleDateStr = storage.toLocalDateString(s.timestamp);
    const todayStr = storage.toLocalDateString(new Date());

    if (dateFilterMode === 'today') {
      return saleDateStr === todayStr;
    }

    if (dateFilterMode === 'yesterday') {
      const yesterday = new Date(Date.now() - 86400000);
      return saleDateStr === storage.toLocalDateString(yesterday);
    }

    if (dateFilterMode === 'week') {
      const { startDate, endDate } = storage.getWeekBounds(new Date());
      return saleDateStr >= startDate && saleDateStr <= endDate;
    }

    if (dateFilterMode === 'month') {
      const now = new Date();
      const curYear = now.getFullYear();
      const curMonth = now.getMonth();
      const saleDate = new Date(s.timestamp);
      return saleDate.getFullYear() === curYear && saleDate.getMonth() === curMonth;
    }

    if (dateFilterMode === 'custom' && customDate) {
      return saleDateStr === customDate;
    }

    return true;
  });

  const totalFilteredRevenue = filteredSales
    .filter((s) => s.status !== 'refunded')
    .reduce((sum, s) => sum + s.total, 0);

  const totalFilteredItems = filteredSales
    .filter((s) => s.status !== 'refunded')
    .reduce((sum, s) => sum + s.items.reduce((acc, item) => acc + item.quantity, 0), 0);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-hidden bg-[#0a0a0c] text-[#f4efe8]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#f5d77f]">Sales History</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/35">
              Audited Ledger
            </span>
          </div>
          <p className="text-xs text-[#a89f91] mt-0.5">
            Comprehensive history of all completed sales, items sold, payment tenders, and stock records.
          </p>
        </div>

        {/* Aggregate KPI Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#141417] border border-[#26221c] text-xs">
            <span className="text-[#8c8273]">Recorded Sales: </span>
            <strong className="font-mono text-[#f4efe8]">{filteredSales.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#141417] border border-[#26221c] text-xs">
            <span className="text-[#8c8273]">Items Sold: </span>
            <strong className="font-mono text-[#f4efe8]">{totalFilteredItems}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5d77f] text-xs font-semibold">
            <span>Total Sales: </span>
            <strong className="font-mono text-sm text-[#d4af37]">
              {settings.currencySymbol} {totalFilteredRevenue.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="py-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Search Input: Transaction ID, customer, item, SKU */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8271]" />
            <input
              type="text"
              placeholder="Search by Transaction ID, product, cashier, or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#141417] border border-[#2a261f] text-[#f4efe8] placeholder-[#7d7465] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
            />
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-1 bg-[#141417] p-1 rounded-xl border border-[#26221c] text-xs flex-wrap">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Custom Date' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilterMode(tab.id as typeof dateFilterMode)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-xs cursor-pointer ${
                  dateFilterMode === tab.id
                    ? 'bg-[#d4af37] text-black font-bold shadow-xs'
                    : 'text-[#c4bbb0] hover:text-[#f4efe8] hover:bg-[#1f1f26]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom Date Picker if selected */}
          {dateFilterMode === 'custom' && (
            <div className="flex items-center gap-1.5 bg-[#141417] px-2.5 py-1 rounded-xl border border-[#26221c] text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-transparent text-xs text-[#f4efe8] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Secondary Filter Dropdowns: Product, Staff, Payment Method */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Filter by Product */}
          <div className="flex items-center gap-1.5 bg-[#141417] px-2.5 py-1 rounded-xl border border-[#26221c]">
            <Package className="w-3.5 h-3.5 text-[#8c8273]" />
            <span className="text-[11px] text-[#8c8273]">Product:</span>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="bg-transparent text-[#f4efe8] text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#141417]">All Products ({products.length})</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#141417]">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Staff / User */}
          <div className="flex items-center gap-1.5 bg-[#141417] px-2.5 py-1 rounded-xl border border-[#26221c]">
            <User className="w-3.5 h-3.5 text-[#8c8273]" />
            <span className="text-[11px] text-[#8c8273]">Staff / User:</span>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="bg-transparent text-[#f4efe8] text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#141417]">All Staff Members</option>
              {staffMembers.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#141417]">
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Payment Method */}
          <div className="flex items-center gap-1.5 bg-[#141417] px-2.5 py-1 rounded-xl border border-[#26221c]">
            <CreditCard className="w-3.5 h-3.5 text-[#8c8273]" />
            <span className="text-[11px] text-[#8c8273]">Payment:</span>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="bg-transparent text-[#f4efe8] text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#141417]">All Payment Methods</option>
              <option value="cash" className="bg-[#141417]">Cash</option>
              <option value="card" className="bg-[#141417]">Card / Debit</option>
              <option value="mobile_transfer" className="bg-[#141417]">Mobile Transfer</option>
              <option value="store_credit" className="bg-[#141417]">Store Credit</option>
            </select>
          </div>

          {/* Reset Filters button if any active */}
          {(search || dateFilterMode !== 'all' || selectedStaff !== 'all' || selectedProduct !== 'all' || selectedPaymentMethod !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setDateFilterMode('all');
                setCustomDate('');
                setSelectedStaff('all');
                setSelectedProduct('all');
                setSelectedPaymentMethod('all');
              }}
              className="text-[11px] text-[#d4af37] hover:underline px-2 py-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Sales History Table */}
      <div className="flex-1 rounded-2xl border border-[#26221c] bg-[#141417] overflow-hidden flex flex-col shadow-2xs">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#1a1a20] text-[#a89f91] font-medium border-b border-[#26221c] z-10">
              <tr>
                <th className="py-2.5 px-4 font-mono">Transaction ID</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Recorded By</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3 text-center">Items Sold</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3 text-right">Total Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26221c] text-[#f4efe8]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-[#8e8271]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShoppingBag className="w-8 h-8 opacity-40 text-[#d4af37]" />
                      <div className="font-semibold text-xs text-[#c4bbb0]">No transactions found</div>
                      <p className="text-[11px] text-[#7d7465]">
                        No recorded sales match the applied date and filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const itemsCount = s.items.reduce((acc, i) => acc + i.quantity, 0);
                  const txnId = s.transactionId || s.receiptNumber;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                      onClick={() => setViewingSale(s)}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-[#f5d77f]">
                        {txnId}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-[#a89f91]">
                        {new Date(s.timestamp).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-[#c4bbb0]">
                        <span className="font-medium text-[#f4efe8]">{s.cashierName}</span>
                      </td>
                      <td className="py-2.5 px-3 truncate max-w-[130px] text-[#a89f91]">
                        {s.customerName || 'Walk-in Client'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1e1e24] text-[#f5d77f] border border-[#2a261f]">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] capitalize text-[#c4bbb0]">
                        {s.payments.map((p) => p.method.replace('_', ' ')).join(', ')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#d4af37]">
                        {settings.currencySymbol} {s.total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            s.status === 'completed'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingSale(s)}
                            title="View Transaction Details"
                            className="p-1 rounded-lg text-[#f5d77f] hover:bg-[#1f1f26] transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {s.status === 'completed' && (
                            <button
                              onClick={() => setRefundingSale(s)}
                              title="Process Refund / Void & Restock"
                              className="p-1 rounded-lg text-[#8e8271] hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal (NO RECEIPTS) */}
      {viewingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl bg-[#141417] text-[#f4efe8] border border-[#2a261f] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-[#26221c] bg-[#18181d] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#f5d77f]">
                    Transaction #{viewingSale.transactionId || viewingSale.receiptNumber}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      viewingSale.status === 'completed'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                        : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                    }`}
                  >
                    {viewingSale.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-[#8c8273] mt-0.5">
                  Recorded on {new Date(viewingSale.timestamp).toLocaleString([], { dateStyle: 'full', timeStyle: 'medium' })}
                </p>
              </div>
              <button
                onClick={() => setViewingSale(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8c8273] hover:text-[#f4efe8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Meta information grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#18181d] border border-[#26221c]">
                  <span className="text-[10px] text-[#8c8273] block uppercase tracking-wider">Cashier</span>
                  <span className="font-semibold text-[#f4efe8]">{viewingSale.cashierName}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#18181d] border border-[#26221c]">
                  <span className="text-[10px] text-[#8c8273] block uppercase tracking-wider">Customer</span>
                  <span className="font-semibold text-[#f4efe8]">{viewingSale.customerName || 'Walk-in'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#18181d] border border-[#26221c]">
                  <span className="text-[10px] text-[#8c8273] block uppercase tracking-wider">Payment Method</span>
                  <span className="font-semibold text-[#f5d77f] capitalize">
                    {viewingSale.payments.map(p => p.method.replace('_', ' ')).join(', ')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#18181d] border border-[#26221c]">
                  <span className="text-[10px] text-[#8c8273] block uppercase tracking-wider">Total Amount</span>
                  <span className="font-mono font-bold text-sm text-[#f5d77f]">
                    {settings.currencySymbol} {viewingSale.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items Sold Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#8c8273]">
                  <span>Items Sold in this Sale</span>
                  <span>{viewingSale.items.reduce((s, i) => s + i.quantity, 0)} Units Total</span>
                </div>

                <div className="rounded-xl border border-[#26221c] bg-[#18181d] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#141417] text-[#8c8273] border-b border-[#26221c]">
                      <tr>
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-2 font-mono">Barcode</th>
                        <th className="py-2 px-2 text-right">Unit Price</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26221c]">
                      {viewingSale.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3">
                            <div className="font-medium text-[#f4efe8]">{item.productName}</div>
                            <div className="font-mono text-[10px] text-[#8c8273]">SKU: {item.sku}</div>
                          </td>
                          <td className="py-2 px-2 font-mono text-[11px] text-[#a39c90]">
                            {item.barcode}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-[#a39c90]">
                            {settings.currencySymbol} {item.unitPrice.toFixed(2)}
                            {item.discountPercent > 0 && (
                              <span className="block text-[10px] text-amber-400">-{item.discountPercent}%</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-[#f5d77f]">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#f4efe8]">
                            {settings.currencySymbol} {item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Splits Detail */}
              <div className="p-3 rounded-xl bg-[#18181d] border border-[#26221c] space-y-1.5 text-xs">
                <div className="font-semibold text-[#a89f91] uppercase tracking-wider text-[10px]">
                  Tender Breakdown
                </div>
                {viewingSale.payments.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-[#c4bbb0]">{p.method.replace('_', ' ')}:</span>
                    <span className="font-mono font-bold text-[#f5d77f]">
                      {settings.currencySymbol} {p.amount.toFixed(2)}
                      {p.reference && <span className="text-[10px] font-normal text-[#8c8273] ml-1">({p.reference})</span>}
                    </span>
                  </div>
                ))}
              </div>

              {/* Refund Notice if already refunded */}
              {viewingSale.status === 'refunded' && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Transaction Refunded</div>
                    <div className="text-[11px] text-rose-300/80 mt-0.5">{viewingSale.notes || 'No refund notes recorded.'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#18181d] border-t border-[#26221c] flex items-center justify-between">
              {viewingSale.status === 'completed' ? (
                <button
                  type="button"
                  onClick={() => setRefundingSale(viewingSale)}
                  className="px-3 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 border border-rose-800/40 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Void / Refund Transaction</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setViewingSale(null)}
                className="px-5 py-2 rounded-xl bg-[#24242c] hover:bg-[#2e2e38] text-xs font-semibold text-[#f4efe8] cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#1a1a20]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="font-semibold text-sm text-[#f5d77f]">Void / Refund Transaction</h3>
              </div>
              <button
                onClick={() => setRefundingSale(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8271] hover:text-[#f4efe8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRefund} className="p-5 space-y-3">
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs space-y-1">
                <div className="font-bold text-rose-300">
                  Refunding Transaction #{refundingSale.transactionId || refundingSale.receiptNumber} ({settings.currencySymbol} {refundingSale.total.toFixed(2)})
                </div>
                <div className="text-[11px] text-rose-400">
                  All items in this sale will automatically be restored to the inventory catalog stock count.
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
                  placeholder="e.g. Returned unopened merchandise, cashier error"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#26221c]">
                <button
                  type="button"
                  onClick={() => setRefundingSale(null)}
                  className="px-3 py-1.5 text-xs rounded-lg text-[#8e8271] hover:text-[#f4efe8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-700 hover:bg-rose-800 text-white cursor-pointer"
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
