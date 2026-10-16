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
  CloudUpload,
  CloudOff,
  CheckCircle2,
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
import { storage, StoreSyncStatus } from '../services/storage';
import { Product, AppNotification, LOW_STOCK_THRESHOLD } from '../types';
import { BrandLogo } from './BrandLogo';

// Relative time helper for human-readable notification timestamps (e.g. "2 minutes ago")
function formatRelativeTime(timestamp: string): string {
  try {
    const diffMs = Math.max(0, Date.now() - new Date(timestamp).getTime());
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return timestamp;
  }
}

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

  const syncMenuRef = useRef<HTMLDivElement>(null);
  const [isSyncDetailsOpen, setIsSyncDetailsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<StoreSyncStatus>(() => storage.getSyncStatus());

  // Close more menu, notification menu & sync popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (syncMenuRef.current && !syncMenuRef.current.contains(e.target as Node)) {
        setIsSyncDetailsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen to storage sync events
  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setSyncStatus(storage.getSyncStatus());
    });
    return unsub;
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await storage.syncNow();
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSyncStatus(storage.getSyncStatus());
      storage.logActivity('CLOUD_SYNC', 'security', 'Central store data synced uniformly across all devices.');
    } catch (e) {
      console.warn('Manual sync error:', e);
    } finally {
      setIsSyncing(false);
    }
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
          <BrandLogo size={28} className="shrink-0" />
          <span className="font-bold text-base sm:text-lg tracking-tight text-[#f5d77f]">
            {settings.storeName}
          </span>
          <span className="hidden sm:inline-block text-[11px] text-[#8c8273] font-normal border-l border-[#2a261f] pl-2">
            stationery & printing.
          </span>
        </div>
      </div>

      {/* Zone 2: Centered Product Search with QR Scanner Button */}
      <div className="relative flex-1 max-w-md mx-2 sm:mx-6">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-[#8c8273] pointer-events-none" />
          <input
            type="text"
            placeholder="Search stationery, SKU, QR code, paper size..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full pl-9 pr-10 py-1.5 text-xs rounded-xl bg-[#141417] text-[#f4efe8] border border-[#2a261f] placeholder-[#7d7465] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 transition-all shadow-2xs"
          />
          <button
            type="button"
            onClick={onOpenScanner}
            title="Launch Camera QR Scanner (F4)"
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
                      SKU: {p.sku} · QR: {p.qrCode || p.sku}
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
                className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 rounded-full text-[10px] font-bold font-mono items-center justify-center text-black shadow-2xs ${
                  urgentRestockCount > 0 ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400/40' : 'bg-[#d4af37]'
                }`}
              >
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Mobile Backdrop to click outside and close cleanly */}
          {isNotifOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs sm:hidden"
              onClick={() => setIsNotifOpen(false)}
            />
          )}

          {/* Responsive Notification Center Panel (Mobile Centered + Desktop Anchored Dropdown) */}
          {isNotifOpen && (
            <div className="fixed inset-x-2 top-14 sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-md mx-auto sm:max-w-none sm:mx-0 max-h-[82vh] rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#d4af37]/40 p-3 sm:p-3.5 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#26221c]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#f5d77f] truncate">
                      Notifications & Alerts
                    </h4>
                    <p className="text-[10px] text-[#8c8273] truncate">
                      Automated stock monitoring
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {unreadNotificationCount > 0 && onMarkAllNotificationsRead && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-[#f5d77f] hover:bg-[#d4af37]/15 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Mark all notifications as read"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Mark Read</span>
                    </button>
                  )}
                  {notifications.length > 0 && onClearAllNotifications && (
                    <button
                      onClick={onClearAllNotifications}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-[#8c8273] hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Clear notifications list"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[#8c8273] hover:text-[#f4efe8] hover:bg-white/10 transition-colors cursor-pointer ml-1"
                    title="Close notification panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#1a1a20] rounded-xl text-[11px] font-semibold border border-[#2a261f]">
                <button
                  onClick={() => setNotifTab('all')}
                  className={`flex-1 py-1 rounded-lg transition-colors text-center cursor-pointer ${
                    notifTab === 'all'
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-black shadow-2xs font-bold'
                      : 'text-[#8c8273] hover:text-[#f4efe8]'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifTab('urgent')}
                  className={`flex-1 py-1 rounded-lg transition-colors text-center flex items-center justify-center gap-1 cursor-pointer ${
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
                  className={`flex-1 py-1 rounded-lg transition-colors text-center cursor-pointer ${
                    notifTab === 'unread'
                      ? 'bg-[#d4af37] text-black shadow-2xs font-bold'
                      : 'text-[#8c8273] hover:text-[#f4efe8]'
                  }`}
                >
                  Unread ({unreadNotificationCount})
                </button>
              </div>

              {/* Notification Cards List */}
              <div className="max-h-[60vh] sm:max-h-72 overflow-y-auto space-y-2 pr-0.5">
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
                    const threshold = LOW_STOCK_THRESHOLD;
                    const percent = Math.min(100, Math.round((stock / Math.max(1, threshold)) * 100));

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read && onMarkNotificationRead) {
                            onMarkNotificationRead(notif.id);
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
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
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                isDepleted
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : isRestock
                                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b38728] text-black font-bold'
                                  : 'bg-[#2a261f] text-[#f5d77f]'
                              }`}
                            >
                              {isDepleted ? (
                                <>
                                  <AlertTriangle className="w-2.5 h-2.5 text-white" />
                                  <span>Urgent Restock</span>
                                </>
                              ) : isRestock ? (
                                <>
                                  <AlertCircle className="w-2.5 h-2.5 text-black" />
                                  <span>Low Stock Alert</span>
                                </>
                              ) : (
                                <span>Notice</span>
                              )}
                            </span>
                            <span className="font-bold text-xs truncate max-w-[170px] text-[#f4efe8]">
                              {notif.productName || notif.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-[#998b7a] font-medium whitespace-nowrap">
                              {formatRelativeTime(notif.timestamp)}
                            </span>
                            {!notif.read ? (
                              <span
                                className="w-2 h-2 rounded-full bg-[#d4af37] shrink-0"
                                title="Unread"
                              />
                            ) : (
                              <span className="text-[9px] text-[#6b6255]">Read</span>
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
                        <div className="flex items-center gap-2 pt-1 border-t border-[#2a261f]" onClick={(e) => e.stopPropagation()}>
                          {notif.productId && onQuickRestock && (
                            <button
                              onClick={() => {
                                onQuickRestock(notif.productId!, 15);
                                if (onMarkNotificationRead) onMarkNotificationRead(notif.id);
                              }}
                              className="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-black hover:brightness-110 flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
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
                              className="py-1 px-2.5 rounded-lg text-[10px] font-semibold bg-[#1a1a20] text-[#f5d77f] border border-[#d4af37]/30 flex items-center gap-1 hover:bg-[#d4af37]/15 transition-colors ml-auto shadow-2xs cursor-pointer"
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

        {/* Multi-Device Uniform Cloud Sync Status Indicator (Visible on Mobile & Desktop) */}
        <div className="relative" ref={syncMenuRef}>
          <button
            onClick={() => setIsSyncDetailsOpen(!isSyncDetailsOpen)}
            title={
              syncStatus.state === 'just_uploaded'
                ? `Item uploaded successfully to cloud server (v${syncStatus.version})`
                : syncStatus.state === 'uploading'
                ? `Uploading changes to cloud server...`
                : syncStatus.state === 'offline'
                ? `Offline: changes stored locally`
                : `In Sync: Central cloud database active (v${syncStatus.version})`
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer select-none ${
              syncStatus.state === 'just_uploaded'
                ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse'
                : syncStatus.state === 'uploading'
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : syncStatus.state === 'syncing' || isSyncing
                ? 'bg-[#141417] border-[#d4af37]/60 text-[#f5d77f]'
                : syncStatus.state === 'offline' || syncStatus.state === 'error'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                : 'bg-[#141417] hover:bg-[#d4af37]/15 border-[#2a261f] text-[#c2baa9] hover:text-[#f5d77f]'
            }`}
          >
            {/* Dynamic visual indicator dot */}
            {syncStatus.state === 'just_uploaded' ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : syncStatus.state === 'uploading' ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            ) : syncStatus.state === 'offline' || syncStatus.state === 'error' ? (
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            )}

            {/* Dynamic Status Icon */}
            {syncStatus.state === 'just_uploaded' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : syncStatus.state === 'uploading' ? (
              <CloudUpload className="w-3.5 h-3.5 text-amber-300 animate-bounce shrink-0" />
            ) : syncStatus.state === 'syncing' || isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-[#d4af37] animate-spin shrink-0" />
            ) : syncStatus.state === 'offline' ? (
              <CloudOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <CloudCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}

            {/* Status Label (Responsive) */}
            <span className="text-[11px] font-semibold tracking-tight">
              {syncStatus.state === 'just_uploaded' ? (
                <>
                  <span className="hidden sm:inline">Uploaded</span>
                  <span className="sm:hidden">Saved</span>
                  <span className="hidden md:inline font-mono text-[10px] ml-1 opacity-80">(v{syncStatus.version})</span>
                </>
              ) : syncStatus.state === 'uploading' ? (
                <>
                  <span className="hidden sm:inline">Uploading...</span>
                  <span className="sm:hidden">Sync...</span>
                </>
              ) : syncStatus.state === 'syncing' || isSyncing ? (
                <>
                  <span className="hidden sm:inline">Syncing...</span>
                  <span className="sm:hidden">Sync...</span>
                </>
              ) : syncStatus.state === 'offline' ? (
                <span>Offline</span>
              ) : (
                <>
                  <span className="hidden sm:inline">In Sync</span>
                  <span className="font-mono text-[10px] ml-1 opacity-80">v{syncStatus.version}</span>
                </>
              )}
            </span>
          </button>

          {/* Sync Details Dropdown Panel */}
          {isSyncDetailsOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#2a261f] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#26221c] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    syncStatus.state === 'just_uploaded'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : syncStatus.state === 'uploading'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-[#d4af37]/15 text-[#f5d77f]'
                  }`}>
                    {syncStatus.state === 'just_uploaded' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : syncStatus.state === 'uploading' ? (
                      <CloudUpload className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CloudCheck className="w-4 h-4 text-[#d4af37]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#f5d77f]">
                      Cloud Database Status
                    </h4>
                    <span className="text-[10px] text-[#8c8273]">
                      Uniform multi-device engine
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-[#24242c] font-mono text-[10px] font-bold text-[#e0d8cc]">
                  v{syncStatus.version}
                </span>
              </div>

              {/* Status explanation */}
              <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                syncStatus.state === 'just_uploaded'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : syncStatus.state === 'uploading'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : syncStatus.state === 'offline'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-[#1a1714] border-[#2a261f] text-[#c2baa9]'
              }`}>
                {syncStatus.state === 'just_uploaded' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : syncStatus.state === 'uploading' ? (
                  <RefreshCw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                )}
                <div className="text-[11px] leading-snug">
                  {syncStatus.state === 'just_uploaded' && (
                    <p>
                      <strong>New items uploaded!</strong> All updates successfully committed to the central server.
                    </p>
                  )}
                  {syncStatus.state === 'uploading' && (
                    <p>
                      <strong>Uploading changes...</strong> Transmitting local mutations to the central server.
                    </p>
                  )}
                  {syncStatus.state === 'synced' && (
                    <p>
                      <strong>100% In Sync.</strong> Your local workstation is uniform with all connected phones, tablets, and computers.
                    </p>
                  )}
                  {syncStatus.state === 'offline' && (
                    <p>
                      <strong>Offline mode.</strong> Changes are safely saved locally and will upload once reconnected.
                    </p>
                  )}
                  {syncStatus.state === 'error' && (
                    <p>
                      <strong>Sync notice:</strong> {syncStatus.lastErrorMessage || 'Temporary network retry in progress.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Upload Item Feedback */}
              {syncStatus.lastUploadedItemName && (
                <div className="bg-[#101012] p-2 rounded-xl border border-[#221e17] text-[11px] space-y-0.5">
                  <span className="text-[10px] text-[#7d7465] uppercase tracking-wider font-bold">
                    Last Transmitted Item
                  </span>
                  <div className="flex items-center justify-between font-medium text-[#f4efe8]">
                    <span className="truncate max-w-[180px]">{syncStatus.lastUploadedItemName}</span>
                    <span className="text-[10px] text-emerald-400 font-bold shrink-0">Uploaded</span>
                  </div>
                </div>
              )}

              {/* Last sync time */}
              <div className="flex items-center justify-between text-[11px] text-[#8c8273] px-1">
                <span>Last verified sync:</span>
                <span className="font-mono text-[#e0d8cc] font-medium">{lastSyncTime}</span>
              </div>

              {/* Action buttons */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleManualSync();
                  }}
                  disabled={isSyncing}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#d4af37]/20 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-black ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing Now...' : 'Force Cloud Sync'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSyncDetailsOpen(false)}
                  className="py-2 px-3 rounded-xl bg-[#202028] hover:bg-[#282834] text-[#c2baa9] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
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

              {/* Central Multi-Device Uniform Cloud Sync Status */}
              <div className="p-2.5 rounded-xl bg-[#1a1a20] border border-[#2a261f] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {syncStatus.state === 'just_uploaded' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : syncStatus.state === 'uploading' ? (
                    <CloudUpload className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                  ) : syncStatus.state === 'offline' ? (
                    <CloudOff className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <CloudCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-[11px] text-[#f4efe8] flex items-center gap-1.5">
                      <span>Cloud Database</span>
                      {syncStatus.state === 'just_uploaded' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">Uploaded</span>
                      )}
                      {syncStatus.state === 'uploading' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">Uploading</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#8c8273]">
                      v{syncStatus.version} · {syncStatus.lastUploadedItemName ? `Last: ${syncStatus.lastUploadedItemName.slice(0, 16)}` : `Synced: ${lastSyncTime}`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  title="Force Sync Now"
                  className="p-1.5 rounded-lg bg-[#24242c] hover:bg-[#d4af37]/20 text-[#f5d77f] transition-colors cursor-pointer"
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

                {/* Camera QR Scanner */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenScanner();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#d4af37]/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-[#f5d77f]" />
                    <span>QR Scanner</span>
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

                {/* Download POS Android APK */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenDownloadModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#f5d77f] hover:bg-[#d4af37]/10 transition-colors font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Download App (.APK)</span>
                  </div>
                  <span className="text-[10px] bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/30 px-1.5 py-0.2 rounded font-mono font-bold">
                    Android APK
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
