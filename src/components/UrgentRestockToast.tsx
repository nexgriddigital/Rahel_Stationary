import React, { useEffect } from 'react';
import { AppNotification } from '../types';
import {
  AlertTriangle,
  X,
  PlusCircle,
  Package,
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';

interface UrgentRestockToastProps {
  toasts: AppNotification[];
  onDismiss: (id: string) => void;
  onQuickRestock: (productId: string, quantity?: number) => void;
  onNavigateToInventory: () => void;
}

export const UrgentRestockToast: React.FC<UrgentRestockToastProps> = ({
  toasts,
  onDismiss,
  onQuickRestock,
  onNavigateToInventory
}) => {
  // Only display the 3 most recent toasts to avoid overcrowding
  const visibleToasts = toasts.slice(0, 3);

  // Auto-dismiss individual toasts after 10 seconds
  useEffect(() => {
    if (visibleToasts.length === 0) return;
    const timers = visibleToasts.map(t =>
      setTimeout(() => {
        onDismiss(t.id);
      }, 10000)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [visibleToasts, onDismiss]);

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {visibleToasts.map((toast) => {
        const isDepleted = (toast.currentStock ?? 0) <= 0;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
              isDepleted
                ? 'bg-[#181112] border-rose-700/60 text-[#f4efe8]'
                : 'bg-[#181611] border-[#d4af37]/60 text-[#f4efe8]'
            }`}
          >
            {/* Header: Alert Type & Dismiss Button */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isDepleted
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-[#d4af37] text-black font-bold animate-pulse'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </span>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#f5d77f]">
                      {isDepleted ? '🚨 Urgent Restock (Zero Stock)' : '⚠️ Urgent Restock Alert'}
                    </span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
                    </span>
                  </div>
                  <h4 className="text-xs font-bold leading-tight line-clamp-1 text-[#f4efe8]">
                    {toast.productName || toast.title}
                  </h4>
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-lg text-[#8e8271] hover:text-[#f4efe8] transition-colors"
                title="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Threshold & Stock Details */}
            <div className="mt-2 p-2 rounded-xl bg-black/40 border border-[#26221c] flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#8e8271] font-mono">
                  SKU: {toast.sku || 'N/A'}
                </span>
                <span className="font-semibold text-xs text-[#c4bbb0]">
                  Remaining: <strong className="font-mono text-rose-400 font-bold">{toast.currentStock ?? 0} {toast.unit || 'pcs'}</strong>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#8e8271]">
                  Threshold
                </span>
                <div className="font-mono font-bold text-xs text-[#f5d77f]">
                  {toast.minThreshold ?? 10} {toast.unit || 'pcs'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center gap-2">
              {toast.productId && (
                <button
                  onClick={() => {
                    onQuickRestock(toast.productId!, 15);
                    onDismiss(toast.id);
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black flex items-center justify-center gap-1.5 shadow-md shadow-[#d4af37]/20 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Quick Restock (+15)</span>
                </button>
              )}

              <button
                onClick={() => {
                  onDismiss(toast.id);
                  onNavigateToInventory();
                }}
                className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-[#1a1a20] hover:bg-[#22222a] text-[#f4efe8] border border-[#26221c] flex items-center gap-1 transition-colors"
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
