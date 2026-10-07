import * as XLSX from 'xlsx';
import { ProductCategory, LOW_STOCK_THRESHOLD } from '../types';

export const VALID_PRODUCT_CATEGORIES: ProductCategory[] = [
  'Writing & Pens',
  'Writing & Correction',
  'Paper & Notebooks',
  'Printing & Copying',
  'Art & Craft',
  'Desk & Office',
  'Binding & Lamination',
  'Packaging & Envelopes',
  'Custom Stamps & Signs',
  'General'
];

/**
 * Generates and triggers download of the standardized Rahel Stationery Excel Template (.xlsx)
 * Designed for effortless bulk import:
 * - Clear separation: Products -> Inventory + QR Code; Services -> No Inventory + No QR Code.
 * - Category, SKU, and QR Codes / Barcodes are automatically generated for physical products.
 * - Minimum stock threshold is centrally fixed at 3 across all products.
 * - Prohibits Document Typing and standardizes Passport Appointment.
 */
export const downloadExcelImportTemplate = () => {
  const wb = XLSX.utils.book_new();

  // --------------------------------------------------------------------------
  // SHEET 1: Products & Services
  // --------------------------------------------------------------------------
  const productsHeaders = [
    'Item Type (Product / Service)',
    'Product / Service Name',
    'Buying Price (ETB)',
    'Selling Price (ETB)',
    'Current Stock',
    'Unit',
    'Description',
    'QR Code (Optional)',
    'Barcode (Optional)',
    'SKU (Optional)',
    'Category (Optional)'
  ];

  const exampleRows = [
    [
      'Product',
      'Pilot G2 0.7mm Retractable Gel Pen Black',
      35.0,
      60.0,
      50,
      'pcs',
      'Smooth rollerball gel ink with contoured rubber grip',
      'PEN-PIL-G2B', // Optional QR Code
      '', // Auto-generated 12-digit barcode
      '', // Auto-generated SKU
      'Writing & Pens'
    ],
    [
      'Product',
      'Deli A4 Copy Paper 80gsm (500 Sheets/Ream)',
      380.0,
      480.0,
      40,
      'ream',
      'High opacity multipurpose office printing and copy paper',
      'PPR-A4-80G',
      '',
      '',
      'Paper & Notebooks'
    ],
    [
      'Product',
      'Kangaro Heavy Duty Desktop Stapler No. 10',
      180.0,
      250.0,
      25,
      'pcs',
      'All-metal mechanism with built-in staple remover',
      '',
      '',
      '',
      'Desk & Office'
    ],
    [
      'Service',
      'Passport Appointment',
      0,
      150.0,
      0, // Services have NO inventory
      'appointment',
      'Online consular appointment scheduling & registration service',
      '', // Services have NO QR Code
      '', // Services have NO Barcode
      '', // Handled as standard service
      'Printing & Copying'
    ],
    [
      'Service',
      'Printing',
      0,
      5.0,
      0, // Services have NO inventory
      'page',
      'Laser document printing (B&W and color)',
      '', // No QR Code
      '', // No Barcode
      '',
      'Printing & Copying'
    ],
    [
      'Service',
      'Laminating',
      0,
      25.0,
      0, // Services have NO inventory
      'pouch',
      'Thermal protective ID card & certificate lamination',
      '', // No QR Code
      '', // No Barcode
      '',
      'Binding & Lamination'
    ],
    [
      'Service',
      'Photocopying',
      0,
      3.0,
      0, // Services have NO inventory
      'copy',
      'Standard high-speed photocopies',
      '', // No QR Code
      '', // No Barcode
      '',
      'Printing & Copying'
    ],
    [
      'Service',
      'Scanning',
      0,
      10.0,
      0, // Services have NO inventory
      'doc',
      'Document optical scanner to PDF or email',
      '', // No QR Code
      '', // No Barcode
      '',
      'Printing & Copying'
    ],
    [
      'Service',
      'Binding',
      0,
      45.0,
      0, // Services have NO inventory
      'book',
      'Spiral comb and wire binding with clear covers',
      '', // No QR Code
      '', // No Barcode
      '',
      'Binding & Lamination'
    ]
  ];

  const wsProductsData = [productsHeaders, ...exampleRows];
  const wsProducts = XLSX.utils.aoa_to_sheet(wsProductsData);

  // Column widths in characters for clean display
  wsProducts['!cols'] = [
    { wch: 26 }, // Item Type (Product / Service)
    { wch: 42 }, // Product / Service Name
    { wch: 18 }, // Buying Price (ETB)
    { wch: 18 }, // Selling Price (ETB)
    { wch: 16 }, // Current Stock
    { wch: 14 }, // Unit
    { wch: 45 }, // Description
    { wch: 20 }, // QR Code (Optional)
    { wch: 20 }, // Barcode (Optional)
    { wch: 16 }, // SKU (Optional)
    { wch: 24 }  // Category (Optional)
  ];

  // Freeze top row for easy scrolling
  wsProducts['!views'] = [{ state: 'frozen', ySplit: 1 }];

  XLSX.utils.book_append_sheet(wb, wsProducts, 'Products & Services');

  // --------------------------------------------------------------------------
  // SHEET 2: Instructions
  // --------------------------------------------------------------------------
  const instructionsData = [
    ['RAHEL STATIONERY - BULK INVENTORY & SERVICES IMPORT GUIDE'],
    ['Standard Operating Procedure for Vendor Spreadsheets, Products & Services'],
    [''],
    ['1. PRODUCT VS SERVICE SEPARATION RULE'],
    ['• Physical Products: Require Inventory Stock + QR Code identifier. Minimum stock is fixed at 3 units.'],
    ['• Commercial Services: Require NO Inventory (Stock: 0) and NO QR Code. Can be added to POS & sold in the same sales transactions.'],
    ['• Supported Core Services: Printing, Laminating, Photocopying, Scanning, Binding, Passport Appointment.'],
    ['• IMPORTANT: Passport Appointment must be named exactly "Passport Appointment" (not Passport Service / Photo Service).'],
    ['• PROHIBITED: "Document Typing" is permanently removed and cannot be added or imported.'],
    [''],
    ['2. AUTOMATIC SYSTEM GENERATION FOR PHYSICAL PRODUCTS'],
    ['• QR Code: Automatically generated from SKU if left blank. Used for scanning at checkout and barcode label printing.'],
    ['• Barcode: Automatically generated 12-digit standard scannable barcode for physical items.'],
    ['• Category: Automatically assigned based on product title & description. Falls back to "General".'],
    ['• SKU: Automatically generated in consistent unique format (e.g. PPR-A4CO-0101).'],
    [`• Minimum Stock: Centrally fixed at ${LOW_STOCK_THRESHOLD} units for all physical products across the entire system.`],
    [''],
    ['3. COLUMN DEFINITIONS & RULES'],
    ['Column Name', 'Required', 'Data Type', 'Description & Accepted Format', 'Example Value'],
    [
      'Item Type (Product / Service)',
      'OPTIONAL',
      'Text',
      'Specify "Product" for physical inventory, or "Service" for commercial store services. Defaults to "Product".',
      'Product or Service'
    ],
    [
      'Product / Service Name',
      'YES',
      'Text',
      'Full descriptive title of the item or service. Cannot be blank. ("Document Typing" is strictly prohibited).',
      'Pilot G2 0.7mm Gel Pen or Passport Appointment'
    ],
    [
      'Buying Price (ETB)',
      'OPTIONAL',
      'Number',
      'Wholesale/purchase cost in ETB. Defaults to 0 for services.',
      '35.00'
    ],
    [
      'Selling Price (ETB)',
      'YES',
      'Number',
      'Retail customer selling price in ETB. Must be a positive number greater than 0.',
      '60.00'
    ],
    [
      'Current Stock',
      'OPTIONAL',
      'Integer',
      'Initial on-hand quantity for Products. Leave 0 or blank for Services (Services require no inventory).',
      '50 (for products) / 0 (for services)'
    ],
    [
      'Unit',
      'OPTIONAL',
      'Text',
      'Unit of measurement (pcs, ream, box, pack, set, page, pouch, copy, appointment). Defaults to "pcs".',
      'pcs or appointment'
    ],
    [
      'Description',
      'OPTIONAL',
      'Text',
      'Product features, dimensions, specifications, or service details.',
      'Online passport consular booking service'
    ],
    [
      'QR Code (Optional)',
      'OPTIONAL',
      'Text',
      'Unique QR code value for physical products. If left blank, automatically matches the SKU. (Services do not require QR codes).',
      'WRI-PILG-0101'
    ],
    [
      'Barcode (Optional)',
      'OPTIONAL',
      'Number/Text',
      'Manufacturer barcode for physical products. If blank, system auto-generates a unique 12-digit code.',
      '890123456001'
    ],
    [
      'SKU (Optional)',
      'OPTIONAL',
      'Text',
      'Custom SKU if you already have one. If left blank, system auto-generates a formatted SKU.',
      'WRI-PILG-0101'
    ],
    [
      'Category (Optional)',
      'OPTIONAL',
      'Text',
      'Category override. If left blank, system automatically assigns the best category.',
      'Writing & Pens'
    ],
    [''],
    ['4. LOW STOCK MONITORING RULE (Physical Products)'],
    ['• Stock > 3: Normal stock (Healthy inventory)'],
    ['• Stock = 3: Low stock warning'],
    ['• Stock < 3: Critical stock / Urgent Restock Alert'],
    [''],
    ['5. SUPPORTED PRODUCT CATEGORIES'],
    ['• Writing & Pens'],
    ['• Writing & Correction'],
    ['• Paper & Notebooks'],
    ['• Printing & Copying'],
    ['• Art & Craft'],
    ['• Desk & Office'],
    ['• Binding & Lamination'],
    ['• Packaging & Envelopes'],
    ['• Custom Stamps & Signs'],
    ['• General']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [
    { wch: 28 }, // Column Name
    { wch: 12 }, // Required
    { wch: 14 }, // Data Type
    { wch: 65 }, // Description
    { wch: 30 }  // Example Value
  ];

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Trigger Excel file download in browser
  XLSX.writeFile(wb, 'Rahel-Stationery-Catalog-Import-Template.xlsx');
};
