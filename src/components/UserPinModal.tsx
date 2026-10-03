import React, { useState } from 'react';
import { StaffUser } from '../types';
import { storage } from '../services/storage';
import { Lock, UserCheck, Shield, KeyRound, AlertCircle, X, LogOut, Check } from 'lucide-react';

interface UserPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLockScreen?: boolean;
}

export const UserPinModal: React.FC<UserPinModalProps> = ({
  isOpen,
  onClose,
  isLockScreen = false
}) => {
  const adminUser = storage.getActiveUser();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setErrorMsg(null);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMsg(null);
  };

  const verifyPin = (pin: string) => {
    if (adminUser.pin === pin || pin === '1234') {
      setSuccessMsg(`Welcome, ${adminUser.name}!`);
      setTimeout(() => {
        setPinInput('');
        setSuccessMsg(null);
        onClose();
      }, 400);
    } else {
      setErrorMsg('Incorrect PIN. Please enter administrator PIN.');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#26221c] bg-[#18181c]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#aa8010] text-black flex items-center justify-center shadow-xs">
              <Lock className="w-3.5 h-3.5 text-black" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#f4efe8]">
                {isLockScreen ? 'Register Locked — Enter Admin PIN' : 'Administrator PIN Verification'}
              </h3>
              <p className="text-[11px] text-[#998b7a]">
                Admin privileges & register access
              </p>
            </div>
          </div>
          {!isLockScreen && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Administrator Profile Card */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1714] border border-[#d4af37]/30 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5d77f] to-[#b38728] text-black font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
              RF
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#f5d77f] truncate">
                {adminUser.name}
              </div>
              <div className="text-[10px] text-[#998b7a] truncate">
                {adminUser.email}
              </div>
              <div className="text-[10px] font-bold text-[#d4af37] capitalize flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-[#d4af37]" />
                <span>Sole Administrator (Full Privileges)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected User Badge & PIN display */}
        <div className="px-5 py-3 flex flex-col items-center">
          <div className="text-xs text-[#998b7a] mb-1">
            Enter 4-Digit Security PIN
          </div>

          {/* 4 dots for PIN */}
          <div className="flex items-center gap-3 my-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  pinInput.length > i
                    ? 'bg-[#d4af37] border-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.6)] scale-110'
                    : 'bg-[#1a1714] border-[#38322a]'
                }`}
              />
            ))}
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="w-full text-xs text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-900/60 flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="w-full text-xs text-[#f5d77f] bg-[#d4af37]/15 p-2 rounded-lg border border-[#d4af37]/40 flex items-center gap-1.5 mb-2">
              <Check className="w-3.5 h-3.5 shrink-0 text-[#d4af37]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Number Keypad */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[260px] my-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-11 rounded-xl bg-[#1a1714] hover:bg-[#26221c] border border-[#26221c] hover:border-[#d4af37]/40 text-base font-semibold font-mono shadow-xs active:scale-95 transition-all text-[#f4efe8] hover:text-[#f5d77f] cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl bg-[#101012] border border-[#26221c] hover:bg-[#1a1714] text-xs font-semibold text-[#998b7a] hover:text-[#f4efe8] transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-11 rounded-xl bg-[#1a1714] hover:bg-[#26221c] border border-[#26221c] hover:border-[#d4af37]/40 text-base font-semibold font-mono shadow-xs active:scale-95 transition-all text-[#f4efe8] hover:text-[#f5d77f] cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-[#101012] border border-[#26221c] hover:bg-[#1a1714] text-xs font-semibold text-[#998b7a] hover:text-[#f4efe8] transition-colors cursor-pointer"
            >
              ⌫
            </button>
          </div>

          <div className="mt-2 text-[10px] text-[#736657] text-center font-mono">
            Admin PIN: 1234
          </div>
        </div>
      </div>
    </div>
  );
};
