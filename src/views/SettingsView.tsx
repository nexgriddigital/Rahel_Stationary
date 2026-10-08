import React, { useState } from 'react';
import { StoreSettings, BackupInspectionResult, LocalBackupSnapshot } from '../types';
import { storage } from '../services/storage';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  Cloud,
  ShieldCheck,
  Check,
  Undo2,
  Trash2,
  Sparkles,
  CheckCircle2,
  Clock,
  HardDrive,
  History,
  AlertTriangle
} from 'lucide-react';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { BackupRestoreModal } from '../components/BackupRestoreModal';
import { useAutoBackup } from '../services/useAutoBackup';

interface SettingsViewProps {
  onSettingsSaved?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSettingsSaved }) => {
  const [settings, setSettings] = useState<StoreSettings>(storage.getSettings());
  const [isSaved, setIsSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showFactoryResetModal, setShowFactoryResetModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Backup & Restore Inspection Modal States
  const [inspection, setInspection] = useState<BackupInspectionResult | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState<string>('');

  // Auto-backup hook
  const {
    snapshots,
    isTakingSnapshot,
    takeManualSnapshot,
    downloadSnapshot,
    deleteSnapshot,
    restoreSnapshot
  } = useAutoBackup({ checkIntervalMs: 60000 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    onSettingsSaved?.();
  };

  const handleResetFormValues = () => {
    // Restore form to stored settings from storage
    const currentStored = storage.getSettings();
    setSettings(currentStored);
    setImportStatus('Form values reset to current saved store configuration.');
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleBackupExport = async () => {
    setIsExporting(true);
    try {
      const envelope = await storage.exportAllDataSecure();
      const json = JSON.stringify(envelope, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
      link.download = `Rahel-POS-Secure-Backup-${dateStr}-${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setImportStatus(`Secure JSON backup downloaded successfully (${(json.length / 1024).toFixed(1)} KB, SHA-256 verified).`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportStatus(`Failed to export backup: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const inspectionResult = await storage.inspectBackupFile(content);
      if (inspectionResult.isValid) {
        setInspection(inspectionResult);
        setIsRestoreModalOpen(true);
      } else {
        setImportStatus(`Failed to read backup: ${inspectionResult.error || 'Corrupt or invalid JSON file'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestoreSuccess = (counts: any) => {
    setSettings(storage.getSettings());
    onSettingsSaved?.();
    setImportStatus(
      `Database successfully restored! Recovered ${counts.products} products, ${counts.sales} sales, ${counts.creditAccounts} customer accounts.`
    );
    setTimeout(() => setImportStatus(null), 6000);
  };

  const handleTakeSnapshot = async () => {
    try {
      const snap = await takeManualSnapshot();
      setImportStatus(`Local recovery snapshot created (${snap.fileSizeEstimate}, ${snap.summary.totalProducts} products, ${snap.summary.totalSales} sales).`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportStatus(`Failed to create snapshot: ${err.message}`);
    }
  };

  const handleRestoreSnapshot = async (snap: LocalBackupSnapshot) => {
    // Inspect and open modal for safe verification
    const inspectionResult = await storage.inspectBackupFile(JSON.stringify(snap.data));
    setInspection(inspectionResult);
    setImportFileName(`Snapshot (${new Date(snap.timestamp).toLocaleTimeString()})`);
    setIsRestoreModalOpen(true);
  };

  const handleExecuteFactoryReset = () => {
    setIsResetting(true);
    try {
      storage.removeAllData();
      setSettings(storage.getSettings());
      onSettingsSaved?.();
      setImportStatus('All store data has been successfully removed. Your database is now completely clean and empty (0 items).');
      setIsResetting(false);
      setShowFactoryResetModal(false);
      setTimeout(() => {
        setImportStatus(null);
      }, 5000);
    } catch (err) {
      console.error('Factory reset failed:', err);
      setImportStatus('Failed to reset database.');
      setIsResetting(false);
      setShowFactoryResetModal(false);
    }
  };

  const handleExecuteLoadDemo = () => {
    setIsLoadingDemo(true);
    try {
      storage.loadDemoSampleData();
      setSettings(storage.getSettings());
      onSettingsSaved?.();
      setImportStatus('Sample demo catalog and transactions loaded successfully.');
      setIsLoadingDemo(false);
      setShowDemoModal(false);
      setTimeout(() => {
        setImportStatus(null);
      }, 5000);
    } catch (err) {
      console.error('Load demo failed:', err);
      setImportStatus('Failed to load demo data.');
      setIsLoadingDemo(false);
      setShowDemoModal(false);
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetFormValues}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#1f1f26] text-[#c4bbb0] hover:text-[#f4efe8] border border-[#2a261f] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset form fields to last saved configuration"
          >
            <Undo2 className="w-3.5 h-3.5 text-[#8e8271]" />
            <span>Reset Form</span>
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black flex items-center gap-1.5 shadow-md shadow-[#d4af37]/20 transition-all cursor-pointer"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Settings Saved!' : 'Save Store Settings'}</span>
          </button>
        </div>
      </div>

      {/* Top Status Notification Banner */}
      {importStatus && (
        <div className="p-3.5 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f5d77f] text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span className="font-medium">{importStatus}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportStatus(null)}
            className="p-1 rounded-lg text-[#8e8271] hover:text-[#f4efe8] cursor-pointer"
          >
            <span className="text-xs font-bold">✕</span>
          </button>
        </div>
      )}

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

        {/* Card 5: Automated & Secure JSON Backup, Restore & Cache Fallback */}
        <div className="p-5 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xs space-y-5">
          <div className="border-b border-[#26221c] pb-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#f5d77f]">
                  Automated JSON Backup & Cache Fallback
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[10px] font-semibold">
                  SHA-256 Verified
                </span>
              </div>
              <p className="text-xs text-[#a89f91] mt-0.5">
                Protect your inventory, sales records, and credit accounts against browser cache clearing with automated snapshots and secure JSON exports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTakeSnapshot}
                disabled={isTakingSnapshot}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#1e1e24] hover:bg-[#282832] text-[#f5d77f] border border-[#d4af37]/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Create an immediate internal snapshot point"
              >
                <Clock className={`w-3.5 h-3.5 ${isTakingSnapshot ? 'animate-spin' : 'text-[#d4af37]'}`} />
                <span>{isTakingSnapshot ? 'Saving...' : 'Create Snapshot'}</span>
              </button>

              <button
                type="button"
                onClick={handleBackupExport}
                disabled={isExporting}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-black hover:brightness-110 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                title="Export complete database as a secure, checksum-verified JSON file"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>{isExporting ? 'Exporting...' : 'Export Backup File'}</span>
              </button>

              <label className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#1e1e24] hover:bg-[#282832] text-[#f4efe8] border border-[#2a261f] flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Restore from File</span>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>
            </div>
          </div>

          {/* Automated Backup Settings Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 rounded-xl bg-[#101013] border border-[#22201b]">
            <div className="flex items-center justify-between gap-2 p-1">
              <div>
                <div className="text-xs font-semibold text-[#f4efe8]">Automated Backup</div>
                <div className="text-[11px] text-[#8e8271]">Periodic internal snapshots</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoBackupEnabled !== false}
                onChange={(e) => {
                  const updated = { ...settings, autoBackupEnabled: e.target.checked };
                  setSettings(updated);
                  storage.saveSettings(updated);
                }}
                className="w-4 h-4 rounded accent-[#d4af37] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between gap-2 p-1">
              <div>
                <div className="text-xs font-semibold text-[#f4efe8]">Backup on Shift Close</div>
                <div className="text-[11px] text-[#8e8271]">Snapshot on cashier checkout</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoBackupOnShiftClose !== false}
                onChange={(e) => {
                  const updated = { ...settings, autoBackupOnShiftClose: e.target.checked };
                  setSettings(updated);
                  storage.saveSettings(updated);
                }}
                className="w-4 h-4 rounded accent-[#d4af37] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between gap-2 p-1">
              <div>
                <div className="text-xs font-semibold text-[#f4efe8]">Auto Interval</div>
                <div className="text-[11px] text-[#8e8271]">
                  Last: {settings.lastAutoBackupAt ? new Date(settings.lastAutoBackupAt).toLocaleDateString() : 'None yet'}
                </div>
              </div>
              <select
                value={settings.autoBackupIntervalHours || 24}
                onChange={(e) => {
                  const updated = { ...settings, autoBackupIntervalHours: Number(e.target.value) };
                  setSettings(updated);
                  storage.saveSettings(updated);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-[#18181e] border border-[#2a261f] text-[#f5d77f] focus:outline-none"
              >
                <option value={6}>Every 6 Hours</option>
                <option value={12}>Every 12 Hours</option>
                <option value={24}>Every 24 Hours</option>
              </select>
            </div>
          </div>

          {/* Rolling Local Snapshots List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-[#c4bbb0] uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Automated Local Snapshot Points ({snapshots.length}/5)</span>
              </div>
              <span className="text-[11px] text-[#8e8271]">
                Stored internally for fast browser cache recovery
              </span>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#101014] border border-[#22201c] text-center text-[#7d7465] text-xs">
                No local snapshots created yet. Click "Create Snapshot" or wait for scheduled shift closures.
              </div>
            ) : (
              <div className="divide-y divide-[#22201b] rounded-xl border border-[#26221c] bg-[#101014] overflow-hidden">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#15151a] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#1a1a20] border border-[#2a261f] text-[#d4af37] flex items-center justify-center shrink-0">
                        <History className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#f4efe8] flex items-center gap-2">
                          <span>{new Date(snap.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            snap.trigger === 'auto_shift_close'
                              ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
                              : snap.trigger === 'auto_scheduled'
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                              : 'bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/40'
                          }`}>
                            {snap.trigger === 'auto_shift_close' ? 'Shift Close' : snap.trigger === 'auto_scheduled' ? 'Scheduled Auto' : 'Manual'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8e8271] mt-0.5">
                          {snap.summary.totalProducts} items • {snap.summary.totalSales} sales • {snap.summary.totalCreditAccounts} credit accounts • {snap.fileSizeEstimate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => downloadSnapshot(snap)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[#1a1a20] hover:bg-[#24242c] text-[#f5d77f] border border-[#2a261f] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Download verified JSON file"
                      >
                        <Download className="w-3 h-3 text-[#d4af37]" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Restore database to this snapshot"
                      >
                        <RotateCcw className="w-3 h-3 text-emerald-400" />
                        <span>Restore</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSnapshot(snap.id)}
                        className="p-1 rounded-lg text-[#7d7465] hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Demo Data and Danger Reset actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#26221c]">
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#1a1a20] hover:bg-[#22222a] text-[#c4bbb0] hover:text-[#f4efe8] border border-[#26221c] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Populate 14 sample stationery items and test transactions for testing"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Load Sample Demo Data</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFactoryResetModal(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-950/70 text-rose-200 border border-rose-700/60 hover:bg-rose-900/80 hover:text-white flex items-center gap-1.5 transition-colors ml-auto cursor-pointer shadow-sm shadow-rose-950/40"
              title="Permanently remove all products, sales, accounts, expenses and shift history"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset & Remove All Data</span>
            </button>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5d77f] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </form>

      {/* Interactive Inspection & Restore Modal */}
      <BackupRestoreModal
        isOpen={isRestoreModalOpen}
        inspection={inspection}
        fileName={importFileName}
        onClose={() => setIsRestoreModalOpen(false)}
        onRestoreSuccess={handleRestoreSuccess}
      />

      {/* Confirmation Dialog for Reset / Remove All Data */}
      <ConfirmationDialog
        isOpen={showFactoryResetModal}
        title="Reset Database & Remove All Data?"
        message={`Are you sure you want to remove ALL store data?

This will permanently delete:
• All products & inventory stock (will become 0 items)
• All commercial services
• All sales ledger records & receipts
• All customer credit accounts & balances
• All recorded expenses
• All register shift logs & cash drawer history

Your database will be reset to a completely clean, empty state ready for fresh real-world operations. This action cannot be undone.`}
        confirmLabel={isResetting ? 'Removing All Data...' : 'Yes, Remove All Data'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleExecuteFactoryReset}
        onCancel={() => setShowFactoryResetModal(false)}
      />

      {/* Confirmation Dialog for Load Demo Data */}
      <ConfirmationDialog
        isOpen={showDemoModal}
        title="Load Sample Demo Catalog & Data?"
        message={`This will populate the database with the 14 standard sample stationery products, 6 default commercial services, demo sales, and example corporate credit accounts.

Existing records will be replaced with sample demo records. Continue?`}
        confirmLabel={isLoadingDemo ? 'Loading Demo Data...' : 'Yes, Load Demo Data'}
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleExecuteLoadDemo}
        onCancel={() => setShowDemoModal(false)}
      />
    </div>
  );
};
