import React, { useState } from 'react';
import { Expense } from '../types';
import { storage } from '../services/storage';
import { Wallet, Plus, Trash2, Tag, Calendar, X, AlertCircle, FileText } from 'lucide-react';
import { exportExpenseReportPDF } from '../services/pdfReportGenerator';

export const ExpenseTrackerView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(storage.getExpenses());
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Printing Toner');
  const [paidVia, setPaidVia] = useState<Expense['paidVia']>('Cash Register');
  const [description, setDescription] = useState('');
  const [receiptRef, setReceiptRef] = useState('');

  const activeUser = storage.getActiveUser();
  const settings = storage.getSettings();

  const categories: Expense['category'][] = [
    'Printing Toner',
    'Paper Stock',
    'Utilities',
    'Equipment Maintenance',
    'Packaging Supplies',
    'Courier / Logistics',
    'Store Miscellaneous'
  ];

  const refreshList = () => {
    setExpenses(storage.getExpenses());
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount) || 0;
    if (amt <= 0 || !description.trim()) return;

    const newExp: Expense = {
      id: 'exp_' + Date.now(),
      date: new Date().toISOString(),
      category,
      amount: amt,
      paidVia,
      description: description.trim(),
      recordedBy: activeUser.name,
      receiptReference: receiptRef.trim() || undefined
    };

    storage.addExpense(newExp);
    refreshList();
    setShowAddModal(false);
    setAmount('');
    setDescription('');
    setReceiptRef('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this expense record?')) {
      storage.deleteExpense(id);
      refreshList();
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-hidden bg-[#0a0a0c] text-[#f4efe8]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <h2 className="text-xl font-bold text-[#f5d77f]">
            Store Expense & Overhead Tracker
          </h2>
          <p className="text-xs text-[#a89f91]">
            Record daily retail operational costs, paper toner refills, equipment upkeep & register cash payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5d77f] text-xs font-semibold">
            Total Operational Costs: <strong className="font-mono text-sm text-[#d4af37]">{settings.currencySymbol} {totalExpense.toFixed(2)}</strong>
          </div>

          <button
            type="button"
            onClick={() => exportExpenseReportPDF(expenses, settings)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/40 flex items-center gap-1.5 transition-colors shadow-2xs hover:border-[#d4af37] cursor-pointer"
            title="Download Store Overhead & Expenses Report as PDF"
          >
            <FileText className="w-3.5 h-3.5 text-[#f5d77f]" />
            <span>Export Expenses PDF</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black flex items-center gap-1.5 shadow-md shadow-[#d4af37]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="flex-1 mt-4 rounded-2xl border border-[#26221c] bg-[#141417] overflow-hidden flex flex-col shadow-2xs">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#1a1a20] text-[#a89f91] font-medium border-b border-[#26221c]">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Expense Category</th>
                <th className="py-2.5 px-3">Description & Purpose</th>
                <th className="py-2.5 px-3">Paid Via</th>
                <th className="py-2.5 px-3">Recorded By</th>
                <th className="py-2.5 px-3 font-mono">Invoice / Ref</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26221c] text-[#f4efe8]">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8e8271]">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-4 text-[11px] text-[#a89f91]">
                      {new Date(exp.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#f5d77f]">
                      {exp.category}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-[#f4efe8]">{exp.description}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#1a1a20] border border-[#26221c] font-medium text-[#c4bbb0]">
                        {exp.paidVia}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#a89f91]">{exp.recordedBy}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-[#8e8271]">
                      {exp.receiptReference || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                      -{settings.currencySymbol} {exp.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1 text-[#8e8271] hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#1a1a20]">
              <h3 className="font-semibold text-sm text-[#f5d77f]">Record Store Operational Expense</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8271] hover:text-[#f4efe8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Expense Amount ({settings.currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Expense Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Expense['category'])}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-[#141417] text-[#f4efe8]">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Paid Via Account
                </label>
                <select
                  value={paidVia}
                  onChange={(e) => setPaidVia(e.target.value as Expense['paidVia'])}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                >
                  <option value="Cash Register" className="bg-[#141417] text-[#f4efe8]">Store Cash / Register</option>
                  <option value="Store Bank Card" className="bg-[#141417] text-[#f4efe8]">Store Business Debit Card</option>
                  <option value="Petty Cash" className="bg-[#141417] text-[#f4efe8]">Petty Cash Box</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Description & Item Purchased *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2x Black toner cartridges from office supplier"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Supplier Invoice / Receipt #
                </label>
                <input
                  type="text"
                  placeholder="INV-9921"
                  value={receiptRef}
                  onChange={(e) => setReceiptRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#26221c]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-[#8e8271] hover:text-[#f4efe8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black shadow-xs"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
