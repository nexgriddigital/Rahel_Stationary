import React, { useState, useMemo } from 'react';
import { Product, LOW_STOCK_THRESHOLD } from '../types';
import { storage } from '../services/storage';
import { QrCodeRenderer } from '../components/QrCodeRenderer';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import QRCode from 'qrcode';
import {
  QrCode,
  Printer,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  Plus,
  Minus,
  Download,
  Filter,
  Eye,
  X,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Camera,
  Check
} from 'lucide-react';
import jsPDF from 'jspdf';

export const BarcodeStudioView: React.FC = () => {
  // Physical products only (Services require NO inventory and NO QR codes)
  const products = storage.getProducts().filter(p => !p.isService && (p.category as string) !== 'Services');
  const settings = storage.getSettings();

  // Selection mapping: productId -> specific number of copies (0 or undefined = unselected)
  // Default first 4 products selected with realistic copy counts
  const [selectedCopies, setSelectedCopies] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    products.slice(0, 4).forEach((p, idx) => {
      init[p.id] = idx === 0 ? 4 : idx === 1 ? 6 : 2;
    });
    return init;
  });

  // Search filters: General search + Dedicated SKU/Barcode search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [skuBarcodeFilter, setSkuBarcodeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCopiesReviewDrawer, setShowCopiesReviewDrawer] = useState(false);
  const [bulkCopiesInput, setBulkCopiesInput] = useState('3');

  // Label sheet layout configuration
  const [labelLayout, setLabelLayout] = useState<'24_standard' | '30_avery' | 'roll_5030' | 'pen_tag'>('24_standard');
  const [showStoreName, setShowStoreName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(true);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filter products for the inventory table using both general name and dedicated SKU/Barcode search filters
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesName =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase().trim());

      // Dedicated SKU or Barcode filter: strict check on SKU or barcode only
      const matchesSkuBarcode =
        !skuBarcodeFilter.trim() ||
        p.sku.toLowerCase().includes(skuBarcodeFilter.toLowerCase().trim()) ||
        p.barcode.includes(skuBarcodeFilter.trim());

      const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;

      return matchesName && matchesSkuBarcode && matchesCat;
    });
  }, [products, searchTerm, skuBarcodeFilter, categoryFilter]);

  const isAnyFilterActive =
    searchTerm.trim() !== '' ||
    skuBarcodeFilter.trim() !== '' ||
    categoryFilter !== 'All';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSkuBarcodeFilter('');
    setCategoryFilter('All');
  };

  // Total count of checked products
  const selectedProductCount = useMemo(() => {
    return Object.values(selectedCopies).filter((c) => c > 0).length;
  }, [selectedCopies]);

  const areAllFilteredSelected = useMemo(() => {
    if (filteredProducts.length === 0) return false;
    return filteredProducts.every((p) => (selectedCopies[p.id] || 0) > 0);
  }, [filteredProducts, selectedCopies]);

  // Flat list of products expanded by their specific requested copies
  const labelsToRender: Product[] = useMemo(() => {
    const list: Product[] = [];
    products.forEach((p) => {
      const count = selectedCopies[p.id] || 0;
      for (let i = 0; i < count; i++) {
        list.push(p);
      }
    });
    return list;
  }, [products, selectedCopies]);

  const totalCopiesCount = labelsToRender.length;

  const labelsPerSheet =
    labelLayout === '30_avery' ? 30 : labelLayout === '24_standard' ? 24 : labelLayout === 'roll_5030' ? 12 : 40;

  const estimatedSheets = Math.ceil(totalCopiesCount / labelsPerSheet) || 1;

  // Toggle selection checkbox for a product row
  const handleToggleProduct = (productId: string, checked: boolean) => {
    setSelectedCopies((prev) => {
      const next = { ...prev };
      if (checked) {
        next[productId] = next[productId] && next[productId] > 0 ? next[productId] : 1;
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  // Adjust specific number of copies for an individual product
  const handleSetProductCopies = (productId: string, copies: number) => {
    setSelectedCopies((prev) => {
      const next = { ...prev };
      if (copies <= 0) {
        delete next[productId];
      } else {
        next[productId] = Math.min(999, Math.max(1, copies));
      }
      return next;
    });
  };

  // Header checkbox: Toggle all filtered items
  const handleToggleSelectAll = () => {
    if (areAllFilteredSelected) {
      setSelectedCopies((prev) => {
        const next = { ...prev };
        filteredProducts.forEach((p) => {
          delete next[p.id];
        });
        return next;
      });
    } else {
      setSelectedCopies((prev) => {
        const next = { ...prev };
        filteredProducts.forEach((p) => {
          if (!next[p.id] || next[p.id] <= 0) {
            next[p.id] = 1;
          }
        });
        return next;
      });
    }
  };

  // Apply a specific number of copies to all currently selected items
  const handleApplyBulkCopies = (count: number) => {
    if (count <= 0) return;
    setSelectedCopies((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = count;
      });
      return next;
    });
  };

  // Match copies to each product's current stock count
  const handleMatchStockCount = () => {
    setSelectedCopies((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const prod = products.find((p) => p.id === id);
        if (prod) {
          next[id] = Math.min(200, Math.max(1, prod.stock));
        }
      });
      return next;
    });
  };

  // Select only low stock products with copies matching shortage
  const handleSelectLowStock = () => {
    const next: Record<string, number> = {};
    products
      .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
      .forEach((p) => {
        next[p.id] = Math.max(2, LOW_STOCK_THRESHOLD - p.stock + 1);
      });
    setSelectedCopies(next);
  };

  const handleClearAll = () => {
    setSelectedCopies({});
    setShowCopiesReviewDrawer(false);
  };

  // Print execution: applies styles from #barcode-sheet-printable in index.css
  const handlePrintSelectedBatch = () => {
    window.print();
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const cols = labelLayout === 'roll_5030' ? 2 : labelLayout === 'pen_tag' ? 4 : 3;
      const labelW = cols === 2 ? 85 : cols === 4 ? 45 : 64;
      const labelH = cols === 4 ? 26 : 38;
      const startX = 8;
      const startY = 10;
      const gapX = 4;
      const gapY = 4;

      let currentX = startX;
      let currentY = startY;
      let colIdx = 0;

      for (let index = 0; index < labelsToRender.length; index++) {
        const prod = labelsToRender[index];
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([1, 1], 0);
        doc.rect(currentX, currentY, labelW, labelH);

        if (showStoreName) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(80, 80, 80);
          doc.text(settings.storeName.toUpperCase(), currentX + labelW / 2, currentY + 3.5, { align: 'center' });
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(0, 0, 0);
        const nameShort = prod.name.length > 28 ? prod.name.substring(0, 26) + '...' : prod.name;
        doc.text(nameShort, currentX + labelW / 2, currentY + (showStoreName ? 7 : 5), { align: 'center' });

        const qrVal = (prod.qrCode || prod.sku || `QR-${prod.id}`).trim();
        try {
          const qrDataUrl = await QRCode.toDataURL(qrVal, {
            width: 160,
            margin: 1,
            errorCorrectionLevel: 'M'
          });
          const qrSize = cols === 4 ? 12 : 16;
          doc.addImage(qrDataUrl, 'PNG', currentX + (labelW - qrSize) / 2, currentY + (showStoreName ? 8.5 : 6.5), qrSize, qrSize);
        } catch (e) {
          console.warn('QR data url generation failed for PDF', e);
        }

        doc.setFont('courier', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(50, 50, 50);
        doc.text(qrVal, currentX + labelW / 2, currentY + labelH - 5.5, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(60, 60, 60);
        if (showSku) {
          doc.text(`SKU: ${prod.sku}`, currentX + 2.5, currentY + labelH - 2);
        }
        if (showPrice) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(0, 0, 0);
          doc.text(`${settings.currencySymbol || 'ETB'} ${prod.retailPrice.toFixed(2)}`, currentX + labelW - 2.5, currentY + labelH - 2, { align: 'right' });
        }

        colIdx++;
        if (colIdx >= cols) {
          colIdx = 0;
          currentX = startX;
          currentY += labelH + gapY;

          if (currentY + labelH > 280 && index < labelsToRender.length - 1) {
            doc.addPage();
            currentY = startY;
          }
        } else {
          currentX += labelW + gapX;
        }
      }

      doc.save(`QR-Code-Batch-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export error', err);
      window.print();
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 overflow-hidden bg-[#0a0a0c] text-[#f4efe8] relative">
      {/* Top Banner & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26221c]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#f5d77f]">
              QR Code Studio & Label Generator
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/30">
              High-Density QR Engine
            </span>
          </div>
          <p className="text-xs text-[#a89f91]">
            Locate items using the dedicated SKU/QR Code ID filter, set copy counts, and trigger batch label printing.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-[#141417] border border-[#26221c] text-xs">
            <span className="text-[#a89f91]">Total Copies: </span>
            <strong className="font-mono font-bold text-[#f5d77f]">
              {totalCopiesCount} labels
            </strong>
            <span className="text-[11px] text-[#8e8271]">
              {' '}({selectedProductCount} items · ~{estimatedSheets} {estimatedSheets === 1 ? 'sheet' : 'sheets'})
            </span>
          </div>

          <button
            onClick={() => setShowPreviewModal(true)}
            disabled={totalCopiesCount === 0}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#202026] text-[#c4bbb0] hover:text-[#f4efe8] border border-[#26221c] disabled:opacity-40 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={totalCopiesCount === 0}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#202026] text-[#c4bbb0] hover:text-[#f4efe8] border border-[#26221c] disabled:opacity-40 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Control Strip: General Search, DEDICATED SKU/QR Search Filter, Category, Bulk Copies, and Template */}
      <div className="py-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-[#26221c]">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[320px]">
          {/* 1. General Product Name Search */}
          <div className="relative flex-1 min-w-[170px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8271]" />
            <input
              type="text"
              placeholder="Search product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#141417] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
            />
          </div>

          {/* 2. DEDICATED SEARCH FILTER SPECIFICALLY FOR SKU OR QR CODE */}
          <div className="relative flex-1 min-w-[230px]">
            <QrCode className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#d4af37]" />
            <input
              type="text"
              placeholder="Search specifically by SKU / QR Code ID..."
              value={skuBarcodeFilter}
              onChange={(e) => setSkuBarcodeFilter(e.target.value)}
              className="w-full pl-9 pr-14 py-1.5 text-xs font-mono rounded-xl bg-[#141417] border border-[#d4af37]/40 text-[#f4efe8] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 placeholder:text-[#8e8271] shadow-2xs"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {skuBarcodeFilter && (
                <button
                  type="button"
                  onClick={() => setSkuBarcodeFilter('')}
                  className="p-1 rounded text-[#8e8271] hover:text-[#f4efe8] transition-colors cursor-pointer"
                  title="Clear SKU/QR Code search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="p-1 rounded-lg text-[#d4af37] hover:bg-[#d4af37]/15 transition-colors cursor-pointer"
                title="Scan QR code with camera to filter instantly (F4)"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. Category Filter Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-[#141417] border border-[#2a261f] text-[#f4efe8] focus:outline-none max-w-[130px] truncate"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-[#141417] text-[#f4efe8]">{c}</option>
            ))}
          </select>

          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#1a1a20] hover:bg-[#22222a] text-[#d4af37] border border-[#2a261f] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Reset all search and category filters"
            >
              <RotateCcw className="w-3 h-3 text-[#d4af37]" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Layout Template Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#a89f91] hidden sm:inline">
            Template:
          </span>
          <select
            value={labelLayout}
            onChange={(e) => setLabelLayout(e.target.value as typeof labelLayout)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-[#141417] border border-[#2a261f] text-[#f4efe8]"
          >
            <option value="24_standard" className="bg-[#141417] text-[#f4efe8]">24-Up A4 (70 x 37mm)</option>
            <option value="30_avery" className="bg-[#141417] text-[#f4efe8]">30-Up Avery (1&quot; x 2-5/8&quot;)</option>
            <option value="roll_5030" className="bg-[#141417] text-[#f4efe8]">Thermal Roll (50 x 30mm)</option>
            <option value="pen_tag" className="bg-[#141417] text-[#f4efe8]">Pen / Jewelry Mini Tag</option>
          </select>
        </div>

        {/* Bulk Copies Tool */}
        <div className="flex items-center gap-1.5 text-xs bg-[#141417] p-1 rounded-xl border border-[#26221c]">
          <span className="text-[11px] font-semibold text-[#a89f91] pl-1">
            Set all checked:
          </span>
          <input
            type="number"
            min="1"
            max="100"
            value={bulkCopiesInput}
            onChange={(e) => setBulkCopiesInput(e.target.value)}
            className="w-10 text-center font-mono font-bold text-xs py-0.5 rounded bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8]"
          />
          <button
            type="button"
            onClick={() => handleApplyBulkCopies(parseInt(bulkCopiesInput, 10) || 1)}
            disabled={selectedProductCount === 0}
            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 disabled:opacity-40 text-black transition-colors"
          >
            Apply Copies
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={handleMatchStockCount}
            title="Set copies equal to in-stock quantity for each checked item"
            className="px-2.5 py-1 rounded-lg font-semibold bg-[#141417] text-[#c4bbb0] border border-[#26221c] hover:text-[#f4efe8] hover:bg-[#1f1f26] transition-colors"
          >
            Match Stock Count
          </button>

          <button
            type="button"
            onClick={handleSelectLowStock}
            className="px-2.5 py-1 rounded-lg font-semibold bg-amber-950/50 text-amber-300 border border-amber-800/40 hover:bg-amber-900/40 flex items-center gap-1 transition-colors"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Low Stock</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1 rounded-lg font-semibold text-rose-400 hover:underline transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Active SKU/QR Code ID Filter Alert Banner */}
      {skuBarcodeFilter.trim() && (
        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-xs flex items-center justify-between text-[#f5d77f]">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#d4af37]" />
            <span>
              Filtering specifically by SKU/QR Code ID: <strong className="font-mono">&ldquo;{skuBarcodeFilter}&rdquo;</strong>
              {' '}({filteredProducts.length} matching {filteredProducts.length === 1 ? 'item' : 'items'} found)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {filteredProducts.length === 1 && (
              <button
                type="button"
                onClick={() => {
                  const p = filteredProducts[0];
                  handleSetProductCopies(p.id, (selectedCopies[p.id] || 0) + 1);
                }}
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#d4af37] text-black hover:brightness-110 flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add 1 Copy of {filteredProducts[0].sku}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold hover:underline text-[#d4af37] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-[#d4af37]" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Inventory Product Rows Table */}
      <div className="flex-1 mt-3 rounded-2xl border border-[#26221c] bg-[#141417] overflow-hidden flex flex-col shadow-2xs">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#1a1a20] text-[#a89f91] font-medium border-b border-[#26221c] z-10">
              <tr>
                <th className="py-2.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={areAllFilteredSelected}
                    onChange={handleToggleSelectAll}
                    title="Select / Deselect All Filtered Items"
                    className="w-4 h-4 rounded text-[#d4af37] focus:ring-[#d4af37] cursor-pointer accent-[#d4af37]"
                  />
                </th>
                <th className="py-2.5 px-3">Product Name & Category</th>
                <th className="py-2.5 px-3 font-mono">
                  <span className="flex items-center gap-1">
                    <span>SKU</span>
                    {skuBarcodeFilter && <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />}
                  </span>
                </th>
                <th className="py-2.5 px-3 font-mono">
                  <span className="flex items-center gap-1">
                    <span>QR Code ID</span>
                    {skuBarcodeFilter && <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />}
                  </span>
                </th>
                <th className="py-2.5 px-3 text-right">In Stock</th>
                <th className="py-2.5 px-3 text-right">Retail Price</th>
                <th className="py-2.5 px-4 text-center w-52 font-semibold text-[#f5d77f]">
                  Label Copies to Print
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26221c] text-[#f4efe8]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#8b7d6f]">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <QrCode className="w-8 h-8 opacity-40 text-[#d4af37]" />
                      <div className="font-semibold text-xs text-[#c4bbb0]">No products match filter criteria</div>
                      <p className="text-[11px] text-[#7d7465]">
                        {skuBarcodeFilter
                          ? `No inventory items match the SKU or QR Code ID "${skuBarcodeFilter}".`
                          : 'No stationery products match the active search or category filters.'}
                      </p>
                      {isAnyFilterActive && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1e1e24] text-[#f5d77f] border border-[#d4af37]/40 hover:bg-[#d4af37]/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset All Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const copies = selectedCopies[prod.id] || 0;
                  const isSelected = copies > 0;
                  const isLow = prod.stock <= LOW_STOCK_THRESHOLD;

                  // Highlight if specifically matched by the SKU/Barcode filter
                  const isSkuMatch =
                    skuBarcodeFilter &&
                    prod.sku.toLowerCase().includes(skuBarcodeFilter.toLowerCase());
                  const isBarcodeMatch =
                    skuBarcodeFilter &&
                    ((prod.qrCode && prod.qrCode.toLowerCase().includes(skuBarcodeFilter.toLowerCase().trim())) ||
                      (prod.barcode && prod.barcode.includes(skuBarcodeFilter.trim())));

                  return (
                    <tr
                      key={prod.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-[#d4af37]/10'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Selection Checkbox for each product row */}
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleProduct(prod.id, e.target.checked)}
                          className="w-4 h-4 rounded text-[#d4af37] focus:ring-[#d4af37] cursor-pointer accent-[#d4af37]"
                        />
                      </td>

                      {/* Product Name & Category */}
                      <td className="py-2.5 px-3">
                        <div
                          onClick={() => handleToggleProduct(prod.id, !isSelected)}
                          className="cursor-pointer select-none"
                        >
                          <div className="font-semibold text-xs text-[#f4efe8]">
                            {prod.name}
                          </div>
                          <div className="text-[10px] text-[#998b7a]">
                            {prod.category} {prod.description ? `· ${prod.description}` : ''}
                          </div>
                        </div>
                      </td>

                      {/* SKU (with highlight if matched) */}
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <span
                          className={
                            isSkuMatch
                              ? 'bg-[#d4af37]/25 text-[#f5d77f] px-1.5 py-0.5 rounded font-bold border border-[#d4af37]/40'
                              : 'text-[#c4bbb0]'
                          }
                        >
                          {prod.sku}
                        </span>
                      </td>

                      {/* QR Code ID (with highlight if matched) */}
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <span
                          className={
                            isBarcodeMatch
                              ? 'bg-[#d4af37]/25 text-[#f5d77f] px-1.5 py-0.5 rounded font-bold border border-[#d4af37]/40'
                              : 'text-[#e6ca65] font-semibold'
                          }
                        >
                          {prod.qrCode || prod.sku}
                        </span>
                      </td>

                      {/* In Stock */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        <div className="flex items-center justify-end gap-1">
                          <span className={isLow ? 'text-amber-400 font-bold' : 'text-[#f4efe8]'}>
                            {prod.stock} {prod.unit}
                          </span>
                          {isLow && (
                            <span
                              title={`Low stock alert (${LOW_STOCK_THRESHOLD} threshold)`}
                              className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                            />
                          )}
                        </div>
                      </td>

                      {/* Retail Price */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#f5d77f]">
                        {settings.currencySymbol} {prod.retailPrice.toFixed(2)}
                      </td>

                      {/* Specific Label Copies Stepper & Quick Set */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Stepper buttons */}
                          <button
                            type="button"
                            onClick={() => handleSetProductCopies(prod.id, Math.max(0, copies - 1))}
                            disabled={!isSelected}
                            title="Decrease copies"
                            className="w-6 h-6 rounded-md flex items-center justify-center bg-[#1a1714] border border-[#26221c] text-[#c4bbb0] hover:text-[#f5d77f] hover:border-[#d4af37]/40 disabled:opacity-30 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          {/* Specific number of copies input */}
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="999"
                              value={copies}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                handleSetProductCopies(prod.id, isNaN(val) ? 0 : val);
                              }}
                              className={`w-14 text-center font-mono font-bold text-xs py-1 rounded-md border transition-all ${
                                isSelected
                                  ? 'border-[#d4af37]/60 bg-[#141417] text-[#f5d77f] ring-1 ring-[#d4af37]/30'
                                  : 'border-[#26221c] bg-[#101012] text-[#736657]'
                              }`}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSetProductCopies(prod.id, copies + 1)}
                            title="Increase copies"
                            className="w-6 h-6 rounded-md flex items-center justify-center bg-[#1a1714] border border-[#26221c] text-[#c4bbb0] hover:text-[#f5d77f] hover:border-[#d4af37]/40 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          {/* Quick preset for this row */}
                          <button
                            type="button"
                            onClick={() => handleSetProductCopies(prod.id, Math.max(1, prod.stock))}
                            title={`Set copies to match in-stock count (${prod.stock})`}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#1a1714] border border-[#26221c] text-[#998b7a] hover:text-[#f5d77f] hover:border-[#d4af37]/40 transition-colors"
                          >
                            ={prod.stock}
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

        {/* Table Footer Meta */}
        <div className="p-3 bg-[#141417] border-t border-[#26221c] flex items-center justify-between text-xs text-[#998b7a]">
          <div>
            Showing <strong className="text-[#f4efe8]">{filteredProducts.length}</strong> items ·{' '}
            <strong className="text-[#f5d77f]">{selectedProductCount}</strong> products selected
          </div>
          <div>
            Print template: <strong className="capitalize text-[#f4efe8]">{labelLayout.replace('_', ' ')}</strong> ({labelsPerSheet} per sheet)
          </div>
        </div>
      </div>

      {/* Floating 'Print Selected Batch' Action Button & Review Drawer */}
      {selectedProductCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="relative">
            {/* Copies Review Popover Dropdown */}
            {showCopiesReviewDrawer && (
              <div className="absolute bottom-full right-0 mb-3 w-80 max-h-80 rounded-2xl bg-[#141417] border border-[#26221c] shadow-2xl p-3 flex flex-col text-xs z-50 animate-in fade-in zoom-in-95 text-[#f4efe8]">
                <div className="flex items-center justify-between pb-2 border-b border-[#26221c]">
                  <span className="font-bold text-[#f5d77f]">
                    Review Copies per Product
                  </span>
                  <button
                    onClick={() => setShowCopiesReviewDrawer(false)}
                    className="p-1 rounded text-[#998b7a] hover:text-[#f4efe8]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-[#26221c] py-1">
                  {Object.entries(selectedCopies)
                    .filter(([, qty]) => qty > 0)
                    .map(([id, qty]) => {
                      const prod = products.find((p) => p.id === id);
                      if (!prod) return null;
                      return (
                        <div key={id} className="py-1.5 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate text-[11px] text-[#f4efe8]">{prod.name}</div>
                            <div className="text-[10px] text-[#998b7a] font-mono">
                              SKU: {prod.sku} · {settings.currencySymbol} {prod.retailPrice.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={qty}
                              onChange={(e) =>
                                handleSetProductCopies(id, parseInt(e.target.value, 10) || 1)
                              }
                              className="w-12 text-center font-mono font-bold text-xs py-0.5 rounded border border-[#26221c] bg-[#1a1714] text-[#f5d77f] focus:border-[#d4af37]"
                            />
                            <span className="text-[10px] text-[#998b7a]">copies</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="pt-2 border-t border-[#26221c] flex items-center justify-between font-mono font-bold text-xs">
                  <span className="text-[#998b7a]">Total Copies:</span>
                  <span className="text-[#f5d77f]">{totalCopiesCount} stickers</span>
                </div>
              </div>
            )}

            {/* Main Floating Action Pill */}
            <div className="p-2 pl-4 rounded-2xl bg-[#141417]/95 backdrop-blur-md border border-[#d4af37]/40 shadow-2xl flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCopiesReviewDrawer(!showCopiesReviewDrawer)}
                className="text-left cursor-pointer group select-none"
              >
                <div className="flex items-center gap-1 font-bold text-xs text-[#f5d77f]">
                  <span>{selectedProductCount} items selected</span>
                  {showCopiesReviewDrawer ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#d4af37]" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-[#d4af37]" />
                  )}
                </div>
                <div className="text-[10px] text-[#998b7a] font-mono group-hover:text-[#f5d77f] transition-colors">
                  {totalCopiesCount} copies queued · Click to review
                </div>
              </button>

              <button
                onClick={handlePrintSelectedBatch}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] hover:to-[#b88c14] text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.25)] transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-black" />
                <span>Print Selected Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVISIBLE CONTAINER with ID 'barcode-sheet-printable' to facilitate browser printing */}
      {/* Renders exact number of copies for each checked item with jsbarcode */}
      <div
        id="barcode-sheet-printable"
        className="fixed -left-[99999px] top-0 opacity-0 pointer-events-none print:opacity-100 print:left-0 print:pointer-events-auto print:static print:w-full bg-white text-black"
      >
        <div
          className={`grid gap-2.5 ${
            labelLayout === '30_avery'
              ? 'grid-cols-3'
              : labelLayout === '24_standard'
              ? 'grid-cols-3'
              : labelLayout === 'roll_5030'
              ? 'grid-cols-2'
              : 'grid-cols-4'
          }`}
        >
          {labelsToRender.map((prod, idx) => (
            <div
              key={idx}
              className="barcode-label-card border border-dashed border-slate-300 p-2 rounded flex flex-col items-center justify-between text-center bg-white min-h-[95px] relative"
            >
              {showStoreName && (
                <div className="text-[8px] font-bold uppercase tracking-wider text-slate-600 truncate max-w-full">
                  {settings.storeName}
                </div>
              )}

              <div className="text-[9px] font-bold line-clamp-1 leading-tight text-black w-full px-1">
                {prod.name}
              </div>

              {/* QR Code generated using the qrcode library */}
              <div className="my-1">
                <QrCodeRenderer
                  value={prod.qrCode || prod.sku || `QR-${prod.id}`}
                  size={64}
                  displayValue={false}
                  className="bg-transparent shadow-none p-0"
                />
              </div>

              <div className="text-[7.5px] font-mono font-bold text-slate-700 tracking-tight">
                {prod.qrCode || prod.sku}
              </div>

              <div className="w-full flex items-center justify-between text-[8px] font-mono px-1 pt-0.5">
                {showSku && (
                  <span className="text-slate-600 truncate max-w-[100px]">
                    {prod.sku}
                  </span>
                )}
                {showPrice && (
                  <span className="font-bold text-[10px] text-black shrink-0 ml-auto">
                    {settings.currencySymbol} {prod.retailPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Preview Modal (allows previewing before printing if desired) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#18181c]">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#d4af37]" />
                <h3 className="font-semibold text-sm text-[#f4efe8]">
                  Batch Sheet Preview ({totalCopiesCount} label copies queued)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSelectedBatch}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] hover:to-[#b88c14] text-black flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-black" />
                  <span>Print Selected Batch</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-lg text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0c] flex justify-center">
              <div className="w-full max-w-[800px] bg-white p-6 shadow-2xl rounded-sm text-black">
                <div
                  className={`grid gap-2.5 ${
                    labelLayout === '30_avery'
                      ? 'grid-cols-3'
                      : labelLayout === '24_standard'
                      ? 'grid-cols-3'
                      : labelLayout === 'roll_5030'
                      ? 'grid-cols-2'
                      : 'grid-cols-4'
                  }`}
                >
                  {labelsToRender.map((prod, idx) => (
                    <div
                      key={idx}
                      className="border border-dashed border-slate-300 p-2 rounded flex flex-col items-center justify-between text-center bg-white min-h-[95px]"
                    >
                      {showStoreName && (
                        <div className="text-[8px] font-bold uppercase tracking-wider text-slate-600 truncate max-w-full">
                          {settings.storeName}
                        </div>
                      )}
                      <div className="text-[9px] font-bold line-clamp-1 leading-tight text-black w-full px-1">
                        {prod.name}
                      </div>
                      <div className="my-1">
                        <QrCodeRenderer
                          value={prod.qrCode || prod.sku || `QR-${prod.id}`}
                          size={64}
                          displayValue={false}
                          className="bg-transparent shadow-none p-0"
                        />
                      </div>
                      <div className="text-[7.5px] font-mono font-bold text-slate-700 tracking-tight">
                        {prod.qrCode || prod.sku}
                      </div>
                      <div className="w-full flex items-center justify-between text-[8px] font-mono px-1 pt-0.5">
                        {showSku && <span className="text-slate-600 truncate max-w-[100px]">{prod.sku}</span>}
                        {showPrice && <span className="font-bold text-[10px] text-black ml-auto">{settings.currencySymbol} {prod.retailPrice.toFixed(2)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal to scan directly into the SKU/Barcode search filter */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedCode) => {
          setSkuBarcodeFilter(scannedCode);
          setIsScannerOpen(false);
        }}
      />
    </div>
  );
};
