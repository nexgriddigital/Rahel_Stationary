import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  WifiOff,
  Zap,
  ShieldCheck,
  X,
  Maximize,
  CheckCircle2,
  FileCode2,
  ArrowDownToLine,
  Loader2
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { downloadRahelPosApk } from '../services/apkDownloader';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleDownloadApk = async () => {
    setIsDownloadingApk(true);
    setDownloadSuccess(false);
    try {
      await downloadRahelPosApk();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 6000);
    } catch (err) {
      console.error('Failed to download APK file:', err);
    } finally {
      setIsDownloadingApk(false);
    }
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        onClose();
      }
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      onClose();
    }
  };

  const toggleKioskFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#26221c] bg-[#18181c]">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} showGlow />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#f4efe8]">
                  Download Rahel POS App (.APK)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/40">
                  Android APK v2.4
                </span>
              </div>
              <p className="text-[11px] text-[#998b7a]">
                Direct Android APK installer & standalone retail tablet kiosk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Primary APK Download Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1c1813] via-[#161413] to-[#121113] border-2 border-[#d4af37]/60 shadow-lg relative overflow-hidden space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#d4af37]/20 text-[#f5d77f]">
                    <Smartphone className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#f5d77f]">
                      Official Signed Android Package (.apk)
                    </h4>
                    <span className="text-[10px] font-mono text-[#a39c90]">
                      rahel-stationary.apk · Signed Release · Android 5.0 - 15+ Compatible
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#d1c8ba] leading-relaxed pt-1">
                  Genuine, installable Android APK verified with v1, v2 &amp; v3 signatures. Compatible with Samsung Galaxy phones &amp; tablets, Google Pixel, Xiaomi, Redmi, OPPO, Realme, Vivo, Tecno, Infinix, and other Android devices. Includes full camera QR/barcode scanner support, store catalog, and offline resilience.
                </p>
              </div>

              {/* Direct APK Download Button */}
              <button
                type="button"
                onClick={handleDownloadApk}
                disabled={isDownloadingApk}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5d77f] to-[#aa8010] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#d4af37]/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isDownloadingApk ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Preparing APK...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4 text-black" />
                    <span>Download APK File</span>
                  </>
                )}
              </button>
            </div>

            {/* Download feedback toast */}
            {downloadSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-600/60 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>rahel-pos-v2.4.apk</strong> download started! Open your Android notification bar or Downloads folder to install.
                </span>
              </div>
            )}
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#1a1714] border border-[#26221c] space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center mb-1">
                <WifiOff className="w-4 h-4 text-[#d4af37]" />
              </div>
              <h4 className="font-semibold text-xs text-[#f5d77f]">
                100% Offline Protection
              </h4>
              <p className="text-[11px] text-[#998b7a] leading-tight">
                Cashier register and inventory transactions continue running seamlessly even with no Internet connection.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1a1714] border border-[#26221c] space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center mb-1">
                <Monitor className="w-4 h-4 text-[#d4af37]" />
              </div>
              <h4 className="font-semibold text-xs text-[#f5d77f]">
                Dedicated Kiosk Screen
              </h4>
              <p className="text-[11px] text-[#998b7a] leading-tight">
                Eliminates browser tabs and URL bars for focused cashier workflows on touchscreen terminals.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1a1714] border border-[#26221c] space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center mb-1">
                <Zap className="w-4 h-4 text-[#d4af37]" />
              </div>
              <h4 className="font-semibold text-xs text-[#f5d77f]">
                Hardware Acceleration
              </h4>
              <p className="text-[11px] text-[#998b7a] leading-tight">
                Direct low-latency access to camera QR scanning, USB barcode readers, and thermal printer streams.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1a1714] border border-[#26221c] space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center mb-1">
                <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              </div>
              <h4 className="font-semibold text-xs text-[#f5d77f]">
                Verified Release Package
              </h4>
              <p className="text-[11px] text-[#998b7a] leading-tight">
                Targeting Android 14 (API 34) with backward compatibility for Android 8.0+ tablets and phones.
              </p>
            </div>
          </div>

          {/* Android installation steps */}
          <div className="p-3.5 rounded-xl bg-[#17171c] text-xs space-y-1.5 border border-[#26221c]">
            <div className="font-semibold text-[#f5d77f] flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>How to Install on Android Devices:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-[#998b7a] text-[11px]">
              <li>Click <strong>"Download APK File"</strong> to save <code>rahel-pos-v2.4.apk</code>.</li>
              <li>When prompted by Android, tap <strong>"Open"</strong> or navigate to your device's <strong>Downloads</strong> folder.</li>
              <li>If asked, enable <em>"Install unknown apps"</em> for your browser or file manager.</li>
              <li>Tap <strong>"Install"</strong> to place the <strong>Rahel POS</strong> icon directly on your home screen.</li>
            </ol>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-[#18181c] border-t border-[#26221c] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={toggleKioskFullscreen}
            className="px-3.5 py-2 rounded-xl border border-[#26221c] text-xs font-semibold text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Maximize className="w-3.5 h-3.5" />
            Enter Fullscreen Kiosk
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallPwa}
              className="px-3.5 py-2 rounded-xl bg-[#24242c] hover:bg-[#2c2c36] text-[#f5d77f] border border-[#2a261f] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{isInstalled ? 'Installed in Browser' : deferredPrompt ? 'Install Web App' : 'Add to Desktop'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadApk}
              disabled={isDownloadingApk}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] hover:to-[#b88c14] text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Download APK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
