export type Role = 'admin' | 'manager' | 'cashier' | 'auditor';

export interface StaffUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: Role;
  pin: string; // 4-digit PIN for quick switch
  passwordHash?: string; // Salted SHA-256
  passwordSalt?: string;
  avatarUrl?: string;
  approved: boolean; // Staff approvals workflow
  lastActive?: string;
}

export interface UserSession {
  userId: string;
  token: string;
  userName: string;
  userEmail: string;
  role: Role;
  expiresAt: number; // Unix timestamp ms
  rememberMe: boolean;
  createdAt: string;
}

export type ProductCategory = 
  | 'Writing & Pens'
  | 'Writing & Correction'
  | 'Paper & Notebooks'
  | 'Printing & Copying'
  | 'Art & Craft'
  | 'Desk & Office'
  | 'Binding & Lamination'
  | 'Packaging & Envelopes'
  | 'Custom Stamps & Signs'
  | 'General';

/**
 * Centrally defined fixed minimum stock threshold across the entire application.
 * Stock > 3: Normal stock
 * Stock <= 3: Low stock / Restock alert
 */
export const LOW_STOCK_THRESHOLD = 3;

export interface Product {
  id: string;
  name: string;
  sku: string;
  qrCode: string; // Unique QR code value / identifier (e.g. SKU or 'QR-000123')
  barcode: string; // Preserved for backward compatibility
  category: ProductCategory;
  costPrice: number;
  retailPrice: number;
  stock: number;
  minThreshold?: number; // Deprecated legacy field; system centrally enforces LOW_STOCK_THRESHOLD = 3
  unit: string; // e.g. "pcs", "pack", "ream", "box"
  description?: string;
  imageUrl?: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  appliedDiscountPercent?: number; // 0-100
  customPrice?: number;
}

export type PaymentMethod =
  | 'cash'
  | 'cbe'
  | 'telebirr'
  | 'awash_bank'
  | 'dashen_bank'
  | 'bank_of_abyssinia'
  | 'card'
  | 'mobile_transfer'
  | 'store_credit';

export const ETHIOPIAN_PAYMENT_METHODS: { id: PaymentMethod; label: string; shortLabel: string }[] = [
  { id: 'cash', label: 'Cash', shortLabel: 'Cash' },
  { id: 'cbe', label: 'Commercial Bank of Ethiopia (CBE)', shortLabel: 'CBE' },
  { id: 'telebirr', label: 'Telebirr', shortLabel: 'Telebirr' },
  { id: 'awash_bank', label: 'Awash Bank', shortLabel: 'Awash Bank' },
  { id: 'dashen_bank', label: 'Dashen Bank', shortLabel: 'Dashen Bank' },
  { id: 'bank_of_abyssinia', label: 'Bank of Abyssinia', shortLabel: 'Bank of Abyssinia' }
];

export const getPaymentMethodLabel = (method: PaymentMethod | string): string => {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'cbe':
      return 'CBE';
    case 'telebirr':
      return 'Telebirr';
    case 'awash_bank':
      return 'Awash Bank';
    case 'dashen_bank':
      return 'Dashen Bank';
    case 'bank_of_abyssinia':
      return 'Bank of Abyssinia';
    case 'card':
      return 'CBE';
    case 'mobile_transfer':
      return 'Telebirr';
    case 'store_credit':
      return 'Credit Tab';
    default:
      return String(method).replace(/_/g, ' ');
  }
};

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
  reference?: string; // e.g. Transaction ID or Auth code
  customerName?: string; // Required for store_credit
}

export interface Sale {
  id: string;
  transactionId?: string; // Formatted transaction reference e.g. "TXN-2026-8840"
  receiptNumber: string; // Retained for backwards-compatibility
  timestamp: string;
  cashierId: string;
  cashierName: string;
  shiftId?: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    barcode: string;
    unitPrice: number;
    costPrice: number;
    quantity: number;
    total: number;
    discountPercent: number;
  }[];
  subtotal: number;
  taxAmount: number;
  taxPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod?: string; // Direct selected payment method e.g. 'Cash', 'CBE', 'Telebirr', 'Awash Bank', 'Dashen Bank', 'Bank of Abyssinia'
  payments: PaymentSplit[];
  status: 'completed' | 'refunded' | 'partially_refunded';
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export interface ProductSaleStat {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface PaymentMethodStat {
  method: PaymentMethod;
  label: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface StaffSaleStat {
  staffId: string;
  staffName: string;
  transactionsCount: number;
  totalRevenue: number;
  itemsSold: number;
}

export interface DaySaleSummary {
  date: string; // YYYY-MM-DD
  dayName: string; // "Mon", "Tue" etc
  shortDate: string; // "Oct 3"
  totalTransactions: number;
  totalItemsSold: number;
  totalRevenue: number;
}

export interface DailyReport {
  date: string; // YYYY-MM-DD
  formattedDate: string; // "Saturday, October 3, 2026"
  totalTransactions: number;
  totalItemsSold: number;
  totalRevenue: number;
  averageTransactionValue: number;
  productBreakdown: ProductSaleStat[];
  paymentMethodBreakdown: PaymentMethodStat[];
  staffBreakdown: StaffSaleStat[];
  transactions: Sale[];
}

export interface WeeklyReport {
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string; // YYYY-MM-DD (Sunday)
  label: string; // "Mon Oct 28 - Sun Nov 3, 2026"
  totalTransactions: number;
  totalItemsSold: number;
  totalRevenue: number;
  averageDailyRevenue: number;
  dailyTotals: DaySaleSummary[];
  productBreakdown: ProductSaleStat[];
  bestSellingProducts: ProductSaleStat[];
  staffBreakdown: StaffSaleStat[];
  paymentMethodBreakdown: PaymentMethodStat[];
  transactions: Sale[];
}

export interface MonthlyReport {
  year: number;
  month: number; // 1-12
  monthName: string; // "October 2026"
  totalTransactions: number;
  totalItemsSold: number;
  totalRevenue: number;
  averageDailyRevenue: number;
  dailyBreakdown: DaySaleSummary[];
  productBreakdown: ProductSaleStat[];
  bestSellingProducts: ProductSaleStat[];
  staffBreakdown: StaffSaleStat[];
  paymentMethodBreakdown: PaymentMethodStat[];
  transactions: Sale[];
}

export interface DashboardSalesMetrics {
  todaySales: number;
  todayTransactions: number;
  thisWeekSales: number;
  thisWeekTransactions: number;
  thisMonthSales: number;
  thisMonthTransactions: number;
  totalProductsSold: number;
  lowStockCount: number;
  totalSalesCount: number;
  totalAllTimeRevenue: number;
}

export interface ParkedCart {
  id: string;
  heldAt: string;
  note: string;
  cashierName: string;
  customerName?: string;
  items: CartItem[];
}

export interface CashShift {
  id: string;
  shiftNumber: number;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  expectedCash: number;
  actualCash?: number;
  discrepancy?: number;
  cashDrops: {
    id: string;
    amount: number;
    reason: string;
    timestamp: string;
  }[];
  status: 'open' | 'closed';
  notes?: string;
}

export interface CustomerCreditAccount {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  creditLimit: number;
  currentBalance: number; // unpaid amount
  dueDate?: string;
  createdAt: string;
  lastPaymentDate?: string;
  notes?: string;
  transactions: {
    id: string;
    saleId?: string;
    date: string;
    type: 'charge' | 'payment';
    amount: number;
    note?: string;
    receivedBy: string;
  }[];
}

export interface Expense {
  id: string;
  date: string;
  category: 'Printing Toner' | 'Paper Stock' | 'Utilities' | 'Equipment Maintenance' | 'Packaging Supplies' | 'Courier / Logistics' | 'Store Miscellaneous';
  amount: number;
  paidVia: 'Cash Register' | 'Store Bank Card' | 'Petty Cash';
  description: string;
  recordedBy: string;
  receiptReference?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  timestamp: string;
  type: 'IN' | 'OUT' | 'AUDIT' | 'RETURN' | 'DAMAGE';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'sale' | 'inventory' | 'staff' | 'shift' | 'expense' | 'security';
  performedBy: string;
  details: string;
  ipAddress?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  taxNumber: string;
  taxRatePercent: number;
  currencySymbol: string;
  receiptHeader: string;
  receiptFooter: string;
  lowStockThresholdDefault: number;
  allowNegativeStock: boolean;
  themeMode: 'light' | 'dark';
  enableFirestoreSync: boolean;
  firestoreConfig?: {
    apiKey?: string;
    projectId?: string;
    databaseId?: string;
    experimentalForceLongPolling?: boolean;
  };
}

export type NotificationSeverity = 'urgent' | 'warning' | 'info' | 'success';
export type NotificationType = 'restock_alert' | 'stock_depleted' | 'system' | 'audit';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  timestamp: string;
  read: boolean;
  productId?: string;
  productName?: string;
  sku?: string;
  currentStock?: number;
  minThreshold?: number;
  unit?: string;
  actionUrl?: string;
}

