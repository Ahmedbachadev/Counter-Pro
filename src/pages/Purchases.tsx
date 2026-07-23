import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Eye,
  CreditCard as Edit,
  Trash2,
  Copy,
  Printer,
  Download,
  Truck,
  FileText,
  Calendar,
  Layers,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowLeft,
  Package,
  DollarSign,
  Undo2,
  BarChart3,
  TrendingDown,
  Percent,
  CalendarDays,
  Settings,
  HelpCircle,
  Award,
  History
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';
import EmptyState from '../components/EmptyState';
import DetailPageLayout from '../components/DetailPageLayout';
import LoadingButton from '../components/LoadingButton';

import {
  usePurchaseStore,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchasePayment,
  PurchaseReturn,
  OverduePayment
} from '../stores/purchaseStore';
import { useSupplierStore } from '../stores/supplierStore';
import { useInventoryStore, Product } from '../stores/inventoryStore';
import { useSettingsStore } from '../stores/settingsStore';
import { generatePurchaseOrderPDF } from '../utils/pdfPurchaseOrderGenerator';

const ITEMS_PER_PAGE = 10;

const Purchases: React.FC = () => {
  const { t } = useTranslation();
  const {
    purchaseOrders,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    duplicatePurchaseOrder,
    receiveInventory,
    recordPayment,
    returnItems,
    getSupplierFinancialDashboard,
    getOverduePayments,
    initializeFromDatabase: initPurchases
  } = usePurchaseStore();

  const { suppliers } = useSupplierStore();
  const { products, categories } = useInventoryStore();
  const { shopSettings } = useSettingsStore();

  // Navigation tab: 'dashboard' | 'orders' | 'supplier_performance' | 'cost_history' | 'insights' | 'reports' | 'overdue'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'supplier_performance' | 'cost_history' | 'insights' | 'reports' | 'overdue'>('dashboard');

  // Navigation states: 'list' | 'create' | 'edit' | 'details'
  const [viewState, setViewState] = useState<'list' | 'create' | 'edit' | 'details'>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Search, Filter, Pagination, Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'number' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [supplierId, setSupplierId] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [orderNotes, setOrderNotes] = useState('');
  const [orderItems, setOrderItems] = useState<Omit<PurchaseOrderItem, 'receivedQty' | 'returnedQty'>[]>([]);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [overallTax, setOverallTax] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Product Selection Search
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProductListOpen, setIsProductListOpen] = useState(false);

  // Cost History search product selection
  const [costHistoryProductId, setCostHistoryProductId] = useState<number>(products[0]?.id || 0);

  // Receive Stock Modal State
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveQtys, setReceiveQtys] = useState<Record<number, number>>({});
  const [receiveNotes, setReceiveNotes] = useState('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Mobile Wallet' | 'Other'>('Cash');
  const [payReference, setPayReference] = useState('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnQtys, setReturnQtys] = useState<Record<number, number>>({});
  const [returnReason, setReturnReason] = useState('');

  // Future-ready mock document uploads
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    initPurchases();
  }, [initPurchases]);

  // Set default product for cost history on load
  useEffect(() => {
    if (products.length > 0 && !costHistoryProductId) {
      setCostHistoryProductId(products[0].id);
    }
  }, [products, costHistoryProductId]);

  // Selected Purchase Order object
  const selectedOrder = purchaseOrders.find(o => o.id === selectedOrderId);

  // Calculations for Form
  const formItemsSubtotal = orderItems.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  const formGrandTotal = Math.max(
    0,
    formItemsSubtotal - overallDiscount + overallTax + shippingCost + additionalCharges
  );
  const formRemainingBalance = Math.max(0, formGrandTotal - amountPaid);

  // Filter orders
  const processedOrders = purchaseOrders
    .filter(order => {
      const matchSearch =
        order.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.notes && order.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchSupplier = supplierFilter ? order.supplierId === parseInt(supplierFilter) : true;
      const matchStatus = statusFilter ? order.status === statusFilter : true;
      const matchPaymentStatus = paymentStatusFilter ? order.paymentStatus === paymentStatusFilter : true;
      return matchSearch && matchSupplier && matchStatus && matchPaymentStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.purchaseDate).getTime();
        const dateB = new Date(b.purchaseDate).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }
      if (sortBy === 'number') {
        return sortOrder === 'desc'
          ? b.purchaseNumber.localeCompare(a.purchaseNumber)
          : a.purchaseNumber.localeCompare(b.purchaseNumber);
      }
      if (sortBy === 'total') {
        return sortOrder === 'desc' ? b.totalAmount - a.totalAmount : a.totalAmount - b.totalAmount;
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(processedOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = processedOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Overall Financial Calculations
  const activeOrders = purchaseOrders.filter(o => o.status !== 'Cancelled');
  const totalPurchaseValue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOutstanding = activeOrders.reduce((sum, o) => sum + o.remainingBalance, 0);
  const averagePurchaseValue = activeOrders.length > 0 ? totalPurchaseValue / activeOrders.length : 0;

  // Monthly breakdown for trend
  const currentYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth(); // 0-indexed

  const purchasesThisYear = activeOrders
    .filter(o => new Date(o.purchaseDate).getFullYear() === currentYear)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const purchasesThisMonth = activeOrders
    .filter(o => {
      const d = new Date(o.purchaseDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonthNum;
    })
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Compute Last 6 Months totals for trends
  const getTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trend: { name: string; value: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = `${months[d.getMonth()]} ${d.getFullYear() % 100}`;
      
      const mTotal = activeOrders
        .filter(o => {
          const od = new Date(o.purchaseDate);
          return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);

      trend.push({ name: mLabel, value: mTotal });
    }
    return trend;
  };
  const trendData = getTrendData();

  // Growth calculation (this month vs last month)
  const getLastMonthValue = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return activeOrders
      .filter(o => {
        const od = new Date(o.purchaseDate);
        return od.getFullYear() === lastMonth.getFullYear() && od.getMonth() === lastMonth.getMonth();
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);
  };
  const lastMonthValue = getLastMonthValue();
  const purchaseGrowth = lastMonthValue > 0 ? ((purchasesThisMonth - lastMonthValue) / lastMonthValue) * 100 : 0;

  // Supplier-wise spend data
  const getSupplierSpendData = () => {
    const spend: Record<string, number> = {};
    activeOrders.forEach(o => {
      spend[o.supplierName] = (spend[o.supplierName] || 0) + o.totalAmount;
    });
    return Object.entries(spend)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };
  const supplierSpendData = getSupplierSpendData();

  // Category-wise spend
  const getCategorySpendData = () => {
    const spend: Record<string, number> = {};
    activeOrders.forEach(o => {
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = categories.find(c => c.id === prod?.categoryId);
        const catName = cat ? cat.name : 'Uncategorized';
        spend[catName] = (spend[catName] || 0) + (item.quantity * item.costPrice);
      });
    });
    return Object.entries(spend)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };
  const categorySpendData = getCategorySpendData();

  // Most Purchased Products (by quantity)
  const getMostPurchasedProducts = () => {
    const q: Record<string, { qty: number; value: number }> = {};
    activeOrders.forEach(o => {
      o.items.forEach(item => {
        const entry = q[item.productName] || { qty: 0, value: 0 };
        q[item.productName] = {
          qty: entry.qty + item.quantity,
          value: entry.value + (item.quantity * item.costPrice)
        };
      });
    });
    return Object.entries(q)
      .map(([name, data]) => ({ name, quantity: data.qty, value: data.value }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };
  const mostPurchasedProducts = getMostPurchasedProducts();

  // Highest Purchase Cost Products (by item cost price)
  const getHighestCostProducts = () => {
    const c: Record<string, number> = {};
    activeOrders.forEach(o => {
      o.items.forEach(item => {
        c[item.productName] = Math.max(c[item.productName] || 0, item.costPrice);
      });
    });
    return Object.entries(c)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
  };
  const highestCostProducts = getHighestCostProducts();

  // Frequently & Rarely purchased insights
  const getFrequentlyPurchased = () => {
    return [...mostPurchasedProducts]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3)
      .map(p => p.name);
  };
  const getRarelyPurchased = () => {
    // Find products in inventory with low or zero purchase order quantities
    const orderQtys: Record<number, number> = {};
    activeOrders.forEach(o => {
      o.items.forEach(i => {
        orderQtys[i.productId] = (orderQtys[i.productId] || 0) + i.quantity;
      });
    });
    return products
      .map(p => ({ name: p.name, qty: orderQtys[p.id] || 0 }))
      .sort((a, b) => a.qty - b.qty)
      .slice(0, 3)
      .map(p => p.name);
  };

  // Pricing trends: items with increasing cost
  const getIncreasingCostProducts = () => {
    // Look for items with multiple purchase costs, and checking if last cost > first cost
    const costHistory: Record<number, number[]> = {};
    activeOrders
      .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime())
      .forEach(o => {
        o.items.forEach(item => {
          costHistory[item.productId] = costHistory[item.productId] || [];
          costHistory[item.productId].push(item.costPrice);
        });
      });

    const rising: string[] = [];
    const stable: string[] = [];

    Object.entries(costHistory).forEach(([prodIdStr, prices]) => {
      const prodId = Number(prodIdStr);
      const prodName = products.find(p => p.id === prodId)?.name || 'Unknown Product';
      if (prices.length >= 2) {
        const last = prices[prices.length - 1];
        const prev = prices[prices.length - 2];
        if (last > prev) {
          rising.push(prodName);
        } else {
          stable.push(prodName);
        }
      } else {
        stable.push(prodName);
      }
    });

    return { rising: rising.slice(0, 3), stable: stable.slice(0, 3) };
  };
  const { rising: risingCostProducts, stable: stableCostProducts } = getIncreasingCostProducts();

  // Supplier metrics calculation
  const getSupplierPerformanceList = () => {
    return suppliers.map(s => {
      const sOrders = purchaseOrders.filter(o => o.supplierId === s.id && o.status !== 'Cancelled');
      const totalOrdersCount = sOrders.length;
      const totalPurchasesVal = sOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      // Delayed deliveries count
      let delayedCount = 0;
      let totalDeliveries = 0;
      let totalDeliveryDays = 0;

      sOrders.forEach(o => {
        if (o.receivingHistory.length > 0) {
          o.receivingHistory.forEach(recv => {
            totalDeliveries++;
            const orderDate = new Date(o.purchaseDate);
            const recvDate = new Date(recv.receivedAt);
            const diffDays = Math.ceil((recvDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
            totalDeliveryDays += Math.max(0, diffDays);

            const expDate = new Date(o.expectedDeliveryDate);
            if (recvDate.getTime() > expDate.getTime()) {
              delayedCount++;
            }
          });
        }
      });

      const avgDeliveryTime = totalDeliveries > 0 ? Math.round(totalDeliveryDays / totalDeliveries) : null;
      const onTimeRate = totalDeliveries > 0 ? Math.round(((totalDeliveries - delayedCount) / totalDeliveries) * 100) : 100;

      // Returns details
      let totalOrderedQty = 0;
      let totalReturnedQty = 0;
      sOrders.forEach(o => {
        o.items.forEach(i => {
          totalOrderedQty += i.quantity;
          totalReturnedQty += i.returnedQty || 0;
        });
      });
      const returnRate = totalOrderedQty > 0 ? Math.round((totalReturnedQty / totalOrderedQty) * 100) : 0;

      // Last Purchase Date
      let lastPurchaseDate = 'N/A';
      if (sOrders.length > 0) {
        const dates = sOrders.map(o => new Date(o.purchaseDate).getTime());
        lastPurchaseDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
      }

      // Performance Score Card weighted
      // 70% weight on-time rate, 30% weight return rate deduction
      const score = Math.max(0, Math.min(100, Math.round((onTimeRate * 0.7) + ((100 - returnRate) * 0.3))));

      return {
        id: s.id,
        name: s.name,
        totalOrders: totalOrdersCount,
        totalValue: totalPurchasesVal,
        avgDeliveryTime: avgDeliveryTime !== null ? `${avgDeliveryTime} Days` : 'N/A',
        onTimeRate: `${onTimeRate}%`,
        delayedCount,
        returnRate: `${returnRate}%`,
        lastPurchaseDate,
        score
      };
    });
  };
  const supplierPerformanceList = getSupplierPerformanceList();

  // Selected product cost history calculations
  const getProductCostHistory = () => {
    const selectedProd = products.find(p => p.id === costHistoryProductId);
    if (!selectedProd) return null;

    const history = purchaseOrders
      .filter(o => o.status !== 'Draft' && o.status !== 'Cancelled')
      .flatMap(o =>
        o.items
          .filter(item => item.productId === costHistoryProductId)
          .map(item => ({
            purchaseNumber: o.purchaseNumber,
            date: o.purchaseDate,
            supplierName: o.supplierName,
            quantity: item.quantity,
            costPrice: item.costPrice,
            total: item.quantity * item.costPrice
          }))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const prices = history.map(h => h.costPrice);
    const minCost = prices.length > 0 ? Math.min(...prices) : selectedProd.cost;
    const maxCost = prices.length > 0 ? Math.max(...prices) : selectedProd.cost;
    const avgCost = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : selectedProd.cost;
    const lastCost = history[0]?.costPrice || selectedProd.cost;

    return {
      productName: selectedProd.name,
      sku: selectedProd.sku || 'N/A',
      currentCost: selectedProd.cost,
      lastCost,
      minCost,
      maxCost,
      avgCost,
      history
    };
  };
  const productCostHistory = getProductCostHistory();

  // Handlers for List Actions
  const handleAddNewPO = () => {
    setSupplierId(suppliers[0]?.id || 0);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setExpectedDeliveryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setOrderNotes('');
    setOrderItems([]);
    setShippingCost(0);
    setAdditionalCharges(0);
    setOverallDiscount(0);
    setOverallTax(0);
    setAmountPaid(0);
    setViewState('create');
  };

  const handleEditDraft = (order: PurchaseOrder) => {
    if (order.status !== 'Draft') return;
    setSelectedOrderId(order.id);
    setSupplierId(order.supplierId);
    setPurchaseDate(order.purchaseDate);
    setExpectedDeliveryDate(order.expectedDeliveryDate);
    setDueDate(order.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setOrderNotes(order.notes || '');
    setOrderItems(
      order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        costPrice: item.costPrice,
        discount: item.discount,
        tax: item.tax
      }))
    );
    setShippingCost(order.shippingCost);
    setAdditionalCharges(order.additionalCharges);
    setOverallDiscount(order.discount);
    setOverallTax(order.tax);
    setAmountPaid(order.amountPaid);
    setViewState('edit');
  };

  const handleDuplicate = async (id: number) => {
    const duplicated = await duplicatePurchaseOrder(id);
    if (duplicated) {
      alert(`Purchase Order duplicated successfully as Draft: ${duplicated.purchaseNumber}`);
    }
  };

  const handleCancelPO = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this purchase order?')) {
      await updatePurchaseOrder(id, { status: 'Cancelled' });
    }
  };

  const handleDeletePO = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this purchase order?')) {
      await deletePurchaseOrder(id);
      if (selectedOrderId === id) {
        setViewState('list');
      }
    }
  };

  const handleSavePO = async (status: 'Draft' | 'Ordered') => {
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }
    if (orderItems.length === 0) {
      alert('Please add at least one product');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    const supplierName = supplier ? supplier.name : 'Unknown Supplier';

    const orderPayload = {
      supplierId,
      supplierName,
      purchaseDate,
      expectedDeliveryDate,
      dueDate,
      status,
      items: orderItems.map(item => ({
        ...item,
        receivedQty: 0,
        returnedQty: 0
      })),
      shippingCost,
      additionalCharges,
      discount: overallDiscount,
      tax: overallTax,
      notes: orderNotes,
      totalAmount: formGrandTotal,
      amountPaid,
      remainingBalance: formRemainingBalance
    };

    if (status === 'Ordered') setIsSavingOrder(true);
    else setIsSavingDraft(true);

    try {
      if (viewState === 'create') {
        const newPO = await addPurchaseOrder(orderPayload);
        alert(`Purchase Order ${newPO.purchaseNumber} created as ${status}!`);
      } else if (viewState === 'edit' && selectedOrderId) {
        await updatePurchaseOrder(selectedOrderId, orderPayload);
        alert(`Purchase Order updated successfully!`);
      }
      setViewState('list');
    } catch (err) {
      console.error(err);
      alert('Failed to save purchase order.');
    } finally {
      setIsSavingOrder(false);
      setIsSavingDraft(false);
    }
  };

  const handleAddProductToPO = (product: Product) => {
    const exists = orderItems.find(item => item.productId === product.id);
    if (exists) {
      setOrderItems(
        orderItems.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          costPrice: product.cost,
          discount: 0,
          tax: 0
        }
      ]);
    }
    setProductSearchTerm('');
    setIsProductListOpen(false);
  };

  const handleRemoveProductFromPO = (productId: number) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  // Open receive stock modal
  const handleOpenReceiveModal = () => {
    if (!selectedOrder) return;
    const initialQtys: Record<number, number> = {};
    selectedOrder.items.forEach(item => {
      const pending = Math.max(0, item.quantity - item.receivedQty);
      initialQtys[item.productId] = pending;
    });
    setReceiveQtys(initialQtys);
    setReceiveNotes('');
    setShowReceiveModal(true);
  };

  const handleConfirmReceive = async () => {
    if (!selectedOrder) return;

    const payload = Object.entries(receiveQtys).map(([productId, qty]) => ({
      productId: parseInt(productId, 10),
      quantity: Number(qty)
    }));

    try {
      await receiveInventory(selectedOrder.id, payload, receiveNotes);
      setShowReceiveModal(false);
      alert('Inventory received and stock levels updated successfully!');
    } catch (e: any) {
      alert(`Error receiving stock: ${e.message}`);
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (order: PurchaseOrder) => {
    setSelectedOrderId(order.id);
    setPayAmount(order.remainingBalance);
    setPayMethod('Cash');
    setPayReference('');
    setPayNotes('');
    setPayDate(new Date().toISOString().split('T')[0]);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrderId) return;
    if (payAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      await recordPayment(selectedOrderId, {
        date: payDate,
        method: payMethod,
        reference: payReference || undefined,
        amount: payAmount,
        notes: payNotes || undefined
      });
      setShowPaymentModal(false);
      alert('Supplier payment recorded successfully!');
    } catch (e: any) {
      alert(`Error recording payment: ${e.message}`);
    }
  };

  // Open Return Modal
  const handleOpenReturnModal = () => {
    if (!selectedOrder) return;
    const initialReturnQtys: Record<number, number> = {};
    let hasReceivedItems = false;
    
    selectedOrder.items.forEach(item => {
      const available = Math.max(0, item.receivedQty - item.returnedQty);
      initialReturnQtys[item.productId] = available;
      if (available > 0) hasReceivedItems = true;
    });

    if (!hasReceivedItems) {
      alert('There are no received products available to return back to the supplier.');
      return;
    }

    setReturnQtys(initialReturnQtys);
    setReturnReason('');
    setShowReturnModal(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedOrder) return;

    const payload = Object.entries(returnQtys)
      .map(([productId, qty]) => ({
        productId: parseInt(productId, 10),
        quantity: Number(qty)
      }))
      .filter(item => item.quantity > 0);

    if (payload.length === 0) {
      alert('Please select at least one item and quantity to return');
      return;
    }

    try {
      await returnItems(selectedOrder.id, payload, returnReason);
      setShowReturnModal(false);
      alert('Purchase return logged successfully! Inventory stock decreased.');
    } catch (e: any) {
      alert(`Error returning inventory: ${e.message}`);
    }
  };

  const handleDownloadPDF = (order: PurchaseOrder) => {
    generatePurchaseOrderPDF(order, shopSettings);
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Draft
          </span>
        );
      case 'Ordered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
            <Truck className="w-3.5 h-3.5 mr-1" /> Ordered
          </span>
        );
      case 'Partially Received':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <Layers className="w-3.5 h-3.5 mr-1" /> Partially Received
          </span>
        );
      case 'Received':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Received
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelled
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: PurchaseOrder['paymentStatus']) => {
    switch (status) {
      case 'Unpaid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-650 dark:bg-red-950/30 dark:text-red-400">
            Unpaid
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
            Partially Paid
          </span>
        );
      case 'Paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
            Paid
          </span>
        );
      case 'Overpaid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-650 dark:bg-purple-950/30 dark:text-purple-400">
            Overpaid
          </span>
        );
    }
  };

  // CSV Exporter helper
  const handleExportCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = (reportType: 'summary' | 'suppliers' | 'outstanding' | 'costs' | 'history') => {
    if (reportType === 'summary') {
      const headers = ['PO Number', 'Supplier', 'Order Date', 'Due Date', 'Grand Total', 'Amount Paid', 'Returned Amount', 'Outstanding', 'Delivery Status', 'Payment Status'];
      const rows = activeOrders.map(o => [
        o.purchaseNumber,
        o.supplierName,
        o.purchaseDate,
        o.dueDate,
        o.totalAmount,
        o.amountPaid,
        o.totalReturnedAmount || 0,
        o.remainingBalance,
        o.status,
        o.paymentStatus
      ]);
      handleExportCSV('Purchase_Summary_Report.csv', headers, rows);
    } else if (reportType === 'suppliers') {
      const headers = ['Supplier Name', 'Total Purchase Orders', 'Procured Cost Value', 'Average Delivery Time', 'On-Time Delivery Rate', 'Deducted Return Rate', 'Supplier Insights Score'];
      const rows = supplierPerformanceList.map(s => [
        s.name,
        s.totalOrders,
        s.totalValue,
        s.avgDeliveryTime,
        s.onTimeRate,
        s.returnRate,
        s.score
      ]);
      handleExportCSV('Supplier_Performance_Report.csv', headers, rows);
    } else if (reportType === 'outstanding') {
      const headers = ['PO Number', 'Supplier Name', 'Due Date', 'Days Overdue', 'Outstanding Amount'];
      const rows = overdueList.map(o => [
        o.purchaseNumber,
        o.supplierName,
        o.dueDate,
        o.daysOverdue,
        o.outstandingAmount
      ]);
      handleExportCSV('Outstanding_Payments_Report.csv', headers, rows);
    } else if (reportType === 'costs') {
      const headers = ['Product Name', 'SKU', 'Current Inventory Cost', 'Last Purchased Cost', 'Minimum Procured Cost', 'Maximum Procured Cost', 'Average Cost'];
      const rows = products.map(p => {
        const prodPurchases = activeOrders.flatMap(o =>
          o.items.filter(item => item.productId === p.id).map(item => item.costPrice)
        );
        const minCost = prodPurchases.length > 0 ? Math.min(...prodPurchases) : p.cost;
        const maxCost = prodPurchases.length > 0 ? Math.max(...prodPurchases) : p.cost;
        const avgCost = prodPurchases.length > 0 ? prodPurchases.reduce((sum, pr) => sum + pr, 0) / prodPurchases.length : p.cost;
        const lastCost = prodPurchases[prodPurchases.length - 1] || p.cost;
        return [
          p.name,
          p.sku || 'N/A',
          p.cost,
          lastCost,
          minCost,
          maxCost,
          avgCost.toFixed(2)
        ];
      });
      handleExportCSV('Product_Cost_Analysis_Report.csv', headers, rows);
    } else if (reportType === 'history') {
      const headers = ['PO Number', 'Supplier', 'Date', 'Product', 'Quantity', 'Cost Price', 'Total Cost'];
      const rows = activeOrders.flatMap(o =>
        o.items.map(item => [
          o.purchaseNumber,
          o.supplierName,
          o.purchaseDate,
          item.productName,
          item.quantity,
          item.costPrice,
          item.quantity * item.costPrice
        ])
      );
      handleExportCSV('Purchase_Itemized_History.csv', headers, rows);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/40 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400';
    return 'text-red-655 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-405';
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files).map(f => f.name);
      setAttachedFiles([...attachedFiles, ...files]);
    }
  };

  // Compute overdue list
  const overdueList = getOverduePayments();

  return (
    <div className="space-y-6 font-sans">
      {/* ──────────────────────────────────────────────────────── */}
      {/* VIEW SELECTOR TAB BAR (Visible on list mode) */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewState === 'list' && (
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-700 pb-px">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-3 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-blue-650 text-blue-650 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-3 transition-colors ${
                activeTab === 'orders'
                  ? 'border-b-2 border-blue-650 text-blue-650 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('supplier_performance')}
              className={`pb-3 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'supplier_performance'
                  ? 'border-b-2 border-blue-655 text-blue-655 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Supplier Scorecards</span>
            </button>
            <button
              onClick={() => setActiveTab('cost_history')}
              className={`pb-3 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'cost_history'
                  ? 'border-b-2 border-blue-655 text-blue-655 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Cost History Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`pb-3 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'insights'
                  ? 'border-b-2 border-blue-655 text-blue-655 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Procurement Insights</span>
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`pb-3 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'overdue'
                  ? 'border-b-2 border-rose-650 text-rose-650 dark:text-rose-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <span>Overdue Payments</span>
              {overdueList.length > 0 && (
                <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 px-2 py-0.2 rounded-full text-[10px]">
                  {overdueList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-3 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'reports'
                  ? 'border-b-2 border-blue-655 text-blue-655 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Export Reports</span>
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 1: OVERVIEW DASHBOARD */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewState === 'list' && activeTab === 'dashboard' && (
        <div className="space-y-6">
          <PageHeader
            title="Procurement Intelligence"
            subtitle="Overview of capital spend, supplier performance, and procurement growth metrics."
            icon={BarChart3}
            breadcrumbs={[
              { label: 'Home', onClick: () => window.location.hash = '#/' },
              { label: 'Procurement', onClick: () => setActiveTab('dashboard') },
              { label: 'Dashboard' }
            ]}
            actions={[
              {
                label: 'Create Purchase Order',
                onClick: handleAddNewPO,
                icon: Plus,
                variant: 'primary'
              }
            ]}
          />

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              title="Total Capital Spend"
              value={`Rs. ${totalPurchaseValue.toLocaleString()}`}
              icon={DollarSign}
              iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400"
              comparisonText="All-time active purchases"
            />

            <KpiCard
              title="Spend This Month"
              value={`Rs. ${purchasesThisMonth.toLocaleString()}`}
              icon={CalendarDays}
              iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400"
              trend={{
                value: `${Math.abs(purchaseGrowth).toFixed(1)}% vs Last Month`,
                type: purchaseGrowth >= 0 ? "positive" : "negative"
              }}
              comparisonText=""
            />

            <KpiCard
              title="Average Order Value"
              value={`Rs. ${averagePurchaseValue.toLocaleString()}`}
              icon={TrendingUp}
              iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
              comparisonText={`Based on ${activeOrders.length} orders`}
            />

            <KpiCard
              title="Outstanding Liability"
              value={`Rs. ${totalOutstanding.toLocaleString()}`}
              icon={AlertCircle}
              iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-455"
              comparisonText={`Due to ${suppliers.length} active suppliers`}
            />
          </div>

          {/* Interactive HTML/CSS Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Procurement Value Trends (Last 6 Months)</h3>
                <p className="text-[11px] text-slate-400">Visualizing monthly invoice value.</p>
              </div>

              {/* Custom CSS Bar chart */}
              <div className="h-64 flex items-end justify-between pt-8 px-4 border-b border-l border-slate-100 dark:border-gray-700">
                {trendData.map((d, i) => {
                  const maxVal = Math.max(...trendData.map(item => item.value)) || 1;
                  const pct = (d.value / maxVal) * 80; // scale to max 80% height
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 space-y-2 group cursor-pointer">
                      <div className="relative w-12 md:w-16 flex flex-col justify-end">
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-md pointer-events-none whitespace-nowrap z-10">
                          Rs. {d.value.toLocaleString()}
                        </div>
                        <div
                          style={{ height: `${pct}%`, minHeight: d.value > 0 ? '4px' : '0px' }}
                          className="bg-blue-600 dark:bg-blue-500 rounded-t-lg transition-all duration-500 group-hover:bg-blue-700 group-hover:shadow-md"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-350">{d.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category distribution */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Spend distribution by Category</h3>
                <p className="text-[11px] text-slate-400">Procurement values classified by category.</p>
              </div>

              {categorySpendData.length === 0 ? (
                <p className="text-xs text-slate-400 italic pt-12 text-center">No categories to display data</p>
              ) : (
                <div className="space-y-4 pt-2">
                  {categorySpendData.slice(0, 5).map((item, idx) => {
                    const totalSpend = categorySpendData.reduce((sum, c) => sum + c.value, 0) || 1;
                    const pct = Math.round((item.value / totalSpend) * 100);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span className="truncate">{item.name}</span>
                          <span>{pct}% (Rs. {item.value.toLocaleString()})</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="bg-indigo-650 h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Purchased Products */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">Most Procured Products</h3>
              <div className="divide-y divide-slate-100 dark:divide-gray-700">
                {mostPurchasedProducts.map((p, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 bg-slate-100 dark:bg-gray-700 text-slate-655 dark:text-slate-300 rounded-full flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-white">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white block">{p.quantity} Units</span>
                      <span className="text-[10px] text-slate-450 block">Val: Rs. {p.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {mostPurchasedProducts.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No purchased items recorded.</p>
                )}
              </div>
            </div>

            {/* Top spend suppliers */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">Top Suppliers by Spent Value</h3>
              <div className="divide-y divide-slate-100 dark:divide-gray-700">
                {supplierSpendData.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-white">{s.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Rs. {s.value.toLocaleString()}
                    </span>
                  </div>
                ))}
                {supplierSpendData.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No transactions recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 2: PURCHASE ORDERS LIST */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewState === 'list' && activeTab === 'orders' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders Registry</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Detailed record of all drafts, orders placed, items received, and balances due.
              </p>
            </div>
            <button
              onClick={handleAddNewPO}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-colors font-medium text-sm shadow-sm"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Create Purchase Order</span>
            </button>
          </div>

          {/* Sorters, Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4.5 w-4.5" />
              <input
                type="text"
                placeholder="Search POs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={supplierFilter}
                onChange={e => setSupplierFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Delivery Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Ordered">Ordered</option>
                <option value="Partially Received">Partially Received</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={paymentStatusFilter}
                onChange={e => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Payment Statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Overpaid">Overpaid</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="date">Sort by Date</option>
                <option value="number">Sort by PO Number</option>
                <option value="total">Sort by Total Amount</option>
              </select>

              <button
                onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
                className="px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:text-slate-900 text-sm font-medium"
              >
                {sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/70 dark:bg-gray-700/50 border-b border-slate-100 dark:border-gray-700 text-slate-600 dark:text-gray-300 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">PO Number</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Order Date</th>
                    <th className="px-6 py-4">Products</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Paid</th>
                    <th className="px-6 py-4">Outstanding</th>
                    <th className="px-6 py-4">Delivery Status</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700/60">
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                        No orders match the criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          {order.purchaseNumber}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-gray-300">
                          {order.supplierName}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-gray-400">
                          {order.purchaseDate}
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-gray-300 font-medium">
                          {(order.items?.length || 0)} {(order.items?.length || 0) === 1 ? 'Product' : 'Products'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          Rs. {order.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-650 dark:text-gray-400">
                          Rs. {order.amountPaid.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-rose-600 dark:text-rose-455 font-semibold">
                          Rs. {order.remainingBalance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                        <td className="px-6 py-4">{getPaymentStatusBadge(order.paymentStatus)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setViewState('details');
                              }}
                              className="p-1.5 text-slate-655 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700/60"
                              title="View Details"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </button>
                            {order.status === 'Draft' && (
                              <button
                                onClick={() => handleEditDraft(order)}
                                className="p-1.5 text-slate-655 hover:text-green-600 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700/60"
                                title="Edit Draft"
                              >
                                <Edit className="h-4.5 w-4.5" />
                              </button>
                            )}
                            {order.status !== 'Draft' && order.status !== 'Cancelled' && order.remainingBalance > 0 && (
                              <button
                                onClick={() => handleOpenPaymentModal(order)}
                                className="p-1.5 text-slate-655 hover:text-emerald-650 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700/60"
                                title="Record Payment"
                              >
                                <DollarSign className="h-4.5 w-4.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDuplicate(order.id)}
                              className="p-1.5 text-slate-655 hover:text-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700/60"
                              title="Duplicate"
                            >
                              <Copy className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-slate-50/50 dark:bg-gray-700/30 px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-gray-700">
                <span className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, processedOrders.length)} of{' '}
                  {processedOrders.length} entries
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                    className="p-1 rounded-lg border border-slate-200 dark:border-gray-600 disabled:opacity-50 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                    className="p-1 rounded-lg border border-slate-200 dark:border-gray-600 disabled:opacity-50 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 3: SUPPLIER PERFORMANCE */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewState === 'list' && activeTab === 'supplier_performance' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Supplier Scorecards</h2>
            <p className="text-xs text-slate-500">Calculates delivery compliance, returns rate, and intelligence scoring.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-55 dark:bg-gray-700 border-b border-slate-150 text-slate-600 dark:text-gray-300 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4 text-center">Orders Placed</th>
                    <th className="px-6 py-4">Spend Value</th>
                    <th className="px-6 py-4 text-center">Avg Delivery Time</th>
                    <th className="px-6 py-4 text-center">On-Time Rate</th>
                    <th className="px-6 py-4 text-center">Stock Return Rate</th>
                    <th className="px-6 py-4">Last Procurement</th>
                    <th className="px-6 py-4 text-center">Performance Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700 text-slate-800 dark:text-gray-350">
                  {supplierPerformanceList.map((sup, idx) => (
                    <tr key={sup.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/40">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{sup.name}</td>
                      <td className="px-6 py-4 text-center font-medium">{sup.totalOrders} Orders</td>
                      <td className="px-6 py-4 font-semibold">Rs. {sup.totalValue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center font-medium">{sup.avgDeliveryTime}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-semibold ${sup.onTimeRate === '100%' ? 'text-green-600' : 'text-amber-600'}`}>
                          {sup.onTimeRate}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-rose-600 font-semibold">{sup.returnRate}</td>
                      <td className="px-6 py-4">{sup.lastPurchaseDate}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 border rounded-full text-xs font-bold ${getScoreColor(sup.score)}`}>
                          {sup.score} / 100
                        </span>
                      </td>
                    </tr>
                  ))}
                  {supplierPerformanceList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">No suppliers available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 4: PRODUCT COST HISTORY MATRIX */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewState === 'list' && activeTab === 'cost_history' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white">Product Cost History Audit</h2>
              <p className="text-xs text-slate-500">Track and compare previous supplier costs for individual products.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Select Product</label>
              <select
                value={costHistoryProductId}
                onChange={e => setCostHistoryProductId(Number(e.target.value))}
                className="px-3.5 py-2 border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-750 text-slate-950 dark:text-white text-sm outline-none w-64 focus:ring-2 focus:ring-blue-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {productCostHistory && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Product stats */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
                <div className="border-b pb-2">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Product SKU</span>
                  <span className="text-base font-bold text-slate-800 dark:text-white block mt-0.5">{productCostHistory.sku}</span>
                  <h3 className="text-sm font-extrabold text-blue-650 dark:text-blue-400 block mt-1">{productCostHistory.productName}</h3>
                </div>

                <div className="space-y-3 text-xs font-semibold text-slate-500">
                  <div className="flex justify-between">
                    <span>Current Inventory Cost:</span>
                    <span className="text-slate-900 dark:text-white">Rs. {productCostHistory.currentCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Purchased Cost:</span>
                    <span className="text-slate-900 dark:text-white">Rs. {productCostHistory.lastCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minimum Procured Cost:</span>
                    <span className="text-green-600">Rs. {productCostHistory.minCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maximum Procured Cost:</span>
                    <span className="text-rose-600">Rs. {productCostHistory.maxCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Weighted Average Cost:</span>
                    <span className="text-blue-600">Rs. {productCostHistory.avgCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Historical Procurements Log</h3>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-gray-700 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="px-6 py-3">PO Number</th>
                        <th className="px-6 py-3">Procured Date</th>
                        <th className="px-6 py-3">Supplier Name</th>
                        <th className="px-6 py-3 text-center">Quantity Ordered</th>
                        <th className="px-6 py-3">Unit Cost Price</th>
                        <th className="px-6 py-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-700 text-slate-800 dark:text-gray-350">
                      {productCostHistory.history.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">No historical purchase orders recorded for this product.</td>
                        </tr>
                      ) : (
                        productCostHistory.history.map((h, hidx) => (
                          <tr key={hidx} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/40">
                            <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">{h.purchaseNumber}</td>
                            <td className="px-6 py-3">{h.date}</td>
                            <td className="px-6 py-3 font-medium">{h.supplierName}</td>
                            <td className="px-6 py-3 text-center font-bold">{h.quantity} Units</td>
                            <td className="px-6 py-3 font-bold">Rs. {h.costPrice.toFixed(2)}</td>
                            <td className="px-6 py-3 font-bold text-slate-950 dark:text-white text-right">Rs. {h.total.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 5: PROCUREMENT INSIGHTS */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewState === 'list' && activeTab === 'insights' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Smart Purchasing Insights</h2>
            <p className="text-xs text-slate-500">System generated heuristics analyzing supply costs, volumes, and spend distribution.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Products spend insights */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white border-b pb-2 flex items-center space-x-1.5">
                <Package className="w-4.5 h-4.5 text-blue-500" />
                <span>Product Volume Insights</span>
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 block">Frequently Purchased Products:</span>
                  <div className="mt-1 space-y-1">
                    {getFrequentlyPurchased().map((name, i) => (
                      <span key={i} className="inline-block bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-1 rounded-lg mr-1.5 mb-1.5 font-bold">{name}</span>
                    ))}
                    {getFrequentlyPurchased().length === 0 && <span className="text-slate-400 italic">No data</span>}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 block">Rarely Purchased Products:</span>
                  <div className="mt-1 space-y-1">
                    {getRarelyPurchased().map((name, i) => (
                      <span key={i} className="inline-block bg-slate-100 text-slate-700 dark:bg-gray-700/60 dark:text-gray-300 px-2.5 py-1 rounded-lg mr-1.5 mb-1.5 font-bold">{name}</span>
                    ))}
                    {getRarelyPurchased().length === 0 && <span className="text-slate-400 italic">No data</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Product pricing change insights */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white border-b pb-2 flex items-center space-x-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
                <span>Price Trend Insights</span>
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 block text-rose-600">Cost Price Increasing:</span>
                  <div className="mt-1 space-y-1">
                    {risingCostProducts.map((name, i) => (
                      <span key={i} className="inline-block bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 px-2.5 py-1 rounded-lg mr-1.5 mb-1.5 font-bold">{name}</span>
                    ))}
                    {risingCostProducts.length === 0 && <span className="text-slate-400 italic">None of the products show cost increases</span>}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 block text-green-600">Cost Price Stable:</span>
                  <div className="mt-1 space-y-1">
                    {stableCostProducts.map((name, i) => (
                      <span key={i} className="inline-block bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-400 px-2.5 py-1 rounded-lg mr-1.5 mb-1.5 font-bold">{name}</span>
                    ))}
                    {stableCostProducts.length === 0 && <span className="text-slate-400 italic">No products recorded</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier spend insights */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white border-b pb-2 flex items-center space-x-1.5">
                <Award className="w-4.5 h-4.5 text-emerald-500" />
                <span>Supplier Spend Insights</span>
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 block">Highest Procurement Spend:</span>
                  <div className="mt-1">
                    {supplierSpendData[0] ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 p-3 rounded-lg text-slate-800 dark:text-slate-350">
                        <span className="font-bold text-emerald-700 block">{supplierSpendData[0].name}</span>
                        <span className="block text-[10px] mt-0.5">Grand Total Spent: Rs. {supplierSpendData[0].value.toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No spend data</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 block">Lowest Procurement Spend:</span>
                  <div className="mt-1">
                    {supplierSpendData[supplierSpendData.length - 1] && supplierSpendData.length > 1 ? (
                      <div className="bg-slate-50 dark:bg-gray-700/60 p-3 rounded-lg text-slate-700 dark:text-slate-350">
                        <span className="font-bold block text-slate-800 dark:text-white">{supplierSpendData[supplierSpendData.length - 1].name}</span>
                        <span className="block text-[10px] mt-0.5">Grand Total Spent: Rs. {supplierSpendData[supplierSpendData.length - 1].value.toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No low spend suppliers</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 6: REPORTS EXPORTER */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewState === 'list' && activeTab === 'reports' && (
        <div className="space-y-4 max-w-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Procurement Reports Center</h2>
            <p className="text-xs text-slate-500">Download data summaries in CSV format for local auditing and reporting.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">Select Report Format</h3>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-700/50 rounded-xl hover:bg-slate-100 transition-colors">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">Procurement Invoices Summary</span>
                  <span className="text-[10px] text-slate-450">Summary registry of all active orders, delivery/payment states, and amounts.</span>
                </div>
                <button
                  onClick={() => handleExportReport('summary')}
                  className="bg-blue-600 hover:bg-blue-750 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-700/50 rounded-xl hover:bg-slate-100 transition-colors">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">Supplier Performance Audit</span>
                  <span className="text-[10px] text-slate-450">Supplier order histories, compliance ratings, delayed metrics, and intelligence scores.</span>
                </div>
                <button
                  onClick={() => handleExportReport('suppliers')}
                  className="bg-blue-600 hover:bg-blue-750 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-700/50 rounded-xl hover:bg-slate-100 transition-colors">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">Outstanding Balances &amp; Overdues</span>
                  <span className="text-[10px] text-slate-450">List of unpaid or partially paid orders where the due date has already passed.</span>
                </div>
                <button
                  onClick={() => handleExportReport('outstanding')}
                  className="bg-blue-600 hover:bg-blue-750 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-700/50 rounded-xl hover:bg-slate-100 transition-colors">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">Product Costing Analysis</span>
                  <span className="text-[10px] text-slate-450">Cost price histories, averages, maximums, and minimums across items.</span>
                </div>
                <button
                  onClick={() => handleExportReport('costs')}
                  className="bg-blue-600 hover:bg-blue-750 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-700/50 rounded-xl hover:bg-slate-100 transition-colors">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">Procured Itemized Ledger</span>
                  <span className="text-[10px] text-slate-450">Item-by-item listing of all products ordered from suppliers.</span>
                </div>
                <button
                  onClick={() => handleExportReport('history')}
                  className="bg-blue-600 hover:bg-blue-750 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 7: OVERDUE PAYMENTS */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewState === 'list' && activeTab === 'overdue' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Overdue Supplier Payments</h2>
            <p className="text-xs text-slate-500">
              Orders where the payment due date has passed and there is an outstanding balance.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-gray-700 border-b border-slate-150 text-slate-600 dark:text-gray-300 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">PO Number</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Days Overdue</th>
                    <th className="px-6 py-4">Outstanding Amount</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700/60">
                  {overdueList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                          <span className="font-bold text-slate-705 text-sm">All supplier accounts clear!</span>
                          <span className="text-xs">No overdue payments detected at the moment.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    overdueList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-55/30 dark:hover:bg-gray-800/40">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          {item.purchaseNumber}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-gray-305">
                          {item.supplierName}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-gray-400">
                          {item.dueDate}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                            {item.daysOverdue} days overdue
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400">
                          Rs. {item.outstandingAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              const ord = purchaseOrders.find(o => o.id === item.id);
                              if (ord) handleOpenPaymentModal(ord);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ml-auto"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Record Payment</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* CREATE & EDIT FORM VIEW */}
      {/* ──────────────────────────────────────────────────────── */}
      {(viewState === 'create' || viewState === 'edit') && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewState('list')}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {viewState === 'create' ? 'Create Purchase Order' : 'Edit Purchase Order'}
              </h2>
              <p className="text-sm text-slate-500">Configure logistics and financial metadata for supplier order.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Form Details & Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Core metadata card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-gray-700 pb-2">
                  Order &amp; Billing Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">
                      Supplier *
                    </label>
                    <select
                      value={supplierId}
                      onChange={e => setSupplierId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value={0}>Select a Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={e => setPurchaseDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-650 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">
                      Expected Delivery
                    </label>
                    <input
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={e => setExpectedDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-650 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">
                      Payment Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-650 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Enter any ordering instructions, delivery terms or remarks..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-700 pb-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Products in Order
                  </h3>
                  <div className="relative">
                    <button
                      onClick={() => setIsProductListOpen(!isProductListOpen)}
                      className="bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </button>
                    {isProductListOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg z-30 p-3 space-y-2">
                        <input
                          type="text"
                          placeholder="Search product..."
                          value={productSearchTerm}
                          onChange={e => setProductSearchTerm(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-gray-600 rounded-md bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white outline-none"
                          autoFocus
                        />
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-gray-700/60">
                          {products
                            .filter(p =>
                              p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                              (p.sku && p.sku.toLowerCase().includes(productSearchTerm.toLowerCase()))
                            )
                            .map(prod => (
                              <button
                                key={prod.id}
                                onClick={() => handleAddProductToPO(prod)}
                                className="w-full text-left py-2 px-1 text-xs hover:bg-slate-50 dark:hover:bg-gray-700/50 flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-semibold block text-slate-800 dark:text-white">
                                    {prod.name}
                                  </span>
                                  <span className="text-slate-400 block text-[10px]">
                                    SKU: {prod.sku || 'N/A'} | Stock: {prod.stock}
                                  </span>
                                </div>
                                <span className="font-semibold text-slate-950 dark:text-white">
                                  Rs. {prod.cost.toFixed(2)}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-gray-700 border-b border-slate-100 dark:border-gray-700 text-slate-600 dark:text-gray-300 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3 text-center">Quantity</th>
                        <th className="px-4 py-3 text-center">Cost Price</th>
                        <th className="px-4 py-3 text-center">Discount</th>
                        <th className="px-4 py-3 text-center">Tax</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                        <th className="px-4 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-700/60">
                      {orderItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                            No products added to this order. Click "Add Product" above to build this purchase.
                          </td>
                        </tr>
                      ) : (
                        orderItems.map((item, idx) => {
                          const itemSubtotal = item.quantity * item.costPrice - item.discount + item.tax;
                          return (
                            <tr key={item.productId} className="hover:bg-slate-55/30 dark:hover:bg-gray-800/40">
                              <td className="px-4 py-3">
                                <span className="font-semibold text-slate-800 dark:text-white block">
                                  {item.productName}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setOrderItems(
                                      orderItems.map((oi, i) =>
                                        i === idx ? { ...oi, quantity: Math.max(1, val) } : oi
                                      )
                                    );
                                  }}
                                  className="w-16 px-1.5 py-1 border border-slate-200 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white font-medium outline-none text-center"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.costPrice}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setOrderItems(
                                      orderItems.map((oi, i) =>
                                        i === idx ? { ...oi, costPrice: Math.max(0, val) } : oi
                                      )
                                    );
                                  }}
                                  className="w-20 px-1.5 py-1 border border-slate-200 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white font-medium outline-none text-center"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.discount}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setOrderItems(
                                      orderItems.map((oi, i) =>
                                        i === idx ? { ...oi, discount: Math.max(0, val) } : oi
                                      )
                                    );
                                  }}
                                  className="w-16 px-1.5 py-1 border border-slate-200 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white font-medium outline-none text-center"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.tax}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setOrderItems(
                                      orderItems.map((oi, i) =>
                                        i === idx ? { ...oi, tax: Math.max(0, val) } : oi
                                      )
                                    );
                                  }}
                                  className="w-16 px-1.5 py-1 border border-slate-200 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white font-medium outline-none text-center"
                                />
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">
                                Rs. {itemSubtotal.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductFromPO(item.productId)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Calculations & Actions */}
            <div className="space-y-6">
              {/* Financial summary card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-gray-700 pb-2">
                  Order Financial Summary
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-gray-400">
                    <span>Items Subtotal:</span>
                    <span>Rs. {formItemsSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-gray-400">
                    <span>Discount:</span>
                    <input
                      type="number"
                      min={0}
                      value={overallDiscount}
                      onChange={e => setOverallDiscount(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-1.5 py-0.5 border border-slate-200 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white text-right outline-none font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-gray-400">
                    <span>Tax:</span>
                    <input
                      type="number"
                      min={0}
                      value={overallTax}
                      onChange={e => setOverallTax(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-1.5 py-0.5 border border-slate-200 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white text-right outline-none font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-gray-400">
                    <span>Shipping Cost:</span>
                    <input
                      type="number"
                      min={0}
                      value={shippingCost}
                      onChange={e => setShippingCost(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-1.5 py-0.5 border border-slate-200 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white text-right outline-none font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-gray-400">
                    <span>Additional Charges:</span>
                    <input
                      type="number"
                      min={0}
                      value={additionalCharges}
                      onChange={e => setAdditionalCharges(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-1.5 py-0.5 border border-slate-200 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white text-right outline-none font-medium"
                    />
                  </div>

                  <div className="border-t border-slate-100 dark:border-gray-700 my-2 pt-2.5 flex justify-between font-bold text-slate-900 dark:text-white text-base">
                    <span>Grand Total:</span>
                    <span>Rs. {formGrandTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-gray-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-350">Amount Paid Now:</span>
                    <input
                      type="number"
                      min={0}
                      value={amountPaid}
                      onChange={e => setAmountPaid(Math.max(0, Number(e.target.value)))}
                      className="w-24 px-1.5 py-0.5 border border-slate-200 dark:border-gray-600 rounded bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white text-right outline-none font-bold"
                    />
                  </div>

                  <div className="flex justify-between font-bold text-rose-600 dark:text-rose-455">
                    <span>Remaining Balance:</span>
                    <span>Rs. {formRemainingBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm space-y-3">
                <LoadingButton
                  onClick={() => handleSavePO('Ordered')}
                  isLoading={isSavingOrder}
                  loadingText="Placing Order..."
                  className="w-full bg-blue-600 hover:bg-blue-705 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Truck className="w-4.5 h-4.5" />
                  <span>Save &amp; Place Order</span>
                </LoadingButton>

                <LoadingButton
                  onClick={() => handleSavePO('Draft')}
                  isLoading={isSavingDraft}
                  loadingText="Saving Draft..."
                  className="w-full bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-200 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Save as Draft
                </LoadingButton>

                <button
                  onClick={() => setViewState('list')}
                  className="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-gray-705 text-slate-505 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* PURCHASE DETAILS VIEW */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewState === 'details' && selectedOrder && (
        <div className="space-y-6">
          {/* Header Action Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewState('list')}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedOrder.purchaseNumber}
                  </h2>
                  {getStatusBadge(selectedOrder.status)}
                  {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                </div>
                <p className="text-xs text-slate-500">
                  PO Date: {selectedOrder.purchaseDate} | Due Date: {selectedOrder.dueDate}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedOrder.status === 'Draft' && (
                <button
                  onClick={() => handleEditDraft(selectedOrder)}
                  className="bg-green-650 hover:bg-green-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Draft</span>
                </button>
              )}

              {selectedOrder.status !== 'Draft' && selectedOrder.status !== 'Cancelled' && selectedOrder.remainingBalance > 0 && (
                <button
                  onClick={() => handleOpenPaymentModal(selectedOrder)}
                  className="bg-emerald-600 hover:bg-emerald-705 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              )}

              {(selectedOrder.status === 'Ordered' || selectedOrder.status === 'Partially Received') && (
                <button
                  onClick={handleOpenReceiveModal}
                  className="bg-blue-600 hover:bg-blue-705 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Receive Inventory</span>
                </button>
              )}

              {selectedOrder.status !== 'Draft' && selectedOrder.status !== 'Cancelled' && (
                <button
                  onClick={handleOpenReturnModal}
                  className="bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Return Stock</span>
                </button>
              )}

              <button
                onClick={() => handleDownloadPDF(selectedOrder)}
                className="bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-650 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={() => handleDuplicate(selectedOrder.id)}
                className="bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-650 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
            </div>
          </div>

          {/* Alert if payment is overdue */}
          {overdueList.some(item => item.id === selectedOrder.id) && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 p-4 rounded-xl flex items-center justify-between text-red-800 dark:text-red-300">
              <div className="flex items-center space-x-2 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>
                  This invoice is overdue by{' '}
                  {overdueList.find(i => i.id === selectedOrder.id)?.daysOverdue} days! Outstanding amount:
                  Rs. {selectedOrder.remainingBalance.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleOpenPaymentModal(selectedOrder)}
                className="bg-red-650 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
              >
                Pay Outstanding
              </button>
            </div>
          )}

          {/* Details layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Items, Payments History, Return History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product items table card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Procurement Items Summary</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-gray-700 border-b border-slate-100 dark:border-gray-700 text-slate-600 dark:text-gray-300 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Product Name</th>
                        <th className="px-6 py-3">Cost Price</th>
                        <th className="px-6 py-3 text-center">Ordered</th>
                        <th className="px-6 py-3 text-center">Received</th>
                        <th className="px-6 py-3 text-center">Returned</th>
                        <th className="px-6 py-3 text-center">Pending</th>
                        <th className="px-6 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-700/60 text-slate-700 dark:text-gray-300">
                      {selectedOrder.items.map(item => {
                        const pending = Math.max(0, item.quantity - item.receivedQty);
                        const subtotal = item.quantity * item.costPrice;
                        return (
                          <tr key={item.productId} className="hover:bg-slate-55/30 dark:hover:bg-gray-800/40">
                            <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">
                              {item.productName}
                            </td>
                            <td className="px-6 py-3">Rs. {item.costPrice.toFixed(2)}</td>
                            <td className="px-6 py-3 text-center font-medium">{item.quantity}</td>
                            <td className="px-6 py-3 text-center text-green-605 font-bold">
                              {item.receivedQty}
                            </td>
                            <td className="px-6 py-3 text-center text-rose-600 font-bold">
                              {item.returnedQty || 0}
                            </td>
                            <td
                              className={`px-6 py-3 text-center font-medium ${
                                pending > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                              }`}
                            >
                              {pending}
                            </td>
                            <td className="px-6 py-3 text-right font-bold text-slate-950 dark:text-white">
                              Rs. {subtotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Timeline / History */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-gray-700 pb-2">
                  Payment History Timeline
                </h3>

                {selectedOrder.paymentsHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No payments recorded against this PO.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedOrder.paymentsHistory.map((pm, idx) => (
                      <div
                        key={pm.id}
                        className="bg-slate-50 dark:bg-gray-700/50 p-4 rounded-xl border border-slate-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-white">
                            <span>Payment #{selectedOrder.paymentsHistory.length - idx}</span>
                            <span className="bg-green-105 text-green-800 dark:bg-green-950 dark:text-green-400 px-2 py-0.5 rounded text-[10px]">
                              {pm.method}
                            </span>
                          </div>
                          <div className="text-slate-550">
                            Date: {pm.date} | Ref: {pm.reference || 'N/A'}
                          </div>
                          {pm.notes && <div className="text-slate-600 dark:text-slate-350 italic">"{pm.notes}"</div>}
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-green-655 block text-sm">
                            +Rs. {pm.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Return History */}
              {selectedOrder.returnsHistory && selectedOrder.returnsHistory.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-gray-700 pb-2">
                    Purchase Returns Audit
                  </h3>

                  <div className="space-y-4">
                    {selectedOrder.returnsHistory.map((ret, rIdx) => (
                      <div
                        key={ret.id}
                        className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/40 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-655 dark:text-slate-300">
                          <span>Return Batch #{selectedOrder.returnsHistory.length - rIdx}</span>
                          <span>{ret.returnedAt.split('T')[0]}</span>
                        </div>

                        <div className="divide-y divide-red-100 dark:divide-red-950">
                          {ret.items.map(rit => (
                            <div key={rit.productId} className="py-1 flex justify-between text-slate-705 dark:text-slate-300">
                              <span>{rit.productName}</span>
                              <span className="font-bold text-rose-600">Qty Returned: -{rit.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {ret.reason && (
                          <div className="text-[11px] text-slate-500 italic bg-white dark:bg-gray-850 p-2 rounded">
                            <span className="font-bold block text-[10px] text-slate-400">Reason:</span>
                            {ret.reason}
                          </div>
                        )}
                        <div className="text-right text-rose-600 font-bold border-t border-red-100 dark:border-red-900/20 pt-1">
                          Total Value Deducted: Rs. {ret.totalRefundAmount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Supplier Info & Payment Card */}
            <div className="space-y-6">
              {/* Supplier Info */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-gray-700 pb-2">
                  Supplier Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300">
                    <User className="w-4.5 h-4.5 text-slate-400" />
                    <span className="font-semibold">{selectedOrder.supplierName}</span>
                  </div>

                  {suppliers.find(s => s.id === selectedOrder.supplierId)?.phone && (
                    <div className="flex items-center space-x-2.5 text-slate-600 dark:text-gray-400">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{suppliers.find(s => s.id === selectedOrder.supplierId)?.phone}</span>
                    </div>
                  )}

                  {suppliers.find(s => s.id === selectedOrder.supplierId)?.email && (
                    <div className="flex items-center space-x-2.5 text-slate-600 dark:text-gray-400">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{suppliers.find(s => s.id === selectedOrder.supplierId)?.email}</span>
                    </div>
                  )}

                  {suppliers.find(s => s.id === selectedOrder.supplierId)?.address && (
                    <div className="flex items-start space-x-2.5 text-slate-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{suppliers.find(s => s.id === selectedOrder.supplierId)?.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200/80 dark:border-gray-700 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-gray-700 pb-2">
                  Procurement Summary Card
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-gray-400">
                    <span>Items Subtotal:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      Rs.{' '}
                      {selectedOrder.items
                        .reduce((sum, item) => sum + item.quantity * item.costPrice, 0)
                        .toLocaleString()}
                    </span>
                  </div>

                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-gray-400">
                      <span>Discounts:</span>
                      <span className="font-medium text-green-600">
                        -Rs. {selectedOrder.discount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedOrder.tax > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-gray-400">
                      <span>Tax Amount:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        +Rs. {selectedOrder.tax.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedOrder.shippingCost > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-gray-400">
                      <span>Shipping Fee:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        Rs. {selectedOrder.shippingCost.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedOrder.additionalCharges > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-gray-400">
                      <span>Additional Charges:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        Rs. {selectedOrder.additionalCharges.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-100 dark:border-gray-700 my-2 pt-2.5 flex justify-between font-bold text-slate-900 dark:text-white text-base">
                    <span>Grand Total:</span>
                    <span>Rs. {selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>

                  {selectedOrder.totalReturnedAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Returned Deductions:</span>
                      <span>-Rs. {selectedOrder.totalReturnedAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-650 dark:text-gray-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-205">Total Paid:</span>
                    <span className="font-bold text-green-605">
                      Rs. {selectedOrder.amountPaid.toLocaleString()}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 dark:border-gray-700 my-1 pt-2 flex justify-between font-bold text-rose-600 dark:text-rose-455">
                    <span>Outstanding Balance:</span>
                    <span>Rs. {selectedOrder.remainingBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* RECEIVE INVENTORY MODAL */}
      {/* ──────────────────────────────────────────────────────── */}
      {showReceiveModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-gray-700 shadow-xl overflow-hidden font-sans">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Receive Stock: {selectedOrder.purchaseNumber}
              </h3>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-655 rounded-lg p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-slate-505">
                Specify quantities received in this shipment batch.
              </p>

              <div className="divide-y divide-slate-100 dark:divide-gray-700">
                {selectedOrder.items.map(item => {
                  const pending = Math.max(0, item.quantity - item.receivedQty);
                  return (
                    <div key={item.productId} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-slate-805 dark:text-white block text-sm">
                          {item.productName}
                        </span>
                        <span className="text-slate-400 block text-xs">
                          Ordered: {item.quantity} | Received: {item.receivedQty}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 font-semibold">Qty to Receive:</span>
                        <input
                          type="number"
                          min={0}
                          max={pending}
                          value={receiveQtys[item.productId] ?? 0}
                          onChange={e => {
                            const val = Math.min(pending, Math.max(0, Number(e.target.value)));
                            setReceiveQtys({
                              ...receiveQtys,
                              [item.productId]: val
                            });
                          }}
                          className="w-20 px-2 py-1 text-sm text-center border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-950 dark:text-white outline-none font-bold"
                        />
                        <button
                          onClick={() => {
                            setReceiveQtys({
                              ...receiveQtys,
                              [item.productId]: pending
                            });
                          }}
                          className="bg-slate-100 hover:bg-slate-205 dark:bg-gray-700 text-slate-700 dark:text-slate-350 text-xs px-2.5 py-1 rounded-lg font-semibold"
                        >
                          All
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-300 mb-1">
                  Receiving Notes
                </label>
                <textarea
                  rows={2}
                  value={receiveNotes}
                  onChange={e => setReceiveNotes(e.target.value)}
                  placeholder="e.g. Delivery batch 1, verified..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-950 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-55 dark:bg-gray-700/30 border-t border-slate-100 dark:border-gray-700 flex justify-end space-x-2">
              <button
                onClick={() => setShowReceiveModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-gray-600 text-slate-655 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-gray-750"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReceive}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-705 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Confirm Receipt &amp; Stock Levels
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* RECORD PAYMENT MODAL */}
      {/* ──────────────────────────────────────────────────────── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-gray-700 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Supplier Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-605 dark:text-gray-300 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-605 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Debit/Credit Card</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Mobile Wallet">Mobile Wallet (EasyPaisa/JazzCash)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-605 dark:text-gray-300 mb-1">
                  Reference / Transaction Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank receipt#, cheque number..."
                  value={payReference}
                  onChange={e => setPayReference(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-605 dark:text-gray-300 mb-1">
                  Amount Paid (PKR)
                </label>
                <input
                  type="number"
                  min={1}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-605 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="Payment remarks..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-gray-650 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-950 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-gray-700/30 border-t border-slate-100 dark:border-gray-700 flex justify-end space-x-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-gray-600 text-slate-655 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-gray-750"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-705 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* PURCHASE RETURNS MODAL */}
      {/* ──────────────────────────────────────────────────────── */}
      {showReturnModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-gray-700 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Log Purchase Return: {selectedOrder.purchaseNumber}
              </h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-slate-500">
                Specify quantities to return to supplier.
              </p>

              <div className="divide-y divide-slate-100 dark:divide-gray-700">
                {selectedOrder.items.map(item => {
                  const availableToReturn = Math.max(0, item.receivedQty - item.returnedQty);
                  return (
                    <div key={item.productId} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-white block text-sm">
                          {item.productName}
                        </span>
                        <span className="text-slate-400 block text-xs">
                          Received: {item.receivedQty} | Returned: {item.returnedQty}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-505 font-semibold">Qty to Return:</span>
                        <input
                          type="number"
                          min={0}
                          max={availableToReturn}
                          value={returnQtys[item.productId] ?? 0}
                          onChange={e => {
                            const val = Math.min(availableToReturn, Math.max(0, Number(e.target.value)));
                            setReturnQtys({
                              ...returnQtys,
                              [item.productId]: val
                            });
                          }}
                          className="w-20 px-2 py-1 text-sm text-center border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-955 dark:text-white outline-none font-bold"
                        />
                        <button
                          onClick={() => {
                            setReturnQtys({
                              ...returnQtys,
                              [item.productId]: availableToReturn
                            });
                          }}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-gray-705 text-slate-700 dark:text-slate-350 text-xs px-2.5 py-1 rounded-lg font-semibold"
                        >
                          All
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-305 mb-1">
                  Reason for Return
                </label>
                <textarea
                  rows={2}
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder="e.g. Products damaged..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-gray-600 rounded-lg bg-slate-50 dark:bg-gray-700 text-slate-950 dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-gray-700/30 border-t border-slate-100 dark:border-gray-700 flex justify-end space-x-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-gray-600 text-slate-655 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-gray-750"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-705 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Confirm Return &amp; Adjust Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
