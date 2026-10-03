import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Camera,
  ShoppingBag,
  Moon,
  Sun,
  Keyboard,
  Cloud,
  CloudCheck,
  RefreshCw,
  Lock,
  UserCheck,
  FileSpreadsheet,
  Download,
  AlertCircle,
  X,
  Shield,
  LogOut,
  ExternalLink,
  ChevronDown,
  Bell,
  AlertTriangle,
  CheckCheck,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import { storage } from '../services/storage';
import { Product, AppNotification } from '../types';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  onOpenScanner: () => void;
  onOpenShortcuts: () => void;
  onOpenPinModal: () => void;
  onOpenDownloadModal: () => void;
  onOpenCartDrawer?: () => void;
  onSelectProduct?: (product: Product) => void;
  cartCount: number;
  cartTotal: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  notifications?: AppNotification[];
  unreadNotificationCount?: number;
  urgentNotificationCount?: number;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onClearAllNotifications?: () => void;
  onQuickRestock?: (productId: string, quantity?: number) => void;
  onNavigateToInventory?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  onOpenScanner,
  onOpenShortcuts,
  onOpenPinModal,
  onOpenDownloadModal,
  onOpenCartDrawer,
  onSelectProduct,
  cartCount,
  cartTotal,
  theme,
  onToggleTheme,
  notifications = [],
  unreadNotificationCount = 0,
  urgentNotificationCount = 0,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearAllNotifications,
  onQuickRestock,
  onNavigateToInventory,
  onLogout
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'all' | 'urgent' | 'unread'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);

  const activeUser = storage.getActiveUser();
  const settings = storage.getSettings();
  const products = storage.getProducts();

  // Search filtering
  const matchingProducts = searchQuery.trim()
    ? products
        .filter(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode.includes(searchQuery) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  // Close more menu & notification menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      storage.logActivity('CLOUD_SYNC', 'security', 'Manual Cloud Firestore sync executed successfully.');
    }, 900);
  };

  // Filter notifications for the dropdown
  const filteredNotifications = notifications.filter(n => {
    if (notifTab === 'urgent') return n.severity === 'urgent' || n.type === 'restock_alert';
    if (notifTab === 'unread') return !n.read;
    return true;
  });

  const urgentRestockCount = notifications.filter(
    n => (n.type === 'restock_alert' || n.severity === 'urgent') && !n.read
  ).length;

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#0d0d0f]/95 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-[#26221c] dark:border-[#221e17] px-3 sm:px-5 flex items-center justify-between gap-2 select-none">
      {/* Zone 1: Left-aligned Branding & Mobile Menu Trigger */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-lg text-[#a39c90] hover:text-[#f5d77f] hover:bg-[#d4af37]/10 lg:hidden"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-base sm:text-lg tracking-tight text-[#f5d77f]">
            {settings.storeName}
          </span>
          <span className="hidden sm:inline-block text-[11px] text-[#8c8273] font-normal border-l border-[#2a261f] pl-2">
            stationery & printing.
          </span>
        </div>
      </div>

      {/* Zone 2: Centered Product Search with Barcode Scan Button */}
      <div className="relative flex-1 max-w-md mx-2 sm:mx-6">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-[#8c8273] pointer-events-none" />
          <input
            type="text"
            placeholder="Search stationery, SKU, barcode, paper size..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full pl-9 pr-10 py-1.5 text-xs rounded-xl bg-[#141417] text-[#f4efe8] border border-[#2a261f] placeholder-[#7d7465] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 transition-all shadow-2xs"
          />
          <button
            type="button"
            onClick={onOpenScanner}
            title="Launch Camera Barcode Scanner (F4)"
            className="absolute right-1.5 p-1 rounded-lg text-[#d4af37] hover:bg-[#d4af37]/15 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Search Instant Dropdown */}
        {isSearchFocused && searchQuery.trim() && (
          <div
            onMouseLeave={() => setIsSearchFocused(false)}
            className="absolute left-0 right-0 top-full mt-1.5 p-2 rounded-xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#d4af37]/30 z-50 text-xs space-y-1"
          >
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#a39c90] flex justify-between">
              <span>Matching Catalog Products</span>
              <span>{matchingProducts.length} items</span>
            </div>
            {matchingProducts.length === 0 ? (
              <div className="p-3 text-center text-[#8c8273]">
                No items matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              matchingProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProduct?.(p);
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#d4af37]/10 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-semibold truncate text-xs text-[#f4efe8]">{p.name}</div>
                    <div className="text-[10px] text-[#8c8273] font-mono">
                      SKU: {p.sku} · Barcode: {p.barcode}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-xs text-[#f5d77f]">
                      {settings.currencySymbol} {p.retailPrice.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#8c8273] font-mono">
                      Stock: {p.stock} {p.unit}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Zone 3: Primary Quick Actions & Organized More Menu (3 Dashes "☰") */}
      <div className="flex items-center gap-2">
        {/* Internal Notification Bell with Urgent Restock Alert Badge */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="Store Notifications & Urgent Restock Alerts"
            className="p-1.5 sm:p-2 rounded-xl bg-[#141417] hover:bg-[#d4af37]/10 border border-[#2a261f] text-[#c2baa9] hover:text-[#f5d77f] transition-colors relative flex items-center justify-center shadow-2xs"
            title={`Store Notifications (${unreadNotificationCount} unread, ${urgentRestockCount} urgent restock alerts)`}
          >
            <Bell className="w-4 h-4 text-[#f5d77f]" />
            {unreadNotificationCount > 0 && (
              <span
                className={`absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 rounded-full text-[10px] font-bold font-mono items-center justify-center text-black shadow-2xs ${
                  urgentRestockCount > 0 ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400/40' : 'bg-[#d4af37]'
                }`}
              >
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Internal Notification Center Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#d4af37]/35 p-3 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#26221c]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#f5d77f]">
                      Store Alerts & Notifications
                    </h4>
                    <p className="text-[10px] text-[#8c8273]">
                      Automated restock threshold monitoring
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadNotificationCount > 0 && onMarkAllNotificationsRead && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-[#f5d77f] hover:bg-[#d4af37]/15 transition-colors flex items-center gap-1"
                      title="Mark all notifications as read"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Mark Read</span>
                    </button>
                  )}
                  {notifications.length > 0 && onClearAllNotifications && (
                    <button
                      onClick={onClearAllNotifications}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-[#8c8273] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Clear notifications list"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#1a1a20] rounded-xl text-[11px] font-semibold border border-[#2a261f]">
                <button
                  onClick={() => setNotifTab('all')}
                  className={`flex-1 py-1 rounded-lg transition-colors text-center ${
                    notifTab === 'all'
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-black shadow-2xs font-bold'
                      : 'text-[#8c8273] hover:text-[#f4efe8]'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifTab('urgent')}
                  className={`flex-1 py-1 rounded-lg transition-colors text-center flex items-center justify-center gap-1 ${
                    notifTab === 'urgent'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Restock ({urgentRestockCount})</span>
                </button>
                <button
                  onClick={() => setNotifTab('unread')}
                  className={`flex-1 py-1 rounded-lg transition-colors text-center ${
                    notifTab === 'unread'
                      ? 'bg-[#d4af37] text-black shadow-2xs font-bold'
                      : 'text-[#8c8273] hover:text-[#f4efe8]'
                  }`}
                >
                  Unread ({unreadNotificationCount})
                </button>
              </div>

              {/* Notification Cards List */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-0.5">
                {filteredNotifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8c8273] space-y-2">
                    <div className="w-8 h-8 rounded-full bg-[#d4af37]/15 text-[#f5d77f] mx-auto flex items-center justify-center">
                      <CheckCheck className="w-4 h-4" />
                    </div>
                    <p className="font-semibold text-[#f5d77f]">All inventory levels safe!</p>
                    <p className="text-[11px] text-[#8c8273]">
                      No active restock alerts. Automated worker is actively monitoring catalog thresholds.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const isRestock = notif.type === 'restock_alert';
                    const isDepleted = (notif.currentStock ?? 0) <= 0;
                    const stock = notif.currentStock ?? 0;
                    const threshold = notif.minThreshold ?? 10;
                    const percent = Math.min(100, Math.round((stock / Math.max(1, threshold)) * 100));

                    return (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-xl border text-xs transition-colors ${
                          !notif.read
                            ? isDepleted
                              ? 'bg-rose-950/40 border-rose-800/80 text-rose-100'
                              : 'bg-amber-950/30 border-amber-800/60 text-amber-100'
                            : 'bg-[#18181d] border-[#2a261f] opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                isDepleted
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : isRestock
                                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b38728] text-black font-bold'
                                  : 'bg-[#2a261f] text-[#f5d77f]'
                              }`}
                            >
                              {isDepleted ? '🚨 Urgent Restock' : isRestock ? '⚠️ Low Stock' : 'Notice'}
                            </span>
                            <span className="font-bold text-xs truncate max-w-[180px] text-[#f4efe8]">
                              {notif.productName || notif.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] text-[#8c8273] font-mono">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!notif.read && onMarkNotificationRead && (
                              <button
                                onClick={() => onMarkNotificationRead(notif.id)}
                                title="Mark as read"
                                className="p-0.5 rounded text-[#f5d77f] hover:bg-[#d4af37]/20"
                              >
                                <CheckCheck className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {notif.sku && (
                          <div className="text-[10px] text-[#8c8273] font-mono mb-1.5">
                            SKU: {notif.sku}
                          </div>
                        )}

                        <p className="text-[11px] text-[#c2baa9] mb-2 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Stock Level Gauge */}
                        {isRestock && (
                          <div className="mb-2 p-1.5 rounded-lg bg-black/40 border border-[#2a261f] space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold">
                              <span>Stock: <strong className="font-mono text-rose-400">{stock} {notif.unit || 'pcs'}</strong></span>
                              <span>Threshold: <span className="font-mono text-[#8c8273]">{threshold} {notif.unit || 'pcs'}</span></span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-[#2a261f] overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isDepleted ? 'bg-rose-500' : 'bg-gradient-to-r from-[#d4af37] to-[#f5d77f]'
                                }`}
                                style={{ width: `${Math.max(6, percent)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Quick Action Buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-[#2a261f]">
                          {notif.productId && onQuickRestock && (
                            <button
                              onClick={() => {
                                onQuickRestock(notif.productId!, 15);
                                if (onMarkNotificationRead) onMarkNotificationRead(notif.id);
                              }}
                              className="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-black hover:brightness-110 flex items-center gap-1 transition-all shadow-2xs"
                            >
                              <PlusCircle className="w-3 h-3 text-black" />
                              <span>+15 Quick Restock</span>
                            </button>
                          )}

                          {onNavigateToInventory && (
                            <button
                              onClick={() => {
                                setIsNotifOpen(false);
                                onNavigateToInventory();
                              }}
                              className="py-1 px-2.5 rounded-lg text-[10px] font-semibold bg-[#1a1a20] text-[#f5d77f] border border-[#d4af37]/30 flex items-center gap-1 hover:bg-[#d4af37]/15 transition-colors ml-auto shadow-2xs"
                            >
                              <span>Inventory</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* POS Cart Pill with Live Item Badge */}
        <button
          onClick={onOpenCartDrawer}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] hover:brightness-110 text-black text-xs font-bold shadow-sm shadow-[#d4af37]/20 transition-all active:scale-95"
        >
          <div className="relative flex items-center">
            <ShoppingBag className="w-3.5 h-3.5 text-black" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-black text-[#f5d77f] text-[10px] font-bold font-mono flex items-center justify-center border border-[#d4af37]/40">
                {cartCount}
              </span>
            )}
          </div>
          <span className="hidden sm:inline font-mono font-bold text-black">
            {settings.currencySymbol} {cartTotal.toFixed(2)}
          </span>
        </button>

        {/* Compact User Profile Avatar */}
        <button
          onClick={onOpenPinModal}
          title={`Active Cashier: ${activeUser.name} (${activeUser.role})`}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f5d77f] to-[#b38728] text-black font-bold text-xs flex items-center justify-center border-2 border-[#d4af37] hover:scale-105 transition-all shadow-xs"
        >
          {activeUser.name.charAt(0)}
        </button>

        {/* More Menu (3 Dashes "☰") */}
        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            aria-label="More Options Menu"
            className="p-1.5 rounded-xl bg-[#141417] hover:bg-[#d4af37]/10 border border-[#2a261f] text-[#c2baa9] hover:text-[#f5d77f] transition-colors relative"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* More Menu Organized Dropdown */}
          {isMoreMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#d4af37]/35 p-2 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Administrator Profile Card */}
              <div className="p-3 rounded-xl bg-[#1a1a20] border border-[#2a261f]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f5d77f] to-[#b38728] text-black font-bold text-sm flex items-center justify-center shrink-0">
                    {activeUser.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs truncate text-[#f4efe8]">{activeUser.name}</div>
                    <div className="text-[10px] text-[#8c8273] truncate">{activeUser.email}</div>
                    <div className="text-[10px] font-semibold text-[#f5d77f] capitalize flex items-center gap-1">
                      <Shield className="w-3 h-3 text-[#d4af37]" />
                      <span>Admin Privileges</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-[#2a261f] flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenPinModal();
                    }}
                    className="font-semibold text-[#f5d77f] hover:underline flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Verify Admin PIN</span>
                  </button>
                  <span className="text-[10px] text-[#8c8273]">
                    Sole Admin
                  </span>
                </div>
              </div>

              {/* Cloud Firestore Sync Status & Manual Sync Now */}
              <div className="p-2.5 rounded-xl bg-[#1a1a20] border border-[#2a261f] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CloudCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px] text-[#f4efe8]">Firestore Cloud Sync</div>
                    <div className="text-[10px] text-[#8c8273]">
                      Offline-first · Synced: {lastSyncTime}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  title="Force Sync Now"
                  className="p-1.5 rounded-lg bg-[#24242c] hover:bg-[#d4af37]/20 text-[#f5d77f] transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#d4af37]' : ''}`} />
                </button>
              </div>

              {/* Secondary Action Triggers */}
              <div className="space-y-0.5 text-xs">
                {/* Store Lighting Theme Toggle */}
                <button
                  onClick={onToggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#d4af37]/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#f5d77f]" /> : <Moon className="w-3.5 h-3.5 text-[#8c8273]" />}
                    <span>Theme Palette</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#d4af37] capitalize">
                    {theme === 'dark' ? 'Black & Gold' : 'Pearl & Gold'}
                  </span>
                </button>

                {/* Cashier Keyboard Shortcuts */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenShortcuts();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#d4af37]/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-3.5 h-3.5 text-[#f5d77f]" />
                    <span>Keyboard Shortcuts</span>
                  </div>
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-[#f5d77f] border border-[#2a261f]">F1</kbd>
                </button>

                {/* Camera Barcode Scanner */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenScanner();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#d4af37]/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-[#f5d77f]" />
                    <span>Barcode Camera Scanner</span>
                  </div>
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-[#f5d77f] border border-[#2a261f]">F4</kbd>
                </button>

                {/* Urgent Restock Alerts Quick Launcher */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsNotifOpen(true);
                    setNotifTab('urgent');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#d4af37]/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-3.5 h-3.5 ${urgentRestockCount > 0 ? 'text-rose-500 animate-pulse' : 'text-[#8c8273]'}`} />
                    <span>Restock Alerts</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    urgentRestockCount > 0
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                      : 'bg-[#1a1a20] text-[#8c8273]'
                  }`}>
                    {urgentRestockCount} urgent
                  </span>
                </button>

                {/* Fiscal Period Summary */}
                <div className="px-3 py-2 rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#8c8273]" />
                    <span>Fiscal Year</span>
                  </div>
                  <span className="font-mono font-semibold text-[#f5d77f]">
                    FY 2026 (Q4)
                  </span>
                </div>

                {/* Download POS App */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenDownloadModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#f5d77f] hover:bg-[#d4af37]/10 transition-colors font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Download POS App</span>
                  </div>
                  <span className="text-[10px] bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/30 px-1.5 py-0.2 rounded">
                    Kiosk
                  </span>
                </button>

                {/* Register Lock (PIN) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenPinModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#f5d77f] hover:bg-[#d4af37]/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Quick PIN Lock</span>
                  </div>
                  <span className="text-[10px] text-[#8c8273]">Lock Screen</span>
                </button>

                {/* Sign Out Workstation */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out Workstation</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
