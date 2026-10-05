import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { storage } from '../services/storage';
import { printHtmlViaIframe } from '../services/printHelper';
import { QrCodeRenderer } from './QrCodeRenderer';
import QRCode from 'qrcode';
import {
  QrCode,
  X,
  Copy,
  Check,
  Printer,
  Download,
  Tag,
  Package,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export interface ProductBarcodeModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onProductUpdated?: (updatedProduct: Product) => void;
  onNavigateToStudio?: (productIds: string[]) => void;
}

/**
 * Product QR Code Preview & Label Modal.
 * Displays the product's unique QR code, SKU, product specifications,
 * and provides instant Print and Download capabilities.
 */
export const ProductBarcodeModal: React.FC<ProductBarcodeModalProps> = ({
  isOpen,
  product,
  onClose,
  onProductUpdated,
  onNavigateToStudio
}) => {
  if (!isOpen || !product) return null;

  const settings = storage.getSettings();
  const [copied, setCopied] = useState(false);
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const qrValue = (product.qrCode || product.sku || product.barcode || `QR-${product.id}`).trim();

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(
      qrValue,
      {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' }
      },
      (err, url) => {
        if (!err && url && isMounted) {
          setQrDataUrl(url);
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, [qrValue]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = qrValue;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const downloadLink = document.createElement('a');
    downloadLink.href = qrDataUrl;
    const sanitizedName = (product.sku || product.name || 'product')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    downloadLink.download = `qrcode-${sanitizedName}-${qrValue}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;
    const storeTitle = (settings.storeName || 'RAHEL STATIONARY').toUpperCase();
    const currency = settings.currencySymbol || 'ETB';
    const copies = Math.max(1, Math.min(50, printCopies));

    const labelsHtml = Array.from({ length: copies })
      .map(
        () => `
      <div class="qr-label-card">
        <div class="store-header">${storeTitle}</div>
        <div class="product-title">${product.name}</div>
        <div class="sku-id">SKU: ${product.sku}</div>
        <div class="qr-image-wrapper">
          <img src="${qrDataUrl}" alt="Product QR Code" />
        </div>
        <div class="qr-code-text">QR CODE: ${qrValue}</div>
        <div class="price-row">${currency} ${product.retailPrice.toFixed(2)}</div>
      </div>
    `
      )
      .join('');

    const printDoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Print QR Label - ${product.name}</title>
          <style>
            @page {
              size: auto;
              margin: 4mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 8px;
              background: #ffffff;
              color: #000000;
            }
            .labels-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(58mm, 1fr));
              gap: 4mm;
              justify-items: center;
            }
            .qr-label-card {
              width: 58mm;
              padding: 4mm 3mm;
              border: 1px dashed #999999;
              border-radius: 4px;
              text-align: center;
              box-sizing: border-box;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              min-height: 52mm;
            }
            .store-header {
              font-size: 8pt;
              font-weight: 800;
              letter-spacing: 0.6px;
              color: #222222;
              margin-bottom: 2px;
            }
            .product-title {
              font-size: 8.5pt;
              font-weight: 700;
              line-height: 1.15;
              color: #000000;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              margin-bottom: 2px;
            }
            .sku-id {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 7.5pt;
              font-weight: 700;
              color: #444444;
              margin-bottom: 2px;
            }
            .qr-image-wrapper {
              margin: 2px auto;
            }
            .qr-image-wrapper img {
              width: 28mm;
              height: 28mm;
              display: block;
              image-rendering: pixelated;
            }
            .qr-code-text {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 7pt;
              font-weight: 600;
              color: #555555;
              letter-spacing: 0.5px;
            }
            .price-row {
              font-size: 9.5pt;
              font-weight: 800;
              color: #000000;
              margin-top: 2px;
            }
          </style>
        </head>
        <body>
          <div class="labels-container">
            ${labelsHtml}
          </div>
        </body>
      </html>
    `;

    printHtmlViaIframe(printDoc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#d4af37]/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#18181c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#aa8010] text-black flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#f5d77f]">
                Product QR Code Preview
              </h3>
              <p className="text-xs text-[#998b7a]">
                Permanent high-density identifier for mobile & optical scanning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
            title="Close QR Code preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Product Overview Header Card */}
          <div className="p-3.5 rounded-xl bg-[#18181d] border border-[#2a261f] flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#d4af37]/15 text-[#f5d77f] border border-[#d4af37]/30 mb-1">
                  {product.category}
                </span>
                <h4 className="font-bold text-sm sm:text-base text-[#f4efe8] leading-tight">
                  {product.name}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm sm:text-base font-mono font-bold text-[#f5d77f]">
                  {settings.currencySymbol} {product.retailPrice.toFixed(2)}
                </div>
                <div className="text-[11px] text-[#998b7a]">
                  Stock: <strong className="text-[#f4efe8]">{product.stock} {product.unit}</strong>
                </div>
              </div>
            </div>

            {product.description && (
              <p className="text-xs text-[#998b7a] line-clamp-2 border-t border-[#26221c] pt-2 mt-1">
                {product.description}
              </p>
            )}
          </div>

          {/* Central QR Code Display Card */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0d0d10] border border-[#2a261f] shadow-inner text-center space-y-3">
            <div className="p-3 bg-white rounded-xl shadow-md border-4 border-[#d4af37]/50">
              <QrCodeRenderer
                value={qrValue}
                size={180}
                displayValue={false}
                className="bg-transparent shadow-none p-0"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8c8273]">
                QR Code ID / Scannable Value
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-sm sm:text-base font-bold text-[#f5d77f] bg-[#1a1a22] px-3 py-1 rounded-lg border border-[#d4af37]/30 select-all">
                  {qrValue}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-[#1f1f26] hover:bg-[#d4af37]/20 text-[#a39c90] hover:text-[#f5d77f] border border-[#2a261f] transition-colors cursor-pointer"
                  title="Copy QR Value"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-[11px] font-mono text-[#8c8273]">
                SKU: <strong className="text-[#c4bbb0]">{product.sku}</strong>
              </div>
            </div>
          </div>

          {/* Print Copies Selection */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181d] border border-[#2a261f] text-xs">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#d4af37]" />
              <span className="font-medium text-[#c4bbb0]">Print Label Copies:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPrintCopies(num)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    printCopies === num
                      ? 'bg-[#d4af37] text-black font-bold shadow-xs'
                      : 'bg-[#141417] text-[#998b7a] hover:text-white border border-[#2a261f]'
                  }`}
                >
                  {num}
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="50"
                value={printCopies}
                onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-14 px-2 py-1 text-center font-mono rounded-lg bg-[#141417] border border-[#2a261f] text-[#f4efe8]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-[#26221c] bg-[#18181c]">
          <button
            type="button"
            onClick={handleDownload}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#1f1f26] hover:bg-[#282834] text-[#c4bbb0] hover:text-white border border-[#2a261f] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download QR Code image (.png)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] hover:to-[#b88c14] text-black shadow-md shadow-[#d4af37]/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-black" />
              <span>Print QR Code ({printCopies})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export alias for backward compatibility
export const ProductQrCodeModal = ProductBarcodeModal;
