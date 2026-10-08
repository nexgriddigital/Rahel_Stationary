import { useEffect, useState, useCallback } from 'react';
import { storage } from './storage';
import { LocalBackupSnapshot, BackupInspectionResult } from '../types';

interface UseAutoBackupOptions {
  checkIntervalMs?: number; // default: 5 minutes check
}

export function useAutoBackup(options: UseAutoBackupOptions = {}) {
  const { checkIntervalMs = 300000 } = options; // Check every 5 minutes
  const [snapshots, setSnapshots] = useState<LocalBackupSnapshot[]>(() => storage.getLocalSnapshots());
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);
  const [emergencyRecoverySnapshot, setEmergencyRecoverySnapshot] = useState<LocalBackupSnapshot | null>(null);

  // Refresh snapshots list from storage
  const refreshSnapshots = useCallback(() => {
    const list = storage.getLocalSnapshots();
    setSnapshots(list);

    // Check if store is empty while snapshots exist (cache loss recovery scenario)
    const prods = storage.getProducts();
    const sales = storage.getSales();
    if (prods.length === 0 && sales.length === 0 && list.length > 0) {
      setEmergencyRecoverySnapshot(list[0]);
    } else {
      setEmergencyRecoverySnapshot(null);
    }
  }, []);

  // Periodic automated check
  useEffect(() => {
    refreshSnapshots();

    const runAutomatedCheck = async () => {
      try {
        const settings = storage.getSettings();
        if (settings.autoBackupEnabled === false) return;

        const intervalHours = settings.autoBackupIntervalHours || 24;
        const intervalMs = intervalHours * 60 * 60 * 1000;
        const lastBackupTime = settings.lastAutoBackupAt ? new Date(settings.lastAutoBackupAt).getTime() : 0;
        const now = Date.now();

        // Only create auto backup if there is actual data and the interval has elapsed
        const prods = storage.getProducts();
        if (prods.length > 0 && now - lastBackupTime >= intervalMs) {
          await storage.createLocalSnapshot('auto_scheduled');
          refreshSnapshots();
        }
      } catch (err) {
        console.warn('Auto backup background task encountered an issue:', err);
      }
    };

    // Run on startup
    runAutomatedCheck();

    const intervalTimer = setInterval(runAutomatedCheck, checkIntervalMs);
    const unsubscribe = storage.subscribe((key) => {
      if (!key || key.includes('backup') || key.includes('product') || key.includes('sale')) {
        refreshSnapshots();
      }
    });

    return () => {
      clearInterval(intervalTimer);
      unsubscribe();
    };
  }, [checkIntervalMs, refreshSnapshots]);

  // Trigger manual snapshot creation
  const takeManualSnapshot = async (): Promise<LocalBackupSnapshot> => {
    setIsTakingSnapshot(true);
    try {
      const snap = await storage.createLocalSnapshot('manual_snapshot');
      refreshSnapshots();
      return snap;
    } finally {
      setIsTakingSnapshot(false);
    }
  };

  // Download snapshot as a file
  const downloadSnapshot = (snapshot: LocalBackupSnapshot) => {
    const json = JSON.stringify(snapshot.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateFormatted = snapshot.timestamp.split('T')[0];
    const timeFormatted = snapshot.timestamp.split('T')[1].slice(0, 5).replace(':', '');
    link.download = `Rahel-POS-Backup-${dateFormatted}-${timeFormatted}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export current active database directly to file
  const exportCurrentBackupFile = async () => {
    const envelope = await storage.exportAllDataSecure();
    const json = JSON.stringify(envelope, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const now = new Date();
    const dateFormatted = now.toISOString().split('T')[0];
    const timeFormatted = now.toTimeString().slice(0, 5).replace(':', '');
    link.download = `Rahel-POS-Secure-Backup-${dateFormatted}-${timeFormatted}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return envelope;
  };

  // Restore snapshot
  const restoreSnapshot = (snapshotId: string): boolean => {
    const success = storage.restoreLocalSnapshot(snapshotId);
    if (success) {
      refreshSnapshots();
    }
    return success;
  };

  // Delete snapshot
  const deleteSnapshot = (snapshotId: string) => {
    storage.deleteLocalSnapshot(snapshotId);
    refreshSnapshots();
  };

  return {
    snapshots,
    isTakingSnapshot,
    emergencyRecoverySnapshot,
    takeManualSnapshot,
    downloadSnapshot,
    exportCurrentBackupFile,
    restoreSnapshot,
    deleteSnapshot,
    refreshSnapshots
  };
}
