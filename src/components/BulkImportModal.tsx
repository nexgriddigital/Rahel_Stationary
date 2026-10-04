import React, { useState, useRef, useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { storage } from '../services/storage';
import { downloadExcelImportTemplate } from '../services/excelTemplateGenerator';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Sparkles,
  ClipboardList,
  Trash2,
  ArrowRight,
  RefreshCw,
  Printer,
  Check,
  AlertCircle,
  FileType,
  Info,
  SlidersHorizontal,
  ShieldAlert,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';

// Setup PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
} catch (err) {
  console.warn('PDF.js worker initialization notice', err);
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number, updatedCount: number) => void;
  onNavigateToBarcodeStudio?: (productIds: string[]) => void;
}

export type SkuValidationStatus =
  | 'existing_match'    // Matches an existing product SKU in the store catalog
  | 'new_sku'           // Brand new unique SKU ready to add
  | 'duplicate_in_file' // Same SKU appears multiple times within this uploaded file
  | 'auto_generated'    // SKU was missing in the file and auto-generated
  | 'invalid';          // Missing required fields like item title

export interface ParsedImportRow {
  id: string;
  name: string;
  category: ProductCategory;
  sku: string;
  originalSku: string;
  barcode: string;
  costPrice: number;
  retailPrice: number;
  stock: number;
  minThreshold: number;
  unit: string;
  description: string;
  selected: boolean;
  status: 'new' | 'update' | 'invalid';
  skuStatus: SkuValidationStatus;
  existingMatch?: Product;
  errors: string[];
}

const VALID_CATEGORIES: ProductCategory[] = [
  'Writing & Pens',
  'Paper & Notebooks',
  'Printing & Copying',
  'Art & Craft',
  'Desk & Office',
  'Binding & Lamination',
  'Packaging & Envelopes',
  'Custom Stamps & Signs'
];

// Curated supplier starter sample batches
const SAMPLE_CATALOGS = [
  {
    id: 'artist_fine_writing',
    title: 'Fine Art & Premium Writing',
    badge: '10 Items · Pens & Pads',
    description: 'Artist-grade fineliners, watercolor brushes, sketchbooks, and calligraphy inks.',
    items: [
      {
        name: 'Sakura Pigma Micron 05 Fineliner Black',
        category: 'Writing & Pens',
        sku: 'PEN-SAKU-05B',
        barcode: '890334810101',
        costPrice: 2.10,
        retailPrice: 4.50,
        stock: 45,
        minThreshold: 10,
        unit: 'pcs',
        description: 'Archival waterproof pigment ink 0.45mm tip for technical drawing.'
      },
      {
        name: 'Tombow Dual Brush Pen Pastel 6-Color Set',
        category: 'Art & Craft',
        sku: 'ART-TOMB-6PS',
        barcode: '890334810102',
        costPrice: 10.50,
        retailPrice: 19.99,
        stock: 20,
        minThreshold: 5,
        unit: 'pack',
        description: 'Flexible brush tip & fine bullet tip blendable water-based markers.'
      },
      {
        name: 'Strathmore 400 Series Mixed Media Pad (9x12 in, 15 Sheets)',
        category: 'Paper & Notebooks',
        sku: 'PPR-STR4-912',
        barcode: '890334810103',
        costPrice: 8.20,
        retailPrice: 15.50,
        stock: 30,
        minThreshold: 8,
        unit: 'pad',
        description: 'Heavyweight 300gsm vellum surface paper for wet and dry media.'
      },
      {
        name: 'Faber-Castell 9000 Graphite Pencil Art Set (12 Grades)',
        category: 'Writing & Pens',
        sku: 'PEN-FB90-12G',
        barcode: '890334810104',
        costPrice: 7.90,
        retailPrice: 14.99,
        stock: 25,
        minThreshold: 6,
        unit: 'box',
        description: 'Finest quality artists graphite pencils from 8B to 2H in metal tin.'
      },
      {
        name: 'A4 Double A Copier Paper (80gsm, 500 Sheets)', // Matches existing product!
        category: 'Paper & Notebooks',
        sku: 'PPR-A4-80G',
        barcode: '890123456001',
        costPrice: 4.50,
        retailPrice: 7.99,
        stock: 50,
        minThreshold: 15,
        unit: 'ream',
        description: 'Replenishment shipment of premium multi-purpose copier paper.'
      },
      {
        name: 'Winsor & Newton Drawing Ink 14ml Black Indian',
        category: 'Art & Craft',
        sku: 'ART-WNDI-14B',
        barcode: '890334810105',
        costPrice: 4.80,
        retailPrice: 8.95,
        stock: 18,
        minThreshold: 4,
        unit: 'bottle',
        description: 'Fast drying water resistant shellac-based calligraphy ink.'
      },
      {
        name: 'Kneaded Eraser Large Grey with Storage Case',
        category: 'Art & Craft',
        sku: 'ART-KNED-LRG',
        barcode: '890334810106',
        costPrice: 0.90,
        retailPrice: 2.25,
        stock: 60,
        minThreshold: 15,
        unit: 'pcs',
        description: 'Soft pliable putty eraser for charcoal, pastel, and graphite lifting.'
      },
      {
        name: 'Rhodia Webnotebook A5 Dot Grid (Black Hardcover)',
        category: 'Paper & Notebooks',
        sku: 'PPR-RHDW-A5D',
        barcode: '890334810107',
        costPrice: 13.00,
        retailPrice: 24.50,
        stock: 22,
        minThreshold: 5,
        unit: 'pcs',
        description: 'Smooth 90gsm Clairefontaine ivory paper with ribbon marker & elastic closure.'
      }
    ]
  },
  {
    id: 'print_shop_consumables',
    title: 'Print Shop & Binding Supplies',
    badge: '8 Items · Paper & Binding',
    description: 'High-speed printer paper, binding combs, thermal rolls, and laminate pouches.',
    items: [
      {
        name: 'Thermal Till Receipt Paper Rolls 80x80mm (Box of 24)',
        category: 'Printing & Copying',
        sku: 'PRN-THRM-808',
        barcode: '890445910201',
        costPrice: 16.50,
        retailPrice: 29.90,
        stock: 35,
        minThreshold: 8,
        unit: 'box',
        description: 'BPA-free high sensitivity thermal paper for standard 80mm POS receipt printers.'
      },
      {
        name: 'Glossy Cast Coated Photo Paper A4 230gsm (100 Sheets)',
        category: 'Printing & Copying',
        sku: 'PRN-GLSP-A42',
        barcode: '890445910202',
        costPrice: 7.80,
        retailPrice: 14.50,
        stock: 40,
        minThreshold: 10,
        unit: 'pack',
        description: 'Instant dry high gloss photo paper for vivid color inkjet printing.'
      },
      {
        name: 'Plastic Comb Binding Spines 12mm Black (Pack of 100)',
        category: 'Binding & Lamination',
        sku: 'BND-COMB-12B',
        barcode: '890445910203',
        costPrice: 6.20,
        retailPrice: 11.95,
        stock: 28,
        minThreshold: 6,
        unit: 'pack',
        description: '21-ring plastic binding coils holding up to 85 standard sheets.'
      },
      {
        name: 'Thermal Lamination Pouches A4 80 Micron (Pack of 100)',
        category: 'Binding & Lamination',
        sku: 'BND-LAM8-A41',
        barcode: '890445910204',
        costPrice: 8.50,
        retailPrice: 16.00,
        stock: 32,
        minThreshold: 8,
        unit: 'pack',
        description: 'Crystal clear gloss laminating film for document and certificate protection.'
      },
      {
        name: 'Clear PVC Binding Presentation Covers A4 (Pack of 100)',
        category: 'Binding & Lamination',
        sku: 'BND-PVCV-A41',
        barcode: '890445910205',
        costPrice: 7.20,
        retailPrice: 13.50,
        stock: 24,
        minThreshold: 5,
        unit: 'pack',
        description: 'Transparent 200 micron PVC protective report front covers.'
      },
      {
        name: 'Canon GI-71 Genuine Refill Ink Bottle - Cyan (70ml)',
        category: 'Printing & Copying',
        sku: 'PRN-CN71-CYN',
        barcode: '890445910206',
        costPrice: 9.10,
        retailPrice: 15.50,
        stock: 18,
        minThreshold: 5,
        unit: 'bottle',
        description: 'High yield dye ink for Canon Pixma G series ink tank printers.'
      }
    ]
  }
];

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNavigateToBarcodeStudio
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [fileTypeDetected, setFileTypeDetected] = useState<'excel' | 'pdf' | 'csv' | 'json' | null>(null);

  // Excel Multi-Sheet selection
  const [workbookSheets, setWorkbookSheets] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const rawWorkbookRef = useRef<XLSX.WorkBook | null>(null);

  // PDF Text Inspector state
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [pdfExtractedText, setPdfExtractedText] = useState<string>('');
  const [showPdfInspector, setShowPdfInspector] = useState(false);

  // SKU Duplicate Resolution Policy:
  // update = replenish incoming stock + update prices
  // overwrite_stock = replace current stock with incoming stock
  // skip = keep current item untouched
  // generate_new = create a new unique SKU for this item
  const [duplicateMode, setDuplicateMode] = useState<'update' | 'overwrite_stock' | 'skip' | 'generate_new'>('update');

  // Parsed Items
  const [parsedItems, setParsedItems] = useState<ParsedImportRow[]>([]);
  const [excludedExamplesCount, setExcludedExamplesCount] = useState<number>(0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isExecutingImport, setIsExecutingImport] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Filter in preview table: all | existing_sku | new_sku | duplicates | invalid
  const [previewFilter, setPreviewFilter] = useState<'all' | 'existing_sku' | 'new_sku' | 'duplicates' | 'invalid'>('all');
  const [previewSearch, setPreviewSearch] = useState('');

  // Results State
  const [importResult, setImportResult] = useState<{
    added: number;
    updated: number;
    skipped: number;
    importedIds: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const settings = storage.getSettings();

  // Map category intelligently
  const normalizeCategory = (inputCat: string): ProductCategory => {
    const raw = (inputCat || '').trim().toLowerCase();
    if (raw.includes('pen') || raw.includes('pencil') || raw.includes('marker') || raw.includes('writing')) {
      return 'Writing & Pens';
    }
    if (raw.includes('notebook') || raw.includes('paper') || raw.includes('pad') || raw.includes('ream') || raw.includes('sketch')) {
      return 'Paper & Notebooks';
    }
    if (raw.includes('print') || raw.includes('copy') || raw.includes('toner') || raw.includes('ink') || raw.includes('thermal')) {
      return 'Printing & Copying';
    }
    if (raw.includes('art') || raw.includes('craft') || raw.includes('color') || raw.includes('paint') || raw.includes('canvas')) {
      return 'Art & Craft';
    }
    if (raw.includes('desk') || raw.includes('office') || raw.includes('staple') || raw.includes('tape') || raw.includes('clip') || raw.includes('scissor')) {
      return 'Desk & Office';
    }
    if (raw.includes('bind') || raw.includes('laminat') || raw.includes('comb') || raw.includes('pouch') || raw.includes('coil')) {
      return 'Binding & Lamination';
    }
    if (raw.includes('packag') || raw.includes('envelope') || raw.includes('mailer') || raw.includes('box') || raw.includes('bubble')) {
      return 'Packaging & Envelopes';
    }
    if (raw.includes('stamp') || raw.includes('sign') || raw.includes('ink pad') || raw.includes('emboss')) {
      return 'Custom Stamps & Signs';
    }
    const found = VALID_CATEGORIES.find(c => c.toLowerCase() === raw);
    return found || 'Paper & Notebooks';
  };

  /**
   * Core Validation Engine:
   * 1. Checks for existing SKUs in the current store inventory (storage.getProducts()).
   * 2. Checks for internal duplicate SKUs within the imported file itself.
   * 3. Validates required names, positive prices, non-negative stocks.
   * 4. Flags each row with explicit skuStatus.
   */
  const processRawRows = (rows: Array<Record<string, any>>, sourceName?: string) => {
    const existingProducts = storage.getProducts();
    if (sourceName) setSelectedFileName(sourceName);

    // Track occurrences within this batch to catch in-file duplicate SKUs and Barcodes
    const skuOccurrenceMap: Record<string, number> = {};
    const barcodeOccurrenceMap: Record<string, number> = {};

    // 1. Detect and filter out template example rows so they are not accidentally imported
    let exampleCount = 0;
    const realRows = rows.filter(row => {
      const name = String(
        row['Product Name'] ||
        row['product_name'] ||
        row['item_name'] ||
        row.name ||
        row.title ||
        row.product ||
        row.item ||
        ''
      ).trim();

      const sku = String(
        row['SKU'] ||
        row.sku ||
        row.code ||
        row.item_code ||
        row.product_code ||
        ''
      ).trim();

      if (
        name.startsWith('[EXAMPLE]') ||
        name.toLowerCase().includes('[example]') ||
        sku.toLowerCase().startsWith('[example]')
      ) {
        exampleCount++;
        return false;
      }
      return true;
    });

    setExcludedExamplesCount(exampleCount);

    realRows.forEach(row => {
      const rawSku = String(
        row['SKU'] ||
        row.sku ||
        row.code ||
        row.item_code ||
        row.product_code ||
        ''
      ).trim().toLowerCase();

      if (rawSku) {
        skuOccurrenceMap[rawSku] = (skuOccurrenceMap[rawSku] || 0) + 1;
      }

      const rawBarcode = String(
        row['Barcode'] ||
        row.barcode ||
        row.upc ||
        row.ean ||
        row.barcode_number ||
        ''
      ).trim();

      if (rawBarcode) {
        barcodeOccurrenceMap[rawBarcode] = (barcodeOccurrenceMap[rawBarcode] || 0) + 1;
      }
    });

    const parsed: ParsedImportRow[] = realRows.map((row, idx) => {
      const errors: string[] = [];

      // Support standardized Excel template headers and common aliases
      const name = String(
        row['Product Name'] ||
        row['product_name'] ||
        row['item_name'] ||
        row.name ||
        row.title ||
        row.product ||
        row.item ||
        ''
      ).trim();

      const rawCategory = String(
        row['Category'] ||
        row.category ||
        row.cat ||
        row.department ||
        'Paper & Notebooks'
      );
      const category = normalizeCategory(rawCategory);

      let rawSku = String(
        row['SKU'] ||
        row.sku ||
        row.code ||
        row.item_code ||
        row.product_code ||
        ''
      ).trim();
      const originalSku = rawSku;

      let barcode = String(
        row['Barcode'] ||
        row.barcode ||
        row.upc ||
        row.ean ||
        row.barcode_number ||
        ''
      ).trim();

      const rawCost =
        row['Buying Price (ETB)'] ??
        row['Buying Price'] ??
        row['Purchase Price'] ??
        row.costPrice ??
        row.cost ??
        row.cost_price ??
        row.buying_price;

      const rawRetail =
        row['Selling Price (ETB)'] ??
        row['Selling Price'] ??
        row['Retail Price'] ??
        row.retailPrice ??
        row.price ??
        row.retail ??
        row.retail_price ??
        row.selling_price;

      const rawStock =
        row['Current Stock'] ??
        row['Stock'] ??
        row.stock ??
        row.qty ??
        row.quantity ??
        row.inventory;

      const rawMin =
        row['Minimum Stock'] ??
        row['Min Stock'] ??
        row['Reorder Level'] ??
        row.minThreshold ??
        row.min ??
        row.threshold ??
        row.alert_stock;

      const costPrice = Math.max(0, parseFloat(String(rawCost ?? 0)) || 0);
      const retailPrice = parseFloat(String(rawRetail ?? 0));
      const stock = parseInt(String(rawStock ?? 0), 10);
      const minThreshold = Math.max(1, parseInt(String(rawMin ?? 5), 10) || 5);
      const unit = String(row['Unit'] || row.unit || row.uom || 'pcs').trim() || 'pcs';
      const description = String(
        row['Description'] || row.description || row.desc || row.details || ''
      ).trim();

      // Required Field 1: Product Name
      if (!name) {
        errors.push('Missing product name (required)');
      }

      // Required Field 2: Selling Price
      if (rawRetail === undefined || rawRetail === '' || isNaN(retailPrice) || retailPrice <= 0) {
        errors.push('Missing or invalid selling price (must be greater than 0 ETB)');
      }

      // Buying Price Check
      if (rawCost !== undefined && rawCost !== '' && (isNaN(costPrice) || costPrice < 0)) {
        errors.push('Invalid buying price (cannot be negative)');
      }

      // Stock Check
      if (rawStock !== undefined && rawStock !== '' && (isNaN(stock) || stock < 0)) {
        errors.push('Invalid current stock (cannot be negative)');
      }

      let skuStatus: SkuValidationStatus = 'new_sku';

      // Check if SKU is missing
      if (!rawSku && name) {
        rawSku = storage.generateSku(category, name);
        skuStatus = 'auto_generated';
      }

      // Auto-generate barcode if blank
      if (!barcode && name) {
        barcode = storage.generateBarcodeNumber();
      }

      // Check for SKU conflict with existing inventory
      const existingMatch = existingProducts.find(
        p => (rawSku && p.sku.trim().toLowerCase() === rawSku.trim().toLowerCase())
      );

      // Check for duplicate SKU within the file
      const normalizedSku = rawSku.trim().toLowerCase();
      const isDuplicateInFile = normalizedSku && (skuOccurrenceMap[normalizedSku] || 0) > 1;

      // Check for duplicate barcode within the file
      const isDuplicateBarcodeInFile = barcode && (barcodeOccurrenceMap[barcode] || 0) > 1;

      // Check for barcode conflict with a DIFFERENT product in existing inventory
      const existingWithBarcode = barcode
        ? existingProducts.find(
            p =>
              p.barcode.trim() === barcode.trim() &&
              p.sku.trim().toLowerCase() !== rawSku.trim().toLowerCase()
          )
        : null;

      if (isDuplicateInFile) {
        skuStatus = 'duplicate_in_file';
        errors.push(`Duplicate SKU '${rawSku}' appears multiple times in this file`);
      }

      if (isDuplicateBarcodeInFile) {
        errors.push(`Duplicate barcode '${barcode}' appears multiple times in this file`);
      }

      if (existingWithBarcode) {
        errors.push(`Barcode already assigned to '${existingWithBarcode.name}' (SKU: ${existingWithBarcode.sku})`);
      }

      if (errors.length > 0) {
        skuStatus = 'invalid';
      } else if (existingMatch) {
        skuStatus = 'existing_match';
      } else if (skuStatus !== 'auto_generated') {
        skuStatus = 'new_sku';
      }

      let status: 'new' | 'update' | 'invalid' = 'new';
      if (errors.length > 0) {
        status = 'invalid';
      } else if (existingMatch) {
        status = 'update';
      }

      return {
        id: 'imp_' + Date.now() + '_' + idx,
        name,
        category,
        sku: rawSku,
        originalSku,
        barcode,
        costPrice: isNaN(costPrice) ? 0 : costPrice,
        retailPrice: isNaN(retailPrice) ? 0 : retailPrice,
        stock: isNaN(stock) ? 0 : stock,
        minThreshold,
        unit,
        description,
        selected: status !== 'invalid' && errors.length === 0,
        status,
        skuStatus,
        existingMatch,
        errors
      };
    });

    setParsedItems(parsed);
    setImportResult(null);
  };

  /**
   * Excel File Parser (.xlsx, .xls) using SheetJS
   */
  const handleParseExcel = async (file: File) => {
    setIsProcessingFile(true);
    setFileTypeDetected('excel');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      rawWorkbookRef.current = workbook;

      setWorkbookSheets(workbook.SheetNames);
      const defaultSheet = workbook.SheetNames[0];
      setActiveSheetName(defaultSheet);

      const worksheet = workbook.Sheets[defaultSheet];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      if (jsonRows.length === 0) {
        alert('The selected Excel sheet contains no tabular data.');
        setIsProcessingFile(false);
        return;
      }

      processRawRows(jsonRows, `${file.name} (${defaultSheet})`);
    } catch (err) {
      console.error('Excel parse error:', err);
      alert('Unable to parse the Excel workbook. Please ensure it is a valid .xlsx or .xls file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  /**
   * Switch between sheets in a multi-sheet Excel file
   */
  const handleSwitchExcelSheet = (sheetName: string) => {
    if (!rawWorkbookRef.current) return;
    setActiveSheetName(sheetName);
    const worksheet = rawWorkbookRef.current.Sheets[sheetName];
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
    processRawRows(jsonRows, `${selectedFileName.split(' (')[0]} (${sheetName})`);
  };

  /**
   * PDF File Parser (.pdf) using PDF.js
   * Extracts text items from all pages and identifies tabular product rows
   */
  const handleParsePdf = async (file: File) => {
    setIsProcessingFile(true);
    setFileTypeDetected('pdf');
    try {
      const arrayBuffer = await file.arrayBuffer();
      let fullText = '';
      let pageCount = 0;

      try {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdfDoc = await loadingTask.promise;
        pageCount = pdfDoc.numPages;

        for (let i = 1; i <= pageCount; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageStrings = textContent.items
            .map((item: any) => item.str)
            .filter((str: string) => str.trim().length > 0);
          fullText += pageStrings.join('\t') + '\n';
        }
      } catch (pdfJsErr) {
        console.warn('PDF.js standard extraction failed, trying binary text decode fallback', pdfJsErr);
        // Fallback for offline environments or raw text streams
        const decoder = new TextDecoder('latin1');
        const rawContent = decoder.decode(new Uint8Array(arrayBuffer));
        const streamMatches = rawContent.match(/\(([^)]+)\)\s*Tj/g) || [];
        const extractedTokens = streamMatches.map(m => m.replace(/^\(|\)\s*Tj$/g, ''));
        fullText = extractedTokens.join(' ');
      }

      setPdfPageCount(pageCount || 1);
      setPdfExtractedText(fullText);

      // Parse extracted PDF text into rows
      const extractedRows = parsePdfTextToRows(fullText);
      if (extractedRows.length === 0) {
        alert('Could not automatically identify structured product rows from the PDF. You can view the raw extracted text in the PDF Inspector tab or paste the data directly.');
        setShowPdfInspector(true);
      } else {
        processRawRows(extractedRows, file.name);
      }
    } catch (err) {
      console.error('PDF parsing error:', err);
      alert('Unable to read this PDF document. Please verify the file is not corrupted or password protected.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  /**
   * Heuristic Parser: converts unstructured PDF line tokens into structured product objects
   */
  const parsePdfTextToRows = (rawText: string): Array<Record<string, any>> => {
    const lines = rawText.split('\n').filter(l => l.trim().length > 0);
    const rows: Array<Record<string, any>> = [];

    lines.forEach(line => {
      // Split by tabs or multiple spaces
      const tokens = line.split(/\t+|\s{2,}/).map(t => t.trim()).filter(Boolean);
      if (tokens.length < 2) return;

      // Skip common header words
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('invoice') && lowerLine.includes('number') && tokens.length < 4) return;
      if (lowerLine.includes('item description') || lowerLine.includes('unit price') || lowerLine.includes('subtotal')) return;

      // Look for candidate SKU (e.g. PPR-A4-80G, PEN-101, ART-202, or code with hyphen/numbers)
      let sku = '';
      let name = '';
      let cost = 0;
      let price = 0;
      let stock = 10;
      let barcode = '';

      tokens.forEach(tok => {
        // Barcode: 12-13 consecutive digits
        if (/^\d{12,13}$/.test(tok)) {
          barcode = tok;
          return;
        }
        // Price / Currency: $9.99 or 9.99
        if (/^\$?\d+(\.\d{1,2})?$/.test(tok) && !sku.includes(tok)) {
          const num = parseFloat(tok.replace('$', ''));
          if (cost === 0 && num > 0) cost = num;
          else if (price === 0 && num > 0) price = num;
          return;
        }
        // SKU candidate: Contains uppercase letters and hyphen or digits
        if (/^[A-Z0-9]{2,5}-[A-Z0-9]{2,8}(-[A-Z0-9]{2,6})?$/.test(tok)) {
          sku = tok;
          return;
        }
        // Quantity integer
        if (/^\d{1,4}$/.test(tok) && !barcode && stock === 10) {
          const q = parseInt(tok, 10);
          if (q > 0 && q < 5000) stock = q;
          return;
        }
        // Name candidate (longer text)
        if (tok.length > 3 && !name) {
          name = tok;
        }
      });

      if (name) {
        if (cost > 0 && price === 0) price = Number((cost * 1.5).toFixed(2));
        if (price > 0 && cost === 0) cost = Number((price * 0.6).toFixed(2));

        rows.push({
          name,
          sku: sku || '',
          barcode: barcode || '',
          costPrice: cost || 3.5,
          retailPrice: price || 6.99,
          stock: stock || 20,
          category: 'Paper & Notebooks',
          unit: 'pcs'
        });
      }
    });

    return rows;
  };

  /**
   * CSV / TSV text parser
   */
  const parseDelimitedText = (text: string, sourceName = 'Pasted Text') => {
    const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      alert('The provided file or text is empty.');
      return;
    }

    const firstLine = lines[0];
    const isTab = firstLine.includes('\t');
    const delimiter = isTab ? '\t' : ',';

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let insideQuote = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuote && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            insideQuote = !insideQuote;
          }
        } else if (char === delimiter && !insideQuote) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headerTokens = parseLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim());
    const isHeader = headerTokens.some(h => {
      const lower = h.toLowerCase();
      return (
        lower.includes('name') ||
        lower.includes('title') ||
        lower.includes('item') ||
        lower.includes('sku') ||
        lower.includes('price') ||
        lower.includes('stock') ||
        lower.includes('barcode') ||
        lower.includes('cost')
      );
    });

    const rows: Array<Record<string, any>> = [];

    if (isHeader) {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;
        const values = parseLine(line);
        const rowObj: Record<string, any> = {};
        headerTokens.forEach((key, kIdx) => {
          rowObj[key] = values[kIdx] !== undefined ? values[kIdx] : '';
        });
        rows.push(rowObj);
      }
    } else {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;
        const values = parseLine(line);
        rows.push({
          name: values[0] || '',
          category: values[1] || 'Paper & Notebooks',
          sku: values[2] || '',
          barcode: values[3] || '',
          costPrice: values[4] || 0,
          retailPrice: values[5] || 0,
          stock: values[6] || 0,
          minThreshold: values[7] || 5,
          unit: values[8] || 'pcs',
          description: values[9] || ''
        });
      }
    }

    processRawRows(rows, sourceName);
  };

  /**
   * Master file router: accepts Excel (.xlsx, .xls), PDF (.pdf), CSV (.csv), TSV (.tsv), JSON
   */
  const handleFile = (file: File) => {
    setSelectedFileName(file.name);
    setWorkbookSheets([]);
    setActiveSheetName('');
    setShowPdfInspector(false);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      handleParseExcel(file);
    } else if (ext === 'pdf') {
      handleParsePdf(file);
    } else if (ext === 'json') {
      setFileTypeDetected('json');
      setIsProcessingFile(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(String(e.target?.result || ''));
          const array = Array.isArray(parsed) ? parsed : parsed.products || [parsed];
          processRawRows(array, file.name);
        } catch {
          alert('Invalid JSON file format.');
        } finally {
          setIsProcessingFile(false);
        }
      };
      reader.readAsText(file);
    } else {
      // CSV or plain text
      setFileTypeDetected('csv');
      setIsProcessingFile(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        parseDelimitedText(String(e.target?.result || ''), file.name);
        setIsProcessingFile(false);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Standardized Excel Template Download (.xlsx)
   * Includes Products entry sheet + Instructions reference sheet
   */
  const handleDownloadExcelTemplate = () => {
    downloadExcelImportTemplate();
  };

  /**
   * 1-Click PDF Supplier Invoice Generator & Downloader
   * Creates a sample vendor delivery PDF to test PDF parsing
   */
  const handleGenerateSampleSupplierPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('STATIONERY WHOLESALE SUPPLY CO.', 14, 18);
    doc.setFontSize(10);
    doc.text('Vendor Delivery Note & Stock Invoice #WH-2026-9811', 14, 25);
    doc.text('Date: October 2026  ·  Customer: Rahel Stationary', 14, 31);

    autoTable(doc, {
      startY: 38,
      head: [['SKU Code', 'Item Description', 'Category', 'Qty', 'Cost ($)', 'Retail ($)', 'Barcode']],
      body: [
        ['PPR-A4-80G', 'A4 Double A Copier Paper (80gsm, 500 Sheets)', 'Paper & Notebooks', '40', '4.20', '7.50', '890123456001'],
        ['PEN-SAKU-05B', 'Sakura Pigma Micron 05 Fineliner Black', 'Writing & Pens', '50', '2.10', '4.50', '890334810101'],
        ['ART-TOMB-6PS', 'Tombow Dual Brush Pen Pastel 6-Color Set', 'Art & Craft', '25', '10.50', '19.99', '890334810102'],
        ['BND-COMB-12B', 'Plastic Comb Binding Spines 12mm Black (100pk)', 'Binding & Lamination', '30', '6.20', '11.95', '890445910203'],
        ['PRN-THRM-808', 'Thermal Till Receipt Paper Rolls 80x80mm (Box 24)', 'Printing & Copying', '20', '16.50', '29.90', '890445910201']
      ],
      theme: 'grid',
      headStyles: { fillColor: [6, 78, 59] }
    });

    doc.save('sample_stationery_supplier_invoice.pdf');
  };

  // Load starter sample catalog
  const handleLoadSampleCatalog = (catId: string) => {
    const catalog = SAMPLE_CATALOGS.find(c => c.id === catId);
    if (!catalog) return;
    setFileTypeDetected('json');
    processRawRows(catalog.items, `Preloaded: ${catalog.title}`);
  };

  // Toggle selection
  const handleToggleSelectAll = (checked: boolean) => {
    setParsedItems(prev =>
      prev.map(item => ({
        ...item,
        selected: item.status !== 'invalid' ? checked : false
      }))
    );
  };

  const handleToggleItem = (id: string) => {
    setParsedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  // Update item SKU inline
  const handleInlineSkuChange = (id: string, newSku: string) => {
    setParsedItems(prev => {
      const existingProducts = storage.getProducts();
      return prev.map(item => {
        if (item.id !== id) return item;
        const trimmed = newSku.trim();
        const match = existingProducts.find(p => p.sku.toLowerCase() === trimmed.toLowerCase());
        return {
          ...item,
          sku: trimmed,
          skuStatus: match ? 'existing_match' : 'new_sku',
          existingMatch: match,
          status: match ? 'update' : 'new'
        };
      });
    });
  };

  // Metrics on SKU validation
  const existingSkuCount = useMemo(() => {
    return parsedItems.filter(i => i.skuStatus === 'existing_match').length;
  }, [parsedItems]);

  const newSkuCount = useMemo(() => {
    return parsedItems.filter(i => i.skuStatus === 'new_sku' || i.skuStatus === 'auto_generated').length;
  }, [parsedItems]);

  const duplicateInFileCount = useMemo(() => {
    return parsedItems.filter(i => i.skuStatus === 'duplicate_in_file').length;
  }, [parsedItems]);

  const invalidRowsCount = useMemo(() => {
    return parsedItems.filter(i => i.status === 'invalid' || i.errors.length > 0).length;
  }, [parsedItems]);

  const validItemsCount = useMemo(() => {
    return parsedItems.filter(i => i.status !== 'invalid' && i.errors.length === 0).length;
  }, [parsedItems]);

  const duplicateBarcodeCount = useMemo(() => {
    return parsedItems.filter(i => i.errors.some(e => e.toLowerCase().includes('barcode'))).length;
  }, [parsedItems]);

  const missingPriceCount = useMemo(() => {
    return parsedItems.filter(i => i.errors.some(e => e.toLowerCase().includes('selling price'))).length;
  }, [parsedItems]);

  const missingNameCount = useMemo(() => {
    return parsedItems.filter(i => i.errors.some(e => e.toLowerCase().includes('product name'))).length;
  }, [parsedItems]);

  const selectedValidCount = useMemo(() => {
    return parsedItems.filter(i => i.selected && i.status !== 'invalid' && i.errors.length === 0).length;
  }, [parsedItems]);

  const selectedCount = parsedItems.filter(i => i.selected).length;

  // Filter preview table items
  const filteredPreviewItems = useMemo(() => {
    return parsedItems.filter(item => {
      const matchesSearch =
        !previewSearch.trim() ||
        item.name.toLowerCase().includes(previewSearch.toLowerCase().trim()) ||
        item.sku.toLowerCase().includes(previewSearch.toLowerCase().trim()) ||
        item.barcode.includes(previewSearch.trim());

      let matchesFilter = true;
      if (previewFilter === 'existing_sku') matchesFilter = item.skuStatus === 'existing_match';
      else if (previewFilter === 'new_sku') matchesFilter = item.skuStatus === 'new_sku' || item.skuStatus === 'auto_generated';
      else if (previewFilter === 'duplicates') matchesFilter = item.skuStatus === 'duplicate_in_file';
      else if (previewFilter === 'invalid') matchesFilter = item.status === 'invalid' || item.errors.length > 0;

      return matchesSearch && matchesFilter;
    });
  }, [parsedItems, previewSearch, previewFilter]);

  // Execute bulk import with duplicate resolution strategy
  const handleCommitImport = () => {
    const toImport = parsedItems.filter(i => i.selected && i.status !== 'invalid');
    if (toImport.length === 0) {
      alert('Please select at least one valid product to import.');
      return;
    }

    setIsExecutingImport(true);
    setImportProgress(25);

    setTimeout(() => {
      setImportProgress(70);

      const productsToSave: Product[] = toImport.map(item => ({
        id: item.existingMatch && (duplicateMode === 'update' || duplicateMode === 'overwrite_stock')
          ? item.existingMatch.id
          : 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: item.name,
        category: item.category,
        sku: item.sku,
        barcode: item.barcode,
        costPrice: item.costPrice,
        retailPrice: item.retailPrice,
        stock: item.stock,
        minThreshold: item.minThreshold,
        unit: item.unit,
        description: item.description,
        updatedAt: new Date().toISOString()
      }));

      const res = storage.saveProductsBulk(productsToSave, {
        onDuplicate: duplicateMode
      });

      setImportProgress(100);

      setTimeout(() => {
        setIsExecutingImport(false);
        setImportResult({
          added: res.added,
          updated: res.updated,
          skipped: res.skipped,
          importedIds: productsToSave.map(p => p.id)
        });
        onSuccess(res.added, res.updated);
      }, 300);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[840px] bg-[#141417] rounded-2xl shadow-2xl border border-[#26221c] flex flex-col overflow-hidden text-[#f4efe8]">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[#26221c] flex items-center justify-between bg-[#1a1a20] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 text-[#f5d77f] flex items-center justify-center border border-[#d4af37]/30 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#f5d77f]">
                  Bulk Import Inventory Items
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/30">
                  Excel (.xlsx) · PDF (.pdf)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/50">
                  SKU Conflict Validation
                </span>
              </div>
              <p className="text-xs text-[#a89f91]">
                Upload vendor Excel spreadsheets or PDF invoices, validate existing SKUs, and replenish store stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Excel Template Button */}
            <button
              type="button"
              onClick={handleDownloadExcelTemplate}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black hover:brightness-110 flex items-center gap-1.5 transition-all shadow-sm shadow-[#d4af37]/20 cursor-pointer"
              title="Download standardized Excel template (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Download Excel Template (.xlsx)</span>
            </button>

            <button
              onClick={handleGenerateSampleSupplierPdf}
              className="hidden sm:flex px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#202026] text-[#c4bbb0] border border-[#26221c] items-center gap-1.5 transition-colors shadow-2xs"
              title="Generate a sample vendor delivery PDF to test PDF parsing"
            >
              <FileType className="w-3.5 h-3.5 text-rose-400" />
              <span>Sample PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-[#8e8271] hover:text-[#f4efe8] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Completion Summary View */}
        {importResult ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-[#d4af37]/20 text-[#f5d77f] flex items-center justify-center mb-4 border border-[#d4af37]/40 shadow-sm animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h4 className="text-xl font-bold text-[#f5d77f] mb-1">
              Bulk Import Successfully Completed!
            </h4>
            <p className="text-xs text-[#a89f91] max-w-md mb-6">
              Inventory catalog and stock levels have been synchronized. Stock movement audit entries were logged.
            </p>

            <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-6">
              <div className="p-3.5 rounded-xl bg-[#1a1a20] border border-[#26221c] shadow-2xs text-center">
                <span className="text-[11px] font-semibold text-[#8e8271]">Added New SKUs</span>
                <div className="text-2xl font-mono font-bold text-[#d4af37]">
                  +{importResult.added}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1a1a20] border border-[#26221c] shadow-2xs text-center">
                <span className="text-[11px] font-semibold text-[#8e8271]">Updated SKUs</span>
                <div className="text-2xl font-mono font-bold text-[#f5d77f]">
                  {importResult.updated}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1a1a20] border border-[#26221c] shadow-2xs text-center">
                <span className="text-[11px] font-semibold text-[#8e8271]">Skipped</span>
                <div className="text-2xl font-mono font-bold text-[#8e8271]">
                  {importResult.skipped}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {onNavigateToBarcodeStudio && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToBarcodeStudio(importResult.importedIds);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1a1a20] hover:bg-[#22222a] text-[#f5d77f] border border-[#26221c] hover:border-[#d4af37]/40 flex items-center gap-2 shadow-2xs transition-colors"
                >
                  <Printer className="w-4 h-4 text-[#d4af37]" />
                  <span>Print Barcode Labels for Imported Batch</span>
                </button>
              )}

              <button
                onClick={() => {
                  setImportResult(null);
                  setParsedItems([]);
                  setPastedText('');
                  setSelectedFileName('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1a1a20] hover:bg-[#22222a] text-[#c4bbb0] border border-[#26221c] transition-colors"
              >
                <span>Import Another File</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black shadow-md shadow-[#d4af37]/20 transition-colors"
              >
                <span>Done & Return to Inventory</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {parsedItems.length === 0 ? (
              /* Step 1: Input source selector */
              <div className="flex-1 flex flex-col p-5 overflow-y-auto">
                {/* Method Navigation Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-[#1a1a20] rounded-xl max-w-lg mx-auto mb-6 border border-[#26221c]">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'upload'
                        ? 'bg-[#d4af37] text-black shadow-2xs font-bold'
                        : 'text-[#8e8271] hover:text-[#f4efe8]'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Excel or PDF</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('paste')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'paste'
                        ? 'bg-[#d4af37] text-black shadow-2xs font-bold'
                        : 'text-[#8e8271] hover:text-[#f4efe8]'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Paste Rows</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('samples')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'samples'
                        ? 'bg-[#d4af37] text-black shadow-2xs font-bold'
                        : 'text-[#8e8271] hover:text-[#f4efe8]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Vendor Catalogs</span>
                  </button>
                </div>

                {/* Upload Excel or PDF Dropzone */}
                {activeTab === 'upload' && (
                  <div className="max-w-xl mx-auto w-full space-y-4">
                    {/* Step 1: Download Excel Template Banner */}
                    <div className="p-4 rounded-2xl bg-[#18181d] border border-[#d4af37]/35 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-5 h-5 text-[#f5d77f]" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#f5d77f] flex items-center gap-2">
                            <span>Step 1: Download Excel Template</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#d4af37]/25 text-[#f5d77f] border border-[#d4af37]/40">
                              .xlsx Ready
                            </span>
                          </div>
                          <p className="text-[11px] text-[#a89f91] mt-0.5">
                            Pre-configured columns with required fields, 4 realistic examples, and Instructions sheet.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleDownloadExcelTemplate}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black hover:brightness-110 flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-sm shadow-[#d4af37]/20 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-black" />
                        <span>Download Excel Template (.xlsx)</span>
                      </button>
                    </div>

                    {/* Step 2: Upload Dropzone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer border-2 border-dashed rounded-2xl p-7 text-center transition-all flex flex-col items-center justify-center shadow-xs ${
                        dragOver
                          ? 'border-[#d4af37] bg-[#d4af37]/10'
                          : 'border-[#26221c] bg-[#1a1a20] hover:border-[#d4af37]/60 hover:bg-[#202026]'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFile(e.target.files[0]);
                          }
                        }}
                        accept=".xlsx,.xls,.pdf"
                        className="hidden"
                      />

                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#d4af37]/20 text-[#f5d77f] flex items-center justify-center shadow-2xs border border-[#d4af37]/30">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-rose-950/70 text-rose-400 flex items-center justify-center shadow-2xs border border-rose-800/40">
                          <FileType className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="font-bold text-sm text-[#f4efe8] mb-1">
                        Step 2: Upload Completed Excel Workbook or PDF Invoice
                      </div>
                      <p className="text-xs text-[#a89f91] max-w-sm mb-3">
                        Supported: <strong className="text-[#f5d77f] font-bold">.xlsx, .xls (Excel)</strong> and{' '}
                        <strong className="text-rose-400 font-bold">.pdf (Vendor Invoices)</strong>.
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141417] text-[11px] font-semibold text-[#c4bbb0] border border-[#26221c]">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Excel Spreadsheets</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141417] text-[11px] font-semibold text-[#c4bbb0] border border-[#26221c]">
                          <FileType className="w-3.5 h-3.5 text-rose-400" />
                          <span>PDF Stock Invoices</span>
                        </span>
                      </div>
                    </div>

                    {isProcessingFile && (
                      <div className="mt-4 p-3 rounded-xl bg-[#1a1a20] border border-[#d4af37]/40 flex items-center justify-center gap-2 text-xs text-[#f5d77f] font-semibold animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#d4af37]" />
                        <span>Parsing {fileTypeDetected?.toUpperCase()} document and running SKU validation check...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Paste Tab */}
                {activeTab === 'paste' && (
                  <div className="max-w-2xl mx-auto w-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-[#c4bbb0]">
                        Paste spreadsheet rows from Excel, Google Sheets, or PDF text:
                      </label>
                      <button
                        onClick={async () => {
                          try {
                            const clip = await navigator.clipboard.readText();
                            setPastedText(clip);
                          } catch {
                            // clipboard permissions
                          }
                        }}
                        className="text-[11px] font-semibold text-[#f5d77f] hover:underline"
                      >
                        Paste from Clipboard
                      </button>
                    </div>

                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={`SKU\tItem Name\tCategory\tCost\tPrice\tStock\nPPR-A4-80G\tA4 Double A Copier Paper\tPaper & Notebooks\t4.20\t7.50\t40\nPEN-SAKU-05B\tSakura Pigma Micron 05 Black\tWriting & Pens\t2.10\t4.50\t50`}
                      rows={8}
                      className="w-full p-3 font-mono text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 placeholder-[#8e8271]"
                    />

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-[#8e8271]">
                        Tab-separated or comma-separated rows. Existing SKUs will be checked automatically.
                      </span>

                      <button
                        onClick={() => parseDelimitedText(pastedText)}
                        disabled={!pastedText.trim()}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 disabled:opacity-50 text-black flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>Parse & Validate SKUs</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Preloaded Vendor Batches */}
                {activeTab === 'samples' && (
                  <div className="max-w-3xl mx-auto w-full space-y-4">
                    <div className="text-center mb-2">
                      <h4 className="text-sm font-bold text-[#f5d77f]">
                        1-Click Ready Stationery Vendor Catalogs
                      </h4>
                      <p className="text-xs text-[#a89f91]">
                        Load realistic supplier shipments containing both new SKUs and existing inventory SKUs to test conflict resolution.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {SAMPLE_CATALOGS.map(cat => (
                        <div
                          key={cat.id}
                          className="flex flex-col justify-between p-4 rounded-2xl bg-[#1a1a20] border border-[#26221c] hover:border-[#d4af37]/50 hover:shadow-md transition-all group"
                        >
                          <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/15 text-[#f5d77f] border border-[#d4af37]/30 mb-2">
                              {cat.badge}
                            </span>
                            <h5 className="font-bold text-xs text-[#f4efe8] mb-1 group-hover:text-[#f5d77f] transition-colors">
                              {cat.title}
                            </h5>
                            <p className="text-[11px] text-[#a89f91] leading-relaxed mb-4">
                              {cat.description}
                            </p>
                          </div>

                          <button
                            onClick={() => handleLoadSampleCatalog(cat.id)}
                            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-black flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          >
                            <span>Load & Validate This Batch</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: Verification, SKU Validation & Preview Table */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* File info banner + Excel Sheet Selector */}
                <div className="px-5 py-2.5 border-b border-[#26221c] bg-[#1a1a20] flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#c4bbb0] flex items-center gap-1.5">
                      {fileTypeDetected === 'excel' && <FileSpreadsheet className="w-4 h-4 text-[#d4af37]" />}
                      {fileTypeDetected === 'pdf' && <FileType className="w-4 h-4 text-rose-400" />}
                      <span>Source: <strong className="text-[#f5d77f]">{selectedFileName || 'Custom File'}</strong></span>
                    </span>

                    {/* Multi-sheet Excel switcher */}
                    {workbookSheets.length > 1 && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <span className="text-[11px] text-[#8e8271]">Sheet:</span>
                        <select
                          value={activeSheetName}
                          onChange={(e) => handleSwitchExcelSheet(e.target.value)}
                          className="px-2 py-0.5 text-xs rounded-lg bg-[#141417] border border-[#2a261f] text-[#f5d77f] font-semibold focus:outline-none"
                        >
                          {workbookSheets.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* PDF Page info */}
                    {fileTypeDetected === 'pdf' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/40">
                        {pdfPageCount} Page{pdfPageCount > 1 ? 's' : ''} parsed
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setParsedItems([]);
                        setSelectedFileName('');
                        setWorkbookSheets([]);
                      }}
                      className="text-[11px] text-[#8e8271] hover:text-rose-400 underline font-medium ml-2"
                    >
                      Change File
                    </button>
                  </div>

                  {/* SKU Conflict Strategy Selector */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] text-[#a89f91] font-semibold flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>For Existing SKUs:</span>
                    </span>
                    <select
                      value={duplicateMode}
                      onChange={(e) => setDuplicateMode(e.target.value as any)}
                      className="px-2.5 py-1 text-xs rounded-xl bg-[#141417] border border-[#2a261f] text-[#f4efe8] font-semibold focus:outline-none shadow-2xs"
                    >
                      <option value="update">Replenish Stock (+Add to existing stock)</option>
                      <option value="overwrite_stock">Overwrite Stock (Set to imported qty)</option>
                      <option value="skip">Skip Existing SKUs (Keep current)</option>
                      <option value="generate_new">Auto-generate New Unique SKUs</option>
                    </select>
                  </div>
                </div>

                {/* Validation Summary Alert Banner */}
                <div className="px-5 py-2.5 bg-[#18181d] border-b border-[#26221c] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#f5d77f]">
                      {parsedItems.length} items found:
                    </span>
                    <span className="font-bold text-emerald-400">
                      {validItemsCount} valid
                    </span>
                    {invalidRowsCount > 0 && (
                      <>
                        <span className="text-[#8e8271]">&bull;</span>
                        <span className="font-semibold text-rose-400">
                          {invalidRowsCount} with errors
                        </span>
                        <span className="text-[#8e8271] text-[11px]">
                          ({[
                            duplicateBarcodeCount > 0 ? `${duplicateBarcodeCount} duplicate barcodes` : '',
                            missingPriceCount > 0 ? `${missingPriceCount} missing selling price` : '',
                            duplicateInFileCount > 0 ? `${duplicateInFileCount} duplicate SKUs` : '',
                            missingNameCount > 0 ? `${missingNameCount} missing product names` : ''
                          ].filter(Boolean).join(', ')})
                        </span>
                      </>
                    )}
                    {excludedExamplesCount > 0 && (
                      <>
                        <span className="text-[#8e8271]">&bull;</span>
                        <span className="text-[#8e8271] italic text-[11px]">
                          ({excludedExamplesCount} template example rows automatically excluded)
                        </span>
                      </>
                    )}
                  </div>

                  <div className="text-[11px] text-[#8e8271]">
                    Review rows below &bull; Errors must be resolved before import
                  </div>
                </div>

                {/* SKU Validation Metrics & Filter Pills */}
                <div className="px-5 py-2.5 border-b border-[#26221c] flex flex-wrap items-center justify-between gap-2 shrink-0 bg-[#141417]">
                  {/* SKU Status Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setPreviewFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        previewFilter === 'all'
                          ? 'bg-[#d4af37] text-black font-bold'
                          : 'bg-[#1a1a20] text-[#c4bbb0] border border-[#26221c]'
                      }`}
                    >
                      All Items ({parsedItems.length})
                    </button>

                    <button
                      onClick={() => setPreviewFilter('existing_sku')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        previewFilter === 'existing_sku'
                          ? 'bg-[#d4af37] text-black font-bold'
                          : 'bg-[#1a1a20] text-[#c4bbb0] border border-[#26221c]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#d4af37]" />
                      <span>Existing SKUs ({existingSkuCount})</span>
                    </button>

                    <button
                      onClick={() => setPreviewFilter('new_sku')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        previewFilter === 'new_sku'
                          ? 'bg-[#d4af37] text-black font-bold'
                          : 'bg-[#1a1a20] text-[#c4bbb0] border border-[#26221c]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#f5d77f]" />
                      <span>New SKUs ({newSkuCount})</span>
                    </button>

                    {duplicateInFileCount > 0 && (
                      <button
                        onClick={() => setPreviewFilter('duplicates')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          previewFilter === 'duplicates'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>In-File Duplicate SKUs ({duplicateInFileCount})</span>
                      </button>
                    )}

                    {invalidRowsCount > 0 && (
                      <button
                        onClick={() => setPreviewFilter('invalid')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          previewFilter === 'invalid'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                        }`}
                      >
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        <span>Invalid / Errors ({invalidRowsCount})</span>
                      </button>
                    )}
                  </div>

                  {/* Search inside preview */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8e8271]" />
                      <input
                        type="text"
                        placeholder="Search SKU or item name..."
                        value={previewSearch}
                        onChange={(e) => setPreviewSearch(e.target.value)}
                        className="pl-8 pr-2.5 py-1 text-xs rounded-xl bg-[#1a1a20] border border-[#2a261f] text-[#f4efe8] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                      />
                    </div>

                    <button
                      onClick={() => handleToggleSelectAll(true)}
                      className="px-2 py-1 text-xs font-semibold text-[#f5d77f] hover:bg-[#1f1f26] rounded-lg transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => handleToggleSelectAll(false)}
                      className="px-2 py-1 text-xs font-semibold text-[#8e8271] hover:bg-[#1f1f26] rounded-lg transition-colors"
                    >
                      Deselect
                    </button>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#1a1a20] text-[#a89f91] font-medium border-b border-[#26221c] z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-8 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCount === parsedItems.filter(i => i.status !== 'invalid').length && selectedCount > 0}
                            onChange={(e) => handleToggleSelectAll(e.target.checked)}
                            className="rounded border-[#2a261f] text-[#d4af37] focus:ring-[#d4af37]"
                          />
                        </th>
                        <th className="py-2.5 px-3">SKU Validation Status</th>
                        <th className="py-2.5 px-3">SKU Code</th>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Cost</th>
                        <th className="py-2.5 px-3 text-right">Retail</th>
                        <th className="py-2.5 px-3 text-right">Import Qty</th>
                        <th className="py-2.5 px-3 text-center">Stock Impact</th>
                        <th className="py-2.5 px-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26221c] text-[#f4efe8]">
                      {filteredPreviewItems.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-[#8e8271]">
                            No items match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewItems.map((item) => {
                          const isExisting = item.skuStatus === 'existing_match';
                          const isDupInFile = item.skuStatus === 'duplicate_in_file';
                          const existingStock = item.existingMatch?.stock ?? 0;
                          const projectedStock =
                            duplicateMode === 'overwrite_stock'
                              ? item.stock
                              : existingStock + item.stock;

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-white/[0.03] transition-colors ${
                                !item.selected ? 'opacity-50 bg-black/20' : ''
                              } ${isDupInFile ? 'bg-amber-950/20' : ''}`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.selected}
                                  disabled={item.status === 'invalid'}
                                  onChange={() => handleToggleItem(item.id)}
                                  className="rounded border-[#2a261f] text-[#d4af37] focus:ring-[#d4af37]"
                                />
                              </td>

                              {/* SKU Validation Status Badge */}
                              <td className="py-2.5 px-3">
                                {item.status === 'invalid' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/40">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Error</span>
                                  </span>
                                ) : isDupInFile ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Duplicate in File</span>
                                  </span>
                                ) : isExisting ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#f5d77f] border border-[#d4af37]/30"
                                    title={`Existing SKU matched in store catalog: ${item.existingMatch?.name}`}
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Existing SKU</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37]/15 text-[#f5d77f] border border-[#d4af37]/30">
                                    <span>New SKU</span>
                                  </span>
                                )}
                              </td>

                              {/* Editable SKU Code */}
                              <td className="py-2.5 px-3 font-mono text-[11px]">
                                <input
                                  type="text"
                                  value={item.sku}
                                  onChange={(e) => handleInlineSkuChange(item.id, e.target.value)}
                                  className="w-28 px-1.5 py-0.5 rounded bg-transparent hover:bg-white/5 border border-transparent hover:border-[#2a261f] font-mono text-xs focus:outline-none focus:bg-[#1a1a20] focus:border-[#d4af37] text-[#f4efe8]"
                                  title="Click to edit SKU directly"
                                />
                                {item.barcode && (
                                  <div className="text-[10px] text-[#8e8271] font-mono">
                                    {item.barcode}
                                  </div>
                                )}
                              </td>

                              {/* Item Description & Errors */}
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-xs text-[#f4efe8]">
                                  {item.name || <span className="text-rose-400 italic">Missing Name</span>}
                                </div>
                                {isExisting && item.existingMatch && (
                                  <div className="text-[10px] text-[#f5d77f]">
                                    Matched: {item.existingMatch.name}
                                  </div>
                                )}
                                {item.errors.length > 0 && (
                                  <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                                    {item.errors.join(', ')}
                                  </div>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-[11px] text-[#c4bbb0]">
                                {item.category}
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono text-[#a89f91]">
                                {settings.currencySymbol} {item.costPrice.toFixed(2)}
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#f5d77f]">
                                {settings.currencySymbol} {item.retailPrice.toFixed(2)}
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#f4efe8]">
                                +{item.stock} {item.unit}
                              </td>

                              {/* Stock Impact Visual Comparison */}
                              <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                                {isExisting ? (
                                  duplicateMode === 'skip' ? (
                                    <span className="text-[#8e8271] text-[10px]">Skipped</span>
                                  ) : duplicateMode === 'generate_new' ? (
                                    <span className="text-[#d4af37] text-[10px]">New Item ({item.stock})</span>
                                  ) : (
                                    <span className="text-[#f5d77f] text-[11px] font-semibold">
                                      {existingStock} &rarr; <strong className="font-bold text-[#d4af37]">{projectedStock}</strong>
                                    </span>
                                  )
                                ) : (
                                  <span className="text-[#d4af37] text-[11px] font-semibold">
                                    0 &rarr; <strong>{item.stock}</strong>
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  title="Remove from import batch"
                                  className="p-1 rounded-lg text-[#8e8271] hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Progress bar during commit */}
                {isExecutingImport && (
                  <div className="px-5 py-2 bg-[#1a1a20] border-t border-[#26221c]">
                    <div className="flex items-center justify-between text-xs text-[#f5d77f] font-semibold mb-1">
                      <span>Applying SKU validation rules & generating stock movement logs...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#141417] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#d4af37] to-[#e6ca65] transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Bottom Footer Actions */}
                <div className="px-5 py-3 border-t border-[#26221c] bg-[#1a1a20] flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="text-xs text-[#a89f91] flex items-center gap-2">
                    <span>
                      Selected: <strong className="text-[#f5d77f] font-mono">{selectedCount}</strong> items
                    </span>
                    <span>&middot;</span>
                    <span className="text-[#d4af37] font-semibold">
                      {existingSkuCount} Existing SKUs
                    </span>
                    <span>&middot;</span>
                    <span className="text-[#f5d77f] font-semibold">
                      {newSkuCount} New SKUs
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setParsedItems([]);
                        setSelectedFileName('');
                      }}
                      disabled={isExecutingImport}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#141417] hover:bg-[#202026] text-[#c4bbb0] border border-[#26221c] transition-colors"
                    >
                      Clear Batch
                    </button>

                    <button
                      onClick={handleCommitImport}
                      disabled={selectedCount === 0 || isExecutingImport}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 disabled:opacity-50 text-black flex items-center gap-2 transition-colors shadow-md shadow-[#d4af37]/20"
                    >
                      {isExecutingImport ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Import {selectedCount} Items</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
