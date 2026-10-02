import React, { useState, useEffect } from 'react';
import { Download, Monitor, WifiOff, Zap, ShieldCheck, X, Maximize } from 'lucide-react';

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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        onClose();
      }
    } else {
      // Trigger fullscreen kiosk mode
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#26221c] bg-[#18181c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#aa8010] text-black flex items-center justify-center shadow-xs">
              <Download className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#f4efe8]">Download Rahel POS Kiosk App</h3>
              <p className="text-[11px] text-[#998b7a]">
                Install as a standalone desktop kiosk or tablet register
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Pillars Grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#1a1714] border border-[#26221c] space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center mb-1">
                <WifiOff className="w-4 h-4 text-[#d4af37]" />
              </div>
              <h4 className="font-semibold text-xs text-[#f5d77f]">
                100% Offline Protection
              </h4>
              <p className="text-[11px] text-[#998b7a] leading-tight">
                Never lose a sale. Checkouts, inventory updates, and receipts continue working seamlessly even when the store network drops.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1a1714] border border-[#26221c] space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center mb-1">
                <Monitor className="w-4 h-4 text-[#d4af37]" />
              </div>
              <h4 className="font-semibold text-xs text-[#f5d77f]">
                Dedicated Kiosk Workspace
              </h4>
              <p className="text-[11px] text-[#998b7a] leading-tight">
                Eliminates browser tabs, address bars, and accidental keyboard exits for focused cashier operation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1a1714] border border-[#26221c] space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center mb-1">
                <Zap className="w-4 h-4 text-[#d4af37]" />
              </div>
              <h4 className="font-semibold text-xs text-[#f5d77f]">
                Hardware Acceleration
              </h4>
              <p className="text-[11px] text-[#998b7a] leading-tight">
                Direct low-latency access to webcam barcode scanning, USB laser wedges, and raw thermal printer streams.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1a1714] border border-[#26221c] space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center mb-1">
                <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              </div>
              <h4 className="font-semibold text-xs text-[#f5d77f]">
                1-Click Fast Launch
              </h4>
              <p className="text-[11px] text-[#998b7a] leading-tight">
                Pin directly to your Windows Taskbar, macOS Dock, or iPad/Android retail counter tablet home screen.
              </p>
            </div>
          </div>

          {/* Browser instructions */}
          <div className="p-3 rounded-xl bg-[#1a1714] text-xs space-y-1 border border-[#26221c]">
            <div className="font-semibold text-[#f5d77f]">Installation Instructions:</div>
            <ul className="list-disc pl-4 space-y-0.5 text-[#998b7a] text-[11px]">
              <li><strong>Chrome / Edge / Brave:</strong> Click the <strong>"Install"</strong> button below, or click the install icon in your browser URL bar.</li>
              <li><strong>Safari / iOS:</strong> Tap the <strong>Share</strong> button and choose <strong>"Add to Home Screen"</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#18181c] border-t border-[#26221c] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={toggleKioskFullscreen}
            className="px-3.5 py-2 rounded-xl border border-[#26221c] text-xs font-semibold text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Maximize className="w-3.5 h-3.5" />
            Enter Fullscreen Kiosk
          </button>

          <button
            type="button"
            onClick={handleInstallClick}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] hover:to-[#b88c14] text-black text-xs font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-black" />
            {isInstalled ? 'App Already Installed' : deferredPrompt ? 'Install Rahel POS App' : 'Enable Kiosk Mode'}
          </button>
        </div>
      </div>
    </div>
  );
};
