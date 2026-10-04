import React, { useState } from 'react';
import { StaffUser } from '../types';
import { storage } from '../services/storage';
import {
  Shield,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Lock,
  UserCheck,
  ShoppingBag,
  DollarSign,
  Package,
  FileSpreadsheet,
  Settings,
  ScrollText,
  AlertCircle,
  Save,
  Check
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const [adminUser, setAdminUser] = useState<StaffUser>(storage.getActiveUser());
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState(adminUser.email);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let updatedPin = adminUser.pin;
    if (isEditingPin) {
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        setErrorMsg('PIN must be exactly 4 numeric digits.');
        return;
      }
      if (newPin !== confirmPin) {
        setErrorMsg('PIN confirmation does not match.');
        return;
      }
      updatedPin = newPin;
    }

    let updatedPasswordHash = adminUser.passwordHash;
    let updatedPasswordSalt = adminUser.passwordSalt;

    if (isEditingPassword) {
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password confirmation does not match.');
        return;
      }
      // Import crypto helper or generate salt
      const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(salt + ':' + newPassword));
      const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      updatedPasswordSalt = salt;
      updatedPasswordHash = hash;
    }

    const updatedUser: StaffUser = {
      ...adminUser,
      email: newEmail.trim() || adminUser.email || 'admin@rahelstationary.local',
      pin: updatedPin,
      passwordHash: updatedPasswordHash,
      passwordSalt: updatedPasswordSalt,
      lastActive: new Date().toISOString()
    };

    storage.saveStaffMember(updatedUser);
    setAdminUser(updatedUser);
    setSaveSuccessMsg('Administrator credentials and password updated successfully.');
    setIsEditingPin(false);
    setNewPin('');
    setConfirmPin('');
    setIsEditingPassword(false);
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3500);
  };

  const adminPrivileges = [
    {
      title: 'POS Register & Transaction Control',
      icon: ShoppingBag,
      description: 'Full authorization to execute checkouts, apply percent/custom price discounts, hold and recall parked carts, process refunds, and accept split payments in ETB.'
    },
    {
      title: 'Cash Drawer & Shift Reconciliation',
      icon: DollarSign,
      description: 'Sole authorization to open daily register shifts, set opening float amounts, conduct cash drops to the drop-safe, and audit drawer discrepancy logs.'
    },
    {
      title: 'Inventory Catalog & SKU Control',
      icon: Package,
      description: 'Unrestricted master access to create products, bulk import Excel catalog files, generate barcodes, and adjust safety restock thresholds.'
    },
    {
      title: 'Credit Tab & Accounts Receivable',
      icon: UserCheck,
      description: 'Exclusive authority to open corporate credit accounts, assign credit limits, record partial or full balance settlements, and print debt statements.'
    },
    {
      title: 'Store Settings & ETB Currency Config',
      icon: Settings,
      description: 'Master administrative permission to manage store details, receipt header/footer messages, and ETB currency formatting.'
    },
    {
      title: 'System Security & Activity Audit',
      icon: ScrollText,
      description: 'Continuous audit oversight of all price updates, shift reconciliations, inventory movements, and system logs.'
    }
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-y-auto bg-[#0a0a0c] text-[#f4efe8] space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#f5d77f]">
              Administrator Profile & Privileges
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/35 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
              Single-User Mode (Sole Admin)
            </span>
          </div>
          <p className="text-xs text-[#a39c90] mt-0.5">
            Rahel Fira is the sole authorized administrator with full master privileges across all POS functions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#141417] border border-[#d4af37]/30 text-xs text-[#f5d77f] flex items-center gap-1.5 font-semibold">
            <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Admin PIN: {adminUser.pin}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Admin Profile Card & Credentials Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Administrator Profile Identity */}
        <div className="p-6 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-5 flex flex-col justify-between hover:border-[#d4af37]/40 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5d77f] via-[#d4af37] to-[#8f6a15] text-black font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-[#d4af37]/20 shrink-0">
                RF
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#f4efe8] truncate">
                  {adminUser.name}
                </h3>
                <div className="text-xs text-[#a39c90] truncate">
                  {adminUser.email}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/40 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#d4af37]" />
                    Master Administrator
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Authorized
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#26221c] space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#a39c90]">
                <span>System Role:</span>
                <strong className="text-[#f5d77f] font-mono capitalize">
                  {adminUser.role} (Unrestricted)
                </strong>
              </div>
              <div className="flex items-center justify-between text-[#a39c90]">
                <span>Account ID:</span>
                <span className="font-mono text-[#c4bbb0]">{adminUser.id}</span>
              </div>
              <div className="flex items-center justify-between text-[#a39c90]">
                <span>Multi-User System:</span>
                <span className="text-amber-300 font-semibold">Disabled (Single Owner)</span>
              </div>
              <div className="flex items-center justify-between text-[#a39c90]">
                <span>Status:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active & Logged In
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#1a1714] border border-[#d4af37]/30 text-[11px] text-[#c4bbb0] space-y-1">
            <div className="font-bold text-[#f5d77f] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              Sole Operator Policy
            </div>
            <p className="text-[10px] text-[#998b7a] leading-relaxed">
              No multiple user accounts or secondary cashier logins are enabled. All actions, drawer balances, and fiscal audits are attributed directly to <strong>Rahel Fira</strong>.
            </p>
          </div>
        </div>

        {/* Right 2 Columns: Credentials Update & Security Controls */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#26221c]">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#d4af37]" />
              <h3 className="font-bold text-sm text-[#f4efe8]">
                Administrator Security Credentials
              </h3>
            </div>
            <span className="text-xs text-[#a39c90]">
              Quick POS Lock & Verification
            </span>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 text-xs text-[#f5d77f] flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-[#d4af37]" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateCredentials} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Administrator Full Name
                </label>
                <input
                  type="text"
                  value={adminUser.name}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#101012] border border-[#26221c] text-[#8c8273] font-semibold cursor-not-allowed"
                />
                <span className="text-[10px] text-[#736657] mt-0.5 block">
                  Fixed to Rahel Fira (Administrator)
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Administrator Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1714] border border-[#26221c] text-[#f4efe8] focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* PIN Settings */}
            <div className="p-4 rounded-xl bg-[#18181c] border border-[#26221c] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#f4efe8]">
                    4-Digit Register PIN
                  </div>
                  <div className="text-[11px] text-[#998b7a]">
                    Used to unlock POS register or verify privileged cash drops.
                  </div>
                </div>

                {!isEditingPin ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingPin(true)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#24242c] hover:bg-[#d4af37]/20 text-[#f5d77f] border border-[#38322a] hover:border-[#d4af37]/40 transition-colors"
                  >
                    Change PIN
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPin(false);
                      setNewPin('');
                      setConfirmPin('');
                    }}
                    className="px-3 py-1.5 text-xs text-[#a39c90] hover:text-[#f4efe8]"
                  >
                    Cancel PIN Change
                  </button>
                )}
              </div>

              {isEditingPin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#26221c]">
                  <div>
                    <label className="block text-[11px] text-[#a39c90] mb-1">
                      New 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      placeholder="e.g. 1234"
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold tracking-widest text-center rounded-xl bg-[#121215] border border-[#d4af37]/50 text-[#f5d77f] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a39c90] mb-1">
                      Confirm 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={confirmPin}
                      placeholder="Repeat PIN"
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold tracking-widest text-center rounded-xl bg-[#121215] border border-[#d4af37]/50 text-[#f5d77f] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Workstation Password Settings */}
            <div className="p-4 rounded-xl bg-[#18181c] border border-[#26221c] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#f4efe8]">
                    Workstation Login Password
                  </div>
                  <div className="text-[11px] text-[#998b7a]">
                    Used to authenticate on the main login screen.
                  </div>
                </div>

                {!isEditingPassword ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingPassword(true)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#24242c] hover:bg-[#d4af37]/20 text-[#f5d77f] border border-[#38322a] hover:border-[#d4af37]/40 transition-colors cursor-pointer"
                  >
                    Change Password
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-3 py-1.5 text-xs text-[#a39c90] hover:text-[#f4efe8] cursor-pointer"
                  >
                    Cancel Password Change
                  </button>
                )}
              </div>

              {isEditingPassword && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#26221c]">
                  <div>
                    <label className="block text-[11px] text-[#a39c90] mb-1">
                      New Password (min. 6 chars)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      placeholder="Enter new password"
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#121215] border border-[#d4af37]/50 text-[#f4efe8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#a39c90] mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      placeholder="Repeat new password"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#121215] border border-[#d4af37]/50 text-[#f4efe8] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] hover:brightness-110 text-black flex items-center gap-1.5 shadow-sm shadow-[#d4af37]/20 transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-black" />
                <span>Save Administrator Settings</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Admin Privileges Grid */}
      <div className="p-6 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-[#f4efe8] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
            <span>Administrative Capabilities & Access Matrix</span>
          </h3>
          <p className="text-xs text-[#a39c90] mt-0.5">
            Full permissions granted exclusively to Rahel Fira across the application:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminPrivileges.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#18181c] border border-[#26221c] space-y-2 hover:border-[#d4af37]/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5d77f] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <h4 className="font-bold text-xs text-[#f5d77f] leading-snug">
                    {item.title}
                  </h4>
                </div>
                <p className="text-[11px] text-[#a39c90] leading-relaxed">
                  {item.description}
                </p>
                <div className="pt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Unrestricted Master Privilege</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
