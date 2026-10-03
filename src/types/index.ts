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
  | 'Paper & Notebooks'
  | 'Printing & Copying'
  | 'Art & Craft'
  | 'Desk & Office'
  | 'Binding & Lamination'
  | 'Packaging & Envelopes'
  | 'Custom Stamps & Signs';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: ProductCategory;
  costPrice: number;
  retailPrice: number;
  stock: number;
  minThreshold: number;
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

export type PaymentMethod = 'cash' | 'card' | 'mobile_transfer' | 'store_credit';

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
  reference?: string; // e.g. Transaction ID or Auth code
  customerName?: string; // Required for store_credit
}

export interface Sale {
  id: string;
  receiptNumber: string;
  timestamp: string;
  cashierId: string;
  cashierName: string;
  shiftId: string;
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
  payments: PaymentSplit[];
  status: 'completed' | 'refunded' | 'partially_refunded';
  customerName?: string;
  customerPhone?: string;
  notes?: string;
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

