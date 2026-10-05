import React, { useState } from 'react';
import { Product, ProductCategory, LOW_STOCK_THRESHOLD } from '../types';
import { storage } from '../services/storage';
import { printHtmlViaIframe } from '../services/printHelper';
import { BarcodeRenderer } from '../components/BarcodeRenderer';
import { BulkImportModal } from '../components/BulkImportModal';
import { ProductBarcodeModal } from '../components/ProductBarcodeModal';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
  Sparkles,
  Barcode,
  History,
  CheckCircle2,
  X,
  Filter,
  FileSpreadsheet,
  Copy,
  Printer,
  Eye,
  Check,
  CheckSquare,
  Square,
  AlertCircle,
  FileText
} from 'lucide-react';
import { exportInventoryReportPDF, exportLowStockReportPDF } from '../services/pdfReportGenerator';

interface InventoryViewProps {
  onNavigateToBarcodeStudio?: (productIds: string[]) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onNavigateToBarcodeStudio }) => {
  const [products, setProducts] = useState<Product[]>(storage.getProducts());
  const [filterMode, setFilterMode] = useState<'all' | 'low_stock'>('all');
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [search, setSearch] = useState('');
  const settings = storage.getSettings();

  // Barcode and Selection states
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);
  const [copiedBarcodeId, setCopiedBarcodeId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('10');
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'AUDIT' | 'RETURN' | 'DAMAGE'>('IN');
  const [adjustReason, setAdjustReason] = useState('Stock replenishment shipment');
  const [showMovementsDrawer, setShowMovementsDrawer] = useState(false);

  // Form fields for Add/Edit
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'Paper & Notebooks',
    sku: '',
    barcode: '',
    costPrice: 5.0,
    retailPrice: 9.99,
    stock: 20,
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'pcs',
    description: ''
  });

  const categories: ProductCategory[] = [
    'Writing & Pens',
    'Paper & Notebooks',
    'Printing & Copying',
    'Art & Craft',
    'Desk & Office',
    'Binding & Lamination',
    'Packaging & Envelopes',
    'Custom Stamps & Signs'
  ];

  const refreshList = () => {
    setProducts(storage.getProducts());
  };

  const copyBarcode = async (barcode: string, prodId: string) => {
    try {
      await navigator.clipboard.writeText(barcode);
    } catch {
      const el = document.createElement('textarea');
      el.value = barcode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedBarcodeId(prodId);
    setTimeout(() => setCopiedBarcodeId(null), 1800);
  };

  const handlePrintBatchLabels = (items: Product[]) => {
    if (items.length === 0) return;

    const labelsHtml = items
      .map(
        p => `
        <div class="label-card">
          <div class="store-name">${settings.storeName.toUpperCase()}</div>
          <div class="item-name">${p.name}</div>
          <div class="barcode-container">
            <svg class="barcode-svg" jsbarcode-value="${p.barcode}" jsbarcode-format="CODE128" jsbarcode-width="1.8" jsbarcode-height="45" jsbarcode-fontsize="11" jsbarcode-margin="0"></svg>
          </div>
          <div class="footer-meta">
            <span class="sku">SKU: ${p.sku}</span>
            <span class="price">${settings.currencySymbol} ${p.retailPrice.toFixed(2)}</span>
          </div>
        </div>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode Labels - ${settings.storeName}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 10px; background: #fff; color: #000; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
            .label-card { border: 1px dashed #aaa; border-radius: 6px; padding: 8px 10px; display: flex; flex-direction: column; align-items: center; text-align: center; page-break-inside: avoid; }
            .store-name { font-size: 9px; font-weight: 800; letter-spacing: 0.5px; color: #444; margin-bottom: 2px; }
            .item-name { font-size: 11px; font-weight: 700; line-height: 1.2; max-height: 28px; overflow: hidden; margin-bottom: 4px; }
            .barcode-container { margin: 4px 0; }
            .footer-meta { width: 100%; display: flex; justify-content: space-between; align-items: center; font-family: monospace; font-size: 11px; border-top: 1px solid #eee; padding-top: 4px; margin-top: 2px; }
            .price { font-weight: 800; font-size: 12px; }
            @media print { .no-print { display: none; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="grid">${labelsHtml}</div>
          <script>
            window.onload = function() {
              JsBarcode(".barcode-svg").init();
              setTimeout(function() { window.print(); }, 200);
            };
          </script>
        </body>
      </html>
    `;

    printHtmlViaIframe(htmlContent);
  };

  const handleOpenAdd = () => {
    const autoBarcode = storage.generateBarcodeNumber();
    const autoSku = storage.generateSku('Paper & Notebooks', 'New Item');
    setFormData({
      name: '',
      category: 'Paper & Notebooks',
      sku: autoSku,
      barcode: autoBarcode,
      costPrice: 4.5,
      retailPrice: 8.5,
      stock: 25,
      minThreshold: LOW_STOCK_THRESHOLD,
      unit: 'pcs',
      description: ''
    });
    setFormError(null);
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setFormData({ ...p });
    setFormError(null);
    setEditingProduct(p);
    setIsAddModalOpen(true);
  };

  const handleAutoGenerateCodes = () => {
    const autoBarcode = storage.generateBarcodeNumber();
    const autoSku = storage.generateSku(formData.category || 'Paper & Notebooks', formData.name || 'Stationery');
    setFormData(prev => ({
      ...prev,
      sku: autoSku,
      barcode: autoBarcode
    }));
    setFormError(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name || !formData.sku) return;

    let barcodeValue = (formData.barcode || '').trim();
    if (!barcodeValue) {
      barcodeValue = storage.generateBarcodeNumber();
    }

    // Verify barcode uniqueness
    if (!storage.isBarcodeUnique(barcodeValue, editingProduct?.id)) {
      const duplicateProduct = products.find(p => p.id !== editingProduct?.id && p.barcode.trim() === barcodeValue);
      setFormError(`Barcode '${barcodeValue}' is already assigned to "${duplicateProduct?.name}". Every item must have its own unique barcode.`);
      return;
    }

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : 'prod_' + Date.now(),
      name: formData.name,
      category: formData.category as ProductCategory,
      sku: formData.sku,
      barcode: barcodeValue,
      costPrice: Number(formData.costPrice) || 0,
      retailPrice: Number(formData.retailPrice) || 0,
      stock: Number(formData.stock) || 0,
      minThreshold: LOW_STOCK_THRESHOLD,
      unit: formData.unit || 'pcs',
      description: formData.description || '',
      updatedAt: new Date().toISOString()
    };

    const res = storage.saveProduct(productToSave);
    if (!res.success) {
      setFormError(res.error || 'Failed to save product.');
      return;
    }

    refreshList();
    setIsAddModalOpen(false);
    setSuccessNotification(`Saved "${productToSave.name}" with unique barcode ${productToSave.barcode}`);
    setTimeout(() => setSuccessNotification(null), 3500);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete '${name}' from inventory?`)) {
      storage.deleteProduct(id);
      refreshList();
    }
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const qty = parseInt(adjustQuantity, 10) || 0;
    const change = adjustType === 'OUT' || adjustType === 'DAMAGE' ? -Math.abs(qty) : Math.abs(qty);
    storage.adjustStock(adjustingProduct.id, change, adjustType, adjustReason);
    refreshList();
    setAdjustingProduct(null);
  };

  // Filter products
  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    const matchesCat = selectedCat === 'All' || p.category === selectedCat;
    const matchesStock = filterMode === 'all' || p.stock <= LOW_STOCK_THRESHOLD;

    return matchesSearch && matchesCat && matchesStock;
  });

  const lowStockCount = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length;
  const stockMovements = storage.getStockMovements();

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-hidden bg-[#0a0a0c] text-[#f4efe8]">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <h2 className="text-xl font-bold text-[#f5d77f]">
            Stationery Inventory Catalog
          </h2>
          <p className="text-xs text-[#a39c90]">
            Manage retail stationery items, barcodes, margins, stock levels & movement audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMovementsDrawer(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#d4af37]/15 text-[#f5d77f] border border-[#d4af37]/30 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <History className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Audit Movements</span>
          </button>

          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/40 flex items-center gap-1.5 transition-colors shadow-2xs hover:border-[#d4af37]"
            title="Bulk import products from Excel (.xlsx, .xls) or PDF invoices"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#f5d77f]" />
            <span>Bulk Import</span>
          </button>

          <button
            type="button"
            onClick={() => exportInventoryReportPDF(products, settings)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/40 flex items-center gap-1.5 transition-colors shadow-2xs hover:border-[#d4af37]"
            title="Download full Inventory and Price Catalog as PDF"
          >
            <FileText className="w-3.5 h-3.5 text-[#f5d77f]" />
            <span>Export Catalog PDF</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] hover:brightness-110 text-black flex items-center gap-1.5 transition-all shadow-sm shadow-[#d4af37]/20"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Bulk Import / Action Success Notification Banner */}
      {successNotification && (
        <div className="mt-3 px-4 py-2.5 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f5d77f] text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#f5d77f] shrink-0" />
            <span className="font-semibold">{successNotification}</span>
          </div>
          <button
            onClick={() => setSuccessNotification(null)}
            className="p-1 rounded-lg text-[#f5d77f] hover:bg-[#d4af37]/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8273]" />
            <input
              type="text"
              placeholder="Search by product title, SKU, or 12-digit barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#141417] border border-[#2a261f] text-[#f4efe8] placeholder-[#7d7465] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-[#141417] border border-[#2a261f] text-[#f4efe8] focus:outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Low Stock Toggle Pill */}
          <button
            onClick={() => setFilterMode(filterMode === 'all' ? 'low_stock' : 'all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              filterMode === 'low_stock'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-[#141417] text-[#c2baa9] border border-[#2a261f] hover:border-[#d4af37]/40 hover:text-[#f5d77f]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Alert ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Inventory Table & Mobile Cards Container */}
      <div className="flex-1 rounded-2xl border border-[#26221c] bg-[#121215] overflow-hidden flex flex-col shadow-2xs relative">
        {/* Mobile View: Responsive Cards (< md) */}
        <div className="md:hidden flex-1 overflow-y-auto divide-y divide-[#26221c] p-2 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#8c8273]">
              <p className="text-xs">No inventory records match the current filters.</p>
              <button
                onClick={() => setIsBulkImportOpen(true)}
                className="mt-3 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-black inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-black" />
                <span>Bulk Import Items</span>
              </button>
            </div>
          ) : (
            filtered.map((prod) => {
              const isLow = prod.stock <= LOW_STOCK_THRESHOLD;
              const isSelected = selectedProductIds.has(prod.id);
              const marginPercent =
                prod.retailPrice > 0
                  ? (((prod.retailPrice - prod.costPrice) / prod.retailPrice) * 100).toFixed(0)
                  : '0';

              return (
                <div
                  key={prod.id}
                  className={`p-3.5 rounded-xl border border-[#26221c] space-y-3 transition-colors ${
                    isSelected ? 'bg-[#d4af37]/10 border-[#d4af37]/40' : 'bg-[#16161b]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductIds(prev => {
                            const next = new Set(prev);
                            if (next.has(prod.id)) next.delete(prod.id);
                            else next.add(prod.id);
                            return next;
                          });
                        }}
                        className="mt-0.5 p-1 rounded text-[#998b7a] hover:text-[#f5d77f] cursor-pointer"
                        title={isSelected ? 'Deselect item' : 'Select item'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#d4af37]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <div className="font-semibold text-xs text-[#f4efe8]">{prod.name}</div>
                        <div className="text-[10px] text-[#998b7a] mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-[#1c1c22] text-[#d4af37] font-medium">
                            {prod.category}
                          </span>
                          <span>SKU: {prod.sku || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold font-mono text-[#f5d77f]">
                        {settings.currencySymbol} {prod.retailPrice.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#8c8273]">
                        Cost: {settings.currencySymbol} {prod.costPrice.toFixed(2)} ({marginPercent}%)
                      </div>
                    </div>
                  </div>

                  {/* Barcode Strip with Eye (View Barcode Modal) button */}
                  <div className="p-2 rounded-lg bg-[#111114] border border-[#23201a] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setBarcodeModalProduct(prod)}
                      className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#f5d77f] hover:underline truncate"
                      title="View individual product barcode"
                    >
                      <Barcode className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                      <span className="truncate">{prod.barcode || 'No barcode'}</span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyBarcode(prod.barcode, prod.id)}
                        className="p-1 rounded-md text-[#8c8273] hover:text-[#f5d77f] hover:bg-white/5 cursor-pointer"
                        title="Copy Barcode"
                      >
                        {copiedBarcodeId === prod.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Eye (👁 View) Button */}
                      <button
                        type="button"
                        onClick={() => setBarcodeModalProduct(prod)}
                        className="p-1 rounded-md text-[#d4af37] hover:bg-[#d4af37]/15 cursor-pointer"
                        title="View Barcode Preview Modal"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintBatchLabels([prod])}
                        className="p-1 rounded-md text-[#8c8273] hover:text-[#f5d77f] hover:bg-white/5 cursor-pointer"
                        title="Print Barcode Label"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stock status & Quick actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#23201a] text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#8c8273] text-[11px]">Stock:</span>
                      <span className={`font-mono font-bold ${isLow ? 'text-amber-400' : 'text-[#f4efe8]'}`}>
                        {prod.stock} {prod.unit}
                      </span>
                      {isLow && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                          Low
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAdjustingProduct(prod)}
                        className="px-2 py-1 rounded-lg bg-[#201d18] border border-[#2a241c] hover:border-[#d4af37]/40 text-[#f5d77f] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowUpDown className="w-3 h-3 text-[#d4af37]" />
                        <span>Adjust</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 rounded-lg bg-[#201d18] border border-[#2a241c] text-[#8c8273] hover:text-[#f4efe8] cursor-pointer"
                        title="Edit product"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="p-1.5 rounded-lg bg-[#201d18] border border-[#2a241c] text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop / Tablet View: Full Data Table (hidden on mobile, visible on md+) */}
        <div className="hidden md:block flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#18181d] text-[#a39c90] font-medium border-b border-[#26221c] z-10 select-none">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedProductIds.size === filtered.length && filtered.length > 0) {
                        setSelectedProductIds(new Set());
                      } else {
                        setSelectedProductIds(new Set(filtered.map(p => p.id)));
                      }
                    }}
                    title={selectedProductIds.size === filtered.length ? 'Deselect all' : 'Select all items'}
                    className="p-1 rounded text-[#998b7a] hover:text-[#f5d77f] transition-colors cursor-pointer"
                  >
                    {filtered.length > 0 && selectedProductIds.size === filtered.length ? (
                      <CheckSquare className="w-4 h-4 text-[#d4af37]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-4">Item & Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 font-mono">SKU</th>
                <th className="py-2.5 px-3 font-mono">Unique Barcode</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3 text-right">Retail</th>
                <th className="py-2.5 px-3 text-right">Margin</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26221c] text-[#f4efe8]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#8c8273]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No inventory records match the current filters.</p>
                      <button
                        onClick={() => setIsBulkImportOpen(true)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-black flex items-center gap-1.5 shadow-xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-black" />
                        <span>Bulk Import Items</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const isLow = prod.stock <= LOW_STOCK_THRESHOLD;
                  const isSelected = selectedProductIds.has(prod.id);
                  const marginPercent =
                    prod.retailPrice > 0
                      ? (((prod.retailPrice - prod.costPrice) / prod.retailPrice) * 100).toFixed(0)
                      : '0';

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-[#d4af37]/5 transition-colors ${
                        isSelected ? 'bg-[#d4af37]/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductIds(prev => {
                              const next = new Set(prev);
                              if (next.has(prod.id)) next.delete(prod.id);
                              else next.add(prod.id);
                              return next;
                            });
                          }}
                          className="p-1 rounded text-[#998b7a] hover:text-[#f5d77f] transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#d4af37]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-xs text-[#f4efe8]">
                          {prod.name}
                        </div>
                        {prod.description && (
                          <div className="text-[10px] text-[#8c8273] truncate max-w-xs">
                            {prod.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-[#a39c90]">
                        {prod.category}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#c4bbb0]">
                        {prod.sku}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setBarcodeModalProduct(prod)}
                            title="Click to view & print barcode"
                            className="group text-left cursor-pointer"
                          >
                            <div className="font-mono text-xs font-bold text-[#f5d77f] group-hover:underline flex items-center gap-1.5">
                              <Barcode className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>{prod.barcode}</span>
                            </div>
                            <div className="text-[10px] text-[#8c8273]">Code-128 Retail</div>
                          </button>

                          <div className="flex items-center gap-0.5 ml-1">
                            <button
                              type="button"
                              onClick={() => copyBarcode(prod.barcode, prod.id)}
                              title="Copy Barcode Value"
                              className="p-1 rounded-md text-[#8c8273] hover:text-[#f5d77f] hover:bg-[#d4af37]/15 transition-colors cursor-pointer"
                            >
                              {copiedBarcodeId === prod.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setBarcodeModalProduct(prod)}
                              title="View & Print Barcode Label"
                              className="p-1 rounded-md text-[#8c8273] hover:text-[#f5d77f] hover:bg-[#d4af37]/15 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintBatchLabels([prod])}
                              title="Print Single Barcode Label"
                              className="p-1 rounded-md text-[#8c8273] hover:text-[#f5d77f] hover:bg-[#d4af37]/15 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#8c8273]">
                        {settings.currencySymbol} {prod.costPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#f5d77f]">
                        {settings.currencySymbol} {prod.retailPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#d4af37] font-semibold">
                        {marginPercent}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`font-bold ${
                              isLow
                                ? 'text-amber-400'
                                : 'text-[#f4efe8]'
                            }`}
                          >
                            {prod.stock}
                          </span>
                          <span className="text-[10px] text-[#8c8273]">{prod.unit}</span>
                          {isLow && (
                            <span
                              title={`Below reorder threshold (${LOW_STOCK_THRESHOLD})`}
                              className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setAdjustingProduct(prod);
                              setAdjustQuantity('10');
                              setAdjustType('IN');
                            }}
                            title="Quick Stock In / Out Adjustment"
                            className="p-1 rounded-lg text-[#f5d77f] hover:bg-[#d4af37]/20 cursor-pointer"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            title="Edit Product Details"
                            className="p-1 rounded-lg text-[#8c8273] hover:text-[#f4efe8] hover:bg-[#d4af37]/10 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            title="Delete Product"
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Floating Multi-select Batch Barcode Print Toolbar */}
        {selectedProductIds.size > 0 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-2xl bg-[#18181c] border border-[#d4af37]/50 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <span className="text-xs font-semibold text-[#f5d77f] flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-[#d4af37]" />
              <span>{selectedProductIds.size} items selected</span>
            </span>

            <div className="h-4 w-px bg-[#26221c]" />

            <button
              type="button"
              onClick={() => {
                const selectedList = products.filter(p => selectedProductIds.has(p.id));
                handlePrintBatchLabels(selectedList);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] text-black text-xs font-bold flex items-center gap-1.5 hover:brightness-110 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-black" />
              <span>Print Barcode Labels ({selectedProductIds.size})</span>
            </button>

            {onNavigateToBarcodeStudio && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToBarcodeStudio(Array.from(selectedProductIds));
                }}
                className="px-3 py-1.5 rounded-xl bg-[#24242c] hover:bg-[#d4af37]/20 text-[#f5d77f] border border-[#3a3224] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Barcode className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Barcode Studio Sheet</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedProductIds(new Set())}
              className="text-xs text-[#8c8273] hover:text-[#f4efe8] px-1 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Footer Meta Summary */}
        <div className="p-3 bg-[#18181d] border-t border-[#26221c] flex items-center justify-between text-xs text-[#8c8273]">
          <div>
            Showing <span className="font-bold text-[#f4efe8]">{filtered.length}</span> of{' '}
            <span className="font-bold text-[#f4efe8]">{products.length}</span> inventory items
          </div>
          <div className="flex items-center gap-4">
            <span>
              Total Retail Value:{' '}
              <strong className="font-mono text-[#f5d77f]">
                {settings.currencySymbol} {products.reduce((acc, p) => acc + p.retailPrice * p.stock, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#1a1a20]">
              <div>
                <h3 className="font-semibold text-sm text-[#f5d77f]">
                  {editingProduct ? 'Edit Catalog Product' : 'Add New Stationery Product'}
                </h3>
                <p className="text-[11px] text-[#a89f91]">
                  Automatic SKU & 12-digit barcode generator included
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8271] hover:text-[#f4efe8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Moleskine Classic Hardcover Dotted Journal (A5)"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60"
                  >
                    {categories.map(c => (
                      <option key={c} value={c} className="bg-[#141417] text-[#f4efe8]">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                    Unit of Measurement
                  </label>
                  <input
                    type="text"
                    placeholder="pcs, ream, box, tin, roll"
                    value={formData.unit || ''}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                  />
                </div>
              </div>

              {/* SKU & Barcode with 1-click Auto Generator */}
              <div className="p-3 rounded-xl bg-[#1a1a20] border border-[#26221c] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
                    Product Identification
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoGenerateCodes}
                    className="text-[11px] font-semibold text-[#f5d77f] hover:text-[#d4af37] flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Generate SKU & Barcode</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#8e8271] mb-0.5">SKU *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-2.5 py-1.5 font-mono text-xs font-semibold rounded-lg bg-[#141417] border border-[#2a261f] text-[#f4efe8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8e8271] mb-0.5">Barcode (12-Digit) *</label>
                    <input
                      type="text"
                      required
                      value={formData.barcode || ''}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full px-2.5 py-1.5 font-mono text-xs font-semibold rounded-lg bg-[#141417] border border-[#2a261f] text-[#f4efe8]"
                    />
                  </div>
                </div>

                {formData.barcode && (
                  <div className="pt-2 flex justify-center p-2 rounded-lg bg-white/95">
                    <BarcodeRenderer value={formData.barcode} height={35} fontSize={10} />
                  </div>
                )}
              </div>

              {/* Pricing & Stock Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                    Cost Price ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                    Retail Selling Price ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.retailPrice || ''}
                    onChange={(e) => setFormData({ ...formData, retailPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f5d77f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                    Current Quantity in Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock !== undefined ? formData.stock : ''}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                    Minimum Alert Threshold
                  </label>
                  <div className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#141418] border border-[#2a261f] text-[#a39c90] flex items-center justify-between">
                    <span>System Safety Level:</span>
                    <span className="text-amber-400 font-bold">{LOW_STOCK_THRESHOLD} units (Auto)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Product Description / Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 80gsm high opacity bright white paper for commercial laser printers..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#26221c]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl text-[#a89f91] hover:bg-[#1f1f26]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black shadow-md shadow-[#d4af37]/20"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#1a1a20]">
              <div>
                <h3 className="font-semibold text-sm text-[#f5d77f]">Adjust Inventory Stock</h3>
                <p className="text-[11px] text-[#a89f91] truncate max-w-[260px]">
                  {adjustingProduct.name}
                </p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8271] hover:text-[#f4efe8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="p-5 space-y-3">
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#1a1a20] border border-[#26221c]">
                <span className="text-[#a89f91]">Current Recorded Stock:</span>
                <span className="font-mono font-bold text-sm text-[#d4af37]">
                  {adjustingProduct.stock} {adjustingProduct.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Adjustment Movement Type
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['IN', 'OUT', 'AUDIT', 'RETURN', 'DAMAGE'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAdjustType(t)}
                      className={`py-1.5 rounded-lg font-semibold transition-colors ${
                        adjustType === t
                          ? 'bg-[#d4af37] text-black font-bold shadow-xs'
                          : 'bg-[#1a1a20] text-[#c4bbb0] hover:bg-[#23232b] border border-[#2a261f]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Quantity Count
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4bbb0] mb-1">
                  Reason / Reference Note
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Supplier delivery PO-448, damaged in transit, or physical audit count"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#26221c]">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-3 py-1.5 text-xs rounded-lg text-[#8e8271] hover:text-[#f4efe8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black shadow-md shadow-[#d4af37]/20"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movements Ledger Drawer */}
      {showMovementsDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-[#131316] text-[#f4efe8] p-5 flex flex-col shadow-2xl border-l border-[#26221c]">
            <div className="flex items-center justify-between pb-3 border-b border-[#26221c]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#f5d77f]">
                <History className="w-4 h-4 text-[#d4af37]" />
                <span>Inventory Movements Ledger</span>
              </div>
              <button
                onClick={() => setShowMovementsDrawer(false)}
                className="p-1 rounded-lg text-[#8e8271] hover:text-[#f4efe8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {stockMovements.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#8e8271]">
                  No movement logs recorded yet.
                </div>
              ) : (
                stockMovements.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-[#1a1a20] border border-[#26221c] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate text-[#f4efe8]">{m.productName}</span>
                      <span
                        className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          m.quantityChange > 0
                            ? 'bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/30'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                        }`}
                      >
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8e8271] flex justify-between">
                      <span>Type: {m.type} · By {m.performedBy}</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[11px] text-[#c4bbb0]">
                      {m.reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={(added, updated) => {
          refreshList();
          setSuccessNotification(`Successfully imported ${added} new items and updated ${updated} existing records.`);
          setTimeout(() => setSuccessNotification(null), 6000);
        }}
        onNavigateToBarcodeStudio={onNavigateToBarcodeStudio}
      />

      {/* Product Barcode Preview Modal (Eye button modal) */}
      <ProductBarcodeModal
        isOpen={Boolean(barcodeModalProduct)}
        product={barcodeModalProduct}
        onClose={() => setBarcodeModalProduct(null)}
        onProductUpdated={(updated) => {
          storage.saveProduct(updated);
          refreshList();
          setBarcodeModalProduct(updated);
        }}
        onNavigateToStudio={onNavigateToBarcodeStudio}
      />
    </div>
  );
};
