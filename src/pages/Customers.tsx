import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit, Trash2, Phone, Mail, MapPin, DollarSign, MessageCircle, Receipt,
  ChevronLeft, User, Upload, Download, Filter, Check, X, Calendar, ArrowUpRight,
  Activity, Briefcase, Award, ShieldAlert, FileText, Sparkles, Clock, ArrowRight,
  ChevronDown, Grid, List, AlertCircle, PhoneCall, Save, PlusCircle, BarChart3,
  TrendingUp, Coins, RotateCcw, FileSpreadsheet, Settings, Percent, RefreshCw,
  ShoppingBag, ShieldCheck
} from 'lucide-react';
import { useCustomerStore, Customer, CustomerPayment, CustomerLoyaltyHistory } from '../stores/customersStore';
import { usePOSStore } from '../stores/posStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useReturnsStore } from '../stores/returnsStore';
import { generatePDFReceipt } from '../utils/pdfReceiptGenerator';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';
import EmptyState from '../components/EmptyState';
import DetailPageLayout from '../components/DetailPageLayout';

const Customers: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Stores
  const { 
    customers, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    getCustomerById,
    getCustomerPayments,
    addCustomerPayment,
    getCustomerLoyaltyHistory,
    addCustomerLoyaltyHistory
  } = useCustomerStore();
  const { sales, selectCustomer } = usePOSStore();
  const { shopSettings } = useSettingsStore();
  const { products, categories } = useInventoryStore();
  const { returns, initializeReturns } = useReturnsStore();

  useEffect(() => {
    initializeReturns();
  }, [initializeReturns]);

  useEffect(() => {
    const handleHashChange = () => {
      const hashParts = window.location.hash.split('?');
      if (hashParts[0] === '#/customers') {
        const queryParams = new URLSearchParams(hashParts[1] || '');
        const tab = queryParams.get('tab');
        const filter = queryParams.get('filter');
        if (tab === 'balances') {
          setActiveTab('balances');
        } else if (tab === 'dashboard') {
          setActiveTab('dashboard');
        } else if (tab === 'loyalty') {
          setActiveTab('loyalty');
        } else if (tab === 'directory') {
          setActiveTab('directory');
        }
        
        if (filter === 'outstanding') {
          setBalanceFilter('has_balance');
        } else if (filter === 'no_balance') {
          setBalanceFilter('no_balance');
        }
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Main Page Navigation: 'directory' | 'dashboard' | 'balances' | 'loyalty' | 'profile'
  const [activeTab, setActiveTab] = useState<'directory' | 'dashboard' | 'balances' | 'loyalty'>('directory');
  const [activeView, setActiveView] = useState<'list' | 'profile'>('list');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // UI States
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Profile views & details states
  const [profileTab, setProfileTab] = useState<'overview' | 'sales' | 'returns' | 'payments' | 'loyalty' | 'timeline'>('overview');
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [customerLoyalty, setCustomerLoyalty] = useState<CustomerLoyaltyHistory[]>([]);
  const [profileNotes, setProfileNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Loyalty Config Rule State
  const [loyaltyConfig, setLoyaltyConfig] = useState(() => {
    const saved = localStorage.getItem('khatabook_loyalty_config');
    return saved ? JSON.parse(saved) : { pointsPerAmount: 100, valPerPoint: 1, enabled: true };
  });

  // Tiers Config thresholds
  const [tierConfig, setTierConfig] = useState(() => {
    const saved = localStorage.getItem('khatabook_tier_config');
    return saved ? JSON.parse(saved) : { silverMin: 10000, goldMin: 30000, platinumMin: 100000 };
  });

  // Custom customer groups
  const [customerGroups, setCustomerGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('khatabook_customer_groups');
    return saved ? JSON.parse(saved) : ['Regular', 'VIP', 'Wholesale', 'Corporate'];
  });
  const [newGroupInput, setNewGroupInput] = useState('');
  const [showNewGroupField, setShowNewGroupField] = useState(false);

  // Directory Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'has_balance' | 'no_balance'>('all');
  const [minSpending, setMinSpending] = useState<string>('');
  const [maxSpending, setMaxSpending] = useState<string>('');
  const [regDateStart, setRegDateStart] = useState<string>('');
  const [regDateEnd, setRegDateEnd] = useState<string>('');

  // Import preview
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importReport, setImportReport] = useState<{
    total: number;
    imported: number;
    duplicates: string[];
    data: any[];
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    billingAddress: '',
    shippingAddress: '',
    customerType: 'Regular',
    status: 'Active',
    notes: '',
    pendingAmount: 0,
    loyaltyPoints: 0
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: ''
  });

  const [redeemFormData, setRedeemFormData] = useState({
    points: '',
    notes: ''
  });

  // Automatically calculate Tier based on spending
  const getCustomerTier = (lifetimeSpending: number) => {
    if (lifetimeSpending >= tierConfig.platinumMin) {
      return { name: 'Platinum', badge: '💎 Platinum', color: 'bg-slate-900 text-slate-100 border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600', pointsMult: 2 };
    }
    if (lifetimeSpending >= tierConfig.goldMin) {
      return { name: 'Gold', badge: '👑 Gold', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30', pointsMult: 1.5 };
    }
    if (lifetimeSpending >= tierConfig.silverMin) {
      return { name: 'Silver', badge: '🥈 Silver', color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', pointsMult: 1.2 };
    }
    return { name: 'Bronze', badge: '🥉 Bronze', color: 'bg-orange-50 text-orange-700 border-orange-150 dark:bg-orange-950/20 dark:text-orange-450 dark:border-orange-900/20', pointsMult: 1 };
  };

  // Derive stats for single customer
  const getCustomerStats = useMemo(() => {
    const statsCache: Record<number, {
      totalSpent: number;
      totalOrders: number;
      avgOrderVal: number;
      firstPurchaseDate: Date | null;
      lastPurchaseDate: Date | null;
      favProducts: string[];
      favCategories: string[];
      favPaymentMethod: string;
      tier: { name: string; badge: string; color: string };
    }> = {};

    customers.forEach(customer => {
      const customerSales = sales.filter(sale => sale.customerId === customer.id);
      const totalSpent = customerSales.reduce((sum, s) => sum + s.finalAmount, 0);
      const totalOrders = customerSales.length;
      const avgOrderVal = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Dates
      const sortedSales = [...customerSales].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const firstPurchaseDate = sortedSales[0] ? new Date(sortedSales[0].createdAt) : null;
      const lastPurchaseDate = sortedSales[sortedSales.length - 1] ? new Date(sortedSales[sortedSales.length - 1].createdAt) : null;

      // Favorite Products (Top 3)
      const prodCounts: Record<string, number> = {};
      const catCounts: Record<string, number> = {};
      const payCounts: Record<string, number> = {};

      customerSales.forEach(sale => {
        // Payment methods count
        const payMethod = sale.paymentMethod || 'cash';
        payCounts[payMethod] = (payCounts[payMethod] || 0) + 1;

        // Items count
        if (sale.items) {
          sale.items.forEach(item => {
            const pName = item.product?.name || item.productName || 'Unknown Product';
            prodCounts[pName] = (prodCounts[pName] || 0) + item.quantity;

            // Categories lookup
            const prod = products.find(p => p.name === pName || p.id === item.product?.id);
            if (prod) {
              const cat = categories.find(c => c.id === prod.categoryId);
              if (cat) {
                catCounts[cat.name] = (catCounts[cat.name] || 0) + item.quantity;
              }
            }
          });
        }
      });

      const favProducts = Object.entries(prodCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

      const favCategories = Object.entries(catCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(entry => entry[0]);

      const favPaymentMethod = Object.entries(payCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Cash';

      const tier = getCustomerTier(totalSpent);

      statsCache[customer.id] = {
        totalSpent,
        totalOrders,
        avgOrderVal,
        firstPurchaseDate,
        lastPurchaseDate,
        favProducts,
        favCategories,
        favPaymentMethod,
        tier
      };
    });

    return (customerId: number) => {
      return statsCache[customerId] || {
        totalSpent: 0,
        totalOrders: 0,
        avgOrderVal: 0,
        firstPurchaseDate: null,
        lastPurchaseDate: null,
        favProducts: [],
        favCategories: [],
        favPaymentMethod: 'Cash',
        tier: { name: 'Bronze', badge: '🥉 Bronze', color: 'bg-orange-50 text-orange-700 border-orange-150' }
      };
    };
  }, [customers, sales, products, categories, tierConfig]);

  // Load profile data on selection
  useEffect(() => {
    if (selectedCustomerId) {
      getCustomerPayments(selectedCustomerId).then(setCustomerPayments);
      getCustomerLoyaltyHistory(selectedCustomerId).then(setCustomerLoyalty);
      const cust = getCustomerById(selectedCustomerId);
      if (cust) {
        setProfileNotes(cust.notes || '');
      }
    }
  }, [selectedCustomerId, getCustomerPayments, getCustomerLoyaltyHistory, getCustomerById, customers]);

  // Main list filters
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // 1. Search Query
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        String(customer.id).includes(searchTerm);

      if (!matchesSearch) return false;

      // 2. Group Filter
      if (selectedGroup !== 'All' && customer.customerType !== selectedGroup) return false;

      // 3. Status Filter
      if (selectedStatus !== 'All' && (customer.status || 'Active') !== selectedStatus) return false;

      // 4. Balance Filter
      if (balanceFilter === 'has_balance' && customer.pendingAmount <= 0) return false;
      if (balanceFilter === 'no_balance' && customer.pendingAmount > 0) return false;

      // Spend filters
      const stats = getCustomerStats(customer.id);
      if (minSpending !== '' && stats.totalSpent < parseFloat(minSpending)) return false;
      if (maxSpending !== '' && stats.totalSpent > parseFloat(maxSpending)) return false;

      // Dates
      if (regDateStart) {
        const start = new Date(regDateStart);
        if (new Date(customer.createdAt) < start) return false;
      }
      if (regDateEnd) {
        const end = new Date(regDateEnd);
        end.setHours(23, 59, 59, 999);
        if (new Date(customer.createdAt) > end) return false;
      }

      return true;
    });
  }, [customers, searchTerm, selectedGroup, selectedStatus, balanceFilter, minSpending, maxSpending, regDateStart, regDateEnd, getCustomerStats]);

  // =========================================================
  // ANALYTICS & INSIGHTS CALCULATIONS
  // =========================================================
  const dashboardKPIs = useMemo(() => {
    const total = customers.length;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newThisMonth = customers.filter(c => new Date(c.createdAt) >= startOfMonth).length;
    
    let returning = 0;
    let active = 0;
    let inactive = 0;
    let vips = 0;
    let hasBalance = 0;
    let totalSpendingSum = 0;

    customers.forEach(c => {
      const stats = getCustomerStats(c.id);
      if (stats.totalOrders > 1) returning++;
      if ((c.status || 'Active') === 'Active') active++;
      else inactive++;
      if (c.customerType === 'VIP') vips++;
      if (c.pendingAmount > 0) hasBalance++;
      totalSpendingSum += stats.totalSpent;
    });

    const avgSpending = total > 0 ? totalSpendingSum / total : 0;

    return {
      total,
      newThisMonth,
      returning,
      active,
      inactive,
      vips,
      hasBalance,
      avgSpending
    };
  }, [customers, getCustomerStats]);

  // Segment Analytics Lists
  const analyticsLists = useMemo(() => {
    const scoredCustomers = customers.map(c => {
      const stats = getCustomerStats(c.id);
      return {
        customer: c,
        stats
      };
    });

    const topSpending = [...scoredCustomers]
      .sort((a, b) => b.stats.totalSpent - a.stats.totalSpent)
      .slice(0, 5);

    const mostFrequent = [...scoredCustomers]
      .sort((a, b) => b.stats.totalOrders - a.stats.totalOrders)
      .slice(0, 5);

    const highestAOV = [...scoredCustomers]
      .filter(x => x.stats.totalOrders > 0)
      .sort((a, b) => b.stats.avgOrderVal - a.stats.avgOrderVal)
      .slice(0, 5);

    const recentlyActive = [...scoredCustomers]
      .filter(x => x.stats.lastPurchaseDate !== null)
      .sort((a, b) => b.stats.lastPurchaseDate!.getTime() - a.stats.lastPurchaseDate!.getTime())
      .slice(0, 5);

    const inactiveCustomersList = [...scoredCustomers]
      .filter(x => x.customer.status === 'Inactive' || (x.stats.lastPurchaseDate && (new Date().getTime() - x.stats.lastPurchaseDate.getTime()) > 60 * 24 * 60 * 60 * 1000))
      .slice(0, 5);

    // Fastest growing (registered in past 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fastestGrowing = [...scoredCustomers]
      .filter(x => new Date(x.customer.createdAt) >= thirtyDaysAgo)
      .sort((a, b) => b.stats.totalSpent - a.stats.totalSpent)
      .slice(0, 5);

    return {
      topSpending,
      mostFrequent,
      highestAOV,
      recentlyActive,
      inactiveCustomersList,
      fastestGrowing
    };
  }, [customers, getCustomerStats]);

  // =========================================================
  // ACTIONS IMPLEMENTATIONS
  // =========================================================

  // Handle Add/Edit Customer Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const preparedData = {
      ...formData,
      billingAddress: formData.billingAddress || formData.address,
      shippingAddress: formData.shippingAddress || formData.address,
      pendingAmount: Number(formData.pendingAmount),
      loyaltyPoints: Number(formData.loyaltyPoints)
    };

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, preparedData);
      setEditingCustomer(null);
    } else {
      await addCustomer(preparedData);
    }

    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      billingAddress: '',
      shippingAddress: '',
      customerType: 'Regular',
      status: 'Active',
      notes: '',
      pendingAmount: 0,
      loyaltyPoints: 0
    });
    setShowAddModal(false);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      billingAddress: customer.billingAddress || customer.address || '',
      shippingAddress: customer.shippingAddress || customer.address || '',
      customerType: customer.customerType || 'Regular',
      status: customer.status || 'Active',
      notes: customer.notes || '',
      pendingAmount: customer.pendingAmount,
      loyaltyPoints: customer.loyaltyPoints || 0
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete customer permanently? This will clear all loyalty histories, credit ledgers, and profile insights.')) {
      await deleteCustomer(id);
      if (selectedCustomerId === id) {
        setActiveView('list');
        setSelectedCustomerId(null);
      }
    }
  };

  // Record manual payments
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !paymentFormData.amount) return;

    const payAmount = parseFloat(paymentFormData.amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    try {
      await addCustomerPayment({
        customerId: selectedCustomerId,
        amount: payAmount,
        paymentMethod: paymentFormData.paymentMethod,
        notes: paymentFormData.notes
      });

      // Also adjust loyalty history if payment earns points (custom settings) or just manual adjust
      setPaymentFormData({ amount: '', paymentMethod: 'cash', notes: '' });
      setShowPaymentModal(false);

      // Reload local data
      const updatedP = await getCustomerPayments(selectedCustomerId);
      setCustomerPayments(updatedP);
    } catch (e) {
      alert('Failed to record payment.');
    }
  };

  // Redeem points manual collection
  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !redeemFormData.points) return;

    const redeemPts = parseInt(redeemFormData.points, 10);
    const cust = getCustomerById(selectedCustomerId);
    if (!cust || isNaN(redeemPts) || redeemPts <= 0) {
      alert('Please enter a valid points quantity.');
      return;
    }

    if (redeemPts > (cust.loyaltyPoints || 0)) {
      alert('Customer has insufficient points balance.');
      return;
    }

    try {
      await addCustomerLoyaltyHistory({
        customerId: selectedCustomerId,
        points: -redeemPts,
        transactionType: 'redeem',
        referenceType: 'manual',
        referenceId: `RED-${Math.floor(Math.random() * 900000 + 100000)}`,
        notes: redeemFormData.notes || 'Redeemed points in store'
      });

      setRedeemFormData({ points: '', notes: '' });
      setShowRedeemModal(false);

      const updatedL = await getCustomerLoyaltyHistory(selectedCustomerId);
      setCustomerLoyalty(updatedL);
    } catch (e) {
      alert('Failed to redeem points.');
    }
  };

  // Save internal notes
  const handleSaveProfileNotes = async () => {
    if (!selectedCustomerId) return;
    setIsSavingNotes(true);
    try {
      await updateCustomer(selectedCustomerId, { notes: profileNotes });
    } catch (e) {
      alert('Failed to save notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Save Config Rules
  const handleSaveLoyaltyRules = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('khatabook_loyalty_config', JSON.stringify(loyaltyConfig));
    alert('Loyalty Rules configuration saved successfully.');
  };

  const handleSaveTiersRules = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('khatabook_tier_config', JSON.stringify(tierConfig));
    alert('Customer Tier configurations saved successfully.');
  };

  // Add Custom Groups
  const handleAddCustomGroup = () => {
    if (!newGroupInput.trim()) return;
    const normalized = newGroupInput.trim();
    if (customerGroups.includes(normalized)) {
      alert('Group already exists.');
      return;
    }
    const updated = [...customerGroups, normalized];
    setCustomerGroups(updated);
    localStorage.setItem('khatabook_customer_groups', JSON.stringify(updated));
    setNewGroupInput('');
    setShowNewGroupField(false);
  };

  const handleResetFilters = () => {
    setSelectedGroup('All');
    setSelectedStatus('All');
    setBalanceFilter('all');
    setMinSpending('');
    setMaxSpending('');
    setRegDateStart('');
    setRegDateEnd('');
  };

  // Pre-select and start sale
  const handleStartSale = (customer: Customer) => {
    selectCustomer(customer);
    navigate('/pos');
  };

  const handleSendWhatsAppReminder = (customer: Customer) => {
    const message = `السلام علیکم ${customer.name},\n\nیہ ایک یاد دہانی ہے کہ آپ کا بقایا روپے ہے۔${customer.pendingAmount.toFixed(2)}.\n\nThank you!\n\n${shopSettings.shopName || 'Our Shop'}`;
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // =========================================================
  // REPORTS EXPORTERS
  // =========================================================
  const exportReportCSV = (reportType: 'directory' | 'spending' | 'balances' | 'loyalty' | 'activity') => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let fileName = `counter_pro_${reportType}_report`;

    const BOM = '\uFEFF';

    if (reportType === 'directory') {
      headers = ['Customer ID', 'Name', 'Phone', 'Email', 'Group', 'Tier', 'Status', 'Outstanding Balance', 'Loyalty Points', 'Registered Date'];
      rows = customers.map(c => {
        const stats = getCustomerStats(c.id);
        return [
          c.id,
          `"${c.name.replace(/"/g, '""')}"`,
          c.phone || '',
          c.email || '',
          c.customerType || 'Regular',
          stats.tier.name,
          c.status || 'Active',
          c.pendingAmount || 0,
          c.loyaltyPoints || 0,
          c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
        ];
      });
    } 
    else if (reportType === 'spending') {
      headers = ['Customer ID', 'Name', 'Lifetime Spending', 'Total Orders', 'Average Order Value', 'Last Purchase Date'];
      rows = customers.map(c => {
        const stats = getCustomerStats(c.id);
        return [
          c.id,
          `"${c.name.replace(/"/g, '""')}"`,
          stats.totalSpent,
          stats.totalOrders,
          stats.avgOrderVal,
          stats.lastPurchaseDate ? stats.lastPurchaseDate.toLocaleDateString() : 'Never'
        ];
      });
    }
    else if (reportType === 'balances') {
      headers = ['Customer ID', 'Customer Name', 'Outstanding Balance', 'Phone Number', 'Last Purchase Date'];
      rows = customers
        .filter(c => c.pendingAmount > 0)
        .map(c => {
          const stats = getCustomerStats(c.id);
          return [
            c.id,
            `"${c.name.replace(/"/g, '""')}"`,
            c.pendingAmount,
            c.phone || '',
            stats.lastPurchaseDate ? stats.lastPurchaseDate.toLocaleDateString() : 'Never'
          ];
        });
    }
    else if (reportType === 'loyalty') {
      headers = ['Customer ID', 'Customer Name', 'Tier', 'Available Points', 'Lifetime Spending'];
      rows = customers.map(c => {
        const stats = getCustomerStats(c.id);
        return [
          c.id,
          `"${c.name.replace(/"/g, '""')}"`,
          stats.tier.name,
          c.loyaltyPoints || 0,
          stats.totalSpent
        ];
      });
    }
    else if (reportType === 'activity') {
      headers = ['Customer ID', 'Customer Name', 'Action / Event Type', 'Description', 'Timestamp'];
      customers.forEach(c => {
        const cSales = sales.filter(s => s.customerId === c.id);
        rows.push([
          c.id,
          `"${c.name.replace(/"/g, '""')}"`,
          'Registration',
          `Added as a ${c.customerType || 'Regular'} customer`,
          c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
        ]);
        cSales.forEach(s => {
          rows.push([
            c.id,
            `"${c.name.replace(/"/g, '""')}"`,
            'Purchase Order',
            `Invoice #${s.id} totaling Rs. ${s.finalAmount.toFixed(2)}`,
            new Date(s.createdAt).toLocaleDateString()
          ]);
        });
      });
    }

    const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReportPDF = (reportType: 'directory' | 'spending' | 'balances' | 'loyalty' | 'activity') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is preventing print preview.');
      return;
    }
    
    let title = '';
    let headers: string[] = [];
    let rows: string[][] = [];
    
    if (reportType === 'directory') {
      title = 'Customer Directory Report';
      headers = ['ID', 'Name', 'Phone', 'Email', 'Group', 'Tier', 'Status', 'Balance', 'Loyalty Points'];
      rows = customers.map(c => [
        String(c.id),
        c.name,
        c.phone || '',
        c.email || '',
        c.customerType || 'Regular',
        getCustomerStats(c.id).tier.name,
        c.status || 'Active',
        `Rs. ${(c.pendingAmount || 0).toFixed(2)}`,
        `${c.loyaltyPoints || 0} pts`
      ]);
    } else if (reportType === 'spending') {
      title = 'Customer Spending Report';
      headers = ['ID', 'Name', 'Lifetime Spending', 'Total Orders', 'AOV', 'Last Purchase'];
      rows = customers.map(c => {
        const stats = getCustomerStats(c.id);
        return [
          String(c.id),
          c.name,
          `Rs. ${stats.totalSpent.toFixed(2)}`,
          String(stats.totalOrders),
          `Rs. ${stats.avgOrderVal.toFixed(2)}`,
          stats.lastPurchaseDate ? stats.lastPurchaseDate.toLocaleDateString() : 'Never'
        ];
      });
    } else if (reportType === 'balances') {
      title = 'Outstanding Balances Report';
      headers = ['ID', 'Name', 'Outstanding Dues', 'Phone', 'Last Purchase'];
      rows = customers
        .filter(c => c.pendingAmount > 0)
        .map(c => {
          const stats = getCustomerStats(c.id);
          return [
            String(c.id),
            c.name,
            `Rs. ${c.pendingAmount.toFixed(2)}`,
            c.phone || '',
            stats.lastPurchaseDate ? stats.lastPurchaseDate.toLocaleDateString() : 'Never'
          ];
        });
    } else if (reportType === 'loyalty') {
      title = 'Loyalty Rewards Report';
      headers = ['ID', 'Name', 'Tier', 'Available Points', 'Lifetime Spending'];
      rows = customers.map(c => {
        const stats = getCustomerStats(c.id);
        return [
          String(c.id),
          c.name,
          stats.tier.name,
          `${c.loyaltyPoints || 0} pts`,
          `Rs. ${stats.totalSpent.toFixed(2)}`
        ];
      });
    } else if (reportType === 'activity') {
      title = 'Customer Activity Logs Report';
      headers = ['ID', 'Name', 'Event Type', 'Description', 'Date'];
      customers.forEach(c => {
        const cSales = sales.filter(s => s.customerId === c.id);
        rows.push([
          String(c.id),
          c.name,
          'Registration',
          `Registered as a ${c.customerType || 'Regular'} customer`,
          c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
        ]);
        cSales.forEach(s => {
          rows.push([
            String(c.id),
            c.name,
            'Purchase Order',
            `Invoice #${s.id} totaling Rs. ${s.finalAmount.toFixed(2)}`,
            new Date(s.createdAt).toLocaleDateString()
          ]);
        });
      });
    }
    
    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f3f4f6; text-align: left; padding: 10px; font-weight: bold; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
            tr:hover { background-color: #f9fafb; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <h1>${title}</h1>
              <div class="subtitle">Generated on ${new Date().toLocaleDateString()} | ${shopSettings.shopName || 'Counter Pro'}</div>
            </div>
            <button onclick="window.print()" style="background-color: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background-color 0.2s;">Print / Save PDF</button>
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `<tr>${r.map(col => `<td>${col}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // CSV file parser
  const parseCSV = (text: string) => {
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const parsedData: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const row: string[] = [];
      let insideQuote = false;
      let entry = '';
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') insideQuote = !insideQuote;
        else if (char === ',' && !insideQuote) {
          row.push(entry.trim());
          entry = '';
        } else entry += char;
      }
      row.push(entry.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        let val = row[index] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        obj[header] = val;
      });
      parsedData.push(obj);
    }
    return parsedData;
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          alert('No customer records found in CSV file.');
          return;
        }
        const duplicates: string[] = [];
        const validRecords: any[] = [];
        parsed.forEach((row: any) => {
          const name = row.name || row.fullname || row['full name'] || '';
          if (!name) return;
          const phone = row.phone || row.telephone || row['phone number'] || '';
          const email = row.email || row['email address'] || '';
          const duplicateExists = customers.some(c => 
            (phone && c.phone === phone) || 
            (email && c.email === email)
          );
          if (duplicateExists) {
            duplicates.push(`${name} (${phone || email})`);
          } else {
            validRecords.push({
              name,
              phone: phone || undefined,
              email: email || undefined,
              address: row.address || undefined,
              billingAddress: row.billingaddress || row['billing address'] || row.address || undefined,
              shippingAddress: row.shippingaddress || row['shipping address'] || row.address || undefined,
              customerType: row.customertype || row.group || row.segment || 'Regular',
              status: row.status || 'Active',
              notes: row.notes || row.note || undefined,
              pendingAmount: parseFloat(row.pendingamount || row.balance || '0') || 0,
              loyaltyPoints: parseInt(row.loyaltypoints || row.points || '0', 10) || 0
            });
          }
        });
        setImportReport({
          total: parsed.length,
          imported: validRecords.length,
          duplicates,
          data: validRecords
        });
        setShowImportModal(true);
      } catch (err) {
        alert('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importReport) return;
    try {
      for (const item of importReport.data) {
        await addCustomer(item);
      }
      alert(`Import completed! ${importReport.imported} customers added successfully.`);
      setShowImportModal(false);
      setImportReport(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      alert('Error importing customer profiles.');
    }
  };

  // Profile Specific Mappings
  const currentCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return getCustomerById(selectedCustomerId);
  }, [selectedCustomerId, getCustomerById, customers]);

  const currentCustomerSales = useMemo(() => {
    if (!selectedCustomerId) return [];
    return sales.filter(s => s.customerId === selectedCustomerId);
  }, [selectedCustomerId, sales]);

  const currentCustomerReturns = useMemo(() => {
    if (!selectedCustomerId) return [];
    return returns.filter(r => r.customerId === selectedCustomerId);
  }, [selectedCustomerId, returns]);

  // Timeline events compiler
  const timelineEvents = useMemo(() => {
    if (!currentCustomer) return [];
    const events: {
      id: string;
      type: 'registration' | 'sale' | 'return' | 'payment' | 'loyalty' | 'note';
      title: string;
      description: string;
      date: Date;
    }[] = [];

    // 1. Registration
    events.push({
      id: `reg-${currentCustomer.id}`,
      type: 'registration',
      title: 'Customer Directory Registration',
      description: `Registered as a ${currentCustomer.customerType || 'Regular'} customer. Tier: ${getCustomerStats(currentCustomer.id).tier.badge}.`,
      date: new Date(currentCustomer.createdAt)
    });

    // 2. Sales
    currentCustomerSales.forEach(sale => {
      events.push({
        id: `sale-${sale.id}`,
        type: 'sale',
        title: `Invoice Paid: #${sale.id}`,
        description: `Purchased goods worth Rs. ${sale.finalAmount.toFixed(2)} (${sale.paymentStatus || 'Fully Paid'}). Due outstanding amount is Rs. ${sale.dueAmount.toFixed(2)}.`,
        date: new Date(sale.createdAt)
      });
    });

    // 3. Returns
    currentCustomerReturns.forEach(ret => {
      events.push({
        id: `ret-${ret.id}`,
        type: 'return',
        title: `Goods Returned/Exchanged: ${ret.id}`,
        description: `Returned products for a refund of Rs. ${ret.refundAmount.toFixed(2)} with exchange value of Rs. ${ret.exchangeAmount.toFixed(2)}. Condition: Resellable/Damaged.`,
        date: new Date(ret.createdAt)
      });
    });

    // 4. Payments
    customerPayments.forEach(pay => {
      events.push({
        id: `pay-${pay.id}`,
        type: 'payment',
        title: `Outstanding Balance Payment`,
        description: `Paid Rs. ${pay.amount.toFixed(2)} using ${pay.paymentMethod.toUpperCase()}.${pay.notes ? ` Notes: "${pay.notes}"` : ''}`,
        date: new Date(pay.createdAt)
      });
    });

    // 5. Loyalty Events
    customerLoyalty.forEach(ly => {
      events.push({
        id: `loy-${ly.id}`,
        type: 'loyalty',
        title: ly.transactionType === 'earn' ? `Loyalty Points Awarded` : `Loyalty Points Redeemed`,
        description: `${ly.transactionType === 'earn' ? 'Earned' : 'Redeemed'} ${Math.abs(ly.points)} points. Reference ID: ${ly.referenceId || ''}.${ly.notes ? ` Notes: "${ly.notes}"` : ''}`,
        date: new Date(ly.createdAt)
      });
    });

    // Sort newest first
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [currentCustomer, currentCustomerSales, currentCustomerReturns, customerPayments, customerLoyalty, getCustomerStats]);

  return (
    <div className="space-y-6">
      {/* Top Navbar Selectors */}
      {activeView === 'list' && (
        <div className="flex bg-white dark:bg-gray-800 p-1.5 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl space-x-1">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'directory'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-650 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <User className="h-4.5 w-4.5" />
            <span>Customer Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-650 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="h-4.5 w-4.5" />
            <span>Insights & Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'balances'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-650 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <DollarSign className="h-4.5 w-4.5" />
            <span>Outstanding Balances</span>
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'loyalty'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-650 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Award className="h-4.5 w-4.5" />
            <span>Loyalty Settings</span>
          </button>
        </div>
      )}

      {/* Directory Tab View */}
      {activeView === 'list' && activeTab === 'directory' && (
        <>
          <PageHeader
            title="Customer Directory"
            subtitle="Manage your customer relationships, segments, and classification."
            icon={User}
            breadcrumbs={[
              { label: 'Home', onClick: () => window.location.hash = '#/' },
              { label: 'Customers', onClick: () => setActiveTab('directory') },
              { label: 'Directory' }
            ]}
            actions={[
              {
                label: 'Add Customer',
                onClick: () => {
                  setEditingCustomer(null);
                  setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    billingAddress: '',
                    shippingAddress: '',
                    customerType: 'Regular',
                    status: 'Active',
                    notes: '',
                    pendingAmount: 0,
                    loyaltyPoints: 0
                  });
                  setShowAddModal(true);
                },
                icon: Plus,
                variant: 'primary'
              },
              {
                label: 'Import CSV',
                onClick: () => { if (fileInputRef.current) fileInputRef.current.click(); },
                icon: Upload,
                variant: 'secondary'
              },
              {
                label: 'Export CSV',
                onClick: () => exportReportCSV('directory'),
                icon: Download,
                variant: 'secondary'
              },
              {
                label: 'Print PDF',
                onClick: () => printReportPDF('directory'),
                icon: FileText,
                variant: 'secondary'
              }
            ]}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCSVUpload}
            accept=".csv"
            className="hidden"
          />

          {/* Quick Segment Selector Tabs */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedGroup('All')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  selectedGroup === 'All'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                All Customers ({customers.length})
              </button>
              {customerGroups.map(group => {
                const count = customers.filter(c => c.customerType === group).length;
                return (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                      selectedGroup === group
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {group} ({count})
                  </button>
                );
              })}
            </div>
            <div className="flex items-center space-x-2 pb-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search, Filter Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4.5 w-4.5" />
                <input
                  type="text"
                  placeholder="Search by Name, Phone Number, Email, or Customer ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 border transition-all text-sm font-medium ${
                  showFilters 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 text-blue-600' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4.5 w-4.5" />
                <span>Filters</span>
                {(selectedStatus !== 'All' || balanceFilter !== 'all' || minSpending || maxSpending || regDateStart || regDateEnd) && (
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 dark:text-gray-400 mb-1">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 dark:text-white rounded-lg p-2"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active Only</option>
                    <option value="Inactive">Inactive Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 dark:text-gray-400 mb-1">Outstanding Balance</label>
                  <select
                    value={balanceFilter}
                    onChange={(e) => setBalanceFilter(e.target.value as any)}
                    className="w-full text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 dark:text-white rounded-lg p-2"
                  >
                    <option value="all">All</option>
                    <option value="has_balance">Has Balance Due</option>
                    <option value="no_balance">No Balance Due</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 dark:text-gray-400 mb-1">Total Spending (Range)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minSpending}
                      onChange={(e) => setMinSpending(e.target.value)}
                      className="w-1/2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 dark:text-white rounded-lg p-2"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxSpending}
                      onChange={(e) => setMaxSpending(e.target.value)}
                      className="w-1/2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 dark:text-white rounded-lg p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 dark:text-gray-400 mb-1">Registration Date (Range)</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={regDateStart}
                      onChange={(e) => setRegDateStart(e.target.value)}
                      className="w-1/2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 dark:text-white rounded-lg p-2"
                    />
                    <input
                      type="date"
                      value={regDateEnd}
                      onChange={(e) => setRegDateEnd(e.target.value)}
                      className="w-1/2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-750 dark:text-white rounded-lg p-2"
                    />
                  </div>
                </div>

                <div className="col-span-full flex justify-end">
                  <button
                    onClick={handleResetFilters}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Directory Listings */}
          {filteredCustomers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center">
              <User className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Customers Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md text-sm">
                No customer profiles match your search criteria. Try clearing filters or create a new profile.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            /* DATA TABLE VIEW */
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-750">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Loyalty Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Group</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Outstanding Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Spend Info</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-gray-700">
                    {filteredCustomers.map((customer) => {
                      const stats = getCustomerStats(customer.id);
                      const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                      
                      return (
                        <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td 
                            className="px-6 py-4 cursor-pointer"
                            onClick={() => {
                              setSelectedCustomerId(customer.id);
                              setActiveView('profile');
                              setProfileTab('overview');
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full flex items-center justify-center font-extrabold text-sm shadow-inner bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {initials}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                  {customer.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-405 mt-0.5">{customer.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 text-xxs font-extrabold border rounded-full ${stats.tier.color}`}>
                                {stats.tier.badge}
                              </span>
                              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                <Coins className="h-3 w-3" />
                                {customer.loyaltyPoints || 0} pts
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                              {customer.customerType || 'Regular'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {customer.pendingAmount > 0 ? (
                              <span className="text-sm text-red-600 dark:text-red-405 font-black">
                                Rs. {customer.pendingAmount.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">No Due</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-900 dark:text-white font-semibold">PKR {stats.totalSpent.toFixed(0)} ({stats.totalOrders} Orders)</div>
                            <div className="text-xxs text-gray-400">AOV: PKR {stats.avgOrderVal.toFixed(0)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
                              (customer.status || 'Active') === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30' : 'bg-gray-150 text-gray-800'
                            }`}>
                              {customer.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleStartSale(customer)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="Start Sale"
                              >
                                <PlusCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(customer)}
                                className="text-gray-500 hover:text-gray-750 dark:text-gray-400 p-1 hover:bg-gray-50 rounded"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(customer.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 p-1 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomers.map(customer => {
                const stats = getCustomerStats(customer.id);
                const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <div key={customer.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-11 w-11 rounded-full flex items-center justify-center font-extrabold text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {initials}
                          </div>
                          <div>
                            <h3 
                              onClick={() => {
                                setSelectedCustomerId(customer.id);
                                setActiveView('profile');
                                setProfileTab('overview');
                              }}
                              className="font-bold text-gray-900 dark:text-white hover:text-blue-600 cursor-pointer hover:underline"
                            >
                              {customer.name}
                            </h3>
                            <div className="text-xxs text-gray-500 mt-0.5">{customer.phone || 'No phone'}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-xxs font-bold rounded-full ${stats.tier.color} border`}>
                          {stats.tier.badge}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 dark:bg-gray-750 p-2.5 rounded-xl border border-gray-150 dark:border-gray-700 text-xs">
                        <div>
                          <span className="text-gray-400 block text-xxs uppercase font-semibold">Orders</span>
                          <span className="font-bold text-gray-900 dark:text-white">{stats.totalOrders}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-xxs uppercase font-semibold">Spent</span>
                          <span className="font-bold text-gray-900 dark:text-white">Rs.{stats.totalSpent.toFixed(0)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-xxs uppercase font-semibold">Balance</span>
                          <span className={`font-black ${customer.pendingAmount > 0 ? 'text-red-650' : 'text-green-600'}`}>
                            Rs.{customer.pendingAmount.toFixed(0)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-gray-400 font-semibold flex items-center gap-0.5">
                          <Coins className="h-3.5 w-3.5 text-amber-500" />
                          Loyalty Balance:
                        </span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400">{customer.loyaltyPoints || 0} pts</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-750 px-6 py-3 flex items-center justify-between border-t border-gray-150 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setSelectedCustomerId(customer.id);
                          setActiveView('profile');
                          setProfileTab('overview');
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-0.5"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStartSale(customer)}
                          className="p-1 text-gray-550 dark:text-gray-400 hover:text-blue-600"
                        >
                          <PlusCircle className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1 text-gray-550 dark:text-gray-400 hover:text-blue-650"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-1 text-gray-555 hover:text-red-600"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Insights & Analytics Dashboard Tab View */}
      {activeView === 'list' && activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
              title="Total Customers"
              value={dashboardKPIs.total}
              icon={User}
              iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/10 dark:text-blue-400"
              comparisonText={`+${dashboardKPIs.newThisMonth} new this month`}
            />
            <KpiCard
              title="Active / VIP"
              value={`${dashboardKPIs.active} / ${dashboardKPIs.vips}`}
              icon={ShieldCheck}
              iconColor="text-green-600 bg-green-50 dark:bg-green-900/10 dark:text-green-400"
              comparisonText={`${dashboardKPIs.returning} returning buyers`}
            />
            <KpiCard
              title="Outstanding Balance"
              value={`${dashboardKPIs.hasBalance} profiles`}
              icon={DollarSign}
              iconColor="text-red-655 bg-red-50 dark:bg-red-900/10 dark:text-red-400"
              comparisonText="Clear due credit"
            />
            <KpiCard
              title="Average Spending"
              value={`Rs.${dashboardKPIs.avgSpending.toFixed(0)}`}
              icon={TrendingUp}
              iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/10 dark:text-amber-400"
              comparisonText="Reward loyal buyers"
            />
          </div>

          {/* Export Specific Analytics Reports */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Export Customer Insight Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Card 1: Spending */}
              <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-blue-600 dark:text-blue-400 font-extrabold"><FileSpreadsheet className="h-6 w-6" /></div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Spending</h4>
                </div>
                <p className="text-xxs text-gray-400 leading-relaxed">Lifetime spending summary, order counts, and purchase histories.</p>
                <div className="flex space-x-2 pt-2 border-t border-gray-150 dark:border-gray-700">
                  <button onClick={() => exportReportCSV('spending')} className="flex-1 py-1 text-center bg-white dark:bg-gray-800 text-xxs font-bold rounded border hover:bg-gray-50 dark:text-gray-300 dark:border-gray-650">CSV</button>
                  <button onClick={() => printReportPDF('spending')} className="flex-1 py-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-xxs font-bold rounded">PDF</button>
                </div>
              </div>

              {/* Card 2: Balances */}
              <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-red-500 font-extrabold"><DollarSign className="h-6 w-6" /></div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Outstanding</h4>
                </div>
                <p className="text-xxs text-gray-400 leading-relaxed">Credit sales, outstanding dues, and ledger repayment status.</p>
                <div className="flex space-x-2 pt-2 border-t border-gray-150 dark:border-gray-700">
                  <button onClick={() => exportReportCSV('balances')} className="flex-1 py-1 text-center bg-white dark:bg-gray-800 text-xxs font-bold rounded border hover:bg-gray-50 dark:text-gray-300 dark:border-gray-650">CSV</button>
                  <button onClick={() => printReportPDF('balances')} className="flex-1 py-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-xxs font-bold rounded">PDF</button>
                </div>
              </div>

              {/* Card 3: Loyalty */}
              <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-amber-500 font-extrabold"><Award className="h-6 w-6" /></div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Loyalty</h4>
                </div>
                <p className="text-xxs text-gray-400 leading-relaxed">Available points, tier levels, and reward programs.</p>
                <div className="flex space-x-2 pt-2 border-t border-gray-150 dark:border-gray-700">
                  <button onClick={() => exportReportCSV('loyalty')} className="flex-1 py-1 text-center bg-white dark:bg-gray-800 text-xxs font-bold rounded border hover:bg-gray-50 dark:text-gray-300 dark:border-gray-650">CSV</button>
                  <button onClick={() => printReportPDF('loyalty')} className="flex-1 py-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-xxs font-bold rounded">PDF</button>
                </div>
              </div>

              {/* Card 4: Activity */}
              <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-purple-500 font-extrabold"><Clock className="h-6 w-6" /></div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Activity Logs</h4>
                </div>
                <p className="text-xxs text-gray-400 leading-relaxed">Activity timeline logs, purchases, registration, and notes.</p>
                <div className="flex space-x-2 pt-2 border-t border-gray-150 dark:border-gray-700">
                  <button onClick={() => exportReportCSV('activity')} className="flex-1 py-1 text-center bg-white dark:bg-gray-800 text-xxs font-bold rounded border hover:bg-gray-50 dark:text-gray-300 dark:border-gray-650">CSV</button>
                  <button onClick={() => printReportPDF('activity')} className="flex-1 py-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-xxs font-bold rounded">PDF</button>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Lists: Top spenders, frequent buyers etc. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Top Spending Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-1.5">
                <Coins className="h-4.5 w-4.5 text-amber-500" />
                Top Spending Customers
              </h3>
              <div className="space-y-3">
                {analyticsLists.topSpending.map((x, i) => (
                  <div key={x.customer.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-300">{i + 1}. {x.customer.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">PKR {x.stats.totalSpent.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Most Frequent Buyers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-1.5">
                <ShoppingBag className="h-4.5 w-4.5 text-blue-500" />
                Most Frequent Buyers
              </h3>
              <div className="space-y-3">
                {analyticsLists.mostFrequent.map((x, i) => (
                  <div key={x.customer.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-300">{i + 1}. {x.customer.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{x.stats.totalOrders} Orders</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Highest Average Order Value */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-green-500" />
                Highest Average Order Value
              </h3>
              <div className="space-y-3">
                {analyticsLists.highestAOV.map((x, i) => (
                  <div key={x.customer.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-300">{i + 1}. {x.customer.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">PKR {x.stats.avgOrderVal.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Recently Active Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-purple-500" />
                Recently Active
              </h3>
              <div className="space-y-3">
                {analyticsLists.recentlyActive.map((x, i) => (
                  <div key={x.customer.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-300">{i + 1}. {x.customer.name}</span>
                    <span className="text-gray-400">{x.stats.lastPurchaseDate?.toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Inactive / At-Risk Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-1.5">
                <AlertCircle className="h-4.5 w-4.5 text-red-500" />
                Inactive / At-Risk Customers
              </h3>
              <div className="space-y-3">
                {analyticsLists.inactiveCustomersList.map((x, i) => (
                  <div key={x.customer.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-300">{i + 1}. {x.customer.name}</span>
                    <span className="text-red-500 font-bold">No purchase &gt;60 days</span>
                  </div>
                ))}
                {analyticsLists.inactiveCustomersList.length === 0 && (
                  <p className="text-xxs text-gray-400 text-center py-4">All customers active!</p>
                )}
              </div>
            </div>

            {/* 6. Fastest Growing Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-1.5">
                <PlusCircle className="h-4.5 w-4.5 text-blue-500" />
                Fastest Growing (New &lt;30 days)
              </h3>
              <div className="space-y-3">
                {analyticsLists.fastestGrowing.map((x, i) => (
                  <div key={x.customer.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-300">{i + 1}. {x.customer.name}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">Rs.{x.stats.totalSpent.toFixed(0)} spent</span>
                  </div>
                ))}
                {analyticsLists.fastestGrowing.length === 0 && (
                  <p className="text-xxs text-gray-400 text-center py-4">No new registrations in 30 days.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outstanding Balances Tab View */}
      {activeView === 'list' && activeTab === 'balances' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden animate-fadeIn">
          <div className="p-6 border-b border-gray-150 dark:border-gray-750 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Credit & Outstanding Balances Ledger</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review active credit balances, payment deadlines, and payment histories.</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => exportReportCSV('balances')}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-gray-50 transition-colors"
                title="Export credit dues as CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => printReportPDF('balances')}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-gray-50 transition-colors"
                title="Print credit dues or save as PDF"
              >
                <FileText className="h-3.5 w-3.5 text-red-500" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-150 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Credit Balance Due</th>
                  <th className="px-6 py-3 text-left">Last Purchase Date</th>
                  <th className="px-6 py-3 text-left">Estimated Due Date</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-700">
                {customers.filter(c => c.pendingAmount > 0).map(c => {
                  const stats = getCustomerStats(c.id);
                  const lastPurchase = stats.lastPurchaseDate;
                  const estimatedDue = lastPurchase ? new Date(lastPurchase.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
                  
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{c.name}</td>
                      <td className="px-6 py-4 text-red-650 dark:text-red-400 font-extrabold">Rs. {c.pendingAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{lastPurchase ? lastPurchase.toLocaleDateString() : 'Never'}</td>
                      <td className="px-6 py-4 text-gray-550 dark:text-gray-405 font-medium">{estimatedDue ? estimatedDue.toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setShowPaymentModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-semibold"
                          >
                            Collect Payment
                          </button>
                          <button
                            onClick={() => handleSendWhatsAppReminder(c)}
                            className="border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 text-xs px-3 py-1.5 rounded font-semibold flex items-center gap-1"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>WhatsApp Alert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {customers.filter(c => c.pendingAmount > 0).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-405">All balances cleared! No outstanding credit dues.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loyalty System Rules and Configs Tab View */}
      {activeView === 'list' && activeTab === 'loyalty' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Rules configurations */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Settings className="h-5 w-5 text-blue-600" />
                Loyalty Earning Configuration
              </h3>
              <p className="text-xs text-gray-500 mt-1">Configure points parameters automatically triggered during POS invoice completion.</p>
            </div>
            
            <form onSubmit={handleSaveLoyaltyRules} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-750 dark:text-gray-300">Enable Loyalty Program rewards</label>
                <input
                  type="checkbox"
                  checked={loyaltyConfig.enabled}
                  onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-550 dark:text-gray-400 uppercase mb-1">Earning Threshold Amount (PKR per Point)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={loyaltyConfig.pointsPerAmount}
                  onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, pointsPerAmount: parseInt(e.target.value, 10) || 100 })}
                  className="w-full text-sm border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                />
                <span className="text-xxs text-gray-400 mt-1 block">e.g. Setting to 100 awards 1 point for every PKR 100 spent in a sale transaction.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-550 dark:text-gray-400 uppercase mb-1">Redemption Discount Value (PKR per Point)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={loyaltyConfig.valPerPoint}
                  onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, valPerPoint: parseFloat(e.target.value) || 1 })}
                  className="w-full text-sm border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                />
                <span className="text-xxs text-gray-400 mt-1 block">Value of 1 Loyalty Point converted into shopping discount.</span>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Save Earning Rules
              </button>
            </form>
          </div>

          {/* Tier levels settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Customer Tiers Configuration
              </h3>
              <p className="text-xs text-gray-500 mt-1">Configure threshold lifetime spending metrics to automatically update customer loyalty levels.</p>
            </div>

            <form onSubmit={handleSaveTiersRules} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-550 dark:text-gray-400 uppercase mb-1">Silver level minimum spending threshold (PKR)</label>
                <input
                  type="number"
                  required
                  value={tierConfig.silverMin}
                  onChange={(e) => setTierConfig({ ...tierConfig, silverMin: parseInt(e.target.value, 10) || 10000 })}
                  className="w-full text-sm border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-550 dark:text-gray-400 uppercase mb-1">Gold level minimum spending threshold (PKR)</label>
                <input
                  type="number"
                  required
                  value={tierConfig.goldMin}
                  onChange={(e) => setTierConfig({ ...tierConfig, goldMin: parseInt(e.target.value, 10) || 30000 })}
                  className="w-full text-sm border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-550 dark:text-gray-400 uppercase mb-1">Platinum level minimum spending threshold (PKR)</label>
                <input
                  type="number"
                  required
                  value={tierConfig.platinumMin}
                  onChange={(e) => setTierConfig({ ...tierConfig, platinumMin: parseInt(e.target.value, 10) || 100000 })}
                  className="w-full text-sm border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5 font-bold"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Save Tiers Levels
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile detail view */}
      {activeView === 'profile' && currentCustomer && (
        <div className="space-y-6 animate-scaleUp">
          {/* Top Detail Header card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setActiveView('list');
                  setSelectedCustomerId(null);
                }}
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-350 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center font-bold text-base bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {currentCustomer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {currentCustomer.name}
                    <span className={`text-xs px-2.5 py-0.5 border font-extrabold rounded-full ${getCustomerStats(currentCustomer.id).tier.color}`}>
                      {getCustomerStats(currentCustomer.id).tier.badge}
                    </span>
                  </h1>
                  <p className="text-xs text-gray-500">
                    ID: #{currentCustomer.id} | Registered: {new Date(currentCustomer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleStartSale(currentCustomer)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-semibold shadow-sm"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                <span>Start POS Sale</span>
              </button>
              {currentCustomer.phone && (
                <>
                  <button
                    onClick={() => handleSendWhatsAppReminder(currentCustomer)}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-650 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-semibold"
                  >
                    <MessageCircle className="h-4.5 w-4.5 text-green-500" />
                    <span>WhatsApp alert</span>
                  </button>
                </>
              )}
              <button
                onClick={() => handleEdit(currentCustomer)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-650 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-semibold"
              >
                <Edit className="h-4.5 w-4.5 text-blue-500" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => handleDelete(currentCustomer.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-semibold shadow-sm"
              >
                <Trash2 className="h-4.5 w-4.5" />
                <span>Delete Profile</span>
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-xs font-bold text-gray-400 block uppercase">Outstanding Dues</span>
              <h3 className={`text-2xl font-black mt-2 ${currentCustomer.pendingAmount > 0 ? 'text-red-650' : 'text-green-600'}`}>
                Rs. {currentCustomer.pendingAmount.toFixed(2)}
              </h3>
              {currentCustomer.pendingAmount > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  Collect Balance payment
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-xs font-bold text-gray-400 block uppercase">Loyalty Points Balance</span>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {currentCustomer.loyaltyPoints || 0} pts
              </h3>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => {
                    setRedeemFormData({ points: '', notes: '' });
                    setShowRedeemModal(true);
                  }}
                  disabled={!currentCustomer.loyaltyPoints}
                  className="text-xs font-bold text-amber-600 hover:text-amber-800 disabled:opacity-50"
                >
                  Redeem Points
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-xs font-bold text-gray-400 block uppercase">Lifetime spending</span>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                Rs. {getCustomerStats(currentCustomer.id).totalSpent.toFixed(2)}
              </h3>
              <p className="text-xxs text-gray-400 mt-1">PKR {getCustomerStats(currentCustomer.id).avgOrderVal.toFixed(0)} avg order value</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-xs font-bold text-gray-400 block uppercase">Purchase Count</span>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                {getCustomerStats(currentCustomer.id).totalOrders} Orders
              </h3>
              <p className="text-xxs text-gray-400 mt-1">Lifetime total purchases</p>
            </div>
          </div>

          {/* Splits: Left Personal Info & Notes, Right Detailed Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Personal Directory Info</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-gray-400 block">Phone Number</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{currentCustomer.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Email Address</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{currentCustomer.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">General Address</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{currentCustomer.address || '-'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                    <div>
                      <span className="text-gray-400 block">Billing Address</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{currentCustomer.billingAddress || currentCustomer.address || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Shipping Address</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{currentCustomer.shippingAddress || currentCustomer.address || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff internal notes */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Internal Staff Notes
                  </h3>
                  <button
                    onClick={handleSaveProfileNotes}
                    disabled={isSavingNotes}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSavingNotes ? 'Saving' : 'Save'}</span>
                  </button>
                </div>
                <textarea
                  value={profileNotes}
                  onChange={(e) => setProfileNotes(e.target.value)}
                  placeholder="Notes remain internal only to cashiers/admins."
                  rows={4}
                  className="w-full text-xs border border-gray-300 dark:border-gray-650 bg-gray-50 dark:bg-gray-755 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right Side Tab Interfaces */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile sub-tab selector */}
              <div className="bg-white dark:bg-gray-800 p-1.5 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl flex overflow-x-auto">
                <button
                  onClick={() => setProfileTab('overview')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg whitespace-nowrap px-3 transition-all ${
                    profileTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-white'
                  }`}
                >
                  Insights Overview
                </button>
                <button
                  onClick={() => setProfileTab('sales')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg whitespace-nowrap px-3 transition-all ${
                    profileTab === 'sales' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-white'
                  }`}
                >
                  Purchases ({currentCustomerSales.length})
                </button>
                <button
                  onClick={() => setProfileTab('returns')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg whitespace-nowrap px-3 transition-all ${
                    profileTab === 'returns' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-white'
                  }`}
                >
                  Returns ({currentCustomerReturns.length})
                </button>
                <button
                  onClick={() => setProfileTab('payments')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg whitespace-nowrap px-3 transition-all ${
                    profileTab === 'payments' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-white'
                  }`}
                >
                  Credit Payments ({customerPayments.length})
                </button>
                <button
                  onClick={() => setProfileTab('loyalty')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg whitespace-nowrap px-3 transition-all ${
                    profileTab === 'loyalty' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-white'
                  }`}
                >
                  Loyalty history
                </button>
                <button
                  onClick={() => setProfileTab('timeline')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg whitespace-nowrap px-3 transition-all ${
                    profileTab === 'timeline' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-white'
                  }`}
                >
                  Timeline
                </button>
              </div>

              {/* Tab Content Render */}
              {profileTab === 'overview' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-fadeIn space-y-6">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Customer Profile Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 text-sm bg-gray-50 dark:bg-gray-750 p-4 rounded-2xl border border-gray-150 dark:border-gray-700">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-450">Shopping habits</h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between">
                          <span className="text-gray-500">First Purchase Date:</span>
                          <span className="font-semibold text-gray-950 dark:text-white">
                            {getCustomerStats(currentCustomer.id).firstPurchaseDate ? getCustomerStats(currentCustomer.id).firstPurchaseDate!.toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Purchase Date:</span>
                          <span className="font-semibold text-gray-950 dark:text-white">
                            {getCustomerStats(currentCustomer.id).lastPurchaseDate ? getCustomerStats(currentCustomer.id).lastPurchaseDate!.toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Preferred payment mode:</span>
                          <span className="font-semibold text-gray-950 dark:text-white uppercase">
                            {getCustomerStats(currentCustomer.id).favPaymentMethod || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 text-sm bg-gray-50 dark:bg-gray-750 p-4 rounded-2xl border border-gray-150 dark:border-gray-700">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-450">Favorites</h4>
                      <div className="space-y-2.5">
                        <div>
                          <span className="text-gray-500 text-xs block">Top Categories Purchased:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {getCustomerStats(currentCustomer.id).favCategories.map(c => (
                              <span key={c} className="text-xxs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{c}</span>
                            ))}
                            {getCustomerStats(currentCustomer.id).favCategories.length === 0 && <span className="text-xs text-gray-400">None yet</span>}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs block">Top Products Purchased:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {getCustomerStats(currentCustomer.id).favProducts.map(p => (
                              <span key={p} className="text-xxs font-bold px-2 py-0.5 bg-green-105 text-green-800 rounded">{p}</span>
                            ))}
                            {getCustomerStats(currentCustomer.id).favProducts.length === 0 && <span className="text-xs text-gray-400">None yet</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'sales' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-fadeIn space-y-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Completed Purchases</h3>
                  {currentCustomerSales.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">No purchases found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-150 dark:border-gray-700 text-left text-gray-450">
                            <th className="pb-3">Invoice</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Payment Method</th>
                            <th className="pb-3">Total Amount</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Print</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 dark:divide-gray-700 font-medium">
                          {currentCustomerSales.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                              <td className="py-3 font-bold text-blue-600">#{s.id}</td>
                              <td className="py-3 text-gray-600">{new Date(s.createdAt).toLocaleDateString()}</td>
                              <td className="py-3 uppercase">{s.paymentMethod}</td>
                              <td className="py-3 text-gray-900 dark:text-white font-semibold">PKR {s.finalAmount.toFixed(2)}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-xxs ${
                                  s.paymentStatus === 'Fully Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {s.paymentStatus || 'Fully Paid'}
                                </span>
                              </td>
                              <td className="py-3">
                                <button
                                  onClick={() => handlePrintReceipt(currentCustomer.id)}
                                  className="p-1 hover:bg-gray-150 dark:hover:bg-gray-750 text-blue-600 rounded"
                                >
                                  <Receipt className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'returns' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-fadeIn space-y-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Returns & Exchanges Log</h3>
                  {currentCustomerReturns.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">No returns log found.</p>
                  ) : (
                    <div className="space-y-3">
                      {currentCustomerReturns.map(r => (
                        <div key={r.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-750 border border-gray-150 dark:border-gray-700 rounded-xl text-xs">
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Return {r.id}</h4>
                            <span className="text-xxs text-gray-400">Sale Ref: #{r.originalSaleId} | {new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-red-600 dark:text-red-400 block">- Rs. {r.refundAmount.toFixed(2)}</span>
                            <span className="text-xxs text-gray-400">Exchange: Rs. {r.exchangeAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'payments' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-fadeIn space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Repayment history</h3>
                    {currentCustomer.pendingAmount > 0 && (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Record Payment</span>
                      </button>
                    )}
                  </div>
                  {customerPayments.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">No credit repayments recorded.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-450 border-b border-gray-150 pb-2">
                            <th className="pb-2">Payment ID</th>
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Method</th>
                            <th className="pb-2">Amount Paid</th>
                            <th className="pb-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerPayments.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                              <td className="py-2.5 font-bold">PAY-{p.id}</td>
                              <td className="py-2.5 text-gray-550">{new Date(p.createdAt).toLocaleDateString()}</td>
                              <td className="py-2.5 uppercase">{p.paymentMethod}</td>
                              <td className="py-2.5 text-green-600 font-extrabold">Rs. {p.amount.toFixed(2)}</td>
                              <td className="py-2.5 text-gray-400 max-w-xxs truncate">{p.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'loyalty' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-fadeIn space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Loyalty History Ledger</h3>
                    {currentCustomer.loyaltyPoints > 0 && (
                      <button
                        onClick={() => setShowRedeemModal(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <Coins className="h-3.5 w-3.5" />
                        <span>Redeem Points</span>
                      </button>
                    )}
                  </div>
                  {customerLoyalty.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">No loyalty points history logged.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-450 border-b border-gray-150 pb-2">
                            <th className="pb-2">Event ID</th>
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Action</th>
                            <th className="pb-2">Points</th>
                            <th className="pb-2">Reference</th>
                            <th className="pb-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerLoyalty.map(ly => (
                            <tr key={ly.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                              <td className="py-2.5 font-bold">LOY-{ly.id}</td>
                              <td className="py-2.5 text-gray-550">{new Date(ly.createdAt).toLocaleDateString()}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded text-xxs font-semibold uppercase ${
                                  ly.transactionType === 'earn' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {ly.transactionType}
                                </span>
                              </td>
                              <td className={`py-2.5 font-black text-sm ${ly.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {ly.points >= 0 ? `+${ly.points}` : ly.points}
                              </td>
                              <td className="py-2.5 font-semibold">{ly.referenceId || '-'}</td>
                              <td className="py-2.5 text-gray-400 max-w-xxs truncate">{ly.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'timeline' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-fadeIn space-y-6">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Activity Timeline</h3>
                  <div className="relative pl-6 border-l border-gray-250 dark:border-gray-700 space-y-6 text-sm">
                    {timelineEvents.map(event => (
                      <div key={event.id} className="relative">
                        <div className={`absolute -left-[31px] top-0.5 h-6.5 w-6.5 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 text-white ${
                          event.type === 'registration' ? 'bg-blue-500' :
                          event.type === 'sale' ? 'bg-purple-500' :
                          event.type === 'return' ? 'bg-orange-500' :
                          event.type === 'payment' ? 'bg-green-500' :
                          'bg-amber-500'
                        }`}>
                          {event.type === 'registration' && <User className="h-3 w-3" />}
                          {event.type === 'sale' && <Receipt className="h-3 w-3" />}
                          {event.type === 'return' && <RotateCcw className="h-3 w-3" />}
                          {event.type === 'payment' && <DollarSign className="h-3 w-3" />}
                          {event.type === 'loyalty' && <Coins className="h-3 w-3" />}
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-900 dark:text-white text-xs">{event.title}</h4>
                            <span className="text-xxs text-gray-400">{event.date.toLocaleDateString() + ' ' + event.date.toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 max-w-xl leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: ADD / EDIT CUSTOMER
          ======================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-700 pb-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <User className="h-5.5 w-5.5 text-blue-600" />
                {editingCustomer ? 'Edit Customer Profile' : 'Create Customer Profile'}
              </h2>
              <button onClick={() => { setShowAddModal(false); setEditingCustomer(null); }} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <X className="h-5.5 w-5.5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">Personal Information</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Asad Khan"
                      className="w-full text-sm border-gray-350 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full text-sm border-gray-350 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. asad@gmail.com"
                      className="w-full text-sm border-gray-350 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Customer Group</label>
                      <select
                        value={formData.customerType}
                        onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                        className="w-full text-sm border-gray-355 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                      >
                        {customerGroups.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full text-sm border-gray-355 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-750 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                    {!showNewGroupField ? (
                      <button
                        type="button"
                        onClick={() => setShowNewGroupField(true)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add New Custom Group</span>
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Reseller"
                          value={newGroupInput}
                          onChange={(e) => setNewGroupInput(e.target.value)}
                          className="flex-1 text-xs border border-gray-350 dark:border-gray-650 bg-white dark:bg-gray-700 dark:text-white rounded p-1.5"
                        />
                        <button type="button" onClick={handleAddCustomGroup} className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-blue-755">Add</button>
                        <button type="button" onClick={() => { setShowNewGroupField(false); setNewGroupInput(''); }} className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">Address Book & Financials</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">General Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Swat, KP"
                      className="w-full text-sm border-gray-350 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Billing Address (Optional)</label>
                    <input
                      type="text"
                      value={formData.billingAddress}
                      onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                      className="w-full text-sm border-gray-350 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Shipping Address (Optional)</label>
                    <input
                      type="text"
                      value={formData.shippingAddress}
                      onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                      className="w-full text-sm border-gray-350 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Initial Balance Due</label>
                      <input
                        type="number"
                        disabled={!!editingCustomer}
                        value={formData.pendingAmount}
                        onChange={(e) => setFormData({ ...formData, pendingAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full text-sm border-gray-350 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Initial Loyalty Points</label>
                      <input
                        type="number"
                        value={formData.loyaltyPoints}
                        onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value, 15) || 0 })}
                        className="w-full text-sm border-gray-350 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Internal Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full text-sm border-gray-350 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingCustomer(null); }}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-300 py-2.5 px-6 rounded-lg text-sm font-semibold animate-transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-750 text-white py-2.5 px-8 rounded-lg text-sm font-semibold shadow-sm animate-transition"
                >
                  {editingCustomer ? 'Update Profile' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: REPAYMENT COLLECTING
          ======================================================= */}
      {showPaymentModal && currentCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 w-full max-w-md animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-700 pb-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <DollarSign className="h-5.5 w-5.5 text-green-600" />
                Record Dues payment
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-450 hover:text-gray-750 dark:hover:text-white">
                <X className="h-5.5 w-5.5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Customer Name</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-750 text-sm font-semibold rounded-lg text-gray-900 dark:text-white">{currentCustomer.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Credit Outstanding</label>
                  <div className="p-3 bg-red-50 dark:bg-red-900/10 text-sm font-bold rounded-lg text-red-650 dark:text-red-400">Rs. {currentCustomer.pendingAmount.toFixed(2)}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={currentCustomer.pendingAmount}
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    placeholder="Enter amount"
                    className="w-full text-sm border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5 font-bold text-green-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Mode</label>
                <select
                  value={paymentFormData.paymentMethod}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                  className="w-full text-sm border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Debit/Credit Card</option>
                  <option value="mobile_wallet">Mobile Wallet</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Details</label>
                <input
                  type="text"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="e.g. Ledger clearing"
                  className="w-full text-sm border-gray-300 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-150 dark:border-gray-700 justify-end">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="bg-gray-100 hover:bg-gray-250 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 px-6 rounded-lg text-sm font-semibold">Cancel</button>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white py-2.5 px-8 rounded-lg text-sm font-semibold shadow-sm">Confirm Repayment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: REDEEM LOYALTY POINTS
          ======================================================= */}
      {showRedeemModal && currentCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 w-full max-w-md animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-700 pb-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Coins className="h-5.5 w-5.5 text-amber-500" />
                Redeem Rewards Points
              </h2>
              <button onClick={() => setShowRedeemModal(false)} className="text-gray-450 hover:text-gray-750 dark:hover:text-white">
                <X className="h-5.5 w-5.5" />
              </button>
            </div>

            <form onSubmit={handleRedeemSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Customer Name</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-750 text-sm font-semibold rounded-lg text-gray-900 dark:text-white">{currentCustomer.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Available Points</label>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/10 text-sm font-bold rounded-lg text-amber-600 dark:text-amber-400">{currentCustomer.loyaltyPoints || 0} pts</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Redeem Points *</label>
                  <input
                    type="number"
                    required
                    max={currentCustomer.loyaltyPoints || 0}
                    value={redeemFormData.points}
                    onChange={(e) => setRedeemFormData({ ...redeemFormData, points: e.target.value })}
                    placeholder="Enter points quantity"
                    className="w-full text-sm border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5 font-bold text-amber-600 animate-transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-550 uppercase tracking-wider mb-1">Equivalent Discount Value</label>
                <div className="p-3 bg-green-50 dark:bg-green-905/10 text-sm font-bold rounded-lg text-green-600">
                  Rs. {((parseInt(redeemFormData.points, 10) || 0) * loyaltyConfig.valPerPoint).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Transaction Details</label>
                <input
                  type="text"
                  value={redeemFormData.notes}
                  onChange={(e) => setRedeemFormData({ ...redeemFormData, notes: e.target.value })}
                  placeholder="e.g. Redeemed points discount"
                  className="w-full text-sm border-gray-300 bg-white dark:bg-gray-700 dark:text-white rounded-lg p-2.5"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-150 dark:border-gray-700 justify-end">
                <button type="button" onClick={() => setShowRedeemModal(false)} className="bg-gray-100 hover:bg-gray-250 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 px-6 rounded-lg text-sm font-semibold">Cancel</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-8 rounded-lg text-sm font-semibold shadow-sm">Confirm Redemption</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Confirm Import Modal */}
      {showImportModal && importReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 w-full max-w-lg animate-scaleUp">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
              <Upload className="h-5.5 w-5.5 text-blue-600" />
              CSV Import Preview Summary
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                  <div className="text-xs text-gray-550">Ready to Import</div>
                  <div className="text-xl font-bold text-blue-600">{importReport.imported} rows</div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl">
                  <div className="text-xs text-gray-550">Duplicate Warnings</div>
                  <div className="text-xl font-bold text-yellow-600">{importReport.duplicates.length} rows</div>
                </div>
              </div>
              {importReport.duplicates.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-905/10 p-4 rounded-xl border border-yellow-200 max-h-[20vh] overflow-y-auto space-y-1">
                  <h4 className="text-xs font-bold text-yellow-805 uppercase">Duplicate phone/emails (skipped):</h4>
                  <ul className="text-xs text-yellow-800 list-disc pl-4">
                    {importReport.duplicates.map((dup, idx) => (
                      <li key={idx}>{dup}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex space-x-3 pt-6 border-t border-gray-150 mt-6 justify-end">
              <button type="button" onClick={() => { setShowImportModal(false); setImportReport(null); }} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-750 dark:text-gray-300 py-2.5 px-5 rounded-lg text-sm font-semibold">Cancel</button>
              <button onClick={handleConfirmImport} disabled={importReport.imported === 0} className="bg-blue-600 hover:bg-blue-705 text-white py-2.5 px-6 rounded-lg text-sm font-semibold shadow-sm">Confirm Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;