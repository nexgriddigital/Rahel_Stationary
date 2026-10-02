import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Volume2, Keyboard, CheckCircle, AlertTriangle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'barcode-camera-reader-viewport';

  // Play crisp scanner beep sound
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // High pitch retail scanner beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext not allowed or supported
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (html5QrCodeRef.current && isScanning) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear();
          })
          .catch(() => {});
        setIsScanning(false);
      }
      return;
    }

    let isMounted = true;
    setErrorMsg(null);
    setLastScanned(null);

    const startScanner = async () => {
      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ];

        const qrScanner = new Html5Qrcode(readerElementId, {
          formatsToSupport,
          verbose: false
        });
        html5QrCodeRef.current = qrScanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (!cameras || cameras.length === 0) {
          setErrorMsg('No camera device detected on this station. You can still use a USB/Bluetooth hardware scanner or enter codes manually below.');
          return;
        }

        // Prefer environment / back facing camera for scanning
        const selectedCamera = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear')) || cameras[0];

        await qrScanner.start(
          selectedCamera.id,
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.33
          },
          (decodedText) => {
            playBeep();
            setLastScanned(decodedText);
            onScan(decodedText.trim());
          },
          () => {
            // Frame scan without barcode
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setErrorMsg('Camera access was blocked by browser permissions. Please allow camera access in your URL bar.');
        } else {
          setErrorMsg('Camera could not be activated: ' + msg);
        }
      }
    };

    // Small delay to allow modal DOM rendering
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear();
          })
          .catch(() => {});
      }
    };
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playBeep();
    onScan(manualCode.trim());
    setLastScanned(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#26221c] bg-[#18181c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#aa8010] text-black flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#f4efe8]">Stationery Barcode Scanner</h3>
              <p className="text-xs text-[#998b7a]">Camera Live View & Laser Wedge Listener</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="p-4 flex flex-col items-center">
          <div className="relative w-full max-w-sm rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-[#d4af37]/30">
            <div id={readerElementId} className="w-full h-full" />
            
            {/* Overlay target guides */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-36 border-2 border-[#d4af37]/90 rounded-lg relative flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#f5d77f]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#f5d77f]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#f5d77f]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#f5d77f]" />
                <div className="w-full h-0.5 bg-[#d4af37]/90 animate-pulse" />
              </div>
              <span className="text-[11px] font-medium text-amber-100 bg-black/75 px-2.5 py-0.5 rounded-full mt-2 backdrop-blur-xs border border-[#d4af37]/30">
                Center product barcode in gold frame
              </span>
            </div>
          </div>

          {/* Error notice if camera blocked */}
          {errorMsg && (
            <div className="mt-3 w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Last scanned banner */}
          {lastScanned && (
            <div className="mt-3 w-full p-2.5 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f5d77f] text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-[#d4af37]" />
              <div className="flex-1 truncate">
                Scanned code: <span className="font-mono font-bold text-white">{lastScanned}</span> added to transaction
              </div>
              <Volume2 className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
            </div>
          )}

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="mt-4 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7d6f]" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Or type/paste barcode (e.g. 890123456001)"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl bg-[#1a1714] border border-[#26221c] text-[#f4efe8] placeholder-[#736657] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] hover:to-[#b88c14] text-black transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              Add Item
            </button>
          </form>

          {/* Quick instructions */}
          <div className="mt-3 w-full text-center text-[11px] text-[#8b7d6f]">
            Supports UPC, EAN-13, Code 128 & QR. Hardware USB laser wedge scanners function anywhere in the app automatically.
          </div>
        </div>
      </div>
    </div>
  );
};
