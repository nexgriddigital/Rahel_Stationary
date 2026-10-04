import React, { useState } from 'react';
import { CustomerCreditAccount } from '../types';
import { storage } from '../services/storage';
import { CreditCard, Search, Plus, DollarSign, Printer, X, CheckCircle, FileText } from 'lucide-react';
import { exportCreditAccountsReportPDF } from '../services/pdfReportGenerator';

export const CreditAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<CustomerCreditAccount[]>(storage.getCreditAccounts());
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<CustomerCreditAccount | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('Debt settlement payment');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccPhone, setNewAccPhone] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccLimit, setNewAccLimit] = useState('500.00');
  const [showStatementModal, setShowStatementModal] = useState(false);

  const settings = storage.getSettings();

  const refreshList = () => {
    setAccounts(storage.getCreditAccounts());
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) return;
    storage.recordCreditPayment(selectedAccount.id, amt, paymentNote);
    refreshList();
    setShowPaymentModal(false);
    setPaymentAmount('');
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    const newAcc: CustomerCreditAccount = {
      id: 'cred_' + Date.now(),
      customerName: newAccName.trim(),
      phone: newAccPhone.trim() || 'N/A',
      email: newAccEmail.trim() || undefined,
      creditLimit: parseFloat(newAccLimit) || 500,
      currentBalance: 0,
      createdAt: new Date().toISOString(),
      transactions: []
    };
    storage.saveCreditAccount(newAcc);
    refreshList();
    setShowAddAccountModal(false);
    setNewAccName('');
    setNewAccPhone('');
    setNewAccEmail('');
  };

  const filtered = accounts.filter(
    (a) =>
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase()))
  );

  const totalOutstanding = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-hidden bg-[#0a0a0c] text-[#f4efe8]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <h2 className="text-xl font-bold text-[#f5d77f]">
            Customer Credit Accounts & Ledgers
          </h2>
          <p className="text-xs text-[#a89f91]">
            Manage store credit limits, outstanding balances, payment logs & printable statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs font-semibold">
            Total Outstanding: <strong className="font-mono text-sm">{settings.currencySymbol} {totalOutstanding.toFixed(2)}</strong>
          </div>

          <button
            type="button"
            onClick={() => exportCreditAccountsReportPDF(accounts, settings)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/40 flex items-center gap-1.5 transition-colors shadow-2xs hover:border-[#d4af37] cursor-pointer"
            title="Download Customer Credit & Receivables Report as PDF"
          >
            <FileText className="w-3.5 h-3.5 text-[#f5d77f]" />
            <span>Export Credit PDF</span>
          </button>

          <button
            onClick={() => setShowAddAccountModal(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black flex items-center gap-1.5 shadow-md shadow-[#d4af37]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Open Credit Account</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="py-3 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8271]" />
          <input
            type="text"
            placeholder="Search account by customer or organization name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#141417] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
          />
        </div>
      </div>

      {/* Grid of Accounts */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((acc) => {
          const isHighDebt = acc.currentBalance > acc.creditLimit * 0.8;
          return (
            <div
              key={acc.id}
              className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] flex flex-col justify-between shadow-2xs space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#f4efe8]">
                      {acc.customerName}
                    </h3>
                    <div className="text-[11px] text-[#a89f91]">
                      {acc.phone} {acc.email ? `· ${acc.email}` : ''}
                    </div>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                      acc.currentBalance > 0
                        ? isHighDebt
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                        : 'bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/30'
                    }`}
                  >
                    {acc.currentBalance > 0 ? `Unpaid: ${settings.currencySymbol} ${acc.currentBalance.toFixed(2)}` : 'Zero Balance'}
                  </span>
                </div>

                {/* Progress bar of credit limit */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px] text-[#a89f91] font-mono">
                    <span>Credit Limit: {settings.currencySymbol} {acc.creditLimit.toFixed(2)}</span>
                    <span className="text-[#f5d77f]">Available: {settings.currencySymbol} {(acc.creditLimit - acc.currentBalance).toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#1a1a20] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHighDebt ? 'bg-rose-500' : 'bg-gradient-to-r from-[#d4af37] to-[#e6ca65]'
                      }`}
                      style={{ width: `${Math.min(100, (acc.currentBalance / acc.creditLimit) * 100)}%` }}
                    />
                  </div>
                </div>

                {acc.notes && (
                  <div className="mt-2 text-[11px] text-[#a89f91] line-clamp-1 italic">
                    &ldquo;{acc.notes}&rdquo;
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#26221c] flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedAccount(acc);
                    setShowStatementModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl text-[#c4bbb0] hover:text-[#f4efe8] hover:bg-[#1f1f26] flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Statement</span>
                </button>

                {acc.currentBalance > 0 && (
                  <button
                    onClick={() => {
                      setSelectedAccount(acc);
                      setPaymentAmount(acc.currentBalance.toFixed(2));
                      setShowPaymentModal(true);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Pay Debt</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Record Debt Payment Modal */}
      {showPaymentModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#1a1a20]">
              <h3 className="font-semibold text-sm text-[#f5d77f]">Record Customer Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8271] hover:text-[#f4efe8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-3">
              <div className="p-3 rounded-xl bg-[#1a1a20] border border-[#26221c] text-xs">
                <div>Customer: <strong className="text-[#f4efe8]">{selectedAccount.customerName}</strong></div>
                <div className="mt-1">
                  Outstanding Balance:{' '}
                  <strong className="font-mono text-[#f5d77f]">
                    {settings.currencySymbol} {selectedAccount.currentBalance.toFixed(2)}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Payment Amount Received ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedAccount.currentBalance}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Payment Notes / Reference
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#26221c]">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 text-xs text-[#8e8271] hover:text-[#f4efe8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black"
                >
                  Record Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {showStatementModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#26221c] bg-[#1a1a20]">
              <div className="font-bold text-sm flex items-center gap-2 text-[#f5d77f]">
                <FileText className="w-4 h-4 text-[#d4af37]" />
                <span>Account Ledger Statement</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg text-[#c4bbb0] hover:text-[#f4efe8] hover:bg-[#22222a]"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowStatementModal(false)}
                  className="p-1.5 rounded-lg text-[#8e8271] hover:text-[#f4efe8] hover:bg-[#22222a]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="text-center pb-3 border-b border-dashed border-[#26221c]">
                <div className="font-bold text-base text-[#f5d77f]">{settings.storeName}</div>
                <div className="text-[10px] text-[#8e8271]">{settings.address}</div>
                <div className="text-[11px] font-bold mt-2 text-[#c4bbb0]">STATEMENT OF ACCOUNT</div>
                <div className="text-xs text-[#d4af37] font-bold mt-1">
                  {selectedAccount.customerName}
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#a89f91]">Current Balance Due:</span>
                  <span className="font-bold text-rose-400">{settings.currencySymbol} {selectedAccount.currentBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a89f91]">Credit Limit:</span>
                  <span className="text-[#f4efe8]">{settings.currencySymbol} {selectedAccount.creditLimit.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <div className="font-bold pb-1 border-b border-[#26221c] text-[11px] text-[#f5d77f]">Transaction History</div>
                <div className="divide-y divide-[#26221c] pt-1">
                  {selectedAccount.transactions.length === 0 ? (
                    <div className="py-4 text-center text-[#8e8271]">No transactions recorded yet.</div>
                  ) : (
                    selectedAccount.transactions.map((t) => (
                      <div key={t.id} className="py-2 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="font-semibold capitalize text-[#f4efe8]">{t.type}: {t.note || 'Store charge'}</div>
                          <div className="text-[10px] text-[#8e8271]">
                            {new Date(t.date).toLocaleDateString()} · By {t.receivedBy}
                          </div>
                        </div>
                        <div
                          className={`font-bold ${
                            t.type === 'charge' ? 'text-rose-400' : 'text-[#f5d77f]'
                          }`}
                        >
                          {t.type === 'charge' ? `+${settings.currencySymbol} ${t.amount.toFixed(2)}` : `-${settings.currencySymbol} ${t.amount.toFixed(2)}`}
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

      {/* Add New Credit Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#1a1a20]">
              <h3 className="font-semibold text-sm text-[#f5d77f]">Open Store Credit Account</h3>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8271] hover:text-[#f4efe8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Customer / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Architects Ltd"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={newAccPhone}
                  onChange={(e) => setNewAccPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="accounts@example.com"
                  value={newAccEmail}
                  onChange={(e) => setNewAccEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Credit Limit ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="50"
                  value={newAccLimit}
                  onChange={(e) => setNewAccLimit(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#26221c]">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-3 py-1.5 text-xs text-[#8e8271] hover:text-[#f4efe8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
