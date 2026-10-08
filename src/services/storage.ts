import {
  Product,
  ServiceItem,
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
  PaymentMethod,
  ETHIOPIAN_PAYMENT_METHODS,
  getPaymentMethodLabel,
  LOW_STOCK_THRESHOLD,
  BackupEnvelope,
  BackupPayload,
  LocalBackupSnapshot,
  BackupInspectionResult
} from '../types';
import {
  autoDetectCategory,
  generateUniqueSku,
  generateUniqueBarcode,
  isLowStock
} from './productGenerator';

const STORAGE_KEYS = {
  INITIALIZED: 'rahel_pos_initialized_v2',
  DATA_CLEARED: 'rahel_pos_data_cleared_v2',
  AUTO_BACKUPS: 'rahel_pos_auto_backups_v1',
  PRODUCTS: 'rahel_pos_products_v1',
  SERVICES: 'rahel_pos_services_v1',
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

/**
 * Standard Default Services (Type: Service, Inventory Required: No, QR Code: No)
 * Exactly 6 sellable services: Printing, Laminating, Photocopying, Scanning, Binding, Passport Appointment.
 * (Document Typing is permanently prohibited and excluded).
 */
export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'srv_printing',
    name: 'Printing',
    price: 5.00,
    unit: 'page',
    description: 'B&W and color laser document printing on A4/A3 paper.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'srv_laminating',
    name: 'Laminating',
    price: 25.00,
    unit: 'pouch',
    description: 'Hot thermal plastic protective lamination for ID cards, documents, certificates & passes.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'srv_photocopying',
    name: 'Photocopying',
    price: 3.00,
    unit: 'copy',
    description: 'High-speed sharp document photocopying (single or double-sided).',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'srv_scanning',
    name: 'Scanning',
    price: 10.00,
    unit: 'doc',
    description: 'Optical digital high-resolution document scanning to PDF, flash drive, or email.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'srv_binding',
    name: 'Binding',
    price: 45.00,
    unit: 'book',
    description: 'Comb, spiral wire, and thermal document binding with protective PVC covers.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'srv_passport_appointment',
    name: 'Passport Appointment',
    price: 150.00,
    unit: 'appointment',
    description: 'Official biometric passport online booking, document verification & appointment scheduling.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

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
  },
  autoBackupEnabled: true,
  autoBackupIntervalHours: 24,
  autoBackupOnShiftClose: true
};

// Default Administrator: Rahel Fira (Username: admin, PIN: 1234)
const SEED_STAFF: StaffUser[] = [
  {
    id: 'user_1',
    name: 'Rahel Fira',
    username: 'admin',
    email: 'admin@rahelstationary.local',
    role: 'admin',
    pin: '1234',
    passwordHash: '5335b5ba843443fe51f769dc9281eeb6c7b8a1937919fbbfe5a132fd22550b75',
    passwordSalt: '40ec3781bfc70bb275f925c6f3f08da9',
    approved: true,
    lastActive: new Date().toISOString()
  }
];

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'A4 Double A Copier Paper (80gsm, 500 Sheets)',
    sku: 'PPR-A4-80G',
    qrCode: 'PPR-A4-80G',
    barcode: '890123456001',
    category: 'Paper & Notebooks',
    costPrice: 4.20,
    retailPrice: 7.50,
    stock: 64,
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'ream',
    description: 'High opacity ultra-bright paper for laser and inkjet high-speed printing.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_2',
    name: 'Pilot G2 0.7mm Retractable Gel Pen (Black)',
    sku: 'PEN-PIL-G2B',
    qrCode: 'PEN-PIL-G2B',
    barcode: '890123456002',
    category: 'Writing & Pens',
    costPrice: 1.10,
    retailPrice: 2.25,
    stock: 82,
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'pcs',
    description: 'Smooth writing quick-drying archival black gel ink.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_3',
    name: 'Pilot G2 0.7mm Retractable Gel Pen (Blue)',
    sku: 'PEN-PIL-G2BL',
    qrCode: 'PEN-PIL-G2BL',
    barcode: '890123456003',
    category: 'Writing & Pens',
    costPrice: 1.10,
    retailPrice: 2.25,
    stock: 3, // Low stock: exactly 3
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'pcs',
    description: 'Smooth writing quick-drying archival blue gel ink.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_4',
    name: 'Moleskine Classic Hardcover Dotted Journal (A5, Black)',
    sku: 'NBK-MOL-A5D',
    qrCode: 'NBK-MOL-A5D',
    barcode: '890123456004',
    category: 'Paper & Notebooks',
    costPrice: 13.50,
    retailPrice: 24.00,
    stock: 18,
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'pcs',
    description: 'FSC-certified ivory acid-free paper with ribbon bookmark and back pocket.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_5',
    name: 'Thermal Receipt Paper Roll 80x80mm (Box of 50)',
    sku: 'POS-ROL-8080',
    qrCode: 'POS-ROL-8080',
    barcode: '890123456005',
    category: 'Printing & Copying',
    costPrice: 32.00,
    retailPrice: 52.00,
    stock: 12,
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'box',
    description: 'BPA-free high sensitivity thermal paper for POS receipt printers.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_6',
    name: 'Glossy Photo Paper A4 (230gsm, 50 Sheets)',
    sku: 'PPR-GLS-A450',
    qrCode: 'PPR-GLS-A450',
    barcode: '890123456006',
    category: 'Printing & Copying',
    costPrice: 6.80,
    retailPrice: 12.50,
    stock: 24,
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'pack',
    description: 'High-gloss cast-coated instant-dry waterproof photo paper.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_7',
    name: 'Color Laser Printing Service (A4 Single Page)',
    sku: 'SRV-CLR-A4',
    qrCode: 'SRV-CLR-A4',
    barcode: '890123456007',
    category: 'Printing & Copying',
    costPrice: 0.12,
    retailPrice: 0.65,
    stock: 9999, // Service
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'page',
    description: 'Heavy toner crisp commercial high-resolution color laser printout.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_8',
    name: 'Document Binding Spiral Comb (Up to 100pgs)',
    sku: 'SRV-BND-SPR',
    qrCode: 'SRV-BND-SPR',
    barcode: '890123456008',
    category: 'Binding & Lamination',
    costPrice: 0.85,
    retailPrice: 3.50,
    stock: 140,
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'book',
    description: 'Clear PVC front cover, black leatherette back, plastic spiral binding.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_9',
    name: 'Matte Lamination Pouches A4 (125 Micron, 100 pcs)',
    sku: 'LAM-MTE-A4',
    qrCode: 'LAM-MTE-A4',
    barcode: '890123456009',
    category: 'Binding & Lamination',
    costPrice: 11.20,
    retailPrice: 19.95,
    stock: 1, // Critical low stock: < 3
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'pack',
    description: 'Anti-glare thermal lamination pouches for ID, menu, and signage protection.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_10',
    name: 'Staedtler Mars Lumograph Art Pencil Set (12 Tins)',
    sku: 'ART-STD-LUM',
    qrCode: 'ART-STD-LUM',
    barcode: '890123456010',
    category: 'Art & Craft',
    costPrice: 10.40,
    retailPrice: 18.50,
    stock: 16,
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'tin',
    description: 'Graded graphite pencils 6B to 4H for sketching, drafting, and illustration.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_11',
    name: 'Heavy Duty Stapler (100 Sheets Capacity)',
    sku: 'DSK-STP-HD100',
    qrCode: 'DSK-STP-HD100',
    barcode: '890123456011',
    category: 'Desk & Office',
    costPrice: 16.50,
    retailPrice: 29.00,
    stock: 9,
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'pcs',
    description: 'Metal body with calibrated adjustable paper guide and anti-jam mechanism.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_12',
    name: 'Custom Self-Inking Rubber Stamp (40x40mm)',
    sku: 'STP-SLF-4040',
    qrCode: 'STP-SLF-4040',
    barcode: '890123456012',
    category: 'Custom Stamps & Signs',
    costPrice: 8.50,
    retailPrice: 22.00,
    stock: 45,
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'pcs',
    description: 'Precision laser-engraved polymer stamp pad with refillable black ink.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_13',
    name: 'Kraft Padded Bubble Envelopes #2 (Pack of 25)',
    sku: 'PKG-ENV-KRF2',
    qrCode: 'PKG-ENV-KRF2',
    barcode: '890123456013',
    category: 'Packaging & Envelopes',
    costPrice: 7.20,
    retailPrice: 14.50,
    stock: 35,
    minThreshold: LOW_STOCK_THRESHOLD,
    unit: 'pack',
    description: 'Self-seal tamper-evident tear strip with air cushion bubble lining.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_14',
    name: 'Architectural Tracing Paper Roll (90gsm, 20m)',
    sku: 'PPR-TRC-90G',
    qrCode: 'PPR-TRC-90G',
    barcode: '890123456014',
    category: 'Paper & Notebooks',
    costPrice: 9.80,
    retailPrice: 18.00,
    stock: 2, // Critical low stock: < 3
    minThreshold: LOW_STOCK_THRESHOLD,
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
    transactionId: 'TXN-2026-8840',
    receiptNumber: 'TXN-2026-8840',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
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
      },
      {
        productId: 'prod_3',
        productName: 'Casio FX-991EX Scientific Calculator',
        sku: 'CAL-CAS-991',
        barcode: '890123456003',
        unitPrice: 30.00,
        costPrice: 18.00,
        quantity: 2,
        total: 60.00,
        discountPercent: 0
      }
    ],
    subtotal: 157.50,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 157.50,
    paymentMethod: 'Cash',
    payments: [
      {
        method: 'cash',
        amount: 157.50
      }
    ],
    status: 'completed',
    customerName: 'Walk-in Client'
  },
  {
    id: 'sale_2',
    transactionId: 'TXN-2026-8841',
    receiptNumber: 'TXN-2026-8841',
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
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
    paymentMethod: 'CBE',
    payments: [
      {
        method: 'cbe',
        amount: 40.37,
        reference: 'CBE-TXN-9941'
      }
    ],
    status: 'completed',
    customerName: 'Sara Alem'
  },
  {
    id: 'sale_today_3',
    transactionId: 'TXN-2026-8842',
    receiptNumber: 'TXN-2026-8842',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
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
      }
    ],
    subtotal: 208.00,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 208.00,
    paymentMethod: 'Awash Bank',
    payments: [
      {
        method: 'awash_bank',
        amount: 208.00,
        reference: 'AWASH-8842'
      }
    ],
    status: 'completed',
    customerName: 'Fineline Architects'
  },
  {
    id: 'sale_today_service_passport',
    transactionId: 'TXN-2026-8843',
    receiptNumber: 'TXN-2026-8843',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
    items: [
      {
        productId: 'srv_passport_appointment',
        productName: 'Passport Appointment',
        sku: 'SRV-PASS-APPT',
        barcode: '',
        unitPrice: 150.00,
        costPrice: 0,
        quantity: 1,
        total: 150.00,
        discountPercent: 0,
        isService: true
      },
      {
        productId: 'srv_photocopying',
        productName: 'Photocopying',
        sku: 'SRV-PHOTOCOPY',
        barcode: '',
        unitPrice: 3.00,
        costPrice: 0,
        quantity: 5,
        total: 15.00,
        discountPercent: 0,
        isService: true
      }
    ],
    subtotal: 165.00,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 165.00,
    paymentMethod: 'Telebirr',
    payments: [
      {
        method: 'telebirr',
        amount: 165.00,
        reference: 'TLB-PASS-8843'
      }
    ],
    status: 'completed',
    customerName: 'Yohannes Bekele'
  },
  // 1 Day Ago (Yesterday)
  {
    id: 'sale_prev_1a',
    transactionId: 'TXN-2026-8835',
    receiptNumber: 'TXN-2026-8835',
    timestamp: new Date(Date.now() - 86400000 - 7200000).toISOString(),
    cashierId: 'user_1',
    cashierName: 'Rahel Fira',
    items: [
      {
        productId: 'prod_5',
        productName: 'Thermal Receipt Paper Roll 80x80mm (Box of 50)',
        sku: 'POS-ROL-8080',
        barcode: '890123456005',
        unitPrice: 20.80,
        costPrice: 12.00,
        quantity: 5,
        total: 104.00,
        discountPercent: 0
      }
    ],
    subtotal: 104.00,
    taxAmount: 0,
    taxPercent: 0,
    discountAmount: 0,
    total: 104.00,
    paymentMethod: 'Telebirr',
    payments: [{ method: 'telebirr', amount: 104.00, reference: 'TELEBIRR-8835' }],
    status: 'completed',
    customerName: 'Addis Commercial Bank'
  },
  {
    id: 'sale_prev_1b',
    transactionId: 'TXN-2026-8836',
    receiptNumber: 'TXN-2026-8836',
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
      const paymentMethodsList = ETHIOPIAN_PAYMENT_METHODS;
      const chosenPayment = paymentMethodsList[d % paymentMethodsList.length];
      const txnRef = `TXN-${prevYear}-${String(prevMonth + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`;
      sales.push({
        id: `sale_hist_${prevYear}_${prevMonth + 1}_${d}`,
        transactionId: txnRef,
        receiptNumber: txnRef,
        timestamp: dateObj.toISOString(),
        cashierId: 'user_1',
        cashierName: 'Rahel Fira',
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
        paymentMethod: chosenPayment.label,
        payments: [{
          method: chosenPayment.id,
          amount: baseTotal,
          reference: chosenPayment.id === 'cash' ? undefined : `${chosenPayment.shortLabel}-TXN-${d * 117}`
        }],
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
      const paymentMethodsList = ETHIOPIAN_PAYMENT_METHODS;
      const curChosen = paymentMethodsList[(d + 2) % paymentMethodsList.length];
      const curTxnRef = `TXN-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`;
      sales.push({
        id: `sale_curr_${currentYear}_${currentMonth + 1}_${d}`,
        transactionId: curTxnRef,
        receiptNumber: curTxnRef,
        timestamp: dateObj.toISOString(),
        cashierId: 'user_1',
        cashierName: 'Rahel Fira',
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
        paymentMethod: curChosen.label,
        payments: [{
          method: curChosen.id,
          amount: baseTotal,
          reference: curChosen.id === 'cash' ? undefined : `${curChosen.shortLabel}-TXN-${d * 219}`
        }],
        status: 'completed',
        customerName: 'Store Client'
      });
    }
  }

  return sales;
};

const ALL_SEED_SALES = generateMonthlySeedSales(SEED_SALES);

class StorageService {
  private listeners: Set<(key?: string) => void> = new Set();
  private isNotifying = false;
  private pendingNotifyKeys = new Set<string>();

  constructor() {
    this.initSeeds();
  }

  public subscribe(listener: (key?: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(key?: string) {
    if (this.isNotifying) {
      if (key) this.pendingNotifyKeys.add(key);
      return;
    }

    this.isNotifying = true;
    try {
      this.listeners.forEach(cb => {
        try {
          cb(key);
        } catch (err) {
          console.error('Storage notify error', err);
        }
      });
    } finally {
      this.isNotifying = false;
      if (this.pendingNotifyKeys.size > 0) {
        const nextKeys = Array.from(this.pendingNotifyKeys);
        this.pendingNotifyKeys.clear();
        nextKeys.forEach(k => this.notify(k));
      }
    }
  }

  private initSeeds() {
    if (typeof window === 'undefined') return;

    try {
      const isCleared = localStorage.getItem(STORAGE_KEYS.DATA_CLEARED) === 'true';
      const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';

      // Always guarantee settings and single admin user exist
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(SEED_STAFF));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(SEED_STAFF[0]));
      }

      // If user has cleared all store data, maintain empty arrays and do not re-seed demo data
      if (isCleared) {
        if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.SALES)) localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.SHIFTS)) localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.CREDIT_ACCOUNTS)) localStorage.setItem(STORAGE_KEYS.CREDIT_ACCOUNTS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.LOGS)) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.PARKED_CARTS)) localStorage.setItem(STORAGE_KEYS.PARKED_CARTS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS)) localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
        return;
      }

      if (!isInitialized) {
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
        if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
          localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
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
      // Normalize products: enforce central LOW_STOCK_THRESHOLD = 3 and ensure category, SKU, and barcode are assigned
      const storedProds = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      let prodsUpdated = false;
      storedProds.forEach(p => {
        if (p.minThreshold !== LOW_STOCK_THRESHOLD) {
          p.minThreshold = LOW_STOCK_THRESHOLD;
          prodsUpdated = true;
        }
        if (!p.category || p.category.trim() === '') {
          p.category = autoDetectCategory(p.name, p.description);
          prodsUpdated = true;
        }
        if (!p.sku || p.sku.trim() === '') {
          p.sku = this.generateSku(p.category, p.name);
          prodsUpdated = true;
        }
        if (!p.qrCode || p.qrCode.trim() === '') {
          p.qrCode = p.sku.trim();
          prodsUpdated = true;
        }
        if (!p.barcode || p.barcode.trim() === '') {
          p.barcode = this.generateBarcodeNumber();
          prodsUpdated = true;
        }
      });
      if (prodsUpdated) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(storedProds));
      }

      // Always enforce single admin user: Rahel Fira with salted password hash
      const staff = this.get<StaffUser[]>(STORAGE_KEYS.STAFF, []);
      if (!staff || staff.length !== 1 || staff[0].name !== 'Rahel Fira' || staff[0].role !== 'admin' || !staff[0].passwordHash) {
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(SEED_STAFF));
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(SEED_STAFF[0]));
      } else if (staff[0].passwordHash === '5c741a7da1e1c01400c972aff451a6f7adfeab6427ad05ca459b570fe3edb954') {
        // Automatic security rotation: invalidate revoked compromised password hash
        staff[0].passwordHash = SEED_STAFF[0].passwordHash;
        staff[0].passwordSalt = SEED_STAFF[0].passwordSalt;
        staff[0].email = SEED_STAFF[0].email;
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(staff[0]));
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

  private set<T>(key: string, value: T, notifyListeners = true): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (notifyListeners) {
        this.notify(key);
      }
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

    // Support default password or 4-digit PIN ('1234') as valid credentials
    if (!passwordValid && (passwordAttempt === 'Stationery@2026' || passwordAttempt === adminUser.pin || passwordAttempt === '1234')) {
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
    if (!currentValid && (currentPasswordOrPin === 'Stationery@2026' || currentPasswordOrPin === adminUser.pin || currentPasswordOrPin === '1234')) {
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

  // ==============================================================
  // Services System (No Inventory Required, No QR Code Required)
  // Standard 6 Services: Printing, Laminating, Photocopying, Scanning, Binding, Passport Appointment
  // Document Typing is strictly prohibited and excluded.
  // ==============================================================
  public getServices(): ServiceItem[] {
    const isCleared = localStorage.getItem(STORAGE_KEYS.DATA_CLEARED) === 'true';
    if (isCleared) {
      const stored = this.get<ServiceItem[]>(STORAGE_KEYS.SERVICES, []);
      return stored.filter(s => {
        const name = (s.name || '').trim().toLowerCase();
        return name !== 'document typing' && !name.includes('document typing');
      });
    }

    let services = this.get<ServiceItem[]>(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
    let mutated = false;

    // Strict purge of any legacy "Document Typing" entries
    const cleanServices = services.filter(s => {
      const name = (s.name || '').trim().toLowerCase();
      return name !== 'document typing' && !name.includes('document typing');
    });
    if (cleanServices.length !== services.length) {
      services = cleanServices;
      mutated = true;
    }

    // Ensure all 6 core default services exist & names are exact
    for (const def of DEFAULT_SERVICES) {
      const existingIdx = services.findIndex(s => {
        const sName = (s.name || '').trim().toLowerCase();
        const defName = def.name.toLowerCase();
        if (def.id === 'srv_passport_appointment') {
          return sName === 'passport appointment' || sName.includes('passport');
        }
        return sName === defName || s.id === def.id;
      });

      if (existingIdx >= 0) {
        // Enforce exact naming for Passport Appointment if legacy name was used
        if (def.id === 'srv_passport_appointment' && services[existingIdx].name !== 'Passport Appointment') {
          services[existingIdx].name = 'Passport Appointment';
          services[existingIdx].unit = 'appointment';
          mutated = true;
        }
      } else {
        services.push(def);
        mutated = true;
      }
    }

    if (mutated) {
      this.set(STORAGE_KEYS.SERVICES, services);
    }
    return services;
  }

  public saveService(service: ServiceItem): { success: boolean; error?: string } {
    if (!service.name || service.name.trim() === '') {
      return { success: false, error: 'Service name is required.' };
    }
    if (service.name.trim().toLowerCase() === 'document typing') {
      return { success: false, error: 'Document Typing service is removed and cannot be added.' };
    }
    if (service.price < 0) {
      return { success: false, error: 'Service price cannot be negative.' };
    }

    const services = this.getServices();
    const idx = services.findIndex(s => s.id === service.id);
    const now = new Date().toISOString();

    if (idx >= 0) {
      services[idx] = { ...service, updatedAt: now };
      this.logActivity('SERVICE_UPDATED', 'inventory', `Updated service "${service.name}" (Price: ETB ${service.price.toFixed(2)})`);
    } else {
      services.push({
        ...service,
        id: service.id || ('srv_' + Date.now()),
        createdAt: now,
        updatedAt: now
      });
      this.logActivity('SERVICE_CREATED', 'inventory', `Added service "${service.name}" (Price: ETB ${service.price.toFixed(2)})`);
    }

    this.set(STORAGE_KEYS.SERVICES, services);
    return { success: true };
  }

  public deleteService(id: string): { success: boolean; error?: string } {
    const services = this.getServices();
    const target = services.find(s => s.id === id);
    if (!target) return { success: false, error: 'Service not found.' };

    const remaining = services.filter(s => s.id !== id);
    this.set(STORAGE_KEYS.SERVICES, remaining);
    this.logActivity('SERVICE_DELETED', 'inventory', `Deleted service "${target.name}".`);
    return { success: true };
  }

  public resetServices(): void {
    this.set(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
    this.logActivity('SERVICES_RESET', 'inventory', 'Reset commercial services to the 6 standard default services.');
  }

  public isService(idOrName: string): boolean {
    if (!idOrName) return false;
    const clean = idOrName.trim().toLowerCase();
    if (clean.startsWith('srv_')) return true;
    const services = this.getServices();
    return services.some(s => s.id.toLowerCase() === clean || s.name.toLowerCase() === clean);
  }

  public convertServiceToProduct(service: ServiceItem): Product {
    return {
      id: service.id,
      name: service.name,
      sku: 'SRV-' + service.name.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 10),
      qrCode: '', // Services require NO QR Code
      barcode: '', // Services require NO Barcode
      category: 'Printing & Copying',
      costPrice: 0,
      retailPrice: service.price,
      stock: 0, // Services require NO inventory
      unit: service.unit || 'service',
      description: service.description,
      updatedAt: service.updatedAt || new Date().toISOString(),
      isService: true
    };
  }

  // Products & Inventory
  public getProducts(): Product[] {
    const isCleared = localStorage.getItem(STORAGE_KEYS.DATA_CLEARED) === 'true';
    const fallback = isCleared ? [] : SEED_PRODUCTS;
    const products = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, fallback);
    let mutated = false;
    // Filter out any legacy Document Typing that might have been saved as a product
    const cleanProducts = products.filter(p => {
      const name = (p.name || '').trim().toLowerCase();
      return name !== 'document typing' && !name.includes('document typing');
    });
    if (cleanProducts.length !== products.length) {
      mutated = true;
    }
    const targetProducts = cleanProducts;

    for (const p of targetProducts) {
      if (!p.qrCode || p.qrCode.trim() === '') {
        p.qrCode = (p.sku || `QR-${p.id || Date.now()}`).trim();
        mutated = true;
      }
    }
    if (mutated) {
      this.set(STORAGE_KEYS.PRODUCTS, targetProducts);
    }
    return targetProducts;
  }

  public isBarcodeUnique(barcode: string, excludeProductId?: string): boolean {
    const clean = (barcode || '').trim();
    if (!clean) return true;
    const products = this.getProducts();
    return !products.some(p => p.id !== excludeProductId && p.barcode.trim() === clean);
  }

  public findProductByCode(code: string): Product | undefined {
    const clean = (code || '').trim().toLowerCase();
    if (!clean) return undefined;

    // Check services first
    const services = this.getServices();
    const matchedService = services.find(
      s => s.name.toLowerCase() === clean || s.id.toLowerCase() === clean
    );
    if (matchedService) {
      return this.convertServiceToProduct(matchedService);
    }

    const products = this.getProducts();
    return products.find(
      p =>
        (p.qrCode && p.qrCode.trim().toLowerCase() === clean) ||
        (p.sku && p.sku.trim().toLowerCase() === clean) ||
        (p.barcode && p.barcode.trim().toLowerCase() === clean) ||
        (p.id && p.id.toLowerCase() === clean) ||
        (p.name && p.name.trim().toLowerCase() === clean)
    );
  }

  // Alias for backward compatibility
  public getProductByBarcode(code: string): Product | undefined {
    return this.findProductByCode(code);
  }

  public saveProduct(product: Product): { success: boolean; error?: string } {
    const list = this.getProducts();

    // Auto-assign category if missing
    if (!product.category || product.category.trim() === '') {
      product.category = autoDetectCategory(product.name, product.description);
    }

    // Auto-generate SKU if missing
    if (!product.sku || product.sku.trim() === '') {
      product.sku = this.generateSku(product.category, product.name);
    }

    // Auto-assign permanent unique QR Code if missing
    if (!product.qrCode || product.qrCode.trim() === '') {
      product.qrCode = product.sku.trim();
    }

    let barcode = (product.barcode || '').trim();

    // Automatically generate unique barcode if product does not have one
    if (!barcode) {
      barcode = this.generateBarcodeNumber();
      product.barcode = barcode;
    }

    // Enforce fixed minimum stock threshold of 3 for all products
    product.minThreshold = LOW_STOCK_THRESHOLD;

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

    const allocatedSkus = new Set<string>();
    const allocatedBarcodes = new Set<string>();

    items.forEach((item, index) => {
      const cleanName = (item.name || '').trim();
      // Permanently reject any Document Typing service entry
      if (cleanName.toLowerCase() === 'document typing' || cleanName.toLowerCase().includes('document typing')) {
        skipped++;
        return;
      }

      // Detect if this item is a commercial service (No inventory, No QR code)
      const isServiceItem = item.isService === true || this.isService(cleanName);

      if (isServiceItem) {
        // Enforce exact naming for Passport Appointment
        const serviceName = cleanName.toLowerCase().includes('passport')
          ? 'Passport Appointment'
          : cleanName;

        const servicePrice = item.retailPrice > 0 ? item.retailPrice : (item.costPrice > 0 ? item.costPrice : 0);
        const serviceUnit = cleanName.toLowerCase().includes('passport')
          ? 'appointment'
          : (item.unit && item.unit !== 'pcs' ? item.unit : 'service');

        // Sync with central Services system
        const existingServices = this.getServices();
        const existingSrv = existingServices.find(
          s => s.name.toLowerCase() === serviceName.toLowerCase() || s.id === item.id
        );

        if (existingSrv) {
          if (options.onDuplicate !== 'skip') {
            this.saveService({
              ...existingSrv,
              price: servicePrice > 0 ? servicePrice : existingSrv.price,
              unit: serviceUnit || existingSrv.unit,
              description: item.description || existingSrv.description,
              updatedAt: now
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          this.saveService({
            id: item.id && item.id.startsWith('srv_') ? item.id : ('srv_' + Date.now() + '_' + index),
            name: serviceName,
            price: servicePrice,
            unit: serviceUnit,
            description: item.description,
            isActive: true,
            createdAt: now,
            updatedAt: now
          });
          added++;
        }
        return;
      }

      // Physical Product Processing (Requires Inventory + QR Code)
      // Auto-assign Category if missing
      const category = (item.category && item.category.trim() !== '')
        ? item.category
        : autoDetectCategory(item.name, item.description);

      // Auto-generate SKU if missing
      let sku = (item.sku || '').trim();
      if (!sku) {
        sku = this.generateSku(category, item.name, allocatedSkus);
      }
      allocatedSkus.add(sku.toUpperCase());

      // Auto-generate Barcode if missing, or preserve non-conflicting barcode
      let barcode = (item.barcode || '').trim();
      if (!barcode || allocatedBarcodes.has(barcode) || !this.isBarcodeUnique(barcode, item.id)) {
        barcode = this.generateBarcodeNumber(allocatedBarcodes);
      }
      allocatedBarcodes.add(barcode);

      // Auto-generate QR code from SKU if not provided
      const qrCode = (item.qrCode && item.qrCode.trim()) ? item.qrCode.trim() : sku;

      const preparedItem: Product = {
        ...item,
        category,
        sku,
        qrCode,
        barcode,
        isService: false,
        minThreshold: LOW_STOCK_THRESHOLD
      };

      // Find matching item by SKU or Barcode or QR Code or ID
      const existingIndex = list.findIndex(
        p =>
          (p.sku && preparedItem.sku && p.sku.trim().toLowerCase() === preparedItem.sku.trim().toLowerCase()) ||
          (p.barcode && preparedItem.barcode && p.barcode.trim() === preparedItem.barcode.trim()) ||
          (p.qrCode && preparedItem.qrCode && p.qrCode.trim().toLowerCase() === preparedItem.qrCode.trim().toLowerCase()) ||
          p.id === preparedItem.id
      );

      if (existingIndex >= 0) {
        if (options.onDuplicate === 'skip') {
          skipped++;
          return;
        } else if (options.onDuplicate === 'generate_new') {
          // generate new SKU, QR code, and Barcode
          const newSku = this.generateSku(category, preparedItem.name, allocatedSkus);
          allocatedSkus.add(newSku.toUpperCase());
          const newBarcode = this.generateBarcodeNumber(allocatedBarcodes);
          allocatedBarcodes.add(newBarcode);
          const newItem: Product = {
            ...preparedItem,
            id: 'prod_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6),
            sku: newSku,
            qrCode: newSku,
            barcode: newBarcode,
            minThreshold: LOW_STOCK_THRESHOLD,
            isService: false,
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
              reason: 'Bulk inventory import (auto-generated unique SKU & QR code)',
              performedBy: activeUserName
            });
          }
        } else if (options.onDuplicate === 'overwrite_stock') {
          // Overwrite stock count with imported quantity
          const existing = list[existingIndex];
          const stockDiff = preparedItem.stock - existing.stock;
          list[existingIndex] = {
            ...existing,
            name: preparedItem.name || existing.name,
            category: preparedItem.category || existing.category,
            costPrice: preparedItem.costPrice > 0 ? preparedItem.costPrice : existing.costPrice,
            retailPrice: preparedItem.retailPrice > 0 ? preparedItem.retailPrice : existing.retailPrice,
            minThreshold: LOW_STOCK_THRESHOLD,
            unit: preparedItem.unit || existing.unit,
            description: preparedItem.description || existing.description,
            stock: preparedItem.stock,
            qrCode: existing.qrCode || preparedItem.qrCode || existing.sku,
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
              newStock: preparedItem.stock,
              reason: 'Bulk inventory import (stock count overwrite)',
              performedBy: activeUserName
            });
          }
        } else {
          // 'update': replenish stock and update details
          const existing = list[existingIndex];
          const stockToAdd = preparedItem.stock || 0;
          const newStock = existing.stock + stockToAdd;
          
          list[existingIndex] = {
            ...existing,
            name: preparedItem.name || existing.name,
            category: preparedItem.category || existing.category,
            costPrice: preparedItem.costPrice > 0 ? preparedItem.costPrice : existing.costPrice,
            retailPrice: preparedItem.retailPrice > 0 ? preparedItem.retailPrice : existing.retailPrice,
            minThreshold: LOW_STOCK_THRESHOLD,
            unit: preparedItem.unit || existing.unit,
            description: preparedItem.description || existing.description,
            stock: newStock,
            qrCode: existing.qrCode || preparedItem.qrCode || existing.sku,
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
        // Brand new physical product
        const newItem: Product = {
          ...preparedItem,
          id: preparedItem.id || ('prod_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6)),
          minThreshold: LOW_STOCK_THRESHOLD,
          isService: false,
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
      `Bulk imported catalog items: ${added} added, ${updated} updated, ${skipped} skipped.`
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
    const isCleared = localStorage.getItem(STORAGE_KEYS.DATA_CLEARED) === 'true';
    const fallback = isCleared ? [] : ALL_SEED_SALES;
    const list = this.get<Sale[]>(STORAGE_KEYS.SALES, fallback);
    const effectiveList = isCleared ? list : ((!list || list.length < 25) ? ALL_SEED_SALES : list);
    return effectiveList.map(s => {
      const txnId = s.transactionId || (s.receiptNumber ? (s.receiptNumber.startsWith('TXN-') ? s.receiptNumber : s.receiptNumber.replace(/^REC-/, 'TXN-')) : `TXN-2026-${s.id.slice(-4)}`);
      let pm = s.paymentMethod;
      if (!pm && s.payments && s.payments.length > 0) {
        pm = getPaymentMethodLabel(s.payments[0].method);
      }
      return {
        ...s,
        transactionId: txnId,
        paymentMethod: pm || 'Cash'
      };
    });
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

    // Ensure paymentMethod is accurately recorded
    if (!sale.paymentMethod && sale.payments && sale.payments.length > 0) {
      sale.paymentMethod = getPaymentMethodLabel(sale.payments[0].method);
    } else if (!sale.paymentMethod) {
      sale.paymentMethod = 'Cash';
    }

    sales.unshift(sale);
    this.set(STORAGE_KEYS.SALES, sales);

    // Deduct stock for each item sold (Physical products ONLY - services require no inventory)
    sale.items.forEach(item => {
      const isSrv = item.isService || this.isService(item.productId) || this.isService(item.productName);
      if (!isSrv) {
        this.adjustStock(item.productId, -item.quantity, 'OUT', `Sold in transaction #${sale.transactionId}`);
      }
    });

    // Handle store credit charges if customer credit tab was used
    const creditPortion = sale.payments.filter(p => p.method === 'store_credit');
    if (creditPortion.length > 0 && sale.customerName) {
      creditPortion.forEach(payment => {
        this.chargeStoreCredit(sale.customerName!, payment.amount, sale.transactionId || sale.receiptNumber);
      });
    }

    this.logActivity('SALE_COMPLETED', 'sale', `Recorded transaction #${sale.transactionId} totaling ETB ${sale.total.toFixed(2)} (${sale.items.length} items) [${sale.paymentMethod}]`);
  }

  public refundSale(saleId: string, reason: string): void {
    const sales = this.getSales();
    const sale = sales.find(s => s.id === saleId);
    if (sale && sale.status !== 'refunded') {
      sale.status = 'refunded';
      sale.notes = (sale.notes ? sale.notes + '\n' : '') + `Refunded on ${new Date().toLocaleDateString()}: ${reason}`;
      this.set(STORAGE_KEYS.SALES, sales);

      // Return items to inventory (Physical products only)
      sale.items.forEach(item => {
        const isSrv = item.isService || this.isService(item.productId) || this.isService(item.productName);
        if (!isSrv) {
          this.adjustStock(item.productId, item.quantity, 'RETURN', `Refund on transaction #${sale.transactionId || sale.receiptNumber} (${reason})`);
        }
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
   * Aggregates payment method breakdown for reports and dashboard
   */
  public aggregatePaymentBreakdown(sales: Sale[], totalRevenue: number): PaymentMethodStat[] {
    const paymentMap: Record<string, { count: number; totalAmount: number; label: string }> = {
      cash: { count: 0, totalAmount: 0, label: 'Cash' },
      cbe: { count: 0, totalAmount: 0, label: 'Commercial Bank of Ethiopia (CBE)' },
      telebirr: { count: 0, totalAmount: 0, label: 'Telebirr' },
      awash_bank: { count: 0, totalAmount: 0, label: 'Awash Bank' },
      dashen_bank: { count: 0, totalAmount: 0, label: 'Dashen Bank' },
      bank_of_abyssinia: { count: 0, totalAmount: 0, label: 'Bank of Abyssinia' }
    };

    sales.forEach(sale => {
      if (sale.payments && sale.payments.length > 0) {
        sale.payments.forEach(p => {
          let m: string = p.method;
          if (m === 'card') m = 'cbe';
          else if (m === 'mobile_transfer') m = 'telebirr';

          if (!paymentMap[m]) {
            paymentMap[m] = {
              count: 0,
              totalAmount: 0,
              label: getPaymentMethodLabel(m)
            };
          }
          paymentMap[m].count += 1;
          paymentMap[m].totalAmount = Number((paymentMap[m].totalAmount + p.amount).toFixed(2));
        });
      } else if (sale.paymentMethod) {
        const pmLower = sale.paymentMethod.toLowerCase();
        let m = 'cash';
        if (pmLower.includes('cbe')) m = 'cbe';
        else if (pmLower.includes('telebirr')) m = 'telebirr';
        else if (pmLower.includes('awash')) m = 'awash_bank';
        else if (pmLower.includes('dashen')) m = 'dashen_bank';
        else if (pmLower.includes('abyssinia')) m = 'bank_of_abyssinia';

        paymentMap[m].count += 1;
        paymentMap[m].totalAmount = Number((paymentMap[m].totalAmount + sale.total).toFixed(2));
      }
    });

    return Object.entries(paymentMap).map(([method, data]) => {
      const percentage = totalRevenue > 0 ? Number(((data.totalAmount / totalRevenue) * 100).toFixed(1)) : 0;
      return {
        method: method as PaymentMethod,
        label: data.label,
        count: data.count,
        totalAmount: Number(data.totalAmount.toFixed(2)),
        percentage
      };
    });
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
    const catalog = this.getProducts();

    daySales.forEach(sale => {
      totalRevenue += sale.total;

      // Product sales breakdown
      sale.items.forEach(item => {
        totalItemsSold += item.quantity;
        const existing = productMap.get(item.productId);
        const isSrv = item.isService || this.isService(item.productId) || this.isService(item.productName);
        const catItem = catalog.find(p => p.id === item.productId);
        const category = isSrv ? 'Services' : (catItem?.category || 'General Stationery');

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
    });

    totalRevenue = Number(totalRevenue.toFixed(2));
    const averageTransactionValue =
      totalTransactions > 0 ? Number((totalRevenue / totalTransactions).toFixed(2)) : 0;

    const paymentMethodBreakdown = this.aggregatePaymentBreakdown(daySales, totalRevenue);

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
    const catalog = this.getProducts();

    weekSales.forEach(sale => {
      totalRevenue += sale.total;

      sale.items.forEach(item => {
        totalItemsSold += item.quantity;
        const existing = productMap.get(item.productId);
        const isSrv = item.isService || this.isService(item.productId) || this.isService(item.productName);
        const catItem = catalog.find(p => p.id === item.productId);
        const category = isSrv ? 'Services' : (catItem?.category || 'General Stationery');

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

    const paymentMethodBreakdown = this.aggregatePaymentBreakdown(weekSales, totalRevenue);

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
    const catalog = this.getProducts();

    monthSales.forEach(sale => {
      totalRevenue += sale.total;

      sale.items.forEach(item => {
        totalItemsSold += item.quantity;
        const existing = productMap.get(item.productId);
        const isSrv = item.isService || this.isService(item.productId) || this.isService(item.productName);
        const catItem = catalog.find(p => p.id === item.productId);
        const category = isSrv ? 'Services' : (catItem?.category || 'General Stationery');

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

    const paymentMethodBreakdown = this.aggregatePaymentBreakdown(monthSales, totalRevenue);

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
    const lowStockCount = products.filter(p => isLowStock(p.stock)).length;

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
    const isCleared = localStorage.getItem(STORAGE_KEYS.DATA_CLEARED) === 'true';
    const fallback = isCleared ? [] : [SEED_SHIFT];
    return this.get<CashShift[]>(STORAGE_KEYS.SHIFTS, fallback);
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

      // Automated backup snapshot on shift close (fallback for cache safety)
      if (this.getSettings().autoBackupOnShiftClose !== false) {
        this.createLocalSnapshot('auto_shift_close').catch(err => {
          console.warn('Auto-backup snapshot on shift close failed:', err);
        });
      }

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
    const isCleared = localStorage.getItem(STORAGE_KEYS.DATA_CLEARED) === 'true';
    const fallback = isCleared ? [] : SEED_CREDIT_ACCOUNTS;
    return this.get<CustomerCreditAccount[]>(STORAGE_KEYS.CREDIT_ACCOUNTS, fallback);
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
    const isCleared = localStorage.getItem(STORAGE_KEYS.DATA_CLEARED) === 'true';
    const fallback = isCleared ? [] : SEED_EXPENSES;
    return this.get<Expense[]>(STORAGE_KEYS.EXPENSES, fallback);
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
    const isCleared = localStorage.getItem(STORAGE_KEYS.DATA_CLEARED) === 'true';
    const fallback = isCleared ? [] : SEED_LOGS;
    return this.get<ActivityLog[]>(STORAGE_KEYS.LOGS, fallback);
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
    this.set(STORAGE_KEYS.LOGS, logs, false);
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
      const isAtOrBelowThreshold = prod.stock <= LOW_STOCK_THRESHOLD;
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
              ? `OUT OF STOCK! Inventory is at 0 ${prod.unit} (Minimum threshold: ${LOW_STOCK_THRESHOLD} ${prod.unit}). Immediate replenishment required.`
              : `Low stock threshold reached! Current stock is ${prod.stock} ${prod.unit} (Safety threshold: ${LOW_STOCK_THRESHOLD} ${prod.unit}).`,
            type: 'restock_alert',
            severity: isDepleted ? 'urgent' : 'warning',
            timestamp: new Date().toISOString(),
            read: false,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            currentStock: prod.stock,
            minThreshold: LOW_STOCK_THRESHOLD,
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
            `Urgent Restock alert triggered for ${prod.name} (Stock: ${prod.stock}, Min Threshold: ${LOW_STOCK_THRESHOLD})`
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
              existing.message = `OUT OF STOCK! Inventory is at 0 ${prod.unit} (Minimum threshold: ${LOW_STOCK_THRESHOLD} ${prod.unit}).`;
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
  public generateBarcodeNumber(excludeSet?: Set<string>): string {
    const existing = new Set(this.getProducts().map(p => (p.barcode || '').trim()));
    if (excludeSet) {
      excludeSet.forEach(b => existing.add(b.trim()));
    }
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

  public generateSku(category: string, name: string, excludeSet?: Set<string>): string {
    const catMap: Record<string, string> = {
      'Writing & Pens': 'PEN',
      'Writing & Correction': 'COR',
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
      .substring(0, 4) || 'ITEM';
    
    const existing = new Set(this.getProducts().map(p => (p.sku || '').trim().toUpperCase()));
    if (excludeSet) {
      excludeSet.forEach(s => existing.add(s.trim().toUpperCase()));
    }

    let candidate = '';
    let attempts = 0;
    do {
      const rand = Math.floor(100 + Math.random() * 900);
      candidate = `${prefix}-${namePart}-${rand}`;
      attempts++;
    } while (existing.has(candidate.toUpperCase()) && attempts < 100);

    if (existing.has(candidate.toUpperCase())) {
      candidate = `${prefix}-${namePart}-${Date.now().toString().slice(-4)}`;
    }

    return candidate;
  }

  // ==============================================================
  // Automated & Secure JSON Backup, Inspection & Restore System
  // ==============================================================

  public async exportAllDataSecure(): Promise<BackupEnvelope> {
    const settings = this.getSettings();
    const products = this.getProducts();
    const services = this.getServices();
    const sales = this.getSales();
    const creditAccounts = this.getCreditAccounts();
    const expenses = this.getExpenses();
    const shifts = this.getShifts();
    const stockMovements = this.getStockMovements();
    const staff = this.getStaff();
    const logs = this.getLogs();

    const payload: BackupPayload = {
      settings,
      products,
      services,
      sales,
      creditAccounts,
      expenses,
      shifts,
      stockMovements,
      staff,
      logs
    };

    const payloadCanonical = JSON.stringify(payload);
    const checksum = await sha256Hex(payloadCanonical);

    const envelope: BackupEnvelope = {
      app: 'Rahel POS',
      version: '2.0',
      format: 'rahel-pos-secure-backup',
      exportedAt: new Date().toISOString(),
      store: {
        name: settings.storeName || 'Rahel Stationary',
        currency: settings.currencySymbol || 'ETB'
      },
      summary: {
        totalProducts: products.length,
        totalServices: services.length,
        totalSales: sales.length,
        totalCreditAccounts: creditAccounts.length,
        totalExpenses: expenses.length,
        totalShifts: shifts.length,
        totalStockMovements: stockMovements.length
      },
      checksum,
      payload
    };

    this.logActivity(
      'BACKUP_EXPORTED',
      'security',
      `Secure JSON backup generated: ${products.length} products, ${sales.length} sales, ${creditAccounts.length} credit accounts. Checksum: ${checksum.slice(0, 8)}...`
    );

    return envelope;
  }

  // Backward-compatible JSON string exporter
  public exportAllData(): string {
    const settings = this.getSettings();
    const products = this.getProducts();
    const services = this.getServices();
    const sales = this.getSales();
    const creditAccounts = this.getCreditAccounts();
    const expenses = this.getExpenses();
    const shifts = this.getShifts();
    const stockMovements = this.getStockMovements();
    const staff = this.getStaff();
    const logs = this.getLogs();

    const payload: BackupPayload = {
      settings,
      products,
      services,
      sales,
      creditAccounts,
      expenses,
      shifts,
      stockMovements,
      staff,
      logs
    };

    const envelope: BackupEnvelope = {
      app: 'Rahel POS',
      version: '2.0',
      format: 'rahel-pos-secure-backup',
      exportedAt: new Date().toISOString(),
      store: {
        name: settings.storeName || 'Rahel Stationary',
        currency: settings.currencySymbol || 'ETB'
      },
      summary: {
        totalProducts: products.length,
        totalServices: services.length,
        totalSales: sales.length,
        totalCreditAccounts: creditAccounts.length,
        totalExpenses: expenses.length,
        totalShifts: shifts.length,
        totalStockMovements: stockMovements.length
      },
      checksum: 'sha256-verified-on-demand',
      payload
    };

    return JSON.stringify(envelope, null, 2);
  }

  // Inspect and validate a candidate JSON backup file prior to restore
  public async inspectBackupFile(jsonString: string): Promise<BackupInspectionResult> {
    try {
      const parsed = JSON.parse(jsonString);

      // Check if file is Version 2.0 Secure Envelope
      const isEnvelope = parsed && parsed.format === 'rahel-pos-secure-backup' && parsed.payload;

      let payload: BackupPayload;
      let version = '1.0';
      let format = 'legacy-json-backup';
      let exportedAt = new Date().toISOString();
      let storeName = 'Rahel Stationary';
      let currency = 'ETB';
      let checksum = '';
      let checksumValid = true;

      if (isEnvelope) {
        version = parsed.version || '2.0';
        format = parsed.format;
        exportedAt = parsed.exportedAt || exportedAt;
        storeName = parsed.store?.name || storeName;
        currency = parsed.store?.currency || currency;
        checksum = parsed.checksum || '';
        payload = parsed.payload;

        if (checksum && checksum !== 'sha256-verified-on-demand') {
          const computed = await sha256Hex(JSON.stringify(payload));
          checksumValid = computed === checksum;
        }
      } else {
        // Legacy flat format
        payload = parsed;
        if (parsed.exportedAt) exportedAt = parsed.exportedAt;
        if (parsed.version) version = parsed.version;
        if (parsed.settings?.storeName) storeName = parsed.settings.storeName;
        if (parsed.settings?.currencySymbol) currency = parsed.settings.currencySymbol;
      }

      const products = Array.isArray(payload.products) ? payload.products : [];
      const services = Array.isArray(payload.services) ? payload.services : [];
      const sales = Array.isArray(payload.sales) ? payload.sales : [];
      const creditAccounts = Array.isArray(payload.creditAccounts) ? payload.creditAccounts : [];
      const expenses = Array.isArray(payload.expenses) ? payload.expenses : [];
      const shifts = Array.isArray(payload.shifts) ? payload.shifts : [];
      const stockMovements = Array.isArray(payload.stockMovements) ? payload.stockMovements : [];

      const sampleProducts = products.slice(0, 5).map(p => p.name || 'Unnamed Product');
      const sampleSales = sales.slice(0, 5).map(s => s.transactionId || s.receiptNumber || s.id);

      return {
        isValid: true,
        format,
        version,
        exportedAt,
        checksum,
        checksumValid,
        storeName,
        currency,
        counts: {
          products: products.length,
          services: services.length,
          sales: sales.length,
          creditAccounts: creditAccounts.length,
          expenses: expenses.length,
          shifts: shifts.length,
          stockMovements: stockMovements.length
        },
        sampleProducts,
        sampleSales,
        payload
      };
    } catch (err: any) {
      return {
        isValid: false,
        error: `Invalid JSON backup format: ${err.message || 'File could not be parsed.'}`,
        format: 'corrupt',
        version: '0.0',
        exportedAt: '',
        checksum: '',
        checksumValid: false,
        storeName: '',
        currency: '',
        counts: {
          products: 0,
          services: 0,
          sales: 0,
          creditAccounts: 0,
          expenses: 0,
          shifts: 0,
          stockMovements: 0
        },
        sampleProducts: [],
        sampleSales: [],
        payload: {}
      };
    }
  }

  // Restore database from verified BackupPayload
  public restoreFromBackup(
    payload: BackupPayload,
    mode: 'replace' | 'merge' = 'replace'
  ): { success: boolean; error?: string; restoredCounts: any } {
    try {
      let finalProducts: Product[] = [];
      let finalServices: ServiceItem[] = [];
      let finalSales: Sale[] = [];
      let finalCreditAccounts: CustomerCreditAccount[] = [];
      let finalExpenses: Expense[] = [];
      let finalShifts: CashShift[] = [];
      let finalMovements: StockMovement[] = [];

      if (mode === 'replace') {
        finalProducts = Array.isArray(payload.products) ? payload.products : [];
        finalServices = Array.isArray(payload.services) ? payload.services : [];
        finalSales = Array.isArray(payload.sales) ? payload.sales : [];
        finalCreditAccounts = Array.isArray(payload.creditAccounts) ? payload.creditAccounts : [];
        finalExpenses = Array.isArray(payload.expenses) ? payload.expenses : [];
        finalShifts = Array.isArray(payload.shifts) ? payload.shifts : [];
        finalMovements = Array.isArray(payload.stockMovements) ? payload.stockMovements : [];

        if (payload.settings) {
          const current = this.getSettings();
          this.set(STORAGE_KEYS.SETTINGS, { ...current, ...payload.settings });
        }
      } else {
        // Merge mode: blend incoming records with existing records
        const currentProducts = this.getProducts();
        const incomingProducts = Array.isArray(payload.products) ? payload.products : [];
        const productMap = new Map<string, Product>();
        currentProducts.forEach(p => productMap.set(p.id, p));
        incomingProducts.forEach(p => {
          // If SKU already exists in store, preserve or update
          const existingBySku = currentProducts.find(cp => cp.sku && cp.sku === p.sku);
          if (existingBySku) {
            productMap.set(existingBySku.id, { ...existingBySku, ...p, id: existingBySku.id });
          } else {
            productMap.set(p.id, p);
          }
        });
        finalProducts = Array.from(productMap.values());

        const currentServices = this.getServices();
        const incomingServices = Array.isArray(payload.services) ? payload.services : [];
        const serviceMap = new Map<string, ServiceItem>();
        currentServices.forEach(s => serviceMap.set(s.id, s));
        incomingServices.forEach(s => serviceMap.set(s.id, s));
        finalServices = Array.from(serviceMap.values());

        const currentSales = this.getSales();
        const incomingSales = Array.isArray(payload.sales) ? payload.sales : [];
        const saleMap = new Map<string, Sale>();
        currentSales.forEach(s => saleMap.set(s.transactionId || s.id, s));
        incomingSales.forEach(s => saleMap.set(s.transactionId || s.id, s));
        finalSales = Array.from(saleMap.values());

        const currentCredit = this.getCreditAccounts();
        const incomingCredit = Array.isArray(payload.creditAccounts) ? payload.creditAccounts : [];
        const creditMap = new Map<string, CustomerCreditAccount>();
        currentCredit.forEach(c => creditMap.set(c.id, c));
        incomingCredit.forEach(c => creditMap.set(c.id, c));
        finalCreditAccounts = Array.from(creditMap.values());

        const currentExpenses = this.getExpenses();
        const incomingExpenses = Array.isArray(payload.expenses) ? payload.expenses : [];
        const expenseMap = new Map<string, Expense>();
        currentExpenses.forEach(e => expenseMap.set(e.id, e));
        incomingExpenses.forEach(e => expenseMap.set(e.id, e));
        finalExpenses = Array.from(expenseMap.values());

        finalShifts = this.getShifts();
        finalMovements = this.getStockMovements();
      }

      // Persist to storage
      this.set(STORAGE_KEYS.PRODUCTS, finalProducts, false);
      this.set(STORAGE_KEYS.SERVICES, finalServices, false);
      this.set(STORAGE_KEYS.SALES, finalSales, false);
      this.set(STORAGE_KEYS.CREDIT_ACCOUNTS, finalCreditAccounts, false);
      this.set(STORAGE_KEYS.EXPENSES, finalExpenses, false);
      this.set(STORAGE_KEYS.SHIFTS, finalShifts, false);
      this.set(STORAGE_KEYS.STOCK_MOVEMENTS, finalMovements, false);

      localStorage.removeItem(STORAGE_KEYS.DATA_CLEARED);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

      const restoredCounts = {
        products: finalProducts.length,
        services: finalServices.length,
        sales: finalSales.length,
        creditAccounts: finalCreditAccounts.length,
        expenses: finalExpenses.length
      };

      this.logActivity(
        'DATA_RESTORE',
        'security',
        `Database restored (${mode} mode): ${finalProducts.length} products, ${finalSales.length} sales, ${finalCreditAccounts.length} customer accounts recovered.`
      );

      this.notify();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rahel_pos_data_reset'));
      }

      return { success: true, restoredCounts };
    } catch (e: any) {
      console.error('Restore failed:', e);
      return { success: false, error: e.message || 'Failed to restore database.', restoredCounts: null };
    }
  }

  // Standard importData implementation delegating to restoreFromBackup
  public importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      const payload: BackupPayload = parsed && parsed.payload ? parsed.payload : parsed;
      const res = this.restoreFromBackup(payload, 'replace');
      return res.success;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

  // ==============================================================
  // Automated Rolling Local Backup Snapshots (Cache Protection)
  // ==============================================================

  public getLocalSnapshots(): LocalBackupSnapshot[] {
    return this.get<LocalBackupSnapshot[]>(STORAGE_KEYS.AUTO_BACKUPS, []);
  }

  public async createLocalSnapshot(
    trigger: 'auto_scheduled' | 'auto_shift_close' | 'manual_snapshot' = 'manual_snapshot'
  ): Promise<LocalBackupSnapshot> {
    const envelope = await this.exportAllDataSecure();
    const json = JSON.stringify(envelope);
    const sizeKb = (json.length / 1024).toFixed(1) + ' KB';

    const snapshot: LocalBackupSnapshot = {
      id: 'snap_' + Date.now(),
      timestamp: new Date().toISOString(),
      trigger,
      fileSizeEstimate: sizeKb,
      summary: {
        totalProducts: envelope.summary.totalProducts,
        totalServices: envelope.summary.totalServices,
        totalSales: envelope.summary.totalSales,
        totalCreditAccounts: envelope.summary.totalCreditAccounts,
        totalExpenses: envelope.summary.totalExpenses
      },
      data: envelope
    };

    const existing = this.getLocalSnapshots();
    // Keep up to 5 rolling snapshots to prevent storage bloat
    const updated = [snapshot, ...existing].slice(0, 5);
    this.set(STORAGE_KEYS.AUTO_BACKUPS, updated);

    // Update lastAutoBackupAt in settings
    const settings = this.getSettings();
    settings.lastAutoBackupAt = snapshot.timestamp;
    this.saveSettings(settings);

    return snapshot;
  }

  public deleteLocalSnapshot(id: string): void {
    const list = this.getLocalSnapshots().filter(s => s.id !== id);
    this.set(STORAGE_KEYS.AUTO_BACKUPS, list);
  }

  public restoreLocalSnapshot(id: string): boolean {
    const snapshots = this.getLocalSnapshots();
    const target = snapshots.find(s => s.id === id);
    if (!target) return false;
    const res = this.restoreFromBackup(target.data.payload, 'replace');
    return res.success;
  }

  // Remove All Data: Completely wipes all operational store data to zero items
  public removeAllData(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DATA_CLEARED, 'true');
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

      // Clear all operational collections to empty arrays
      this.set(STORAGE_KEYS.PRODUCTS, [], false);
      this.set(STORAGE_KEYS.SERVICES, [], false);
      this.set(STORAGE_KEYS.SALES, [], false);
      this.set(STORAGE_KEYS.PARKED_CARTS, [], false);
      this.set(STORAGE_KEYS.SHIFTS, [], false);
      this.set(STORAGE_KEYS.CREDIT_ACCOUNTS, [], false);
      this.set(STORAGE_KEYS.EXPENSES, [], false);
      this.set(STORAGE_KEYS.STOCK_MOVEMENTS, [], false);
      this.set(STORAGE_KEYS.NOTIFICATIONS, [], false);

      const wipeLog: ActivityLog = {
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        action: 'ALL_DATA_CLEARED',
        category: 'security',
        performedBy: this.getActiveUser()?.name || 'Administrator',
        details: 'Store database was completely reset. All products, sales, accounts, expenses and shift logs were permanently removed.'
      };
      this.set(STORAGE_KEYS.LOGS, [wipeLog], false);

      // Notify all reactive listeners across views
      this.notify();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rahel_pos_data_reset'));
      }
    } catch (e) {
      console.error('Failed to remove all data:', e);
      throw e;
    }
  }

  // Reset to factory defaults is guaranteed to completely wipe all data
  public resetToFactoryDefaults(): void {
    this.removeAllData();
  }

  // Populate sample demo catalog and transactions for testing
  public loadDemoSampleData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.DATA_CLEARED);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

      this.set(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS, false);
      this.set(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES, false);
      this.set(STORAGE_KEYS.SALES, SEED_SALES, false);
      this.set(STORAGE_KEYS.PARKED_CARTS, [], false);
      this.set(STORAGE_KEYS.SHIFTS, [SEED_SHIFT], false);
      this.set(STORAGE_KEYS.CREDIT_ACCOUNTS, SEED_CREDIT_ACCOUNTS, false);
      this.set(STORAGE_KEYS.EXPENSES, SEED_EXPENSES, false);
      this.set(STORAGE_KEYS.STOCK_MOVEMENTS, [], false);
      this.set(STORAGE_KEYS.NOTIFICATIONS, [], false);
      this.set(STORAGE_KEYS.LOGS, SEED_LOGS, false);

      this.logActivity('DEMO_DATA_LOADED', 'security', 'Sample demo catalog and sample transactions populated.');
      this.notify();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rahel_pos_data_reset'));
      }
    } catch (e) {
      console.error('Failed to load demo data:', e);
      throw e;
    }
  }
}

export const storage = new StorageService();
