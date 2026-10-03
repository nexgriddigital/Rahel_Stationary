import React, { useState, useEffect } from 'react';
import { Product, CartItem, PaymentSplit, PaymentMethod, Sale, ParkedCart, ProductCategory } from '../types';
import { storage } from '../services/storage';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Pause,
  Play,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  DollarSign,
  Percent,
  CheckCircle,
  AlertCircle,
  X,
  Camera,
  ShoppingBag,
  Clock,
  ArrowRight
} from 'lucide-react';

interface PosRegisterViewProps {
  onNavigateToHistory?: () => void;
  onOpenScanner: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const PosRegisterView: React.FC<PosRegisterViewProps> = ({
  onNavigateToHistory,
  onOpenScanner,
  cart,
  setCart
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showHeldCartsDrawer, setShowHeldCartsDrawer] = useState(false);
  const [holdNote, setHoldNote] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [splitError, setSplitError] = useState<string | null>(null);
  const [barcodeToast, setBarcodeToast] = useState<{
    productName: string;
    retailPrice: number;
    barcode: string;
  } | null>(null);
  const [lastRecordedSale, setLastRecordedSale] = useState<Sale | null>(null);

  // Payment splits state
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { method: 'cash', amount: 0 }
  ]);
  const [cashTendered, setCashTendered] = useState<string>('');

  const products = storage.getProducts();
  const settings = storage.getSettings();
  const activeShift = storage.getActiveShift();
  const activeUser = storage.getActiveUser();
  const parkedCarts = storage.getParkedCarts();
  const creditAccounts = storage.getCreditAccounts();

  const categories: (string | ProductCategory)[] = [
    'All',
    'Writing & Pens',
    'Paper & Notebooks',
    'Printing & Copying',
    'Art & Craft',
    'Desk & Office',
    'Binding & Lamination',
    'Packaging & Envelopes',
    'Custom Stamps & Signs'
  ];

  // Cart calculations
  const subtotal = cart.reduce((acc, item) => {
    const price = item.customPrice !== undefined ? item.customPrice : item.product.retailPrice;
    const discountFactor = 1 - (item.appliedDiscountPercent || 0) / 100;
    return acc + price * item.quantity * discountFactor;
  }, 0);

  const taxAmount = 0;
  const totalAmount = Number(subtotal.toFixed(2));

  // Initialize tender payment amount when opening checkout
  useEffect(() => {
    if (showCheckoutModal) {
      setPayments([{ method: 'cash', amount: totalAmount }]);
      setCashTendered(totalAmount.toFixed(2));
    }
  }, [showCheckoutModal, totalAmount]);

  // Cart manipulation
  const addToCart = (product: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { product, quantity: 1, appliedDiscountPercent: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, appliedDiscountPercent: Math.max(0, Math.min(100, discount)) } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Hold / Park Cart
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const newParked: ParkedCart = {
      id: 'parked_' + Date.now(),
      heldAt: new Date().toISOString(),
      note: holdNote || `Held order for ${customerName}`,
      cashierName: activeUser.name,
      customerName: customerName !== 'Walk-in Customer' ? customerName : undefined,
      items: cart
    };
    storage.parkCart(newParked);
    setCart([]);
    setHoldNote('');
    setCustomerName('Walk-in Customer');
  };

  const resumeCart = (parked: ParkedCart) => {
    setCart(parked.items);
    if (parked.customerName) setCustomerName(parked.customerName);
    storage.removeParkedCart(parked.id);
    setShowHeldCartsDrawer(false);
  };

  // Payment splits management
  const handleAddSplit = (method: PaymentMethod) => {
    const currentPaid = payments.reduce((s, p) => s + p.amount, 0);
    const remainder = Math.max(0, Number((totalAmount - currentPaid).toFixed(2)));
    setPayments([...payments, { method, amount: remainder }]);
  };

  const handleRemoveSplit = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleUpdateSplitAmount = (index: number, val: number) => {
    const copy = [...payments];
    copy[index].amount = Math.max(0, val);
    setPayments(copy);
  };

  const handleCompleteSale = () => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalPaid - totalAmount) > 0.05) {
      setSplitError(`Split payments total (${settings.currencySymbol} ${totalPaid.toFixed(2)}) must match order total (${settings.currencySymbol} ${totalAmount.toFixed(2)}).`);
      return;
    }
    setSplitError(null);

    const transactionId = 'TXN-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const sale: Sale = {
      id: 'sale_' + Date.now(),
      transactionId,
      receiptNumber: transactionId,
      timestamp: new Date().toISOString(),
      cashierId: activeUser.id,
      cashierName: activeUser.name,
      shiftId: activeShift ? activeShift.id : 'unassigned',
      items: cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        sku: i.product.sku,
        barcode: i.product.barcode,
        unitPrice: i.customPrice !== undefined ? i.customPrice : i.product.retailPrice,
        costPrice: i.product.costPrice,
        quantity: i.quantity,
        total: Number(((i.customPrice !== undefined ? i.customPrice : i.product.retailPrice) * i.quantity * (1 - (i.appliedDiscountPercent || 0) / 100)).toFixed(2)),
        discountPercent: i.appliedDiscountPercent || 0
      })),
      subtotal,
      taxAmount: 0,
      taxPercent: 0,
      discountAmount: Number((cart.reduce((s, i) => s + i.product.retailPrice * i.quantity, 0) - subtotal).toFixed(2)),
      total: totalAmount,
      payments,
      status: 'completed',
      customerName: customerName,
      customerPhone: customerPhone || undefined
    };

    // Record sale in database and decrement stock for all sold items
    storage.completeSale(sale);
    setCart([]);
    setShowCheckoutModal(false);
    setLastRecordedSale(sale);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = searchTerm.trim();
      if (!query) return;
      const matched = products.find(
        p => p.barcode === query || p.sku.toLowerCase() === query.toLowerCase()
      );
      if (matched) {
        e.preventDefault();
        addToCart(matched);
        setSearchTerm('');
        setBarcodeToast({
          productName: matched.name,
          retailPrice: matched.retailPrice,
          barcode: matched.barcode
        });
        setTimeout(() => setBarcodeToast(null), 3500);
      }
    }
  };

  // Filter products by category & search
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden bg-[#0a0a0c] text-[#f4efe8] relative">
      {/* Barcode Scanned Notification Toast */}
      {barcodeToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-[#141417] border border-[#d4af37] shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-[#d4af37]" />
          <div>
            <span className="font-bold text-[#f5d77f]">{barcodeToast.productName}</span>
            <span className="text-[#a39c90]"> added to sale ({settings.currencySymbol} {barcodeToast.retailPrice.toFixed(2)})</span>
            <span className="ml-2 font-mono text-[10px] text-[#8c8273]">[{barcodeToast.barcode}]</span>
          </div>
        </div>
      )}

      {/* Left Area: Product Catalog & Category Filters */}
      <div className="flex-1 flex flex-col border-r border-[#26221c] overflow-hidden">
        {/* Search & Quick Actions Bar */}
        <div className="p-3.5 border-b border-[#26221c] flex items-center justify-between gap-3 bg-[#121215]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8273]" />
            <input
              type="text"
              placeholder="Search items, SKU, or scan barcode (Press Enter)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#18181d] border border-[#2a261f] text-[#f4efe8] placeholder-[#7d7465] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] hover:brightness-110 text-black text-xs font-bold shadow-sm shadow-[#d4af37]/20 transition-all shrink-0 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-black" />
              <span>Scan Barcode</span>
            </button>

            {parkedCarts.length > 0 && (
              <button
                onClick={() => setShowHeldCartsDrawer(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/35 text-[#f5d77f] text-xs font-semibold transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{parkedCarts.length} Held</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Horizontal Filter Buttons */}
        <div className="px-3.5 py-2 border-b border-[#26221c] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none bg-[#0d0d0f]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-black font-bold shadow-xs'
                  : 'bg-[#18181d] text-[#c2baa9] border border-[#2a261f] hover:border-[#d4af37]/40 hover:text-[#f5d77f]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-3.5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 content-start">
          {filteredProducts.map((p) => {
            const isLowStock = p.stock <= p.minThreshold;
            const inCart = cart.find(c => c.product.id === p.id);
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="group p-3 rounded-2xl bg-[#141417] hover:border-[#d4af37]/70 border border-[#2a261f] text-left transition-all hover:shadow-xs active:scale-98 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Active in cart indicator badge */}
                {inCart && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#d4af37] text-black text-[10px] font-bold font-mono shadow-2xs">
                    {inCart.quantity} in cart
                  </div>
                )}

                <div>
                  <div className="text-[10px] text-[#8c8273] uppercase tracking-wide truncate">
                    {p.category}
                  </div>
                  <h4 className="font-semibold text-xs leading-snug line-clamp-2 text-[#f4efe8] mt-1 group-hover:text-[#f5d77f]">
                    {p.name}
                  </h4>
                  <div className="text-[10px] font-mono text-[#8c8273] mt-1">
                    SKU: {p.sku}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#26221c] flex items-center justify-between">
                  <span className="text-sm font-bold font-mono text-[#f5d77f]">
                    {settings.currencySymbol} {p.retailPrice.toFixed(2)}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-medium ${
                      isLowStock
                        ? 'text-amber-400 font-bold'
                        : 'text-[#8c8273]'
                    }`}
                  >
                    {isLowStock ? `Low: ${p.stock}` : `${p.stock} ${p.unit}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Area: POS Cart Ticket */}
      <div className="w-full lg:w-96 flex flex-col bg-[#0d0d10] border-t lg:border-t-0 border-[#26221c] h-full">
        {/* Ticket Header & Customer assignment */}
        <div className="p-3.5 border-b border-[#26221c] bg-[#121215] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#f5d77f]" />
              <span className="font-bold text-xs text-[#f4efe8]">Current Checkout Ticket</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-rose-400 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Customer Name Selector */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Customer name (or Walk-in)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-[#18181d] border border-[#2a261f] text-[#f4efe8] placeholder-[#7d7465]"
            />
            {cart.length > 0 && (
              <button
                onClick={handleHoldCart}
                title="Hold / Park Cart (F3)"
                className="px-2.5 py-1 rounded-lg bg-[#1e1e24] hover:bg-[#d4af37]/20 text-xs font-medium text-[#f5d77f] border border-[#2a261f] flex items-center gap-1 transition-colors"
              >
                <Pause className="w-3 h-3 text-[#f5d77f]" />
                <span>Hold</span>
              </button>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8c8273] space-y-2">
              <ShoppingBag className="w-10 h-10 opacity-30 stroke-1 text-[#f5d77f]" />
              <div className="text-xs font-medium text-[#c2baa9]">Ticket is empty</div>
              <p className="text-[11px] max-w-[200px]">
                Scan a barcode or click any stationery product from the catalog.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const unitPrice = item.customPrice !== undefined ? item.customPrice : item.product.retailPrice;
              const itemTotal = unitPrice * item.quantity * (1 - (item.appliedDiscountPercent || 0) / 100);
              return (
                <div
                  key={item.product.id}
                  className="p-2.5 rounded-xl bg-[#141417] border border-[#2a261f] shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs leading-snug truncate text-[#f4efe8]">
                        {item.product.name}
                      </div>
                      <div className="text-[10px] text-[#8c8273] font-mono">
                        {settings.currencySymbol} {unitPrice.toFixed(2)} / {item.product.unit}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-xs text-[#f5d77f]">
                      {settings.currencySymbol} {itemTotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Stepper */}
                    <div className="flex items-center rounded-lg border border-[#2a261f] bg-[#1a1a20]">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 hover:bg-[#d4af37]/15 text-[#c2baa9] hover:text-[#f5d77f] rounded-l"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono text-xs font-bold text-[#f4efe8]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 hover:bg-[#d4af37]/15 text-[#c2baa9] hover:text-[#f5d77f] rounded-r"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Discount Input */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <Percent className="w-3 h-3 text-[#8c8273]" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={item.appliedDiscountPercent || ''}
                        onChange={(e) => updateItemDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                        className="w-10 px-1 py-0.5 text-center font-mono text-xs rounded border border-[#2a261f] bg-[#18181d] text-[#f4efe8]"
                      />
                      <span className="text-[10px] text-[#8c8273]">% off</span>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1 text-[#8c8273] hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Calculation Totals & Checkout Trigger */}
        <div className="p-3.5 border-t border-[#26221c] bg-[#121215] space-y-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#8c8273]">
              <span>Subtotal:</span>
              <span className="font-mono text-[#f4efe8]">{settings.currencySymbol} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#f5d77f] pt-1 border-t border-[#26221c]">
              <span>Payable Total:</span>
              <span className="font-mono">{settings.currencySymbol} {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setShowCheckoutModal(true)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none text-black font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#d4af37]/20 transition-all active:scale-98"
          >
            <span>Tender Checkout (F2)</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* Held Orders Drawer */}
      {showHeldCartsDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm h-full bg-[#141417] text-[#f4efe8] p-4 flex flex-col shadow-2xl border-l border-[#d4af37]/30">
            <div className="flex items-center justify-between pb-3 border-b border-[#26221c]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#f5d77f]">
                <Clock className="w-4 h-4 text-[#d4af37]" />
                <span>Parked / Held Customer Orders</span>
              </div>
              <button
                onClick={() => setShowHeldCartsDrawer(false)}
                className="p-1 rounded-lg text-[#8c8273] hover:text-[#f4efe8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {parkedCarts.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#8c8273]">
                  No orders currently held.
                </div>
              ) : (
                parkedCarts.map((pc) => {
                  const pcTotal = pc.items.reduce((s, i) => s + i.product.retailPrice * i.quantity, 0);
                  return (
                    <div
                      key={pc.id}
                      className="p-3 rounded-xl bg-[#18181d] border border-[#2a261f] space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-xs text-[#f4efe8]">
                            {pc.customerName || 'Walk-in Order'}
                          </div>
                          <div className="text-[10px] text-[#8c8273]">
                            Held by {pc.cashierName} · {new Date(pc.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-[#f5d77f]">
                          {settings.currencySymbol} {pcTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#a39c90] truncate">
                        {pc.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => storage.removeParkedCart(pc.id)}
                          className="px-2 py-1 rounded text-[11px] text-rose-400 hover:bg-rose-950/30"
                        >
                          Discard
                        </button>
                        <button
                          onClick={() => resumeCart(pc)}
                          className="flex-1 py-1 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#c59b27] text-black font-bold text-xs flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <Play className="w-3 h-3 text-black" />
                          <span>Resume Order</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Tender Modal (Split Payments) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#d4af37]/35 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#26221c] bg-[#18181d]">
              <div>
                <h3 className="font-semibold text-sm text-[#f5d77f]">Tender Customer Payment</h3>
                <p className="text-[11px] text-[#8c8273]">
                  Split tender across Cash, Card, Mobile, or Customer Credit
                </p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8c8273] hover:text-[#f4efe8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Total Summary Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-black/80 font-bold">
                    Payable Balance Due
                  </div>
                  <div className="text-2xl font-mono font-black">
                    {settings.currencySymbol} {totalAmount.toFixed(2)}
                  </div>
                </div>
                <div className="text-right text-xs text-black/80 font-semibold">
                  <div>Customer: {customerName}</div>
                  <div>Items: {cart.length}</div>
                </div>
              </div>

              {/* Payment Split Rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#a39c90]">
                  <span>Payment Methods Allocated</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddSplit('card')}
                      className="px-2 py-0.5 text-[10px] rounded bg-[#24242c] hover:bg-[#d4af37]/20 text-[#f5d77f] font-bold border border-[#2a261f]"
                    >
                      + Card
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSplit('mobile_transfer')}
                      className="px-2 py-0.5 text-[10px] rounded bg-[#24242c] hover:bg-[#d4af37]/20 text-[#f5d77f] font-bold border border-[#2a261f]"
                    >
                      + Mobile
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSplit('store_credit')}
                      className="px-2 py-0.5 text-[10px] rounded bg-[#24242c] hover:bg-[#d4af37]/20 text-[#f5d77f] font-bold border border-[#2a261f]"
                    >
                      + Credit
                    </button>
                  </div>
                </div>

                {payments.map((split, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#18181d] border border-[#2a261f] flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#24242c] flex items-center justify-center text-[#f5d77f] shrink-0">
                      {split.method === 'cash' && <Banknote className="w-4 h-4" />}
                      {split.method === 'card' && <CreditCard className="w-4 h-4" />}
                      {split.method === 'mobile_transfer' && <Smartphone className="w-4 h-4" />}
                      {split.method === 'store_credit' && <BookOpen className="w-4 h-4" />}
                    </div>

                    <div className="flex-1">
                      <div className="text-xs font-semibold capitalize text-[#f4efe8]">
                        {split.method.replace('_', ' ')}
                      </div>
                      {split.method === 'store_credit' && (
                        <div className="text-[10px] text-amber-400">
                          Charged to account of: {customerName}
                        </div>
                      )}
                    </div>

                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#8c8273]">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={split.amount || ''}
                        onChange={(e) => handleUpdateSplitAmount(idx, parseFloat(e.target.value) || 0)}
                        className="w-full pl-9 pr-2 py-1 font-mono text-xs font-bold rounded-lg border border-[#2a261f] bg-[#141417] text-[#f5d77f] text-right"
                      />
                    </div>

                    {payments.length > 1 && (
                      <button
                        onClick={() => handleRemoveSplit(idx)}
                        className="p-1 text-[#8c8273] hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Cash Change Calculation if Cash method is used */}
              {payments.some(p => p.method === 'cash') && (
                <div className="p-3 rounded-xl bg-[#18181d] border border-[#2a261f] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Cash Tendered by Customer:</span>
                    <div className="relative w-36">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#8c8273]">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        className="w-full pl-9 pr-2 py-1 text-xs font-mono font-bold text-right rounded bg-[#141417] border border-[#2a261f] text-[#f5d77f]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#26221c]">
                    <span className="font-semibold">Cash Change to Return:</span>
                    {(() => {
                      const cashSplit = payments.find(p => p.method === 'cash')?.amount || 0;
                      const given = parseFloat(cashTendered) || 0;
                      const change = Math.max(0, given - cashSplit);
                      return (
                        <span className="font-mono font-bold text-sm text-[#f5d77f]">
                          {settings.currencySymbol} {change.toFixed(2)}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Payment Split Error Banner */}
              {splitError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{splitError}</span>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-[#18181d] border-t border-[#26221c] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCheckoutModal(false);
                  setSplitError(null);
                }}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-[#8c8273] hover:text-[#f4efe8]"
              >
                Back to Register
              </button>

              <button
                type="button"
                onClick={handleCompleteSale}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] hover:brightness-110 text-black font-bold text-xs flex items-center gap-2 shadow-sm shadow-[#d4af37]/20 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-black" />
                <span>Complete & Record Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Recorded Success Confirmation Modal (NO RECEIPTS) */}
      {lastRecordedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-[#141417] text-[#f4efe8] border border-[#2a261f] shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-[#26221c] bg-[#18181d] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#f5d77f]">Sale Recorded Successfully</h3>
                  <p className="text-[11px] text-[#8c8273]">
                    Transaction logged in database & inventory stock updated
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLastRecordedSale(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8c8273] hover:text-[#f4efe8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transaction Overview Body */}
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-2xl bg-[#18181d] border border-[#26221c] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8c8273]">Transaction ID</span>
                  <span className="font-mono font-bold text-[#f5d77f]">
                    {lastRecordedSale.transactionId || lastRecordedSale.receiptNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8c8273]">Date & Time</span>
                  <span className="text-[#c4bbb0]">
                    {new Date(lastRecordedSale.timestamp).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8c8273]">Staff Member</span>
                  <span className="text-[#f4efe8] font-medium">{lastRecordedSale.cashierName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8c8273]">Customer</span>
                  <span className="text-[#f4efe8]">{lastRecordedSale.customerName || 'Walk-in'}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#26221c]">
                  <span className="text-xs font-semibold text-[#8c8273]">Total Sale Amount</span>
                  <span className="font-mono font-extrabold text-base text-[#f5d77f]">
                    {settings.currencySymbol} {lastRecordedSale.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8c8273]">
                  Items Sold ({lastRecordedSale.items.reduce((s, i) => s + i.quantity, 0)} units)
                </div>
                {lastRecordedSale.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#18181d]/60 border border-[#26221c] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#f4efe8] truncate max-w-[220px]">
                        {item.productName}
                      </div>
                      <div className="text-[10px] text-[#8c8273] font-mono">
                        {item.quantity} × {settings.currencySymbol} {item.unitPrice.toFixed(2)}
                        {item.discountPercent > 0 && ` (${item.discountPercent}% off)`}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#f5d77f]">
                      {settings.currencySymbol} {item.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment Methods */}
              <div className="p-2.5 rounded-xl bg-[#18181d] border border-[#26221c] text-xs flex items-center justify-between">
                <span className="text-[#8c8273]">Payment Tendered:</span>
                <span className="font-medium text-[#f5d77f] capitalize">
                  {lastRecordedSale.payments.map(p => `${p.method.replace('_', ' ')} (${settings.currencySymbol} ${p.amount.toFixed(2)})`).join(', ')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-[#18181d] border-t border-[#26221c] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLastRecordedSale(null)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c59b27] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:brightness-110 cursor-pointer"
              >
                <span>Record Next Sale</span>
              </button>
              {onNavigateToHistory && (
                <button
                  type="button"
                  onClick={() => {
                    setLastRecordedSale(null);
                    onNavigateToHistory();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#24242c] hover:bg-[#2e2e38] text-xs font-semibold text-[#f5d77f] border border-[#2a261f] cursor-pointer"
                >
                  Sales History
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
