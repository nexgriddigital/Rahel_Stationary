import * as XLSX from 'xlsx';
import { ProductCategory } from '../types';

export const VALID_PRODUCT_CATEGORIES: ProductCategory[] = [
  'Writing & Pens',
  'Paper & Notebooks',
  'Printing & Copying',
  'Art & Craft',
  'Desk & Office',
  'Binding & Lamination',
  'Packaging & Envelopes',
  'Custom Stamps & Signs'
];

/**
 * Generates and triggers download of the standardized Rahel Stationery Excel Template (.xlsx)
 * Contains 2 worksheets:
 * 1. "Products" - Main data entry table with formatted headers and realistic example rows
 * 2. "Instructions" - Comprehensive guide explaining columns, required fields, formats, and rules
 */
export const downloadExcelImportTemplate = () => {
  const wb = XLSX.utils.book_new();

  // --------------------------------------------------------------------------
  // SHEET 1: Products
  // --------------------------------------------------------------------------
  const productsHeaders = [
    'Product Name',
    'SKU',
    'Barcode',
    'Category',
    'Buying Price (ETB)',
    'Selling Price (ETB)',
    'Current Stock',
    'Minimum Stock',
    'Unit',
    'Description'
  ];

  const exampleRows = [
    [
      '[EXAMPLE] Pilot G2 0.7mm Retractable Gel Pen Black',
      'PEN-G2-07B',
      '890123456001',
      'Writing & Pens',
      35.0,
      60.0,
      50,
      15,
      'pcs',
      'Smooth rollerball gel ink with contoured rubber grip'
    ],
    [
      '[EXAMPLE] Deli A4 Copy Paper 80gsm (500 Sheets/Ream)',
      'PPR-A4-80G',
      '890123456002',
      'Paper & Notebooks',
      380.0,
      480.0,
      40,
      10,
      'ream',
      'High opacity multipurpose office printing and copy paper'
    ],
    [
      '[EXAMPLE] Kangaro Heavy Duty Desktop Stapler No. 10',
      'STP-KANG-10',
      '890123456003',
      'Desk & Office',
      180.0,
      250.0,
      25,
      5,
      'pcs',
      'All-metal mechanism with built-in staple remover'
    ],
    [
      '[EXAMPLE] Camel 12-Shade Acrylic Paint Color Tubes Set',
      'ART-CAM-12A',
      '890123456004',
      'Art & Craft',
      240.0,
      360.0,
      15,
      4,
      'set',
      'Fast-drying vibrant acrylics for canvas, wood and paper'
    ]
  ];

  const wsProductsData = [productsHeaders, ...exampleRows];
  const wsProducts = XLSX.utils.aoa_to_sheet(wsProductsData);

  // Column widths in characters for clean display
  wsProducts['!cols'] = [
    { wch: 38 }, // Product Name
    { wch: 16 }, // SKU
    { wch: 16 }, // Barcode
    { wch: 22 }, // Category
    { wch: 18 }, // Buying Price (ETB)
    { wch: 18 }, // Selling Price (ETB)
    { wch: 14 }, // Current Stock
    { wch: 16 }, // Minimum Stock
    { wch: 10 }, // Unit
    { wch: 45 }  // Description
  ];

  // Freeze top row for easy scrolling
  wsProducts['!views'] = [{ state: 'frozen', ySplit: 1 }];

  XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');

  // --------------------------------------------------------------------------
  // SHEET 2: Instructions
  // --------------------------------------------------------------------------
  const instructionsData = [
    ['RAHEL STATIONERY - BULK INVENTORY IMPORT GUIDE'],
    ['Standard Operating Procedure for Vendor Spreadsheets & Product Setup'],
    [''],
    ['1. COLUMN DEFINITIONS & RULES'],
    ['Column Name', 'Required', 'Data Type', 'Description & Accepted Format', 'Example Value'],
    [
      'Product Name',
      'YES',
      'Text',
      'Full descriptive title of the stationery item. Cannot be blank.',
      'Pilot G2 0.7mm Gel Pen'
    ],
    [
      'SKU',
      'YES',
      'Text',
      'Unique Product Stock Keeping Unit identifier (e.g. PEN-G2-07B). If already exists in inventory, you can replenish or overwrite.',
      'PEN-G2-07B'
    ],
    [
      'Barcode',
      'OPTIONAL',
      'Number/Text',
      'Item barcode (EAN-13, UPC, Code-128). If left empty, system automatically generates a unique scannable barcode.',
      '890123456001'
    ],
    [
      'Category',
      'YES',
      'Text',
      'Must match one of the 8 supported stationery categories (see list below).',
      'Writing & Pens'
    ],
    [
      'Buying Price (ETB)',
      'YES',
      'Number',
      'Unit purchase / wholesale cost in Ethiopian Birr (ETB). Numbers only (e.g. 35.00). Must be >= 0.',
      '35.00'
    ],
    [
      'Selling Price (ETB)',
      'YES',
      'Number',
      'Retail checkout price in Ethiopian Birr (ETB). Numbers only (e.g. 60.00). Must be greater than 0.',
      '60.00'
    ],
    [
      'Current Stock',
      'YES',
      'Integer',
      'Initial physical quantity on hand. Must be 0 or a positive whole number.',
      '50'
    ],
    [
      'Minimum Stock',
      'YES',
      'Integer',
      'Low-stock alert threshold. Triggers reorder notices when stock falls to or below this level.',
      '15'
    ],
    [
      'Unit',
      'OPTIONAL',
      'Text',
      'Unit of measurement (e.g. pcs, pack, ream, roll, box, set). Defaults to "pcs" if blank.',
      'pcs'
    ],
    [
      'Description',
      'OPTIONAL',
      'Text',
      'Additional item details, specifications, dimensions, or manufacturer notes.',
      'Smooth rollerball gel ink'
    ],
    [''],
    ['2. SUPPORTED STATIONERY CATEGORIES'],
    ['Category Name', 'Description / Typical Items'],
    ['Writing & Pens', 'Ballpoint pens, gel pens, fountain pens, fineliners, highlighters, pencils, markers'],
    ['Paper & Notebooks', 'A4 copy paper, spiral notebooks, composition books, memo pads, graph paper'],
    ['Printing & Copying', 'Toner cartridges, inkjet inks, photo paper, printer ribbons, transparency films'],
    ['Art & Craft', 'Acrylic paints, sketchbooks, canvas, brushes, modeling clay, origami, markers'],
    ['Desk & Office', 'Staplers, hole punches, paper clips, scissors, tape dispensers, rulers, desk organizers'],
    ['Binding & Lamination', 'Comb binding spines, thermal covers, laminating pouches, spiral coils'],
    ['Packaging & Envelopes', 'Manila envelopes, courier boxes, bubble wrap, packing tapes, mailing labels'],
    ['Custom Stamps & Signs', 'Self-inking stamps, date stamps, ink pads, badge holders, name tags'],
    [''],
    ['3. IMPORTANT VALIDATION & DUPLICATE RULES'],
    ['Topic', 'System Behavior & Best Practices'],
    [
      'Duplicate SKUs in File',
      'Each row in the spreadsheet should have a unique SKU. If duplicate SKUs appear within the uploaded file, they will be flagged with an error in the preview screen.'
    ],
    [
      'Existing SKUs in Store',
      'If an imported SKU matches a product already in your store catalog, the system recognizes it as an "Existing SKU". You can choose whether to replenish (+add to current stock), overwrite stock, or skip existing items.'
    ],
    [
      'Barcode Preservation',
      'Barcodes entered in the template are strictly preserved. If left blank, the system will automatically generate a valid 12-digit Code-128 retail barcode.'
    ],
    [
      'Example Rows Handling',
      'Rows beginning with "[EXAMPLE]" in the Product Name are provided for guidance only. The import validator automatically detects and excludes example rows from being imported into your live catalog.'
    ],
    [
      'Currency & Numbers',
      'Enter raw numeric values for prices and stock (do not add "ETB" or "$" symbol inside numeric cells).'
    ]
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);

  wsInstructions['!cols'] = [
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 65 },
    { wch: 26 }
  ];

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Trigger browser download
  XLSX.writeFile(wb, 'Rahel_Stationery_Inventory_Import_Template.xlsx');
};
