import React, { useState } from 'react';
import { StaffUser, Role } from '../types';
import { storage } from '../services/storage';
import { Users, Plus, Shield, CheckCircle, Clock, Trash2, KeyRound, X } from 'lucide-react';

export const StaffView: React.FC = () => {
  const [staff, setStaff] = useState<StaffUser[]>(storage.getStaff());
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('cashier');
  const [pin, setPin] = useState('');

  const refreshList = () => {
    setStaff(storage.getStaff());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || pin.length !== 4) return;

    const newStaff: StaffUser = {
      id: 'user_' + Date.now(),
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@rahelstationary.com`,
      role,
      pin,
      approved: true,
      lastActive: new Date().toISOString()
    };

    storage.saveStaffMember(newStaff);
    refreshList();
    setShowAddModal(false);
    setName('');
    setEmail('');
    setPin('');
  };

  const handleApprove = (userId: string) => {
    storage.approveStaffMember(userId);
    refreshList();
  };

  const handleDelete = (userId: string) => {
    if (confirm('Delete this staff member profile?')) {
      storage.deleteStaffMember(userId);
      refreshList();
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-hidden bg-[#0a0a0c] text-[#f4efe8]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <h2 className="text-xl font-bold text-[#f5d77f]">
            Staff Members & Role-Based Access Control
          </h2>
          <p className="text-xs text-[#998b7a]">
            Manage cashiers, managers, auditors, 4-digit PINs & account approval workflows.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] hover:to-[#b88c14] text-black flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="flex-1 mt-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {staff.map((user) => (
          <div
            key={user.id}
            className="p-4 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#aa8010] text-black font-bold text-sm flex items-center justify-center shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#f4efe8]">
                      {user.name}
                    </h3>
                    <div className="text-[11px] text-[#998b7a]">
                      {user.email}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex items-center gap-1 ${
                    user.role === 'admin'
                      ? 'bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f5d77f]'
                      : user.role === 'manager'
                      ? 'bg-amber-900/40 border border-amber-800/40 text-amber-200'
                      : user.role === 'auditor'
                      ? 'bg-blue-950/60 border border-blue-800/40 text-blue-200'
                      : 'bg-white/5 border border-white/10 text-[#c4bbb0]'
                  }`}
                >
                  <Shield className="w-3 h-3 text-[#d4af37]" />
                  <span>{user.role}</span>
                </span>
              </div>

              {/* Status / Approval */}
              <div className="mt-3 pt-3 border-t border-[#26221c] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {user.approved ? (
                    <span className="flex items-center gap-1 text-[#f5d77f] font-semibold text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 text-[#d4af37]" />
                      Approved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      Pending Approval
                    </span>
                  )}
                </div>

                <div className="font-mono text-[11px] text-[#998b7a]">
                  PIN: ••••
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#26221c] flex items-center justify-between">
              {!user.approved ? (
                <button
                  onClick={() => handleApprove(user.id)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Grant PIN Access</span>
                </button>
              ) : (
                <span className="text-[10px] text-[#998b7a]">
                  Active shift authorization
                </span>
              )}

              {user.role !== 'admin' && (
                <button
                  onClick={() => handleDelete(user.id)}
                  className="p-1.5 text-[#736657] hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#18181c]">
              <h3 className="font-semibold text-sm text-[#f4efe8]">Add New Staff Cashier</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#998b7a] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Bekele"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1714] border border-[#26221c] text-[#f4efe8] placeholder-[#736657] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#998b7a] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="samuel@rahelstationary.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1714] border border-[#26221c] text-[#f4efe8] placeholder-[#736657] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#998b7a] mb-1">
                  Role Assignment
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1714] border border-[#26221c] text-[#f4efe8] focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="cashier">Cashier (Standard Checkout)</option>
                  <option value="manager">Store Manager (Discounts & Voids)</option>
                  <option value="auditor">Auditor (View Reports & Stock)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#998b7a] mb-1">
                  4-Digit Cashier PIN *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="e.g. 5566"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold tracking-widest text-center rounded-xl bg-[#1a1714] border border-[#26221c] text-[#f5d77f] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#26221c]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-[#998b7a] hover:bg-white/5 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] hover:to-[#b88c14] text-black shadow-xs cursor-pointer"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
