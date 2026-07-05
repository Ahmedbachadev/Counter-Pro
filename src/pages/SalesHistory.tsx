import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Eye, Receipt, Printer, Calendar, DollarSign, User, Download, Filter, 
  CreditCard as Edit2, Trash2, ArrowLeft, AlertCircle, CheckCircle2, 
  TrendingUp, BarChart3, Clock, Settings, Coins, Users, ShoppingBag, Award, 
  ShieldAlert, Sparkles, History, ChevronLeft, ChevronRight, X, Phone, Check, RefreshCw,
  TrendingDown, Percent, ArrowUpRight, FileText, ShoppingCart, Undo2, RotateCcw
} from 'lucide-react';
import { usePOSStore, Sale, SaleItem, PaymentMethod } from '../stores/posStore';
import { useCustomerStore } from '../stores/customersStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useInventoryStore, Product } from '../stores/inventoryStore';
import { useReturnsStore, ReturnRecord, ReturnItem, ExchangeItem } from '../stores/returnsStore';
import { useExpensesStore } from '../stores/expensesStore';
import { generatePDFReceipt } from '../utils/pdfReceiptGenerator';
import { generateUrduHtmlReceipt } from '../utils/urduHtmlReceiptGenerator';
import { generatePDFReturnReceipt } from '../utils/pdfReturnReceiptGenerator';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';
import EmptyState from '../components/EmptyState';
import DetailPageLayout from '../components/DetailPageLayout';
import { format, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import EditSaleModal from '../components/EditSaleModal';
import { inventoryService } from '../services/inventoryService';

const ITEMS_PER_PAGE = 10;

const SalesHistory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigate = useNavigate();

  // Stores
  const { sales, updateSale, deleteSale } = usePOSStore();
  const { getCustomerById } = useCustomerStore();
  const { settings } = useSettingsStore();
  const { products, categories } = useInventoryStore();
  const { returns, initializeReturns, addReturn } = useReturnsStore();
  const { expenses, initializeFromDatabase: initializeExpenses } = useExpensesStore();

  useEffect(() => {
    initializeReturns();
    initializeExpenses();
  }, [initializeReturns, initializeExpenses]);

  // Main navigation tabs: 'dashboard' | 'invoices' | 'breakdowns' | 'profit_margins' | 'payments'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'breakdowns' | 'profit_margins' | 'payments'>('dashboard');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'All' | 'Fully Paid' | 'Partially Paid' | 'Credit Sale'>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'All' | 'walk-in' | 'registered'>('All');

  // Interactive Chart Sub-Selection: 'revenue' | 'orders' | 'categories' | 'products' | 'customers' | 'payment_methods'
  const [activeChart, setActiveChart] = useState<'revenue' | 'orders' | 'categories' | 'products' | 'customers' | 'payment_methods'>('revenue');

  // Revenue Grouping Period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  const [breakdownGrouping, setBreakdownGrouping] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('day');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Selection States
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedCustomerForReceipt, setSelectedCustomerForReceipt] = useState<any>(null);

  // Payment Collection Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'mobile_wallet' | 'other'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Export Reports Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'summary' | 'revenue' | 'profit' | 'tax' | 'payment' | 'customer'>('summary');

  // --- RETURN & EXCHANGE WIZARD STATE ---
  const [showReturnWizard, setShowReturnWizard] = useState(false);
  const [wizardSale, setWizardSale] = useState<Sale | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardQuantities, setWizardQuantities] = useState<Record<number, number>>({});
  const [wizardReasons, setWizardReasons] = useState<Record<number, string>>({});
  const [wizardConditions, setWizardConditions] = useState<Record<number, 'Resellable' | 'Damaged' | 'Expired' | 'Other'>>({});
  const [wizardMode, setWizardMode] = useState<'return' | 'exchange'>('return');
  const [wizardRefundMethod, setWizardRefundMethod] = useState<PaymentMethod>('cash');
  const [wizardNotes, setWizardNotes] = useState('');
  const [wizardExchangeSearch, setWizardExchangeSearch] = useState('');
  const [wizardExchangeCart, setWizardExchangeCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [isProcessingWizard, setIsProcessingWizard] = useState(false);

  // --- Helper: Outstanding Aging (in Days) ---
  const getDaysElapsed = (createdAt: Date | string) => {
    const saleDate = new Date(createdAt);
    const today = new Date();
    const diffTime = today.getTime() - saleDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // --- Helper: Get Product Purchase Cost (COGS) ---
  const getProductCost = (item: any) => {
    if (item.product?.cost !== undefined && item.product?.cost !== null) {
      return item.product.cost;
    }
    const invProd = products.find(p => p.id === item.productId || p.id === (item.product as any)?.id);
    if (invProd) {
      return invProd.cost;
    }
    return (item.product?.price || item.productPrice || 0) * 0.7; // default 30% margin markup fallback
  };

  // --- Helper: Get Past Returned Quantities for an Item on a Sale ---
  const getItemReturnedQty = (saleId: number, productId: number) => {
    let returned = 0;
    returns.forEach(r => {
      if (r.originalSaleId === saleId) {
        r.items.forEach(item => {
          if (item.productId === productId) {
            returned += item.quantity;
          }
        });
      }
    });
    return returned;
  };

  // --- Filtered Sales Subset (Based on Filter Bar Options) ---
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const customer = sale.customerId ? getCustomerById(sale.customerId) : null;
      
      // Text Search
      const matchesSearch = sale.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.cashierId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer && customer.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Date Range Filter
      let matchesDateRange = true;
      if (startDate || endDate) {
        const saleDate = new Date(sale.createdAt);
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate + 'T23:59:59');
          matchesDateRange = isWithinInterval(saleDate, { start, end });
        } else if (startDate) {
          const start = new Date(startDate);
          matchesDateRange = saleDate >= start;
        } else if (endDate) {
          const end = new Date(endDate + 'T23:59:59');
          matchesDateRange = saleDate <= end;
        }
      }

      // Payment Status
      let matchesStatus = true;
      if (paymentStatusFilter !== 'All') {
        if (paymentStatusFilter === 'Fully Paid') {
          matchesStatus = sale.dueAmount === 0;
        } else if (paymentStatusFilter === 'Partially Paid') {
          matchesStatus = sale.dueAmount > 0 && sale.amountPaid > 0;
        } else if (paymentStatusFilter === 'Credit Sale') {
          matchesStatus = sale.dueAmount > 0 && sale.amountPaid === 0;
        }
      }

      // Payment Method
      let matchesMethod = true;
      if (paymentMethodFilter !== 'All') {
        matchesMethod = sale.paymentMethod === paymentMethodFilter;
      }

      // Customer Type
      let matchesCustomerType = true;
      if (customerTypeFilter !== 'All') {
        if (customerTypeFilter === 'walk-in') {
          matchesCustomerType = !sale.customerId;
        } else if (customerTypeFilter === 'registered') {
          matchesCustomerType = !!sale.customerId;
        }
      }

      return matchesSearch && matchesDateRange && matchesStatus && matchesMethod && matchesCustomerType;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sales, searchTerm, startDate, endDate, paymentStatusFilter, paymentMethodFilter, customerTypeFilter, getCustomerById]);

  // --- Financial Dashboard Analytics ---
  const dashboardStats = useMemo(() => {
    let revenue = 0;
    let paid = 0;
    let due = 0;
    let discount = 0;
    let tax = 0;
    let cogs = 0;

    // Timeframe stats
    let todaySales = 0;
    let weeklySales = 0;
    let monthlySales = 0;
    let annualSales = 0;

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    filteredSales.forEach(s => {
      revenue += s.finalAmount;
      due += s.dueAmount;
      paid += (s.finalAmount - s.dueAmount);
      discount += s.discount;
      tax += s.tax;

      // Calculate COGS for Gross Profit
      s.items.forEach(item => {
        cogs += getProductCost(item) * item.quantity;
      });

      // Periodic calculations
      const sDate = new Date(s.createdAt);
      const sDateStr = format(sDate, 'yyyy-MM-dd');
      
      if (sDateStr === todayStr) {
        todaySales += s.finalAmount;
      }
      if (sDate >= weekStart && sDate <= weekEnd) {
        weeklySales += s.finalAmount;
      }
      if (sDate >= monthStart && sDate <= monthEnd) {
        monthlySales += s.finalAmount;
      }
      if (sDate >= yearStart && sDate <= yearEnd) {
        annualSales += s.finalAmount;
      }
    });

    const netRevenue = revenue - tax;
    const grossProfit = netRevenue - cogs;
    const profitMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    return {
      revenue,
      netRevenue,
      grossProfit,
      cogs,
      profitMargin,
      paid,
      due,
      discount,
      tax,
      count: filteredSales.length,
      avgValue: filteredSales.length > 0 ? revenue / filteredSales.length : 0,
      todaySales,
      weeklySales,
      monthlySales,
      annualSales
    };
  }, [filteredSales, products]);

  // --- Refunds & Returns calculation in timeframe ---
  const returnsStats = useMemo(() => {
    let refundAmount = 0;
    let returnCount = 0;

    returns.forEach(r => {
      const rDate = new Date(r.createdAt);
      let matchesDate = true;
      if (startDate || endDate) {
        if (startDate && endDate) {
          matchesDate = isWithinInterval(rDate, { start: new Date(startDate), end: new Date(endDate + 'T23:59:59') });
        } else if (startDate) {
          matchesDate = rDate >= new Date(startDate);
        } else if (endDate) {
          matchesDate = rDate <= new Date(endDate + 'T23:59:59');
        }
      }
      if (matchesDate) {
        refundAmount += r.netRefund;
        returnCount += 1;
      }
    });

    const refundRate = dashboardStats.revenue > 0 ? (refundAmount / dashboardStats.revenue) * 100 : 0;
    const returnRate = filteredSales.length > 0 ? (returnCount / filteredSales.length) * 100 : 0;

    return {
      refundAmount,
      returnCount,
      refundRate,
      returnRate
    };
  }, [returns, filteredSales, dashboardStats.revenue, startDate, endDate]);

  // --- Operational Net Profit Calculation (Less Expenses) ---
  const estimatedNetProfit = useMemo(() => {
    let totalExpenses = 0;
    expenses.forEach(e => {
      const eDate = new Date(e.createdAt);
      let matches = true;
      if (startDate || endDate) {
        if (startDate && endDate) {
          matches = isWithinInterval(eDate, { start: new Date(startDate), end: new Date(endDate + 'T23:59:59') });
        } else if (startDate) {
          matches = eDate >= new Date(startDate);
        } else if (endDate) {
          matches = eDate <= new Date(endDate + 'T23:59:59');
        }
      }
      if (matches) {
        totalExpenses += e.amount;
      }
    });
    return Math.max(-totalExpenses, dashboardStats.grossProfit - totalExpenses);
  }, [expenses, dashboardStats.grossProfit, startDate, endDate]);

  // --- Daily Sales Trend for the Last 7 Days (Visual Charts) ---
  const salesTrendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, 'yyyy-MM-dd');
    }).reverse();

    return days.map(dateStr => {
      const daySales = filteredSales.filter(s => format(new Date(s.createdAt), 'yyyy-MM-dd') === dateStr);
      const revenue = daySales.reduce((sum, s) => sum + s.finalAmount, 0);
      
      let dayCogs = 0;
      daySales.forEach(s => {
        s.items.forEach(item => {
          dayCogs += getProductCost(item) * item.quantity;
        });
      });
      const profit = Math.max(0, revenue - dayCogs);

      return {
        date: format(new Date(dateStr + 'T00:00:00'), 'MMM dd'),
        revenue,
        profit,
        orders: daySales.length
      };
    });
  }, [filteredSales, products]);

  const maxTrendRevenue = useMemo(() => {
    return Math.max(...salesTrendData.map(d => Math.max(d.revenue, d.profit)), 1000);
  }, [salesTrendData]);

  // --- Product Growth Trends (Fastest Growing vs Slowest) ---
  const fastestGrowingProducts = useMemo(() => {
    const today = new Date();
    const past7DaysStart = new Date();
    past7DaysStart.setDate(today.getDate() - 7);
    
    const prior7DaysStart = new Date();
    prior7DaysStart.setDate(today.getDate() - 14);

    const currentQuantities: Record<number, number> = {};
    const priorQuantities: Record<number, number> = {};

    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.createdAt);
      if (saleDate >= past7DaysStart && saleDate <= today) {
        sale.items.forEach(item => {
          const id = item.productId || item.product?.id;
          if (id) currentQuantities[id] = (currentQuantities[id] || 0) + item.quantity;
        });
      } else if (saleDate >= prior7DaysStart && saleDate < past7DaysStart) {
        sale.items.forEach(item => {
          const id = item.productId || item.product?.id;
          if (id) priorQuantities[id] = (priorQuantities[id] || 0) + item.quantity;
        });
      }
    });

    return products.map(prod => {
      const cur = currentQuantities[prod.id] || 0;
      const pri = priorQuantities[prod.id] || 0;
      let growth = 0;
      if (pri > 0) {
        growth = ((cur - pri) / pri) * 100;
      } else if (cur > 0) {
        growth = 100;
      }
      return {
        id: prod.id,
        name: prod.name,
        currentSales: cur,
        priorSales: pri,
        growth
      };
    }).filter(p => p.currentSales > 0 || p.priorSales > 0)
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5);
  }, [filteredSales, products]);

  // --- Worst Selling Products ---
  const worstSellingProducts = useMemo(() => {
    const quantities: Record<number, number> = {};
    products.forEach(p => {
      quantities[p.id] = 0;
    });

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const id = item.productId || item.product?.id;
        if (id !== undefined && quantities[id] !== undefined) {
          quantities[id] += item.quantity;
        }
      });
    });

    return products
      .map(p => ({ id: p.id, name: p.name, qtySold: quantities[p.id] || 0 }))
      .sort((a, b) => a.qtySold - b.qtySold)
      .slice(0, 5);
  }, [filteredSales, products]);

  // --- Top Customers ---
  const topValuableCustomers = useMemo(() => {
    const custSpending: Record<number, { name: string; email?: string; phone?: string; totalSpent: number; count: number }> = {};
    filteredSales.forEach(sale => {
      if (sale.customerId) {
        const cust = getCustomerById(sale.customerId);
        if (cust) {
          if (!custSpending[sale.customerId]) {
            custSpending[sale.customerId] = {
              name: cust.name,
              email: cust.email,
              phone: cust.phone,
              totalSpent: 0,
              count: 0
            };
          }
          custSpending[sale.customerId].totalSpent += sale.finalAmount;
          custSpending[sale.customerId].count += 1;
        }
      }
    });
    return Object.values(custSpending).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, [filteredSales, getCustomerById]);

  // --- Sales Rank By Product & Category ---
  const productRankList = useMemo(() => {
    const stats: Record<string, { name: string; qty: number; revenue: number; cost: number; profit: number }> = {};
    filteredSales.forEach(s => {
      s.items.forEach(item => {
        const prodId = item.productId?.toString() || item.product?.id?.toString() || item.productName || 'Unknown';
        const name = item.productName || item.product?.name || 'Unknown Product';
        const cost = getProductCost(item) * item.quantity;
        const rev = item.subtotal;
        
        if (!stats[prodId]) {
          stats[prodId] = { name, qty: 0, revenue: 0, cost: 0, profit: 0 };
        }
        stats[prodId].qty += item.quantity;
        stats[prodId].revenue += rev;
        stats[prodId].cost += cost;
        stats[prodId].profit += (rev - cost);
      });
    });
    return Object.entries(stats).map(([id, d]) => ({
      id,
      name: d.name,
      qty: d.qty,
      revenue: d.revenue,
      profit: d.profit,
      margin: d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products]);

  const categoryRankList = useMemo(() => {
    const stats: Record<string, { name: string; qty: number; revenue: number; cost: number; profit: number }> = {};
    filteredSales.forEach(s => {
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.id === (item.product as any)?.id);
        const catId = prod?.categoryId || 0;
        const catName = categories.find(c => c.id === catId)?.name || (isUrdu ? 'غیر زمرہ بند' : 'Uncategorized');
        const cost = getProductCost(item) * item.quantity;
        const rev = item.subtotal;

        if (!stats[catId]) {
          stats[catId] = { name: catName, qty: 0, revenue: 0, cost: 0, profit: 0 };
        }
        stats[catId].qty += item.quantity;
        stats[catId].revenue += rev;
        stats[catId].cost += cost;
        stats[catId].profit += (rev - cost);
      });
    });
    return Object.entries(stats).map(([id, d]) => ({
      id,
      name: d.name,
      qty: d.qty,
      revenue: d.revenue,
      profit: d.profit,
      margin: d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products, categories]);

  // --- Payment Breakdown Analysis ---
  const paymentMethodStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const amounts: Record<string, number> = {};
    const dueAmounts: Record<string, number> = {};

    filteredSales.forEach(s => {
      const method = s.paymentMethod || 'other';
      counts[method] = (counts[method] || 0) + 1;
      amounts[method] = (amounts[method] || 0) + s.finalAmount;
      dueAmounts[method] = (dueAmounts[method] || 0) + s.dueAmount;
    });

    return Object.keys(counts).map(method => ({
      method,
      count: counts[method],
      amount: amounts[method],
      due: dueAmounts[method]
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredSales]);

  // --- Credit Ledger Lists (Owed Sales) ---
  const outstandingCreditSales = useMemo(() => {
    return filteredSales
      .filter(s => s.dueAmount > 0)
      .map(s => {
        const customer = s.customerId ? getCustomerById(s.customerId) : null;
        const daysElapsed = getDaysElapsed(s.createdAt);
        return {
          ...s,
          customer,
          daysElapsed
        };
      })
      .sort((a, b) => b.dueAmount - a.dueAmount);
  }, [filteredSales, getCustomerById]);

  // --- Previous Returns for the selected Sale Details Modal ---
  const selectedSaleReturns = useMemo(() => {
    if (!selectedSale) return [];
    return returns.filter(r => r.originalSaleId === selectedSale.id);
  }, [selectedSale, returns]);

  // --- Revenue Grouped Period breakdowns ---
  const periodicBreakdownList = useMemo(() => {
    const periodsMap: Record<string, { key: string; count: number; gross: number; tax: number; discount: number; cogs: number }> = {};

    filteredSales.forEach(s => {
      const sDate = new Date(s.createdAt);
      let periodKey = '';

      if (breakdownGrouping === 'day') {
        periodKey = format(sDate, 'yyyy-MM-dd');
      } else if (breakdownGrouping === 'week') {
        const start = format(startOfWeek(sDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        periodKey = `Wk ${format(sDate, 'I')} (${start})`;
      } else if (breakdownGrouping === 'month') {
        periodKey = format(sDate, 'yyyy-MM');
      } else if (breakdownGrouping === 'quarter') {
        const q = Math.ceil((sDate.getMonth() + 1) / 3);
        periodKey = `${sDate.getFullYear()} - Q${q}`;
      } else if (breakdownGrouping === 'year') {
        periodKey = sDate.getFullYear().toString();
      }

      if (!periodsMap[periodKey]) {
        periodsMap[periodKey] = { key: periodKey, count: 0, gross: 0, tax: 0, discount: 0, cogs: 0 };
      }

      const p = periodsMap[periodKey];
      p.count += 1;
      p.gross += s.finalAmount;
      p.tax += s.tax;
      p.discount += s.discount;

      s.items.forEach(item => {
        p.cogs += getProductCost(item) * item.quantity;
      });
    });

    return Object.values(periodsMap).map(p => {
      const net = p.gross - p.tax;
      const profit = net - p.cogs;
      return {
        period: p.key,
        count: p.count,
        gross: p.gross,
        tax: p.tax,
        discount: p.discount,
        net,
        cogs: p.cogs,
        profit,
        margin: net > 0 ? (profit / net) * 100 : 0
      };
    }).sort((a, b) => b.period.localeCompare(a.period));
  }, [filteredSales, breakdownGrouping, products]);

  // Reset list pagination when groupings or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, paymentStatusFilter, paymentMethodFilter, customerTypeFilter, activeTab, breakdownGrouping]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSales.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredSales, currentPage]);

  // --- Print/Receipt Handling ---
  const handlePrintReceipt = (sale: Sale) => {
    const customer = sale.customerId ? getCustomerById(sale.customerId) : undefined;
    setSelectedSaleForReceipt(sale);
    setSelectedCustomerForReceipt(customer);
    setShowReceiptModal(true);
  };

  const handleGenerateEnglishReceipt = () => {
    if (selectedSaleForReceipt) {
      generatePDFReceipt({
        sale: selectedSaleForReceipt,
        customer: selectedCustomerForReceipt,
        shopInfo: settings,
      });
    }
    setShowReceiptModal(false);
    setSelectedSaleForReceipt(null);
    setSelectedCustomerForReceipt(null);
  };

  const handleGenerateUrduReceipt = () => {
    if (selectedSaleForReceipt) {
      generateUrduHtmlReceipt({
        sale: selectedSaleForReceipt,
        customer: selectedCustomerForReceipt,
        shopInfo: settings,
      });
    }
    setShowReceiptModal(false);
    setSelectedSaleForReceipt(null);
    setSelectedCustomerForReceipt(null);
  };

  // --- Delete Sale --
  const handleDeleteSale = async (saleId: number) => {
    if (!window.confirm(isUrdu ? 'کیا آپ واقعی اس فروخت کو حذف کرنا چاہتے ہیں؟ اسے کالعدم نہیں کیا جا سکتا۔' : 'Are you sure you want to delete this sale? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteSale(saleId);
      alert(isUrdu ? 'فروخت کامیابی کے ساتھ حذف ہو گئی!' : 'Sale deleted successfully!');
    } catch (error) {
      alert(isUrdu ? 'فروخت حذف کرنے میں ناکامی!' : 'Failed to delete sale');
      console.error(error);
    }
  };

  // --- Save Edit modal ---
  const handleSaveEdit = async (updates: Partial<any>, items: any[]) => {
    if (!editingSale) return;
    try {
      await updateSale(editingSale.id, updates, items);
      setEditingSale(null);
    } catch (error) {
      console.error(error);
      alert('Failed to update sale');
    }
  };

  // --- Collect Credit Payments ---
  const openCollectPayment = (sale: Sale) => {
    setPaymentSale(sale);
    setPaymentAmount(sale.dueAmount.toString());
    setPaymentMethod('cash');
    setPaymentReference('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleCollectPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSale) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (amount > paymentSale.dueAmount) {
      alert('Payment amount cannot exceed outstanding due balance.');
      return;
    }

    setIsSavingPayment(true);
    try {
      const updatedDue = paymentSale.dueAmount - amount;
      const updatedPaid = paymentSale.amountPaid + amount;
      let updatedStatus: 'Fully Paid' | 'Partially Paid' | 'Credit Sale' = 'Credit Sale';
      if (updatedDue === 0) {
        updatedStatus = 'Fully Paid';
      } else if (updatedDue > 0) {
        updatedStatus = 'Partially Paid';
      }

      const updates: Partial<Sale> = {
        amountPaid: updatedPaid,
        dueAmount: updatedDue,
        paymentStatus: updatedStatus,
      };

      const existingPayments = paymentSale.payments || [];
      updates.payments = [
        ...existingPayments,
        {
          method: paymentMethod,
          amount: amount,
          reference: paymentReference || undefined,
        }
      ];

      await updateSale(paymentSale.id, updates);

      if (paymentSale.customerId) {
        await useCustomerStore.getState().updateCustomerPendingAmount(paymentSale.customerId, -amount);
        await useCustomerStore.getState().addCustomerPayment({
          customerId: paymentSale.customerId,
          amount: amount,
          paymentMethod: paymentMethod,
          reference: paymentReference || '',
          notes: paymentNotes || `Collected payment for POS invoice #${paymentSale.id}`,
        });
      }

      alert('Payment collected successfully!');
      setShowPaymentModal(false);
      setPaymentSale(null);
    } catch (err) {
      console.error(err);
      alert('Failed to record payment');
    } finally {
      setIsSavingPayment(false);
    }
  };

  // --- CSV Export Engine ---
  const handleExportCSVReport = () => {
    let csvHeaders: string[] = [];
    let csvRows: any[][] = [];
    let filename = `report_${selectedReportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`;

    if (selectedReportType === 'summary') {
      csvHeaders = ['Metric Description', 'Valuation / Stats'];
      csvRows = [
        ['Total Sales Count', dashboardStats.count],
        ['Gross Sales Revenue', `Rs. ${dashboardStats.revenue.toFixed(2)}`],
        ['Taxes Collected', `Rs. ${dashboardStats.tax.toFixed(2)}`],
        ['Discounts Availed', `Rs. ${dashboardStats.discount.toFixed(2)}`],
        ['Net Sales Revenue', `Rs. ${dashboardStats.netRevenue.toFixed(2)}`],
        ['Cost of Goods Sold (COGS)', `Rs. ${dashboardStats.cogs.toFixed(2)}`],
        ['Gross Profit', `Rs. ${dashboardStats.grossProfit.toFixed(2)}`],
        ['Profit Margin %', `${dashboardStats.profitMargin.toFixed(2)}%`],
        ['Average Order Value', `Rs. ${dashboardStats.avgValue.toFixed(2)}`],
        ['Refunded Credits', `Rs. ${returnsStats.refundAmount.toFixed(2)}`],
        ['Estimated Net Profit (after Expenses)', `Rs. ${estimatedNetProfit.toFixed(2)}`],
      ];
    } else if (selectedReportType === 'revenue') {
      csvHeaders = ['Date / Interval', 'Invoices Count', 'Gross Revenue', 'Discounts', 'Taxes', 'Net Revenue', 'COGS', 'Gross Profit'];
      csvRows = periodicBreakdownList.map(item => [
        item.period,
        item.count,
        item.gross.toFixed(2),
        item.discount.toFixed(2),
        item.tax.toFixed(2),
        item.net.toFixed(2),
        item.cogs.toFixed(2),
        item.profit.toFixed(2),
      ]);
    } else if (selectedReportType === 'profit') {
      csvHeaders = ['Product Name', 'Quantity Sold', 'Gross Revenue', 'Cost of Goods (COGS)', 'Gross Profit Amount', 'Profit Margin %'];
      csvRows = productRankList.map(item => [
        item.name,
        item.qty,
        item.revenue.toFixed(2),
        (item.revenue - item.profit).toFixed(2),
        item.profit.toFixed(2),
        `${item.margin.toFixed(2)}%`
      ]);
    } else if (selectedReportType === 'tax') {
      csvHeaders = ['Invoice ID', 'Date Created', 'Subtotal', 'Tax Amount Collected', 'Discounts', 'Final Total Paid'];
      csvRows = filteredSales.map(sale => [
        sale.id,
        format(new Date(sale.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        sale.total.toFixed(2),
        sale.tax.toFixed(2),
        sale.discount.toFixed(2),
        sale.finalAmount.toFixed(2)
      ]);
    } else if (selectedReportType === 'payment') {
      csvHeaders = ['Payment Method Type', 'Transactions Count', 'Gross Sales Recorded', 'Outstanding Due Balances'];
      csvRows = paymentMethodStats.map(pm => [
        pm.method.toUpperCase(),
        pm.count,
        pm.amount.toFixed(2),
        pm.due.toFixed(2)
      ]);
    } else if (selectedReportType === 'customer') {
      csvHeaders = ['Customer Name', 'Invoices Completed', 'Gross Purchases Spending', 'Email Contact', 'Phone Contact'];
      csvRows = topValuableCustomers.map(cust => [
        cust.name,
        cust.count,
        cust.totalSpent.toFixed(2),
        cust.email || 'N/A',
        cust.phone || 'N/A'
      ]);
    }

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  // --- Quick Action: Filter Today ---
  const applyTodayFilter = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setStartDate(todayStr);
    setEndDate(todayStr);
    setActiveTab('invoices');
  };

  // --- RETURN / EXCHANGE WIZARD INITIALIZER ---
  const openReturnWizard = (sale: Sale, mode: 'return' | 'exchange' = 'return') => {
    setWizardSale(sale);
    setWizardStep(1);
    setWizardMode(mode);
    setWizardRefundMethod(sale.paymentMethod || 'cash');
    setWizardNotes('');
    setWizardExchangeSearch('');
    setWizardExchangeCart([]);

    // Initialize quantities eligible for return
    const initialQuants: Record<number, number> = {};
    const initialReasons: Record<number, string> = {};
    const initialConditions: Record<number, 'Resellable' | 'Damaged' | 'Expired' | 'Other'> = {};

    sale.items.forEach(item => {
      const pId = item.productId || (item.product ? item.product.id : 0);
      if (pId) {
        initialQuants[pId] = 0;
        initialReasons[pId] = isUrdu ? 'خراب پروڈکٹ' : 'Defective Product';
        initialConditions[pId] = 'Resellable';
      }
    });

    setWizardQuantities(initialQuants);
    setWizardReasons(initialReasons);
    setWizardConditions(initialConditions);
    setShowReturnWizard(true);
  };

  // Update wizard item quantity return stepper
  const handleUpdateWizardQty = (pId: number, change: number, maxQty: number) => {
    const current = wizardQuantities[pId] || 0;
    const next = Math.max(0, Math.min(maxQty, current + change));
    setWizardQuantities(prev => ({ ...prev, [pId]: next }));
  };

  // Live Wizard Math Calculations
  const wizardRefundAmount = useMemo(() => {
    if (!wizardSale) return 0;
    let sum = 0;
    wizardSale.items.forEach(item => {
      const pId = item.productId || (item.product ? item.product.id : 0);
      if (pId) {
        const qty = wizardQuantities[pId] || 0;
        const finalUnitPrice = item.subtotal / (item.quantity || 1); // True final rate
        sum += finalUnitPrice * qty;
      }
    });
    return sum;
  }, [wizardSale, wizardQuantities]);

  const wizardExchangeAmount = useMemo(() => {
    return wizardExchangeCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [wizardExchangeCart]);

  const wizardNetRefund = useMemo(() => {
    return wizardRefundAmount - wizardExchangeAmount;
  }, [wizardRefundAmount, wizardExchangeAmount]);

  // Exchange suggestions lookup
  const filteredExchangeSuggestions = useMemo(() => {
    const q = wizardExchangeSearch.toLowerCase().trim();
    if (!q) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.barcode && p.barcode.includes(q))
    ).slice(0, 5);
  }, [products, wizardExchangeSearch]);

  const handleAddWizardExchangeProduct = (product: Product) => {
    if (product.stock <= 0) {
      alert(`${product.name} is out of stock.`);
      return;
    }
    const exists = wizardExchangeCart.find(item => item.product.id === product.id);
    if (exists) {
      if (exists.quantity >= product.stock) {
        alert(`Cannot exceed stock limit of ${product.stock}`);
        return;
      }
      setWizardExchangeCart(prev => prev.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setWizardExchangeCart(prev => [...prev, { product, quantity: 1 }]);
    }
    setWizardExchangeSearch('');
  };

  // Submit Final Return/Exchange from Wizard
  const handleFinalizeReturnWizard = async () => {
    if (!wizardSale) return;

    // Build active return items
    const activeReturnItems: ReturnItem[] = [];
    wizardSale.items.forEach(item => {
      const pId = item.productId || (item.product ? item.product.id : 0);
      if (pId) {
        const qty = wizardQuantities[pId] || 0;
        if (qty > 0) {
          activeReturnItems.push({
            productId: pId,
            productName: item.productName || item.product?.name || 'Unknown Item',
            quantity: qty,
            price: item.productPrice || item.product?.price || 0,
            reason: wizardReasons[pId] || 'Defective Product',
            condition: wizardConditions[pId] || 'Resellable'
          });
        }
      }
    });

    if (activeReturnItems.length === 0) {
      alert('Please select at least one item to return.');
      return;
    }

    const activeExchangeItems: ExchangeItem[] = wizardExchangeCart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    }));

    setIsProcessingWizard(true);
    try {
      const customer = wizardSale.customerId ? getCustomerById(wizardSale.customerId) : null;
      
      // 1. Add return record to Returns store
      const record = await addReturn({
        originalSaleId: wizardSale.id,
        customerId: wizardSale.customerId,
        customerName: customer ? customer.name : 'Walk-In Customer',
        items: activeReturnItems,
        exchangeItems: activeExchangeItems,
        refundAmount: wizardRefundAmount,
        exchangeAmount: wizardExchangeAmount,
        netRefund: wizardNetRefund,
        paymentMethod: wizardRefundMethod,
        cashierId: 'admin',
        notes: wizardNotes
      });

      // 2. Transactional stock audits: Log detailed stock movements
      // Restocked returns
      for (const item of activeReturnItems) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          await inventoryService.addStockMovement(
            item.productId,
            item.productName,
            item.condition === 'Resellable' ? 'Return (Restocked)' : 'Return (Defective)',
            prod.stock,
            item.quantity,
            prod.stock + (item.condition === 'Resellable' ? item.quantity : 0),
            record.id,
            `Returned from sale #${wizardSale.id}`
          );
        }
      }

      // Exchanged items
      for (const item of activeExchangeItems) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          await inventoryService.addStockMovement(
            item.productId,
            item.productName,
            'Exchange Payout',
            prod.stock,
            -item.quantity,
            prod.stock - item.quantity,
            record.id,
            `Exchanged from sale #${wizardSale.id}`
          );
        }
      }

      // 3. Update original sale's notes to log return record
      const returnSummaryText = `\n[Return processed: ${record.id} on ${format(new Date(), 'yyyy-MM-dd HH:mm')} - Refund Amount: Rs. ${record.refundAmount.toFixed(2)}]`;
      const currentNotes = wizardSale.notes || '';
      await updateSale(wizardSale.id, {
        notes: currentNotes + returnSummaryText
      });

      // 4. Update customer purchase ledger if customer is linked
      if (wizardSale.customerId && wizardNetRefund !== 0) {
        await useCustomerStore.getState().addCustomerPayment({
          customerId: wizardSale.customerId,
          amount: -wizardNetRefund, // negative represents outflow payout, positive is inflow payment
          paymentMethod: wizardRefundMethod,
          reference: record.id,
          notes: `Return & Exchange ledger adjustment difference for Invoice #${wizardSale.id} (Return ID: ${record.id})`,
        });
      }

      // Automatically generate print PDF
      setTimeout(() => {
        generatePDFReturnReceipt({
          returnRecord: record,
          shopInfo: {
            name: settings.name,
            address: settings.address,
            phone: settings.phone,
            email: settings.email
          }
        });
      }, 500);

      alert(isUrdu ? 'فروخت واپسی کا عمل کامیابی کے ساتھ مکمل ہو گیا!' : 'Return & Exchange processed successfully!');
      setShowReturnWizard(false);
      setWizardSale(null);
    } catch (e) {
      console.error(e);
      alert('Failed to process return transaction.');
    } finally {
      setIsProcessingWizard(false);
    }
  };

  // --- SVG/CSS Chart Render Options ---
  const renderInteractiveChart = () => {
    if (activeChart === 'revenue') {
      const maxVal = Math.max(...salesTrendData.map(d => Math.max(d.revenue, d.profit)), 1000);
      return (
        <div className="space-y-4">
          <div className="flex gap-3 sm:gap-4 items-end justify-between h-56 px-2 pt-4 border-b border-slate-100 dark:border-gray-800">
            {salesTrendData.map((data, idx) => {
              const revPct = (data.revenue / maxVal) * 80;
              const profitPct = (data.profit / maxVal) * 80;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  <div className="relative w-full flex items-end justify-center gap-1 h-36">
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex bg-slate-900 dark:bg-slate-950 text-white text-xs font-bold rounded-lg py-2 px-3 whitespace-nowrap shadow-xl z-20 border border-slate-700 flex-col gap-0.5">
                      <span className="text-slate-400 font-semibold">{data.date}</span>
                      <span className="text-blue-400">Revenue: Rs. {data.revenue.toLocaleString()}</span>
                      <span className="text-emerald-400">Profit: Rs. {data.profit.toLocaleString()}</span>
                    </div>
                    {/* Revenue Bar */}
                    <div 
                      className="w-3 sm:w-5 bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 rounded-t-sm transition-all duration-300 shadow-sm"
                      style={{ height: `${Math.max(revPct, 4)}%` }}
                    />
                    {/* Profit Bar */}
                    <div 
                      className="w-3 sm:w-5 bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-500 dark:to-emerald-300 rounded-t-sm transition-all duration-300 shadow-sm"
                      style={{ height: `${Math.max(profitPct, 4)}%` }}
                    />
                  </div>
                  <span className="text-[9px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 mt-3 truncate max-w-full">
                    {data.date}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-6 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Gross Profit</span>
            </div>
          </div>
        </div>
      );
    }

    if (activeChart === 'orders') {
      const maxCount = Math.max(...salesTrendData.map(d => d.orders), 5);
      const width = 500;
      const height = 150;
      const padding = 20;

      const points = salesTrendData.map((d, idx) => {
        const x = padding + (idx * (width - 2 * padding)) / (salesTrendData.length - 1);
        const y = height - padding - (d.orders / maxCount) * (height - 2 * padding);
        return { x, y, ...d };
      });

      const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

      return (
        <div className="space-y-4">
          <div className="relative w-full h-44 border-b border-slate-100 dark:border-gray-800">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding + ratio * (height - 2 * padding);
                const val = Math.round(maxCount * (1 - ratio));
                return (
                  <g key={i} className="opacity-15 dark:opacity-10">
                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                    <text x={padding - 5} y={y + 3} fill="currentColor" fontSize="8" textAnchor="end" fontWeight="bold">{val}</text>
                  </g>
                );
              })}

              <path
                d={pathData}
                fill="none"
                stroke="url(#lineChartGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <defs>
                <linearGradient id="lineChartGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>

              {points.map((p, idx) => (
                <g key={idx} className="group/dot cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    className="fill-white stroke-blue-500 stroke-[3] hover:r-7 transition-all duration-200"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="10"
                    className="fill-transparent hover:fill-blue-500/10 transition-all duration-200"
                  />
                </g>
              ))}
            </svg>
          </div>
          <div className="flex justify-between px-2 text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 mt-2">
            {salesTrendData.map((d, idx) => (
              <span key={idx}>{d.date} ({d.orders} orders)</span>
            ))}
          </div>
        </div>
      );
    }

    if (activeChart === 'categories') {
      return (
        <div className="space-y-3 pt-3">
          {categoryRankList.slice(0, 5).map((cat, idx) => {
            const pct = dashboardStats.revenue > 0 ? (cat.revenue / dashboardStats.revenue) * 100 : 0;
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-gray-300">
                  <span>{cat.name}</span>
                  <span>Rs. {cat.revenue.toLocaleString()} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {categoryRankList.length === 0 && (
            <p className="text-center text-xs py-8 text-slate-400">{isUrdu ? 'کوئی ڈیٹا نہیں ملا' : 'No sales records found'}</p>
          )}
        </div>
      );
    }

    if (activeChart === 'products') {
      return (
        <div className="space-y-3 pt-3">
          {productRankList.slice(0, 5).map((prod, idx) => {
            const pct = dashboardStats.revenue > 0 ? (prod.revenue / dashboardStats.revenue) * 100 : 0;
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-gray-300">
                  <span className="truncate max-w-xs">{prod.name} (×{prod.qty})</span>
                  <span>Rs. {prod.revenue.toLocaleString()} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {productRankList.length === 0 && (
            <p className="text-center text-xs py-8 text-slate-400">{isUrdu ? 'کوئی ڈیٹا نہیں ملا' : 'No sales records found'}</p>
          )}
        </div>
      );
    }

    if (activeChart === 'customers') {
      return (
        <div className="space-y-3 pt-3">
          {topValuableCustomers.map((cust, idx) => {
            const pct = dashboardStats.revenue > 0 ? (cust.totalSpent / dashboardStats.revenue) * 100 : 0;
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-gray-300">
                  <span>{cust.name} ({cust.count} visits)</span>
                  <span>Rs. {cust.totalSpent.toLocaleString()} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {topValuableCustomers.length === 0 && (
            <p className="text-center text-xs py-8 text-slate-400">{isUrdu ? 'کوئی ڈیٹا نہیں ملا' : 'No registered customer spending'}</p>
          )}
        </div>
      );
    }

    if (activeChart === 'payment_methods') {
      return (
        <div className="space-y-3 pt-3">
          {paymentMethodStats.map((pm, idx) => {
            const pct = dashboardStats.revenue > 0 ? (pm.amount / dashboardStats.revenue) * 100 : 0;
            let color = 'bg-slate-500';
            if (pm.method === 'cash') color = 'bg-emerald-500';
            else if (pm.method === 'card') color = 'bg-blue-500';
            else if (pm.method === 'credit') color = 'bg-rose-500';
            else if (pm.method === 'bank_transfer') color = 'bg-purple-500';
            else if (pm.method === 'mobile_wallet') color = 'bg-amber-500';

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-gray-300">
                  <span className="capitalize">{pm.method.replace('_', ' ')} (×{pm.count})</span>
                  <span>Rs. {pm.amount.toLocaleString()} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-200">
      {/* Standardized Page Header */}
      <PageHeader
        title={isUrdu ? 'ریونیو انٹیلیجنس اور بزنس اینالیٹکس' : 'Revenue Intelligence & Analytics'}
        subtitle={isUrdu ? 'کاروباری آمدنی، منافع، پروڈکٹ کارکردگی اور خریداروں کے رویوں کی رپورٹ' : 'Monitor profitability, analyze margins, and understand transaction breakdowns'}
        icon={BarChart3}
        breadcrumbs={[
          { label: isUrdu ? 'ہوم' : 'Home', onClick: () => window.location.hash = '#/' },
          { label: isUrdu ? 'سیلز کی ہسٹری' : 'Sales History' }
        ]}
        actions={[
          {
            label: isUrdu ? 'رپورٹ برآمد کریں' : 'Export Reports',
            onClick: () => setShowExportModal(true),
            icon: Download,
            variant: 'primary'
          },
          {
            label: isUrdu ? 'فلٹر بار' : 'Filter Bar',
            onClick: () => setShowFilters(!showFilters),
            icon: Filter,
            variant: showFilters ? 'primary' : 'secondary'
          }
        ]}
      />

      {/* Quick Action Shortcuts Panel */}
      <div className="bg-slate-50 dark:bg-gray-800/40 border border-slate-200/60 dark:border-gray-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{isUrdu ? 'فوری کارروائیاں' : 'Quick Actions'}</span>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => navigate('/pos')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{isUrdu ? 'نئی فروخت درج کریں' : 'Create New Sale'}</span>
          </button>

          <button 
            onClick={applyTodayFilter}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-gray-800 dark:border-gray-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
            <span>{isUrdu ? 'آج کی سیلز دیکھیں' : 'View Today\'s Sales'}</span>
          </button>

          <button 
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-gray-800 dark:border-gray-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-500" />
            <span>{isUrdu ? 'رپورٹ حاصل کریں' : 'Export Report'}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('dashboard'); setActiveChart('products'); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-gray-800 dark:border-gray-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            <Award className="h-3.5 w-3.5 text-amber-500" />
            <span>{isUrdu ? 'ٹاپ پروڈکٹس' : 'View Top Products'}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('dashboard'); setActiveChart('customers'); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-gray-800 dark:border-gray-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            <Users className="h-3.5 w-3.5 text-purple-500" />
            <span>{isUrdu ? 'ٹاپ گاہک' : 'View Top Customers'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-gray-800">
        <div className="flex flex-wrap gap-4 md:gap-6">
          {[
            { id: 'dashboard', label: isUrdu ? 'لوح معلومات (ڈیش بورڈ)' : 'Overview Dashboard', icon: BarChart3 },
            { id: 'invoices', label: isUrdu ? 'رسیدیں اور ٹرانزیکشنز' : 'Invoices & Ledger', icon: Receipt },
            { id: 'breakdowns', label: isUrdu ? 'آمدنی کا شیڈول' : 'Revenue Breakdown', icon: Clock },
            { id: 'profit_margins', label: isUrdu ? 'منافع کا تجزیہ' : 'Profit Analysis', icon: TrendingUp },
            { id: 'payments', label: isUrdu ? 'ادائیگی اور بقایا جات' : 'Payment Analytics', icon: Coins }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-sm font-semibold relative transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5 space-y-4 transition-all">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                {isUrdu ? 'شروع کرنے کی تاریخ' : 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                {isUrdu ? 'ختم ہونے کی تاریخ' : 'End Date'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                {isUrdu ? 'ادائیگی کا اسٹیٹس' : 'Payment Status'}
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="All">{isUrdu ? 'تمام' : 'All Statuses'}</option>
                <option value="Fully Paid">{isUrdu ? 'مکمل ادا شدہ' : 'Fully Paid'}</option>
                <option value="Partially Paid">{isUrdu ? 'جزوی ادا شدہ' : 'Partially Paid'}</option>
                <option value="Credit Sale">{isUrdu ? 'قرضہ کی فروخت' : 'Credit Sale (Unpaid)'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                {isUrdu ? 'ادائیگی کا طریقہ' : 'Payment Method'}
              </label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="All">{isUrdu ? 'تمام' : 'All Methods'}</option>
                <option value="cash">{isUrdu ? 'کیش' : 'Cash'}</option>
                <option value="card">{isUrdu ? 'کارڈ' : 'Card'}</option>
                <option value="credit">{isUrdu ? 'کریڈٹ' : 'Credit'}</option>
                <option value="bank_transfer">{isUrdu ? 'بینک ٹرانسفر' : 'Bank Transfer'}</option>
                <option value="mobile_wallet">{isUrdu ? 'موبائل والٹ' : 'Mobile Wallet'}</option>
                <option value="other">{isUrdu ? 'دیگر' : 'Other'}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-gray-700 pt-4">
            <div className="text-xs text-slate-500 dark:text-gray-400">
              {filteredSales.length} {isUrdu ? 'بل ملے۔' : 'transactions match filters'}
            </div>
            
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPaymentStatusFilter('All');
                setPaymentMethodFilter('All');
                setCustomerTypeFilter('All');
                setSearchTerm('');
              }}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
            >
              {isUrdu ? 'صاف کریں' : 'Reset Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Tab content: Overview Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Periodic Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-slate-900 dark:text-white">
            <div className="bg-white dark:bg-gray-800 p-4.5 rounded-2xl border border-slate-200 dark:border-gray-750 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isUrdu ? 'آج کی فروخت' : 'Today\'s Sales'}</span>
              <h4 className="text-lg font-black mt-1">Rs. {dashboardStats.todaySales.toLocaleString()}</h4>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4.5 rounded-2xl border border-slate-200 dark:border-gray-750 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isUrdu ? 'ہفتہ وار فروخت' : 'Weekly Sales'}</span>
              <h4 className="text-lg font-black mt-1">Rs. {dashboardStats.weeklySales.toLocaleString()}</h4>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4.5 rounded-2xl border border-slate-200 dark:border-gray-750 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isUrdu ? 'ماہانہ فروخت' : 'Monthly Sales'}</span>
              <h4 className="text-lg font-black mt-1">Rs. {dashboardStats.monthlySales.toLocaleString()}</h4>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4.5 rounded-2xl border border-slate-200 dark:border-gray-750 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isUrdu ? 'سالانہ فروخت' : 'Annual Sales'}</span>
              <h4 className="text-lg font-black mt-1">Rs. {dashboardStats.annualSales.toLocaleString()}</h4>
            </div>
          </div>

          {/* Core Analytics KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-white">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 shadow-md shadow-blue-500/10">
              <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">{isUrdu ? 'کل مجموعی سیلز' : 'Total Revenue'}</span>
              <h3 className="text-2xl font-black mt-2">Rs. {dashboardStats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-xs text-blue-200 mt-2">{dashboardStats.count} {isUrdu ? 'انائسز' : 'completed transactions'}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl p-5 shadow-md shadow-purple-500/10">
              <span className="text-xs font-semibold text-purple-100 uppercase tracking-wider">{isUrdu ? 'خالص ریونیو (بغیر ٹیکس)' : 'Net Revenue'}</span>
              <h3 className="text-2xl font-black mt-2">Rs. {dashboardStats.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-xs text-purple-200 mt-2">Tax amount: Rs. {dashboardStats.tax.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 shadow-md shadow-emerald-500/10">
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">{isUrdu ? 'مجموعی منافع (Gross Profit)' : 'Gross Profit'}</span>
              <h3 className="text-2xl font-black mt-2">Rs. {dashboardStats.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-xs text-emerald-200 mt-2">{isUrdu ? 'مارجن' : 'Margin'}: {dashboardStats.profitMargin.toFixed(1)}%</p>
            </div>

            <div className="bg-gradient-to-br from-rose-600 to-pink-700 rounded-2xl p-5 shadow-md shadow-rose-500/10">
              <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider">{isUrdu ? 'اوسط بل قیمت' : 'Average Order Value'}</span>
              <h3 className="text-2xl font-black mt-2">Rs. {dashboardStats.avgValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-xs text-rose-200 mt-2">{isUrdu ? 'کل رعایت' : 'Total discounts'}: Rs. {dashboardStats.discount.toLocaleString()}</p>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-gray-700 pb-4 gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span>{isUrdu ? 'انٹرایکٹو بزنس چارٹس' : 'Interactive Analytics Charts'}</span>
              </h3>
              
              <div className="flex flex-wrap gap-1.5 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl">
                {[
                  { id: 'revenue', label: isUrdu ? 'ریونیو ٹرینڈ' : 'Revenue & Profit' },
                  { id: 'orders', label: isUrdu ? 'آرڈرز ہسٹری' : 'Orders Time' },
                  { id: 'categories', label: isUrdu ? 'زمرہ فروخت' : 'Categories' },
                  { id: 'products', label: isUrdu ? 'پروڈکٹس' : 'Products' },
                  { id: 'customers', label: isUrdu ? 'گاہک خرچ' : 'Customers' },
                  { id: 'payment_methods', label: isUrdu ? 'ذرائع ادائیگی' : 'Payments' }
                ].map(chart => (
                  <button
                    key={chart.id}
                    onClick={() => setActiveChart(chart.id as any)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeChart === chart.id 
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {chart.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 min-h-[220px]">
              {renderInteractiveChart()}
            </div>
          </div>

          {/* Business Insights Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Column 1: Best/Worst Selling */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 border-b border-slate-50 dark:border-gray-700 pb-2">
                <Award className="h-4 w-4 text-amber-500" />
                <span>{isUrdu ? 'پروڈکٹ سیلز درجہ بندی' : 'Product Sales Ranks'}</span>
              </h3>
              
              <div className="space-y-3.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{isUrdu ? 'بہترین فروخت ہونے والی' : 'Best Selling Product'}</span>
                  <p className="font-bold text-slate-800 dark:text-white mt-0.5 truncate">{productRankList[0]?.name || 'N/A'}</p>
                  {productRankList[0] && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{productRankList[0].qty} units sold</span>}
                </div>

                <div className="border-t border-dashed border-slate-100 dark:border-gray-800 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{isUrdu ? 'سب سے کم بکنے والی' : 'Worst Selling (Shelf Warmer)'}</span>
                  <p className="font-bold text-slate-800 dark:text-white mt-0.5 truncate">{worstSellingProducts[0]?.name || 'N/A'}</p>
                  {worstSellingProducts[0] && <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{worstSellingProducts[0].qtySold} units sold</span>}
                </div>
              </div>
            </div>

            {/* Column 2: Profitability Highlights */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 border-b border-slate-50 dark:border-gray-700 pb-2">
                <Coins className="h-4 w-4 text-emerald-500" />
                <span>{isUrdu ? 'بزنس مارجنز ہائی لائٹس' : 'Profitability Highlights'}</span>
              </h3>
              
              <div className="space-y-3.5">
                {/* Highest profit */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{isUrdu ? 'سب سے زیادہ منافع بخش پروڈکٹ' : 'Highest Profit Contributor'}</span>
                  {productRankList.length > 0 ? (
                    (() => {
                      const sortedByProfit = [...productRankList].sort((a, b) => b.profit - a.profit);
                      return (
                        <>
                          <p className="font-bold text-slate-800 dark:text-white mt-0.5 truncate">{sortedByProfit[0]?.name}</p>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            Rs. {sortedByProfit[0]?.profit.toFixed(2)} generated ({sortedByProfit[0]?.margin.toFixed(0)}% margin)
                          </span>
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-sm font-bold text-slate-500">N/A</p>
                  )}
                </div>

                {/* Lowest profit */}
                <div className="border-t border-dashed border-slate-100 dark:border-gray-800 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase">{isUrdu ? 'سب سے کم منافع بخش' : 'Lowest Profit Contributor'}</span>
                  {productRankList.length > 0 ? (
                    (() => {
                      const sortedByProfitAsc = [...productRankList].sort((a, b) => a.profit - b.profit);
                      return (
                        <>
                          <p className="font-bold text-slate-800 dark:text-white mt-0.5 truncate">{sortedByProfitAsc[0]?.name}</p>
                          <span className="text-xs text-rose-605 dark:text-rose-400 font-semibold">
                            Rs. {sortedByProfitAsc[0]?.profit.toFixed(2)} generated ({sortedByProfitAsc[0]?.margin.toFixed(0)}% margin)
                          </span>
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-sm font-bold text-slate-500">N/A</p>
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: Growth & Valuable Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 flex items-center gap-1.5 border-b border-slate-50 dark:border-gray-700 pb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span>{isUrdu ? 'کاروباری ترقی و اہم گاہک' : 'Sales Growth & Customers'}</span>
              </h3>
              
              <div className="space-y-3.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase">{isUrdu ? 'تیزی سے بڑھتا ہوا پروڈکٹ' : 'Fastest Growing Product'}</span>
                  {fastestGrowingProducts[0] ? (
                    <>
                      <p className="font-bold text-slate-800 dark:text-white mt-0.5 truncate">{fastestGrowingProducts[0].name}</p>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        +{fastestGrowingProducts[0].growth.toFixed(0)}% sales growth vs last week
                      </span>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-slate-500">N/A</p>
                  )}
                </div>

                <div className="border-t border-dashed border-slate-105 dark:border-gray-800 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase">{isUrdu ? 'سب سے قیمتی گاہک' : 'Most Valuable Customer'}</span>
                  {topValuableCustomers[0] ? (
                    <>
                      <p className="font-bold text-slate-800 dark:text-white mt-0.5 truncate">{topValuableCustomers[0].name}</p>
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold font-bold">
                        Rs. {topValuableCustomers[0].totalSpent.toLocaleString()} total purchases
                      </span>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-slate-500">Walk-in Customers</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Invoices List */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder={isUrdu ? 'بل نمبر، کیشئر یا خریدار کا نام تلاش کریں...' : 'Search by Invoice ID, cashier name, or customer name...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm text-sm transition-all"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                  <tr>
                    <th className="px-6 py-4">{isUrdu ? 'تفصیلات فروخت' : 'Invoice details'}</th>
                    <th className="px-6 py-4">{isUrdu ? 'خریدار' : 'Customer'}</th>
                    <th className="px-6 py-4">{isUrdu ? 'کل بل رقم' : 'Financials'}</th>
                    <th className="px-6 py-4 text-center">{isUrdu ? 'واجب الادا بقایا' : 'Pending balance'}</th>
                    <th className="px-6 py-4 text-center">{isUrdu ? 'طریقہ ادائیگی' : 'Payment Status'}</th>
                    <th className="px-6 py-4 text-right">{isUrdu ? 'کارروائی' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-medium text-slate-700 dark:text-gray-300">
                  {paginatedSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 dark:text-gray-500 font-medium">
                        {isUrdu ? 'کوئی فروخت نہیں ملی۔' : 'No transactions match the selected filters.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedSales.map((sale) => {
                      const customer = sale.customerId ? getCustomerById(sale.customerId) : null;
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/20 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-slate-900 dark:text-white font-bold">
                                Invoice #{sale.id}
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1 font-medium">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(sale.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                              </div>
                              <div className="text-xs text-slate-505 dark:text-slate-400 mt-0.5">
                                {sale.items.length} items • By {sale.cashierId}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-800 dark:text-slate-200">
                                {customer ? customer.name : (isUrdu ? 'عام گاہک (Walk-in)' : 'Walk-in Customer')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-900 dark:text-white font-bold">
                              Rs. {sale.finalAmount.toFixed(2)}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                              Paid: Rs. {sale.amountPaid.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {sale.dueAmount > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900">
                                Rs. {sale.dueAmount.toFixed(2)} Due
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900">
                                {isUrdu ? 'ادا شدہ' : 'Paid'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${
                              sale.paymentMethod === 'cash' 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                : sale.paymentMethod === 'card'
                                ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900'
                                : sale.paymentMethod === 'credit'
                                ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900'
                                : 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900'
                            }`}>
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              {/* Collect Payment Action */}
                              {sale.dueAmount > 0 && (
                                <button
                                  onClick={() => openCollectPayment(sale)}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors"
                                  title="Collect Payment"
                                >
                                  <Coins className="h-4 w-4" />
                                </button>
                              )}

                              {/* Return / Exchange Items Wizard Trigger */}
                              <button
                                onClick={() => openReturnWizard(sale, 'return')}
                                className="p-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors"
                                title={isUrdu ? 'واپسی / تبادلہ' : 'Return & Exchange Items'}
                              >
                                <Undo2 className="h-4 w-4" />
                              </button>

                              {/* View details */}
                              <button
                                onClick={() => {
                                  setSelectedSale(sale);
                                  setShowDetails(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* Edit sale */}
                              <button
                                onClick={() => setEditingSale(sale)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 rounded-lg transition-colors"
                                title="Edit items"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              {/* Receipt options */}
                              <button
                                onClick={() => handlePrintReceipt(sale)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                                title="Receipt menu"
                              >
                                <Printer className="h-4 w-4" />
                              </button>

                              {/* Delete sale */}
                              <button
                                onClick={() => handleDeleteSale(sale.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                title="Delete record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Revenue Breakdown */}
      {activeTab === 'breakdowns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
              {isUrdu ? 'آمدنی کا شیڈول تجزیہ' : 'Periodic Revenue Breakdown'}
            </h3>
            
            <div className="flex bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl">
              {[
                { id: 'day', label: isUrdu ? 'روزانہ' : 'Day' },
                { id: 'week', label: isUrdu ? 'ہفتہ وار' : 'Week' },
                { id: 'month', label: isUrdu ? 'ماہانہ' : 'Month' },
                { id: 'quarter', label: isUrdu ? 'سہ ماہی' : 'Quarter' },
                { id: 'year', label: isUrdu ? 'سالانہ' : 'Year' }
              ].map(group => (
                <button
                  key={group.id}
                  onClick={() => setBreakdownGrouping(group.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    breakdownGrouping === group.id 
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                  <tr>
                    <th className="px-6 py-4">{isUrdu ? 'وقفہ' : 'Time Interval'}</th>
                    <th className="px-6 py-4 text-center">{isUrdu ? 'بل تعداد' : 'Transactions'}</th>
                    <th className="px-6 py-4 text-right">{isUrdu ? 'مجموعی سیلز' : 'Gross Sales'}</th>
                    <th className="px-6 py-4 text-right">{isUrdu ? 'ڈسکاؤنٹ' : 'Discounts'}</th>
                    <th className="px-6 py-4 text-right">{isUrdu ? 'ٹیکس' : 'Taxes'}</th>
                    <th className="px-6 py-4 text-right">{isUrdu ? 'خالص فروخت' : 'Net Sales'}</th>
                    <th className="px-6 py-4 text-right">{isUrdu ? 'منافع' : 'Profit'}</th>
                    <th className="px-6 py-4 text-center">{isUrdu ? 'مارجن' : 'Margin %'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-medium text-slate-700 dark:text-gray-300">
                  {periodicBreakdownList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-slate-400 dark:text-gray-500 font-medium">
                        {isUrdu ? 'کوئی ڈیٹا دستیاب نہیں ہے۔' : 'No sales matching criteria to group.'}
                      </td>
                    </tr>
                  ) : (
                    periodicBreakdownList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/20">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{item.period}</td>
                        <td className="px-6 py-4 text-center">{item.count}</td>
                        <td className="px-6 py-4 text-right">Rs. {item.gross.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-rose-500">-Rs. {item.discount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">Rs. {item.tax.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-slate-900 dark:text-white">Rs. {item.net.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">Rs. {item.profit.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.margin > 20 
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                          }`}>
                            {item.margin.toFixed(1)}%
                          </span>
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

      {/* Tab: Profit Analysis */}
      {activeTab === 'profit_margins' && (
        <div className="space-y-6">
          {/* Estimated Net Profit Operational Card */}
          <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isUrdu ? 'کاروباری خالص منافع کا تخمینہ' : 'Estimated Bottom-line Net Profit'}</span>
              <h3 className={`text-2xl font-black ${estimatedNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                Rs. {estimatedNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-slate-500">
                Calculated as: <span className="font-semibold">Gross Profit (Rs. {dashboardStats.grossProfit.toLocaleString()})</span> minus <span className="font-semibold text-rose-500">Operational Expenses</span>
              </p>
            </div>

            <div className="flex items-center gap-6 divide-x divide-slate-100 dark:divide-gray-700">
              <div className="px-4 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{isUrdu ? 'مجموعی مارجن' : 'Profit Margin'}</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white mt-1 block">{dashboardStats.profitMargin.toFixed(1)}%</span>
              </div>
              
              <div className="px-4 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{isUrdu ? 'ری فنڈ شرح' : 'Refund Rate'}</span>
                <span className="text-base font-extrabold text-rose-650 mt-1 block">{returnsStats.refundRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table: Product Profitability */}
            <div className="bg-white dark:bg-gray-850 dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-50 dark:border-gray-700 pb-2">
                {isUrdu ? 'پروڈکٹ منافع کا تجزیہ' : 'Product Profitability Ranking'}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 dark:text-gray-505 text-xs text-left border-b border-slate-100 dark:border-gray-700">
                      <th className="py-2">{isUrdu ? 'پروڈکٹ نام' : 'Product'}</th>
                      <th className="py-2 text-center">{isUrdu ? 'سیلز' : 'Qty'}</th>
                      <th className="py-2 text-right">{isUrdu ? 'منافع' : 'Profit'}</th>
                      <th className="py-2 text-center">{isUrdu ? 'مارجن' : 'Margin'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-medium text-slate-700 dark:text-gray-300">
                    {productRankList.slice(0, 8).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/20">
                        <td className="py-2.5 truncate max-w-xs">{p.name}</td>
                        <td className="py-2.5 text-center">{p.qty}</td>
                        <td className="py-2.5 text-right text-emerald-600 font-bold">Rs. {p.profit.toFixed(0)}</td>
                        <td className="py-2.5 text-center text-xs text-slate-505">{p.margin.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table: Category Profitability */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 border-b border-slate-50 dark:border-gray-700 pb-2">
                {isUrdu ? 'کیٹیگری منافع کا تجزیہ' : 'Category Profitability Ranking'}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 dark:text-gray-505 text-xs text-left border-b border-slate-100 dark:border-gray-700">
                      <th className="py-2">{isUrdu ? 'زمرہ نام' : 'Category'}</th>
                      <th className="py-2 text-center">{isUrdu ? 'سیلز' : 'Qty'}</th>
                      <th className="py-2 text-right">{isUrdu ? 'منافع' : 'Profit'}</th>
                      <th className="py-2 text-center">{isUrdu ? 'مارجن' : 'Margin'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-medium text-slate-700 dark:text-gray-300">
                    {categoryRankList.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/20">
                        <td className="py-2.5">{c.name}</td>
                        <td className="py-2.5 text-center">{c.qty}</td>
                        <td className="py-2.5 text-right text-emerald-600 font-bold">Rs. {c.profit.toFixed(0)}</td>
                        <td className="py-2.5 text-center text-xs text-slate-505">{c.margin.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Payment Analytics */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Performance & Debt Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900 dark:text-white">
            {/* Sales performance details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 border-b border-slate-50 dark:border-gray-700 pb-2">
                {isUrdu ? 'فروخت کی کارکردگی اشاریہ' : 'Sales Performance Stats'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                <div>
                  <span className="text-[10px] text-slate-455 block uppercase font-medium">{isUrdu ? 'اوسط بل قیمت' : 'Average Sale Value'}</span>
                  <p className="text-slate-800 dark:text-white font-extrabold text-base mt-0.5">Rs. {dashboardStats.avgValue.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-455 block uppercase font-medium">{isUrdu ? 'سب سے بڑا بل' : 'Highest Sale Invoice'}</span>
                  <p className="text-slate-800 dark:text-white font-extrabold text-base mt-0.5">
                    Rs. {filteredSales.length > 0 ? Math.max(...filteredSales.map(s => s.finalAmount)).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-455 block uppercase font-medium">{isUrdu ? 'سب سے چھوٹا بل' : 'Lowest Sale Invoice'}</span>
                  <p className="text-slate-800 dark:text-white font-extrabold text-base mt-0.5">
                    Rs. {filteredSales.length > 0 ? Math.min(...filteredSales.map(s => s.finalAmount)).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-455 block uppercase font-medium">{isUrdu ? 'رعایتی بل کا تناسب' : 'Discount Usage Ratio'}</span>
                  <p className="text-slate-850 dark:text-white font-extrabold text-base mt-0.5">
                    {filteredSales.length > 0 ? ((filteredSales.filter(s => s.discount > 0).length / filteredSales.length) * 100).toFixed(0) : '0'}%
                  </p>
                </div>
              </div>
            </div>

            {/* Outstanding balance ledger */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505 border-b border-slate-50 dark:border-gray-700 pb-2">
                {isUrdu ? 'ادھار ادائیگیوں کا خلاصہ' : 'Outstanding Receivables'}
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">{isUrdu ? 'کل واجب الادا قرضہ' : 'Total Outstanding Credit'}</span>
                  <h3 className="text-3xl font-black text-rose-600 dark:text-rose-500 mt-1">Rs. {outstandingCreditSales.reduce((sum, s) => sum + s.dueAmount, 0).toLocaleString()}</h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">{isUrdu ? 'تصفیہ طلب بلز' : 'Pending Invoices'}</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{outstandingCreditSales.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Credit ledger detailed list table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm space-y-3">
            <div className="p-4 border-b border-slate-100 dark:border-gray-700">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                {isUrdu ? 'قرضہ جات کی تفصیلات' : 'Detailed Customer Debt Aging'}
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                  <tr>
                    <th className="px-6 py-4">{isUrdu ? 'رسید نمبر' : 'Sale details'}</th>
                    <th className="px-6 py-4">{isUrdu ? 'خریدار معلومات' : 'Customer info'}</th>
                    <th className="px-6 py-4 text-center">{isUrdu ? 'واجب الادا عمر (دن)' : 'Aging term'}</th>
                    <th className="px-6 py-4 text-center">{isUrdu ? 'کل ادھار رقم' : 'Outstanding amount'}</th>
                    <th className="px-6 py-4 text-center">{isUrdu ? 'اسٹیٹس خطرہ' : 'Risk level'}</th>
                    <th className="px-6 py-4 text-right">{isUrdu ? 'تصفیہ کریں' : 'Collect Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-medium text-slate-700 dark:text-gray-300">
                  {outstandingCreditSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 dark:text-gray-550 font-medium">
                        {isUrdu ? 'کوئی بقایا ادھار نہیں ملا۔' : 'No customer credit outstanding in the filtered date range.'}
                      </td>
                    </tr>
                  ) : (
                    outstandingCreditSales.map((sale) => {
                      let riskBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400">
                          {isUrdu ? 'نارمل کھاتا' : 'Current'}
                        </span>
                      );
                      if (sale.daysElapsed > 30) {
                        riskBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
                            {isUrdu ? 'انتہائی سنگین' : 'Critical Warning'}
                          </span>
                        );
                      } else if (sale.daysElapsed > 15) {
                        riskBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
                            {isUrdu ? 'واچ لسٹ' : 'Warning Alert'}
                          </span>
                        );
                      }

                      return (
                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/20 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-slate-900 dark:text-white font-bold">
                                Invoice #{sale.id}
                              </div>
                              <div className="text-xs text-slate-400 mt-1 font-medium">
                                Sold: {format(new Date(sale.createdAt), 'yyyy-MM-dd')}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-slate-800 dark:text-slate-200 font-bold">
                                {sale.customer ? sale.customer.name : 'Walk-in customer'}
                              </div>
                              {sale.customer?.phone && (
                                <div className="text-xs text-slate-550 flex items-center gap-1 mt-1 font-medium">
                                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{sale.customer.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-extrabold text-slate-900 dark:text-white text-base">
                                {sale.daysElapsed}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                {isUrdu ? 'دن سے باقی' : 'Days elapsed'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-rose-600 dark:text-rose-500 font-black text-sm">
                              Rs. {sale.dueAmount.toFixed(2)}
                            </span>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              Paid: Rs. {sale.amountPaid.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {riskBadge}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openCollectPayment(sale)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-500/10 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                            >
                              <Coins className="h-3.5 w-3.5" />
                              <span>{isUrdu ? 'رقم وصول کریں' : 'Collect Payment'}</span>
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
      )}

      {/* Sale Details Modal */}
      {showDetails && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative border border-slate-200 dark:border-gray-700">
            
            <button 
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-gray-700 pb-3">
              <Receipt className="h-5 w-5 text-blue-600" />
              <span>{isUrdu ? `بل کی تفصیلات - #${selectedSale.id}` : `Sale Invoice Details - #${selectedSale.id}`}</span>
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-slate-800 dark:text-slate-100">
              <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{isUrdu ? 'تاریخ اور وقت' : 'Date & Time'}</p>
                <p className="font-bold text-sm mt-1">
                  {format(new Date(selectedSale.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase">{isUrdu ? 'خریدار' : 'Customer'}</p>
                <p className="font-bold text-sm mt-1 truncate">
                  {selectedSale.customerId 
                    ? getCustomerById(selectedSale.customerId)?.name || 'Unknown'
                    : (isUrdu ? 'عام گاہک' : 'Walk-in Customer')
                  }
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{isUrdu ? 'طریقہ ادائیگی' : 'Payment Status'}</p>
                <p className="font-bold text-sm mt-1 capitalize">
                  {selectedSale.paymentStatus || 'Fully Paid'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{isUrdu ? 'کیشئر آئی ڈی' : 'Cashier'}</p>
                <p className="font-bold text-sm mt-1">
                  {selectedSale.cashierId}
                </p>
              </div>
            </div>

            {/* Items table */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-sm uppercase tracking-wider">{isUrdu ? 'پروڈکٹس فہرست' : 'Invoice Items'}</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedSale.items.map((item: any, index: number) => {
                  const name = item.product?.name || item.productName || 'Unknown Product';
                  const price = item.product?.price || item.productPrice || 0;

                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-gray-700 rounded-xl">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{name}</p>
                        <p className="text-xs text-slate-505 dark:text-slate-400 font-medium mt-1">
                          Rs. {price.toFixed(2)} × {item.quantity}
                          {item.discountValue > 0 && (
                            <span className="text-rose-600 dark:text-rose-400 ml-2 font-bold">
                              (-Rs. {item.discountValue} Discount)
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        Rs. {item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Previous Returns List (Requirement) */}
            {selectedSaleReturns.length > 0 && (
              <div className="mb-6 bg-rose-50/20 dark:bg-rose-950/10 p-4 rounded-xl border border-rose-100/50 dark:border-rose-900/40">
                <h3 className="font-bold text-rose-600 dark:text-rose-400 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Undo2 className="h-4 w-4" />
                  <span>{isUrdu ? 'گذشتہ واپسی اور تبادلہ کی معلومات' : 'Previous Returns & Exchanges'}</span>
                </h3>
                <div className="space-y-3.5 max-h-40 overflow-y-auto pr-1">
                  {selectedSaleReturns.map((r, rIdx) => (
                    <div key={rIdx} className="text-xs border-b border-rose-100/30 dark:border-rose-900/20 pb-2.5 last:border-b-0 last:pb-0">
                      <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>Return #{r.id}</span>
                        <span>{format(new Date(r.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="text-[11px] text-slate-550 dark:text-slate-400 mt-1">
                        Refund: <strong className="text-slate-850 dark:text-slate-200">Rs. {r.refundAmount.toLocaleString()}</strong> 
                        {r.exchangeAmount > 0 && ` • Exchange: Rs. ${r.exchangeAmount.toLocaleString()}`}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 italic">
                        Items: {r.items.map(i => `${i.productName} (×${i.quantity})`).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments History if Credit Sale */}
            {selectedSale.payments && selectedSale.payments.length > 0 && (
              <div className="mb-6 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-gray-800">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-2">
                  {isUrdu ? 'ادائیگی کی ہسٹری (قسط وار)' : 'Ledger Payment Timeline'}
                </h3>
                <div className="space-y-2">
                  {selectedSale.payments.map((p, pidx) => (
                    <div key={pidx} className="flex justify-between text-xs text-slate-600 dark:text-gray-400 py-1 border-b border-dashed border-slate-200 dark:border-gray-700 last:border-b-0">
                      <span className="capitalize">{p.method.replace('_', ' ')} {p.reference ? `(Ref: ${p.reference})` : ''}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Rs. {p.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedSale.notes && (
              <div className="mb-6 p-3 bg-blue-50/50 border border-blue-100 rounded-xl dark:bg-blue-950/20 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300">
                <span className="font-bold block mb-1">Invoice Notes:</span>
                {selectedSale.notes}
              </div>
            )}

            {/* Total breakdown */}
            <div className="space-y-2.5 mb-6 p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200/50 dark:border-gray-700">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
                <span>Subtotal:</span>
                <span>Rs. {selectedSale.total.toFixed(2)}</span>
              </div>
              {selectedSale.tax > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
                  <span>Tax:</span>
                  <span>Rs. {selectedSale.tax.toFixed(2)}</span>
                </div>
              )}
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
                  <span>Discount:</span>
                  <span className="text-rose-600">-Rs. {selectedSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-slate-900 dark:text-white text-base border-t border-slate-200 dark:border-gray-600 pt-2.5">
                <span>Total invoice amount:</span>
                <span>Rs. {selectedSale.finalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
                <span>Amount Paid:</span>
                <span>Rs. {selectedSale.amountPaid.toFixed(2)}</span>
              </div>
              {selectedSale.change > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Change Back:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Rs. {selectedSale.change.toFixed(2)}</span>
                </div>
              )}
              {selectedSale.dueAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Outstanding Balance:</span>
                  <span className="text-rose-600 dark:text-rose-500 font-black">Rs. {selectedSale.dueAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => {
                  setShowDetails(false);
                  openReturnWizard(selectedSale, 'return');
                }}
                className="flex-1 bg-rose-650 hover:bg-rose-700 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-colors"
              >
                <Undo2 className="h-4 w-4" />
                <span>{isUrdu ? 'واپسی / تبادلہ کریں' : 'Return / Exchange'}</span>
              </button>

              <button
                onClick={() => handlePrintReceipt(selectedSale)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>{isUrdu ? 'رسید بنائیں' : 'Generate Receipt'}</span>
              </button>
              
              <button
                onClick={() => setShowDetails(false)}
                className="sm:w-28 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 py-2.5 px-4 rounded-xl text-sm font-bold transition-colors"
              >
                {isUrdu ? 'بند کریں' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect due-payment modal */}
      {showPaymentModal && paymentSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative border border-slate-200 dark:border-gray-700">
            <button 
              onClick={() => {
                setShowPaymentModal(false);
                setPaymentSale(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-600" />
              <span>{isUrdu ? 'بقایا واجب الادا وصولی' : 'Record Credit Collection'}</span>
            </h2>

            <div className="mb-4 text-sm text-slate-650 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-gray-700">
              <p className="font-semibold">Invoice ID: #{paymentSale.id}</p>
              <p className="mt-1">
                Customer: <strong className="text-slate-800 dark:text-white">
                  {paymentSale.customerId ? getCustomerById(paymentSale.customerId)?.name || 'Unknown' : 'Walk-in'}
                </strong>
              </p>
              <p className="mt-1">
                Outstanding Balance: <strong className="text-rose-600">Rs. {paymentSale.dueAmount.toFixed(2)}</strong>
              </p>
            </div>

            <form onSubmit={handleCollectPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  {isUrdu ? 'وصول کی گئی رقم' : 'Amount to Collect'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={paymentSale.dueAmount}
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  {isUrdu ? 'ادائیگی کا ذریعہ' : 'Payment Method'}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none capitalize"
                >
                  <option value="cash">{isUrdu ? 'کیش (نقد)' : 'Cash'}</option>
                  <option value="card">{isUrdu ? 'بینک کارڈ' : 'Bank Card'}</option>
                  <option value="bank_transfer">{isUrdu ? 'بینک ٹرانسفر' : 'Bank Transfer'}</option>
                  <option value="mobile_wallet">{isUrdu ? 'موبائل والٹ (ایزی پیسہ/جیز کیش)' : 'Mobile Wallet'}</option>
                  <option value="other">{isUrdu ? 'دیگر' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase font-medium">
                  {isUrdu ? 'حوالہ نمبر (اختیاری)' : 'Payment Reference (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Txn-998822"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase font-medium">
                  {isUrdu ? 'اضافی نوٹس (اختیاری)' : 'Internal Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-gray-700 text-slate-800 dark:text-white">
                <button
                  type="submit"
                  disabled={isSavingPayment}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {isSavingPayment ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{isUrdu ? 'ادائیگی محفوظ کریں' : 'Save Payment'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentSale(null);
                  }}
                  className="w-24 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-200 py-2.5 px-4 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Reports Selection Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative border border-slate-200 dark:border-gray-700">
            <button 
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              {isUrdu ? 'بزنس رپورٹ برآمد کریں' : 'Export Business Report'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {isUrdu 
                ? 'براہ کرم جس رپورٹ کو آپ ڈاؤن لوڈ کرنا چاہتے ہیں اسے منتخب کریں:' 
                : 'Select the analytical ledger report you wish to export to CSV format:'
              }
            </p>
            
            <div className="space-y-3 mb-6">
              {[
                { id: 'summary', title: isUrdu ? 'سیلز خلاصہ رپورٹ' : 'Overall Sales Summary', desc: 'Financial overview, totals, and net margins' },
                { id: 'revenue', title: isUrdu ? 'ریونیو بریک ڈاؤن رپورٹ' : 'Periodic Revenue Report', desc: 'Day, week, and monthly transaction logs' },
                { id: 'profit', title: isUrdu ? 'پروڈکٹ منافع رپورٹ' : 'Profitability Ledger', desc: 'COGS, profits, and margins per product' },
                { id: 'tax', title: isUrdu ? 'ٹیکس اور ڈسکاؤنٹ رپورٹ' : 'Taxation & Discounts', desc: 'Tax collected and discount usage logs' },
                { id: 'payment', title: isUrdu ? 'طریقہ ادائیگی رپورٹ' : 'Payment Distribution', desc: 'Breakdown of cash, card, credit, and wallets' },
                { id: 'customer', title: isUrdu ? 'گاہک سیلز رپورٹ' : 'Customer Spending Report', desc: 'Spend ranks and visits per registered client' }
              ].map(report => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportType(report.id as any)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex flex-col ${
                    selectedReportType === report.id
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-gray-750 dark:hover:bg-gray-700/40'
                  }`}
                >
                  <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    {selectedReportType === report.id && <Check className="h-4 w-4 text-blue-500" />}
                    <span>{report.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{report.desc}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportCSVReport}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>{isUrdu ? 'ڈاؤن لوڈ کریں (CSV)' : 'Export CSV File'}</span>
              </button>
              
              <button
                onClick={() => setShowExportModal(false)}
                className="w-24 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-300 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return & Exchange Multi-Step Wizard Modal Dialog */}
      {showReturnWizard && wizardSale && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-200 dark:border-gray-700">
            
            <button 
              onClick={() => {
                setShowReturnWizard(false);
                setWizardSale(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title / Steps tracker */}
            <div className="border-b border-slate-100 dark:border-gray-700 pb-4 mb-5">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                <Undo2 className="h-5 w-5 text-rose-500" />
                <span>{isUrdu ? 'واپسی اور تبادلہ کارگزار' : 'Return & Exchange Wizard'}</span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-900 font-bold px-2 py-0.5 rounded text-slate-500">Invoice #{wizardSale.id}</span>
              </h2>

              {/* Steps Progress Visualizer */}
              <div className="flex items-center gap-3 mt-4 text-xs font-bold select-none">
                {[
                  { step: 1, label: isUrdu ? 'آئٹم منتخب کریں' : 'Select items' },
                  { step: 2, label: isUrdu ? 'طریقہ کار' : 'Configure options' },
                  { step: 3, label: isUrdu ? 'تصدیق' : 'Confirmation' }
                ].map(s => (
                  <React.Fragment key={s.step}>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                        wizardStep === s.step
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : wizardStep > s.step
                            ? 'bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/20'
                            : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-700'
                      }`}>
                        {wizardStep > s.step ? <Check className="h-3 w-3 stroke-[3]" /> : s.step}
                      </span>
                      <span className={wizardStep === s.step ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-400 dark:text-slate-500'}>
                        {s.label}
                      </span>
                    </div>
                    {s.step < 3 && <div className="h-px bg-slate-200 dark:bg-gray-700 flex-1 min-w-[20px]" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* WIZARD STEP 1: Select items to return */}
            {wizardStep === 1 && (
              <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                <div className="space-y-3 pr-1">
                  {wizardSale.items.map(item => {
                    const pId = item.productId || (item.product ? item.product.id : 0);
                    if (!pId) return null;

                    const quantitySold = item.quantity;
                    const quantityAlreadyReturned = getItemReturnedQty(wizardSale.id, pId);
                    const quantityEligible = quantitySold - quantityAlreadyReturned;
                    const selectedReturnQty = wizardQuantities[pId] || 0;

                    const price = item.productPrice || (item.product ? item.product.price : 0);
                    const name = item.productName || item.product?.name || 'Unknown Item';

                    return (
                      <div 
                        key={pId}
                        className={`p-4 rounded-2xl border transition-all ${
                          selectedReturnQty > 0 
                            ? 'bg-rose-50/10 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/60 shadow-sm' 
                            : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-gray-750'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{name}</h4>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold flex flex-wrap gap-x-3 gap-y-1">
                              <span>Price: Rs. {price.toFixed(2)}</span>
                              <span>Bought: {quantitySold}</span>
                              <span>Returned: {quantityAlreadyReturned}</span>
                              <span className="text-blue-600 dark:text-blue-400 font-extrabold">Eligible: {quantityEligible}</span>
                            </div>
                          </div>

                          {quantityEligible > 0 ? (
                            <div className="flex items-center gap-2 select-none shrink-0">
                              <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase mr-1">{isUrdu ? 'واپس تعداد' : 'Return Qty'}</span>
                              <div className="flex items-center bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateWizardQty(pId, -1, quantityEligible)}
                                  className="p-1.5 px-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-black text-slate-900 dark:text-white px-2.5 min-w-[20px] text-center">
                                  {selectedReturnQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateWizardQty(pId, 1, quantityEligible)}
                                  className="p-1.5 px-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-lg">
                              {isUrdu ? 'مکمل واپس شدہ' : 'Fully Returned'}
                            </span>
                          )}
                        </div>

                        {selectedReturnQty > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-700/80 grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-in slide-in-from-top-2 duration-150 text-slate-800 dark:text-slate-200">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Reason for return</label>
                              <input
                                type="text"
                                value={wizardReasons[pId] || ''}
                                onChange={(e) => setWizardReasons(prev => ({ ...prev, [pId]: e.target.value }))}
                                placeholder="Enter reason..."
                                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Restock Condition</label>
                              <select
                                value={wizardConditions[pId] || 'Resellable'}
                                onChange={(e) => setWizardConditions(prev => ({ ...prev, [pId]: e.target.value as any }))}
                                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none"
                              >
                                <option value="Resellable">Resellable (Stock +1)</option>
                                <option value="Damaged">Damaged (No Stock Restoring)</option>
                                <option value="Expired">Expired (No Stock Restoring)</option>
                                <option value="Other">Other / Defective</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-700">
                  <button
                    disabled={wizardRefundAmount === 0}
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                  >
                    {isUrdu ? 'آگے بڑھیں' : 'Proceed to Step 2'}
                  </button>
                </div>
              </div>
            )}

            {/* WIZARD STEP 2: Choose mode (Return Only or Exchange) */}
            {wizardStep === 2 && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-200">
                {/* Selector cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setWizardMode('return')}
                    className={`p-5 rounded-2xl border text-left flex gap-3 transition-all ${
                      wizardMode === 'return'
                        ? 'border-rose-500 bg-rose-50/10 dark:bg-rose-950/20 ring-1 ring-rose-500/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-gray-750 dark:bg-gray-800'
                    }`}
                  >
                    <RotateCcw className={`h-6 w-6 shrink-0 mt-0.5 ${wizardMode === 'return' ? 'text-rose-600' : 'text-slate-400'}`} />
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">{isUrdu ? 'صرف واپسی (ری فنڈ)' : 'Refund Only'}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">Issue refund payouts back to the customer directly.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWizardMode('exchange')}
                    className={`p-5 rounded-2xl border text-left flex gap-3 transition-all ${
                      wizardMode === 'exchange'
                        ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20 ring-1 ring-indigo-500/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-gray-750 dark:bg-gray-800'
                    }`}
                  >
                    <RefreshCw className={`h-6 w-6 shrink-0 mt-0.5 ${wizardMode === 'exchange' ? 'text-indigo-650' : 'text-slate-400'}`} />
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">{isUrdu ? 'تبادلہ (ایکسچینج)' : 'Exchange Items'}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">Swap items for replacement products in catalog inventory.</p>
                    </div>
                  </button>
                </div>

                {/* Sub-view: Refund Only */}
                {wizardMode === 'return' && (
                  <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/50 dark:border-gray-800 animate-in fade-in duration-200">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-500">{isUrdu ? 'کل ری فنڈ کی رقم' : 'Refund Payout Credit:'}</span>
                      <span className="text-slate-900 dark:text-white text-base font-extrabold">Rs. {wizardRefundAmount.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{isUrdu ? 'ادائیگی کا طریقہ' : 'Refund Payout Method'}</label>
                        <select
                          value={wizardRefundMethod}
                          onChange={(e) => setWizardRefundMethod(e.target.value as PaymentMethod)}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card / Bank Payout</option>
                          {wizardSale.customerId && (
                            <option value="credit">Store Credit Ledger balance</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{isUrdu ? 'نوٹس' : 'Notes'}</label>
                        <input
                          type="text"
                          value={wizardNotes}
                          onChange={(e) => setWizardNotes(e.target.value)}
                          placeholder="Internal return logs..."
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-view: Exchange replacement selection */}
                {wizardMode === 'exchange' && (
                  <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/50 dark:border-gray-800 animate-in fade-in duration-200 text-slate-800 dark:text-slate-250">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                      <input
                        type="text"
                        placeholder="Search replacements by product name or barcode..."
                        value={wizardExchangeSearch}
                        onChange={(e) => setWizardExchangeSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                      />

                      {wizardExchangeSearch.trim() && (
                        <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-1.5 space-y-1">
                          {filteredExchangeSuggestions.length === 0 ? (
                            <p className="text-[10px] text-center text-slate-400 py-3 italic">No matching products found.</p>
                          ) : (
                            filteredExchangeSuggestions.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleAddWizardExchangeProduct(p)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-indigo-50/40 dark:hover:bg-gray-800 text-slate-800 dark:text-slate-200 flex justify-between font-bold"
                              >
                                <span>{p.name}</span>
                                <span className="text-indigo-600 dark:text-indigo-400">Rs. {p.price.toLocaleString()} (Stock: {p.stock})</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Exchange Cart Items list */}
                    {wizardExchangeCart.length === 0 ? (
                      <p className="text-xs text-center text-slate-400 py-4 italic">No replacement products added yet. Use search lookup above.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {wizardExchangeCart.map(item => (
                          <div 
                            key={item.product.id}
                            className="flex items-center justify-between bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-750 p-3 rounded-xl text-xs font-bold"
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <h5 className="text-slate-800 dark:text-slate-100 truncate">{item.product.name}</h5>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Rs. {item.product.price.toLocaleString()} each</p>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      setWizardExchangeCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, quantity: c.quantity - 1 } : c));
                                    } else {
                                      setWizardExchangeCart(prev => prev.filter(c => c.product.id !== item.product.id));
                                    }
                                  }}
                                  className="p-1 px-2 text-slate-500 hover:bg-slate-100"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-1 text-slate-900 dark:text-white">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.quantity >= item.product.stock) {
                                      alert(`Cannot exceed stock limit of ${item.product.stock}`);
                                      return;
                                    }
                                    setWizardExchangeCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, quantity: c.quantity + 1 } : c));
                                  }}
                                  className="p-1 px-2 text-slate-500 hover:bg-slate-100"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              
                              <span className="w-20 text-right text-slate-900 dark:text-white">
                                Rs. {(item.product.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Math Adjustment panel */}
                    <div className="p-4 bg-white dark:bg-gray-900 border border-slate-200/60 dark:border-gray-700 rounded-xl space-y-2 text-xs font-bold">
                      <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-gray-800">
                        <span className="text-slate-550">{isUrdu ? 'واپس بل ری فنڈ' : 'Total Return Credit:'}</span>
                        <span>Rs. {wizardRefundAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-gray-800">
                        <span className="text-slate-550">{isUrdu ? 'متبادل آرٹیکل قیمت' : 'Replacement Value:'}</span>
                        <span>Rs. {wizardExchangeAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-1 font-black text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{wizardNetRefund >= 0 ? 'Due Payout to Customer:' : 'Additional Due from Customer:'}</span>
                        <span className={wizardNetRefund >= 0 ? 'text-green-600' : 'text-amber-500'}>
                          Rs. {Math.abs(wizardNetRefund).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Math.abs(wizardNetRefund) > 0 && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Payout/Method</label>
                          <select
                            value={wizardRefundMethod}
                            onChange={(e) => setWizardRefundMethod(e.target.value as PaymentMethod)}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none"
                          >
                            <option value="cash">Cash</option>
                            <option value="card">Card / Bank</option>
                            {wizardSale.customerId && (
                              <option value="credit">Store Credit Ledger</option>
                            )}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{isUrdu ? 'نوٹس' : 'Notes'}</label>
                        <input
                          type="text"
                          value={wizardNotes}
                          onChange={(e) => setWizardNotes(e.target.value)}
                          placeholder="Exchange internal comments..."
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-4 border-t border-slate-100 dark:border-gray-700">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    {isUrdu ? 'پیچھے' : 'Back'}
                  </button>

                  <button
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                  >
                    {isUrdu ? 'آگے بڑھیں' : 'Proceed to Step 3'}
                  </button>
                </div>
              </div>
            )}

            {/* WIZARD STEP 3: Confirmation */}
            {wizardStep === 3 && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-200">
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-200/50 dark:border-gray-800 text-xs font-bold space-y-3">
                    <h4 className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider border-b pb-1.5 border-slate-100 dark:border-gray-800">
                      Returned Products Audit
                    </h4>
                    <div className="space-y-1.5">
                      {wizardSale.items.map(item => {
                        const pId = item.productId || (item.product ? item.product.id : 0);
                        const qty = wizardQuantities[pId] || 0;
                        if (qty === 0) return null;
                        return (
                          <div key={pId} className="flex justify-between text-slate-850 dark:text-slate-200">
                            <span>{item.productName || item.product?.name} (×{qty})</span>
                            <span className="text-slate-400 font-medium">Reason: {wizardReasons[pId]} ({wizardConditions[pId]})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {wizardMode === 'exchange' && wizardExchangeCart.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-200/50 dark:border-gray-800 text-xs font-bold space-y-3">
                      <h4 className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider border-b pb-1.5 border-slate-100 dark:border-gray-800">
                        Exchanged Replacements Audit
                      </h4>
                      <div className="space-y-1.5">
                        {wizardExchangeCart.map(item => (
                          <div key={item.product.id} className="flex justify-between text-slate-850 dark:text-slate-200">
                            <span>{item.product.name} (×{item.quantity})</span>
                            <span>Rs. {(item.product.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-slate-200/50 dark:border-gray-800 text-xs font-bold space-y-2">
                    <h4 className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider border-b pb-1.5 border-slate-100 dark:border-gray-800">
                      Refund Math & Adjustment Payouts
                    </h4>
                    <div className="flex justify-between text-slate-650">
                      <span>Total Returned Credit:</span>
                      <span>Rs. {wizardRefundAmount.toLocaleString()}</span>
                    </div>
                    {wizardMode === 'exchange' && (
                      <div className="flex justify-between text-slate-650">
                        <span>Replacement Total Price:</span>
                        <span>Rs. {wizardExchangeAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black border-t border-slate-200/50 dark:border-gray-600 pt-2 text-slate-900 dark:text-white">
                      <span>{wizardNetRefund >= 0 ? 'Net Refund Paid to Client:' : 'Due Outstanding Owed to Us:'}</span>
                      <span className={wizardNetRefund >= 0 ? 'text-green-600' : 'text-amber-500'}>
                        Rs. {Math.abs(wizardNetRefund).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-slate-100 dark:border-gray-700">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    {isUrdu ? 'پیچھے' : 'Back'}
                  </button>

                  <button
                    disabled={isProcessingWizard}
                    onClick={handleFinalizeReturnWizard}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    {isProcessingWizard ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    <span>{isUrdu ? 'تصدیق اور واپسی مکمل کریں' : 'Confirm Return & Exchange'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Reports Selection Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative border border-slate-200 dark:border-gray-700">
            <button 
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              {isUrdu ? 'بزنس رپورٹ برآمد کریں' : 'Export Business Report'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {isUrdu 
                ? 'براہ کرم جس رپورٹ کو آپ ڈاؤن لوڈ کرنا چاہتے ہیں اسے منتخب کریں:' 
                : 'Select the analytical ledger report you wish to export to CSV format:'
              }
            </p>
            
            <div className="space-y-3 mb-6">
              {[
                { id: 'summary', title: isUrdu ? 'سیلز خلاصہ رپورٹ' : 'Overall Sales Summary', desc: 'Financial overview, totals, and net margins' },
                { id: 'revenue', title: isUrdu ? 'ریونیو بریک ڈاؤن رپورٹ' : 'Periodic Revenue Report', desc: 'Day, week, and monthly transaction logs' },
                { id: 'profit', title: isUrdu ? 'پروڈکٹ منافع رپورٹ' : 'Profitability Ledger', desc: 'COGS, profits, and margins per product' },
                { id: 'tax', title: isUrdu ? 'ٹیکس اور ڈسکاؤنٹ رپورٹ' : 'Taxation & Discounts', desc: 'Tax collected and discount usage logs' },
                { id: 'payment', title: isUrdu ? 'طریقہ ادائیگی رپورٹ' : 'Payment Distribution', desc: 'Breakdown of cash, card, credit, and wallets' },
                { id: 'customer', title: isUrdu ? 'گاہک سیلز رپورٹ' : 'Customer Spending Report', desc: 'Spend ranks and visits per registered client' }
              ].map(report => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportType(report.id as any)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex flex-col ${
                    selectedReportType === report.id
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-gray-750 dark:hover:bg-gray-700/40'
                  }`}
                >
                  <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    {selectedReportType === report.id && <Check className="h-4 w-4 text-blue-500" />}
                    <span>{report.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{report.desc}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportCSVReport}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>{isUrdu ? 'ڈاؤن لوڈ کریں (CSV)' : 'Export CSV File'}</span>
              </button>
              
              <button
                onClick={() => setShowExportModal(false)}
                className="w-24 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-300 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Choice Dialog Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative border border-slate-200 dark:border-gray-700">
            <button 
              onClick={() => {
                setShowReceiptModal(false);
                setSelectedSaleForReceipt(null);
                setSelectedCustomerForReceipt(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {isUrdu ? 'رسید کی نوعیت منتخب کریں' : 'Generate Document'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {isUrdu 
                ? 'براہ کرم پرنٹ کرنے کے لیے مطلوبہ زبان اور فائل کی شکل منتخب کریں:' 
                : 'Choose language layout and document format to print or download:'
              }
            </p>
            
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/20 p-4 rounded-xl border border-slate-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-slate-805 dark:text-slate-100 mb-2">English Receipt</h3>
                <button
                  onClick={handleGenerateEnglishReceipt}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF Receipt</span>
                </button>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-700/20 p-4 rounded-xl border border-slate-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-slate-805 dark:text-slate-100 mb-2">Urdu Receipt (اردو رسید)</h3>
                <button
                  onClick={handleGenerateUrduReceipt}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Urdu Receipt</span>
                </button>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowReceiptModal(false);
                setSelectedSaleForReceipt(null);
                setSelectedCustomerForReceipt(null);
              }}
              className="w-full mt-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-300 py-2.5 px-4 rounded-xl text-sm font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Sale Modal Integration */}
      {editingSale && (
        <EditSaleModal
          sale={editingSale}
          onClose={() => setEditingSale(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default SalesHistory;