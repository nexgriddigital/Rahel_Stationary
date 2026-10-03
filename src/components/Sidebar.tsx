import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Receipt,
  CreditCard,
  Wallet,
  Barcode,
  BarChart3,
  Users,
  ScrollText,
  Settings,
  Download,
  Lock,
  Wifi,
  ChevronRight,
  Shield,
  CircleDollarSign,
  Maximize2,
  LogOut
} from 'lucide-react';
import { storage } from '../services/storage';

export type NavTab = 
  | 'dashboard'
  | 'inventory'
  | 'pos'
  | 'sales'
  | 'credit'
  | 'expenses'
  | 'barcodes'
  | 'reports'
  | 'staff'
  | 'logs'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenShiftModal: () => void;
  onOpenPinModal: () => void;
  onOpenDownloadModal: () => void;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  cartItemCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenShiftModal,
  onOpenPinModal,
  onOpenDownloadModal,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
  cartItemCount = 0
}) => {
  const [showSignHoverCard, setShowSignHoverCard] = useState(false);
  const activeUser = storage.getActiveUser();
  const activeShift = storage.getActiveShift();
  const settings = storage.getSettings();
  const parkedCarts = storage.getParkedCarts();
  const creditAccounts = storage.getCreditAccounts();
  const unpaidCreditCount = creditAccounts.filter(a => a.currentBalance > 0).length;

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory Management', icon: Package },
    {
      id: 'pos',
      label: 'POS Register',
      icon: ShoppingBag,
      badge: parkedCarts.length > 0 ? `${parkedCarts.length} held` : cartItemCount > 0 ? `${cartItemCount}` : undefined,
      badgeColor: parkedCarts.length > 0 ? 'bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/30' : 'bg-[#d4af37] text-black font-bold'
    },
    { id: 'sales', label: 'Sales Ledger', icon: Receipt },
    {
      id: 'credit',
      label: 'Credit Tab',
      icon: CreditCard,
      badge: unpaidCreditCount > 0 ? `${unpaidCreditCount} due` : undefined,
      badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800/40'
    },
    { id: 'expenses', label: 'Expense Tracker', icon: Wallet },
    { id: 'barcodes', label: 'Barcode Studio', icon: Barcode },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    {
      id: 'staff',
      label: 'Administrator',
      icon: Shield,
      badge: 'Admin',
      badgeColor: 'bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/40'
    },
    { id: 'logs', label: 'Activity Logs', icon: ScrollText },
    { id: 'settings', label: 'Store Settings', icon: Settings }
  ];

  const handleNavClick = (id: NavTab) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0d0d0f] dark:bg-[#09090b] text-[#f4efe8] border-r border-[#26221c] dark:border-[#221e17] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } select-none`}
      >
        {/* Top Branding Section */}
        <div className="p-3.5 pb-2 border-b border-[#26221c] dark:border-[#221e17] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f5d77f] via-[#d4af37] to-[#997520] text-black flex items-center justify-center font-black shadow-md shadow-[#d4af37]/20">
              <span className="text-base tracking-tighter">RS</span>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight text-[#f5d77f]">
                {settings.storeName}
              </div>
              <div className="text-[10px] text-[#a39c90] tracking-tight">
                stationery & printing.
              </div>
            </div>
          </div>

          {/* Download App Sign with rich hover card */}
          <div className="relative">
            <button
              onClick={onOpenDownloadModal}
              onMouseEnter={() => setShowSignHoverCard(true)}
              onMouseLeave={() => setShowSignHoverCard(false)}
              className="group relative flex items-center gap-1 px-2 py-1 rounded-lg bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/30 text-[10px] font-semibold transition-all shadow-2xs"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5d77f] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#d4af37]"></span>
              </span>
              <Download className="w-3 h-3 text-[#d4af37]" />
              <span>App</span>
            </button>

            {/* Floating Hover Card */}
            {showSignHoverCard && (
              <div className="absolute left-full top-0 ml-2 w-72 p-3.5 rounded-xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#d4af37]/30 z-50 text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                <div className="font-bold text-xs text-[#f5d77f] mb-1 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Rahel POS Desktop & Tablet App</span>
                </div>
                <p className="text-[11px] text-[#a39c90] mb-2 leading-relaxed">
                  Click to launch or install as a dedicated kiosk register with 4 essential hardware advantages:
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#f5d77f] font-bold">1.</span>
                    <span><strong>100% Offline Protection:</strong> Register works and records transactions without store internet.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#f5d77f] font-bold">2.</span>
                    <span><strong>Dedicated Kiosk Workspace:</strong> Fullscreen window without browser address bar or tabs.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#f5d77f] font-bold">3.</span>
                    <span><strong>Hardware Acceleration:</strong> Faster barcode scanner camera and receipt thermal printer response.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[#f5d77f] font-bold">4.</span>
                    <span><strong>1-Click Fast Launch:</strong> Direct pin to taskbar, dock, or home screen.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Viewport-fitted 11 Core Navigation Tabs */}
        <nav className="flex-1 px-2.5 py-1.5 overflow-y-auto space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold shadow-sm shadow-[#d4af37]/20'
                    : 'text-[#c2baa9] hover:bg-[#d4af37]/10 hover:text-[#f5d77f]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-black' : 'text-[#8c8273] group-hover:text-[#f5d77f]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-tight ${item.badgeColor || 'bg-black/40 text-[#f5d77f]'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Shift Badge & Active User Card */}
        <div className="p-2.5 border-t border-[#26221c] dark:border-[#221e17] space-y-2 bg-[#121215] dark:bg-[#0c0c0e]">
          {/* Register Shift Badge */}
          <div
            onClick={onOpenShiftModal}
            className="p-2 rounded-xl bg-[#18181c] border border-[#2a261f] cursor-pointer hover:border-[#d4af37]/60 transition-colors shadow-2xs"
          >
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-semibold text-[#f5d77f]">
                <CircleDollarSign className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>
                  {activeShift ? `Shift #${activeShift.shiftNumber}` : 'Drawer Closed'}
                </span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                  activeShift
                    ? 'bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/30'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                }`}
              >
                {activeShift ? 'Open' : 'Reconciled'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-[#a39c90]">
              <span>Drawer Expected:</span>
              <span className="font-mono font-bold text-[#f5d77f]">
                {settings.currencySymbol}
                {activeShift ? activeShift.expectedCash.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Administrator Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#18181c] border border-[#2a261f]">
            <div
              onClick={onOpenPinModal}
              className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f5d77f] to-[#b38728] text-black font-bold text-xs flex items-center justify-center shrink-0">
                {activeUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate leading-tight text-[#f4efe8]">
                  {activeUser.name}
                </div>
                <div className="text-[10px] text-[#f5d77f] capitalize flex items-center gap-1 font-medium">
                  <Shield className="w-2.5 h-2.5 text-[#d4af37]" />
                  <span>Admin Privileges</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onOpenPinModal}
                title="Lock Register / Admin PIN"
                className="p-1.5 rounded-lg text-[#8c8273] hover:text-[#f5d77f] hover:bg-[#d4af37]/10 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out Workstation"
                  className="p-1.5 rounded-lg text-[#8c8273] hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
