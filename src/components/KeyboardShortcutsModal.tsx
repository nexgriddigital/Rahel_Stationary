import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', desc: 'Display Keyboard Shortcuts Guide', category: 'General' },
    { key: 'F2', desc: 'Trigger Instant Cart Tender / Checkout', category: 'POS Register' },
    { key: 'F3', desc: 'Park / Hold active cart to serve next customer', category: 'POS Register' },
    { key: 'F4', desc: 'Launch Camera QR Scanner Modal', category: 'POS Register' },
    { key: 'F8', desc: 'Clear Current Cart & Start Fresh Ticket', category: 'POS Register' },
    { key: 'Esc', desc: 'Dismiss active dialog or close modal', category: 'General' },
    { key: 'Any QR / Barcode', desc: 'Auto-scanned by USB Laser Wedge at any time', category: 'Hardware' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#18181c]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#aa8010] text-black flex items-center justify-center shadow-xs">
              <Keyboard className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#f4efe8]">Cashier Keyboard Shortcuts</h3>
              <p className="text-[11px] text-[#998b7a]">
                Accelerate high-volume counter checkout workflows
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

        {/* Shortcuts list */}
        <div className="p-5 space-y-2.5">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a1714] border border-[#26221c] shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#f4efe8] font-medium">
                  {sc.desc}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-[#26221c] border border-[#d4af37]/40 font-mono text-xs font-bold text-[#f5d77f] shrink-0">
                {sc.key}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-[#18181c] border-t border-[#26221c] text-center text-[11px] text-[#998b7a]">
          Tip: Press <kbd className="font-mono px-1.5 py-0.5 bg-[#141417] text-[#f5d77f] rounded border border-[#26221c]">F1</kbd> at any point in the POS register to view this cheatsheet.
        </div>
      </div>
    </div>
  );
};
