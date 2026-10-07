import React from 'react';
import { AlertTriangle, AlertCircle, X, HelpCircle } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#2a261f] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#18181d]">
          <div className="flex items-center gap-2.5">
            {variant === 'danger' && (
              <div className="w-8 h-8 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            {variant === 'warning' && (
              <div className="w-8 h-8 rounded-xl bg-amber-950/70 border border-amber-800/60 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
            {variant === 'primary' && (
              <div className="w-8 h-8 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f5d77f] flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
            )}
            <h3 className="font-bold text-sm text-[#f5d77f]">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-[#8e8271] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <div className="p-5 text-xs text-[#c4bbb0] leading-relaxed whitespace-pre-line">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[#26221c] bg-[#18181d]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#202026] text-[#c4bbb0] border border-[#2a261f] transition-colors cursor-pointer min-h-[36px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm min-h-[36px] ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                : variant === 'warning'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 text-white'
                : 'bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black shadow-[#d4af37]/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
