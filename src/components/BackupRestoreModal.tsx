import React, { useState } from 'react';
import { BackupInspectionResult } from '../types';
import { storage } from '../services/storage';
import {
  ShieldCheck,
  AlertTriangle,
  X,
  FileCheck2,
  Package,
  ShoppingBag,
  CreditCard,
  Receipt,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  inspection: BackupInspectionResult | null;
  fileName?: string;
  onClose: () => void;
  onRestoreSuccess: (counts: any) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  inspection,
  fileName,
  onClose,
  onRestoreSuccess
}) => {
  const [mode, setMode] = useState<'replace' | 'merge'>('replace');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  if (!isOpen || !inspection) return null;

  const handleConfirmRestore = async () => {
    setIsRestoring(true);
    setRestoreError(null);

    try {
      // Small visual pause for smooth transition
      await new Promise(r => setTimeout(r, 350));
      const res = storage.restoreFromBackup(inspection.payload, mode);
      if (res.success) {
        onRestoreSuccess(res.restoredCounts);
        onClose();
      } else {
        setRestoreError(res.error || 'Failed to restore database from backup.');
      }
    } catch (err: any) {
      setRestoreError(err.message || 'An unexpected error occurred while restoring.');
    } finally {
      setIsRestoring(false);
    }
  };

  const formattedDate = inspection.exportedAt
    ? new Date(inspection.exportedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Unknown export date';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#2a261f] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#18181d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5d77f] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#f5d77f]">
                Restore Secure JSON Backup
              </h3>
              <p className="text-[11px] text-[#8e8271]">
                {fileName || 'Backup file verified & ready for restore'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8e8271] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Security & Checksum Status Banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
            inspection.checksumValid
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
              : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {inspection.checksumValid ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <span>{inspection.checksumValid ? 'Verified File Integrity (SHA-256)' : 'Unsigned or Legacy Backup'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 font-mono">
                    Format: {inspection.version === '2.0' ? 'V2.0 Secure' : 'V1.0 Legacy'}
                  </span>
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  Exported from <strong>{inspection.storeName}</strong> on {formattedDate}
                </div>
              </div>
            </div>
            {inspection.checksum && (
              <span className="font-mono text-[10px] text-emerald-400/80 bg-black/50 px-2 py-1 rounded hidden sm:inline-block">
                #{inspection.checksum.slice(0, 10)}...
              </span>
            )}
          </div>

          {/* Counts Grid */}
          <div>
            <div className="text-[11px] font-bold text-[#c4bbb0] uppercase tracking-wider mb-2">
              Contained Records to Restore
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-[#1a1a20] border border-[#26221c] flex items-center gap-2.5">
                <Package className="w-4 h-4 text-[#d4af37]" />
                <div>
                  <div className="font-mono font-bold text-sm text-[#f5d77f]">
                    {inspection.counts.products}
                  </div>
                  <div className="text-[10px] text-[#8e8271]">Inventory Items</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1a1a20] border border-[#26221c] flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-mono font-bold text-sm text-emerald-300">
                    {inspection.counts.services}
                  </div>
                  <div className="text-[10px] text-[#8e8271]">Commercial Services</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1a1a20] border border-[#26221c] flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-mono font-bold text-sm text-sky-300">
                    {inspection.counts.sales}
                  </div>
                  <div className="text-[10px] text-[#8e8271]">Sales Receipts</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1a1a20] border border-[#26221c] flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-mono font-bold text-sm text-amber-300">
                    {inspection.counts.creditAccounts}
                  </div>
                  <div className="text-[10px] text-[#8e8271]">Credit Accounts</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1a1a20] border border-[#26221c] flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="font-mono font-bold text-sm text-rose-300">
                    {inspection.counts.expenses}
                  </div>
                  <div className="text-[10px] text-[#8e8271]">Expenses</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1a1a20] border border-[#26221c] flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-mono font-bold text-sm text-purple-300">
                    {inspection.counts.shifts}
                  </div>
                  <div className="text-[10px] text-[#8e8271]">Register Shifts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sample preview */}
          {inspection.sampleProducts.length > 0 && (
            <div className="p-3 rounded-xl bg-[#101014] border border-[#22201c]">
              <div className="text-[10px] font-bold text-[#8e8271] uppercase tracking-wider mb-1.5">
                Sample Catalog Items in Backup
              </div>
              <div className="flex flex-wrap gap-1.5">
                {inspection.sampleProducts.map((name, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-[#1a1a20] border border-[#2a261f] text-[11px] text-[#d4af37]"
                  >
                    {name}
                  </span>
                ))}
                {inspection.counts.products > inspection.sampleProducts.length && (
                  <span className="px-2 py-0.5 rounded-md bg-[#1a1a20] border border-[#2a261f] text-[11px] text-[#8e8271]">
                    +{inspection.counts.products - inspection.sampleProducts.length} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mode Selector */}
          <div>
            <div className="text-[11px] font-bold text-[#c4bbb0] uppercase tracking-wider mb-2">
              Select Restoration Strategy
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                onClick={() => setMode('replace')}
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  mode === 'replace'
                    ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#f4efe8]'
                    : 'bg-[#18181e] border-[#26221c] text-[#8e8271] hover:border-[#383329]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#f5d77f]">Clean Replacement</span>
                  <input
                    type="radio"
                    name="restoreMode"
                    checked={mode === 'replace'}
                    onChange={() => setMode('replace')}
                    className="accent-[#d4af37]"
                  />
                </div>
                <p className="text-[11px] leading-relaxed opacity-85">
                  Overwrites active database with the exact snapshot from the backup file. Recommended for full cache recovery.
                </p>
              </label>

              <label
                onClick={() => setMode('merge')}
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  mode === 'merge'
                    ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#f4efe8]'
                    : 'bg-[#18181e] border-[#26221c] text-[#8e8271] hover:border-[#383329]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#f5d77f]">Merge & Append</span>
                  <input
                    type="radio"
                    name="restoreMode"
                    checked={mode === 'merge'}
                    onChange={() => setMode('merge')}
                    className="accent-[#d4af37]"
                  />
                </div>
                <p className="text-[11px] leading-relaxed opacity-85">
                  Preserves existing products and sales, adding missing items from the backup without deleting current data.
                </p>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {restoreError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{restoreError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#26221c] bg-[#18181d]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#202026] hover:bg-[#282830] text-[#c4bbb0] hover:text-[#f4efe8] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmRestore}
            disabled={isRestoring}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black flex items-center gap-1.5 shadow-md shadow-[#d4af37]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Restoring Database...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                <span>Confirm & Restore Database</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
