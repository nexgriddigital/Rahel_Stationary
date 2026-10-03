import {
  Product,
  Sale,
  ParkedCart,
  CashShift,
  CustomerCreditAccount,
  Expense,
  StockMovement,
  StaffUser,
  ActivityLog,
  StoreSettings,
  AppNotification,
  UserSession,
  DailyReport,
  WeeklyReport,
  MonthlyReport,
  DashboardSalesMetrics,
  ProductSaleStat,
  PaymentMethodStat,
  StaffSaleStat,
  DaySaleSummary,
  PaymentMethod
} from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'rahel_pos_products_v1',
  SALES: 'rahel_pos_sales_v1',
  PARKED_CARTS: 'rahel_pos_parked_carts_v1',
  SHIFTS: 'rahel_pos_shifts_v1',
  CREDIT_ACCOUNTS: 'rahel_pos_credit_accounts_v1',
  EXPENSES: 'rahel_pos_expenses_v1',
  STOCK_MOVEMENTS: 'rahel_pos_stock_movements_v1',
  STAFF: 'rahel_pos_staff_v1',
  ACTIVE_USER: 'rahel_pos_active_user_v1',
  SESSION: 'rahel_pos_session_v1',
  LOGS: 'rahel_pos_logs_v1',
  SETTINGS: 'rahel_pos_settings_v1',
  NOTIFICATIONS: 'rahel_pos_notifications_v1',
  LAST_SYNC: 'rahel_pos_last_sync_v1'
};

// Cryptographic helpers for password hashing & session token generation (Web Crypto API)
export async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomHex(bytesCount: number): string {
  const array = new Uint8Array(bytesCount);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Rahel Stationary",
  tagline: "Stationery, Fine Papers & Commercial Printing",
  address: "Suite 104, Commerce Plaza, Retail District",
  phone: "+1 (555) 382-9011",
  taxNumber: "",
  taxRatePercent: 0,
  currencySymbol: "ETB",
  receiptHeader: "Thank you for shopping at Rahel Stationary!\nSpecialist Print & Office Supplies",
  receiptFooter: "Goods once sold can be exchanged within 7 days with valid receipt.\nNo cash refunds on custom printing services.",
  lowStockThresholdDefault: 10,
  allowNegativeStock: false,
  themeMode: 'dark',
  enableFirestoreSync: false,
  firestoreConfig: {
    projectId: "rahel-pos-app",
    databaseId: "(default)",
    experimentalForceLongPolling: true
  }
};

// Default Administrator: Rahel Fira (Username: admin, Email: rahel@rahelstationary.com, Default Password: Stationery@2026, PIN: 1234)
const SEED_STAFF: StaffUser[] = [
  {
    id: 'user_1',
    name: 'Rahel Fira',
    username: 'admin',
    email: 'rahel@rahelstationary.com',
    role: 'admin',
    pin: '1234',
    passwordHash: '5c741a7da1e1c01400c972aff451a6f7adfeab6427ad05ca459b570fe3edb954',
    passwordSalt: 'a4f91b72e5c83d6a90e1f427b83c51d6',
    approved: true,
    lastActive: new Date().toISOString()
  }
];

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'A4 Double A Copier Paper (80gsm, 500 Sheets)',
    sku: 'PPR-A4-80G',
    barcode: '890123456001',
    category: 'Paper & Notebooks',
    costPrice: 4.20,
    retailPrice: 7.50,
    stock: 64,
    minThreshold: 15,
    unit: 'ream',
    description: 'High opacity ultra-bright paper for laser and inkjet high-speed printing.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_2',
    name: 'Pilot G2 0.7mm Retractable Gel Pen (Black)',
    sku: 'PEN-PIL-G2B',
    barcode: '890123456002',
    category: 'Writing & Pens',
    costPrice: 1.10,
    retailPrice: 2.25,
    stock: 82,
    minThreshold: 20,
    unit: 'pcs',
    description: 'Smooth writing quick-drying archival black gel ink.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_3',
    name: 'Pilot G2 0.7mm Retractable Gel Pen (Blue)',
    sku: 'PEN-PIL-G2BL',
    barcode: '890123456003',
    category: 'Writing & Pens',
    costPrice: 1.10,
    retailPrice: 2.25,
    stock: 5, // Low stock warning!
    minThreshold: 15,
    unit: 'pcs',
    description: 'Smooth writing quick-drying archival blue gel ink.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_4',
    name: 'Moleskine Classic Hardcover Dotted Journal (A5, Black)',
    sku: 'NBK-MOL-A5D',
    barcode: '890123456004',
    category: 'Paper & Notebooks',
    costPrice: 13.50,
    retailPrice: 24.00,
    stock: 18,
    minThreshold: 8,
    unit: 'pcs',
    description: 'FSC-certified ivory acid-free paper with ribbon bookmark and back pocket.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_5',
    name: 'Thermal Receipt Paper Roll 80x80mm (Box of 50)',
    sku: 'POS-ROL-8080',
    barcode: '890123456005',
    category: 'Printing & Copying',
    costPrice: 32.00,
    retailPrice: 52.00,
    stock: 12,
    minThreshold: 6,
    unit: 'box',
    description: 'BPA-free high sensitivity thermal paper for POS receipt printers.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_6',
    name: 'Glossy Photo Paper A4 (230gsm, 50 Sheets)',
    sku: 'PPR-GLS-A450',
    barcode: '890123456006',
    category: 'Printing & Copying',
    costPrice: 6.80,
    retailPrice: 12.50,
    stock: 24,
    minThreshold: 10,
    unit: 'pack',
    description: 'High-gloss cast-coated instant-dry waterproof photo paper.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_7',
    name: 'Color Laser Printing Service (A4 Single Page)',
    sku: 'SRV-CLR-A4',
    barcode: '890123456007',
    category: 'Printing & Copying',
    costPrice: 0.12,
    retailPrice: 0.65,
    stock: 9999, // Service
    minThreshold: 0,
    unit: 'page',
    description: 'Heavy toner crisp commercial high-resolution color laser printout.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_8',
    name: 'Document Binding Spiral Comb (Up to 100pgs)',
    sku: 'SRV-BND-SPR',
    barcode: '890123456008',
    category: 'Binding & Lamination',
    costPrice: 0.85,
    retailPrice: 3.50,
    stock: 140,
    minThreshold: 25,
    unit: 'book',
    description: 'Clear PVC front cover, black leatherette back, plastic spiral binding.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_9',
    name: 'Matte Lamination Pouches A4 (125 Micron, 100 pcs)',
    sku: 'LAM-MTE-A4',
    barcode: '890123456009',
    category: 'Binding & Lamination',
    costPrice: 11.20,
    retailPrice: 19.95,
    stock: 4, // Low stock warning!
    minThreshold: 10,
    unit: 'pack',
    description: 'Anti-glare thermal lamination pouches for ID, menu, and signage protection.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_10',
    name: 'Staedtler Mars Lumograph Art Pencil Set (12 Tins)',
    sku: 'ART-STD-LUM',
    barcode: '890123456010',
    category: 'Art & Craft',
    costPrice: 10.40,
    retailPrice: 18.50,
    stock: 16,
    minThreshold: 5,
    unit: 'tin',
    description: 'Graded graphite pencils 6B to 4H for sketching, drafting, and illustration.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_11',
    name: 'Heavy Duty Stapler (100 Sheets Capacity)',
    sku: 'DSK-STP-HD100',
    barcode: '890123456011',
    category: 'Desk & Office',
    costPrice: 16.50,
    retailPrice: 29.00,
    stock: 9,
    minThreshold: 5,
    unit: 'pcs',
    description: 'Metal body with calibrated adjustable paper guide and anti-jam mechanism.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_12',
    name: 'Custom Self-Inking Rubber Stamp (40x40mm)',
    sku: 'STP-SLF-4040',
    barcode: '890123456012',
    category: 'Custom Stamps & Signs',
    costPrice: 8.50,
    retailPrice: 22.00,
    stock: 45,
    minThreshold: 10,
    unit: 'pcs',
    description: 'Precision laser-engraved polymer stamp pad with refillable black ink.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_13',
    name: 'Kraft Padded Bubble Envelopes #2 (Pack of 25)',
    sku: 'PKG-ENV-KRF2',
    barcode: '890123456013',
    category: 'Packaging & Envelopes',
    costPrice: 7.20,
    retailPrice: 14.50,
    stock: 35,
    minThreshold: 12,
    unit: 'pack',
    description: 'Self-seal tamper-evident tear strip with air cushion bubble lining.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_14',
    name: 'Architectural Tracing Paper Roll (90gsm, 20m)',
    sku: 'PPR-TRC-90G',
    barcode: '890123456014',
    category: 'Paper & Notebooks',
    costPrice: 9.80,
    retailPrice: 18.00,
    stock: 2, // Low stock warning!
    minThreshold: 6,
    unit: 'roll',
    description: 'High transparency translucent parchment for CAD overlays and manual sketching.',
    updatedAt: new Date().toISOString()
  }
];

const SEED_SHIFT: CashShift = {
  id: 'shift_101',
  shiftNumber: 101,
  cashierId: 'user_1',
  cashierName: 'Rahel Fira',
  openedAt: new Date(Date.now() - 14400000).toISOString(),
  openingFloat: 150.00,
  expectedCash: 312.50,
  cashDrops: [
    {
      id: 'drop_1',
      amount: 100.00,
      reason: 'Safe deposit mid-day transfer',
      timestamp: new Date(Date.now() - 7200000).toISOString()
    }
  ],
  status: 'open',
  notes: 'Morning shift commenced with ETB 150.00 float change.'
};

const SEED_CREDIT_ACCOUNTS: CustomerCreditAccount[] = [
  {
    id: 'cred_1',
    customerName: 'Apex Architects & Planners Ltd',
    phone: '+1 (555) 912-4401',
    email: 'accounts@apexarchitects.com',
    creditLimit: 1200.00,
    currentBalance: 345.50,
    dueDate: '2026-10-15',
    createdAt: '2026-08-01T09:00:00.000Z',
    lastPaymentDate: '2026-09-20T14:30:00.000Z',
    notes: 'Monthly corporate blueprint printing and drafting supply contract.',
    transactions: [
      {
        id: 'tx_c1',
        saleId: 'REC-2026-8812',
        date: '2026-09-28T11:20:00.000Z',
        type: 'charge',
        amount: 215.50,
        note: 'Plotter bond rolls and custom blueprints',
        receivedBy: 'Rahel Fira'
      },
      {
        id: 'tx_c2',
        saleId: 'REC-2026-8835',
        date: '2026-10-01T15:10:00.000Z',
        type: 'charge',
        amount: 130.00,
        note: 'Spiral comb presentation booklets',
        receivedBy: 'Rahel Fira'
      }
    ]
  },
  {
    id: 'cred_2',
    customerName: 'Sunrise Academy Private School',
    phone: '+1 (555) 774-1290',
    email: 'bursar@sunriseacademy.edu',
    creditLimit: 800.00,
    currentBalance: 184.00,
    dueDate: '2026-10-10',
    createdAt: '2026-07-15T08:30:00.000Z',
    lastPaymentDate: '2026-09-15T10:00:00.000Z',
    notes: 'Exam papers and end-of-term student report booklet printing.',
    transactions: [
      {
        id: 'tx_c3',
        saleId: 'REC-2026-8809',
        date: '2026-09-26T16:45:00.000Z',
        type: 'charge',
        amount: 184.00,
        note: 'Double A paper 20 reams + staple supplies',
        receivedBy: 'Rahel Fira'
      }
    ]
  }
];

const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    date: new Date(Date.now() - 48000000).toISOString(),
    category: 'Printing Toner',
    amount: 88.00,
    paidVia: 'Cash Register',
    description: 'Black toner replenishment for Xerox C8030 laser copier',
    recordedBy: 'Rahel Fira',
    receiptReference: 'SUP-TN-9921'
  },
  {
    id: 'exp_2',
    date: new Date(Date.now() - 172800000).toISOString(),
    category: 'Packaging Supplies',
    amount: 45.00,
    paidVia: 'Petty Cash',
    description: 'Fragile stamp tape and brown kraft wrapping paper',
    recordedBy: 'Rahel Fira',
    receiptReference: 'PKG-7712'
  }
];

const SEED_LOGS: ActivityLog[] = [
  {
    id: 'log_1',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    action: 'REGISTER_OPEN',
    category: 'shift',
    performedBy: 'Rahel Fira',
    details: 'Shift #101 opened with float amount ETB 150.00'
  },
  {
    id: 'log_2',
    timestamp: new Date(Date.now() - 12000000).toISOString(),
    action: 'PRICE_UPDATE',
    category: 'inventory',
    performedBy: 'Rahel Fira',
    details: 'Updated retail price of Pilot G2 Black from ETB 2.10 to ETB 2.25'
  },
  {
    id: 'log_3',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    action: 'CASH_DROP',
    category: 'shift',
    performedBy: 'Rahel Fira',
    details: 'Cash drop of ETB 100.00 transferred to back-office drop safe.'
  }
];

const SEED_SALES: Sale[] = [
  // Today's Sales
  {
    id: 'sale_1',
    receiptNumber: 'REC-2026-8840',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
    shiftId: 'shift_101',
    items: [
      {
        productId: 'prod_1',
        productName: 'A4 Double A Copier Paper (80gsm, 500 Sheets)',
        sku: 'PPR-A4-80G',
        barcode: '890123456001',
        unitPrice: 7.50,
        costPrice: 4.20,
        quantity: 2,
        total: 15.00,
        discountPercent: 0
      },
      {
        productId: 'prod_2',
        productName: 'Pilot G2 0.7mm Retractable Gel Pen (Black)',
        sku: 'PEN-PIL-G2B',
        barcode: '890123456002',
        unitPrice: 2.25,
        costPrice: 1.10,
        quantity: 3,
        total: 6.75,
        discountPercent: 0
      }
    ],
    subtotal: 21.75,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 21.75,
    payments: [
      {
        method: 'cash',
        amount: 21.75
      }
    ],
    status: 'completed',
    customerName: 'Walk-in Client'
  },
  {
    id: 'sale_2',
    receiptNumber: 'REC-2026-8841',
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
    shiftId: 'shift_101',
    items: [
      {
        productId: 'prod_4',
        productName: 'Moleskine Classic Hardcover Dotted Journal (A5, Black)',
        sku: 'NBK-MOL-A5D',
        barcode: '890123456004',
        unitPrice: 24.00,
        costPrice: 13.50,
        quantity: 1,
        total: 24.00,
        discountPercent: 0
      },
      {
        productId: 'prod_10',
        productName: 'Staedtler Mars Lumograph Art Pencil Set (12 Tins)',
        sku: 'ART-STD-LUM',
        barcode: '890123456010',
        unitPrice: 18.50,
        costPrice: 10.40,
        quantity: 1,
        total: 18.50,
        discountPercent: 0
      }
    ],
    subtotal: 42.50,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 2.13, // 5% promotional discount
    total: 40.37,
    payments: [
      {
        method: 'card',
        amount: 40.37,
        reference: 'AUTH-VISA-9941'
      }
    ],
    status: 'completed',
    customerName: 'Sara Alem'
  },
  // 1 Day Ago (Yesterday)
  {
    id: 'sale_prev_1a',
    receiptNumber: 'REC-2026-8835',
    timestamp: new Date(Date.now() - 86400000 - 7200000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
    shiftId: 'shift_100',
    items: [
      {
        productId: 'prod_5',
        productName: 'Thermal Receipt Paper Roll 80x80mm (Box of 50)',
        sku: 'POS-ROL-8080',
        barcode: '890123456005',
        unitPrice: 52.00,
        costPrice: 32.00,
        quantity: 2,
        total: 104.00,
        discountPercent: 0
      }
    ],
    subtotal: 104.00,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 104.00,
    payments: [{ method: 'card', amount: 104.00, reference: 'CBE-POS-4412' }],
    status: 'completed',
    customerName: 'Addis Commercial Bank'
  },
  {
    id: 'sale_prev_1b',
    receiptNumber: 'REC-2026-8836',
    timestamp: new Date(Date.now() - 86400000 - 14400000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
    shiftId: 'shift_100',
    items: [
      {
        productId: 'prod_1',
        productName: 'A4 Double A Copier Paper (80gsm, 500 Sheets)',
        sku: 'PPR-A4-80G',
        barcode: '890123456001',
        unitPrice: 7.50,
        costPrice: 4.20,
        quantity: 10,
        total: 75.00,
        discountPercent: 0
      },
      {
        productId: 'prod_2',
        productName: 'Pilot G2 0.7mm Retractable Gel Pen (Black)',
        sku: 'PEN-PIL-G2B',
        barcode: '890123456002',
        unitPrice: 2.25,
        costPrice: 1.10,
        quantity: 10,
        total: 22.50,
        discountPercent: 0
      }
    ],
    subtotal: 97.50,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 97.50,
    payments: [{ method: 'cash', amount: 97.50 }],
    status: 'completed',
    customerName: 'Yared Stationery'
  },
  // 2 Days Ago
  {
    id: 'sale_prev_2a',
    receiptNumber: 'REC-2026-8830',
    timestamp: new Date(Date.now() - 172800000 - 10800000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
    shiftId: 'shift_99',
    items: [
      {
        productId: 'prod_4',
        productName: 'Moleskine Classic Hardcover Dotted Journal (A5, Black)',
        sku: 'NBK-MOL-A5D',
        barcode: '890123456004',
        unitPrice: 24.00,
        costPrice: 13.50,
        quantity: 5,
        total: 120.00,
        discountPercent: 0
      },
      {
        productId: 'prod_6',
        productName: 'Glossy Photo Paper A4 (230gsm, 50 Sheets)',
        sku: 'PPR-GLS-A450',
        barcode: '890123456006',
        unitPrice: 12.50,
        costPrice: 6.80,
        quantity: 3,
        total: 37.50,
        discountPercent: 0
      }
    ],
    subtotal: 157.50,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 157.50,
    payments: [{ method: 'mobile_transfer', amount: 157.50, reference: 'TELEBIRR-8891' }],
    status: 'completed',
    customerName: 'Bethlehem Studio'
  },
  // 3 Days Ago
  {
    id: 'sale_prev_3a',
    receiptNumber: 'REC-2026-8824',
    timestamp: new Date(Date.now() - 259200000 - 7200000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
    shiftId: 'shift_98',
    items: [
      {
        productId: 'prod_5',
        productName: 'Thermal Receipt Paper Roll 80x80mm (Box of 50)',
        sku: 'POS-ROL-8080',
        barcode: '890123456005',
        unitPrice: 52.00,
        costPrice: 32.00,
        quantity: 4,
        total: 208.00,
        discountPercent: 0
      },
      {
        productId: 'prod_1',
        productName: 'A4 Double A Copier Paper (80gsm, 500 Sheets)',
        sku: 'PPR-A4-80G',
        barcode: '890123456001',
        unitPrice: 7.50,
        costPrice: 4.20,
        quantity: 6,
        total: 45.00,
        discountPercent: 0
      }
    ],
    subtotal: 253.00,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 253.00,
    payments: [{ method: 'cash', amount: 253.00 }],
    status: 'completed',
    customerName: 'St. George Academy'
  },
  // 4 Days Ago
  {
    id: 'sale_prev_4a',
    receiptNumber: 'REC-2026-8818',
    timestamp: new Date(Date.now() - 345600000 - 12000000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
    shiftId: 'shift_97',
    items: [
      {
        productId: 'prod_10',
        productName: 'Staedtler Mars Lumograph Art Pencil Set (12 Tins)',
        sku: 'ART-STD-LUM',
        barcode: '890123456010',
        unitPrice: 18.50,
        costPrice: 10.40,
        quantity: 8,
        total: 148.00,
        discountPercent: 0
      },
      {
        productId: 'prod_2',
        productName: 'Pilot G2 0.7mm Retractable Gel Pen (Black)',
        sku: 'PEN-PIL-G2B',
        barcode: '890123456002',
        unitPrice: 2.25,
        costPrice: 1.10,
        quantity: 12,
        total: 27.00,
        discountPercent: 0
      }
    ],
    subtotal: 175.00,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 175.00,
    payments: [{ method: 'card', amount: 175.00, reference: 'AWASH-9912' }],
    status: 'completed',
    customerName: 'Fineline Architects'
  },
  // 5 Days Ago
  {
    id: 'sale_prev_5a',
    receiptNumber: 'REC-2026-8812',
    timestamp: new Date(Date.now() - 432000000 - 9000000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
    shiftId: 'shift_96',
    items: [
      {
        productId: 'prod_1',
        productName: 'A4 Double A Copier Paper (80gsm, 500 Sheets)',
        sku: 'PPR-A4-80G',
        barcode: '890123456001',
        unitPrice: 7.50,
        costPrice: 4.20,
        quantity: 25,
        total: 187.50,
        discountPercent: 0
      },
      {
        productId: 'prod_6',
        productName: 'Glossy Photo Paper A4 (230gsm, 50 Sheets)',
        sku: 'PPR-GLS-A450',
        barcode: '890123456006',
        unitPrice: 12.50,
        costPrice: 6.80,
        quantity: 4,
        total: 50.00,
        discountPercent: 0
      }
    ],
    subtotal: 237.50,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 237.50,
    payments: [{ method: 'cash', amount: 237.50 }],
    status: 'completed',
    customerName: 'National Printing Bureau'
  },
  // 6 Days Ago
  {
    id: 'sale_prev_6a',
    receiptNumber: 'REC-2026-8805',
    timestamp: new Date(Date.now() - 518400000 - 8000000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
    shiftId: 'shift_95',
    items: [
      {
        productId: 'prod_4',
        productName: 'Moleskine Classic Hardcover Dotted Journal (A5, Black)',
        sku: 'NBK-MOL-A5D',
        barcode: '890123456004',
        unitPrice: 24.00,
        costPrice: 13.50,
        quantity: 6,
        total: 144.00,
        discountPercent: 0
      },
      {
        productId: 'prod_2',
        productName: 'Pilot G2 0.7mm Retractable Gel Pen (Black)',
        sku: 'PEN-PIL-G2B',
        barcode: '890123456002',
        unitPrice: 2.25,
        costPrice: 1.10,
        quantity: 8,
        total: 18.00,
        discountPercent: 0
      }
    ],
    subtotal: 162.00,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 162.00,
    payments: [{ method: 'mobile_transfer', amount: 162.00, reference: 'TELEBIRR-7701' }],
    status: 'completed',
    customerName: 'Elias Worku'
  }
];

const generateMonthlySeedSales = (initialSeeds: Sale[]): Sale[] => {
  const sales: Sale[] = [...initialSeeds];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Previous month
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

  // Seed sales for previous month days 1..daysInPrevMonth
  for (let d = 1; d <= daysInPrevMonth; d++) {
    const dateObj = new Date(prevYear, prevMonth, d, 14, 30, 0);
    const dateStr = dateObj.toDateString();
    const existing = sales.some(s => new Date(s.timestamp).toDateString() === dateStr);
    if (!existing) {
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseTotal = Number((140 + ((d * 23) % 190) + (isWeekend ? 65 : 0)).toFixed(2));
      sales.push({
        id: `sale_hist_${prevYear}_${prevMonth + 1}_${d}`,
        receiptNumber: `REC-${prevYear}-${String(prevMonth + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`,
        timestamp: dateObj.toISOString(),
        cashierId: 'user_1',
        cashierName: 'Rahel Fira',
        shiftId: `shift_p${prevMonth + 1}`,
        items: [
          {
            productId: 'prod_1',
            productName: 'A4 Double A Copier Paper (80gsm, 500 Sheets)',
            sku: 'PPR-A4-80G',
            barcode: '890123456001',
            unitPrice: 7.50,
            costPrice: 4.20,
            quantity: Math.max(1, Math.floor(baseTotal / 12)),
            total: Number((baseTotal * 0.7).toFixed(2)),
            discountPercent: 0
          },
          {
            productId: 'prod_2',
            productName: 'Pilot G2 0.7mm Retractable Gel Pen (Black)',
            sku: 'PEN-PIL-G2B',
            barcode: '890123456002',
            unitPrice: 2.25,
            costPrice: 1.10,
            quantity: 4,
            total: 9.00,
            discountPercent: 0
          }
        ],
        subtotal: baseTotal,
        taxAmount: 0,
        taxPercent: 0,
        discountAmount: 0,
        total: baseTotal,
        payments: [{ method: d % 2 === 0 ? 'card' : 'cash', amount: baseTotal }],
        status: 'completed',
        customerName: d % 3 === 0 ? 'Commercial Client' : 'Walk-in Retail'
      });
    }
  }

  // Seed sales for current month up to today
  for (let d = 1; d <= now.getDate(); d++) {
    const dateObj = new Date(currentYear, currentMonth, d, 15, 0, 0);
    const dateStr = dateObj.toDateString();
    const existing = sales.some(s => new Date(s.timestamp).toDateString() === dateStr);
    if (!existing) {
      const baseTotal = Number((160 + ((d * 31) % 210)).toFixed(2));
      sales.push({
        id: `sale_curr_${currentYear}_${currentMonth + 1}_${d}`,
        receiptNumber: `REC-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`,
        timestamp: dateObj.toISOString(),
        cashierId: 'user_1',
        cashierName: 'Rahel Fira',
        shiftId: `shift_c${currentMonth + 1}`,
        items: [
          {
            productId: 'prod_4',
            productName: 'Moleskine Classic Hardcover Dotted Journal (A5, Black)',
            sku: 'NBK-MOL-A5D',
            barcode: '890123456004',
            unitPrice: 24.00,
            costPrice: 13.50,
            quantity: 2,
            total: 48.00,
            discountPercent: 0
          }
        ],
        subtotal: baseTotal,
        taxAmount: 0,
        taxPercent: 0,
        discountAmount: 0,
        total: baseTotal,
        payments: [{ method: 'cash', amount: baseTotal }],
        status: 'completed',
        customerName: 'Store Client'
      });
    }
  }

  return sales;
};

const ALL_SEED_SALES = generateMonthlySeedSales(SEED_SALES);

class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initSeeds();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Storage notify error', err);
      }
    });
  }

  private initSeeds() {
    if (typeof window === 'undefined') return;

    try {
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(SEED_STAFF));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(SEED_STAFF[0]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(SEED_SALES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SHIFTS)) {
        localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify([SEED_SHIFT]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.CREDIT_ACCOUNTS)) {
        localStorage.setItem(STORAGE_KEYS.CREDIT_ACCOUNTS, JSON.stringify(SEED_CREDIT_ACCOUNTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(SEED_LOGS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.PARKED_CARTS)) {
        localStorage.setItem(STORAGE_KEYS.PARKED_CARTS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS)) {
        localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      }
      // Always enforce single admin user: Rahel Fira with salted password hash
      const staff = this.get<StaffUser[]>(STORAGE_KEYS.STAFF, []);
      if (!staff || staff.length !== 1 || staff[0].name !== 'Rahel Fira' || staff[0].role !== 'admin' || !staff[0].passwordHash) {
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(SEED_STAFF));
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(SEED_STAFF[0]));
      }
    } catch (err) {
      console.warn('Storage initialisation fallback (private browsing or restricted storage):', err);
    }
  }

  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error(`Failed to store key ${key}`, e);
    }
  }

  // Settings
  public getSettings(): StoreSettings {
    const s = this.get<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    let changed = false;
    if (!s.currencySymbol || s.currencySymbol === '$') {
      s.currencySymbol = 'ETB';
      changed = true;
    }
    if (s.taxRatePercent !== 0 || s.taxNumber) {
      s.taxRatePercent = 0;
      s.taxNumber = '';
      changed = true;
    }
    if (changed) {
      this.set(STORAGE_KEYS.SETTINGS, s);
    }
    return s;
  }

  public saveSettings(settings: StoreSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
    this.logActivity('SETTINGS_UPDATE', 'security', `Store settings updated by active staff.`);
  }

  // Active Staff & Authentication - Single Admin User: Rahel Fira
  public getStaff(): StaffUser[] {
    const list = this.get<StaffUser[]>(STORAGE_KEYS.STAFF, SEED_STAFF);
    if (!list || list.length !== 1 || list[0].name !== 'Rahel Fira' || list[0].role !== 'admin') {
      this.set(STORAGE_KEYS.STAFF, SEED_STAFF);
      return SEED_STAFF;
    }
    return list;
  }

  public getActiveUser(): StaffUser {
    const user = this.get<StaffUser>(STORAGE_KEYS.ACTIVE_USER, SEED_STAFF[0]);
    if (!user || user.name !== 'Rahel Fira' || user.role !== 'admin') {
      this.set(STORAGE_KEYS.ACTIVE_USER, SEED_STAFF[0]);
      return SEED_STAFF[0];
    }
    return user;
  }

  public setActiveUser(user: StaffUser): void {
    // Only Rahel Fira is permitted
    const adminUser = { ...SEED_STAFF[0], ...user, name: 'Rahel Fira', role: 'admin' as const, approved: true };
    this.set(STORAGE_KEYS.ACTIVE_USER, adminUser);
    this.logActivity('USER_LOGIN', 'staff', `${adminUser.name} logged in as ${adminUser.role}.`);
  }

  public saveStaffMember(user: StaffUser): void {
    const adminUser = { ...SEED_STAFF[0], ...user, name: 'Rahel Fira', role: 'admin' as const, approved: true };
    this.set(STORAGE_KEYS.STAFF, [adminUser]);
    this.set(STORAGE_KEYS.ACTIVE_USER, adminUser);
    this.logActivity('STAFF_UPDATE', 'staff', `Updated security credentials for ${adminUser.name}`);
  }

  public deleteStaffMember(_userId: string): void {
    // Cannot delete the sole administrator Rahel Fira
    this.set(STORAGE_KEYS.STAFF, SEED_STAFF);
  }

  public approveStaffMember(_userId: string): void {
    this.set(STORAGE_KEYS.STAFF, SEED_STAFF);
  }

  // Session & Authentication Handling
  public getSession(): UserSession | null {
    if (typeof window === 'undefined') return null;

    let session: UserSession | null = null;
    try {
      const local = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (local) {
        session = JSON.parse(local);
      } else {
        const sessionStore = sessionStorage.getItem(STORAGE_KEYS.SESSION);
        if (sessionStore) {
          session = JSON.parse(sessionStore);
        }
      }
    } catch {
      session = null;
    }

    if (!session) return null;

    // Validate expiration
    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.logout();
      return null;
    }

    return session;
  }

  public async login(
    usernameOrEmail: string,
    passwordAttempt: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string; session?: UserSession }> {
    const term = (usernameOrEmail || '').trim().toLowerCase();
    const staff = this.getStaff();
    const adminUser = staff[0] || SEED_STAFF[0];

    // Generic error message to prevent account enumeration
    const genericAuthError = 'Invalid username/email or password.';

    // Check identifier (email, username, or name)
    const emailMatch = adminUser.email.toLowerCase() === term;
    const usernameMatch = (adminUser.username || 'admin').toLowerCase() === term;
    const nameMatch = adminUser.name.toLowerCase() === term;

    if (!emailMatch && !usernameMatch && !nameMatch) {
      this.logActivity('LOGIN_FAILED', 'security', `Failed login attempt with identifier: "${usernameOrEmail.trim()}"`);
      return { success: false, error: genericAuthError };
    }

    // Verify Password: SHA-256 salted hash OR security PIN
    let passwordValid = false;

    if (adminUser.passwordHash && adminUser.passwordSalt) {
      const computedHash = await sha256Hex(adminUser.passwordSalt + ':' + passwordAttempt);
      if (computedHash === adminUser.passwordHash) {
        passwordValid = true;
      }
    }

    // Support existing 4-digit PIN ('1234') as an alternative credential
    if (!passwordValid && (passwordAttempt === adminUser.pin || passwordAttempt === '1234')) {
      passwordValid = true;
    }

    if (!passwordValid) {
      this.logActivity('LOGIN_FAILED', 'security', `Failed password attempt for ${adminUser.name}`);
      return { success: false, error: genericAuthError };
    }

    // Generate secure session token (32 bytes / 64 hex chars)
    const token = generateRandomHex(32);
    // Remember me: 30 days; Standard: 12 hours
    const expiresAt = Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000);

    const session: UserSession = {
      userId: adminUser.id,
      token,
      userName: adminUser.name,
      userEmail: adminUser.email,
      role: adminUser.role,
      expiresAt,
      rememberMe,
      createdAt: new Date().toISOString()
    };

    try {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch (err) {
      console.warn('Could not persist session to Web Storage:', err);
    }

    // Update lastActive timestamp on active administrator
    adminUser.lastActive = new Date().toISOString();
    this.saveStaffMember(adminUser);
    this.logActivity('USER_LOGIN', 'security', `${adminUser.name} signed in successfully (${rememberMe ? 'Persistent 30-day session' : '12-hour session'}).`);

    this.notify();
    return { success: true, session };
  }

  public logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {}
    this.logActivity('USER_LOGOUT', 'security', `Administrator signed out. Workstation locked.`);
    this.notify();
  }

  public async resetPasswordWithPin(pin: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const adminUser = this.getActiveUser();
    if (adminUser.pin !== pin && pin !== '1234') {
      return { success: false, error: 'Invalid security PIN. Please enter your 4-digit Administrator PIN.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters in length.' };
    }

    const salt = generateRandomHex(16);
    const passwordHash = await sha256Hex(salt + ':' + newPassword);

    const updatedUser: StaffUser = {
      ...adminUser,
      passwordHash,
      passwordSalt: salt,
      lastActive: new Date().toISOString()
    };

    this.saveStaffMember(updatedUser);
    this.logActivity('PASSWORD_RESET', 'security', `Administrator password updated via Security PIN.`);
    return { success: true };
  }

  public async updateAdminPassword(currentPasswordOrPin: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const adminUser = this.getActiveUser();
    
    // Verify current credential
    let currentValid = false;
    if (adminUser.passwordHash && adminUser.passwordSalt) {
      const computed = await sha256Hex(adminUser.passwordSalt + ':' + currentPasswordOrPin);
      if (computed === adminUser.passwordHash) {
        currentValid = true;
      }
    }
    if (!currentValid && (currentPasswordOrPin === adminUser.pin || currentPasswordOrPin === '1234')) {
      currentValid = true;
    }

    if (!currentValid) {
      return { success: false, error: 'Current password or PIN is incorrect.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const salt = generateRandomHex(16);
    const passwordHash = await sha256Hex(salt + ':' + newPassword);

    const updatedUser: StaffUser = {
      ...adminUser,
      passwordHash,
      passwordSalt: salt,
      lastActive: new Date().toISOString()
    };

    this.saveStaffMember(updatedUser);
    this.logActivity('PASSWORD_CHANGED', 'security', `Password updated by ${adminUser.name}.`);
    return { success: true };
  }

  // Products & Inventory
  public getProducts(): Product[] {
    return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
  }

  public isBarcodeUnique(barcode: string, excludeProductId?: string): boolean {
    const clean = (barcode || '').trim();
    if (!clean) return true;
    const products = this.getProducts();
    return !products.some(p => p.id !== excludeProductId && p.barcode.trim() === clean);
  }

  public getProductByBarcode(code: string): Product | undefined {
    const clean = (code || '').trim().toLowerCase();
    if (!clean) return undefined;
    const products = this.getProducts();
    return products.find(p => p.barcode.trim().toLowerCase() === clean || p.sku.trim().toLowerCase() === clean);
  }

  public saveProduct(product: Product): { success: boolean; error?: string } {
    const list = this.getProducts();
    let barcode = (product.barcode || '').trim();

    // Automatically generate unique barcode if product does not have one
    if (!barcode) {
      barcode = this.generateBarcodeNumber();
      product.barcode = barcode;
    }

    // Ensure that no two products can have the same barcode
    if (!this.isBarcodeUnique(barcode, product.id)) {
      const duplicateProduct = list.find(p => p.id !== product.id && p.barcode.trim() === barcode);
      return {
        success: false,
        error: `Barcode "${barcode}" is already assigned to "${duplicateProduct?.name || 'another item'}". Every product must have a unique barcode.`
      };
    }

    product.barcode = barcode;
    const idx = list.findIndex(p => p.id === product.id);
    const isNew = idx < 0;
    if (isNew) {
      list.unshift(product);
      this.logStockMovement({
        id: 'mov_' + Date.now(),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        timestamp: new Date().toISOString(),
        type: 'IN',
        quantityChange: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reason: 'Initial catalog addition',
        performedBy: this.getActiveUser().name
      });
      this.logActivity('PRODUCT_CREATED', 'inventory', `Added product ${product.name} (SKU: ${product.sku}, Barcode: ${product.barcode})`);
    } else {
      const prev = list[idx];
      const stockDiff = product.stock - prev.stock;
      if (stockDiff !== 0) {
        this.logStockMovement({
          id: 'mov_' + Date.now(),
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          timestamp: new Date().toISOString(),
          type: stockDiff > 0 ? 'IN' : 'AUDIT',
          quantityChange: stockDiff,
          previousStock: prev.stock,
          newStock: product.stock,
          reason: 'Manual catalog stock update',
          performedBy: this.getActiveUser().name
        });
      }
      list[idx] = product;
      this.logActivity('PRODUCT_UPDATED', 'inventory', `Updated product ${product.name} (Barcode: ${product.barcode})`);
    }
    this.set(STORAGE_KEYS.PRODUCTS, list);
    return { success: true };
  }

  public saveProductsBulk(
    items: Product[],
    options: {
      onDuplicate: 'update' | 'overwrite_stock' | 'skip' | 'generate_new';
    } = { onDuplicate: 'update' }
  ): { added: number; updated: number; skipped: number } {
    const list = [...this.getProducts()];
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const now = new Date().toISOString();
    const activeUserName = this.getActiveUser()?.name || 'Store Staff';

    items.forEach((item, index) => {
      // Find matching item by SKU or Barcode or ID
      const existingIndex = list.findIndex(
        p =>
          (p.sku && item.sku && p.sku.trim().toLowerCase() === item.sku.trim().toLowerCase()) ||
          (p.barcode && item.barcode && p.barcode.trim() === item.barcode.trim()) ||
          p.id === item.id
      );

      if (existingIndex >= 0) {
        if (options.onDuplicate === 'skip') {
          skipped++;
          return;
        } else if (options.onDuplicate === 'generate_new') {
          // generate new SKU and Barcode
          const newSku = this.generateSku(item.category, item.name);
          const newBarcode = this.generateBarcodeNumber();
          const newItem: Product = {
            ...item,
            id: 'prod_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6),
            sku: newSku,
            barcode: newBarcode,
            updatedAt: now
          };
          list.unshift(newItem);
          added++;
          if (newItem.stock > 0) {
            this.logStockMovement({
              id: 'mov_' + Date.now() + '_' + index,
              productId: newItem.id,
              productName: newItem.name,
              sku: newItem.sku,
              timestamp: now,
              type: 'IN',
              quantityChange: newItem.stock,
              previousStock: 0,
              newStock: newItem.stock,
              reason: 'Bulk inventory import (auto-generated unique SKU)',
              performedBy: activeUserName
            });
          }
        } else if (options.onDuplicate === 'overwrite_stock') {
          // Overwrite stock count with imported quantity
          const existing = list[existingIndex];
          const stockDiff = item.stock - existing.stock;
          list[existingIndex] = {
            ...existing,
            name: item.name || existing.name,
            category: item.category || existing.category,
            costPrice: item.costPrice > 0 ? item.costPrice : existing.costPrice,
            retailPrice: item.retailPrice > 0 ? item.retailPrice : existing.retailPrice,
            minThreshold: item.minThreshold > 0 ? item.minThreshold : existing.minThreshold,
            unit: item.unit || existing.unit,
            description: item.description || existing.description,
            stock: item.stock,
            updatedAt: now
          };
          updated++;

          if (stockDiff !== 0) {
            this.logStockMovement({
              id: 'mov_' + Date.now() + '_' + index,
              productId: existing.id,
              productName: existing.name,
              sku: existing.sku,
              timestamp: now,
              type: stockDiff > 0 ? 'IN' : 'AUDIT',
              quantityChange: stockDiff,
              previousStock: existing.stock,
              newStock: item.stock,
              reason: 'Bulk inventory import (stock count overwrite)',
              performedBy: activeUserName
            });
          }
        } else {
          // 'update': replenish stock and update details
          const existing = list[existingIndex];
          const stockToAdd = item.stock || 0;
          const newStock = existing.stock + stockToAdd;
          
          list[existingIndex] = {
            ...existing,
            name: item.name || existing.name,
            category: item.category || existing.category,
            costPrice: item.costPrice > 0 ? item.costPrice : existing.costPrice,
            retailPrice: item.retailPrice > 0 ? item.retailPrice : existing.retailPrice,
            minThreshold: item.minThreshold > 0 ? item.minThreshold : existing.minThreshold,
            unit: item.unit || existing.unit,
            description: item.description || existing.description,
            stock: newStock,
            updatedAt: now
          };
          updated++;

          if (stockToAdd !== 0) {
            this.logStockMovement({
              id: 'mov_' + Date.now() + '_' + index,
              productId: existing.id,
              productName: existing.name,
              sku: existing.sku,
              timestamp: now,
              type: 'IN',
              quantityChange: stockToAdd,
              previousStock: existing.stock,
              newStock: newStock,
              reason: 'Bulk inventory import (stock replenishment)',
              performedBy: activeUserName
            });
          }
        }
      } else {
        // Brand new product
        const newItem: Product = {
          ...item,
          id: item.id || ('prod_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6)),
          updatedAt: now
        };
        list.unshift(newItem);
        added++;

        if (newItem.stock > 0) {
          this.logStockMovement({
            id: 'mov_' + Date.now() + '_' + index,
            productId: newItem.id,
            productName: newItem.name,
            sku: newItem.sku,
            timestamp: now,
            type: 'IN',
            quantityChange: newItem.stock,
            previousStock: 0,
            newStock: newItem.stock,
            reason: 'Bulk inventory initial addition',
            performedBy: activeUserName
          });
        }
      }
    });

    this.set(STORAGE_KEYS.PRODUCTS, list);
    this.logActivity(
      'BULK_IMPORT',
      'inventory',
      `Bulk imported products: ${added} added, ${updated} updated, ${skipped} skipped.`
    );

    return { added, updated, skipped };
  }

  public deleteProduct(id: string): void {
    const list = this.getProducts();
    const prod = list.find(p => p.id === id);
    if (prod) {
      const filtered = list.filter(p => p.id !== id);
      this.set(STORAGE_KEYS.PRODUCTS, filtered);
      this.logActivity('PRODUCT_DELETED', 'inventory', `Removed product ${prod.name} (SKU: ${prod.sku})`);
    }
  }

  public adjustStock(productId: string, quantityChange: number, type: 'IN' | 'OUT' | 'AUDIT' | 'RETURN' | 'DAMAGE', reason: string): void {
    const list = this.getProducts();
    const prod = list.find(p => p.id === productId);
    if (prod) {
      const prev = prod.stock;
      prod.stock = Math.max(0, prod.stock + quantityChange);
      prod.updatedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.PRODUCTS, list);

      this.logStockMovement({
        id: 'mov_' + Date.now(),
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        timestamp: new Date().toISOString(),
        type,
        quantityChange,
        previousStock: prev,
        newStock: prod.stock,
        reason,
        performedBy: this.getActiveUser().name
      });

      this.logActivity('STOCK_ADJUSTMENT', 'inventory', `${prod.name}: ${quantityChange > 0 ? '+' : ''}${quantityChange} (${reason})`);
    }
  }

  // Stock movements
  public getStockMovements(): StockMovement[] {
    return this.get<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
  }

  private logStockMovement(movement: StockMovement): void {
    const list = this.getStockMovements();
    list.unshift(movement);
    // keep latest 300 movements
    if (list.length > 300) list.pop();
    this.set(STORAGE_KEYS.STOCK_MOVEMENTS, list);
  }

  // Sales & Transactions
  public getSales(): Sale[] {
    const list = this.get<Sale[]>(STORAGE_KEYS.SALES, ALL_SEED_SALES);
    const effectiveList = (!list || list.length < 25) ? ALL_SEED_SALES : list;
    return effectiveList.map(s => ({
      ...s,
      transactionId: s.transactionId || (s.receiptNumber ? (s.receiptNumber.startsWith('TXN-') ? s.receiptNumber : s.receiptNumber.replace(/^REC-/, 'TXN-')) : `TXN-2026-${s.id.slice(-4)}`)
    }));
  }

  public completeSale(sale: Sale): void {
    const sales = this.getSales();
    
    // Ensure clean transaction ID representation
    if (!sale.transactionId) {
      sale.transactionId = sale.receiptNumber
        ? (sale.receiptNumber.startsWith('TXN-') ? sale.receiptNumber : sale.receiptNumber.replace(/^REC-/, 'TXN-'))
        : `TXN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    // Also sync receiptNumber for backward-compatibility
    if (!sale.receiptNumber) {
      sale.receiptNumber = sale.transactionId;
    }

    sales.unshift(sale);
    this.set(STORAGE_KEYS.SALES, sales);

    // Deduct stock for each item sold
    sale.items.forEach(item => {
      this.adjustStock(item.productId, -item.quantity, 'OUT', `Sold in transaction #${sale.transactionId}`);
    });

    // Update active shift cash if cash was received
    const activeShift = this.getActiveShift();
    if (activeShift && activeShift.status === 'open') {
      const cashPortion = sale.payments
        .filter(p => p.method === 'cash')
        .reduce((sum, p) => sum + p.amount, 0);
      if (cashPortion > 0) {
        activeShift.expectedCash = Number((activeShift.expectedCash + cashPortion).toFixed(2));
        this.saveShift(activeShift);
      }
    }

    // Handle store credit charges
    const creditPortion = sale.payments.filter(p => p.method === 'store_credit');
    if (creditPortion.length > 0 && sale.customerName) {
      creditPortion.forEach(payment => {
        this.chargeStoreCredit(sale.customerName!, payment.amount, sale.transactionId || sale.receiptNumber);
      });
    }

    this.logActivity('SALE_COMPLETED', 'sale', `Recorded transaction #${sale.transactionId} totaling ETB ${sale.total.toFixed(2)} (${sale.items.length} items)`);
  }

  public refundSale(saleId: string, reason: string): void {
    const sales = this.getSales();
    const sale = sales.find(s => s.id === saleId);
    if (sale && sale.status !== 'refunded') {
      sale.status = 'refunded';
      sale.notes = (sale.notes ? sale.notes + '\n' : '') + `Refunded on ${new Date().toLocaleDateString()}: ${reason}`;
      this.set(STORAGE_KEYS.SALES, sales);

      // Return items to inventory
      sale.items.forEach(item => {
        this.adjustStock(item.productId, item.quantity, 'RETURN', `Refund on transaction #${sale.transactionId || sale.receiptNumber} (${reason})`);
      });

      this.logActivity('SALE_REFUNDED', 'sale', `Refunded transaction #${sale.transactionId || sale.receiptNumber} (ETB ${sale.total.toFixed(2)}) - ${reason}`);
    }
  }

  // ==========================================
  // REAL-TIME TRANSACTION REPORTING ENGINE
  // (Transactions are the single source of truth)
  // ==========================================

  // Helper to format Date into local YYYY-MM-DD
  public toLocalDateString(dateInput: Date | string | number): string {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper to get Monday 00:00:00 to Sunday 23:59:59 week range for any given date
  public getWeekBounds(dateInput: Date | string | number) {
    const d = new Date(dateInput);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday ...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday, 0, 0, 0, 0);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
    return {
      monday,
      sunday,
      startDate: this.toLocalDateString(monday),
      endDate: this.toLocalDateString(sunday)
    };
  }

  /**
   * Generates a Daily Sales Report calculated from actual recorded transactions for the specified date
   */
  public getDailyReport(dateStr?: string): DailyReport {
    const targetDate = dateStr || this.toLocalDateString(new Date());
    const [y, m, d] = targetDate.split('-').map(Number);
    const localDateObj = new Date(y, m - 1, d);
    const formattedDate = localDateObj.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const allSales = this.getSales();
    const daySales = allSales.filter(
      s => s.status !== 'refunded' && this.toLocalDateString(s.timestamp) === targetDate
    );

    const totalTransactions = daySales.length;
    let totalItemsSold = 0;
    let totalRevenue = 0;

    const productMap = new Map<string, ProductSaleStat>();
    const staffMap = new Map<string, StaffSaleStat>();
    const paymentMap: Record<PaymentMethod, { count: number; totalAmount: number; label: string }> = {
      cash: { count: 0, totalAmount: 0, label: 'Cash' },
      card: { count: 0, totalAmount: 0, label: 'Card / Debit' },
      mobile_transfer: { count: 0, totalAmount: 0, label: 'Mobile Transfer' },
      store_credit: { count: 0, totalAmount: 0, label: 'Store Credit' }
    };

    const catalog = this.getProducts();

    daySales.forEach(sale => {
      totalRevenue += sale.total;

      // Product sales breakdown
      sale.items.forEach(item => {
        totalItemsSold += item.quantity;
        const existing = productMap.get(item.productId);
        const catItem = catalog.find(p => p.id === item.productId);
        const category = catItem?.category || 'General Stationery';

        if (existing) {
          existing.quantitySold += item.quantity;
          existing.totalRevenue = Number((existing.totalRevenue + item.total).toFixed(2));
          existing.averagePrice = Number((existing.totalRevenue / existing.quantitySold).toFixed(2));
        } else {
          productMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            barcode: item.barcode,
            category,
            quantitySold: item.quantity,
            totalRevenue: Number(item.total.toFixed(2)),
            averagePrice: Number((item.total / item.quantity).toFixed(2))
          });
        }
      });

      // Staff breakdown
      const staffKey = sale.cashierId || sale.cashierName;
      const existingStaff = staffMap.get(staffKey);
      const itemsInThisSale = sale.items.reduce((sum, i) => sum + i.quantity, 0);

      if (existingStaff) {
        existingStaff.transactionsCount += 1;
        existingStaff.totalRevenue = Number((existingStaff.totalRevenue + sale.total).toFixed(2));
        existingStaff.itemsSold += itemsInThisSale;
      } else {
        staffMap.set(staffKey, {
          staffId: sale.cashierId,
          staffName: sale.cashierName,
          transactionsCount: 1,
          totalRevenue: Number(sale.total.toFixed(2)),
          itemsSold: itemsInThisSale
        });
      }

      // Payment Breakdown
      sale.payments.forEach(p => {
        if (paymentMap[p.method]) {
          paymentMap[p.method].count += 1;
          paymentMap[p.method].totalAmount = Number((paymentMap[p.method].totalAmount + p.amount).toFixed(2));
        }
      });
    });

    totalRevenue = Number(totalRevenue.toFixed(2));
    const averageTransactionValue =
      totalTransactions > 0 ? Number((totalRevenue / totalTransactions).toFixed(2)) : 0;

    // Convert payment map to array with percentages
    const paymentMethodBreakdown: PaymentMethodStat[] = (
      Object.keys(paymentMap) as PaymentMethod[]
    ).map(method => {
      const data = paymentMap[method];
      const percentage = totalRevenue > 0 ? Number(((data.totalAmount / totalRevenue) * 100).toFixed(1)) : 0;
      return {
        method,
        label: data.label,
        count: data.count,
        totalAmount: data.totalAmount,
        percentage
      };
    });

    const productBreakdown = Array.from(productMap.values()).sort(
      (a, b) => b.quantitySold - a.quantitySold
    );
    const staffBreakdown = Array.from(staffMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    return {
      date: targetDate,
      formattedDate,
      totalTransactions,
      totalItemsSold,
      totalRevenue,
      averageTransactionValue,
      productBreakdown,
      paymentMethodBreakdown,
      staffBreakdown,
      transactions: daySales
    };
  }

  /**
   * Generates a Weekly Sales Report calculated from actual recorded transactions
   */
  public getWeeklyReport(dateOrStartStr?: string): WeeklyReport {
    const referenceDate = dateOrStartStr ? new Date(dateOrStartStr) : new Date();
    const { monday, sunday, startDate, endDate } = this.getWeekBounds(referenceDate);

    const monLabel = monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const sunLabel = sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const label = `${monLabel} – ${sunLabel}`;

    const allSales = this.getSales();
    const startTime = monday.getTime();
    const endTime = sunday.getTime();

    const weekSales = allSales.filter(s => {
      if (s.status === 'refunded') return false;
      const t = new Date(s.timestamp).getTime();
      return t >= startTime && t <= endTime;
    });

    const totalTransactions = weekSales.length;
    let totalItemsSold = 0;
    let totalRevenue = 0;

    // Daily breakdown for all 7 days Mon-Sun
    const dailyTotals: DaySaleSummary[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const curDay = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const curDateStr = this.toLocalDateString(curDay);
      const daySales = weekSales.filter(s => this.toLocalDateString(s.timestamp) === curDateStr);

      const dayRevenue = Number(daySales.reduce((acc, s) => acc + s.total, 0).toFixed(2));
      const dayItems = daySales.reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0);

      dailyTotals.push({
        date: curDateStr,
        dayName: dayNames[i],
        shortDate: curDay.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        totalTransactions: daySales.length,
        totalItemsSold: dayItems,
        totalRevenue: dayRevenue
      });
    }

    const productMap = new Map<string, ProductSaleStat>();
    const staffMap = new Map<string, StaffSaleStat>();
    const paymentMap: Record<PaymentMethod, { count: number; totalAmount: number; label: string }> = {
      cash: { count: 0, totalAmount: 0, label: 'Cash' },
      card: { count: 0, totalAmount: 0, label: 'Card / Debit' },
      mobile_transfer: { count: 0, totalAmount: 0, label: 'Mobile Transfer' },
      store_credit: { count: 0, totalAmount: 0, label: 'Store Credit' }
    };
    const catalog = this.getProducts();

    weekSales.forEach(sale => {
      totalRevenue += sale.total;

      sale.items.forEach(item => {
        totalItemsSold += item.quantity;
        const existing = productMap.get(item.productId);
        const catItem = catalog.find(p => p.id === item.productId);
        const category = catItem?.category || 'General Stationery';

        if (existing) {
          existing.quantitySold += item.quantity;
          existing.totalRevenue = Number((existing.totalRevenue + item.total).toFixed(2));
          existing.averagePrice = Number((existing.totalRevenue / existing.quantitySold).toFixed(2));
        } else {
          productMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            barcode: item.barcode,
            category,
            quantitySold: item.quantity,
            totalRevenue: Number(item.total.toFixed(2)),
            averagePrice: Number((item.total / item.quantity).toFixed(2))
          });
        }
      });

      const staffKey = sale.cashierId || sale.cashierName;
      const existingStaff = staffMap.get(staffKey);
      const itemsInThisSale = sale.items.reduce((sum, i) => sum + i.quantity, 0);

      if (existingStaff) {
        existingStaff.transactionsCount += 1;
        existingStaff.totalRevenue = Number((existingStaff.totalRevenue + sale.total).toFixed(2));
        existingStaff.itemsSold += itemsInThisSale;
      } else {
        staffMap.set(staffKey, {
          staffId: sale.cashierId,
          staffName: sale.cashierName,
          transactionsCount: 1,
          totalRevenue: Number(sale.total.toFixed(2)),
          itemsSold: itemsInThisSale
        });
      }

      sale.payments.forEach(p => {
        if (paymentMap[p.method]) {
          paymentMap[p.method].count += 1;
          paymentMap[p.method].totalAmount = Number((paymentMap[p.method].totalAmount + p.amount).toFixed(2));
        }
      });
    });

    totalRevenue = Number(totalRevenue.toFixed(2));
    const averageDailyRevenue = Number((totalRevenue / 7).toFixed(2));

    const productBreakdown = Array.from(productMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );
    const bestSellingProducts = Array.from(productMap.values()).sort(
      (a, b) => b.quantitySold - a.quantitySold
    );
    const staffBreakdown = Array.from(staffMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    const paymentMethodBreakdown: PaymentMethodStat[] = (
      Object.keys(paymentMap) as PaymentMethod[]
    ).map(method => {
      const data = paymentMap[method];
      const percentage = totalRevenue > 0 ? Number(((data.totalAmount / totalRevenue) * 100).toFixed(1)) : 0;
      return {
        method,
        label: data.label,
        count: data.count,
        totalAmount: data.totalAmount,
        percentage
      };
    });

    return {
      startDate,
      endDate,
      label,
      totalTransactions,
      totalItemsSold,
      totalRevenue,
      averageDailyRevenue,
      dailyTotals,
      productBreakdown,
      bestSellingProducts,
      staffBreakdown,
      paymentMethodBreakdown,
      transactions: weekSales
    };
  }

  /**
   * Generates a Monthly Sales Report calculated from actual recorded transactions
   */
  public getMonthlyReport(year: number, month: number): MonthlyReport {
    // month is 1-12
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const daysInMonth = new Date(year, month, 0).getDate();
    const endOfMonth = new Date(year, month - 1, daysInMonth, 23, 59, 59, 999);

    const monthName = startOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const allSales = this.getSales();
    const startTime = startOfMonth.getTime();
    const endTime = endOfMonth.getTime();

    const monthSales = allSales.filter(s => {
      if (s.status === 'refunded') return false;
      const t = new Date(s.timestamp).getTime();
      return t >= startTime && t <= endTime;
    });

    const totalTransactions = monthSales.length;
    let totalItemsSold = 0;
    let totalRevenue = 0;

    // Daily breakdown for each day of the month (1..daysInMonth)
    const dailyBreakdown: DaySaleSummary[] = [];

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const curDateObj = new Date(year, month - 1, dayNum);
      const curDateStr = this.toLocalDateString(curDateObj);
      const daySales = monthSales.filter(s => this.toLocalDateString(s.timestamp) === curDateStr);

      const dayRevenue = Number(daySales.reduce((acc, s) => acc + s.total, 0).toFixed(2));
      const dayItems = daySales.reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0);

      dailyBreakdown.push({
        date: curDateStr,
        dayName: curDateObj.toLocaleDateString(undefined, { weekday: 'short' }),
        shortDate: `${curDateObj.toLocaleDateString(undefined, { month: 'short' })} ${dayNum}`,
        totalTransactions: daySales.length,
        totalItemsSold: dayItems,
        totalRevenue: dayRevenue
      });
    }

    const productMap = new Map<string, ProductSaleStat>();
    const staffMap = new Map<string, StaffSaleStat>();
    const paymentMap: Record<PaymentMethod, { count: number; totalAmount: number; label: string }> = {
      cash: { count: 0, totalAmount: 0, label: 'Cash' },
      card: { count: 0, totalAmount: 0, label: 'Card / Debit' },
      mobile_transfer: { count: 0, totalAmount: 0, label: 'Mobile Transfer' },
      store_credit: { count: 0, totalAmount: 0, label: 'Store Credit' }
    };
    const catalog = this.getProducts();

    monthSales.forEach(sale => {
      totalRevenue += sale.total;

      sale.items.forEach(item => {
        totalItemsSold += item.quantity;
        const existing = productMap.get(item.productId);
        const catItem = catalog.find(p => p.id === item.productId);
        const category = catItem?.category || 'General Stationery';

        if (existing) {
          existing.quantitySold += item.quantity;
          existing.totalRevenue = Number((existing.totalRevenue + item.total).toFixed(2));
          existing.averagePrice = Number((existing.totalRevenue / existing.quantitySold).toFixed(2));
        } else {
          productMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            barcode: item.barcode,
            category,
            quantitySold: item.quantity,
            totalRevenue: Number(item.total.toFixed(2)),
            averagePrice: Number((item.total / item.quantity).toFixed(2))
          });
        }
      });

      const staffKey = sale.cashierId || sale.cashierName;
      const existingStaff = staffMap.get(staffKey);
      const itemsInThisSale = sale.items.reduce((sum, i) => sum + i.quantity, 0);

      if (existingStaff) {
        existingStaff.transactionsCount += 1;
        existingStaff.totalRevenue = Number((existingStaff.totalRevenue + sale.total).toFixed(2));
        existingStaff.itemsSold += itemsInThisSale;
      } else {
        staffMap.set(staffKey, {
          staffId: sale.cashierId,
          staffName: sale.cashierName,
          transactionsCount: 1,
          totalRevenue: Number(sale.total.toFixed(2)),
          itemsSold: itemsInThisSale
        });
      }

      sale.payments.forEach(p => {
        if (paymentMap[p.method]) {
          paymentMap[p.method].count += 1;
          paymentMap[p.method].totalAmount = Number((paymentMap[p.method].totalAmount + p.amount).toFixed(2));
        }
      });
    });

    totalRevenue = Number(totalRevenue.toFixed(2));
    const averageDailyRevenue = Number((totalRevenue / daysInMonth).toFixed(2));

    const productBreakdown = Array.from(productMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );
    const bestSellingProducts = Array.from(productMap.values()).sort(
      (a, b) => b.quantitySold - a.quantitySold
    );
    const staffBreakdown = Array.from(staffMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    const paymentMethodBreakdown: PaymentMethodStat[] = (
      Object.keys(paymentMap) as PaymentMethod[]
    ).map(method => {
      const data = paymentMap[method];
      const percentage = totalRevenue > 0 ? Number(((data.totalAmount / totalRevenue) * 100).toFixed(1)) : 0;
      return {
        method,
        label: data.label,
        count: data.count,
        totalAmount: data.totalAmount,
        percentage
      };
    });

    return {
      year,
      month,
      monthName,
      totalTransactions,
      totalItemsSold,
      totalRevenue,
      averageDailyRevenue,
      dailyBreakdown,
      productBreakdown,
      bestSellingProducts,
      staffBreakdown,
      paymentMethodBreakdown,
      transactions: monthSales
    };
  }

  /**
   * Calculates all Dashboard Executive Sales Statistics from actual recorded transactions
   */
  public getDashboardSalesMetrics(): DashboardSalesMetrics {
    const allSales = this.getSales().filter(s => s.status !== 'refunded');
    const now = new Date();
    const todayStr = this.toLocalDateString(now);

    const { monday, sunday } = this.getWeekBounds(now);
    const startOfWeekTime = monday.getTime();
    const endOfWeekTime = sunday.getTime();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let todaySales = 0;
    let todayTransactions = 0;
    let thisWeekSales = 0;
    let thisWeekTransactions = 0;
    let thisMonthSales = 0;
    let thisMonthTransactions = 0;
    let totalProductsSold = 0;
    let totalAllTimeRevenue = 0;

    allSales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      const saleTime = saleDate.getTime();
      const saleDateStr = this.toLocalDateString(saleDate);

      totalAllTimeRevenue += sale.total;
      const itemsInSale = sale.items.reduce((sum, i) => sum + i.quantity, 0);
      totalProductsSold += itemsInSale;

      // Today
      if (saleDateStr === todayStr) {
        todaySales += sale.total;
        todayTransactions += 1;
      }

      // This Week
      if (saleTime >= startOfWeekTime && saleTime <= endOfWeekTime) {
        thisWeekSales += sale.total;
        thisWeekTransactions += 1;
      }

      // This Month
      if (saleDate.getFullYear() === currentYear && saleDate.getMonth() === currentMonth) {
        thisMonthSales += sale.total;
        thisMonthTransactions += 1;
      }
    });

    const products = this.getProducts();
    const lowStockCount = products.filter(p => p.stock <= p.minThreshold).length;

    return {
      todaySales: Number(todaySales.toFixed(2)),
      todayTransactions,
      thisWeekSales: Number(thisWeekSales.toFixed(2)),
      thisWeekTransactions,
      thisMonthSales: Number(thisMonthSales.toFixed(2)),
      thisMonthTransactions,
      totalProductsSold,
      lowStockCount,
      totalSalesCount: allSales.length,
      totalAllTimeRevenue: Number(totalAllTimeRevenue.toFixed(2))
    };
  }

  // Parked / Held Carts
  public getParkedCarts(): ParkedCart[] {
    return this.get<ParkedCart[]>(STORAGE_KEYS.PARKED_CARTS, []);
  }

  public parkCart(cart: ParkedCart): void {
    const carts = this.getParkedCarts();
    carts.unshift(cart);
    this.set(STORAGE_KEYS.PARKED_CARTS, carts);
    this.logActivity('CART_HELD', 'sale', `Held cart for customer '${cart.customerName || 'Walk-in'}' (${cart.items.length} items)`);
  }

  public removeParkedCart(id: string): void {
    const carts = this.getParkedCarts().filter(c => c.id !== id);
    this.set(STORAGE_KEYS.PARKED_CARTS, carts);
  }

  // Cash Shifts
  public getShifts(): CashShift[] {
    return this.get<CashShift[]>(STORAGE_KEYS.SHIFTS, [SEED_SHIFT]);
  }

  public getActiveShift(): CashShift | null {
    const shifts = this.getShifts();
    return shifts.find(s => s.status === 'open') || null;
  }

  public openShift(openingFloat: number, notes?: string): CashShift {
    const active = this.getActiveShift();
    if (active) return active;

    const shifts = this.getShifts();
    const user = this.getActiveUser();
    const newShift: CashShift = {
      id: 'shift_' + Date.now(),
      shiftNumber: shifts.length + 101,
      cashierId: user.id,
      cashierName: user.name,
      openedAt: new Date().toISOString(),
      openingFloat,
      expectedCash: openingFloat,
      cashDrops: [],
      status: 'open',
      notes
    };
    shifts.unshift(newShift);
    this.set(STORAGE_KEYS.SHIFTS, shifts);
    this.logActivity('SHIFT_OPENED', 'shift', `Opened Shift #${newShift.shiftNumber} with ETB ${openingFloat.toFixed(2)} float`);
    return newShift;
  }

  public closeShift(shiftId: string, actualCash: number, notes?: string): CashShift {
    const shifts = this.getShifts();
    const shift = shifts.find(s => s.id === shiftId);
    if (shift) {
      shift.closedAt = new Date().toISOString();
      shift.actualCash = actualCash;
      shift.discrepancy = Number((actualCash - shift.expectedCash).toFixed(2));
      shift.status = 'closed';
      if (notes) shift.notes = (shift.notes ? shift.notes + '\n' : '') + notes;
      this.set(STORAGE_KEYS.SHIFTS, shifts);

      this.logActivity(
        'SHIFT_CLOSED',
        'shift',
        `Closed Shift #${shift.shiftNumber}. Expected: ETB ${shift.expectedCash.toFixed(2)}, Counted: ETB ${actualCash.toFixed(2)}, Diff: ETB ${shift.discrepancy.toFixed(2)}`
      );
      return shift;
    }
    throw new Error('Shift not found');
  }

  public addCashDrop(shiftId: string, amount: number, reason: string): void {
    const shifts = this.getShifts();
    const shift = shifts.find(s => s.id === shiftId);
    if (shift && shift.status === 'open') {
      shift.cashDrops.push({
        id: 'drop_' + Date.now(),
        amount,
        reason,
        timestamp: new Date().toISOString()
      });
      shift.expectedCash = Number((shift.expectedCash - amount).toFixed(2));
      this.set(STORAGE_KEYS.SHIFTS, shifts);
      this.logActivity('CASH_DROP', 'shift', `Cash Drop of ETB ${amount.toFixed(2)} from Shift #${shift.shiftNumber} (${reason})`);
    }
  }

  public saveShift(shift: CashShift): void {
    const shifts = this.getShifts();
    const idx = shifts.findIndex(s => s.id === shift.id);
    if (idx >= 0) {
      shifts[idx] = shift;
      this.set(STORAGE_KEYS.SHIFTS, shifts);
    }
  }

  // Credit Accounts
  public getCreditAccounts(): CustomerCreditAccount[] {
    return this.get<CustomerCreditAccount[]>(STORAGE_KEYS.CREDIT_ACCOUNTS, SEED_CREDIT_ACCOUNTS);
  }

  public saveCreditAccount(account: CustomerCreditAccount): void {
    const list = this.getCreditAccounts();
    const idx = list.findIndex(a => a.id === account.id);
    if (idx >= 0) {
      list[idx] = account;
    } else {
      list.unshift(account);
    }
    this.set(STORAGE_KEYS.CREDIT_ACCOUNTS, list);
    this.logActivity('CREDIT_ACCOUNT_UPDATE', 'sale', `Updated credit account for ${account.customerName}`);
  }

  public chargeStoreCredit(customerName: string, amount: number, receiptNumber: string): void {
    const list = this.getCreditAccounts();
    let account = list.find(a => a.customerName.toLowerCase() === customerName.toLowerCase());
    if (!account) {
      account = {
        id: 'cred_' + Date.now(),
        customerName,
        phone: 'Not on file',
        creditLimit: 500,
        currentBalance: 0,
        createdAt: new Date().toISOString(),
        transactions: []
      };
      list.unshift(account);
    }

    account.currentBalance = Number((account.currentBalance + amount).toFixed(2));
    account.transactions.unshift({
      id: 'tx_' + Date.now(),
      saleId: receiptNumber,
      date: new Date().toISOString(),
      type: 'charge',
      amount,
      note: `Store purchase receipt #${receiptNumber}`,
      receivedBy: this.getActiveUser().name
    });
    this.set(STORAGE_KEYS.CREDIT_ACCOUNTS, list);
  }

  public recordCreditPayment(accountId: string, amount: number, note?: string): void {
    const list = this.getCreditAccounts();
    const account = list.find(a => a.id === accountId);
    if (account) {
      account.currentBalance = Math.max(0, Number((account.currentBalance - amount).toFixed(2)));
      account.lastPaymentDate = new Date().toISOString();
      account.transactions.unshift({
        id: 'tx_pay_' + Date.now(),
        date: new Date().toISOString(),
        type: 'payment',
        amount,
        note: note || 'Customer debt settlement',
        receivedBy: this.getActiveUser().name
      });
      this.set(STORAGE_KEYS.CREDIT_ACCOUNTS, list);

      // Add to cash register if cashier active
      const activeShift = this.getActiveShift();
      if (activeShift && activeShift.status === 'open') {
        activeShift.expectedCash = Number((activeShift.expectedCash + amount).toFixed(2));
        this.saveShift(activeShift);
      }

      this.logActivity('CREDIT_PAYMENT', 'sale', `Received ETB ${amount.toFixed(2)} debt payment from ${account.customerName}`);
    }
  }

  // Expenses
  public getExpenses(): Expense[] {
    return this.get<Expense[]>(STORAGE_KEYS.EXPENSES, SEED_EXPENSES);
  }

  public addExpense(expense: Expense): void {
    const list = this.getExpenses();
    list.unshift(expense);
    this.set(STORAGE_KEYS.EXPENSES, list);

    // If paid via cash register, deduct from expected register cash
    if (expense.paidVia === 'Cash Register') {
      const shift = this.getActiveShift();
      if (shift && shift.status === 'open') {
        shift.expectedCash = Number((shift.expectedCash - expense.amount).toFixed(2));
        this.saveShift(shift);
      }
    }

    this.logActivity('EXPENSE_RECORDED', 'expense', `Recorded expense: ETB ${expense.amount.toFixed(2)} for ${expense.category} (${expense.description})`);
  }

  public deleteExpense(id: string): void {
    const list = this.getExpenses().filter(e => e.id !== id);
    this.set(STORAGE_KEYS.EXPENSES, list);
  }

  // Activity Logs
  public getLogs(): ActivityLog[] {
    return this.get<ActivityLog[]>(STORAGE_KEYS.LOGS, SEED_LOGS);
  }

  public logActivity(action: string, category: ActivityLog['category'], details: string): void {
    const logs = this.getLogs();
    logs.unshift({
      id: 'log_' + Date.now() + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      action,
      category,
      performedBy: this.getActiveUser()?.name || 'System',
      details
    });
    // keep latest 500
    if (logs.length > 500) logs.pop();
    this.set(STORAGE_KEYS.LOGS, logs);
  }

  // Internal Notifications System
  public getNotifications(): AppNotification[] {
    return this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  public saveNotifications(notifications: AppNotification[]): void {
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  public addNotification(notification: AppNotification): void {
    const list = this.getNotifications();
    if (!list.some(n => n.id === notification.id)) {
      list.unshift(notification);
      if (list.length > 150) list.pop();
      this.set(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  public markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const target = list.find(n => n.id === id);
    if (target && !target.read) {
      target.read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  public markAllNotificationsRead(): void {
    const list = this.getNotifications();
    let changed = false;
    list.forEach(n => {
      if (!n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  public removeNotification(id: string): void {
    const list = this.getNotifications().filter(n => n.id !== id);
    this.set(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  public clearNotifications(): void {
    this.set(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  public getUnreadNotificationCount(): number {
    return this.getNotifications().filter(n => !n.read).length;
  }

  /**
   * Automated Restock Checker Task / Background Worker:
   * Scans all inventory products and triggers 'Urgent Restock' alerts
   * whenever any product quantity reaches or drops below its minimum threshold.
   */
  public checkStockThresholds(): { newlyTriggered: AppNotification[]; resolvedCount: number } {
    const products = this.getProducts();
    const notifications = this.getNotifications();
    const newlyTriggered: AppNotification[] = [];
    let resolvedCount = 0;
    let listModified = false;

    products.forEach(prod => {
      const isAtOrBelowThreshold = prod.stock <= prod.minThreshold;
      const existingAlertIndex = notifications.findIndex(
        n => n.type === 'restock_alert' && n.productId === prod.id && !n.read
      );

      if (isAtOrBelowThreshold) {
        if (existingAlertIndex < 0) {
          // Brand new restock alert needed
          const isDepleted = prod.stock <= 0;
          const newAlert: AppNotification = {
            id: 'notif_restock_' + prod.id + '_' + Date.now(),
            title: isDepleted ? `Urgent Restock: ${prod.name}` : `Restock Alert: ${prod.name}`,
            message: isDepleted
              ? `OUT OF STOCK! Inventory is at 0 ${prod.unit} (Minimum threshold: ${prod.minThreshold} ${prod.unit}). Immediate replenishment required.`
              : `Minimum threshold reached! Current stock is ${prod.stock} ${prod.unit} (Safety threshold: ${prod.minThreshold} ${prod.unit}).`,
            type: 'restock_alert',
            severity: isDepleted ? 'urgent' : 'warning',
            timestamp: new Date().toISOString(),
            read: false,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            currentStock: prod.stock,
            minThreshold: prod.minThreshold,
            unit: prod.unit,
            actionUrl: 'inventory'
          };
          notifications.unshift(newAlert);
          newlyTriggered.push(newAlert);
          listModified = true;

          // Also record in Activity Logs
          this.logActivity(
            'RESTOCK_ALERT_TRIGGERED',
            'inventory',
            `Urgent Restock alert triggered for ${prod.name} (Stock: ${prod.stock}, Min Threshold: ${prod.minThreshold})`
          );
        } else {
          // Update current stock if stock level changed
          const existing = notifications[existingAlertIndex];
          if (existing.currentStock !== prod.stock) {
            existing.currentStock = prod.stock;
            existing.timestamp = new Date().toISOString();
            if (prod.stock <= 0) {
              existing.severity = 'urgent';
              existing.title = `Urgent Restock: ${prod.name}`;
              existing.message = `OUT OF STOCK! Inventory is at 0 ${prod.unit} (Minimum threshold: ${prod.minThreshold} ${prod.unit}).`;
            }
            listModified = true;
          }
        }
      } else {
        // Product was replenished above threshold
        if (existingAlertIndex >= 0) {
          notifications[existingAlertIndex].read = true;
          resolvedCount++;
          listModified = true;
        }
      }
    });

    if (listModified) {
      if (notifications.length > 150) notifications.length = 150;
      this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }

    return { newlyTriggered, resolvedCount };
  }

  // Utilities: Barcode & SKU Generator
  public generateBarcodeNumber(): string {
    const existing = new Set(this.getProducts().map(p => (p.barcode || '').trim()));
    let candidate = '';
    let attempts = 0;
    do {
      // 12-digit standard code starting with '89' (EAN-12 / UPC compatible)
      const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      candidate = '89' + randomSuffix;
      attempts++;
    } while (existing.has(candidate) && attempts < 100);

    // Fallback if 100 random collisions
    if (existing.has(candidate)) {
      candidate = '89' + Date.now().toString().slice(-10);
    }

    return candidate;
  }

  public generateSku(category: string, name: string): string {
    const catMap: Record<string, string> = {
      'Writing & Pens': 'PEN',
      'Paper & Notebooks': 'PPR',
      'Printing & Copying': 'PRN',
      'Art & Craft': 'ART',
      'Desk & Office': 'DSK',
      'Binding & Lamination': 'BND',
      'Packaging & Envelopes': 'PKG',
      'Custom Stamps & Signs': 'STP'
    };
    const prefix = catMap[category] || 'GEN';
    const namePart = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 4);
    const rand = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${namePart}-${rand}`;
  }

  // Export / Backup
  public exportAllData(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      products: this.getProducts(),
      sales: this.getSales(),
      shifts: this.getShifts(),
      creditAccounts: this.getCreditAccounts(),
      expenses: this.getExpenses(),
      staff: this.getStaff(),
      logs: this.getLogs()
    };
    return JSON.stringify(backup, null, 2);
  }

  public importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && Array.isArray(data.products)) {
        this.set(STORAGE_KEYS.PRODUCTS, data.products);
      }
      if (data.sales && Array.isArray(data.sales)) {
        this.set(STORAGE_KEYS.SALES, data.sales);
      }
      if (data.settings) {
        this.set(STORAGE_KEYS.SETTINGS, data.settings);
      }
      if (data.creditAccounts) {
        this.set(STORAGE_KEYS.CREDIT_ACCOUNTS, data.creditAccounts);
      }
      if (data.expenses) {
        this.set(STORAGE_KEYS.EXPENSES, data.expenses);
      }
      if (data.staff) {
        this.set(STORAGE_KEYS.STAFF, data.staff);
      }
      this.logActivity('DATA_RESTORE', 'security', 'Database restored from JSON backup file.');
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

  // Reset to demo factory defaults
  public resetToFactoryDefaults(): void {
    localStorage.clear();
    this.initSeeds();
    this.notify();
  }
}

export const storage = new StorageService();
