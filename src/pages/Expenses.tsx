import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Trash2, Edit2, Plus, Search, Filter, Download, Upload,
  Calendar, Check, X, ChevronRight, RefreshCw, Eye, Paperclip,
  CheckCircle2, AlertCircle, Clock, FileText, ArrowRight,
  TrendingDown, TrendingUp, Layers, CreditCard, PieChart, BarChart2,
  DollarSign, Activity, Settings, HelpCircle, AlertTriangle, ArrowUpRight,
  User, CheckSquare, Info
} from 'lucide-react';
import { format, isAfter, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval, getQuarter, getYear } from 'date-fns';
import jsPDF from 'jspdf';
import { useExpensesStore } from '../stores/expensesStore';
import { usePOSStore } from '../stores/posStore';
import { usePurchaseStore } from '../stores/purchaseStore';
import type { Expense } from '../backend/types';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';
import EmptyState from '../components/EmptyState';
import LoadingButton from '../components/LoadingButton';

interface Budget {
  category: string;
  limit: number;
}

const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const { expenses, initializeFromDatabase, addExpense, updateExpense, deleteExpense } = useExpensesStore();
  const { sales, initializeFromDatabase: initSales } = usePOSStore();
  const { purchaseOrders, initializeFromDatabase: initPurchases } = usePurchaseStore();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'breakdown' | 'budgets' | 'recurring'>('dashboard');
  
  // Modals & Panels
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvTextInput, setCsvTextInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>('summary');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Breakdown View Grouping Settings
  const [breakdownGroupBy, setBreakdownGroupBy] = useState<'category' | 'vendor' | 'paymentMethod' | 'month' | 'quarter' | 'year'>('category');

  // Budgets State
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<string | null>(null);
  const [editingBudgetLimit, setEditingBudgetLimit] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    category: 'Utilities',
    amount: '',
    paymentMethod: 'Cash',
    reference: '',
    notes: '',
    vendor: '',
    status: 'Paid',
    addedBy: 'Admin',
    isRecurring: false,
    recurringFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    nextRecurringDate: ''
  });

  // Predefined Lists
  const categories = [
    'Rent', 'Salaries', 'Utilities', 'Internet', 'Transportation',
    'Fuel', 'Office Supplies', 'Maintenance', 'Marketing', 'Miscellaneous'
  ];
  const paymentMethods = ['Cash', 'Bank Transfer', 'Card', 'Mobile Wallet', 'Cheque', 'Other'];
  const statuses = ['Paid', 'Pending', 'Approved', 'Draft'];

  useEffect(() => {
    initializeFromDatabase();
    initSales();
    initPurchases();
    
    const storedBudgets = localStorage.getItem('khatabook_expense_budgets');
    if (storedBudgets) {
      setBudgets(JSON.parse(storedBudgets));
    } else {
      const defaultBudgets = categories.map(cat => ({ category: cat, limit: 15000 }));
      setBudgets(defaultBudgets);
      localStorage.setItem('khatabook_expense_budgets', JSON.stringify(defaultBudgets));
    }
  }, []);

  const handleSaveBudget = () => {
    if (!editingBudgetCategory) return;
    const limitNum = parseFloat(editingBudgetLimit) || 0;
    const updated = budgets.map(b => b.category === editingBudgetCategory ? { ...b, limit: limitNum } : b);
    setBudgets(updated);
    localStorage.setItem('khatabook_expense_budgets', JSON.stringify(updated));
    setEditingBudgetCategory(null);
    setEditingBudgetLimit('');
  };

  const resetForm = () => {
    setFormData({
      description: '',
      category: 'Utilities',
      amount: '',
      paymentMethod: 'Cash',
      reference: '',
      notes: '',
      vendor: '',
      status: 'Paid',
      addedBy: 'Admin',
      isRecurring: false,
      recurringFrequency: 'monthly',
      nextRecurringDate: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      alert('Please enter required details.');
      return;
    }

    const payload = {
      description: formData.description,
      category: formData.category,
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      reference: formData.reference || undefined,
      notes: formData.notes || undefined,
      vendor: formData.vendor || undefined,
      status: formData.status,
      addedBy: formData.addedBy || 'Admin',
      lastUpdated: new Date().toISOString(),
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
      nextRecurringDate: formData.isRecurring && formData.nextRecurringDate ? formData.nextRecurringDate : undefined
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await updateExpense(editingId, payload as Partial<Expense>);
        if (selectedExpense && selectedExpense.id === editingId) {
          setSelectedExpense({ ...selectedExpense, ...payload, id: editingId });
        }
      } else {
        await addExpense(payload as Omit<Expense, 'id' | 'createdAt'>);
      }
      resetForm();
      setIsModalOpen(false);
      initializeFromDatabase();
    } catch (error) {
      console.error(error);
      alert('Failed to save expense.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (expense: Expense, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormData({
      description: expense.description,
      category: expense.category,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      reference: expense.reference || '',
      notes: expense.notes || '',
      vendor: expense.vendor || '',
      status: expense.status || 'Paid',
      addedBy: expense.addedBy || 'Admin',
      isRecurring: !!expense.isRecurring,
      recurringFrequency: expense.recurringFrequency || 'monthly',
      nextRecurringDate: expense.nextRecurringDate || ''
    });
    setEditingId(expense.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Delete this expense?')) {
      try {
        await deleteExpense(id);
        if (selectedExpense && selectedExpense.id === id) {
          setIsDetailOpen(false);
          setSelectedExpense(null);
        }
        setSelectedIds(prev => prev.filter(x => x !== id));
        initializeFromDatabase();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} expenses?`)) {
      try {
        for (const id of selectedIds) {
          await deleteExpense(id);
        }
        setSelectedIds([]);
        setIsDetailOpen(false);
        setSelectedExpense(null);
        initializeFromDatabase();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBulkChangeStatus = async (status: string) => {
    try {
      for (const id of selectedIds) {
        await updateExpense(id, { status });
      }
      setSelectedIds([]);
      initializeFromDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkChangeCategory = async (category: string) => {
    try {
      for (const id of selectedIds) {
        await updateExpense(id, { category });
      }
      setSelectedIds([]);
      initializeFromDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  // Date and Math Logic
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const thisMonthStr = format(now, 'yyyy-MM');
  const lastMonthStr = format(subMonths(now, 1), 'yyyy-MM');
  const thisYearStr = format(now, 'yyyy');

  // KPI Sets
  const todayExpenses = expenses.filter(e => format(new Date(e.createdAt), 'yyyy-MM-dd') === todayStr);
  const weeklyExpenses = expenses.filter(e => (now.getTime() - new Date(e.createdAt).getTime()) <= 7 * 24 * 60 * 60 * 1000);
  const monthlyExpenses = expenses.filter(e => format(new Date(e.createdAt), 'yyyy-MM') === thisMonthStr);
  const lastMonthExpenses = expenses.filter(e => format(new Date(e.createdAt), 'yyyy-MM') === lastMonthStr);
  const annualExpenses = expenses.filter(e => format(new Date(e.createdAt), 'yyyy') === thisYearStr);

  const totalAllExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const weeklyTotal = weeklyExpenses.reduce((s, e) => s + e.amount, 0);
  const monthlyTotal = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const annualTotal = annualExpenses.reduce((s, e) => s + e.amount, 0);
  const largestExpenseValue = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;
  const pendingTotal = expenses.filter(e => (e.status || 'Paid') === 'Pending').reduce((s, e) => s + e.amount, 0);

  const uniqueDatesCount = new Set(expenses.map(e => format(new Date(e.createdAt), 'yyyy-MM-dd'))).size || 1;
  const averageDailyExpense = totalAllExpenses / uniqueDatesCount;

  // MoM growth calculations
  const expenseGrowthPct = lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  // Cash Flow Calculations
  const totalRevenue = sales.reduce((s, sl) => s + Number(sl.finalAmount || sl.total || 0), 0);
  const totalPurchases = purchaseOrders.reduce((s, po) => s + Number(po.totalAmount || po.amountPaid || 0), 0);
  const estimatedGrossProfit = totalRevenue - totalPurchases;
  const estimatedNetProfit = estimatedGrossProfit - totalAllExpenses;

  // Category wise
  const categoryTotals: { [key: string]: number } = {};
  categories.forEach(cat => { categoryTotals[cat] = 0; });
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const categorySorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  // Vendor wise
  const vendorTotals: { [key: string]: number } = {};
  expenses.forEach(e => {
    const v = e.vendor || 'Unknown / General';
    vendorTotals[v] = (vendorTotals[v] || 0) + e.amount;
  });
  const vendorSorted = Object.entries(vendorTotals).sort((a, b) => b[1] - a[1]);

  // Payment method
  const paymentTotals: { [key: string]: number } = {};
  expenses.forEach(e => {
    paymentTotals[e.paymentMethod] = (paymentTotals[e.paymentMethod] || 0) + e.amount;
  });

  // Monthly trends (Last 6 Months)
  const monthlyTrends: { [key: string]: number } = {};
  for (let i = 5; i >= 0; i--) {
    const m = format(subMonths(now, i), 'MMM yyyy');
    monthlyTrends[m] = 0;
  }
  expenses.forEach(e => {
    const m = format(new Date(e.createdAt), 'MMM yyyy');
    if (monthlyTrends[m] !== undefined) {
      monthlyTrends[m] += e.amount;
    }
  });

  // Recurring trend vs variable
  const recurringTotal = expenses.filter(e => e.isRecurring).reduce((s, e) => s + e.amount, 0);
  const variableTotal = totalAllExpenses - recurringTotal;

  // Breakdown custom grouping engine
  const getBreakdownData = () => {
    const groups: { [key: string]: number } = {};
    expenses.forEach(e => {
      let key = '';
      if (breakdownGroupBy === 'category') key = e.category;
      else if (breakdownGroupBy === 'vendor') key = e.vendor || 'Unknown / General';
      else if (breakdownGroupBy === 'paymentMethod') key = e.paymentMethod;
      else if (breakdownGroupBy === 'month') key = format(new Date(e.createdAt), 'MMM yyyy');
      else if (breakdownGroupBy === 'quarter') key = `Q${getQuarter(new Date(e.createdAt))} ${getYear(new Date(e.createdAt))}`;
      else if (breakdownGroupBy === 'year') key = format(new Date(e.createdAt), 'yyyy');

      groups[key] = (groups[key] || 0) + e.amount;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  };

  // Smart insights
  const insights: { type: 'warning' | 'info' | 'success'; title: string; desc: string; recommendation: string }[] = [];

  if (categorySorted.length > 0 && categorySorted[0][1] > 0) {
    insights.push({
      type: 'warning',
      title: `Highest Category Outflow: ${categorySorted[0][0]}`,
      desc: `Spending on ${categorySorted[0][0]} accounts for Rs. ${categorySorted[0][1].toLocaleString()} (${((categorySorted[0][1] / (totalAllExpenses || 1)) * 100).toFixed(0)}% of total expenses).`,
      recommendation: `Conduct a cost audit of ${categorySorted[0][0]} suppliers to negotiate bulk monthly packages or subscription reductions.`
    });
  }

  if (expenseGrowthPct > 10) {
    insights.push({
      type: 'warning',
      title: `Fast Expense Growth Alert`,
      desc: `Your spending grew by ${expenseGrowthPct.toFixed(0)}% MoM (Rs. ${monthlyTotal.toLocaleString()} vs Rs. ${lastMonthTotal.toLocaleString()}).`,
      recommendation: `Check your operational logistics and cut down non-critical variable expenses immediately.`
    });
  }

  budgets.forEach(b => {
    const actual = categoryTotals[b.category] || 0;
    if (actual > b.limit) {
      insights.push({
        type: 'warning',
        title: `Budget Violation: ${b.category}`,
        desc: `You spent Rs. ${(actual - b.limit).toLocaleString()} over your category limit of Rs. ${b.limit.toLocaleString()}.`,
        recommendation: `Block new purchases under category ${b.category} until the next billing month commences.`
      });
    }
  });

  const frequentDescMap: { [key: string]: number } = {};
  expenses.forEach(e => { frequentDescMap[e.description] = (frequentDescMap[e.description] || 0) + 1; });
  const topFrequent = Object.entries(frequentDescMap).sort((a, b) => b[1] - a[1])[0];
  if (topFrequent && topFrequent[1] >= 3) {
    insights.push({
      type: 'info',
      title: `High-Frequency Transaction`,
      desc: `"${topFrequent[0]}" occurs ${topFrequent[1]} times in your record.`,
      recommendation: `Automate this recurring bill by setting up a scheduled auto-post transaction rule.`
    });
  }

  // Reports exporter PDF
  const handleExportPDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    let titleText = 'Expense Intelligence & Analytics Report';
    if (selectedReportType === 'summary') titleText = 'Expense Summary Report';
    else if (selectedReportType === 'monthly') titleText = 'Monthly Expense Analysis';
    else if (selectedReportType === 'category') titleText = 'Category Outflow Report';
    else if (selectedReportType === 'vendor') titleText = 'Vendor Payee Outflow Report';
    else if (selectedReportType === 'budget') titleText = 'Budget & Variance Report';
    else if (selectedReportType === 'cashflow') titleText = 'Cash Flow Summary Ledger';

    doc.text(titleText, pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Report specific sections
    if (selectedReportType === 'cashflow') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Cash Flow Metrics Summary', 15, y); y += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Sales Revenue: Rs. ${totalRevenue.toLocaleString()}`, 20, y); y += 6;
      doc.text(`Total Purchase Ledger: Rs. ${totalPurchases.toLocaleString()}`, 20, y); y += 6;
      doc.text(`Total Operational Expenses: Rs. ${totalAllExpenses.toLocaleString()}`, 20, y); y += 6;
      doc.text(`Estimated Gross Profit: Rs. ${estimatedGrossProfit.toLocaleString()}`, 20, y); y += 6;
      doc.text(`Estimated Net Profit: Rs. ${estimatedNetProfit.toLocaleString()}`, 20, y);
    } else if (selectedReportType === 'budget') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Actual vs Budget Variance Table', 15, y); y += 8;
      doc.setFontSize(10);
      budgets.forEach(b => {
        const spent = categoryTotals[b.category] || 0;
        const variance = b.limit - spent;
        if (y < 275) {
          doc.setFont('helvetica', 'bold');
          doc.text(`${b.category}:`, 20, y);
          doc.setFont('helvetica', 'normal');
          doc.text(`Limit: Rs. ${b.limit.toLocaleString()} | Spent: Rs. ${spent.toLocaleString()} | Var: Rs. ${variance.toLocaleString()}`, 45, y);
          y += 6;
        }
      });
    } else if (selectedReportType === 'category') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Outflows grouped by category', 15, y); y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      categorySorted.forEach(([cat, val]) => {
        if (val > 0 && y < 275) {
          doc.text(`${cat}: Rs. ${val.toLocaleString()}`, 20, y);
          y += 6;
        }
      });
    } else if (selectedReportType === 'vendor') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Outflows grouped by payee', 15, y); y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      vendorSorted.forEach(([vendor, val]) => {
        if (val > 0 && y < 275) {
          doc.text(`${vendor}: Rs. ${val.toLocaleString()}`, 20, y);
          y += 6;
        }
      });
    } else {
      // summary default dump
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('General Summary KPIs', 15, y); y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Outflow Volume: Rs. ${totalAllExpenses.toLocaleString()}`, 20, y); y += 6;
      doc.text(`Today's Posting Rate: Rs. ${todayTotal.toLocaleString()}`, 20, y); y += 6;
      doc.text(`Current Month Bill Vol: Rs. ${monthlyTotal.toLocaleString()}`, 20, y); y += 6;
      doc.text(`Largest Individual Voucher: Rs. ${largestExpenseValue.toLocaleString()}`, 20, y);
    }

    doc.save(`financial_${selectedReportType}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleExportCSVReport = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let title = 'report';

    if (selectedReportType === 'summary') {
      title = 'expense_summary';
      headers = ['Category', 'Total Spent', 'Percentage Contribution'];
      rows = categorySorted.map(([cat, val]) => [
        cat,
        val,
        totalAllExpenses > 0 ? ((val / totalAllExpenses) * 100).toFixed(1) + '%' : '0%'
      ]);
    } else if (selectedReportType === 'cashflow') {
      title = 'cash_flow_summary';
      headers = ['Financial Metric', 'Amount (Rs.)'];
      rows = [
        ['Total Revenue (Sales)', totalRevenue],
        ['Total Purchases', totalPurchases],
        ['Total Operational Expenses', totalAllExpenses],
        ['Estimated Gross Profit', estimatedGrossProfit],
        ['Estimated Net Profit', estimatedNetProfit]
      ];
    } else if (selectedReportType === 'budget') {
      title = 'budget_utilization_report';
      headers = ['Category', 'Budget Limit', 'Actual Spent', 'Remaining', 'Utilization %'];
      rows = budgets.map(b => {
        const spent = categoryTotals[b.category] || 0;
        return [
          b.category,
          b.limit,
          spent,
          b.limit - spent,
          b.limit > 0 ? ((spent / b.limit) * 100).toFixed(0) + '%' : '—'
        ];
      });
    } else if (selectedReportType === 'vendor') {
      title = 'vendor_outflow_report';
      headers = ['Vendor / Payee', 'Total Outflow Amount'];
      rows = vendorSorted;
    } else if (selectedReportType === 'category') {
      title = 'category_report';
      headers = ['Category', 'Amount'];
      rows = categorySorted;
    } else {
      // fallback all list
      handleExportCSV();
      return;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleExportCSV = (listToExport = filteredExpenses) => {
    if (listToExport.length === 0) {
      alert('No data to export.');
      return;
    }
    const headers = ['Expense ID', 'Date', 'Category', 'Vendor/Payee', 'Description', 'Amount', 'Payment Method', 'Status', 'Added By', 'Last Updated', 'Is Recurring', 'Frequency', 'Next Date'];
    const rows = listToExport.map(e => [
      `EXP-${e.id}`,
      format(new Date(e.createdAt), 'yyyy-MM-dd'),
      e.category,
      e.vendor || '',
      e.description.replace(/"/g, '""'),
      e.amount,
      e.paymentMethod,
      e.status || 'Paid',
      e.addedBy || 'Admin',
      e.lastUpdated ? format(new Date(e.lastUpdated), 'yyyy-MM-dd HH:mm') : '',
      e.isRecurring ? 'Yes' : 'No',
      e.recurringFrequency || '',
      e.nextRecurringDate || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses_ledger_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // CSV Import Parser
  const handleParseCSV = () => {
    if (!csvTextInput.trim()) {
      alert('Please paste or select a CSV content.');
      return;
    }
    const lines = csvTextInput.split('\n');
    if (lines.length < 2) {
      alert('CSV must contain a header row.');
      return;
    }

    try {
      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        if (matches.length < 4) continue;

        const clean = (val: string) => val.replace(/^["']|["']$/g, '').trim();

        const categoryVal = clean(matches[2]) || 'Miscellaneous';
        const vendorVal = clean(matches[3]) || '';
        const descriptionVal = clean(matches[4]) || 'Imported Expense';
        const amountVal = parseFloat(clean(matches[5])) || 0;
        const paymentVal = clean(matches[6]) || 'Cash';
        const statusVal = clean(matches[7]) || 'Paid';
        const addedByVal = clean(matches[8]) || 'Admin';

        addExpense({
          description: descriptionVal,
          category: categoryVal,
          amount: amountVal,
          paymentMethod: paymentVal,
          vendor: vendorVal,
          status: statusVal,
          addedBy: addedByVal,
          lastUpdated: new Date().toISOString()
        } as Omit<Expense, 'id' | 'createdAt'>);
        
        importedCount++;
      }

      alert(`Successfully imported ${importedCount} expenses!`);
      setCsvTextInput('');
      setIsImportModalOpen(false);
      initializeFromDatabase();
    } catch (error) {
      console.error(error);
      alert('Failed to parse CSV.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvTextInput(text);
    };
    reader.readAsText(file);
  };

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(e => {
      // Search term match
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          e.id.toString().toLowerCase().includes(term) ||
          e.description.toLowerCase().includes(term) ||
          (e.vendor && e.vendor.toLowerCase().includes(term)) ||
          e.category.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filterCategory && e.category !== filterCategory) return false;

      // Payment method filter
      if (filterPaymentMethod && e.paymentMethod !== filterPaymentMethod) return false;

      // Status filter
      if (filterStatus && (e.status || 'Paid') !== filterStatus) return false;

      // Min amount filter
      if (filterMinAmount) {
        const minVal = parseFloat(filterMinAmount);
        if (!isNaN(minVal) && e.amount < minVal) return false;
      }

      // Max amount filter
      if (filterMaxAmount) {
        const maxVal = parseFloat(filterMaxAmount);
        if (!isNaN(maxVal) && e.amount > maxVal) return false;
      }

      // Start date filter
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        const created = new Date(e.createdAt);
        if (created < start) return false;
      }

      // End date filter
      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        const created = new Date(e.createdAt);
        if (created > end) return false;
      }

      return true;
    });
  }, [
    expenses,
    searchTerm,
    filterCategory,
    filterPaymentMethod,
    filterStatus,
    filterMinAmount,
    filterMaxAmount,
    filterStartDate,
    filterEndDate
  ]);

  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        
        {/* Standardized Page Header */}
        <PageHeader
          title={`${t('Expenses')} Dashboard & Analytics`}
          subtitle="Complete Zoho-inspired financial dashboard with budget rules, cash flow summaries, MoM growths, and custom reports."
          icon={Layers}
          breadcrumbs={[
            { label: t('common.home', 'Home'), onClick: () => window.location.hash = '#/' },
            { label: t('Expenses', 'Expenses') }
          ]}
          actions={[
            {
              label: 'Record Expense',
              onClick: () => {
                resetForm();
                setIsModalOpen(true);
              },
              icon: Plus,
              variant: 'primary'
            },
            {
              label: 'Import',
              onClick: () => setIsImportModalOpen(true),
              icon: Upload,
              variant: 'secondary'
            },
            {
              label: 'PDF Report',
              onClick: handleExportPDFReport,
              icon: Download,
              variant: 'secondary'
            }
          ]}
        />

        {/* View Tabs */}
        <div className="flex flex-wrap gap-4 border-b border-slate-200 dark:border-slate-850 pb-px text-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
            }`}
          >
            <PieChart className="h-4 w-4" /> Financial Dashboard
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" /> Expense Ledger ({filteredExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`pb-3 font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'breakdown'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
            }`}
          >
            <BarChart2 className="h-4 w-4" /> Spending Breakdown
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`pb-3 font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'budgets'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4" /> Budget Planner
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`pb-3 font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'recurring'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
            }`}
          >
            <RefreshCw className="h-4 w-4" /> Recurring Schedules
          </button>
        </div>

        {/* 1. FINANCIAL DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Today's Expenses"
                value={`Rs. ${todayTotal.toLocaleString()}`}
                icon={Layers}
                iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400"
                comparisonText={`${todayExpenses.length} transactions posted`}
              />
              <KpiCard
                title="This Month"
                value={`Rs. ${monthlyTotal.toLocaleString()}`}
                icon={Layers}
                iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400"
                trend={{
                  value: `${expenseGrowthPct >= 0 ? '+' : ''}${expenseGrowthPct.toFixed(0)}% MoM`,
                  type: expenseGrowthPct >= 0 ? 'negative' : 'positive'
                }}
                comparisonText="vs last month"
              />
              <KpiCard
                title="Annual Expenses"
                value={`Rs. ${annualTotal.toLocaleString()}`}
                icon={Layers}
                iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400"
                comparisonText={`Current calendar year ${thisYearStr}`}
              />
              <KpiCard
                title="Pending Expenses"
                value={`Rs. ${pendingTotal.toLocaleString()}`}
                icon={Layers}
                iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400"
                comparisonText="Voucher amounts awaiting payment"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ContentCard
                title="Integrated Cash Flow Overview"
                subtitle="Zoho-inspired transaction streams summary"
                className="lg:col-span-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-150 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue (Sales)</span>
                    <p className="text-lg font-black text-emerald-600 mt-1">Rs. {totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-150 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Purchases (COGS)</span>
                    <p className="text-lg font-black text-rose-500 mt-1">Rs. {totalPurchases.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-150 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Expenses</span>
                    <p className="text-lg font-black text-indigo-650 dark:text-indigo-400 mt-1">Rs. {totalAllExpenses.toLocaleString()}</p>
                  </div>
                </div>

                <div className="border-t border-slate-150 dark:border-slate-700 mt-4 pt-4 grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded">
                    <span className="text-slate-550">Estimated Gross Profit</span>
                    <span className="text-slate-900 dark:text-white font-black">Rs. {estimatedGrossProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/25 p-3 rounded">
                    <span className="text-indigo-900 dark:text-indigo-305">Estimated Net Profit</span>
                    <span className={`font-black text-sm ${estimatedNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-505'}`}>
                      Rs. {estimatedNetProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </ContentCard>

              <ContentCard
                title="Quick Actions"
                subtitle="Common tasks & workflows"
              >
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="p-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-100 rounded-lg text-indigo-750 dark:text-indigo-300 font-bold transition-all text-center">
                    + Add Expense
                  </button>
                  <button onClick={() => setActiveTab('budgets')} className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg text-slate-800 dark:text-slate-355 font-bold border transition-all text-center">
                    View Budgets
                  </button>
                  <button onClick={handleExportPDFReport} className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg text-slate-800 dark:text-slate-355 font-bold border transition-all text-center">
                    Export PDF
                  </button>
                  <button onClick={() => { setSelectedReportType('summary'); handleExportCSVReport(); }} className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-lg text-slate-800 dark:text-slate-355 font-bold border transition-all text-center">
                    Export CSV
                  </button>
                </div>
              </ContentCard>
            </div>

            <ContentCard
              title="Intelligence & Cost Saving Insights"
              subtitle="Data-driven suggestions to optimize operational spend"
            >
              {insights.length === 0 ? (
                <p className="text-xs text-slate-550 dark:text-slate-400">Recording more billing entries will unlock dynamic savings suggestions and cost alerts.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((ins, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 flex gap-3 text-xs">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{ins.title}</p>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{ins.desc}</p>
                        <p className="text-indigo-650 dark:text-indigo-400 font-semibold mt-2 flex items-center gap-1">
                          <Info className="h-3.5 w-3.5" /> Recommendation: {ins.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ContentCard>

            {/* Interactive Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <ContentCard
                title="Monthly Outflow Trend"
                subtitle="Historical monthly comparison"
                className="lg:col-span-2"
                actions={<span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded text-indigo-650 dark:text-indigo-400 font-bold">Line Chart View</span>}
              >
                {/* SVG Line visualization */}
                <div className="h-56 w-full pt-4 relative">
                  <svg className="h-full w-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    <line x1="0" y1="50" x2="600" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="150" x2="600" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                    
                    {/* Generate path values */}
                    {(() => {
                      const vals = Object.values(monthlyTrends);
                      const maxVal = Math.max(...vals) || 1;
                      const points = vals.map((val, idx) => {
                        const x = (idx / 5) * 560 + 20;
                        const y = 170 - (val / maxVal) * 140;
                        return `${x},${y}`;
                      });
                      return (
                        <>
                          {/* Shaded Area */}
                          <path
                            d={`M 20 170 L ${points.join(' L ')} L 580 170 Z`}
                            fill="url(#trendGrad)"
                            opacity="0.15"
                          />
                          {/* Line */}
                          <polyline
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="3.5"
                            points={points.join(' ')}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Data points */}
                          {vals.map((val, idx) => {
                            const x = (idx / 5) * 560 + 20;
                            const y = 170 - (val / maxVal) * 140;
                            return (
                              <g key={idx} className="cursor-pointer group">
                                <circle cx={x} cy={y} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                              </g>
                            );
                          })}
                          <defs>
                            <linearGradient id="trendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </>
                      );
                    })()}
                  </svg>
                  
                  {/* Labels */}
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-2 mt-1">
                    {Object.keys(monthlyTrends).map((m, i) => (
                      <span key={i}>{m}</span>
                    ))}
                  </div>
                </div>
              </ContentCard>

              {/* Recurring vs Variable Stack Trend */}
              <ContentCard
                title="Recurring vs Variable Outflows"
                subtitle="Ratio comparison of standard vs variable outflows"
              >
                <div className="space-y-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-550">Recurring Expenses (e.g. Rent, Salaries)</span>
                      <span className="text-slate-905 dark:text-white">Rs. {recurringTotal.toLocaleString()}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div style={{ width: `${(recurringTotal / (totalAllExpenses || 1)) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-550">Variable Expenses (Utilities, Fuel, Supplies)</span>
                      <span className="text-slate-905 dark:text-white">Rs. {variableTotal.toLocaleString()}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div style={{ width: `${(variableTotal / (totalAllExpenses || 1)) * 100}%` }} className="h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-150 dark:border-slate-800 text-xxs text-slate-500 leading-relaxed mt-4">
                    Setting up recurring templates forces reliable cash flow projection. Use variable categories for discretionary expense limits.
                  </div>
                </div>
              </ContentCard>

            </div>

            <ContentCard
              title="Export Financial intelligence Ledger Reports"
              subtitle="Generate specific reports for audits"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="summary">Expense Summary</option>
                  <option value="monthly">Monthly Expense Report</option>
                  <option value="category">Category Report</option>
                  <option value="vendor">Vendor Report</option>
                  <option value="budget">Budget Report</option>
                  <option value="cashflow">Cash Flow Summary</option>
                </select>

                <button
                  onClick={handleExportCSVReport}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5 justify-center"
                >
                  <Download className="h-4.5 w-4.5" /> Download CSV
                </button>
                <button
                  onClick={handleExportPDFReport}
                  className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5 justify-center"
                >
                  <Download className="h-4.5 w-4.5" /> Download PDF
                </button>
              </div>
            </ContentCard>

          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-6 animate-fade-in">
            <FilterSection
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search by ID, Vendor, Description, Category..."
              showDateFilter={true}
              startDate={filterStartDate}
              endDate={filterEndDate}
              onStartDateChange={setFilterStartDate}
              onEndDateChange={setFilterEndDate}
              showStatusFilter={true}
              statusValue={filterStatus}
              onStatusChange={setFilterStatus}
              statusOptions={statuses.map(s => ({ label: s, value: s }))}
              showCategoryFilter={true}
              categoryValue={filterCategory}
              onCategoryChange={setFilterCategory}
              categoryOptions={categories.map(c => ({ label: c, value: c }))}
              onReset={() => {
                setSearchTerm('');
                setFilterCategory('');
                setFilterPaymentMethod('');
                setFilterStatus('');
                setFilterMinAmount('');
                setFilterMaxAmount('');
                setFilterStartDate('');
                setFilterEndDate('');
              }}
            >
              {/* Custom Payment Method Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400">Payment Method</label>
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Payments</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {/* Min Amount Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400">Min Amount</label>
                <input
                  type="number"
                  value={filterMinAmount}
                  onChange={(e) => setFilterMinAmount(e.target.value)}
                  placeholder="Rs"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Max Amount Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400">Max Amount</label>
                <input
                  type="number"
                  placeholder="Rs"
                  value={filterMaxAmount}
                  onChange={(e) => setFilterMaxAmount(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-850 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </FilterSection>

            {/* Table wrapped in ContentCard */}
            <ContentCard noPadding={true}>
              {selectedIds.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-950/45 px-5 py-3 border-b border-indigo-150 dark:border-indigo-900/50 flex items-center justify-between text-xs gap-3">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-200">{selectedIds.length} items selected</span>
                  <div className="flex gap-2">
                    <button onClick={handleBulkDelete} className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xxs font-bold">Delete Selected</button>
                    <button onClick={() => setSelectedIds([])} className="text-slate-500 hover:text-slate-700 text-xxs font-semibold ml-2">Cancel</button>
                  </div>
                </div>
              )}

              {filteredExpenses.length === 0 ? (
                <EmptyState
                  title="No Expenses Found"
                  description="No transactions match your current search queries or filter settings. Click below to add a new record."
                  action={{
                    label: "Record Expense",
                    onClick: () => {
                      resetForm();
                      setIsModalOpen(true);
                    }
                  }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <th className="p-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(filteredExpenses.map(x => x.id));
                              else setSelectedIds([]);
                            }}
                            className="rounded border-slate-350 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="p-4">Expense ID</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Vendor</th>
                        <th className="p-4">Description</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-sm">
                    {filteredExpenses.map(e => {
                      const isSelected = selectedIds.includes(e.id);
                      return (
                        <tr key={e.id} onClick={() => { setSelectedExpense(e); setIsDetailOpen(true); }} className={`hover:bg-slate-50/70 dark:hover:bg-slate-750/30 cursor-pointer ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                          <td className="p-4 text-center" onClick={ev => ev.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => setSelectedIds(prev => prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id])}
                              className="rounded border-slate-300 text-indigo-650"
                            />
                          </td>
                          <td className="p-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-350">EXP-{e.id}</td>
                          <td className="p-4 whitespace-nowrap text-slate-805 dark:text-slate-200">{format(new Date(e.createdAt), 'dd MMM yyyy')}</td>
                          <td className="p-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400">{e.category}</span></td>
                          <td className="p-4 font-semibold text-slate-800 dark:text-slate-300">{e.vendor || '—'}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400 truncate max-w-[180px]">{e.description}</td>
                          <td className="p-4 font-bold text-right text-slate-900 dark:text-white">Rs. {e.amount.toLocaleString()}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-450">{e.paymentMethod}</td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xxs font-bold uppercase ${e.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {e.status || 'Paid'}
                            </span>
                          </td>
                          <td className="p-4 text-center" onClick={ev => ev.stopPropagation()}>
                            <div className="flex justify-center gap-1.5">
                              <button onClick={() => handleEdit(e)} className="text-slate-400 hover:text-indigo-605 p-1"><Edit2 className="h-4 w-4" /></button>
                              <button onClick={() => handleDelete(e.id)} className="text-slate-405 hover:text-red-655 p-1"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ContentCard>
          </div>
        )}

        {/* 3. SPENDING BREAKDOWN */}
        {activeTab === 'breakdown' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Spending Outflow Breakdown Matrices</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">View aggregate expenditures sliced by time period, payee or payment mode.</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={breakdownGroupBy}
                    onChange={(e) => setBreakdownGroupBy(e.target.value as any)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-850 rounded-lg text-xs"
                  >
                    <option value="category">Group by Category</option>
                    <option value="vendor">Group by Vendor/Payee</option>
                    <option value="paymentMethod">Group by Payment Method</option>
                    <option value="month">Group by Month</option>
                    <option value="quarter">Group by Quarter</option>
                    <option value="year">Group by Year</option>
                  </select>
                </div>
              </div>

              {/* Breakdown aggregation list table */}
              <div className="overflow-x-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3">Grouping Entity Label</th>
                      <th className="p-3 text-right">Sum Outflow Amount</th>
                      <th className="p-3 text-right">Percentage Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {getBreakdownData().map(([label, val]) => (
                      <tr key={label} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-300">{label}</td>
                        <td className="p-3 font-bold text-right text-slate-900 dark:text-white">Rs. {val.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium text-slate-500">
                          {totalAllExpenses > 0 ? ((val / totalAllExpenses) * 100).toFixed(1) + '%' : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. BUDGET PLANNER */}
        {activeTab === 'budgets' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Monthly Expense Budget Planning</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Establish category thresholds to limit operational cash leakage.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {budgets.map(b => {
                  const spent = categoryTotals[b.category] || 0;
                  const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
                  const remaining = b.limit - spent;
                  const isOver = spent > b.limit;

                  return (
                    <div key={b.category} className="p-4 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-850 dark:text-white text-sm">{b.category}</span>
                        {editingBudgetCategory === b.category ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={editingBudgetLimit}
                              onChange={(e) => setEditingBudgetLimit(e.target.value)}
                              className="w-24 px-2 py-1 text-xs border rounded bg-white dark:bg-slate-900 text-slate-905"
                            />
                            <button onClick={handleSaveBudget} className="px-2 py-1 bg-indigo-650 text-white rounded text-xxs font-bold">Save</button>
                            <button onClick={() => setEditingBudgetCategory(null)} className="p-1 text-slate-405"><X className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingBudgetCategory(b.category); setEditingBudgetLimit(b.limit.toString()); }} className="text-indigo-650 text-xs font-semibold hover:underline">Edit limit</button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs font-semibold pt-1 border-t border-dashed">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal">Target Budget</span>
                          <span className="text-slate-805">Rs. {b.limit.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal">Spent Actual</span>
                          <span className="text-slate-900 font-bold">Rs. {spent.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal">Variance</span>
                          <span className={`font-black ${isOver ? 'text-rose-500' : 'text-emerald-600'}`}>Rs. {remaining.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                          <div style={{ width: `${Math.min(pct, 100)}%` }} className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Utilization Status</span>
                          <span>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 5. RECURRING SCHEDULES */}
        {activeTab === 'recurring' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Recurring Rules</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-750 bg-slate-50/75 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      <th className="p-4">Rule ID</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Vendor</th>
                      <th className="p-4">Description</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4">Frequency</th>
                      <th className="p-4">Next Auto-Post Date</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {expenses.filter(e => e.isRecurring).map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50/70">
                        <td className="p-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-350">REC-{expense.id}</td>
                        <td className="p-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400">{expense.category}</span></td>
                        <td className="p-4 text-slate-805 font-medium">{expense.vendor || '—'}</td>
                        <td className="p-4 text-slate-600 truncate max-w-[200px]">{expense.description}</td>
                        <td className="p-4 font-bold text-right text-slate-900">Rs. {expense.amount.toLocaleString()}</td>
                        <td className="p-4 text-indigo-650 capitalize font-semibold text-xs">{expense.recurringFrequency}</td>
                        <td className="p-4 font-semibold text-slate-800">
                          {expense.nextRecurringDate ? format(parseISO(expense.nextRecurringDate), 'dd MMM yyyy') : '—'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEdit(expense)} className="text-slate-450 hover:text-indigo-650 p-1"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(expense.id)} className="text-slate-455 hover:text-red-655 p-1"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* DETAIL DRAWER / SLIDE-OVER SIDE PANEL */}
      {isDetailOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 h-full flex flex-col shadow-2xl animate-slide-left border-l border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-150 dark:border-slate-750 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div>
                <span className="text-xxs font-mono font-extrabold uppercase tracking-widest text-slate-400">Expense Profile</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">EXP-{selectedExpense.id}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(selectedExpense)} className="p-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-700 hover:bg-slate-100"><Edit2 className="h-4.5 w-4.5" /></button>
                <button onClick={() => handleDelete(selectedExpense.id)} className="p-2 border rounded-lg bg-white dark:bg-slate-800 text-red-500 hover:bg-red-50"><Trash2 className="h-4.5 w-4.5" /></button>
                <button onClick={() => { setIsDetailOpen(false); setSelectedExpense(null); }} className="p-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-650"><X className="h-4.5 w-4.5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Description</span>
                  <span className="text-sm font-semibold text-slate-850 dark:text-white mt-1 block">{selectedExpense.description}</span>
                </div>
                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Amount</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">Rs. {selectedExpense.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Status</span>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase bg-emerald-50 text-emerald-600 mt-1">{selectedExpense.status || 'Paid'}</span>
                </div>
                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Category</span>
                  <span className="text-xs font-semibold text-indigo-650 mt-1 block">{selectedExpense.category}</span>
                </div>
                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Vendor</span>
                  <span className="text-xs font-semibold text-slate-800 mt-1 block">{selectedExpense.vendor || '—'}</span>
                </div>
              </div>

              <div>
                <span className="text-xxs font-bold text-slate-455 uppercase tracking-widest block mb-1">Private Notes</span>
                <div className="bg-slate-50 p-3 rounded-lg border min-h-16 text-slate-655 text-xs">{selectedExpense.notes || 'No notes.'}</div>
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 dark:bg-slate-850">
              <button onClick={() => { setIsDetailOpen(false); setSelectedExpense(null); }} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg font-bold text-sm">Close Drawer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-700 animate-slide-up">
            <div className="p-6 border-b border-slate-150 dark:border-slate-750 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Business Expense' : 'Record New Expense'}</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-405 hover:text-slate-600 p-1"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expense Description *</label>
                  <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm" placeholder="e.g. Office rent, Server fees" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm">
                    {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount Paid (Rs.) *</label>
                  <input type="number" required min="0.01" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vendor / Payee</label>
                  <input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm" placeholder="Vendor name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm">
                    {paymentMethods.map((method) => (<option key={method} value={method}>{method}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm">
                    {statuses.map((status) => (<option key={status} value={status}>{status}</option>))}
                  </select>
                </div>
              </div>

              {/* Recurring Switch */}
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-705 dark:text-slate-300 flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-500" /> Recurring Rule?
                    </label>
                    <p className="text-[10px] text-slate-405">Repeat outflows automatically</p>
                  </div>
                  <input type="checkbox" checked={formData.isRecurring} onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })} className="rounded text-indigo-650 h-4.5 w-4.5" />
                </div>
                {formData.isRecurring && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Frequency</label>
                      <select value={formData.recurringFrequency} onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as any })} className="w-full px-2 py-1.5 border rounded bg-white dark:bg-slate-900 text-slate-905">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Next Trigger Date</label>
                      <input type="date" value={formData.nextRecurringDate} onChange={(e) => setFormData({ ...formData, nextRecurringDate: e.target.value })} className="w-full px-2 py-1 border rounded bg-white dark:bg-slate-900 text-slate-905" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg text-slate-750 dark:text-slate-350 font-bold hover:bg-slate-50 text-sm">Cancel</button>
                <LoadingButton type="submit" isLoading={isSaving} loadingText="Saving..." className="flex-1 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm">Save Expense</LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-slide-up">
            <div className="p-6 border-b border-slate-150 dark:border-slate-750 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import via CSV</h2>
              <button onClick={() => { setIsImportModalOpen(false); setCsvTextInput(''); }} className="text-slate-400 hover:text-slate-600 p-1"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="w-full text-xs" />
              <textarea value={csvTextInput} onChange={(e) => setCsvTextInput(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono" placeholder="ID,Date,Category,Vendor,Description,Amount,PaymentMethod,Status,AddedBy" rows={6} />
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setIsImportModalOpen(false); setCsvTextInput(''); }} className="flex-1 px-4 py-2 border rounded text-slate-750 hover:bg-slate-50 text-sm">Cancel</button>
                <button onClick={handleParseCSV} className="flex-1 px-4 py-2 bg-indigo-650 text-white rounded font-bold text-sm">Process CSV</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Expenses;
