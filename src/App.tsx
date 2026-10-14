/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  History,
  BarChart3,
  Menu,
  ShieldCheck,
  RotateCcw,
  CheckCircle,
  X,
  Loader2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { storage } from './services/storage';
import { authService, ServerSession } from './services/auth';
import { CartItem, Sale, Product } from './types';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { UserPinModal } from './components/UserPinModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { UrgentRestockToast } from './components/UrgentRestockToast';
import { useRestockWorker } from './services/useRestockWorker';
import { useAutoBackup } from './services/useAutoBackup';
import { UserSession } from './types';

// Critical view loaded directly
import { LoginView } from './views/LoginView';

// Code-split modals (loaded on-demand when opened)
const BarcodeScannerModal = lazy(() =>
  import('./components/BarcodeScannerModal').then((m) => ({ default: m.BarcodeScannerModal }))
);
const DownloadAppModal = lazy(() =>
  import('./components/DownloadAppModal').then((m) => ({ default: m.DownloadAppModal }))
);

// Code-split tabs for rapid mobile load & reduced initial JS bundle
const DashboardView = lazy(() =>
  import('./views/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const PosRegisterView = lazy(() =>
  import('./views/PosRegisterView').then((m) => ({ default: m.PosRegisterView }))
);
const InventoryView = lazy(() =>
  import('./views/InventoryView').then((m) => ({ default: m.InventoryView }))
);
const ServicesView = lazy(() =>
  import('./views/ServicesView').then((m) => ({ default: m.ServicesView }))
);
const SalesLedgerView = lazy(() =>
  import('./views/SalesLedgerView').then((m) => ({ default: m.SalesLedgerView }))
);
const CreditAccountsView = lazy(() =>
  import('./views/CreditAccountsView').then((m) => ({ default: m.CreditAccountsView }))
);
const ExpenseTrackerView = lazy(() =>
  import('./views/ExpenseTrackerView').then((m) => ({ default: m.ExpenseTrackerView }))
);
const BarcodeStudioView = lazy(() =>
  import('./views/BarcodeStudioView').then((m) => ({ default: m.BarcodeStudioView }))
);
const ReportsView = lazy(() =>
  import('./views/ReportsView').then((m) => ({ default: m.ReportsView }))
);
const StaffView = lazy(() =>
  import('./views/StaffView').then((m) => ({ default: m.StaffView }))
);
const ActivityLogsView = lazy(() =>
  import('./views/ActivityLogsView').then((m) => ({ default: m.ActivityLogsView }))
);
const SettingsView = lazy(() =>
  import('./views/SettingsView').then((m) => ({ default: m.SettingsView }))
);

const ViewLoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[360px] text-center">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5d77f] to-[#aa8010] text-black flex items-center justify-center font-bold shadow-lg shadow-[#d4af37]/20 mb-3 animate-pulse">
      <Loader2 className="w-5 h-5 animate-spin text-black" />
    </div>
    <div className="text-sm font-semibold text-[#f5d77f]">Loading module...</div>
  </div>
);

const VALID_TABS: NavTab[] = [
  'dashboard',
  'inventory',
  'services',
  'pos',
  'sales',
  'credit',
  'expenses',
  'barcodes',
  'reports',
  'staff',
  'logs',
  'settings'
];

function getInitialTabFromLocation(): NavTab {
  if (typeof window === 'undefined') return 'dashboard';
  try {
    const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (VALID_TABS.includes(hash as NavTab)) {
      return hash as NavTab;
    }
  } catch {}
  return 'dashboard';
}

export default function App() {
  const [session, setSession] = useState<ServerSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [expiredReason, setExpiredReason] = useState<string | null>(null);
  const [expiryWarningSeconds, setExpiryWarningSeconds] = useState<number | null>(null);

  const [currentTab, setCurrentTab] = useState<NavTab>(() => getInitialTabFromLocation());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeNotFound, setBarcodeNotFound] = useState<string | null>(null);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Store Lighting Mode: Light (warm parchment) vs Dark (dim store evening mode)
  const initialSettings = storage.getSettings();
  const [theme, setTheme] = useState<'light' | 'dark'>(initialSettings.themeMode || 'light');

  // QR Studio item selection state (persisted across navigation & page refreshes)
  const [selectedBarcodeProductIds, setSelectedBarcodeProductIds] = useState<string[]>(() =>
    storage.getBarcodeStudioSelectedIds()
  );

  // Automated background restock monitor worker
  const {
    notifications,
    unreadCount,
    urgentCount,
    visualToasts,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
    quickRestock
  } = useRestockWorker({
    checkIntervalMs: 30000,
    onNavigateToInventory: () => handleSelectTab('inventory')
  });

  // Automated backup & cache loss recovery worker
  const { emergencyRecoverySnapshot, restoreSnapshot } = useAutoBackup({ checkIntervalMs: 60000 });
  const [dismissedRecovery, setDismissedRecovery] = useState(false);

  // Reactivity tick for storage updates & session tracking
  const [storageTick, setStorageTick] = useState(0);
  const [resetToast, setResetToast] = useState<string | null>(null);

  // Initial authentication check & expiration subscriptions
  useEffect(() => {
    let isMounted = true;

    // Check with server immediately on startup: validates session & 60-min inactivity timeout
    authService.checkSession().then((res) => {
      if (!isMounted) return;
      if (res.authenticated && res.session) {
        setSession(res.session);
        setExpiredReason(null);
      } else {
        setSession(null);
        if (res.error === 'SESSION_EXPIRED') {
          setExpiredReason(res.message || 'Your session expired due to inactivity. Please log in again.');
        }
      }
      setIsCheckingAuth(false);
    });

    const unsubSession = authService.subscribe((s) => {
      setSession(s);
    });

    const unsubExpiry = authService.onExpiration((reason) => {
      setSession(null);
      setExpiredReason(reason);
      setExpiryWarningSeconds(null);
      try {
        window.location.hash = '';
      } catch {}
    });

    // Session validation heartbeat & inactivity warning poll every 20 seconds
    const interval = setInterval(async () => {
      const status = await authService.checkSession();
      if (!isMounted) return;
      if (!status.authenticated) {
        setSession(null);
        setExpiryWarningSeconds(null);
      } else if (status.remainingSeconds !== undefined) {
        // Show warning if 5 minutes (300 seconds) or less remain before inactivity expiration
        if (status.remainingSeconds <= 300 && status.remainingSeconds > 0) {
          setExpiryWarningSeconds(status.remainingSeconds);
        } else {
          setExpiryWarningSeconds(null);
        }
      }
    }, 20000);

    const unsubscribeStorage = storage.subscribe(() => {
      setStorageTick((t) => t + 1);
    });

    const handleHashChange = () => {
      const target = getInitialTabFromLocation();
      setCurrentTab(target);
    };
    window.addEventListener('hashchange', handleHashChange);

    const handleDataReset = () => {
      setCart([]);
      setStorageTick((t) => t + 1);
      setResetToast('Store database reset successfully. All items, sales, and accounts removed (0 items).');
      setTimeout(() => setResetToast(null), 5000);
    };
    window.addEventListener('rahel_pos_data_reset', handleDataReset);

    return () => {
      isMounted = false;
      unsubSession();
      unsubExpiry();
      clearInterval(interval);
      unsubscribeStorage();
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('rahel_pos_data_reset', handleDataReset);
    };
  }, []);

  // Track meaningful user activity to refresh server 60-minute inactivity timer
  useEffect(() => {
    if (!session) return;
    const handleUserActivity = () => {
      authService.recordActivity();
      setExpiryWarningSeconds(null);
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
    };
  }, [session]);

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    try {
      window.location.hash = tab;
    } catch {}
  };

  const handleLogout = async () => {
    await authService.logout();
    storage.logout();
    setSession(null);
    setExpiredReason(null);
    setExpiryWarningSeconds(null);
    try {
      window.location.hash = '';
    } catch {}
  };

  // Update theme class on HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    const s = storage.getSettings();
    s.themeMode = nextTheme;
    storage.saveSettings(s);
  };

  // Cart total calculations for top navbar pill
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => {
    const price = item.customPrice !== undefined ? item.customPrice : item.product.retailPrice;
    const discountFactor = 1 - (item.appliedDiscountPercent || 0) / 100;
    return acc + price * item.quantity * discountFactor;
  }, 0);
  const cartTotal = cartSubtotal;

  // Add product to cart helper
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        const newQty = Math.max(1, copy[idx].quantity + quantity);
        copy[idx] = { ...copy[idx], quantity: newQty };
        return copy;
      }
      return [...prev, { product, quantity: Math.max(1, quantity), appliedDiscountPercent: 0 }];
    });
  };

  // Hardware Laser Wedge & Keyboard listener
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in a text/number input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Function keys
      if (e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setCurrentTab('pos');
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setIsScannerOpen(true);
        return;
      }
      if (e.key === 'Escape') {
        setIsScannerOpen(false);
        setIsPinModalOpen(false);
        setIsDownloadModalOpen(false);
        setIsShortcutsOpen(false);
        return;
      }

      // Hardware Barcode/QR Laser Wedge Listener (rapid character input ending with Enter)
      if (!isInput) {
        const now = Date.now();
        if (now - lastKeyTimeRef.current > 100) {
          barcodeBufferRef.current = '';
        }
        lastKeyTimeRef.current = now;

        if (e.key === 'Enter') {
          if (barcodeBufferRef.current.length >= 4) {
            e.preventDefault();
            const scanned = barcodeBufferRef.current.trim();
            handleBarcodeScanned(scanned);
            barcodeBufferRef.current = '';
          }
        } else if (e.key.length === 1) {
          barcodeBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleBarcodeScanned = (code: string) => {
    const product = storage.findProductByCode(code);
    if (product) {
      handleAddToCart(product, 1);
      setCurrentTab('pos');
    } else {
      setBarcodeNotFound(code);
      setTimeout(() => setBarcodeNotFound(null), 4000);
    }
  };

  // Initial loading state while verifying workstation session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-[#f4efe8] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5d77f] to-[#aa8010] flex items-center justify-center shadow-xl shadow-[#d4af37]/20 animate-pulse">
            <ShieldCheck className="w-7 h-7 text-black" />
          </div>
        </div>
        <h2 className="text-base font-bold text-[#f5d77f] tracking-tight">
          Rahel Stationary Workstation
        </h2>
        <p className="text-xs text-[#a89f91] mt-1 flex items-center gap-2 justify-center">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d4af37]" />
          Verifying workstation session...
        </p>
      </div>
    );
  }

  // Unauthenticated users are protected and must log in
  if (!session) {
    return (
      <LoginView
        expiredReason={expiredReason}
        onLoginSuccess={(sess) => {
          setSession(sess);
          setExpiredReason(null);
          setExpiryWarningSeconds(null);
          const destination = getInitialTabFromLocation();
          setCurrentTab(destination);
          try {
            window.location.hash = destination;
          } catch {}
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f4efe8] flex antialiased">
      {/* Session Inactivity Pre-Expiration Warning Banner */}
      {expiryWarningSeconds !== null && (
        <div
          role="alert"
          className="fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-2xl bg-[#1c1409]/95 border-2 border-amber-500 text-amber-100 shadow-2xl shadow-black/80 flex items-start gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-3"
        >
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                Inactivity Warning
              </h4>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {Math.floor(expiryWarningSeconds / 60)}m {expiryWarningSeconds % 60}s
              </span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Your workstation session will automatically expire due to 60 minutes of inactivity.
            </p>
            <div className="pt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  authService.recordActivity(true);
                  setExpiryWarningSeconds(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Stay Signed In
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-amber-300 text-xs transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Navigation Bar (Desktop & Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenPinModal={() => setIsPinModalOpen(true)}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        cartItemCount={cartItemCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <Navbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenPinModal={() => setIsPinModalOpen(true)}
          onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          onLogout={handleLogout}
          onOpenCartDrawer={() => setCurrentTab('pos')}
          onSelectProduct={(p) => {
            handleAddToCart(p);
            setCurrentTab('pos');
          }}
          cartCount={cartItemCount}
          cartTotal={cartTotal}
          theme={theme}
          onToggleTheme={toggleTheme}
          notifications={notifications}
          unreadNotificationCount={unreadCount}
          urgentNotificationCount={urgentCount}
          onMarkNotificationRead={markAsRead}
          onMarkAllNotificationsRead={markAllAsRead}
          onClearAllNotifications={clearAll}
          onQuickRestock={quickRestock}
          onNavigateToInventory={() => setCurrentTab('inventory')}
        />

        {/* View Router */}
        <main className="flex-1 overflow-hidden relative">
          {/* Database Reset Success Toast */}
          {resetToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-950/95 border border-emerald-500 text-emerald-100 text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{resetToast}</span>
              <button
                onClick={() => setResetToast(null)}
                className="ml-2 text-emerald-300/80 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* QR Code not found toast */}
          {barcodeNotFound && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-rose-950/90 border border-rose-700 text-rose-200 text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="font-bold">QR Code Not Found:</span>
              <span className="font-mono text-white">[{barcodeNotFound}]</span>
              <span>is not in the catalog.</span>
              <button
                onClick={() => {
                  setBarcodeNotFound(null);
                  setCurrentTab('inventory');
                }}
                className="ml-2 px-2 py-0.5 rounded bg-rose-800 text-white font-semibold hover:bg-rose-700 text-[11px] cursor-pointer"
              >
                Add to Inventory
              </button>
            </div>
          )}

          {/* Emergency Cache Recovery Fallback Banner */}
          {emergencyRecoverySnapshot && !dismissedRecovery && (
            <div className="bg-gradient-to-r from-amber-950/95 via-[#1a1410] to-amber-950/95 border-b border-amber-600/50 px-4 py-2.5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-lg z-40 relative animate-in slide-in-from-top-1">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-amber-300">Automated Backup Fallback Detected:</span>{' '}
                  <span className="opacity-90">
                    Your store records are currently empty, but an automated snapshot from{' '}
                    <strong className="text-[#f5d77f]">
                      {new Date(emergencyRecoverySnapshot.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </strong>{' '}
                    is available ({emergencyRecoverySnapshot.summary.totalProducts} products, {emergencyRecoverySnapshot.summary.totalSales} sales).
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    restoreSnapshot(emergencyRecoverySnapshot.id);
                  }}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] text-black font-bold text-xs hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3 h-3 text-black" />
                  <span>Restore Automated Backup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDismissedRecovery(true)}
                  className="p-1 text-amber-400/80 hover:text-amber-200 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Dismiss fallback banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <Suspense fallback={<ViewLoadingFallback />}>
            {currentTab === 'dashboard' && (
              <DashboardView
                key={storageTick}
                onNavigate={setCurrentTab}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}

            {currentTab === 'pos' && (
              <PosRegisterView
                key={storageTick}
                onNavigateToHistory={() => setCurrentTab('sales')}
                onOpenScanner={() => setIsScannerOpen(true)}
                cart={cart}
                setCart={setCart}
              />
            )}

            {currentTab === 'inventory' && (
              <InventoryView
                key={storageTick}
                onNavigateToBarcodeStudio={(productIds) => {
                  const ids = productIds && productIds.length > 0 ? productIds : storage.getInventorySelectedIds();
                  if (ids && ids.length > 0) {
                    storage.setBarcodeStudioSelectedIds(ids);
                    setSelectedBarcodeProductIds(ids);
                  }
                  handleSelectTab('barcodes');
                }}
                onNavigateToServices={() => {
                  handleSelectTab('services');
                }}
              />
            )}

            {currentTab === 'services' && (
              <ServicesView
                key={storageTick}
                onNavigateToPos={() => handleSelectTab('pos')}
                onAddServiceToPos={(srv) => {
                  handleAddToCart(storage.convertServiceToProduct(srv));
                  handleSelectTab('pos');
                }}
              />
            )}

            {currentTab === 'sales' && (
              <SalesLedgerView key={storageTick} onNavigateToPOS={() => handleSelectTab('pos')} />
            )}

            {currentTab === 'credit' && <CreditAccountsView key={storageTick} />}

            {currentTab === 'expenses' && <ExpenseTrackerView key={storageTick} />}

            {currentTab === 'barcodes' && (
              <BarcodeStudioView
                key={storageTick}
                initialSelectedIds={selectedBarcodeProductIds}
              />
            )}

            {currentTab === 'reports' && <ReportsView key={storageTick} />}

            {currentTab === 'staff' && <StaffView key={storageTick} />}

            {currentTab === 'logs' && <ActivityLogsView key={storageTick} />}

            {currentTab === 'settings' && <SettingsView key={storageTick} />}
          </Suspense>
        </main>

        {/* Mobile Quick Bottom Navigation Bar (Smartphones & small screens) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-[#0d0d0f]/95 dark:bg-[#09090b]/95 backdrop-blur-md border-t border-[#26221c] dark:border-[#221e17] px-2 flex items-center justify-around select-none shadow-2xl">
          <button
            onClick={() => handleSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'dashboard' ? 'text-[#f5d77f]' : 'text-[#8c8273] hover:text-[#c2baa9]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Dashboard</span>
          </button>

          <button
            onClick={() => handleSelectTab('pos')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-colors relative cursor-pointer ${
              currentTab === 'pos' ? 'text-[#f5d77f]' : 'text-[#8c8273] hover:text-[#c2baa9]'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono bg-[#d4af37] text-black">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium mt-1">Register</span>
          </button>

          <button
            onClick={() => handleSelectTab('sales')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'sales' ? 'text-[#f5d77f]' : 'text-[#8c8273] hover:text-[#c2baa9]'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">History</span>
          </button>

          <button
            onClick={() => handleSelectTab('reports')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'reports' ? 'text-[#f5d77f]' : 'text-[#8c8273] hover:text-[#c2baa9]'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Reports</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl text-[#8c8273] hover:text-[#f5d77f] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Menu</span>
          </button>
        </nav>
      </div>

      {/* Global Interactive Modals */}
      {isScannerOpen && (
        <Suspense fallback={null}>
          <BarcodeScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScan={(code, product, quantity) => {
              if (product) {
                handleAddToCart(product, quantity || 1);
                setCurrentTab('pos');
              } else {
                handleBarcodeScanned(code);
              }
            }}
          />
        </Suspense>
      )}

      <UserPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {isDownloadModalOpen && (
        <Suspense fallback={null}>
          <DownloadAppModal
            isOpen={isDownloadModalOpen}
            onClose={() => setIsDownloadModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Floating Visual Urgent Restock Alert Toasts */}
      <UrgentRestockToast
        toasts={visualToasts}
        onDismiss={dismissToast}
        onQuickRestock={quickRestock}
        onNavigateToInventory={() => setCurrentTab('inventory')}
      />
    </div>
  );
}
