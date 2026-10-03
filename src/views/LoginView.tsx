import React, { useState } from 'react';
import { storage } from '../services/storage';
import { UserSession } from '../types';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  X,
  ArrowRight,
  Loader2,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const settings = storage.getSettings();

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetPin, setResetPin] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Fast autofill for convenience / demo
  const handleQuickFill = () => {
    setIdentifier('admin');
    setPassword('Stationery@2026');
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setErrorMessage('Please enter your username or email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password or PIN.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate micro-delay for realistic security feel
      await new Promise(resolve => setTimeout(resolve, 350));

      const result = await storage.login(trimmedId, password, rememberMe);

      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setErrorMessage(result.error || 'Invalid username/email or password. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login exception:', err);
      setErrorMessage('An unexpected error occurred during authentication. Please retry.');
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetPin.trim()) {
      setResetError('Please enter your 4-digit Security PIN.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Password confirmation does not match.');
      return;
    }

    setIsResetting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const res = await storage.resetPasswordWithPin(resetPin.trim(), resetNewPassword);

      if (res.success) {
        setResetSuccess('Password updated successfully! You can now log in with your new password.');
        setPassword(resetNewPassword);
        setTimeout(() => {
          setIsForgotModalOpen(false);
          setResetPin('');
          setResetNewPassword('');
          setResetConfirmPassword('');
          setResetSuccess(null);
        }, 1500);
      } else {
        setResetError(res.error || 'Failed to reset password.');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setResetError('Failed to reset password. Please check your PIN.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f4efe8] flex flex-col justify-between selection:bg-[#d4af37]/30 selection:text-[#f5d77f] relative overflow-hidden font-sans">
      {/* Background ambient gold gradient glow */}
      <div className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-gradient-to-tl from-[#997520]/15 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Top subtle branding bar */}
      <header className="px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Logo Monogram */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5d77f] via-[#d4af37] to-[#997520] text-black flex items-center justify-center font-black shadow-lg shadow-[#d4af37]/20 border border-[#f5d77f]/40">
            <span className="text-lg tracking-tighter">RS</span>
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-[#f5d77f]">
              {settings.storeName}
            </h1>
            <p className="text-[11px] text-[#998b7a] font-medium tracking-tight">
              Stationery, Fine Papers & Commercial Printing
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141417] border border-[#26221c] text-xs text-[#998b7a]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Workstation Security Active</span>
        </div>
      </header>

      {/* Central Login Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="rounded-3xl bg-[#141417]/95 backdrop-blur-md border border-[#26221c] shadow-2xl p-7 sm:p-9 space-y-6 relative overflow-hidden">
            {/* Top golden accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-80" />

            {/* Header / Titles */}
            <div className="text-center space-y-2">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5d77f] via-[#d4af37] to-[#997520] text-black items-center justify-center shadow-xl shadow-[#d4af37]/25 mb-1 border border-[#f5d77f]/50">
                <span className="text-2xl font-black tracking-tighter">RS</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#f4efe8]">
                Welcome Back
              </h2>
              <p className="text-xs text-[#998b7a]">
                Sign in to continue to your retail POS & inventory workstation.
              </p>
            </div>

            {/* Error Alert Box */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4.5" noValidate>
              {/* Username or Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="identifier"
                  className="block text-xs font-semibold text-[#c4bbb0]"
                >
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736657]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    required
                    disabled={isLoading}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="admin or rahel@rahelstationary.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a1714] border border-[#2a241c] text-xs font-medium text-[#f4efe8] placeholder-[#665b4d] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-[#c4bbb0]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetError(null);
                      setResetSuccess(null);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-[11px] font-medium text-[#d4af37] hover:text-[#f5d77f] hover:underline transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736657]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter password or 4-digit PIN"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#1a1714] border border-[#2a241c] text-xs font-medium text-[#f4efe8] placeholder-[#665b4d] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all disabled:opacity-50 font-mono tracking-wide"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#736657] hover:text-[#f4efe8] transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#2a241c] bg-[#1a1714] text-[#d4af37] focus:ring-[#d4af37] focus:ring-offset-0 cursor-pointer accent-[#d4af37]"
                  />
                  <span className="text-xs text-[#998b7a]">
                    Remember me on this workstation
                  </span>
                </label>
              </div>

              {/* Prominent Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5d77f] to-[#aa8010] text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#d4af37]/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workstation</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demonstration Credentials Helper Card */}
            <div className="pt-2 border-t border-[#26221c]">
              <div className="p-3 rounded-2xl bg-[#1a1714] border border-[#26221c] flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#f5d77f]">
                    <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Administrator Credentials:</span>
                  </div>
                  <div className="text-[10px] text-[#998b7a] font-mono">
                    User: <strong className="text-[#f4efe8]">admin</strong> · Pass: <strong className="text-[#f4efe8]">Stationery@2026</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-2.5 py-1 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#f5d77f] border border-[#d4af37]/35 text-[10px] font-bold transition-all cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer Note */}
          <div className="mt-5 text-center space-y-1">
            <p className="text-[11px] text-[#736657] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>AES-256 encrypted workstation authentication</span>
            </p>
            <p className="text-[10px] text-[#554b3f]">
              Rahel Stationary Retail POS &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="py-4 text-center text-[10px] text-[#554b3f] z-10">
        Offline-First Retail Management System
      </footer>

      {/* Forgot Password / PIN Recovery Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-[#141417] text-[#f4efe8] border border-[#2a241c] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#18181c]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-[#d4af37]" />
                </div>
                <h3 className="font-bold text-sm text-[#f4efe8]">
                  Password Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              <p className="text-xs text-[#998b7a] leading-relaxed">
                Verify your <strong>4-digit Administrator PIN</strong> (Default: <code>1234</code>) to reset your workstation password.
              </p>

              {resetError && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#c4bbb0]">
                  4-Digit Security PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={resetPin}
                  onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234"
                  className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl bg-[#1a1714] border border-[#2a241c] text-[#f5d77f] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#c4bbb0]">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-[#1a1714] border border-[#2a241c] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#c4bbb0]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-[#1a1714] border border-[#2a241c] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] text-black font-bold text-xs hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  ) : null}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
