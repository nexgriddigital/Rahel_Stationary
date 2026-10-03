import React, { useState } from 'react';
import { Product } from '../types';
import { storage } from '../services/storage';
import { printHtmlViaIframe } from '../services/printHelper';
import { BarcodeRenderer } from './BarcodeRenderer';
import {
  Barcode,
  X,
  Copy,
  Check,
  Printer,
  Edit2,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Tag,
  Package,
  CheckCircle2
} from 'lucide-react';

interface ProductBarcodeModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onProductUpdated?: (updatedProduct: Product) => void;
  onNavigateToStudio?: (productId: string) => void;
}

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
  const [isEditing, setIsEditing] = useState(false);
  const [newBarcode, setNewBarcode] = useState(product.barcode);
  const [editError, setEditError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(product.barcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
      const el = document.createElement('textarea');
      el.value = product.barcode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateNew = () => {
    const code = storage.generateBarcodeNumber();
    setNewBarcode(code);
    setEditError(null);
  };

  const handleSaveBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    const clean = newBarcode.trim();

    if (!clean) {
      setEditError('Barcode cannot be empty.');
      return;
    }

    if (!storage.isBarcodeUnique(clean, product.id)) {
      setEditError('This barcode is already assigned to another item in the catalog.');
      return;
    }

    const updatedProduct: Product = {
      ...product,
      barcode: clean,
      updatedAt: new Date().toISOString()
    };

    const res = storage.saveProduct(updatedProduct);
    if (res.success) {
      setSaveSuccess('Barcode updated successfully!');
      setIsEditing(false);
      if (onProductUpdated) onProductUpdated(updatedProduct);
      setTimeout(() => setSaveSuccess(null), 3000);
    } else {
      setEditError(res.error || 'Failed to update barcode.');
    }
  };

  // Dedicated Print individual barcode labels
  const handlePrint = () => {
    // Build labels HTML
    const labelsHtml = Array.from({ length: printCopies })
      .map(
        () => `
        <div class="label-card">
          <div class="store-name">${settings.storeName.toUpperCase()}</div>
          <div class="item-name">${product.name}</div>
          <div class="barcode-container" id="barcode-${Math.random().toString(36).substring(7)}">
            <svg class="barcode-svg" jsbarcode-value="${product.barcode}" jsbarcode-format="CODE128" jsbarcode-width="1.8" jsbarcode-height="45" jsbarcode-fontsize="11" jsbarcode-margin="0"></svg>
          </div>
          <div class="footer-meta">
            <span class="sku">SKU: ${product.sku}</span>
            <span class="price">${settings.currencySymbol} ${product.retailPrice.toFixed(2)}</span>
          </div>
        </div>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${product.name}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 10px;
              background: #fff;
              color: #000;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 12px;
            }
            .label-card {
              border: 1px dashed #aaa;
              border-radius: 6px;
              padding: 8px 10px;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              page-break-inside: avoid;
            }
            .store-name {
              font-size: 9px;
              font-weight: 800;
              letter-spacing: 0.5px;
              color: #444;
              margin-bottom: 2px;
            }
            .item-name {
              font-size: 11px;
              font-weight: 700;
              line-height: 1.2;
              max-height: 28px;
              overflow: hidden;
              margin-bottom: 4px;
            }
            .barcode-container {
              margin: 4px 0;
            }
            .footer-meta {
              width: 100%;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-family: monospace;
              font-size: 11px;
              border-top: 1px solid #eee;
              padding-top: 4px;
              margin-top: 2px;
            }
            .price {
              font-weight: 800;
              font-size: 12px;
            }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${labelsHtml}
          </div>
          <script>
            window.onload = function() {
              JsBarcode(".barcode-svg").init();
              setTimeout(function() {
                window.print();
              }, 200);
            };
          </script>
        </body>
      </html>
    `;

    printHtmlViaIframe(htmlContent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-[#141417] text-[#f4efe8] border border-[#2a261f] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#26221c] bg-[#18181c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#aa8010] text-black flex items-center justify-center shadow-xs">
              <Barcode className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#f5d77f]">
                Product Barcode & Identification
              </h3>
              <p className="text-[11px] text-[#998b7a]">
                Unique Code-128 Retail Barcode
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8271] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Product Summary Header Card */}
          <div className="p-3.5 rounded-2xl bg-[#1a1714] border border-[#26221c] space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37]">
                  {product.category}
                </span>
                <h4 className="text-sm font-bold text-[#f4efe8] leading-snug">
                  {product.name}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-extrabold font-mono text-[#f5d77f]">
                  {settings.currencySymbol} {product.retailPrice.toFixed(2)}
                </div>
                <div className="text-[10px] text-[#998b7a]">
                  Stock: <strong className="text-[#f4efe8]">{product.stock} {product.unit}</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#26221c] flex items-center justify-between text-xs text-[#998b7a] font-mono">
              <span>SKU: <strong className="text-[#f4efe8]">{product.sku}</strong></span>
              <span>Item ID: <strong className="text-[#c4bbb0]">{product.id}</strong></span>
            </div>
          </div>

          {/* Feedback messages */}
          {saveSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {editError && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {/* High-Contrast Scannable Barcode Plate */}
          <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-inner flex flex-col items-center justify-center space-y-1">
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-slate-700">
              {settings.storeName}
            </span>
            <div className="w-full flex justify-center py-1 overflow-hidden">
              <BarcodeRenderer
                value={product.barcode}
                width={1.9}
                height={55}
                fontSize={12}
                displayValue={false}
              />
            </div>
            {/* Prominent Barcode Number under graphic */}
            <div className="font-mono text-base font-bold tracking-widest text-slate-900 select-all">
              {product.barcode}
            </div>
          </div>

          {/* Barcode Actions: Copy, Quick Edit */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-2 px-3 rounded-xl bg-[#1a1714] border border-[#2a241c] hover:border-[#d4af37]/40 text-xs font-semibold text-[#f4efe8] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Copy Barcode</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsEditing(!isEditing);
                setNewBarcode(product.barcode);
                setEditError(null);
              }}
              className="py-2 px-3 rounded-xl bg-[#1a1714] border border-[#2a241c] hover:border-[#d4af37]/40 text-xs font-semibold text-[#f5d77f] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Code'}</span>
            </button>
          </div>

          {/* Edit Barcode Inline Form */}
          {isEditing && (
            <form onSubmit={handleSaveBarcode} className="p-3.5 rounded-2xl bg-[#1a1714] border border-[#d4af37]/40 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#c4bbb0]">
                  Edit or Assign Unique Barcode
                </label>
                <button
                  type="button"
                  onClick={handleGenerateNew}
                  className="text-[11px] font-semibold text-[#f5d77f] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#d4af37]" />
                  <span>Generate New</span>
                </button>
              </div>

              <input
                type="text"
                required
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                placeholder="Enter unique barcode value"
                className="w-full px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-xl bg-[#121215] border border-[#2a261f] text-[#f5d77f] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-[#998b7a] hover:text-[#f4efe8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] text-black font-bold text-xs hover:brightness-110 cursor-pointer"
                >
                  Save New Barcode
                </button>
              </div>
            </form>
          )}

          {/* Printing Options */}
          <div className="p-3.5 rounded-2xl bg-[#18181c] border border-[#26221c] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#d4af37]" />
              <div>
                <div className="text-xs font-semibold text-[#f4efe8]">Print Labels</div>
                <div className="text-[10px] text-[#998b7a]">Thermal / Adhesive Sheets</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={printCopies}
                onChange={(e) => setPrintCopies(Number(e.target.value))}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-[#141417] border border-[#2a241c] text-[#f4efe8] focus:outline-none cursor-pointer"
              >
                <option value={1}>1 Label</option>
                <option value={4}>4 Labels</option>
                <option value={10}>10 Labels</option>
                <option value={24}>24 Labels (Sheet)</option>
                <option value={product.stock}>Match Stock ({product.stock})</option>
              </select>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5d77f] to-[#aa8010] text-black text-xs font-bold shadow-sm shadow-[#d4af37]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-black" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        {onNavigateToStudio && (
          <div className="px-6 py-3 bg-[#18181c] border-t border-[#26221c] flex items-center justify-between text-xs">
            <span className="text-[#998b7a] text-[11px]">Need customized multi-product A4 layouts?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToStudio(product.id);
              }}
              className="text-[#f5d77f] hover:underline font-semibold flex items-center gap-1 text-xs cursor-pointer"
            >
              <span>Open in Barcode Studio</span>
              <ExternalLink className="w-3 h-3 text-[#d4af37]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
