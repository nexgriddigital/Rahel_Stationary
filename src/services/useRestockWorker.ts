import { useState, useEffect, useCallback, useRef } from 'react';
import { storage } from './storage';
import { AppNotification } from '../types';

export interface UseRestockWorkerReturn {
  notifications: AppNotification[];
  unreadCount: number;
  urgentCount: number;
  visualToasts: AppNotification[];
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  quickRestock: (productId: string, quantityToAdd?: number) => void;
  runImmediateCheck: () => void;
}

/**
 * Automated Background Worker Task:
 * Periodically monitors all stationery catalog items and listens to real-time storage
 * stock mutations. When any product quantity hits its minimum threshold, it dispatches
 * a visual 'Urgent Restock' alert notification within the app's internal notification system.
 */
export function useRestockWorker(options: {
  checkIntervalMs?: number;
  onNavigateToInventory?: () => void;
} = {}): UseRestockWorkerReturn {
  const { checkIntervalMs = 30000, onNavigateToInventory } = options;

  const [notifications, setNotifications] = useState<AppNotification[]>(() => storage.getNotifications());
  const [visualToasts, setVisualToasts] = useState<AppNotification[]>([]);
  const hasInitializedRef = useRef(false);
  const isCheckingRef = useRef(false);
  // Track notification IDs that have already been presented as toasts to avoid re-alerting
  const shownToastIdsRef = useRef<Set<string>>(new Set());

  // Sync notifications list from storage
  const syncFromStorage = useCallback(() => {
    setNotifications(storage.getNotifications());
  }, []);

  // Run the restock audit check
  const runImmediateCheck = useCallback(() => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    try {
      const { newlyTriggered } = storage.checkStockThresholds();
      syncFromStorage();

      if (newlyTriggered.length > 0) {
        // Only dispatch visual toast alerts for genuinely new items not already shown to the user
        const toAdd = newlyTriggered.filter(n => !shownToastIdsRef.current.has(n.id));
        if (toAdd.length > 0) {
          toAdd.forEach(n => shownToastIdsRef.current.add(n.id));
          setVisualToasts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const fresh = toAdd.filter(n => !existingIds.has(n.id));
            return [...prev, ...fresh];
          });
        }
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [syncFromStorage]);

  // Periodic Automated Task Interval + Storage Event Reactivity
  useEffect(() => {
    // Initial run on mount
    runImmediateCheck();
    hasInitializedRef.current = true;

    // Automated periodic background interval
    const intervalId = setInterval(() => {
      runImmediateCheck();
    }, checkIntervalMs);

    // Reactive subscription to stock mutations (only inventory mutations, avoid noise)
    const unsubscribe = storage.subscribe((key) => {
      if (
        key === 'rahel_pos_products_v1' ||
        key === 'rahel_pos_sales_v1' ||
        key === 'rahel_pos_stock_movements_v1'
      ) {
        runImmediateCheck();
      }
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [checkIntervalMs, runImmediateCheck]);

  // Dismiss a visual floating toast
  const dismissToast = useCallback((id: string) => {
    shownToastIdsRef.current.add(id);
    setVisualToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback((id: string) => {
    storage.markNotificationRead(id);
    dismissToast(id);
    syncFromStorage();
  }, [dismissToast, syncFromStorage]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    storage.markAllNotificationsRead();
    setVisualToasts([]);
    syncFromStorage();
  }, [syncFromStorage]);

  // Clear all
  const clearAll = useCallback(() => {
    storage.clearNotifications();
    setVisualToasts([]);
    syncFromStorage();
  }, [syncFromStorage]);

  // 1-Click Quick Restock helper
  const quickRestock = useCallback((productId: string, quantityToAdd = 15) => {
    storage.adjustStock(
      productId,
      quantityToAdd,
      'IN',
      `Urgent restock replenishment (+${quantityToAdd} units)`
    );
    // Find notification for this product and dismiss toast
    const notifs = storage.getNotifications();
    const related = notifs.find(n => n.productId === productId && !n.read);
    if (related) {
      storage.markNotificationRead(related.id);
      dismissToast(related.id);
    }
    runImmediateCheck();
  }, [dismissToast, runImmediateCheck]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => !n.read && n.severity === 'urgent').length;

  return {
    notifications,
    unreadCount,
    urgentCount,
    visualToasts,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
    quickRestock,
    runImmediateCheck
  };
}
