import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Users, 
  Calendar, 
  AlertTriangle, 
  RefreshCw, 
  DollarSign, 
  ShoppingCart, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Minimize2, 
  Percent, 
  Truck, 
  Wallet,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
  Zap,
  Bookmark,
  CheckCircle,
  Clock,
  Heart,
  FileText,
  Download,
  Printer,
  History,
  Settings,
  Star,
  Copy,
  Trash2,
  Edit2
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';
import EmptyState from '../components/EmptyState';
import DetailPageLayout from '../components/DetailPageLayout';
import { usePOSStore } from '../stores/posStore';
import { useCustomerStore } from '../stores/customersStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useExpensesStore } from '../stores/expensesStore';
import { useSupplierStore } from '../stores/supplierStore';
import { usePurchaseStore } from '../stores/purchaseStore';
import { useReturnsStore } from '../stores/returnsStore';
import { 
  format, 
  subDays, 
  startOfDay, 
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  startOfYear,
  endOfYear,
  subYears,
  differenceInDays
} from 'date-fns';

type DatePeriod = 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'custom';
type AnalyticsTab = 'dashboard' | 'sales' | 'inventory' | 'purchases' | 'customers' | 'suppliers' | 'expenses' | 'health' | 'builder' | 'templates' | 'history' | 'scheduled';
type ReportType = 'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers' | 'expenses' | 'pnl' | 'cashflow' | 'valuation' | 'summary';

interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  period: DatePeriod;
  startDate?: string;
  endDate?: string;
  selectedColumns: string[];
  filters: Record<string, string>;
  isFavorite: boolean;
  createdAt: string;
}

interface ReportHistoryItem {
  id: string;
  name: string;
  type: ReportType;
  generatedAt: string;
  format: 'PDF' | 'Excel' | 'CSV' | 'Print';
  filtersUsed: string;
}

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Stores
  const { sales: rawSales } = usePOSStore();
  const sales = useMemo(() => rawSales ?? [], [rawSales]);
  const { customers } = useCustomerStore();
  const { products, categories, getLowStockProducts } = useInventoryStore();
  const { expenses } = useExpensesStore();
  const { suppliers } = useSupplierStore();
  const { purchaseOrders } = usePurchaseStore();
  const { returns, initializeReturns } = useReturnsStore();

  // Navigation States
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartType, setChartType] = useState<'revenue' | 'sales'>('revenue');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ x: string; y: number; index: number } | null>(null);

  // Custom Report Builder States
  const [builderType, setBuilderType] = useState<ReportType>('sales');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [builderColumns, setBuilderColumns] = useState<string[]>(['date', 'id', 'amount', 'payment']);
  const [sortBy, setSortBy] = useState<string>('date');
  const [groupBy, setGroupBy] = useState<string>('none');
  const [customReportName, setCustomReportName] = useState<string>('Custom Business Report');

  // Export Settings States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'Excel' | 'CSV'>('PDF');
  const [exportPaperSize, setExportPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [exportOrientation, setExportOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [exportFileName, setExportFileName] = useState<string>('business_report');

  // Saved templates & History lists
  const [savedTemplates, setSavedTemplates] = useState<ReportTemplate[]>([]);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);

  // Scheduled Reports Configurations
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 'weekly',
    email: '',
    format: 'PDF',
    isActive: false
  });

  // Drill-down helper
  const handleDrillDown = (route: string, params?: string) => {
    const hash = params ? `${route}?${params}` : route;
    window.location.hash = hash;
  };

  // Load Saved templates & History on mount
  useEffect(() => {
    initializeReturns();
    
    // Load Templates
    const templates = localStorage.getItem('khatabook_report_templates');
    if (templates) {
      try { setSavedTemplates(JSON.parse(templates)); } catch (e) { console.error(e); }
    } else {
      const defaults: ReportTemplate[] = [
        { id: '1', name: 'Monthly Sales Analysis', type: 'sales', period: 'thisMonth', selectedColumns: ['date', 'id', 'amount', 'payment'], filters: {}, isFavorite: true, createdAt: new Date().toISOString() },
        { id: '2', name: 'Inventory Asset Valuation Summary', type: 'valuation', period: 'today', selectedColumns: ['sku', 'name', 'stock', 'cost', 'totalValue'], filters: {}, isFavorite: false, createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('khatabook_report_templates', JSON.stringify(defaults));
      setSavedTemplates(defaults);
    }

    // Load History
    const history = localStorage.getItem('khatabook_report_history');
    if (history) {
      try { setReportHistory(JSON.parse(history)); } catch (e) { console.error(e); }
    }
  }, [initializeReturns]);

  // Handle Refresh Action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsRefreshing(false);
  };

  // Date Range Calculation Memo
  const dateRange = useMemo(() => {
    const now = new Date();
    let start = startOfDay(now);
    let end = endOfDay(now);
    let prevStart = startOfDay(now);
    let prevEnd = endOfDay(now);
    let label = '';

    switch (selectedPeriod) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        prevStart = startOfDay(subDays(now, 1));
        prevEnd = endOfDay(subDays(now, 1));
        label = 'Today';
        break;
      case 'yesterday':
        start = startOfDay(subDays(now, 1));
        end = endOfDay(subDays(now, 1));
        prevStart = startOfDay(subDays(now, 2));
        prevEnd = endOfDay(subDays(now, 2));
        label = 'Yesterday';
        break;
      case '7days':
        start = startOfDay(subDays(now, 6));
        end = endOfDay(now);
        prevStart = startOfDay(subDays(now, 13));
        prevEnd = endOfDay(subDays(now, 7));
        label = 'Last 7 Days';
        break;
      case '30days':
        start = startOfDay(subDays(now, 29));
        end = endOfDay(now);
        prevStart = startOfDay(subDays(now, 59));
        prevEnd = endOfDay(subDays(now, 30));
        label = 'Last 30 Days';
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        end = endOfMonth(now);
        prevStart = startOfMonth(subMonths(now, 1));
        prevEnd = endOfMonth(subMonths(now, 1));
        label = format(now, 'MMMM yyyy');
        break;
      case 'lastMonth':
        const lastM = subMonths(now, 1);
        start = startOfMonth(lastM);
        end = endOfMonth(lastM);
        prevStart = startOfMonth(subMonths(lastM, 1));
        prevEnd = endOfMonth(subMonths(lastM, 1));
        label = format(lastM, 'MMMM yyyy');
        break;
      case 'thisQuarter':
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        prevStart = startOfQuarter(subQuarters(now, 1));
        prevEnd = endOfQuarter(subQuarters(now, 1));
        label = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
        break;
      case 'thisYear':
        start = startOfYear(now);
        end = endOfYear(now);
        prevStart = startOfYear(subYears(now, 1));
        prevEnd = endOfYear(subYears(now, 1));
        label = format(now, 'yyyy');
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = startOfDay(new Date(customStartDate));
          end = endOfDay(new Date(customEndDate));
          const diff = differenceInDays(end, start) + 1;
          prevStart = startOfDay(subDays(start, diff));
          prevEnd = endOfDay(subDays(start, 1));
          label = `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
        } else {
          start = startOfDay(now);
          end = endOfDay(now);
          prevStart = startOfDay(subDays(now, 1));
          prevEnd = endOfDay(subDays(now, 1));
          label = 'Custom';
        }
        break;
    }
    return { start, end, label, prevStart, prevEnd };
  }, [selectedPeriod, customStartDate, customEndDate]);

  // Core Calculations Helper
  const getMetricsForPeriod = (startDate: Date, endDate: Date) => {
    const isWithin = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        return d >= startDate && d <= endDate;
      } catch {
        return false;
      }
    };

    const periodSales = sales.filter(s => isWithin(s.createdAt));
    const revenue = periodSales.reduce((sum, s) => sum + s.finalAmount, 0);
    const salesCount = periodSales.length;

    const periodReturns = returns.filter(r => isWithin(r.createdAt));
    const refunds = periodReturns.reduce((sum, r) => sum + r.netRefund, 0);
    const netRevenue = revenue - refunds;

    let cogs = 0;
    periodSales.forEach(sale => {
      sale.items?.forEach(item => {
        const productCost = item.product?.cost || products.find(p => p.id === item.product?.id)?.cost || 0;
        cogs += item.quantity * productCost;
      });
    });

    periodReturns.forEach(ret => {
      ret.items?.forEach(item => {
        if (item.condition === 'Resellable') {
          const productCost = products.find(p => p.id === item.productId)?.cost || 0;
          cogs -= item.quantity * productCost;
        }
      });
    });

    const grossProfit = netRevenue - Math.max(0, cogs);
    const periodPurchases = purchaseOrders.filter(po => isWithin(po.purchaseDate || po.createdAt));
    const purchasesAmount = periodPurchases.reduce((sum, po) => sum + po.totalAmount, 0);

    const periodExpenses = expenses.filter(e => isWithin(e.createdAt));
    const expensesAmount = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - expensesAmount;

    const newCustomersCount = customers.filter(c => c.createdAt && isWithin(c.createdAt)).length;

    const stockAdditions = periodPurchases.reduce((sum, po) => {
      return sum + po.items.reduce((itemSum, item) => itemSum + (item.quantity * item.costPrice), 0);
    }, 0);
    const inventoryGrowthVal = stockAdditions - cogs;

    return {
      revenue,
      refunds,
      netRevenue,
      cogs,
      grossProfit,
      purchasesAmount,
      expensesAmount,
      netProfit,
      salesCount,
      newCustomersCount,
      inventoryGrowthVal,
      periodSales,
      periodExpenses,
      periodPurchases
    };
  };

  // Metric Comparison Memo
  const metrics = useMemo(() => {
    const curr = getMetricsForPeriod(dateRange.start, dateRange.end);
    const prev = getMetricsForPeriod(dateRange.prevStart, dateRange.prevEnd);

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      revenue: { current: curr.revenue, previous: prev.revenue, growth: calculateGrowth(curr.revenue, prev.revenue) },
      netRevenue: { current: curr.netRevenue, previous: prev.netRevenue, growth: calculateGrowth(curr.netRevenue, prev.netRevenue) },
      grossProfit: { current: curr.grossProfit, previous: prev.grossProfit, growth: calculateGrowth(curr.grossProfit, prev.grossProfit) },
      netProfit: { current: curr.netProfit, previous: prev.netProfit, growth: calculateGrowth(curr.netProfit, prev.netProfit) },
      salesCount: { current: curr.salesCount, previous: prev.salesCount, growth: calculateGrowth(curr.salesCount, prev.salesCount) },
      purchasesAmount: { current: curr.purchasesAmount, previous: prev.purchasesAmount, growth: calculateGrowth(curr.purchasesAmount, prev.purchasesAmount) },
      expensesAmount: { current: curr.expensesAmount, previous: prev.expensesAmount, growth: calculateGrowth(curr.expensesAmount, prev.expensesAmount) },
      customersCount: { current: curr.newCustomersCount, previous: prev.newCustomersCount, growth: calculateGrowth(curr.newCustomersCount, prev.newCustomersCount) },
      inventoryGrowth: { current: curr.inventoryGrowthVal, previous: prev.inventoryGrowthVal, growth: calculateGrowth(curr.inventoryGrowthVal, prev.inventoryGrowthVal) },
      profitMargin: {
        current: curr.netRevenue > 0 ? (curr.grossProfit / curr.netRevenue) * 100 : 0,
        previous: prev.netRevenue > 0 ? (prev.grossProfit / prev.netRevenue) * 100 : 0,
        growth: curr.netRevenue > 0 && prev.netRevenue > 0 ? 
          ((curr.grossProfit / curr.netRevenue) - (prev.grossProfit / prev.netRevenue)) * 100 : 0
      },
      raw: curr
    };
  }, [dateRange, sales, returns, products, purchaseOrders, expenses, customers]);

  // Snapshot values
  const currentInventoryValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  }, [products]);
  const totalProductsCount = products.length;
  const productsInStock = products.filter(p => p.stock > 0).length;
  const lowStockCount = getLowStockProducts().length;

  const outstandingCustomerPayments = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.pendingAmount || 0), 0);
  }, [customers]);

  const outstandingSupplierPayments = useMemo(() => {
    return purchaseOrders.reduce((sum, po) => sum + (po.remainingBalance || 0), 0);
  }, [purchaseOrders]);

  // Business Health Score Analysis
  const healthDetails = useMemo(() => {
    let score = 75;
    const reasons: string[] = [];
    const recommendations: string[] = [];

    const revGrowth = metrics.revenue.growth;
    if (revGrowth > 10) {
      score += 10;
      reasons.push('Excellent revenue growth.');
    } else if (revGrowth < 0) {
      score -= 15;
      reasons.push('Declining sales trajectory.');
      recommendations.push('Introduce POS discount presets.');
    }

    const margin = metrics.profitMargin.current;
    if (margin > 35) {
      score += 10;
    } else if (margin < 15) {
      score -= 10;
    }

    const outOfStockRatio = totalProductsCount > 0 ? products.filter(p => p.stock <= 0).length / totalProductsCount : 0;
    if (outOfStockRatio > 0.15) {
      score -= 12;
      reasons.push('High stockout rate.');
      recommendations.push('Create new Purchase Orders.');
    }

    return {
      score: Math.max(10, Math.min(100, score)),
      reasons,
      recommendations
    };
  }, [metrics, totalProductsCount, products]);

  // Custom Report preview logic
  const generatedReportPreview = useMemo(() => {
    const isWithin = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        return d >= dateRange.start && d <= dateRange.end;
      } catch {
        return false;
      }
    };

    let data: any[] = [];
    let cols: { key: string; label: string }[] = [];

    if (builderType === 'sales') {
      const filtered = sales.filter(s => isWithin(s.createdAt));
      cols = [
        { key: 'date', label: 'Date' },
        { key: 'id', label: 'Sale ID' },
        { key: 'customer', label: 'Customer' },
        { key: 'payment', label: 'Payment Method' },
        { key: 'amount', label: 'Final Amount' }
      ];
      data = filtered.map(s => ({
        date: format(new Date(s.createdAt), 'yyyy-MM-dd HH:mm'),
        id: `#${s.id}`,
        customer: s.customerName || 'Walk-in Customer',
        payment: s.paymentMethod,
        amount: `Rs. ${s.finalAmount.toLocaleString()}`
      }));
    } else if (builderType === 'purchases') {
      const filtered = purchaseOrders.filter(po => isWithin(po.purchaseDate || po.createdAt));
      cols = [
        { key: 'date', label: 'Date' },
        { key: 'id', label: 'PO Number' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'status', label: 'Status' },
        { key: 'amount', label: 'Total Value' }
      ];
      data = filtered.map(po => ({
        date: po.purchaseDate || format(new Date(po.createdAt), 'yyyy-MM-dd'),
        id: po.purchaseNumber,
        supplier: po.supplierName,
        status: po.status,
        amount: `Rs. ${po.totalAmount.toLocaleString()}`
      }));
    } else if (builderType === 'inventory' || builderType === 'valuation') {
      cols = [
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Product Name' },
        { key: 'stock', label: 'Stock Qty' },
        { key: 'cost', label: 'Unit Cost' },
        { key: 'value', label: 'Valuation (Cost)' }
      ];
      data = products.map(p => ({
        sku: p.sku || 'N/A',
        name: p.name,
        stock: p.stock,
        cost: `Rs. ${p.cost.toLocaleString()}`,
        value: `Rs. ${(p.stock * p.cost).toLocaleString()}`
      }));
    } else if (builderType === 'expenses') {
      const filtered = expenses.filter(e => isWithin(e.createdAt));
      cols = [
        { key: 'date', label: 'Date' },
        { key: 'category', label: 'Category' },
        { key: 'desc', label: 'Description' },
        { key: 'amount', label: 'Amount' }
      ];
      data = filtered.map(e => ({
        date: format(new Date(e.createdAt), 'yyyy-MM-dd'),
        category: e.category || 'General',
        desc: e.description || 'N/A',
        amount: `Rs. ${e.amount.toLocaleString()}`
      }));
    } else {
      cols = [
        { key: 'metric', label: 'Financial Metric' },
        { key: 'value', label: 'Value (PKR)' }
      ];
      data = [
        { metric: 'Gross Sales Revenue', value: `Rs. ${metrics.revenue.current.toLocaleString()}` },
        { metric: 'Return Refunds Deductions', value: `Rs. ${metrics.raw.refunds.toLocaleString()}` },
        { metric: 'Net Revenue', value: `Rs. ${metrics.netRevenue.current.toLocaleString()}` },
        { metric: 'Cost of Goods Sold (COGS)', value: `Rs. ${metrics.raw.cogs.toLocaleString()}` },
        { metric: 'Gross Operating Profit', value: `Rs. ${metrics.grossProfit.current.toLocaleString()}` },
        { metric: 'Operational Outflow Expenses', value: `Rs. ${metrics.expensesAmount.current.toLocaleString()}` },
        { metric: 'Estimated Net Net Profit', value: `Rs. ${metrics.netProfit.current.toLocaleString()}` }
      ];
    }

    return { cols, data };
  }, [builderType, dateRange, sales, purchaseOrders, products, expenses, metrics]);

  // Export & Print actions
  const triggerExportAction = () => {
    let fileContent = '';
    const headers = generatedReportPreview.cols.map(c => c.label).join(',');
    const rows = generatedReportPreview.data.map(d => 
      generatedReportPreview.cols.map(c => `"${d[c.key]?.toString().replace(/"/g, '""') || ''}"`).join(',')
    );
    fileContent = `${headers}\n${rows.join('\n')}`;

    const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportFileName}.${exportFormat.toLowerCase() === 'excel' ? 'xls' : 'csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const newHistoryItem: ReportHistoryItem = {
      id: `HIST-${Date.now()}`,
      name: customReportName,
      type: builderType,
      generatedAt: new Date().toISOString(),
      format: exportFormat,
      filtersUsed: `${selectedPeriod} | ${builderType}`
    };
    const updatedHistory = [newHistoryItem, ...reportHistory];
    localStorage.setItem('khatabook_report_history', JSON.stringify(updatedHistory));
    setReportHistory(updatedHistory);
    setShowExportModal(false);
  };

  const handlePrintReport = () => {
    window.print();
    const newHistoryItem: ReportHistoryItem = {
      id: `HIST-${Date.now()}`,
      name: customReportName,
      type: builderType,
      generatedAt: new Date().toISOString(),
      format: 'Print',
      filtersUsed: `${selectedPeriod} | ${builderType}`
    };
    const updatedHistory = [newHistoryItem, ...reportHistory];
    localStorage.setItem('khatabook_report_history', JSON.stringify(updatedHistory));
    setReportHistory(updatedHistory);
  };

  // Templates
  const saveTemplate = () => {
    const newTemplate: ReportTemplate = {
      id: `TEMP-${Date.now()}`,
      name: customReportName,
      type: builderType,
      period: selectedPeriod,
      selectedColumns: builderColumns,
      filters: {},
      isFavorite: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newTemplate, ...savedTemplates];
    localStorage.setItem('khatabook_report_templates', JSON.stringify(updated));
    setSavedTemplates(updated);
    alert('Template saved successfully!');
  };

  const deleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    localStorage.setItem('khatabook_report_templates', JSON.stringify(updated));
    setSavedTemplates(updated);
  };

  const toggleFavoriteTemplate = (id: string) => {
    const updated = savedTemplates.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t);
    localStorage.setItem('khatabook_report_templates', JSON.stringify(updated));
    setSavedTemplates(updated);
  };

  // Sub-data calculations
  const salesByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    metrics.raw.periodSales.forEach(s => {
      s.items?.forEach(item => {
        const prod = products.find(p => p.id === item.product?.id);
        const catName = categories.find(c => c.id === prod?.categoryId)?.name || 'General';
        cats[catName] = (cats[catName] || 0) + item.subtotal;
      });
    });
    return Object.entries(cats).map(([name, amount]) => ({ name, amount }));
  }, [metrics.raw, products, categories]);

  const salesByPayment = useMemo(() => {
    const methods: Record<string, number> = { cash: 0, card: 0, credit: 0 };
    metrics.raw.periodSales.forEach(s => {
      const m = s.paymentMethod?.toLowerCase() || 'cash';
      methods[m] = (methods[m] || 0) + s.finalAmount;
    });
    return Object.entries(methods).map(([name, amount]) => ({ name, amount }));
  }, [metrics.raw]);

  const deadStock = useMemo(() => {
    return products.filter(p => {
      const sold = sales.some(s => s.items?.some(item => item.product?.id === p.id && new Date(s.createdAt) > subDays(new Date(), 90)));
      return !sold && p.stock > 0;
    }).slice(0, 5);
  }, [products, sales]);

  const fastMoving = useMemo(() => {
    const counts: Record<number, number> = {};
    sales.forEach(s => {
      s.items?.forEach(item => {
        if (!item.product) return;
        counts[item.product.id] = (counts[item.product.id] || 0) + item.quantity;
      });
    });
    return products
      .map(p => ({ product: p, sold: counts[p.id] || 0 }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [products, sales]);

  const categoryExpenses = useMemo(() => {
    const cats: Record<string, number> = {};
    metrics.raw.periodExpenses.forEach(e => {
      if (e.category) {
        cats[e.category] = (cats[e.category] || 0) + e.amount;
      }
    });
    return Object.entries(cats).map(([name, amount]) => ({
      name,
      amount,
      budget: 20000,
      utilization: (amount / 20000) * 100
    }));
  }, [metrics.raw]);

  const renderGrowthBadge = (value: number, isLowerGood = false) => {
    const isPositive = value >= 0;
    let isGood = isPositive;
    if (isLowerGood) isGood = !isPositive;
    const color = isLowerGood && !isPositive ? 'text-green-600 bg-green-50 dark:bg-green-950/20' : 
                  isGood ? 'text-green-600 bg-green-50 dark:bg-green-950/20' : 'text-red-600 bg-red-50 dark:bg-red-950/20';
    return (
      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-bold ${color}`}>
        {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        <span>{Math.abs(value).toFixed(1)}%</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in print:p-0 print:m-0">
      {/* Printable Wrapper */}
      <div className="hidden print:block space-y-6 text-black bg-white p-8">
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4">
          <div>
            <h1 className="text-3xl font-black">{customReportName}</h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">Generated Period: {dateRange.label}</p>
          </div>
          <div className="text-right text-xs">
            <h4 className="font-extrabold text-base">Counter Pro ERP</h4>
            <p className="text-gray-500">Corporate Executive Reporting</p>
            <p className="text-gray-500 mt-1">Generated: {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border border-gray-300 p-4 rounded-xl">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Net Revenue</span>
            <p className="text-base font-black">Rs. {metrics.netRevenue.current.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gross Profit</span>
            <p className="text-base font-black">Rs. {metrics.grossProfit.current.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Net Profit</span>
            <p className="text-base font-black">Rs. {metrics.netProfit.current.toLocaleString()}</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse text-xs mt-6">
          <thead>
            <tr className="border-b-2 border-gray-450 bg-gray-100 text-gray-700 font-extrabold">
              {generatedReportPreview.cols.map(col => (
                <th key={col.key} className="py-2 px-3">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {generatedReportPreview.data.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                {generatedReportPreview.cols.map(col => (
                  <td key={col.key} className="py-2.5 px-3">{row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-12 text-center text-[10px] text-gray-400 border-t pt-4">
          Confidential. Internal corporate financial summary sheets.
        </div>
      </div>

      {/* Screen Interface Wrapper (Hidden on print) */}
      <div className="print:hidden space-y-6">
        <PageHeader
          title="Corporate Reporting Center"
          subtitle="Custom builder, scheduled exports, and print layout configurations."
          icon={FileText}
          breadcrumbs={[
            { label: 'Home', onClick: () => window.location.hash = '#/' },
            { label: 'Reports' }
          ]}
          actions={[
            {
              label: 'Custom Report Builder',
              onClick: () => { setBuilderType('sales'); setActiveTab('builder'); },
              variant: 'primary'
            },
            {
              label: 'Print Current Preview',
              onClick: handlePrintReport,
              icon: Printer,
              variant: 'secondary'
            },
            {
              label: 'Export Center',
              onClick: () => setShowExportModal(true),
              icon: Download,
              variant: 'secondary'
            }
          ]}
        />

        {/* BI Subnavigation Header */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-100 dark:border-gray-800">
          {(['dashboard', 'sales', 'inventory', 'purchases', 'customers', 'suppliers', 'expenses', 'health', 'builder', 'templates', 'history', 'scheduled'] as AnalyticsTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-extrabold whitespace-nowrap capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
              }`}
            >
              {tab === 'health' ? 'Health & Insights' : tab === 'builder' ? 'Report Builder' : tab === 'templates' ? 'Templates' : tab === 'history' ? 'History Log' : tab === 'scheduled' ? 'Scheduler Settings' : `${tab} Intelligence`}
            </button>
          ))}
        </div>

        {/* ========================================== */}
        {/* Render Tabs */}
        {/* ========================================== */}

        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Net Revenue</span>
                <h4 className="text-base font-black text-gray-900 dark:text-white mt-1">Rs. {metrics.netRevenue.current.toLocaleString()}</h4>
                {renderGrowthBadge(metrics.netRevenue.growth)}
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Gross Profit</span>
                <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">Rs. {metrics.grossProfit.current.toLocaleString()}</h4>
                {renderGrowthBadge(metrics.grossProfit.growth)}
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Est. Net Profit</span>
                <h4 className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">Rs. {metrics.netProfit.current.toLocaleString()}</h4>
                {renderGrowthBadge(metrics.netProfit.growth)}
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Purchases</span>
                <h4 className="text-base font-black text-gray-900 dark:text-white mt-1">Rs. {metrics.purchasesAmount.current.toLocaleString()}</h4>
                {renderGrowthBadge(metrics.purchasesAmount.growth)}
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Expenses</span>
                <h4 className="text-base font-black text-gray-900 dark:text-white mt-1">Rs. {metrics.expensesAmount.current.toLocaleString()}</h4>
                {renderGrowthBadge(metrics.expensesAmount.growth, true)}
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Inv. Valuation</span>
                <h4 className="text-base font-black text-purple-600 dark:text-purple-400 mt-1">Rs. {currentInventoryValue.toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Cust. Dues</span>
                <h4 className="text-base font-black text-red-500 mt-1">Rs. {outstandingCustomerPayments.toLocaleString()}</h4>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                  <h3 className="text-lg font-bold">Smart Business Health Summary</h3>
                </div>
                <p className="text-sm text-blue-100 max-w-xl">
                  Your current score is <span className="font-extrabold text-yellow-300">{healthDetails.score}/100</span>.
                  {healthDetails.reasons[0] || 'Business parameters operating within normal thresholds.'}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('health')}
                className="px-5 py-2.5 bg-white text-blue-600 rounded-xl text-xs font-black shadow-sm hover:bg-blue-50 transition-all self-start md:self-auto"
              >
                View Full Insights Panel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-blue-500 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Sales Intelligence</span>
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white">{metrics.salesCount.current} Transactions Logged</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total volume value matches <span className="font-bold text-gray-800 dark:text-gray-200">Rs. {metrics.netRevenue.current.toLocaleString()}</span></p>
                </div>
                <button 
                  onClick={() => navigate('/sales-history')}
                  className="mt-4 w-full py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors"
                >
                  <span>Drill down to Sales Ledger</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-purple-500 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Inventory Health</span>
                    <Package className="h-4 w-4 text-purple-500" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white">{productsInStock} / {totalProductsCount} Items Active</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {lowStockCount > 0 ? `${lowStockCount} items below safety parameters.` : 'Stock levels look healthy.'}
                  </p>
                </div>
                <button 
                  onClick={() => handleDrillDown('#/inventory', 'tab=products')}
                  className="mt-4 w-full py-2 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1 hover:bg-purple-100 transition-colors"
                >
                  <span>Drill down to Inventory</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-teal-500 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer Outstanding</span>
                    <Users className="h-4 w-4 text-teal-500" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white">Rs. {outstandingCustomerPayments.toLocaleString()} Receivable</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Customer profiles active: <span className="font-bold">{customers.length} ledger sheets</span></p>
                </div>
                <button 
                  onClick={() => handleDrillDown('#/customers', 'tab=balances&filter=outstanding')}
                  className="mt-4 w-full py-2 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1 hover:bg-teal-100 transition-colors"
                >
                  <span>Drill down to Balances</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Sales Tab */}
        {activeTab === 'sales' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Revenue Distribution by Category</h3>
              <div className="space-y-3">
                {salesByCategory.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No sales recorded under categories.</p>
                ) : (
                  salesByCategory.map(c => {
                    const pct = metrics.revenue.current > 0 ? (c.amount / metrics.revenue.current) * 100 : 0;
                    return (
                      <div key={c.name} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span>{c.name}</span>
                          <span>Rs. {c.amount.toLocaleString()} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Payment Method Analytics</h3>
              <div className="space-y-3">
                {salesByPayment.map(p => {
                  const totalAmt = salesByPayment.reduce((sum, item) => sum + item.amount, 0);
                  const pct = totalAmt > 0 ? (p.amount / totalAmt) * 100 : 0;
                  return (
                    <div key={p.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">
                        <span>{p.name}</span>
                        <span>Rs. {p.amount.toLocaleString()} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4 lg:col-span-2">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Top Selling Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-805 text-gray-400 font-bold">
                      <th className="py-2.5">Product Name</th>
                      <th>Price</th>
                      <th>Cost</th>
                      <th>Sold Qty</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-300 font-semibold">
                    {fastMoving.slice(0, 5).map(item => (
                      <tr key={item.product.id} className="border-b border-gray-50 dark:border-gray-850/50">
                        <td className="py-2.5 text-gray-900 dark:text-white">{item.product.name}</td>
                        <td>Rs. {item.product.price.toLocaleString()}</td>
                        <td>Rs. {item.product.cost.toLocaleString()}</td>
                        <td className="text-blue-500 font-bold">{item.sold} units</td>
                        <td>Rs. {(item.sold * item.product.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-805 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Inventory Turnover Ratio</span>
                <h4 className="text-xl font-black text-gray-900 dark:text-white mt-2">
                  {((metrics.revenue.current / Math.max(1, currentInventoryValue)) * 100).toFixed(1)}%
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Ratio of sales volume against asset investment value.</p>
              </div>
              <div className="bg-white dark:bg-gray-805 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dead Stock Items (90d)</span>
                <h4 className="text-xl font-black text-rose-500 mt-2">{deadStock.length} Products</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Products currently sitting in warehouse with 0 sales velocity.</p>
              </div>
              <div className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Overstocked (Safety Margins)</span>
                <h4 className="text-xl font-black text-amber-500 mt-2">
                  {products.filter(p => p.stock > p.minStock * 5).length} Items
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Items currently holding assets over 5x low stock threshold.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-3">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-sm text-rose-500 flex items-center gap-1.5">
                  <AlertTriangle className="h-4.5 w-4.5" />
                  <span>Dead Stock Ledger Detail</span>
                </h3>
                <div className="space-y-2">
                  {deadStock.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">All cataloged inventory shows sales movements.</p>
                  ) : (
                    deadStock.map(p => (
                      <div key={p.id} className="flex justify-between items-center text-xs p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                        <span className="font-bold text-gray-900 dark:text-white">{p.name}</span>
                        <span className="text-gray-500">{p.stock} in stock (Rs. {p.cost * p.stock} asset cost)</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-3">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-sm text-green-500">Fast Moving Product Index</h3>
                <div className="space-y-2">
                  {fastMoving.slice(0, 5).map(item => (
                    <div key={item.product.id} className="flex justify-between items-center text-xs p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                      <span className="font-bold text-gray-900 dark:text-white">{item.product.name}</span>
                      <span className="text-emerald-600 font-bold">{item.sold} units sold in period</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg Purchase Order Value</span>
                <h4 className="text-xl font-black text-gray-900 dark:text-white mt-2">
                  Rs. {(metrics.raw.periodPurchases.reduce((sum, po) => sum + po.totalAmount, 0) / Math.max(1, metrics.raw.periodPurchases.length)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h4>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Outstanding Supplier Balances</span>
                <h4 className="text-xl font-black text-rose-500 mt-2">Rs. {outstandingSupplierPayments.toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total PO Procurement Count</span>
                <h4 className="text-xl font-black text-gray-900 dark:text-white mt-2">{metrics.raw.periodPurchases.length} Purchase Orders</h4>
              </div>
            </div>
          </div>
        )}

        {/* 5. Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Returning Customer Rate</span>
                <h4 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-2">
                  {((customers.filter(c => sales.filter(s => s.customerId === c.id).length > 1).length / Math.max(1, customers.length)) * 100).toFixed(1)}%
                </h4>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer Lifetime Value (Averages)</span>
                <h4 className="text-xl font-black text-emerald-600 mt-2">
                  Rs. {(metrics.revenue.current / Math.max(1, customers.length)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h4>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New CRM Registrations</span>
                <h4 className="text-xl font-black text-indigo-600 mt-2">+{metrics.customersCount.current} Clients</h4>
              </div>
            </div>
          </div>
        )}

        {/* 6. Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Procurement distribution per Supplier</h3>
              <div className="space-y-3">
                {suppliers.map(s => {
                  const totalProcured = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
                  const supplierAmt = purchaseOrders.filter(po => po.supplierId === s.id).reduce((sum, po) => sum + po.totalAmount, 0);
                  const pct = totalProcured > 0 ? (supplierAmt / totalProcured) * 100 : 0;
                  return (
                    <div key={s.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <span>{s.name}</span>
                        <span>Rs. {supplierAmt.toLocaleString()} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 7. Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Expenses Category budget utilization</h3>
              <div className="space-y-3.5">
                {categoryExpenses.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No expenses registered in this period.</p>
                ) : (
                  categoryExpenses.map(c => (
                    <div key={c.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <span>{c.name}</span>
                        <span>Rs. {c.amount.toLocaleString()} / Rs. {c.budget.toLocaleString()} ({c.utilization.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${c.utilization > 90 ? 'bg-rose-500' : 'bg-orange-500'}`} 
                          style={{ width: `${Math.min(100, c.utilization)}%` }} 
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="transparent" className="dark:stroke-gray-800" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="#3b82f6" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthDetails.score / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute text-center space-y-0.5">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">{healthDetails.score}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Health Index</span>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Commercial Health Index Analysis</h3>
                <div className="space-y-1.5">
                  {healthDetails.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Actionable Intelligence Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {smartInsights.map(insight => (
                  <div 
                    key={insight.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between h-44 transition-all ${
                      insight.type === 'warning' ? 'bg-amber-50/20 border-amber-200/50 dark:border-amber-800/30' :
                      insight.type === 'success' ? 'bg-green-50/20 border-green-200/50 dark:border-green-800/30' :
                      'bg-blue-50/20 border-blue-200/50 dark:border-blue-800/30'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">{insight.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{insight.desc}</p>
                    </div>
                    <button
                      onClick={insight.action}
                      className="self-start text-xs font-black flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-405"
                    >
                      <span>{insight.actionText}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9. Builder Tab */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4 h-fit">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Customizer Parameters</h3>
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-gray-400 font-bold uppercase">Report Category Type</label>
                  <select 
                    value={builderType}
                    onChange={(e) => setBuilderType(e.target.value as ReportType)}
                    className="w-full p-2 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl font-semibold"
                  >
                    <option value="sales">Sales Ledger Summary</option>
                    <option value="purchases">Procurements Purchase Orders</option>
                    <option value="inventory">Warehouse Inventory valuation</option>
                    <option value="expenses">Outflow Operations Expenses</option>
                    <option value="pnl">Profit & Loss Statements</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 font-bold uppercase">Configure Period Scope</label>
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as DatePeriod)}
                    className="w-full p-2 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl font-semibold"
                  >
                    <option value="today">Today</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="thisMonth">This Month</option>
                    <option value="thisYear">This Year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 font-bold uppercase">Report Name Layout</label>
                  <input 
                    type="text"
                    value={customReportName}
                    onChange={(e) => setCustomReportName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl font-semibold"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={saveTemplate}
                    className="flex-1 py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>Save Template</span>
                  </button>
                  <button 
                    onClick={handlePrintReport}
                    className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Printer className="h-4.5 w-4.5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Live Compilation Report Preview</h3>
                <span className="text-[10px] text-gray-400 uppercase font-bold">{dateRange.label}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-805 text-gray-400 font-bold">
                      {generatedReportPreview.cols.map(c => (
                        <th key={c.key} className="py-2 px-1">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-300 font-semibold">
                    {generatedReportPreview.data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">No matching records found for parameters.</td>
                      </tr>
                    ) : (
                      generatedReportPreview.data.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-50 dark:border-gray-850/50 hover:bg-gray-50/50">
                          {generatedReportPreview.cols.map(c => (
                            <td key={c.key} className="py-2.5 px-1">{row[c.key]}</td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 10. Templates Tab */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTemplates.map(t => (
              <div key={t.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-40">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{t.name}</h4>
                    <button 
                      onClick={() => toggleFavoriteTemplate(t.id)}
                      className={`p-1 ${t.isFavorite ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star className="h-4.5 w-4.5 fill-current" />
                    </button>
                  </div>
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-950/20 text-blue-600 px-2 py-0.5 rounded-md font-bold uppercase inline-block">{t.type}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-805">
                  <button 
                    onClick={() => { setBuilderType(t.type); setSelectedPeriod(t.period); setActiveTab('builder'); }}
                    className="text-xs font-black text-blue-600"
                  >
                    Load in Builder
                  </button>
                  <button 
                    onClick={() => deleteTemplate(t.id)}
                    className="p-1 text-gray-400 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 11. History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Report Generation Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-805 text-gray-400 font-bold">
                    <th className="py-2.5">Report Title</th>
                    <th>Date Generated</th>
                    <th>Format</th>
                    <th>Parameters</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300 font-semibold">
                  {reportHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-400">No reports generated yet.</td>
                    </tr>
                  ) : (
                    reportHistory.map(h => (
                      <tr key={h.id} className="border-b border-gray-50 dark:border-gray-850/50">
                        <td className="py-2.5 text-gray-900 dark:text-white">{h.name}</td>
                        <td>{format(new Date(h.generatedAt), 'yyyy-MM-dd HH:mm')}</td>
                        <td>
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold">{h.format}</span>
                        </td>
                        <td>{h.filtersUsed}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 12. Scheduled Tab */}
        {activeTab === 'scheduled' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-sm space-y-6 max-w-xl">
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Automatic Scheduled Reports</h3>
              <p className="text-xs text-gray-400">Deliver professional PDF metrics summaries straight to your accountant's inbox. (Cloud sync ready)</p>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-gray-400 uppercase">Fulfillment Interval</label>
                <select 
                  value={scheduleConfig.frequency}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-805 border border-gray-250 rounded-xl"
                >
                  <option value="daily">Daily Summary Logs</option>
                  <option value="weekly">Weekly Business Overview</option>
                  <option value="monthly">Monthly Financial Balance Sheet</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 uppercase">Recipient Email</label>
                <input 
                  type="email" 
                  value={scheduleConfig.email}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="accountant@company.com"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-805 border border-gray-250 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <input 
                  type="checkbox" 
                  checked={scheduleConfig.isActive}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Enable Automated Schedule Trigger</p>
                  <p className="text-[10px] text-gray-400">Background tasks will run periodically inside cloud syncing nodes once initialized.</p>
                </div>
              </div>

              <button 
                onClick={() => alert('Fulfillment schedule template configured locally. Will synchronize on cloud backup activation.')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-750 text-white font-black rounded-xl"
              >
                Confirm Scheduler Template Settings
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Export center dialog modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6 animate-scale-up text-xs font-semibold">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-gray-900 dark:text-white">Corporate Export Parameters</h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-gray-400 uppercase">Export File Format</label>
                <div className="flex gap-2">
                  {['PDF', 'Excel', 'CSV'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt as any)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                        exportFormat === fmt ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-gray-50 dark:bg-gray-800 border-gray-250 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 uppercase">File Target Name</label>
                <input 
                  type="text"
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-855 border border-gray-250 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase">Paper Layout</label>
                  <select 
                    value={exportPaperSize} 
                    onChange={(e) => setExportPaperSize(e.target.value as any)}
                    className="w-full p-2 bg-gray-55 dark:bg-gray-800 border border-gray-250 rounded-xl"
                  >
                    <option value="A4">A4 Standard</option>
                    <option value="Letter">Letter Sheet</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase">Orientation</label>
                  <select 
                    value={exportOrientation} 
                    onChange={(e) => setExportOrientation(e.target.value as any)}
                    className="w-full p-2 bg-gray-55 dark:bg-gray-800 border border-gray-250 rounded-xl"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            </div>

            <button 
              onClick={triggerExportAction}
              className="w-full py-3 bg-blue-600 hover:bg-blue-750 text-white font-black rounded-2xl shadow-md transition-colors"
            >
              Initialize Document Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;