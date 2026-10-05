/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  History,
  BarChart3,
  Menu
} from 'lucide-react';
import { storage } from './services/storage';
import { CartItem, Sale, Product } from './types';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { UserPinModal } from './components/UserPinModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { UrgentRestockToast } from './components/UrgentRestockToast';
import { useRestockWorker } from './services/useRestockWorker';
import { UserSession } from './types';

// Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { PosRegisterView } from './views/PosRegisterView';
import { InventoryView } from './views/InventoryView';
import { SalesLedgerView } from './views/SalesLedgerView';
import { CreditAccountsView } from './views/CreditAccountsView';
import { ExpenseTrackerView } from './views/ExpenseTrackerView';
import { BarcodeStudioView } from './views/BarcodeStudioView';
import { ReportsView } from './views/ReportsView';
import { StaffView } from './views/StaffView';
import { ActivityLogsView } from './views/ActivityLogsView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => storage.getSession());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
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
    checkIntervalMs: 12000,
    onNavigateToInventory: () => setCurrentTab('inventory')
  });

  // Reactivity tick for storage updates & session tracking
  const [, setStorageTick] = useState(0);

  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setStorageTick((t) => t + 1);
      setSession(storage.getSession());
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    storage.logout();
    setSession(null);
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

  // Unauthenticated users are protected and must log in
  if (!session) {
    return (
      <LoginView
        onLoginSuccess={(sess) => {
          setSession(sess);
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f4efe8] flex antialiased">
      {/* Side Navigation Bar (Desktop & Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
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

          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          )}

          {currentTab === 'pos' && (
            <PosRegisterView
              onNavigateToHistory={() => setCurrentTab('sales')}
              onOpenScanner={() => setIsScannerOpen(true)}
              cart={cart}
              setCart={setCart}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              onNavigateToBarcodeStudio={(_productIds) => {
                setCurrentTab('barcodes');
              }}
            />
          )}

          {currentTab === 'sales' && (
            <SalesLedgerView onNavigateToPOS={() => setCurrentTab('pos')} />
          )}

          {currentTab === 'credit' && <CreditAccountsView />}

          {currentTab === 'expenses' && <ExpenseTrackerView />}

          {currentTab === 'barcodes' && <BarcodeStudioView />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'staff' && <StaffView />}

          {currentTab === 'logs' && <ActivityLogsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>

        {/* Mobile Quick Bottom Navigation Bar (Smartphones & small screens) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-[#0d0d0f]/95 dark:bg-[#09090b]/95 backdrop-blur-md border-t border-[#26221c] dark:border-[#221e17] px-2 flex items-center justify-around select-none shadow-2xl">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'dashboard' ? 'text-[#f5d77f]' : 'text-[#8c8273] hover:text-[#c2baa9]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('pos')}
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
            onClick={() => setCurrentTab('sales')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'sales' ? 'text-[#f5d77f]' : 'text-[#8c8273] hover:text-[#c2baa9]'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">History</span>
          </button>

          <button
            onClick={() => setCurrentTab('reports')}
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

      <UserPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

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
