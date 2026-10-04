import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../types';
import { storage } from '../services/storage';
import { Settings, Save, Download, Upload, RotateCcw, Cloud, ShieldCheck, Check, Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { emailService, EmailStatus } from '../services/emailService';

interface SettingsViewProps {
  onSettingsSaved?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSettingsSaved }) => {
  const [settings, setSettings] = useState<StoreSettings>(storage.getSettings());
  const [isSaved, setIsSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Email Integration Status & Test State
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    emailService.getStatus().then(setEmailStatus);
  }, []);

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await emailService.sendTestEmail();
      if (res.success) {
        setEmailTestResult({
          success: true,
          message: 'Test email delivered successfully! Check your inbox.'
        });
      } else {
        setEmailTestResult({
          success: false,
          message: res.error || 'Failed to send test email. Check your SMTP credentials.'
        });
      }
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        message: err.message || 'Connection error while testing email.'
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    onSettingsSaved?.();
  };

  const handleBackupExport = () => {
    const json = storage.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rahel-POS-Backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importData(content);
      if (success) {
        setImportStatus('Backup restored successfully! Refreshing database...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setImportStatus('Failed to parse backup JSON. Please check file validity.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset store database to factory seed stationery catalog and initial shifts? All custom sales will be reset.')) {
      storage.resetToFactoryDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-y-auto bg-[#0a0a0c] text-[#f4efe8] space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <h2 className="text-xl font-bold text-[#f5d77f]">
            Store Profile & Configuration
          </h2>
          <p className="text-xs text-[#a89f91]">
            Retail branding, currency standards, thermal receipt templates, Firestore sync & JSON database backup.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black flex items-center gap-1.5 shadow-md shadow-[#d4af37]/20 transition-all cursor-pointer"
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Settings Saved!' : 'Save Store Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Card 1: Retail Store Branding */}
        <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-[#f5d77f] border-b border-[#26221c] pb-2">
            Store Identity & Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                Store Business Name *
              </label>
              <input
                type="text"
                required
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                Business Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                Physical Retail Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                Telephone Hotline
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Monetary Standards & Currency */}
        <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#26221c] pb-2">
            <h3 className="font-bold text-sm text-[#f5d77f]">
              Monetary Standards & Currency
            </h3>
          </div>

          <div className="max-w-md space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#c4bbb0]">
                  Currency Symbol
                </label>
                <div className="flex items-center gap-1">
                  {['ETB', '$', '€', '£'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setSettings({ ...settings, currencySymbol: sym, taxRatePercent: 0, taxNumber: '' })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        settings.currencySymbol === sym
                          ? 'bg-[#d4af37] text-black'
                          : 'bg-[#141417] text-[#998b7a] hover:text-[#f4efe8] border border-[#2a261f]'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                placeholder="ETB"
                value={settings.currencySymbol}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value, taxRatePercent: 0, taxNumber: '' })}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f5d77f] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>
            <p className="text-[11px] text-[#8c8273]">
              Default currency across registers, credit tabs, and reports.
            </p>
          </div>
        </div>

        {/* Card 3: Store Policy & Transaction Audit Notes */}
        <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#f5d77f] border-b border-[#26221c] pb-2">
              Store Policy & Transaction Audit Record
            </h3>
            <p className="text-[11px] text-[#a39c90] mt-1.5 leading-relaxed">
              Sales transactions are permanently committed directly to the database and live reporting engine. Customer paper receipts are disabled.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                Store Terms & Policies
              </label>
              <textarea
                rows={3}
                value={settings.receiptHeader}
                onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
                placeholder="Stationery & Printing Retail Policies"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                Return & Exchange Terms (Internal Audit)
              </label>
              <textarea
                rows={3}
                value={settings.receiptFooter}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                placeholder="Returns accepted within 7 days with transaction reference ID."
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Cloud Firestore Integration with Long Polling */}
        <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#26221c] pb-2">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#d4af37]" />
              <h3 className="font-bold text-sm text-[#f5d77f]">
                Google Firebase Cloud Firestore Synchronization
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableFirestoreSync}
                onChange={(e) => setSettings({ ...settings, enableFirestoreSync: e.target.checked })}
                className="rounded border-[#2a261f] text-[#d4af37] focus:ring-[#d4af37]"
              />
              <span className="font-semibold text-[#f4efe8]">Enable Cloud Sync</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-[#c4bbb0] mb-1">
                Firestore Project ID
              </label>
              <input
                type="text"
                value={settings.firestoreConfig?.projectId || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    firestoreConfig: {
                      ...settings.firestoreConfig,
                      projectId: e.target.value
                    }
                  })
                }
                className="w-full px-3 py-2 font-mono text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#c4bbb0] mb-1">
                Database ID
              </label>
              <input
                type="text"
                value={settings.firestoreConfig?.databaseId || '(default)'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    firestoreConfig: {
                      ...settings.firestoreConfig,
                      databaseId: e.target.value
                    }
                  })
                }
                className="w-full px-3 py-2 font-mono text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 text-[11px] text-[#f5d77f]">
            <strong>Active Network Driver:</strong> `experimentalForceLongPolling: true` is configured for stable connectivity through firewalls, store proxy servers, and iframe containers.
          </div>
        </div>

        {/* Card 5: Google Gmail SMTP Email Integration */}
        <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#26221c] pb-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#f5d77f]" />
              <h3 className="font-bold text-sm text-[#f5d77f]">
                Google Gmail SMTP Email Service
              </h3>
            </div>
            {emailStatus?.configured ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1a1714] text-[#8c8273] border border-[#2a261f]">
                Not Configured
              </span>
            )}
          </div>

          <p className="text-xs text-[#a89f91] leading-relaxed">
            Allows the POS workstation to email sales receipts, customer debt statements, and daily audit reports through your Google Workspace / Gmail account.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#18181d] border border-[#2a261f] space-y-1">
              <span className="text-[10px] text-[#8c8273] uppercase tracking-wider font-semibold">SMTP Host & Port</span>
              <div className="font-mono font-medium text-[#f4efe8]">
                {emailStatus?.host || 'smtp.gmail.com'} : {emailStatus?.port || '587'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#18181d] border border-[#2a261f] space-y-1">
              <span className="text-[10px] text-[#8c8273] uppercase tracking-wider font-semibold">Authenticated Sender</span>
              <div className="font-mono font-medium text-[#f4efe8]">
                {emailStatus?.user || 'Not set (requires EMAIL_USER)'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-[#736657]">
              Credentials are kept server-side in environment variables and are never transmitted to the browser.
            </p>
            <button
              type="button"
              disabled={isTestingEmail || !emailStatus?.configured}
              onClick={handleTestEmail}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#1f1f26] hover:bg-[#282834] text-[#f5d77f] border border-[#2a261f] hover:border-[#d4af37]/50 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isTestingEmail ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d4af37]" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Send Test Verification Email</span>
                </>
              )}
            </button>
          </div>

          {emailTestResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
                emailTestResult.success
                  ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-200'
                  : 'bg-rose-950/40 border border-rose-800/50 text-rose-200'
              }`}
            >
              {emailTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{emailTestResult.message}</span>
            </div>
          )}
        </div>

        {/* Card 6: Database Backup & Restore */}
        <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-[#f5d77f] border-b border-[#26221c] pb-2">
            Database Backup, Restore & Reset
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleBackupExport}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#1a1a20] hover:bg-[#22222a] text-[#f5d77f] border border-[#26221c] hover:border-[#d4af37]/40 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Download JSON Backup</span>
            </button>

            <label className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#1a1a20] hover:bg-[#22222a] text-[#f5d77f] border border-[#26221c] hover:border-[#d4af37]/40 flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Restore from JSON File</span>
              <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/40 flex items-center gap-1.5 transition-colors ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Factory Demo Data</span>
            </button>
          </div>

          {importStatus && (
            <div className="p-2.5 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5d77f] text-xs">
              {importStatus}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
