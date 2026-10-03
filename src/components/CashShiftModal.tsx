import React, { useState } from 'react';
import { CashShift } from '../types';
import { storage } from '../services/storage';
import { DollarSign, ArrowDownRight, CheckCircle2, AlertCircle, X, ShieldAlert, History } from 'lucide-react';

interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftUpdated?: () => void;
}

export const CashShiftModal: React.FC<CashShiftModalProps> = ({
  isOpen,
  onClose,
  onShiftUpdated
}) => {
  const activeShift = storage.getActiveShift();
  const shiftsHistory = storage.getShifts();
  const activeUser = storage.getActiveUser();
  const settings = storage.getSettings();

  const [mode, setMode] = useState<'overview' | 'open' | 'drop' | 'reconcile'>('overview');
  const [openingFloat, setOpeningFloat] = useState('150.00');
  const [openNotes, setOpenNotes] = useState('');

  // Drop fields
  const [dropAmount, setDropAmount] = useState('');
  const [dropReason, setDropReason] = useState('Safe deposit transfer');
  const [dropError, setDropError] = useState<string | null>(null);

  // Reconciliation cash count breakdown
  const [actualCountedCash, setActualCountedCash] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');

  if (!isOpen) return null;

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const floatVal = parseFloat(openingFloat) || 0;
    storage.openShift(floatVal, openNotes);
    onShiftUpdated?.();
    setMode('overview');
  };

  const handleCashDrop = (e: React.FormEvent) => {
    e.preventDefault();
    setDropError(null);
    if (!activeShift) return;
    const dropVal = parseFloat(dropAmount) || 0;
    if (dropVal <= 0 || dropVal > activeShift.expectedCash) {
      setDropError(`Drop amount must be greater than zero and cannot exceed current drawer cash (${settings.currencySymbol} ${activeShift.expectedCash.toFixed(2)}).`);
      return;
    }
    storage.addCashDrop(activeShift.id, dropVal, dropReason);
    setDropAmount('');
    setDropError(null);
    onShiftUpdated?.();
    setMode('overview');
  };

  const handleReconcileShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const actualVal = parseFloat(actualCountedCash) || 0;
    storage.closeShift(activeShift.id, actualVal, reconcileNotes);
    onShiftUpdated?.();
    setMode('overview');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#18181c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#aa8010] text-black flex items-center justify-center shadow-xs">
              <DollarSign className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#f4efe8]">Cash Register Shift Manager</h3>
              <p className="text-[11px] text-[#998b7a]">
                Float tracking, drop safe transfers & end-of-shift reconciliation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Active Shift Status Card */}
          <div className="p-4 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d4af37]">
                  {activeShift ? `Active Shift #${activeShift.shiftNumber}` : 'Register Closed'}
                </span>
                <div className="text-xl font-bold font-mono mt-0.5 text-[#f5d77f]">
                  {activeShift
                    ? `${settings.currencySymbol} ${activeShift.expectedCash.toFixed(2)}`
                    : `${settings.currencySymbol} 0.00`}
                </div>
                <div className="text-xs text-[#998b7a] mt-0.5">
                  {activeShift
                    ? `Cashier: ${activeShift.cashierName} · Opened at ${new Date(activeShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'No active cash shift. Please open register before recording cash transactions.'}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {activeShift ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f5d77f] shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f5d77f] animate-pulse" />
                    Drawer Active
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-900/40 border border-amber-800/40 text-amber-200">
                    Closed
                  </span>
                )}
              </div>
            </div>

            {/* Shift Breakdown Pills if active */}
            {activeShift && (
              <div className="mt-3 pt-3 border-t border-[#26221c] grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-[#1a1714] border border-[#26221c]">
                  <div className="text-[10px] text-[#998b7a]">Opening Float</div>
                  <div className="font-mono text-xs font-semibold mt-0.5 text-[#f4efe8]">
                    {settings.currencySymbol} {activeShift.openingFloat.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#1a1714] border border-[#26221c]">
                  <div className="text-[10px] text-[#998b7a]">Safe Drops</div>
                  <div className="font-mono text-xs font-semibold mt-0.5 text-amber-400">
                    -{settings.currencySymbol} {activeShift.cashDrops.reduce((s, d) => s + d.amount, 0).toFixed(2)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#1a1714] border border-[#26221c]">
                  <div className="text-[10px] text-[#998b7a]">Expected in Drawer</div>
                  <div className="font-mono text-xs font-semibold mt-0.5 text-[#f5d77f]">
                    {settings.currencySymbol} {activeShift.expectedCash.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Nav */}
          <div className="flex items-center gap-2">
            {!activeShift ? (
              <button
                type="button"
                onClick={() => setMode('open')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  mode === 'open'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8010] text-black shadow-xs font-bold'
                    : 'bg-[#1a1714] border border-[#26221c] text-[#c4bbb0] hover:text-[#f5d77f] hover:border-[#d4af37]/40'
                }`}
              >
                + Open New Shift Float
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setMode(mode === 'drop' ? 'overview' : 'drop')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'drop'
                      ? 'bg-amber-600 text-white shadow-xs font-bold'
                      : 'bg-[#1a1714] border border-[#26221c] text-[#c4bbb0] hover:text-[#f5d77f] hover:border-[#d4af37]/40'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Cash Drop to Safe
                </button>
                <button
                  type="button"
                  onClick={() => setMode(mode === 'reconcile' ? 'overview' : 'reconcile')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'reconcile'
                      ? 'bg-rose-700 text-white shadow-xs font-bold'
                      : 'bg-[#1a1714] border border-[#26221c] text-[#c4bbb0] hover:text-[#f5d77f] hover:border-[#d4af37]/40'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Reconcile & Close Shift
                </button>
              </>
            )}
          </div>

          {/* Mode 1: Open New Shift */}
          {mode === 'open' && !activeShift && (
            <form onSubmit={handleOpenShift} className="p-4 rounded-xl bg-[#1a1714] border border-[#26221c] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                Opening Cash Register Shift
              </h4>
              <div>
                <label className="block text-xs font-medium text-[#998b7a] mb-1">
                  Opening Cash Float ({settings.currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#736657]">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-xl bg-[#141417] border border-[#26221c] text-[#f4efe8] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <p className="text-[11px] text-[#736657] mt-1">
                  Cash in register at shift start (coins and small notes).
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#998b7a] mb-1">
                  Shift Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning opening shift by Rahel"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#141417] border border-[#26221c] text-[#f4efe8] placeholder-[#736657] focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('overview')}
                  className="px-3 py-1.5 text-xs rounded-lg text-[#998b7a] hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] hover:to-[#b88c14] text-black shadow-xs cursor-pointer"
                >
                  Start Register Shift
                </button>
              </div>
            </form>
          )}

          {/* Mode 2: Cash Drop */}
          {mode === 'drop' && activeShift && (
            <form onSubmit={handleCashDrop} className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Perform Cash Drop to Drop Safe
              </h4>
              <p className="text-xs text-amber-200">
                Safeguard store revenue by transferring excess cash notes from the POS drawer to the back-office drop safe.
              </p>
              <div>
                <label className="block text-xs font-medium text-[#998b7a] mb-1">
                  Drop Amount ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={activeShift.expectedCash}
                  required
                  placeholder="e.g. 100.00"
                  value={dropAmount}
                  onChange={(e) => setDropAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-[#141417] border border-amber-700/60 text-[#f4efe8] focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-[#998b7a]">
                  Maximum transferable now: {settings.currencySymbol} {activeShift.expectedCash.toFixed(2)}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#998b7a] mb-1">
                  Drop Reason
                </label>
                <input
                  type="text"
                  value={dropReason}
                  onChange={(e) => setDropReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#141417] border border-amber-700/60 text-[#f4efe8] focus:outline-none focus:border-amber-500"
                />
              </div>
              {dropError && (
                <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                  {dropError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('overview')}
                  className="px-3 py-1.5 text-xs rounded-lg text-[#998b7a] hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                >
                  Confirm Cash Drop
                </button>
              </div>
            </form>
          )}

          {/* Mode 3: Reconcile & Close Shift */}
          {mode === 'reconcile' && activeShift && (
            <form onSubmit={handleReconcileShift} className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                End-of-Shift Cash Reconciliation
              </h4>
              <div className="text-xs text-rose-200">
                Count the actual physical cash currently present in the register drawer and enter the total below.
              </div>

              <div className="p-3 rounded-lg bg-[#141417] border border-rose-900/40 flex items-center justify-between text-xs">
                <span>System Expected Cash:</span>
                <span className="font-mono font-bold text-sm text-[#f5d77f]">
                  {settings.currencySymbol} {activeShift.expectedCash.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#998b7a] mb-1">
                  Actual Counted Cash ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 312.50"
                  value={actualCountedCash}
                  onChange={(e) => setActualCountedCash(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-[#141417] border border-rose-700/60 text-[#f4efe8] focus:outline-none focus:border-rose-500"
                />
              </div>

              {actualCountedCash !== '' && (
                <div className="p-2.5 rounded-lg bg-[#141417] border border-[#26221c] flex items-center justify-between text-xs">
                  <span>Reconciliation Discrepancy:</span>
                  {(() => {
                    const diff = (parseFloat(actualCountedCash) || 0) - activeShift.expectedCash;
                    if (Math.abs(diff) < 0.01) {
                      return (
                        <span className="font-mono font-bold text-[#f5d77f] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" /> Perfect Balance ({settings.currencySymbol} 0.00)
                        </span>
                      );
                    }
                    if (diff > 0) {
                      return (
                        <span className="font-mono font-bold text-[#f5d77f]">
                          +{settings.currencySymbol} {diff.toFixed(2)} (Over)
                        </span>
                      );
                    }
                    return (
                      <span className="font-mono font-bold text-rose-400">
                        -{settings.currencySymbol} {Math.abs(diff).toFixed(2)} (Shortage)
                      </span>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#998b7a] mb-1">
                  Closing Notes & Explanations
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shift balanced, evening drop performed by Betty"
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#141417] border border-rose-700/60 text-[#f4efe8] placeholder-[#736657] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('overview')}
                  className="px-3 py-1.5 text-xs rounded-lg text-[#998b7a] hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-700 hover:bg-rose-800 text-white shadow-xs cursor-pointer"
                >
                  Finalize & Close Shift
                </button>
              </div>
            </form>
          )}

          {/* Past Shifts Ledger Table */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-[#998b7a]">
              <History className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Recent Shift Audit History</span>
            </div>
            <div className="rounded-xl border border-[#26221c] overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#18181c] text-[#998b7a] font-medium border-b border-[#26221c]">
                  <tr>
                    <th className="py-2 px-3">Shift #</th>
                    <th className="py-2 px-3">Cashier</th>
                    <th className="py-2 px-3">Opened</th>
                    <th className="py-2 px-3 text-right">Status</th>
                    <th className="py-2 px-3 text-right">Discrepancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26221c] bg-[#141417] text-[#f4efe8]">
                  {shiftsHistory.slice(0, 5).map((sh) => (
                    <tr key={sh.id} className="hover:bg-white/5">
                      <td className="py-2 px-3 font-mono font-semibold text-[#f5d77f]">#{sh.shiftNumber}</td>
                      <td className="py-2 px-3 truncate max-w-[100px]">{sh.cashierName}</td>
                      <td className="py-2 px-3 text-[#998b7a]">
                        {new Date(sh.openedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            sh.status === 'open'
                              ? 'bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f5d77f]'
                              : 'bg-white/5 text-[#998b7a]'
                          }`}
                        >
                          {sh.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {sh.discrepancy !== undefined ? (
                          sh.discrepancy === 0 ? (
                            <span className="text-[#f5d77f] font-bold">{settings.currencySymbol} 0.00</span>
                          ) : sh.discrepancy > 0 ? (
                            <span className="text-[#f5d77f] font-bold">
                              +{settings.currencySymbol} {sh.discrepancy.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold">
                              -{settings.currencySymbol} {Math.abs(sh.discrepancy).toFixed(2)}
                            </span>
                          )
                        ) : (
                          <span className="text-[#736657]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
