import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { storage } from '../services/storage';
import { Product } from '../types';
import {
  Camera,
  X,
  Zap,
  ZapOff,
  SwitchCamera,
  CheckCircle2,
  AlertTriangle,
  Keyboard,
  RotateCcw,
  Plus,
  Minus,
  ShoppingBag,
  Volume2
} from 'lucide-react';

export interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string, product?: Product, quantity?: number) => void;
}

/**
 * Universal Mobile & Desktop QR Code Scanner Modal.
 * High-speed hardware-accelerated video camera stream with reticle overlay,
 * camera switching, torch/flash toggle, product lookup, and debounce protection.
 */
export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');

  // Detection & Lookup state
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scannedQuantity, setScannedQuantity] = useState<number>(1);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isDebouncingRef = useRef<boolean>(false);
  const readerElementId = 'qr-camera-stream-viewport';
  const settings = storage.getSettings();

  // Play crisp scanner audio beep
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext unavailable or restricted
    }
  };

  // Safe camera stream terminator
  const stopCameraStream = useCallback(async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      }
    } catch (e) {
      console.warn('Error clearing scanner instance:', e);
    } finally {
      html5QrCodeRef.current = null;
      setIsScanning(false);
      setIsTorchOn(false);

      // Force stop all lingering video tracks to release camera hardware
      const videoEl = document.querySelector(`#${readerElementId} video`) as HTMLVideoElement | null;
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        videoEl.srcObject = null;
      }
    }
  }, []);

  // Initialize and run the QR Scanner
  const startCameraScanner = useCallback(
    async (cameraIdx: number) => {
      setErrorMsg(null);
      setNotFoundCode(null);
      await stopCameraStream();

      const element = document.getElementById(readerElementId);
      if (!element) return;

      try {
        const availableDevices = await Html5Qrcode.getCameras();
        if (!availableDevices || availableDevices.length === 0) {
          setErrorMsg(
            'No camera device detected on this workstation. You can still search or enter QR codes manually.'
          );
          return;
        }

        setCameras(availableDevices);

        // Determine best camera: prefer rear / environment camera for QR scanning
        let targetIndex = cameraIdx;
        if (cameraIdx === 0 && availableDevices.length > 1) {
          const rearIndex = availableDevices.findIndex((c) =>
            /back|rear|environment/i.test(c.label)
          );
          if (rearIndex >= 0) targetIndex = rearIndex;
        }

        targetIndex = Math.min(targetIndex, availableDevices.length - 1);
        setCurrentCameraIndex(targetIndex);
        const selectedCam = availableDevices[targetIndex];

        const scanner = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A
          ],
          verbose: false
        });
        html5QrCodeRef.current = scanner;

        // Adaptive scanning box based on screen dimensions
        const viewportW = window.innerWidth;
        const boxSize = viewportW < 480 ? 210 : 250;

        await scanner.start(
          selectedCam.id,
          {
            fps: 15,
            qrbox: { width: boxSize, height: boxSize },
            aspectRatio: 1.0
          },
          (decodedText) => {
            // Check debounce lock
            if (isDebouncingRef.current) return;
            isDebouncingRef.current = true;

            const cleanCode = decodedText.trim();
            setLastScannedCode(cleanCode);
            playBeep();

            // Haptic vibration feedback on mobile
            if (navigator.vibrate) {
              navigator.vibrate([60, 40, 60]);
            }

            // Perform product lookup
            const product = storage.findProductByCode(cleanCode);

            if (product) {
              setScannedProduct(product);
              setScannedQuantity(1);
              setNotFoundCode(null);

              // Add to POS cart
              onScan(cleanCode, product, 1);
            } else {
              setScannedProduct(null);
              setNotFoundCode(cleanCode);
            }

            // Keep debounce pause active for 1.8 seconds to prevent duplicate rapid scans
            setTimeout(() => {
              isDebouncingRef.current = false;
            }, 1800);
          },
          () => {
            // Quiet frame pass
          }
        );

        setIsScanning(true);

        // Check if torch/flashlight is supported on active video track
        try {
          const videoElement = document.querySelector(
            `#${readerElementId} video`
          ) as HTMLVideoElement | null;
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject as MediaStream;
            const track = stream.getVideoTracks()[0];
            const capabilities = (track as unknown as { getCapabilities?: () => { torch?: boolean } })
              ?.getCapabilities?.();
            setTorchSupported(Boolean(capabilities?.torch));
          }
        } catch {
          setTorchSupported(false);
        }
      } catch (err: unknown) {
        console.error('Camera startup error:', err);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setErrorMsg(
            'Camera access is required to scan QR codes. Please allow camera permissions in your browser or address bar.'
          );
        } else if (msg.includes('NotFoundError')) {
          setErrorMsg('No camera hardware found on this device.');
        } else {
          setErrorMsg(`Unable to open camera: ${msg}. You can enter codes manually below.`);
        }
      }
    },
    [onScan, stopCameraStream]
  );

  // Switch between front/back camera
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const nextIdx = (currentCameraIndex + 1) % cameras.length;
    startCameraScanner(nextIdx);
  };

  // Toggle flashlight / torch where supported
  const handleToggleTorch = async () => {
    try {
      const videoElement = document.querySelector(
        `#${readerElementId} video`
      ) as HTMLVideoElement | null;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const nextState = !isTorchOn;
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setIsTorchOn(nextState);
      }
    } catch (e) {
      console.warn('Torch toggle failed', e);
    }
  };

  // Resume scanning for next item
  const handleScanNext = () => {
    setScannedProduct(null);
    setNotFoundCode(null);
    isDebouncingRef.current = false;
  };

  // Adjust quantity of scanned item
  const handleAdjustQuantity = (delta: number) => {
    if (!scannedProduct) return;
    const newQty = Math.max(1, scannedQuantity + delta);
    const diff = newQty - scannedQuantity;
    if (diff === 0) return;
    setScannedQuantity(newQty);
    onScan(scannedProduct.qrCode || scannedProduct.sku, scannedProduct, diff);
  };

  const handleSetExactQuantity = (newQty: number) => {
    if (!scannedProduct) return;
    const target = Math.max(1, newQty);
    const diff = target - scannedQuantity;
    if (diff === 0) return;
    setScannedQuantity(target);
    onScan(scannedProduct.qrCode || scannedProduct.sku, scannedProduct, diff);
  };

  // Manual code entry fallback
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualCode.trim();
    if (!query) return;

    playBeep();
    setLastScannedCode(query);
    const product = storage.findProductByCode(query);

    if (product) {
      setScannedProduct(product);
      setScannedQuantity(1);
      setNotFoundCode(null);
      onScan(query, product, 1);
    } else {
      setScannedProduct(null);
      setNotFoundCode(query);
    }

    setManualCode('');
  };

  // Mount/Unmount lifecycle
  useEffect(() => {
    if (isOpen) {
      isDebouncingRef.current = false;
      const timer = setTimeout(() => {
        startCameraScanner(currentCameraIndex);
      }, 150);
      return () => {
        clearTimeout(timer);
        stopCameraStream();
      };
    } else {
      stopCameraStream();
    }
  }, [isOpen, startCameraScanner, stopCameraStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#d4af37]/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#26221c] bg-[#18181c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#aa8010] text-black flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#f4efe8]">QR Code Scanner</h3>
              <p className="text-[11px] text-[#998b7a]">
                Point camera at product QR code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Camera Switch button if multiple cameras */}
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="p-1.5 rounded-lg text-[#c4bbb0] hover:text-[#f5d77f] hover:bg-white/5 transition-colors cursor-pointer"
                title="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            {/* Torch toggle if supported */}
            {torchSupported && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isTorchOn
                    ? 'text-amber-300 bg-amber-500/20'
                    : 'text-[#c4bbb0] hover:text-[#f5d77f] hover:bg-white/5'
                }`}
                title={isTorchOn ? 'Turn off light' : 'Turn on light'}
              >
                {isTorchOn ? <Zap className="w-4 h-4 text-amber-300" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
              title="Close scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scanner Viewport Container */}
        <div className="p-4 flex flex-col items-center overflow-y-auto space-y-3">
          {/* Camera Viewport */}
          <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-[#d4af37]/40 shadow-inner">
            <div id={readerElementId} className="w-full h-full" />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl border-2 border-[#d4af37]/90 relative flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.35)]">
                {/* Corner Accents */}
                <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-3 border-l-3 border-[#f5d77f] rounded-tl" />
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-3 border-r-3 border-[#f5d77f] rounded-tr" />
                <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-3 border-l-3 border-[#f5d77f] rounded-bl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-3 border-r-3 border-[#f5d77f] rounded-br" />

                {/* Pulsing scanning guide line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent animate-pulse shadow-xs" />
              </div>

              <span className="text-[10px] font-semibold text-amber-200 bg-black/80 px-2.5 py-0.5 rounded-full mt-3 backdrop-blur-xs border border-[#d4af37]/30 text-center">
                Point camera at QR code
              </span>
            </div>
          </div>

          {/* Camera Permission / Error Warning */}
          {errorMsg && (
            <div className="w-full p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-amber-300">Camera Permission Required</div>
                <div className="text-[11px] leading-relaxed text-amber-200/90">{errorMsg}</div>
                <button
                  type="button"
                  onClick={() => startCameraScanner(currentCameraIndex)}
                  className="mt-1 px-3 py-1 rounded-lg bg-amber-500 text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry Camera Access</span>
                </button>
              </div>
            </div>
          )}

          {/* Successfully Detected Product Card with Quantity Adjustment */}
          {scannedProduct && (
            <div className="w-full p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-100 text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Product Added to Sale!</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded">
                  {scannedProduct.sku}
                </span>
              </div>

              <div className="font-bold text-sm text-white">
                {scannedProduct.name}
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-800/40">
                <div>
                  <span className="text-[#a39c90]">Price: </span>
                  <strong className="text-[#f5d77f] font-mono text-sm">
                    {settings.currencySymbol} {scannedProduct.retailPrice.toFixed(2)}
                  </strong>
                </div>
                <div>
                  <span className="text-[#a39c90]">Stock: </span>
                  <strong className="text-white font-mono">
                    {scannedProduct.stock} {scannedProduct.unit}
                  </strong>
                </div>
              </div>

              {/* Quantity Stepper & Scan Next Action */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-lg border border-emerald-800/50">
                  <button
                    type="button"
                    onClick={() => handleAdjustQuantity(-1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-white hover:bg-white/10 cursor-pointer"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="flex items-center px-1">
                    <span className="text-[10px] text-[#a89f91] mr-1 font-semibold">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      max="99999"
                      value={scannedQuantity === 0 ? '' : scannedQuantity}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          handleSetExactQuantity(val);
                        }
                      }}
                      onBlur={() => {
                        if (!scannedQuantity || scannedQuantity < 1) {
                          handleSetExactQuantity(1);
                        }
                      }}
                      className="w-10 text-center font-mono font-bold text-xs bg-transparent text-[#f5d77f] focus:outline-none focus:bg-[#202028] rounded border border-transparent focus:border-emerald-600"
                      title="Type in quantity"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdjustQuantity(1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-white hover:bg-white/10 cursor-pointer"
                    title="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleScanNext}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Scan Next QR</span>
                </button>
              </div>
            </div>
          )}

          {/* Product Not Found Warning */}
          {notFoundCode && !scannedProduct && (
            <div className="w-full p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-rose-300">Product not found.</div>
                <div className="text-[11px] text-rose-200/80">
                  No catalog item matches QR code: <span className="font-mono font-bold">{notFoundCode}</span>
                </div>
                <button
                  type="button"
                  onClick={handleScanNext}
                  className="mt-1.5 px-2.5 py-0.5 rounded bg-rose-800 hover:bg-rose-700 text-white font-semibold text-[11px] cursor-pointer"
                >
                  Scan Another Code
                </button>
              </div>
            </div>
          )}

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="w-full pt-1">
            <label className="block text-[11px] text-[#998b7a] mb-1">
              Manual QR Code / SKU entry:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Keyboard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7d6f]" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. PPR-A4-80G or PEN-PIL-G2B"
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded-xl bg-[#1a1714] border border-[#26221c] text-[#f4efe8] placeholder-[#736657] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] text-black shrink-0 cursor-pointer shadow-xs"
              >
                Find & Add
              </button>
            </div>
          </form>

          {/* Quick Guidance Info */}
          <div className="w-full text-center text-[10px] text-[#786e62] pt-1">
            Compatible with smartphone cameras, tablet webcams, and USB hardware barcode/QR scanners.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#26221c] bg-[#18181c] text-xs">
          <span className="text-[#8c8273] text-[11px]">
            {scannedProduct ? 'Item added to active cart' : 'Ready to scan'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#26221c] hover:bg-[#322c24] text-[#f4efe8] font-semibold cursor-pointer"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
};

// Export alias for backward compatibility
export const QrScannerModal = BarcodeScannerModal;
