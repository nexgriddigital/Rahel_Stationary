import React, { useState } from 'react';
import { storage } from '../services/storage';
import { authService, ServerSession } from '../services/auth';
import { BrandLogo } from '../components/BrandLogo';
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
  Sparkles,
  HelpCircle,
  Check,
  Clock
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (session: ServerSession) => void;
  expiredReason?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, expiredReason }) => {
  const settings = storage.getSettings();

  // Form states - initialized clean to avoid browser auto-prompting
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password Recovery / Reset Modal states
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('Rahel@RFStationary.com');
  const [resetPin, setResetPin] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Helper action: Populate default account email securely (without exposing password)
  const handleUseDefaultAccount = () => {
    setIdentifier('Rahel@RFStationary.com');
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setErrorMessage('Please enter your administrator email (Rahel@RFStationary.com) or username.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.login(trimmedId, password);

      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setErrorMessage(result.error || 'Invalid email or password. Please verify your credentials.');
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

    const trimmedIdentifier = resetIdentifier.trim();
    if (!trimmedIdentifier) {
      setResetError('Please enter your registered email address (e.g. Rahel@RFStationary.com).');
      return;
    }

    if (!resetPin.trim()) {
      setResetError('Please enter your 4-digit Administrator Security PIN.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters in length.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Password confirmation does not match the new password.');
      return;
    }

    setIsResetting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      const res = await authService.resetPasswordWithVerification(
        trimmedIdentifier,
        resetPin.trim(),
        resetNewPassword
      );

      if (res.success) {
        setResetSuccess('Identity verified! Workstation password updated successfully. You can now sign in.');
        setIdentifier(trimmedIdentifier);
        setPassword('');
        setTimeout(() => {
          setIsForgotModalOpen(false);
          setResetPin('');
          setResetNewPassword('');
          setResetConfirmPassword('');
          setResetSuccess(null);
        }, 1600);
      } else {
        setResetError(res.error || 'Identity verification failed. Please check your credentials and PIN.');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setResetError('Failed to reset password. Please verify your identity.');
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
          {/* Logo Monogram from Favicon SVG */}
          <BrandLogo size={42} showGlow />
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
              <div className="relative inline-flex items-center justify-center mb-1">
                {isLoading ? (
                  <div className="relative flex items-center justify-center">
                    <div className="absolute -inset-2 rounded-2xl bg-[#d4af37]/25 blur-md animate-pulse" />
                    <BrandLogo size={60} className="animate-bounce" />
                  </div>
                ) : (
                  <BrandLogo size={60} showGlow />
                )}
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#f4efe8]">
                Workstation Login
              </h2>
              <p className="text-xs text-[#998b7a]">
                Sign in to access your retail POS, catalog & store inventory.
              </p>
            </div>

            {/* Session Expired / Inactivity Notice */}
            {expiredReason && !errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-600/80 text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-semibold text-amber-300">Session Expired:</span>{' '}
                  {expiredReason}
                </div>
              </div>
            )}

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

            {/* Login Form with anti-autofill configuration */}
            <form
              onSubmit={handleLogin}
              autoComplete="off"
              noValidate
              className="space-y-4.5"
            >
              {/* Username or Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="rf_login_identifier"
                  className="block text-xs font-semibold text-[#c4bbb0]"
                >
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736657]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="rf_login_identifier"
                    name="rf_login_identifier"
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={isLoading}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Rahel@RFStationary.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a1714] border border-[#2a241c] text-xs font-medium text-[#f4efe8] placeholder-[#665b4d] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Input & Prominent Forgot Password Trigger */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="rf_login_password"
                    className="block text-xs font-semibold text-[#c4bbb0]"
                  >
                    Password
                  </label>
                  {/* Clear & Easy-to-find Forgot Password Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setResetIdentifier(identifier || 'Rahel@RFStationary.com');
                      setResetError(null);
                      setResetSuccess(null);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-xs font-semibold text-[#d4af37] hover:text-[#f5d77f] hover:underline flex items-center gap-1 transition-colors cursor-pointer py-0.5 px-1 rounded"
                    title="Reset your password using your administrator security PIN"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Forgot Password?</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736657]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="rf_login_password"
                    name="rf_login_password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter account password"
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

              {/* Strict Inactivity Security Notice */}
              <div className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-[#141210] border border-[#2a241c] text-[#998b7a] text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span>Strict 60-minute inactivity security timeout enforced</span>
              </div>

              {/* Prominent Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5d77f] to-[#aa8010] text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#d4af37]/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <BrandLogo size={18} className="animate-spin" />
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

            {/* Default Account Details Helper Card (Secure, does not expose raw passwords) */}
            <div className="pt-2 border-t border-[#26221c]">
              <div className="p-3 rounded-2xl bg-[#1a1714] border border-[#26221c] flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#f5d77f]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Default Administrator Account:</span>
                  </div>
                  <div className="text-[10px] text-[#998b7a]">
                    Email: <strong className="text-[#f4efe8] font-mono">Rahel@RFStationary.com</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUseDefaultAccount}
                  className="px-2.5 py-1 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#f5d77f] border border-[#d4af37]/35 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Mail className="w-3 h-3 text-[#d4af37]" />
                  <span>Use Email</span>
                </button>
              </div>
            </div>

            {/* Bottom Password Reset Link for Visibility */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setResetIdentifier(identifier || 'Rahel@RFStationary.com');
                  setResetError(null);
                  setResetSuccess(null);
                  setIsForgotModalOpen(true);
                }}
                className="text-[11px] text-[#998b7a] hover:text-[#f5d77f] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <KeyRound className="w-3 h-3 text-[#d4af37]" />
                <span>Forgot your password? <strong>Reset password with Security PIN &rarr;</strong></span>
              </button>
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

      {/* Secure Password Recovery / Reset Modal with Identity Verification */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#141417] text-[#f4efe8] border border-[#2a241c] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#18181c]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-[#d4af37]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#f4efe8]">
                    Secure Password Recovery
                  </h3>
                  <p className="text-[10px] text-[#998b7a]">
                    Verify identity to reset administrator workstation password
                  </p>
                </div>
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
            <form onSubmit={handleResetPassword} autoComplete="off" className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-[#1a1714] border border-[#26221c] text-xs text-[#998b7a] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>
                  To protect store data, identity verification requires your registered email and <strong>4-digit Administrator PIN</strong> (Default: <code className="text-[#f5d77f] font-mono">1234</code>).
                </span>
              </div>

              {resetError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-snug">{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div
                  role="status"
                  className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in duration-150"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-snug font-medium">{resetSuccess}</span>
                </div>
              )}

              {/* Step 1: Identity Verification Fields */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#c4bbb0]">
                    1. Registered Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={resetIdentifier}
                    onChange={(e) => {
                      setResetIdentifier(e.target.value);
                      if (resetError) setResetError(null);
                    }}
                    placeholder="Rahel@RFStationary.com"
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-[#1a1714] border border-[#2a241c] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#c4bbb0]">
                    2. 4-Digit Administrator Security PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    autoComplete="off"
                    value={resetPin}
                    onChange={(e) => {
                      setResetPin(e.target.value.replace(/\D/g, ''));
                      if (resetError) setResetError(null);
                    }}
                    placeholder="Enter 4-digit PIN (e.g. 1234)"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold tracking-widest rounded-xl bg-[#1a1714] border border-[#2a241c] text-[#f5d77f] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  />
                </div>
              </div>

              {/* Step 2: New Password Fields */}
              <div className="space-y-3 pt-2 border-t border-[#26221c]">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#c4bbb0]">
                    3. New Password (minimum 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={resetNewPassword}
                    onChange={(e) => {
                      setResetNewPassword(e.target.value);
                      if (resetError) setResetError(null);
                    }}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-[#1a1714] border border-[#2a241c] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#c4bbb0]">
                    4. Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={resetConfirmPassword}
                    onChange={(e) => {
                      setResetConfirmPassword(e.target.value);
                      if (resetError) setResetError(null);
                    }}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-[#1a1714] border border-[#2a241c] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                  ) : (
                    <Check className="w-3.5 h-3.5 text-black font-bold" />
                  )}
                  <span>Verify Identity & Reset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
