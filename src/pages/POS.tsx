import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  User,
  CreditCard,
  DollarSign,
  Receipt,
  Package,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Star,
  Clock,
  TrendingDown,
  X,
  Undo2,
  ChevronRight,
  UserX,
  Archive,
  Eye,
  Wallet,
  ArrowRight,
  Info,
  Camera,
  QrCode,
  HelpCircle,
  TrendingUp,
  Percent
} from 'lucide-react';
import { usePOSStore, SaleItem, PaymentMethod, Sale, SplitPaymentItem } from '../stores/posStore';
import { useInventoryStore, Product } from '../stores/inventoryStore';
import { useCustomerStore, Customer } from '../stores/customersStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { generatePDFReceipt, printPDFReceipt, downloadPDFReceipt, savePDFReceipt } from '../utils/pdfReceiptGenerator';
import { generateUrduPDFReceipt } from '../utils/urduPdfReceiptGenerator';

// Helper function to calculate the true due balance for a customer from sales data
const getCustomerDueBalance = (customerId: string, sales: Sale[]): number => {
  const customerIdNum = parseInt(customerId, 10);
  return sales
    .filter(sale => sale.customerId === customerIdNum)
    .reduce((totalDue, sale) => totalDue + (sale.dueAmount || 0), 0);
};

// Helper function to highlight matching search text
const HighlightText: React.FC<{ text: string; search: string }> = ({ text, search }) => {
  if (!search.trim()) return <>{text}</>;
  const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/80 text-gray-900 dark:text-white rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

type QuickFilterType = 'all' | 'favorites' | 'recent' | 'lowStock' | 'outOfStock';

interface UndoState {
  item: SaleItem;
  timeoutId: NodeJS.Timeout;
}

interface HeldSale {
  holdId: string;
  cart: SaleItem[];
  selectedCustomer: Customer | null;
  discount: number;
  orderDiscountType?: 'percentage' | 'fixed' | null;
  orderDiscountValue?: number;
  orderDiscountReason?: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
  payments?: SplitPaymentItem[];
}

const HeldSalesStorage = {
  getHeldSales: async (): Promise<HeldSale[]> => {
    const data = localStorage.getItem('sanishop_held_sales');
    return data ? JSON.parse(data) : [];
  },
  saveHeldSale: async (heldSale: HeldSale): Promise<void> => {
    const current = await HeldSalesStorage.getHeldSales();
    current.push(heldSale);
    localStorage.setItem('sanishop_held_sales', JSON.stringify(current));
  },
  deleteHeldSale: async (holdId: string): Promise<void> => {
    const current = await HeldSalesStorage.getHeldSales();
    const updated = current.filter(s => s.holdId !== holdId);
    localStorage.setItem('sanishop_held_sales', JSON.stringify(updated));
  }
};

const AVAILABLE_PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: any }[] = [
  { id: 'cash', label: 'Cash', icon: DollarSign },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Layers },
  { id: 'mobile_wallet', label: 'Mobile Wallet', icon: Wallet },
  { id: 'credit', label: 'Store Credit', icon: User },
  { id: 'other', label: 'Other', icon: Info },
];

const PRESET_DISCOUNT_REASONS = ['Promotion', 'VIP Customer', 'Employee Discount', 'Clearance Sale', 'Damaged Packaging', 'Manual Adjustment'];
const PRESET_ITEM_NOTES = ['Extra Cheese', 'Different Color', 'Fragile', 'No Packaging', 'Gift Wrap', 'Urgent Delivery'];
const PRESET_ORDER_NOTES = ['Deliver Tomorrow', 'Gift Packaging', 'Customer Requested Exchange', 'Priority Order', 'Hold Shipment'];
const LOYALTY_RULES = {
  pointsPerUnitSpent: 0.01,
  pointsRedemptionValue: 1.0,
};

// Memoized Product Grid Item to prevent massive catalog card renders when typing or adding items
interface ProductItemProps {
  product: Product;
  categoryName: string;
  isFavorite: boolean;
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (id: number) => void;
  searchTerm: string;
}

const ProductItem: React.FC<ProductItemProps> = React.memo(({
  product,
  categoryName,
  isFavorite,
  isInCart,
  onAddToCart,
  onToggleFavorite,
  searchTerm
}) => {
  const isLow = product.stock <= product.minStock && product.stock > 0;
  const isOut = product.stock <= 0;

  return (
    <div
      role="button"
      tabIndex={isOut ? -1 : 0}
      aria-disabled={isOut}
      onClick={() => { if (!isOut) onAddToCart(product); }}
      onKeyDown={(e) => {
        if (!isOut && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onAddToCart(product);
        }
      }}
      className={`group relative flex flex-col text-left bg-white dark:bg-gray-900 border rounded-2xl p-4 transition-all duration-150 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 ${
        !isOut ? 'active:scale-[0.98] cursor-pointer' : 'cursor-not-allowed'
      } ${isInCart
          ? 'ring-2 ring-indigo-600 border-transparent bg-indigo-50/15 dark:bg-indigo-950/10'
          : 'border-gray-200/80 dark:border-gray-800/85'
        } ${isOut ? 'opacity-50 bg-gray-50/50 dark:bg-gray-950/20' : ''}`}
    >
      {/* Star Favorite Toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(product.id);
        }}
        className="absolute top-2.5 right-2.5 p-1 text-gray-300 dark:text-gray-600 hover:text-amber-500 hover:scale-110 active:scale-95 transition-all z-10"
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={`h-4 w-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
      </button>

      <div className="flex-1 min-w-0 pr-6 w-full">
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {categoryName}
          </span>
          {isOut ? (
            <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Out</span>
          ) : isLow ? (
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Low</span>
          ) : null}
        </div>
        <h4 className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          <HighlightText text={product.name} search={searchTerm} />
        </h4>
        {product.nameUrdu && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate font-urdu mt-1" dir="rtl">
            {product.nameUrdu}
          </p>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/60 flex items-end justify-between w-full">
        <div>
          <span className="text-[10px] text-gray-400 block font-semibold">Unit Price</span>
          <span className="text-base font-black text-gray-950 dark:text-white">
            Rs {product.price.toLocaleString()}
          </span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
          Stock: {product.stock}
        </span>
      </div>
    </div>
  );
});

ProductItem.displayName = 'ProductItem';

const POS: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    cart,
    selectedCustomer: rawSelectedCustomer,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    selectCustomer,
    addSale,
    sales
  } = usePOSStore();

  const { products, categories } = useInventoryStore();
  const { customers, addCustomer } = useCustomerStore();
  const { settings } = useSettingsStore();

  const selectedCustomer = useMemo(() => {
    if (!rawSelectedCustomer) return null;
    return customers.find(c => c.id === rawSelectedCustomer.id) || rawSelectedCustomer;
  }, [rawSelectedCustomer, customers]);

  // Product Discovery States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterType>('all');

  // Checkout & Split Payments State
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [orderDiscountType, setOrderDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [orderDiscountValue, setOrderDiscountValue] = useState<number>(0);
  const [orderDiscountReason, setOrderDiscountReason] = useState<string>('');
  const [cartNotes, setCartNotes] = useState<string>('');

  // Item discount/note dialog state
  const [selectedCartItem, setSelectedCartItem] = useState<SaleItem | null>(null);
  const [itemNote, setItemNote] = useState<string>('');
  const [itemDiscountType, setItemDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [itemDiscountValue, setItemDiscountValue] = useState<number>(0);
  const [itemDiscountReason, setItemDiscountReason] = useState<string>('');
  const [itemValidationError, setItemValidationError] = useState<string | null>(null);

  // Order-level discount modal state
  const [showOrderDiscountModal, setShowOrderDiscountModal] = useState<boolean>(false);
  const [showOrderNotesModal, setShowOrderNotesModal] = useState<boolean>(false);
  const [orderValidationError, setOrderValidationError] = useState<string | null>(null);

  // Loyalty & Customer Experience States
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);
  const [showCustomerXPModal, setShowCustomerXPModal] = useState<boolean>(false);
  const [pointsToRedeemInput, setPointsToRedeemInput] = useState<string>('');
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);

  // Checkout Confirmation & Success States
  const [showCheckoutReviewModal, setShowCheckoutReviewModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [completedSaleData, setCompletedSaleData] = useState<any>(null);
  const [checkoutStockPreview, setCheckoutStockPreview] = useState<{ product: Product; remainingStock: number; willBeOutOfStock: boolean; willBeLowStock: boolean }[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showHotkeysHelp, setShowHotkeysHelp] = useState(false);

  // Simulated Loading State for commercial skeleton intro
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  // Page catalog slice count for rendering performance optimization
  const [visibleProductsCount, setVisibleProductsCount] = useState(48);

  const [payments, setPayments] = useState<SplitPaymentItem[]>([
    { method: 'cash', amount: 0, reference: '' }
  ]);
  const [isPaymentEdited, setIsPaymentEdited] = useState(false);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Universal Product Input System States
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pos_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const [recentlyScannedIds, setRecentlyScannedIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pos_recently_scanned') || '[]');
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [quickAccessTab, setQuickAccessTab] = useState<'favorites' | 'popular' | 'recent_scans'>('favorites');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // USB Scanner heuristic variables
  const [scanBuffer, setScanBuffer] = useState('');
  const [lastCharTime, setLastCharTime] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Simulate premium content load on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Reset display catalog size limit on catalog filter changes
  useEffect(() => {
    setVisibleProductsCount(48);
  }, [searchTerm, selectedCategoryId, activeQuickFilter]);

  // Centralized Toast trigger
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  // Web Audio feedback beep
  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime); // 1100 Hz
      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime); // 6% volume

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.07); // 70ms duration
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }, []);

  // Toggle Favorite
  const toggleFavorite = useCallback((productId: number) => {
    setFavoriteIds(prev => {
      const next = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
      localStorage.setItem('pos_favorites', JSON.stringify(next));
      return next;
    });
    showToast('Favorites updated', 'info');
  }, [showToast]);

  // Record a product scan / addition
  const recordRecentScan = useCallback((productId: number) => {
    setRecentlyScannedIds(prev => {
      const filtered = prev.filter(id => id !== productId);
      const next = [productId, ...filtered].slice(0, 12);
      localStorage.setItem('pos_recently_scanned', JSON.stringify(next));
      return next;
    });
  }, []);

  // Enhanced Add to Cart with feedback
  const handleAddToCartWithTelemetry = useCallback((product: Product, isScan = false) => {
    if (product.stock <= 0) {
      showToast(`${product.name} is currently out of stock.`, 'error');
      return;
    }
    addToCart(product);
    playBeep();
    recordRecentScan(product.id);
    showToast(`${isScan ? 'Scanned' : 'Added'}: ${product.name}`, 'success');
  }, [addToCart, playBeep, recordRecentScan, showToast]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      const video = document.getElementById('scanner-video') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        video.play();
      }
    } catch (err) {
      showToast('Could not initialize camera stream. Ensure permission is granted.', 'error');
      console.warn('Camera stream request failed:', err);
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const frequentlySold = useMemo(() => {
    const counts: Record<number, number> = {};
    sales.forEach(s => {
      if (s.items) {
        s.items.forEach(item => {
          if (item.product) {
            counts[item.product.id] = (counts[item.product.id] || 0) + item.quantity;
          }
        });
      }
    });
    return products
      .filter(p => counts[p.id] > 0)
      .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
      .slice(0, 12);
  }, [sales, products]);

  const favoriteProducts = useMemo(() => {
    return products.filter(p => favoriteIds.includes(p.id));
  }, [products, favoriteIds]);

  const recentlyScannedProducts = useMemo(() => {
    return recentlyScannedIds
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }, [products, recentlyScannedIds]);

  const suggestions = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return [];
    return products.filter(product => {
      const matchName = product.name.toLowerCase().includes(query);
      const matchBarcode = product.barcode?.toLowerCase().includes(query) || false;
      const matchID = product.id.toString().includes(query);
      const matchCategory = categories.find(c => c.id === product.categoryId)?.name.toLowerCase().includes(query) || false;
      return matchName || matchBarcode || matchID || matchCategory;
    });
  }, [products, categories, searchTerm]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && activeIndex >= 0 && activeIndex < suggestions.length) {
        const selected = suggestions[activeIndex];
        handleAddToCartWithTelemetry(selected, false);
        setSearchTerm('');
        setActiveIndex(-1);
        setShowSuggestions(false);
      } else {
        const query = searchTerm.trim();
        if (query) {
          const matched = products.find(p => p.barcode === query || p.id.toString() === query);
          if (matched) {
            handleAddToCartWithTelemetry(matched, true);
            setSearchTerm('');
            setShowSuggestions(false);
          } else {
            if (suggestions.length === 1) {
              handleAddToCartWithTelemetry(suggestions[0], false);
              setSearchTerm('');
              setShowSuggestions(false);
            } else if (suggestions.length > 0) {
              handleAddToCartWithTelemetry(suggestions[0], false);
              setSearchTerm('');
              setShowSuggestions(false);
            } else {
              showToast(`Product lookup failed for "${query}"`, 'error');
            }
          }
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveIndex(prev => (prev + 1) % Math.max(1, suggestions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveIndex(prev => (prev - 1 + suggestions.length) % Math.max(1, suggestions.length));
    } else if (e.key === 'Escape') {
      setSearchTerm('');
      setActiveIndex(-1);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const container = document.getElementById('search-bar-container');
      if (container && !container.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    customerType: 'Regular'
  });

  // Held Sales States
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [showHeldSalesPanel, setShowHeldSalesPanel] = useState(false);
  const [heldSearchTerm, setHeldSearchTerm] = useState('');
  const [selectedSummarySale, setSelectedSummarySale] = useState<HeldSale | null>(null);
  const [pendingResumeSale, setPendingResumeSale] = useState<HeldSale | null>(null);
  const [showOverwriteConfirmation, setShowOverwriteConfirmation] = useState(false);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Smart Cart Undo Mechanism Stack
  const [undoStack, setUndoStack] = useState<Record<string, UndoState>>({});

  // Clean up timers on unmount & run time-elapsed ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setNowTime(Date.now());
    }, 10000);

    return () => {
      Object.values(undoStack).forEach(u => clearTimeout(u.timeoutId));
      clearInterval(ticker);
    };
  }, [undoStack]);

  // Load Held Sales Initially
  useEffect(() => {
    HeldSalesStorage.getHeldSales().then(setHeldSales);
  }, []);

  // Centralized Discount Calculation Engine
  const calculateItemDiscount = useCallback((item: SaleItem) => {
    const originalPrice = item.product.price;
    let discountAmount = 0;

    if (item.discountType === 'percentage' && item.discountValue) {
      discountAmount = (originalPrice * item.discountValue) / 100;
    } else if (item.discountType === 'fixed' && item.discountValue) {
      discountAmount = item.discountValue;
    }

    discountAmount = Math.max(0, Math.min(originalPrice, discountAmount));
    const finalPrice = Math.max(0, originalPrice - discountAmount);
    const finalSubtotal = finalPrice * item.quantity;
    const originalSubtotal = originalPrice * item.quantity;
    const totalItemDiscount = discountAmount * item.quantity;

    return {
      originalPrice,
      discountAmount,
      finalPrice,
      originalSubtotal,
      totalItemDiscount,
      finalSubtotal
    };
  }, []);

  const cartItemTotals = useMemo(() => {
    return cart.map(item => ({
      item,
      calc: calculateItemDiscount(item)
    }));
  }, [cart, calculateItemDiscount]);

  const subtotal = useMemo(() => {
    return cartItemTotals.reduce((sum, current) => sum + current.calc.originalSubtotal, 0);
  }, [cartItemTotals]);

  const itemsFinalTotalBeforeOrderDiscount = useMemo(() => {
    return cartItemTotals.reduce((sum, current) => sum + current.calc.finalSubtotal, 0);
  }, [cartItemTotals]);

  const totalItemDiscountsSum = useMemo(() => {
    return cartItemTotals.reduce((sum, current) => sum + current.calc.totalItemDiscount, 0);
  }, [cartItemTotals]);

  const orderDiscountAmount = useMemo(() => {
    let amount = 0;
    const base = itemsFinalTotalBeforeOrderDiscount;
    if (orderDiscountType === 'percentage' && orderDiscountValue) {
      amount = (base * orderDiscountValue) / 100;
    } else if (orderDiscountType === 'fixed' && orderDiscountValue) {
      amount = orderDiscountValue;
    }
    return Math.max(0, Math.min(base, amount));
  }, [itemsFinalTotalBeforeOrderDiscount, orderDiscountType, orderDiscountValue]);

  const pointsDiscount = useMemo(() => {
    return redeemedPoints * LOYALTY_RULES.pointsRedemptionValue;
  }, [redeemedPoints]);

  const discount = totalItemDiscountsSum + orderDiscountAmount + pointsDiscount;
  const tax = 0;
  const finalAmount = Math.max(0, itemsFinalTotalBeforeOrderDiscount - orderDiscountAmount - pointsDiscount + tax);

  const pointsEarned = useMemo(() => {
    return Math.floor(finalAmount * LOYALTY_RULES.pointsPerUnitSpent);
  }, [finalAmount]);

  // Sync payments total automatically when cart final amount transforms
  useEffect(() => {
    if (!isPaymentEdited && payments.length === 1) {
      setPayments([{ ...payments[0], amount: finalAmount }]);
    }
  }, [finalAmount, isPaymentEdited, payments.length]);

  // Real-time payment calculation summary engine
  const totalPaidAmount = useMemo(() => {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, finalAmount - totalPaidAmount);
  }, [finalAmount, totalPaidAmount]);

  const absoluteChangeDue = useMemo(() => {
    return Math.max(0, totalPaidAmount - finalAmount);
  }, [finalAmount, totalPaidAmount]);

  const computedPaymentStatus = useMemo(() => {
    if (totalPaidAmount >= finalAmount) return 'Fully Paid';
    if (totalPaidAmount > 0) return 'Partially Paid';
    return 'Credit Sale';
  }, [finalAmount, totalPaidAmount]);

  // Customer Analytics Engine (Modular Calculations)
  const customerAnalytics = useMemo(() => {
    if (!selectedCustomer) return null;

    const customerSales = sales.filter(s => s.customerId === selectedCustomer.id);
    const totalOrders = customerSales.length;
    const lifetimeSpending = customerSales.reduce((sum, s) => sum + s.finalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? lifetimeSpending / totalOrders : 0;

    let lastPurchaseDate: Date | null = null;
    if (customerSales.length > 0) {
      const dates = customerSales.map(s => new Date(s.createdAt).getTime());
      lastPurchaseDate = new Date(Math.max(...dates));
    }

    const last5Purchases = [...customerSales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const productCounts: Record<number, { product: Product; count: number }> = {};
    customerSales.forEach(s => {
      s.items.forEach(item => {
        if (item.productId && item.productName) {
          const storeProduct = products.find(p => p.id === item.productId) || {
            id: item.productId,
            name: item.productName,
            price: item.productPrice,
            stock: 99,
            categoryId: 0,
            sku: '',
            barcode: ''
          };

          if (productCounts[item.productId]) {
            productCounts[item.productId].count += item.quantity;
          } else {
            productCounts[item.productId] = { product: storeProduct as any, count: item.quantity };
          }
        }
      });
    });

    const frequentlyPurchased = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const categoryCounts: Record<number, number> = {};
    customerSales.forEach(s => {
      s.items.forEach(item => {
        if (item.productId) {
          const catId = item.product?.categoryId || 0;
          if (catId) {
            categoryCounts[catId] = (categoryCounts[catId] || 0) + item.quantity;
          }
        }
      });
    });

    let favoriteCategoryId: number | null = null;
    let maxCatCount = 0;
    Object.entries(categoryCounts).forEach(([catId, count]) => {
      if (count > maxCatCount) {
        maxCatCount = count;
        favoriteCategoryId = parseInt(catId, 10);
      }
    });

    const favoriteCategory = categories.find(c => c.id === favoriteCategoryId)?.name || 'N/A';

    let tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Bronze';
    if (lifetimeSpending >= 50000 || totalOrders >= 25) {
      tier = 'Platinum';
    } else if (lifetimeSpending >= 15000 || totalOrders >= 10) {
      tier = 'Gold';
    } else if (lifetimeSpending >= 5000 || totalOrders >= 3) {
      tier = 'Silver';
    }

    return {
      totalOrders,
      lifetimeSpending,
      averageOrderValue,
      lastPurchaseDate,
      last5Purchases,
      frequentlyPurchased,
      favoriteCategory,
      tier
    };
  }, [selectedCustomer, sales, categories, products]);

  const handlePrintPastReceipt = (sale: Sale) => {
    const receiptData = {
      sale: {
        ...sale,
        createdAt: new Date(sale.createdAt)
      },
      customer: selectedCustomer || undefined,
      shopInfo: settings
    };
    printPDFReceipt(receiptData);
    showToast('Re-printing past receipt...', 'info');
  };

  const handleOpenItemEditDialog = (item: SaleItem) => {
    setSelectedCartItem(item);
    setItemNote(item.notes || '');
    setItemDiscountType(item.discountType || null);
    setItemDiscountValue(item.discountValue || 0);
    setItemDiscountReason(item.discountReason || '');
    setItemValidationError(null);
  };

  const handleSaveItemEdit = () => {
    if (!selectedCartItem) return;

    if (itemDiscountType) {
      if (itemDiscountValue < 0) {
        setItemValidationError('Discount value cannot be negative');
        return;
      }
      if (itemDiscountType === 'percentage' && itemDiscountValue > 100) {
        setItemValidationError('Percentage discount cannot exceed 100%');
        return;
      }
      if (itemDiscountType === 'fixed' && itemDiscountValue > selectedCartItem.product.price) {
        setItemValidationError('Discount amount cannot exceed original product price');
        return;
      }
    }

    usePOSStore.getState().updateCartItemDiscount(selectedCartItem.product.id.toString(), itemDiscountType, itemDiscountValue, itemDiscountReason);
    usePOSStore.getState().updateCartItemNote(selectedCartItem.product.id.toString(), itemNote);
    setSelectedCartItem(null);
    showToast('Cart item settings updated', 'success');
  };

  // Live validator effect routines
  useEffect(() => {
    let errorMsg: string | null = null;

    for (const p of payments) {
      if (p.amount < 0) {
        errorMsg = 'Negative values are not permitted in payment rows.';
        break;
      }
    }

    if (!errorMsg && payments.some(p => !p.method)) {
      errorMsg = 'Please select a valid payment method for all fields.';
    }

    setValidationError(errorMsg);
  }, [payments]);

  // Split Payment Action Matrix
  const handleAddPaymentRow = () => {
    setPayments(prev => [...prev, { method: 'cash', amount: remainingBalance, reference: '' }]);
    setIsPaymentEdited(true);
    showToast('Split payment mode activated', 'info');
  };

  const handleRemovePaymentRow = (index: number) => {
    if (payments.length === 1) return;
    setPayments(prev => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 1) {
        setIsPaymentEdited(false);
      }
      return next;
    });
    showToast('Payment row removed', 'info');
  };

  const handleUpdatePaymentValue = (index: number, key: keyof SplitPaymentItem, val: any) => {
    if (key === 'amount') {
      setIsPaymentEdited(true);
    }
    setPayments(prev => prev.map((p, idx) => {
      if (idx !== index) return p;
      if (key === 'amount') {
        const numVal = val === '' ? 0 : parseFloat(val);
        return { ...p, amount: isNaN(numVal) ? 0 : numVal };
      }
      return { ...p, [key]: val };
    }));
  };

  const handleQuickPayFull = (method: PaymentMethod) => {
    setPayments([{ method, amount: finalAmount, reference: '' }]);
    setIsPaymentEdited(false);
    showToast(`Quick allocation: ${method}`, 'success');
  };

  const handleSmartRemove = useCallback((item: SaleItem) => {
    const id = item.product.id;
    removeFromCart(id.toString());
    showToast(`Removed from cart: ${item.product.name}`, 'info');

    if (undoStack[id]) {
      clearTimeout(undoStack[id].timeoutId);
    }

    const timeoutId = setTimeout(() => {
      setUndoStack(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }, 5000);

    setUndoStack(prev => ({
      ...prev,
      [id]: { item, timeoutId }
    }));
  }, [removeFromCart, showToast, undoStack]);

  const handleUndoRemove = useCallback((productId: string) => {
    const target = undoStack[productId];
    if (!target) return;

    clearTimeout(target.timeoutId);
    addToCart(target.item.product, target.item.quantity);

    setUndoStack(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
    showToast(`Restored: ${target.item.product.name}`, 'success');
  }, [addToCart, showToast, undoStack]);

  const handleHoldSale = async () => {
    if (cart.length === 0) return;

    const randomId = Math.floor(1000 + Math.random() * 9000).toString();
    const holdId = `HOLD-${randomId}`;

    const heldSale: HeldSale = {
      holdId,
      cart,
      selectedCustomer,
      discount,
      orderDiscountType,
      orderDiscountValue,
      orderDiscountReason,
      amountPaid: totalPaidAmount,
      paymentMethod: payments[0]?.method || 'cash',
      payments,
      notes: cartNotes,
      createdAt: new Date().toISOString()
    };

    try {
      await HeldSalesStorage.saveHeldSale(heldSale);
      const updatedList = await HeldSalesStorage.getHeldSales();
      setHeldSales(updatedList);

      clearCart();
      setOrderDiscountType(null);
      setOrderDiscountValue(0);
      setOrderDiscountReason('');
      setCartNotes('');
      setPayments([{ method: 'cash', amount: 0, reference: '' }]);
      setIsPaymentEdited(false);
      setUndoStack({});
      showToast(`Sale held on ticket ID ${holdId}`, 'success');
    } catch (error) {
      console.error('Failed to hold sale:', error);
      showToast('Failed to hold the current sale record.', 'error');
    }
  };

  const executeResumeSale = async (targetSale: HeldSale) => {
    clearCart();

    targetSale.cart.forEach(item => {
      addToCart(item.product, item.quantity);
      if (item.discountType || item.notes) {
        usePOSStore.setState(state => ({
          cart: state.cart.map(cItem =>
            cItem.product.id === item.product.id
              ? { ...cItem, discountType: item.discountType, discountValue: item.discountValue, discountReason: item.discountReason, notes: item.notes }
              : cItem
          )
        }));
      }
    });
    selectCustomer(targetSale.selectedCustomer);
    setOrderDiscountType(targetSale.orderDiscountType || null);
    setOrderDiscountValue(targetSale.orderDiscountValue || 0);
    setOrderDiscountReason(targetSale.orderDiscountReason || '');
    setCartNotes(targetSale.notes || '');

    if (targetSale.payments && targetSale.payments.length > 0) {
      setPayments(targetSale.payments);
      setIsPaymentEdited(true);
    } else {
      setPayments([{ method: targetSale.paymentMethod || 'cash', amount: targetSale.amountPaid || 0, reference: '' }]);
      setIsPaymentEdited(targetSale.amountPaid !== targetSale.finalAmount);
    }

    await HeldSalesStorage.deleteHeldSale(targetSale.holdId);
    const updatedList = await HeldSalesStorage.getHeldSales();
    setHeldSales(updatedList);

    setShowOverwriteConfirmation(false);
    setPendingResumeSale(null);
    setShowHeldSalesPanel(false);
    showToast(`Resumed held ticket: ${targetSale.holdId}`, 'success');
  };

  const handleResumeSaleClick = (targetSale: HeldSale) => {
    if (cart.length > 0) {
      setPendingResumeSale(targetSale);
      setShowOverwriteConfirmation(true);
    } else {
      executeResumeSale(targetSale);
    }
  };

  const handleDeleteHeldSale = async (holdId: string) => {
    // Elegant check replacement or secure dialog confirmation
    if (window.confirm('Delete suspended ticket permanently?')) {
      await HeldSalesStorage.deleteHeldSale(holdId);
      const updatedList = await HeldSalesStorage.getHeldSales();
      setHeldSales(updatedList);
      if (selectedSummarySale?.holdId === holdId) {
        setSelectedSummarySale(null);
      }
      showToast('Held sale deleted', 'info');
    }
  };

  const getElapsedTime = (isoString: string) => {
    const diffMs = nowTime - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    return `${diffMins} mins ago`;
  };

  const filteredHeldSales = useMemo(() => {
    return heldSales.filter(sale => {
      const query = heldSearchTerm.toLowerCase().trim();
      if (!query) return true;
      const matchId = sale.holdId.toLowerCase().includes(query);
      const matchCustomer = (sale.selectedCustomer?.name || 'walk-in customer').toLowerCase().includes(query);
      return matchId || matchCustomer;
    });
  }, [heldSales, heldSearchTerm]);

  const categoryCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    products.forEach(p => {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (selectedCategoryId !== null && product.categoryId !== selectedCategoryId) return false;
      if (activeQuickFilter === 'outOfStock' && product.stock > 0) return false;
      if (activeQuickFilter === 'lowStock' && (product.stock > product.minStock || product.stock <= 0)) return false;

      if (activeQuickFilter === 'recent') {
        const createdDate = new Date(product.createdAt).getTime();
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (createdDate < thirtyDaysAgo) return false;
      }

      if (activeQuickFilter === 'favorites') {
        if (!favoriteIds.includes(product.id)) return false;
      }

      if (searchTerm.trim()) {
        const cleanQuery = searchTerm.toLowerCase().trim();
        const matchName = product.name.toLowerCase().includes(cleanQuery);
        const matchBarcode = product.barcode?.toLowerCase().includes(cleanQuery) || false;
        const matchCategory = categories.find(c => c.id === product.categoryId)?.name.toLowerCase().includes(cleanQuery) || false;
        return matchName || matchBarcode || matchCategory;
      }
      return true;
    });
  }, [products, categories, searchTerm, selectedCategoryId, activeQuickFilter, favoriteIds]);

  // Slice displayed products grid for rapid re-render performance
  const visibleProductsList = useMemo(() => {
    return filteredProducts.slice(0, visibleProductsCount);
  }, [filteredProducts, visibleProductsCount]);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    const calculatedDue = Math.max(0, finalAmount - totalPaidAmount);
    if (calculatedDue > 0 && !selectedCustomer) {
      showToast('Please link customer account for outstanding due / credit sales.', 'error');
      return;
    }

    setIsCheckoutLoading(true);

    const primaryMethod = payments.length === 1 ? payments[0].method : 'cash';

    const businessName = useSettingsStore.getState().settings?.name || useAuthStore.getState().workspaceName || 'S';
    const prefix = businessName.charAt(0).toUpperCase() || 'S';
    
    const existingSales = usePOSStore.getState().sales;
    let maxId = existingSales.length;
    existingSales.forEach(s => {
       if (s.invoiceNumber) {
          const parts = s.invoiceNumber.split('-');
          if (parts.length > 1) {
             const num = parseInt(parts[parts.length - 1], 10);
             if (!isNaN(num) && num > maxId) maxId = num;
          }
       }
    });
    const generatedInvoiceNumber = `${prefix}-${maxId + 1}`;

    const sale = {
      invoiceNumber: generatedInvoiceNumber,
      items: cart,
      total: subtotal,
      tax,
      discount,
      finalAmount,
      amountPaid: totalPaidAmount,
      change: absoluteChangeDue,
      dueAmount: calculatedDue,
      paymentMethod: primaryMethod,
      payments,
      paymentStatus: computedPaymentStatus,
      customerId: selectedCustomer?.id,
      cashierId: useAuthStore.getState().user?.id?.toString() || 'admin',
      notes: cartNotes,
      discountType: orderDiscountType,
      discountValue: orderDiscountValue,
      discountReason: orderDiscountReason
    };

    try {
      // Loyalty points logic
      if (selectedCustomer) {
        const netPointsChange = pointsEarned - redeemedPoints;
        if (netPointsChange !== 0) {
          await useCustomerStore.getState().updateCustomerLoyaltyPoints(selectedCustomer.id, netPointsChange);
        }
      }

      await addSale(sale);

      const latestSales = usePOSStore.getState().sales;
      const actualInvoiceId = latestSales[0]?.id || Date.now().toString().slice(-6);

      const receiptData = {
        sale: {
          ...sale,
          id: actualInvoiceId.toString(),
          invoiceNumber: generatedInvoiceNumber,
          createdAt: new Date(),
        },
        customer: selectedCustomer || undefined,
        shopInfo: settings,
      };

      setCompletedSaleData({
        invoiceNumber: generatedInvoiceNumber,
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-In Customer',
        totalAmount: finalAmount,
        paymentStatus: computedPaymentStatus,
        receiptData
      });

      // Auto-save receipt silently on sale completion
      setTimeout(() => {
        savePDFReceipt(receiptData);
      }, 500);

      clearCart();
      setOrderDiscountType(null);
      setOrderDiscountValue(0);
      setOrderDiscountReason('');
      setCartNotes('');
      setRedeemedPoints(0);
      setPointsToRedeemInput('');
      setPayments([{ method: 'cash', amount: 0, reference: '' }]);
      setIsPaymentEdited(false);
      setUndoStack({});

      setShowCheckoutReviewModal(false);
      setShowSuccessModal(true);
      showToast('Sale checkout completed successfully!', 'success');
    } catch (error) {
      console.error('Failed to complete sale:', error);
      showToast('Failed to record sale. Check details in database logs.', 'error');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      showToast('Cart is currently empty.', 'error');
      return;
    }

    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    // Initialize default payment to full finalAmount if not manually edited yet
    if (!isPaymentEdited || (payments.length === 1 && payments[0].amount === 0)) {
      setPayments([{ method: payments[0]?.method || 'cash', amount: finalAmount, reference: '' }]);
    }

    // Recalculate remaining balance check inline
    const computedTotalPaid = (!isPaymentEdited || (payments.length === 1 && payments[0].amount === 0)) ? finalAmount : totalPaidAmount;
    const computedRemaining = Math.max(0, finalAmount - computedTotalPaid);
    
    if (computedRemaining > 0 && !selectedCustomer) {
      showToast('Please select a customer before finalizing credit/partial checkout invoices.', 'error');
      return;
    }

    const stockPreview = cart.map(item => {
      const remainingStock = item.product.stock - item.quantity;
      return {
        product: item.product,
        remainingStock,
        willBeOutOfStock: remainingStock <= 0,
        willBeLowStock: remainingStock > 0 && remainingStock < 5
      };
    });

    setCheckoutStockPreview(stockPreview);
    setShowCheckoutReviewModal(true);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      showToast('Customer name is required', 'error');
      return;
    }
    setIsAddingCustomer(true);
    try {
      await addCustomer({ ...newCustomer, pendingAmount: 0, loyaltyPoints: 0 } as any);
      setNewCustomer({ name: '', phone: '', email: '', address: '', customerType: 'Regular' });
      setShowAddCustomerModal(false);
      showToast('Customer profile added successfully!', 'success');
    } catch (e) {
      showToast('Error registering customer.', 'error');
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = customerSearchTerm.toLowerCase().trim();
      return c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
    });
  }, [customers, customerSearchTerm]);

  // Unified global keyboard shortcut stream list
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Focus search field (F2 or '/' outside text fields)
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key === '/') {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
        return;
      }

      // 2. Open Customer link (F4)
      if (e.key === 'F4') {
        e.preventDefault();
        setShowCustomerModal(true);
        return;
      }

      // 3. Reset Cart registry (F7)
      if (e.key === 'F7') {
        e.preventDefault();
        if (cart.length > 0) {
          clearCart();
          showToast('Cart has been cleared.', 'info');
        }
        return;
      }

      // 4. Hold Ticket (F8)
      if (e.key === 'F8') {
        e.preventDefault();
        handleHoldSale();
        return;
      }

      // 5. Pay / Finalize Invoice (F9)
      if (e.key === 'F9') {
        e.preventDefault();
        if (showCheckoutReviewModal) {
          handleCompleteSale();
        } else {
          handleCheckoutClick();
        }
        return;
      }

      // Scanner heuristics buffer capture
      const currentTime = Date.now();
      const timeDiff = currentTime - lastCharTime;

      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        if (timeDiff > 45 && document.activeElement?.id !== 'pos-search-input') {
          setScanBuffer(e.key);
        } else {
          setScanBuffer(prev => prev + e.key);
        }
        setLastCharTime(currentTime);
      } else if (e.key === 'Enter') {
        const buffer = scanBuffer.trim();
        if (buffer) {
          const matchedProduct = products.find(p => p.barcode === buffer || p.id.toString() === buffer);
          if (matchedProduct) {
            e.preventDefault();
            e.stopPropagation();
            handleAddToCartWithTelemetry(matchedProduct, true);
            setScanBuffer('');
            setSearchTerm('');
            setShowSuggestions(false);
          } else {
            if (document.activeElement?.id !== 'pos-search-input' && buffer.length >= 3) {
              showToast(`Scanned item code "${buffer}" not found.`, 'error');
              setScanBuffer('');
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [scanBuffer, lastCharTime, products, cart, showCheckoutReviewModal, finalAmount, totalPaidAmount, remainingBalance, selectedCustomer, showToast, clearCart]);

  return (
    <>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-7rem)] gap-6 select-none animate-in fade-in duration-200">

        {/* LEFT HUB: Product & Search Deck (70% Screen) */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 dark:bg-gray-900/40 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 backdrop-blur-sm">

          {/* Header Action Row */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5.5 w-5.5 text-indigo-500 animate-pulse" />
                {t('common.pos')}
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-black tracking-widest uppercase">PRO</span>
              </h1>
              {searchTerm.trim() && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-bold">
                  Matches: {filteredProducts.length} items found
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Universal Search input field */}
              <div className="relative flex-1 sm:w-80" id="search-bar-container">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4.5 w-4.5" />
                <input
                  id="pos-search-input"
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search item, scan barcode (F2)..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                    setActiveIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-10 pr-24 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm h-11 focus-visible:ring-indigo-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setShowSuggestions(false);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      title="Clear Search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Scan with Camera (C)"
                    onClick={() => {
                      setShowCameraModal(true);
                      startCamera();
                    }}
                    className="p-1.5 text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 rounded-lg transition-all"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <div className="hidden sm:flex items-center text-[10px] font-black bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-md border border-gray-200/50 dark:border-gray-700 select-none">
                    F2
                  </div>
                </div>

                {/* Suggestions Overlay Dropdown */}
                {showSuggestions && searchTerm.trim() && (
                  <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-h-[300px] overflow-y-auto z-50 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    {suggestions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-gray-450 dark:text-gray-500">
                        <Package className="h-8 w-8 mb-2 stroke-[1.5] text-gray-300" />
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No products found</p>
                        <p className="text-[10px] mt-0.5 text-gray-400">Verify code details or add to database.</p>
                      </div>
                    ) : (
                      <>
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex justify-between border-b border-gray-100 dark:border-gray-800/80 mb-1 pb-1.5">
                          <span>Suggestions ({suggestions.length})</span>
                          <span>Use ↑↓ & Enter</span>
                        </div>
                        {suggestions.map((product, idx) => {
                          const isSelected = idx === activeIndex;
                          const isOut = product.stock <= 0;
                          const isLow = product.stock <= product.minStock && product.stock > 0;
                          return (
                            <button
                              key={product.id}
                              disabled={isOut}
                              onClick={() => {
                                handleAddToCartWithTelemetry(product, false);
                                setSearchTerm('');
                                setShowSuggestions(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-900 dark:text-gray-100'
                                } ${isOut ? 'opacity-50 cursor-not-allowed bg-gray-50/50' : ''}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isSelected ? 'bg-indigo-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-450'
                                  }`}>
                                  {product.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                    <HighlightText text={product.name} search={searchTerm} />
                                  </div>
                                  <div className={`text-[10px] font-medium truncate ${isSelected ? 'text-indigo-200' : 'text-gray-450'}`}>
                                    {product.barcode ? `Barcode: ${product.barcode}` : `ID: #${product.id}`}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isOut ? (
                                  <span className="bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 text-[9px] font-black px-1.5 py-0.5 rounded">Out</span>
                                ) : isLow ? (
                                  <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded">Low</span>
                                ) : null}
                                <span className="text-xs font-black">
                                  Rs {product.price.toLocaleString()}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Suspended holds panel trigger */}
              <button
                onClick={() => setShowHeldSalesPanel(true)}
                className="relative flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 hover:border-indigo-500 hover:text-indigo-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm h-11 transition-all"
              >
                <Archive className="h-4.5 w-4.5 text-indigo-500" />
                <span className="hidden md:inline">Held Tickets</span>
                {heldSales.length > 0 && (
                  <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white animate-bounce">
                    {heldSales.length}
                  </span>
                )}
              </button>

              {/* Help Keyboard Shortcuts Button */}
              <button
                onClick={() => setShowHotkeysHelp(prev => !prev)}
                className="p-2.5 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 text-gray-500 hover:text-indigo-600 hover:border-indigo-500 rounded-xl shadow-sm h-11 transition-all"
                title="Keyboard Shortcuts Legend"
              >
                <HelpCircle className="h-5.5 w-5.5" />
              </button>
            </div>
          </div>

          {/* Shortcut Legend Overlay */}
          {showHotkeysHelp && (
            <div className="mb-4 p-3.5 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs flex flex-wrap gap-4 items-center justify-between text-indigo-850 dark:text-indigo-300 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 font-bold">
                <span>⌨️ Shortcuts:</span>
                <span><kbd className="bg-white dark:bg-gray-800 border px-1 rounded shadow-sm text-[10px]">F2</kbd> Focus Search</span>
                <span><kbd className="bg-white dark:bg-gray-800 border px-1 rounded shadow-sm text-[10px]">F4</kbd> Find Client</span>
                <span><kbd className="bg-white dark:bg-gray-800 border px-1 rounded shadow-sm text-[10px]">F7</kbd> Clear Cart</span>
                <span><kbd className="bg-white dark:bg-gray-800 border px-1 rounded shadow-sm text-[10px]">F8</kbd> Hold Sale</span>
                <span><kbd className="bg-white dark:bg-gray-800 border px-1 rounded shadow-sm text-[10px]">F9</kbd> Finalize / Pay</span>
              </div>
              <button onClick={() => setShowHotkeysHelp(false)} className="text-[10px] font-black uppercase text-indigo-500 hover:underline">Dismiss</button>
            </div>
          )}

          {/* Quick Filters Stream */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 scrollbar-none shrink-0">
            <button
              onClick={() => { setActiveQuickFilter('all'); setSelectedCategoryId(null); }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${activeQuickFilter === 'all' && selectedCategoryId === null
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-250 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80'
                }`}
            >
              All Items
            </button>
            <button
              onClick={() => { setActiveQuickFilter('favorites'); setSelectedCategoryId(null); }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${activeQuickFilter === 'favorites'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-250 dark:border-gray-800 hover:bg-amber-50/10'
                }`}
            >
              <Star className={`h-4 w-4 ${activeQuickFilter === 'favorites' ? 'fill-white text-white' : 'text-amber-500 fill-amber-500'}`} />
              Favorites
            </button>
            <button
              onClick={() => { setActiveQuickFilter('recent'); setSelectedCategoryId(null); }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${activeQuickFilter === 'recent'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-250 dark:border-gray-800 hover:bg-gray-50'
                }`}
            >
              <Clock className="h-4 w-4 text-indigo-500" />
              New Products
            </button>
            <button
              onClick={() => { setActiveQuickFilter('lowStock'); setSelectedCategoryId(null); }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${activeQuickFilter === 'lowStock'
                  ? 'bg-amber-505 bg-amber-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-250 dark:border-gray-800 hover:bg-amber-50/10'
                }`}
            >
              <TrendingDown className="h-4 w-4 text-amber-500" />
              Low Stock
            </button>
          </div>

          {/* Categories Pill Stream */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none shrink-0 border-b border-gray-200/80 dark:border-gray-850">
            {isLoading ? (
              // Categories loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse shrink-0" />
              ))
            ) : (
              categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const count = categoryCounts[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(isSelected ? null : cat.id);
                      setActiveQuickFilter('all');
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-150 select-none ${isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <span>{i18n.language === 'ur' && cat.nameUrdu ? cat.nameUrdu : cat.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pr-1">

            {isLoading ? (
              // Products loading skeletons
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-4 shadow-sm animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                      <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                    <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800/60 flex justify-between items-center">
                      <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                      <div className="h-4 w-10 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              // Product empty state
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-900 border rounded-2xl p-6 shadow-sm border-dashed">
                <Package className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-3 animate-bounce" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">No matching products located</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-[280px]">Try adjusting your search criteria, clearing queries, or selecting categories.</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all"
                  >
                    Reset Query Search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {visibleProductsList.map((product) => {
                    const itemInCart = cart.find(i => i.product.id === product.id);
                    const category = categories.find(c => c.id === product.categoryId);
                    const categoryName = category ? (i18n.language === 'ur' && category.nameUrdu ? category.nameUrdu : category.name) : 'General';
                    return (
                      <ProductItem
                        key={product.id}
                        product={product}
                        categoryName={categoryName}
                        isFavorite={favoriteIds.includes(product.id)}
                        isInCart={!!itemInCart}
                        onAddToCart={handleAddToCartWithTelemetry}
                        onToggleFavorite={toggleFavorite}
                        searchTerm={searchTerm}
                      />
                    );
                  })}
                </div>

                {/* Show More Products Button for large catalog performance */}
                {filteredProducts.length > visibleProductsCount && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setVisibleProductsCount(prev => prev + 48)}
                      className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 hover:border-indigo-500 rounded-xl text-xs font-black text-indigo-600 dark:text-indigo-400 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <span>Show More Catalog Products</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-semibold">Displaying {visibleProductsCount} of {filteredProducts.length} filtered results</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT HUB: Checkout Panel (Width: 420px) */}
        <div className="w-full lg:w-[420px] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xl shrink-0 animate-in slide-in-from-right duration-250">

          {/* Active Cart Header */}
          <div className="p-4 bg-gray-50 dark:bg-gray-950/60 border-b border-gray-150 dark:border-gray-805 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-650" />
              <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Cart Invoice Registry</span>
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-full font-black">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => {
                  clearCart();
                  showToast('Cart has been reset.', 'info');
                }}
                className="text-xs font-black text-red-500 hover:text-red-700 tracking-wide uppercase transition-colors"
              >
                Reset Cart
              </button>
            )}
          </div>
          
          {/* CRM Account Linking console block */}
          <div className="p-4 border-b border-gray-150 dark:border-gray-805 bg-gray-50/50 dark:bg-gray-900 shrink-0">
            {selectedCustomer ? (
              <div className="flex flex-col bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-3.5 shadow-sm gap-3 animate-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9.5 w-9.5 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm">
                      {selectedCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h6 className="text-xs font-black text-gray-900 dark:text-white truncate">{selectedCustomer.name}</h6>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${customerAnalytics?.tier === 'Platinum' ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200' :
                            customerAnalytics?.tier === 'Gold' ? 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-400 border-yellow-200' :
                              customerAnalytics?.tier === 'Silver' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200' :
                                'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200'
                          }`}>
                          {customerAnalytics?.tier || 'Bronze'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate font-semibold mt-0.5">{selectedCustomer.phone || 'No Phone Profile'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomerXPModal(true)}
                      title="Open Experience Center Stats"
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-all active:scale-95"
                    >
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        selectCustomer(null);
                        showToast('Customer account unlinked', 'info');
                      }}
                      title="Unlink Customer (F4)"
                      className="p-2 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg text-gray-400 hover:text-red-500 shadow-sm transition-all active:scale-95"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-indigo-100/50 dark:border-indigo-900/20 font-bold text-gray-500 dark:text-gray-450">
                  <div className="flex justify-between">
                    <span>Due Balance:</span>
                    <span className="text-red-500 font-extrabold">Rs {selectedCustomer.pendingAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loyalty Points:</span>
                    <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">
                      {((selectedCustomer as any).loyaltyPoints || 0) - redeemedPoints} pts
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-450">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h6 className="text-xs font-bold text-gray-900 dark:text-white">Walk-In Customer</h6>
                    <p className="text-[9px] text-gray-450 font-semibold">No client account linked</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="py-1.5 px-3 bg-indigo-55 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 border border-indigo-200/50 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Plus className="h-3 w-3 text-indigo-500" />
                  <span>Link Client (F4)</span>
                </button>
              </div>
            )}
          </div>

          {/* Cart items scroll block */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {Object.keys(undoStack).map((productId) => (
              <div key={productId} className="flex items-center justify-between bg-amber-50/70 border border-amber-200/50 rounded-xl p-2.5 text-xs animate-pulse">
                <span className="font-semibold text-amber-900 dark:text-amber-300 truncate flex-1">
                  Removed: {undoStack[productId].item.product.name}
                </span>
                <button onClick={() => handleUndoRemove(productId)} className="flex items-center gap-1 text-amber-950 font-black hover:underline ml-2 shrink-0">
                  <Undo2 className="h-3.5 w-3.5" /> Undo
                </button>
              </div>
            ))}

            {cart.length === 0 ? (
              // Empty state illustrator inside cart
              <div className="flex flex-col items-center justify-center h-full py-16 text-center text-gray-400">
                <div className="h-16 w-16 bg-gray-50 dark:bg-gray-950 rounded-full flex items-center justify-center text-gray-300 mb-3 border border-gray-100 dark:border-gray-800">
                  <ShoppingCart className="h-8 w-8 stroke-[1.5]" />
                </div>
                <p className="text-xs font-black text-gray-700 dark:text-white uppercase tracking-wider">Cart Register Empty</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Click products in grid or scan barcodes directly to register invoice lines.</p>
              </div>
            ) : (
              cart.map((item) => {
                const calculations = calculateItemDiscount(item);
                return (
                  <div key={item.product.id} className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-850/20 border border-gray-150 dark:border-gray-800/80 rounded-xl p-3 gap-3 shadow-sm hover:border-gray-250 dark:hover:border-gray-700 transition-all animate-in fade-in slide-in-from-top-1.5 duration-100">
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleOpenItemEditDialog(item)}
                        className="w-full text-left focus:outline-none"
                        title="Customize Line Item (Notes / Line Discount)"
                      >
                        <h5 className="text-xs font-bold text-gray-950 dark:text-white truncate flex items-center gap-1.5">
                          {item.product.name}
                          {(item.notes || item.discountType) && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-ping" />
                          )}
                        </h5>
                        <div className="flex flex-wrap items-baseline gap-x-2 mt-0.5 text-xs text-gray-450 font-bold">
                          {item.discountType ? (
                            <>
                              <span className="line-through text-red-400">Rs {item.product.price.toLocaleString()}</span>
                              <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">
                                Rs {calculations.finalPrice.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span>Rs {item.product.price.toLocaleString()} each</span>
                          )}
                        </div>

                        {/* Display Line Total */}
                        <div className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 mt-1">
                          Rs {(calculations.finalPrice * item.quantity).toLocaleString()}
                        </div>

                        {item.notes && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 italic mt-1 truncate bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800 w-fit">
                            Note: {item.notes}
                          </p>
                        )}

                        {item.discountType && (
                          <p className="text-[10px] text-indigo-650 dark:text-indigo-455 font-bold mt-1 bg-indigo-55/55 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded w-fit">
                            Discount: {item.discountType === 'percentage' ? `${item.discountValue}%` : `Rs ${item.discountValue}`} off
                            {item.discountReason ? ` (${item.discountReason})` : ''}
                          </p>
                        )}
                      </button>
                    </div>

                    {/* Touch-Friendly compact quantities panel */}
                    <div className="flex flex-col items-end gap-2 shrink-0 select-none">
                      <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
                        <button
                          onClick={() => updateCartItemQuantity(item.product.id.toString(), item.quantity - 1)}
                          className="p-2 px-2.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all"
                          title="Decrease Quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black text-gray-900 dark:text-white px-1.5 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItemQuantity(item.product.id.toString(), item.quantity + 1)}
                          className="p-2 px-2.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all"
                          title="Increase Quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleSmartRemove(item)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                        title="Remove Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

            {/* Validation Notice Feedback Box */}
            {validationError && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200/50 text-red-650 dark:text-red-400 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold animate-shake">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Accounting calculations ledger list */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 space-y-3 shadow-inner">
              <div className="flex justify-between text-xs font-black text-gray-500 dark:text-gray-450 uppercase tracking-wider">
                <span>Cart Subtotal</span>
                <span className="text-gray-950 dark:text-white">Rs {subtotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-xs font-black text-gray-500 dark:text-gray-450 uppercase tracking-wider">
                <span>Promo Discount</span>
                <button
                  type="button"
                  onClick={() => {
                    setOrderValidationError(null);
                    setShowOrderDiscountModal(true);
                  }}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 border border-indigo-200/55 dark:border-indigo-900 text-indigo-750 dark:text-indigo-400 rounded-lg transition-all font-black"
                >
                  {orderDiscountType ? (
                    <span>
                      {orderDiscountType === 'percentage' ? `${orderDiscountValue}%` : `Rs ${orderDiscountValue}`} off
                    </span>
                  ) : (
                    <span>Add Discount</span>
                  )}
                </button>
              </div>

              {orderDiscountReason && (
                <div className="text-[10px] text-indigo-550 font-bold -mt-2 text-right">
                  Reason: {orderDiscountReason}
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-black text-gray-500 dark:text-gray-450 uppercase tracking-wider">
                <span>Checkout Notes</span>
                <button
                  type="button"
                  onClick={() => setShowOrderNotesModal(true)}
                  className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-250 dark:border-gray-750 text-gray-650 dark:text-gray-300 rounded-lg transition-all font-bold truncate max-w-[150px]"
                >
                  {cartNotes ? cartNotes : 'Add Note'}
                </button>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold text-gray-400">
                <div className="flex justify-between">
                  <span>Gross Invoice:</span>
                  <span className="text-gray-900 dark:text-white">Rs {finalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allocated:</span>
                  <span className="text-indigo-650 dark:text-indigo-400">Rs {totalPaidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Due Balance:</span>
                  <span className={`font-extrabold ${remainingBalance > 0 ? 'text-amber-500' : 'text-gray-500'}`}>Rs {remainingBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change Out:</span>
                  <span className={`font-extrabold ${absoluteChangeDue > 0 ? 'text-green-500' : 'text-gray-500'}`}>Rs {absoluteChangeDue.toLocaleString()}</span>
                </div>
              </div>

              {/* Status and summary banner */}
              <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-800 select-none">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ledger Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${computedPaymentStatus === 'Fully Paid' ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400' :
                    computedPaymentStatus === 'Partially Paid' ? 'bg-amber-105 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
                      'bg-red-105 text-red-700 dark:bg-red-950/60 dark:text-red-405'
                  }`}>
                  {computedPaymentStatus === 'Credit Sale' && selectedCustomer ? `On Credit: ${selectedCustomer.name}` : computedPaymentStatus}
                </span>
              </div>
            </div>

            {/* Checkout Action triggers */}
            <div className="flex gap-2 text-xs font-bold">
              <button
                disabled={cart.length === 0 || !!validationError}
                onClick={handleHoldSale}
                className="px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold uppercase tracking-wide transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] h-12"
              >
                Hold
              </button>

              <button
                disabled={cart.length === 0 || !!validationError || (remainingBalance > 0 && !selectedCustomer)}
                onClick={handleCheckoutClick}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 text-white disabled:text-gray-400 py-3 rounded-xl font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-650/15 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed h-12"
              >
                <Receipt className="h-4.5 w-4.5" />
                <span>Pay & Checkout (F9)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

      {/* CRM Account link modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                <User className="h-5 w-5 text-indigo-500" />
                Link Client Ledger Account
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-650 transition-all"><X className="h-5 w-5" /></button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-450 h-4.5 w-4.5" />
              <input
                type="text"
                placeholder="Search clients by name or phone..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-55 dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="max-h-[220px] overflow-y-auto space-y-2 mb-4 pr-1">
              {filteredCustomers.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-6 italic">No clients found matching query search condition.</p>
              ) : (
                filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      selectCustomer(c);
                      setShowCustomerModal(false);
                      showToast(`Customer linked: ${c.name}`, 'success');
                    }}
                    className="w-full text-left bg-gray-50/50 hover:bg-indigo-50/30 dark:bg-gray-800/40 dark:hover:bg-indigo-950/20 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 rounded-xl p-3 flex items-center justify-between transition-all"
                  >
                    <div>
                      <h5 className="text-xs font-black text-gray-900 dark:text-white">{c.name}</h5>
                      <p className="text-[10px] text-gray-450 font-bold mt-0.5">{c.phone || 'No phone record'}</p>
                    </div>
                    <span className="text-[10px] bg-white dark:bg-gray-900 border font-extrabold px-2.5 py-1 rounded-md text-gray-700 dark:text-gray-300">
                      Balance: Rs {c.pendingAmount.toLocaleString()}
                    </span>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setShowCustomerModal(false);
                setShowAddCustomerModal(true);
              }}
              className="w-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/80 border border-indigo-250 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all text-center block"
            >
              + Create New Client Profile
            </button>
          </div>
        </div>
      )}

      {/* CRM Create customer profile modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">Create Client Profile</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  placeholder="e.g. Ahmed Raza"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Telephone Phone Number</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  placeholder="03XXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  placeholder="name@domain.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Street Details Address</label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  placeholder="City, Street details"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Customer Classification Type</label>
                <select
                  value={newCustomer.customerType}
                  onChange={(e) => setNewCustomer({ ...newCustomer, customerType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white dark:bg-gray-900 border-gray-250 dark:border-gray-850 text-gray-800 dark:text-gray-200"
                >
                  <option value="Regular">Regular</option>
                  <option value="VIP">VIP</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleAddCustomer} 
                disabled={isAddingCustomer}
                className="flex-1 bg-indigo-600 hover:bg-indigo-755 disabled:bg-indigo-400 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                {isAddingCustomer ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddCustomerModal(false);
                  setNewCustomer({ name: '', phone: '', email: '', address: '', customerType: 'Regular' });
                }}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held tickets overlay registry dialog */}
      {showHeldSalesPanel && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl border-l border-gray-200 dark:border-gray-850 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-gray-150 dark:border-gray-805 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-indigo-650" />
                <span className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">Suspended Holds Registry</span>
              </div>
              <button onClick={() => setShowHeldSalesPanel(false)} className="p-1.5 hover:bg-gray-55 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-650 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-3 border-b bg-gray-50/50 dark:bg-gray-950/20">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search suspended holds..."
                  value={heldSearchTerm}
                  onChange={(e) => setHeldSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredHeldSales.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Archive className="h-10 w-10 mx-auto mb-2 opacity-50 text-gray-300" />
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">No active transaction holds</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Tickets put on hold will appear inside this log matrix.</p>
                </div>
              ) : (
                filteredHeldSales.map((h) => (
                  <div key={h.holdId} className="border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 bg-gray-50/50 dark:bg-gray-850/20 hover:border-gray-350 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-wider">{h.holdId}</span>
                      <span className="text-[10px] text-gray-450 dark:text-gray-505 font-bold flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getElapsedTime(h.createdAt)}
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-gray-800 dark:text-gray-200">Customer: <span className="font-medium text-gray-600 dark:text-gray-400">{h.selectedCustomer?.name || 'Walk-In Customer'}</span></p>
                      <p className="text-gray-450 font-semibold">Products: {h.cart.reduce((sum, i) => sum + i.quantity, 0)} items total</p>
                    </div>
                    <div className="pt-2 border-t border-gray-150 dark:border-gray-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedSummarySale(selectedSummarySale?.holdId === h.holdId ? null : h)}
                        className="text-[10px] font-black text-gray-500 hover:text-indigo-650 flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{selectedSummarySale?.holdId === h.holdId ? 'Hide items' : 'View lines'}</span>
                      </button>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleDeleteHeldSale(h.holdId)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-200 rounded-lg transition-colors"
                          title="Delete suspended hold"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleResumeSaleClick(h)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase rounded-lg flex items-center gap-1 shadow-sm transition-all"
                        >
                          <span>Resume</span>
                          <ChevronRight className="h-3 w-3 stroke-[3]" />
                        </button>
                      </div>
                    </div>

                    {selectedSummarySale?.holdId === h.holdId && (
                      <div className="mt-2.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg p-2.5 text-[11px] space-y-1.5 text-gray-600 dark:text-gray-450 animate-in slide-in-from-top-1.5 duration-100">
                        {h.cart.map(i => (
                          <div key={i.product.id} className="flex justify-between font-bold">
                            <span className="truncate max-w-[180px]">{i.product.name} <span className="text-gray-400 font-semibold">x{i.quantity}</span></span>
                            <span className="text-indigo-650 dark:text-indigo-400">Rs {i.subtotal.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart item customizations edit dialog */}
      {selectedCartItem && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-150 dark:border-gray-805">
              <h3 className="text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">
                Line Customization
              </h3>
              <button
                onClick={() => setSelectedCartItem(null)}
                className="p-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-650 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Product Info Card */}
              <div className="bg-gray-50/70 dark:bg-gray-850/40 border rounded-xl p-3.5 flex justify-between items-center select-none">
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">{selectedCartItem.product.name}</h4>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">Price: Rs {selectedCartItem.product.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wide">Adjusted Price</span>
                  <p className="text-sm font-black text-indigo-655 dark:text-indigo-400">
                    Rs {calculateItemDiscount(selectedCartItem).finalPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Discount Options */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-wider mb-2 select-none">Apply Item Discount</label>
                <div className="grid grid-cols-3 gap-1 bg-gray-50 dark:bg-gray-950 p-1 rounded-xl border mb-3">
                  {(['none', 'percentage', 'fixed'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setItemDiscountType(type === 'none' ? null : type);
                        if (type === 'none') setItemDiscountValue(0);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${(type === 'none' && !itemDiscountType) || (itemDiscountType === type)
                          ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/40 dark:border-gray-800'
                          : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      {type === 'none' ? 'None' : type === 'percentage' ? 'Percent %' : 'Fixed Rs'}
                    </button>
                  ))}
                </div>

                {itemDiscountType && (
                  <div className="space-y-3 p-3.5 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-xl animate-in slide-in-from-top-2 duration-150">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                          {itemDiscountType === 'percentage' ? '%' : 'Rs'}
                        </span>
                        <input
                          type="number"
                          value={itemDiscountValue === 0 ? '' : itemDiscountValue}
                          placeholder="Value"
                          onChange={(e) => setItemDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-8 pr-2 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-black text-gray-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      {/* Reason Selection */}
                      <select
                        value={itemDiscountReason}
                        onChange={(e) => setItemDiscountReason(e.target.value)}
                        className="text-xs font-black bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-gray-800 dark:text-gray-300 focus:outline-none"
                      >
                        <option value="">Select Reason...</option>
                        {PRESET_DISCOUNT_REASONS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder="Or customize reason..."
                      value={itemDiscountReason}
                      onChange={(e) => setItemDiscountReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-450 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Item note Customizations */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-wider mb-2 select-none">Line Custom Notes</label>
                <input
                  type="text"
                  placeholder="Extra items, color, special details..."
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-450 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Suggestions chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESET_ITEM_NOTES.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setItemNote(tag)}
                      className="px-2 py-1.5 bg-gray-50 hover:bg-indigo-50/50 dark:bg-gray-800/40 dark:hover:bg-indigo-950/20 text-[10px] font-bold text-gray-500 rounded-lg border border-gray-200/50 dark:border-gray-700 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Validation Feedback */}
              {itemValidationError && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200/50 text-red-650 dark:text-red-400 rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold animate-shake">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{itemValidationError}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800/60">
              <button
                onClick={() => setSelectedCartItem(null)}
                className="px-4.5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wide transition-all hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItemEdit}
                className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-650/15"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER LEVEL DISCOUNT DIALOG */}
      {showOrderDiscountModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-150 dark:border-gray-805">
              <h3 className="text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">
                Order Discount
              </h3>
              <button
                onClick={() => setShowOrderDiscountModal(false)}
                className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50/70 dark:bg-gray-850/40 border rounded-xl p-3.5 flex justify-between items-center select-none">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Subtotal</span>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">Rs {itemsFinalTotalBeforeOrderDiscount.toLocaleString()}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Gross Total</span>
                  <p className="text-sm font-black text-indigo-650 dark:text-indigo-400">
                    Rs {Math.max(0, itemsFinalTotalBeforeOrderDiscount - orderDiscountAmount).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-wider mb-2">Discount Type</label>
                <div className="grid grid-cols-3 gap-1 bg-gray-50 dark:bg-gray-950 p-1 rounded-xl border mb-3">
                  {(['none', 'percentage', 'fixed'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setOrderDiscountType(type === 'none' ? null : type);
                        if (type === 'none') {
                          setOrderDiscountValue(0);
                          setOrderDiscountReason('');
                        }
                      }}
                      className={`py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${(type === 'none' && !orderDiscountType) || (orderDiscountType === type)
                          ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-205 dark:border-gray-800'
                          : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      {type === 'none' ? 'None' : type === 'percentage' ? 'Percent %' : 'Fixed Rs'}
                    </button>
                  ))}
                </div>

                {orderDiscountType && (
                  <div className="space-y-3 p-3.5 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-xl">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                          {orderDiscountType === 'percentage' ? '%' : 'Rs'}
                        </span>
                        <input
                          type="number"
                          value={orderDiscountValue === 0 ? '' : orderDiscountValue}
                          placeholder="Value"
                          onChange={(e) => setOrderDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-8 pr-2 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-black text-gray-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <select
                        value={orderDiscountReason}
                        onChange={(e) => setOrderDiscountReason(e.target.value)}
                        className="text-xs font-black bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-gray-800 dark:text-gray-300 focus:outline-none"
                      >
                        <option value="">Select Reason...</option>
                        {PRESET_DISCOUNT_REASONS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder="Or customize reason..."
                      value={orderDiscountReason}
                      onChange={(e) => setOrderDiscountReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-450 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Order discount validation feedback */}
              {orderValidationError && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200/50 text-red-650 dark:text-red-400 rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold animate-shake">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{orderValidationError}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800/60">
              <button
                onClick={() => setShowOrderDiscountModal(false)}
                className="px-4.5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-705 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wide transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (orderDiscountType) {
                    if (orderDiscountValue < 0) {
                      setOrderValidationError('Discount value cannot be negative');
                      return;
                    }
                    if (orderDiscountType === 'percentage' && orderDiscountValue > 100) {
                      setOrderValidationError('Percentage discount cannot exceed 100%');
                      return;
                    }
                    if (orderDiscountType === 'fixed' && orderDiscountValue > itemsFinalTotalBeforeOrderDiscount) {
                      setOrderValidationError('Discount amount cannot exceed order subtotal');
                      return;
                    }
                  }
                  setShowOrderDiscountModal(false);
                  showToast('Order discount updated', 'success');
                }}
                className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order notes modal dialog */}
      {showOrderNotesModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-150 dark:border-gray-805">
              <h3 className="text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">
                Add Order Instructions
              </h3>
              <button
                onClick={() => setShowOrderNotesModal(false)}
                className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-405 hover:text-gray-650"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-wider mb-1.5">Instructions Notes</label>
                <textarea
                  rows={3}
                  placeholder="Enter invoice delivery notes / assembly notes..."
                  value={cartNotes}
                  onChange={(e) => setCartNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-450 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Preset tag selectors */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {PRESET_ORDER_NOTES.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setCartNotes(tag);
                        showToast('Order note selected', 'info');
                      }}
                      className="px-2 py-1.5 bg-gray-50 hover:bg-indigo-50/50 dark:bg-gray-800/40 dark:hover:bg-indigo-950/20 text-[10px] font-bold text-gray-500 rounded-lg border border-gray-200/50 dark:border-gray-700 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-805">
              <button
                onClick={() => {
                  setShowOrderNotesModal(false);
                  showToast('Checkout notes saved', 'success');
                }}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-755 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-sm"
              >
                Close & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT REVIEW & CONFIRMATION MODAL */}
      {showCheckoutReviewModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-150 dark:border-gray-805 bg-gray-50/60 dark:bg-gray-905 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="h-5.5 w-5.5 text-indigo-500 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">
                  Checkout Review & final confirmation
                </h3>
              </div>
              <button
                onClick={() => setShowCheckoutReviewModal(false)}
                className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 rounded-xl transition-all"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable grid content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 select-none">

              {/* Left Side: Customer & Items */}
              <div className="space-y-4">

                {/* Linked client info card */}
                <div className="bg-gray-50/50 dark:bg-gray-850/45 border border-gray-150 dark:border-gray-800 rounded-2xl p-4">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-2">Linked Customer</span>
                  {selectedCustomer ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-650 text-white flex items-center justify-center font-black text-sm">
                        {selectedCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900 dark:text-white">{selectedCustomer.name}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold">{selectedCustomer.phone || 'No phone record'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-gray-455 italic">Walk-In Checkout (No linked client ledger)</div>
                  )}
                </div>

                {/* Items Summary Feed */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-3">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Items Summary List ({cart.length} lines)</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex justify-between items-center text-xs pb-2 border-b border-gray-50 dark:border-gray-850 last:border-b-0 last:pb-0 last:border-transparent">
                        <div className="min-w-0 flex-1 pr-3">
                          <h5 className="font-bold text-gray-905 dark:text-white truncate">{item.product.name}</h5>
                          <p className="text-[10px] text-gray-400 mt-0.5">Qty: {item.quantity} x Rs {item.product.price.toLocaleString()}</p>
                        </div>
                        <div className="text-right shrink-0 font-extrabold text-gray-900 dark:text-white">
                          Rs {calculateItemDiscount(item).finalSubtotal.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                </div>

              {/* Right Side: Accounting details */}
              <div className="space-y-4 bg-gray-50/70 dark:bg-gray-855 border rounded-2xl p-4">
                <span className="text-[9px] font-black text-gray-405 dark:text-gray-450 uppercase tracking-wider block">Ledger Accounts Preview</span>

                <div className="space-y-2 text-xs border-b pb-3 border-gray-200/60 dark:border-gray-800">
                  <div className="flex justify-between font-bold text-gray-400">
                    <span>Gross subtotal</span>
                    <span className="text-gray-900 dark:text-white font-extrabold">Rs {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-400">
                    <span>Redeemed markdowns</span>
                    <span className="text-red-500 font-extrabold">-Rs {discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-400">
                    <span>Tax rates</span>
                    <span className="text-gray-900 dark:text-white font-extrabold">Rs {tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-gray-905 dark:text-white pt-1">
                    <span>Invoice Net Payable</span>
                    <span className="text-indigo-600 dark:text-indigo-400">Rs {finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Allocation Matrix in Checkout */}
                <div className="space-y-3 border-b pb-4 border-gray-200/60 dark:border-gray-805">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-450 uppercase tracking-wider">Payment Allocation Matrix</span>
                    <button
                      onClick={handleAddPaymentRow}
                      className="text-[10px] font-black text-indigo-650 hover:text-indigo-805 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3 stroke-[3]" /> Add Split
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {payments.map((p, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm">
                        <select
                          value={p.method}
                          onChange={(e) => handleUpdatePaymentValue(index, 'method', e.target.value as PaymentMethod)}
                          className="w-1/3 text-sm font-black bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {AVAILABLE_PAYMENT_METHODS.map(m => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                          ))}
                        </select>

                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rs</span>
                          <input
                            type="number"
                            placeholder="Amount"
                            value={p.amount === 0 ? '' : p.amount}
                            onChange={(e) => handleUpdatePaymentValue(index, 'amount', e.target.value)}
                            className="w-full text-right pl-8 pr-3 py-2 text-base font-black bg-transparent border-b-2 border-gray-250 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>

                        {payments.length > 1 && (
                          <button
                            onClick={() => handleRemovePaymentRow(index)}
                            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg shrink-0 transition-colors"
                            title="Remove row"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {payments.length === 1 && (
                    <div className="grid grid-cols-3 gap-2 mt-2 select-none">
                      <button onClick={() => handleQuickPayFull('cash')} className={`p-2 text-xs font-bold rounded-xl border text-center transition-all ${payments[0].method === 'cash' ? 'bg-indigo-650 text-white border-transparent shadow-md' : 'bg-white dark:bg-gray-900 border-gray-250 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}>Full Cash</button>
                      <button onClick={() => handleQuickPayFull('card')} className={`p-2 text-xs font-bold rounded-xl border text-center transition-all ${payments[0].method === 'card' ? 'bg-indigo-650 text-white border-transparent shadow-md' : 'bg-white dark:bg-gray-900 border-gray-250 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}>Full Card</button>
                      <button onClick={() => handleQuickPayFull('bank_transfer')} className={`p-2 text-xs font-bold rounded-xl border text-center transition-all ${payments[0].method === 'bank_transfer' ? 'bg-indigo-650 text-white border-transparent shadow-md' : 'bg-white dark:bg-gray-900 border-gray-250 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}>Full Bank</button>
                    </div>
                  )}
                </div>

                {/* Outstanding accounts balance ledger */}
                <div className="space-y-2 text-xs font-bold text-gray-400">
                  <div className="flex justify-between">
                    <span>Allocated Paid:</span>
                    <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">Rs {totalPaidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Balance:</span>
                    <span className={`font-extrabold ${remainingBalance > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                      Rs {remainingBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change Due:</span>
                    <span className={`font-extrabold ${absoluteChangeDue > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                      Rs {absoluteChangeDue.toLocaleString()}
                    </span>
                  </div>
                  {selectedCustomer && (
                    <div className="flex justify-between pt-1 border-t border-gray-150 dark:border-gray-800">
                      <span>Loyalty Points earned:</span>
                      <span className="text-green-600 dark:text-green-400 font-extrabold">+{pointsEarned} pts</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-gray-150 dark:border-gray-805 bg-gray-50/50 dark:bg-gray-905 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowCheckoutReviewModal(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wide transition-all"
              >
                Back to Cart
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={isCheckoutLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-400 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-650/10 transition-all flex items-center gap-1.5 hover:scale-[1.01]"
              >
                {isCheckoutLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4.5 w-4.5 stroke-[3]" />
                    <span>Confirm & Complete Sale (F9)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS SALE EXPERIENCE MODAL */}
      {showSuccessModal && completedSaleData && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">

            {/* Animated Tick container */}
            <div className="mx-auto h-16 w-16 bg-green-50 dark:bg-green-950/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-4 border border-green-200/50 shadow-sm relative animate-bounce">
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-25" />
              <Check className="h-9 w-9 stroke-[3]" />
            </div>

            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider mb-1">
              Sale Transaction Finalized!
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold mb-5">Invoice Number: #{completedSaleData.invoiceNumber}</p>

            {/* Receipt Parameters display */}
            <div className="bg-gray-50 dark:bg-gray-950/40 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 space-y-2 text-xs font-bold text-gray-450 mb-6 text-left">
              <div className="flex justify-between">
                <span>Customer Ledger:</span>
                <span className="text-gray-900 dark:text-white font-extrabold">{completedSaleData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Receipt Paid Amount:</span>
                <span className="text-indigo-650 dark:text-indigo-400 font-black">Rs {completedSaleData.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoice Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${completedSaleData.paymentStatus === 'Fully Paid' ? 'bg-green-105 text-green-700 dark:bg-green-950/50' :
                    completedSaleData.paymentStatus === 'Partially Paid' ? 'bg-amber-105 text-amber-700 dark:bg-amber-950/50' :
                      'bg-red-105 text-red-700 dark:bg-red-950/50'
                  }`}>
                  {completedSaleData.paymentStatus}
                </span>
              </div>
            </div>

            {/* Quick receipts print block */}
            <div className={`grid mb-6 ${selectedCustomer ? 'grid-cols-3 gap-2' : 'grid-cols-2 gap-2'}`}>
              <button
                onClick={() => printPDFReceipt(completedSaleData.receiptData)}
                className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-xl font-black text-xs uppercase tracking-wide transition-all hover:scale-[1.01] flex items-center justify-center gap-1"
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={() => downloadPDFReceipt(completedSaleData.receiptData)}
                className="py-2.5 px-3 bg-gray-150 hover:bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl font-black text-xs uppercase tracking-wide transition-all hover:scale-[1.01] flex items-center justify-center gap-1"
              >
                ⬇️ Download Receipt
              </button>
              {selectedCustomer && (
                <button
                  onClick={() => {
                    const num = selectedCustomer?.phone || '';
                    const text = encodeURIComponent(`Thank you for shopping! Your Invoice #${completedSaleData.invoiceNumber} amount is Rs ${completedSaleData.totalAmount.toLocaleString()}.`);
                    window.open(`https://wa.me/${num}?text=${text}`, '_blank');
                  }}
                  className="py-2.5 px-3 bg-green-50 hover:bg-green-100 dark:bg-green-950/40 text-green-755 dark:text-green-400 rounded-xl font-black text-xs uppercase tracking-wide transition-all hover:scale-[1.01] flex items-center justify-center gap-1"
                >
                  <span>WhatsApp Share</span>
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setCompletedSaleData(null);
              }}
              className="w-full py-3 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-99 hover:scale-[1.01]"
            >
              Start New Sale Ticket
            </button>
          </div>
        </div>
      )}

      {/* CUSTOMER EXPERIENCE CENTER MODAL */}
      {showCustomerXPModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-805 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-150 dark:border-gray-805 bg-gray-50/60 dark:bg-gray-905 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5.5 w-5.5 text-indigo-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">
                  Customer Experience Ledger
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCustomerXPModal(false);
                  setPointsToRedeemInput('');
                  setLoyaltyError(null);
                }}
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 transition-all"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden p-6 gap-6">

              {/* Left Column: Stats */}
              <div className="w-full md:w-80 shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">

                {/* Profile badge Card */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50/50 dark:from-indigo-950/20 dark:to-slate-900/20 border border-indigo-100/50 dark:border-indigo-900/40 rounded-2xl p-4 flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-650 text-white flex items-center justify-center font-black text-2xl shadow-md mb-3">
                    {selectedCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white mb-0.5">{selectedCustomer.name}</h4>
                  <p className="text-xs text-gray-450 font-semibold mb-3">{selectedCustomer.phone || 'No Phone profile'}</p>

                  {/* Loyalty tier badge tag */}
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border ${customerAnalytics?.tier === 'Platinum' ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200' :
                      customerAnalytics?.tier === 'Gold' ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 border-yellow-200' :
                        customerAnalytics?.tier === 'Silver' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-350 border-slate-205' :
                          'bg-amber-100 dark:bg-amber-950/40 text-amber-705 dark:text-amber-400 border-amber-200'
                    }`}>
                    {customerAnalytics?.tier || 'Bronze'} Club Member
                  </span>
                </div>

                {/* Analytical details card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3.5 select-none">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Ledger Analytics</span>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 font-semibold">Total Spent</span>
                      <p className="text-xs font-black text-gray-900 dark:text-white">Rs {customerAnalytics?.lifetimeSpending.toLocaleString() || '0'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 font-semibold">Invoices final</span>
                      <p className="text-xs font-black text-gray-900 dark:text-white">{customerAnalytics?.totalOrders || '0'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 font-semibold">Avg Spend</span>
                      <p className="text-xs font-black text-gray-900 dark:text-white">Rs {customerAnalytics?.averageOrderValue.toLocaleString() || '0'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 font-semibold">Classification</span>
                      <p className="text-xs font-black text-gray-900 dark:text-white">{(selectedCustomer as any).customerType || 'Regular'}</p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-gray-150 dark:border-gray-800 flex justify-between text-[10px] font-bold text-gray-400">
                    <span>Last Purchase:</span>
                    <span className="text-gray-905 dark:text-white">
                      {customerAnalytics?.lastPurchaseDate ? new Date(customerAnalytics.lastPurchaseDate).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>Due Balance:</span>
                    <span className="text-red-500 font-extrabold">Rs {selectedCustomer.pendingAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Profile actions block */}
                <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-2">
                  <span className="text-[10px] font-black text-gray-450 uppercase tracking-wider block mb-1">CRM quick actions</span>
                  <button
                    onClick={() => {
                      setShowCustomerXPModal(false);
                      setShowCustomerModal(true);
                    }}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 text-xs font-bold rounded-xl transition-all"
                  >
                    Change linked Customer
                  </button>
                  <button
                    onClick={() => {
                      selectCustomer(null);
                      setShowCustomerXPModal(false);
                      showToast('Linked customer removed', 'info');
                    }}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-550 text-xs font-bold rounded-xl transition-all"
                  >
                    Remove Client account
                  </button>
                </div>
              </div>

              {/* Right Column: Loyalty Program, Purchase History & Recommendations */}
              <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">

                {/* 1. Loyalty System */}
                <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4 select-none">
                  <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3">
                    <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-indigo-500" /> Customer Loyalty Ledger
                    </span>
                    <span className="text-[10px] text-gray-450 font-bold">Rule: 1 pt per Rs 100 spent / 1 pt = Rs 1 discount</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl flex flex-col justify-center">
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Accumulated Balance</span>
                      <p className="text-lg font-black text-indigo-655 dark:text-indigo-400 mt-0.5">
                        {((selectedCustomer as any).loyaltyPoints || 0).toLocaleString()} points
                      </p>
                    </div>

                    <div className="p-3.5 bg-green-50/50 dark:bg-green-950/10 rounded-2xl flex flex-col justify-center">
                      <span className="text-[9px] text-green-600 uppercase tracking-wider font-bold">Earned this Cart</span>
                      <p className="text-lg font-black text-green-600 dark:text-green-400 mt-0.5">
                        +{pointsEarned} points
                      </p>
                    </div>

                    <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl flex flex-col justify-center">
                      <span className="text-[9px] text-amber-600/80 uppercase tracking-wider font-bold">Points Redemption</span>
                      <p className="text-lg font-black text-amber-655 dark:text-amber-400 mt-0.5">
                        -{redeemedPoints} pts (Rs {redeemedPoints * LOYALTY_RULES.pointsRedemptionValue})
                      </p>
                    </div>
                  </div>

                  {/* Loyalty Point Redemption Form */}
                  <div className="flex flex-col sm:flex-row gap-3 items-end bg-indigo-50/30 dark:bg-indigo-950/10 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-450 uppercase tracking-wider mb-1.5">Redeem Loyalty Points Discount</label>
                      <div className="relative">
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-405">Available: {((selectedCustomer as any).loyaltyPoints || 0)} pts</span>
                        <input
                          type="number"
                          placeholder="Points amount..."
                          value={pointsToRedeemInput}
                          onChange={(e) => {
                            setLoyaltyError(null);
                            setPointsToRedeemInput(e.target.value);
                          }}
                          className="w-full px-3 py-2.5 text-xs bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0 select-none">
                      <button
                        onClick={() => {
                          const val = parseInt(pointsToRedeemInput, 10) || 0;
                          if (val < 0) {
                            setLoyaltyError('Redeemed points value cannot be negative');
                            return;
                          }
                          const maxPts = (selectedCustomer as any).loyaltyPoints || 0;
                          if (val > maxPts) {
                            setLoyaltyError(`Insufficient points. Maximum is ${maxPts} points`);
                            return;
                          }
                          const neededToCover = Math.ceil(itemsFinalTotalBeforeOrderDiscount - orderDiscountAmount);
                          if (val > neededToCover) {
                            setLoyaltyError(`Maximum points needed to cover is ${neededToCover} points`);
                            return;
                          }
                          setRedeemedPoints(val);
                          showToast(`Redeemed Rs ${val} discount!`, 'success');
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wide rounded-xl transition-all"
                      >
                        Redeem
                      </button>
                      <button
                        onClick={() => {
                          setPointsToRedeemInput('');
                          setRedeemedPoints(0);
                          setLoyaltyError(null);
                          showToast('Loyalty redemption reset', 'info');
                        }}
                        className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 text-gray-500 rounded-xl text-xs font-bold"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {loyaltyError && (
                    <div className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-shake">
                      <AlertCircle className="h-3.5 w-3.5" /> <span>{loyaltyError}</span>
                    </div>
                  )}
                </div>

                {/* 2. Purchase Summary (Last 5 Purchases) */}
                <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-3">
                  <span className="text-xs font-black text-gray-950 dark:text-white uppercase tracking-wider block">Customer Purchase History</span>

                  {(!customerAnalytics || customerAnalytics.last5Purchases.length === 0) ? (
                    <div className="text-center py-8 text-gray-400 border border-dashed rounded-2xl">
                      <p className="text-xs font-bold text-gray-500">No invoice history found</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {customerAnalytics.last5Purchases.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-3.5 hover:bg-gray-50 dark:hover:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl text-xs transition-all">
                          <div>
                            <p className="font-black text-gray-900 dark:text-white">Invoice ID: #{sale.id}</p>
                            <p className="text-[10px] text-gray-450 font-bold mt-0.5">{new Date(sale.createdAt).toLocaleDateString()} • {sale.paymentMethod}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-gray-950 dark:text-white">Rs {sale.finalAmount.toLocaleString()}</span>
                            <button
                              onClick={() => handlePrintPastReceipt(sale)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-lg font-black text-[10px] uppercase transition-all"
                            >
                              Print
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Recommendations Deck */}
                <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                    <span className="text-xs font-black text-gray-955 dark:text-white uppercase tracking-wider block">Smart Product Recommendations</span>
                    <span className="text-[10px] text-indigo-500 font-bold">Customer preferences</span>
                  </div>

                  {(!customerAnalytics || customerAnalytics.frequentlyPurchased.length === 0) ? (
                    <div className="text-center py-8 text-gray-400 border border-dashed rounded-2xl border-gray-200 dark:border-gray-800">
                      <Sparkles className="h-6 w-6 mx-auto mb-2 text-gray-300 stroke-[1.5]" />
                      <p className="text-xs font-bold text-gray-500">First time serving profile</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 max-w-[240px] mx-auto text-center">Smart analytics compile customer favorite recommendations after their first purchase.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
                        {customerAnalytics.frequentlyPurchased.map(({ product, count }) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              addToCart(product);
                              playBeep();
                              showToast(`Added: ${product.name}`, 'success');
                            }}
                            className="flex-1 min-w-[140px] text-left p-3.5 bg-gray-50/70 hover:bg-indigo-50/40 dark:bg-gray-850/40 dark:hover:bg-indigo-950/20 border border-gray-150 dark:border-gray-800 rounded-2xl transition-all"
                          >
                            <span className="text-[8px] bg-indigo-55 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-350 font-black px-2 py-0.5 rounded">
                              Bought {count}x
                            </span>
                            <h5 className="text-[11px] font-black text-gray-900 dark:text-white truncate mt-2">{product.name}</h5>
                            <p className="text-[10px] text-gray-450 mt-0.5">Rs {product.price.toLocaleString()}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-150 dark:border-gray-805 bg-gray-50/50 dark:bg-gray-905 flex justify-end shrink-0">
              <button
                onClick={() => {
                  setShowCustomerXPModal(false);
                  setPointsToRedeemInput('');
                  setLoyaltyError(null);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WARNING OVERWRITE CONFIRMATION */}
      {showOverwriteConfirmation && (
        <div className="fixed inset-0 z-[60] bg-gray-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto animate-bounce" />
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">Warning: Cart Overwrite</h4>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">Resuming this held ticket will replace the products inside your current cart. Do you want to overwrite?</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => executeResumeSale(pendingResumeSale!)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all">Overwrite</button>
              <button
                onClick={() => {
                  setShowOverwriteConfirmation(false);
                  setPendingResumeSale(null);
                }}
                className="flex-1 bg-gray-150 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA SCANNER HARDWARE SIMULATOR MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="h-5.5 w-5.5 text-indigo-500 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-wide text-gray-905 dark:text-white">Camera Barcode Scanner</h3>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setShowCameraModal(false);
                }}
                className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Video preview canvas block */}
            <div className="relative aspect-video rounded-xl bg-gray-950 overflow-hidden border border-gray-850 flex flex-col items-center justify-center">
              <video
                id="scanner-video"
                className="absolute inset-0 w-full h-full object-cover opacity-70"
                playsInline
                muted
              />

              <div className="absolute inset-0 border-[20px] border-black/45 pointer-events-none" />

              <div className="absolute h-28 w-52 border-2 border-indigo-500 rounded-lg flex flex-col items-center justify-center pointer-events-none">
                <div className="absolute left-0 right-0 h-0.5 bg-red-500 animate-bounce shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              </div>

              {!cameraStream && (
                <div className="z-10 text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-2.5">
                    <QrCode className="h-6 w-6 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-gray-200">Connecting Camera Video stream...</p>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] mx-auto">Hardware scanning activated. Ensure camera hardware permission is active.</p>
                </div>
              )}
            </div>

            {/* Demo Barcodes triggers */}
            <div className="mt-5 space-y-3">
              <label className="block text-[10px] font-black text-gray-405 dark:text-gray-450 uppercase tracking-wider">Simulate Hardware Barcode Scans</label>
              <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                {products
                  .filter(p => p.barcode)
                  .slice(0, 8)
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        handleAddToCartWithTelemetry(p, true);
                        stopCamera();
                        setShowCameraModal(false);
                      }}
                      className="p-2.5 bg-gray-50 hover:bg-indigo-50 dark:bg-gray-800/40 dark:hover:bg-indigo-950/20 border border-gray-200/50 dark:border-gray-800 text-left rounded-xl transition-all group flex flex-col justify-between hover:border-indigo-455 active:scale-95 duration-100"
                    >
                      <span className="block text-[10px] font-black text-gray-800 dark:text-gray-250 truncate group-hover:text-indigo-600">{p.name}</span>
                      <span className="block text-[9px] font-bold text-gray-400 mt-1">Barcode: {p.barcode}</span>
                    </button>
                  ))}
                {products.filter(p => p.barcode).length === 0 && (
                  <div className="col-span-full text-center py-4 text-xs text-gray-450">
                    No items with active barcodes found in data catalogs.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800/60">
              <button
                onClick={() => {
                  stopCamera();
                  setShowCameraModal(false);
                }}
                className="px-4.5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wide transition-all"
              >
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom absolute Toast Notification stack */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm pointer-events-none select-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4.5 py-3.5 rounded-xl shadow-xl font-black text-xs pointer-events-auto flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 text-white select-none ${t.type === 'success' ? 'bg-emerald-600 shadow-emerald-700/10' :
                t.type === 'error' ? 'bg-red-600 shadow-red-700/10' :
                  'bg-indigo-600 shadow-indigo-700/10'
              }`}
          >
            {t.type === 'success' && <Check className="h-4.5 w-4.5 shrink-0 stroke-[3]" />}
            {t.type === 'error' && <AlertCircle className="h-4.5 w-4.5 shrink-0" />}
            {t.type === 'info' && <Info className="h-4.5 w-4.5 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
};

export default POS;