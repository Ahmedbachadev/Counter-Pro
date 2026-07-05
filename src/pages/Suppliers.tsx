import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, CreditCard as Edit, Trash2, Eye, Phone, Mail, MapPin, User, Package, 
  DollarSign, Calendar, Download, Upload, FileText, ChevronLeft, Filter, Check, X, 
  FileSpreadsheet, AlertCircle, Clock, Building, Landmark, Percent, RefreshCw, 
  ArrowLeft, LayoutGrid, List, FileCheck, CheckCircle2, ChevronRight, TrendingUp,
  Award, AlertTriangle, HelpCircle, ShieldAlert, Sparkles, Receipt, ArrowUpDown
} from 'lucide-react';
import { useSupplierStore, Supplier } from '../stores/supplierStore';
import { usePurchaseStore } from '../stores/purchaseStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';
import EmptyState from '../components/EmptyState';
import DetailPageLayout from '../components/DetailPageLayout';

const DEFAULT_CATEGORIES = [
  'Distributor',
  'Manufacturer',
  'Wholesaler',
  'Local Supplier',
  'Importer'
];

interface MockDocument {
  id: string;
  name: string;
  type: 'Contract' | 'Price List' | 'Tax Certificate' | 'Agreement';
  addedAt: string;
  size: string;
}

interface ActivityItem {
  id: string;
  action: string;
  date: string;
  user: string;
}

const Suppliers: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierStats,
    getSupplierStockPurchases
  } = useSupplierStore();

  const { purchaseOrders, recordPayment } = usePurchaseStore();
  const { products } = useInventoryStore();

  // Navigation & Tabs
  const [activeView, setActiveView] = useState<'list' | 'profile'>('list');
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'analytics' | 'comparison' | 'insights' | 'reports'>('directory');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [profileTab, setProfileTab] = useState<'history' | 'notes' | 'timeline' | 'documents'>('history');

  // Directory UI Layout / Filter / Search
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBalance, setFilterBalance] = useState<'all' | 'outstanding' | 'none'>('all');
  const [filterRegDate, setFilterRegDate] = useState({ start: '', end: '' });
  const [filterPurchaseDate, setFilterPurchaseDate] = useState({ start: '', end: '' });

  // Custom Categories
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const allCategories = useMemo(() => {
    const existingCats = suppliers.map(s => s.category).filter(Boolean) as string[];
    const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCats, ...customCategories]));
    return combined;
  }, [suppliers, customCategories]);

  // Modals & Action States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Payment Form State
  const [payFormSupplierId, setPayFormSupplierId] = useState<number | ''>('');
  const [payFormOrderId, setPayFormOrderId] = useState<number | ''>('');
  const [payFormAmount, setPayFormAmount] = useState<number | ''>('');
  const [payFormMethod, setPayFormMethod] = useState<'Cash' | 'Bank Transfer' | 'Card' | 'Cheque' | 'Mobile Wallet' | 'Other'>('Cash');
  const [payFormNotes, setPayFormNotes] = useState('');

  // Selected Product for Price History Chart Modal
  const [selectedComparisonProduct, setSelectedComparisonProduct] = useState<any | null>(null);

  // Selected Report type for Reports tab
  const [selectedReport, setSelectedReport] = useState<'directory' | 'performance' | 'outstanding' | 'purchases' | 'comparison'>('directory');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    logo: '',
    category: 'Wholesaler',
    status: 'Active' as 'Active' | 'Inactive',
    taxId: '',
    bankName: '',
    bankAccount: '',
    paymentTerms: '',
    specialties: '',
    discountRate: 0,
  });

  // Local Mock State for Documents & Actions inside Profile View
  const [documents, setDocuments] = useState<MockDocument[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<MockDocument['type']>('Contract');
  const [timelineItems, setTimelineItems] = useState<ActivityItem[]>([]);
  const [timelineSearch, setTimelineSearch] = useState('');

  // Import State
  const [csvTextInput, setCsvTextInput] = useState('');
  const [importSummary, setImportSummary] = useState<{
    valid: any[];
    duplicates: any[];
    invalid: any[];
    parsed: boolean;
  }>({ valid: [], duplicates: [], invalid: [], parsed: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find active selected supplier
  const selectedSupplier = useMemo(() => {
    if (!selectedSupplierId) return null;
    return suppliers.find(s => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Load selected supplier details
  useEffect(() => {
    if (selectedSupplier) {
      try {
        const docs = selectedSupplier.documents ? JSON.parse(selectedSupplier.documents) : [];
        setDocuments(docs);
      } catch (e) {
        setDocuments([]);
      }

      try {
        const logs = selectedSupplier.activityLog ? JSON.parse(selectedSupplier.activityLog) : [];
        setTimelineItems(logs);
      } catch (e) {
        setTimelineItems([]);
      }
    }
  }, [selectedSupplier]);

  // Calculate stats and consolidate suppliers
  const supplierListWithFinancials = useMemo(() => {
    return suppliers.map(supplier => {
      const sOrders = purchaseOrders.filter(
        o => o.supplierId === supplier.id && o.status !== 'Cancelled'
      );
      
      const totalPurchases = sOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const outstandingBalance = sOrders.reduce((sum, o) => sum + o.remainingBalance, 0);
      
      let lastPurchaseDate = supplier.lastPurchaseDate || '';
      if (sOrders.length > 0) {
        const dates = sOrders.map(o => new Date(o.purchaseDate).getTime());
        const maxDate = Math.max(...dates);
        lastPurchaseDate = new Date(maxDate).toISOString().split('T')[0];
      }

      return {
        ...supplier,
        outstandingBalance: outstandingBalance || supplier.outstandingBalance || 0,
        totalPurchases: totalPurchases || supplier.totalPurchases || 0,
        lastPurchaseDate: lastPurchaseDate || null
      };
    });
  }, [suppliers, purchaseOrders]);

  // Advanced Search & Filter Logic
  const filteredSuppliers = useMemo(() => {
    return supplierListWithFinancials.filter(supplier => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        supplier.name.toLowerCase().includes(term) ||
        (supplier.contactPerson || '').toLowerCase().includes(term) ||
        (supplier.phone || '').toLowerCase().includes(term) ||
        (supplier.email || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (filterCategory && supplier.category !== filterCategory) return false;
      if (filterStatus && supplier.status !== filterStatus) return false;

      if (filterBalance === 'outstanding' && supplier.outstandingBalance <= 0) return false;
      if (filterBalance === 'none' && supplier.outstandingBalance > 0) return false;

      if (filterRegDate.start) {
        const start = new Date(filterRegDate.start);
        const reg = new Date(supplier.createdAt);
        if (reg < start) return false;
      }
      if (filterRegDate.end) {
        const end = new Date(filterRegDate.end + 'T23:59:59');
        const reg = new Date(supplier.createdAt);
        if (reg > end) return false;
      }

      if (filterPurchaseDate.start) {
        if (!supplier.lastPurchaseDate) return false;
        const start = new Date(filterPurchaseDate.start);
        const purchase = new Date(supplier.lastPurchaseDate);
        if (purchase < start) return false;
      }
      if (filterPurchaseDate.end) {
        if (!supplier.lastPurchaseDate) return false;
        const end = new Date(filterPurchaseDate.end + 'T23:59:59');
        const purchase = new Date(supplier.lastPurchaseDate);
        if (purchase > end) return false;
      }

      return true;
    });
  }, [supplierListWithFinancials, searchTerm, filterCategory, filterStatus, filterBalance, filterRegDate, filterPurchaseDate]);

  // General KPI values
  const generalKPIs = useMemo(() => {
    const active = supplierListWithFinancials.filter(s => s.status === 'Active');
    const totalDues = supplierListWithFinancials.reduce((sum, s) => sum + s.outstandingBalance, 0);
    const totalSpent = supplierListWithFinancials.reduce((sum, s) => sum + s.totalPurchases, 0);

    return {
      total: supplierListWithFinancials.length,
      active: active.length,
      outstanding: totalDues,
      purchasesYTD: totalSpent
    };
  }, [supplierListWithFinancials]);

  // Supplier Purchase Orders specific to selected profile
  const supplierPurchaseOrders = useMemo(() => {
    if (!selectedSupplierId) return [];
    return purchaseOrders.filter(o => o.supplierId === selectedSupplierId);
  }, [purchaseOrders, selectedSupplierId]);

  // Consolidated activity timeline for selected supplier
  const supplierTimeline = useMemo(() => {
    if (!selectedSupplier) return [];

    let items: ActivityItem[] = [...timelineItems];

    supplierPurchaseOrders.forEach(po => {
      items.push({
        id: `po-${po.id}`,
        action: `Purchase Order ${po.purchaseNumber} recorded. Status: ${po.status}`,
        date: po.createdAt,
        user: 'System'
      });

      po.paymentsHistory.forEach(pay => {
        items.push({
          id: `pay-${pay.id}`,
          action: `Recorded payment of Rs. ${pay.amount.toLocaleString()} via ${pay.method} for PO ${po.purchaseNumber}`,
          date: pay.date,
          user: 'System'
        });
      });

      po.returnsHistory.forEach(ret => {
        items.push({
          id: `ret-${ret.id}`,
          action: `Returned items worth Rs. ${ret.totalRefundAmount.toLocaleString()} for PO ${po.purchaseNumber}`,
          date: ret.returnedAt,
          user: 'System'
        });
      });
    });

    if (timelineSearch) {
      items = items.filter(item => 
        item.action.toLowerCase().includes(timelineSearch.toLowerCase())
      );
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedSupplier, timelineItems, supplierPurchaseOrders, timelineSearch]);

  // Add Log Helper
  const addActivityLog = async (supplierId: number, currentLogs: ActivityItem[], actionText: string) => {
    const newLog: ActivityItem = {
      id: `act-${Date.now()}`,
      action: actionText,
      date: new Date().toISOString(),
      user: 'Admin'
    };
    const updatedLogs = [newLog, ...currentLogs];
    await updateSupplier(supplierId, { activityLog: JSON.stringify(updatedLogs) });
  };

  // Submit Add / Edit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      name: formData.name,
      contactPerson: formData.contactPerson,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      notes: formData.notes,
      logo: formData.logo,
      category: formData.category,
      status: formData.status,
      taxId: formData.taxId,
      bankName: formData.bankName,
      bankAccount: formData.bankAccount,
      paymentTerms: formData.paymentTerms,
      specialties: formData.specialties,
      discountRate: Number(formData.discountRate || 0),
    };

    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, dataToSave);
      
      let currentLogs: ActivityItem[] = [];
      try {
        currentLogs = editingSupplier.activityLog ? JSON.parse(editingSupplier.activityLog) : [];
      } catch (e) {}
      await addActivityLog(editingSupplier.id, currentLogs, 'Supplier profile details updated');
      
      setEditingSupplier(null);
    } else {
      const initialLog: ActivityItem = {
        id: `act-${Date.now()}`,
        action: 'Supplier profile created',
        date: new Date().toISOString(),
        user: 'Admin'
      };
      
      const newSupData = {
        ...dataToSave,
        outstandingBalance: 0,
        totalPurchases: 0,
        documents: '[]',
        activityLog: JSON.stringify([initialLog])
      };
      
      await addSupplier(newSupData);
    }

    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      logo: '',
      category: 'Wholesaler',
      status: 'Active',
      taxId: '',
      bankName: '',
      bankAccount: '',
      paymentTerms: '',
      specialties: '',
      discountRate: 0
    });
    setShowAddModal(false);
  };

  // Edit action
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      logo: supplier.logo || '',
      category: supplier.category || 'Wholesaler',
      status: supplier.status || 'Active',
      taxId: supplier.taxId || '',
      bankName: supplier.bankName || '',
      bankAccount: supplier.bankAccount || '',
      paymentTerms: supplier.paymentTerms || '',
      specialties: supplier.specialties || '',
      discountRate: supplier.discountRate || 0
    });
    setShowAddModal(true);
  };

  // Delete Action
  const handleDelete = async (id: number) => {
    if (window.confirm(t('Are you sure you want to delete this supplier? This will remove their record from your database.'))) {
      await deleteSupplier(id);
      if (selectedSupplierId === id) {
        setActiveView('list');
        setSelectedSupplierId(null);
      }
    }
  };

  // View details profile action
  const handleViewProfile = (supplier: Supplier) => {
    setSelectedSupplierId(supplier.id);
    setActiveView('profile');
    setProfileTab('history');
  };

  // Save notes directly in Profile view
  const handleSaveNotes = async (newNotes: string) => {
    if (!selectedSupplier) return;
    await updateSupplier(selectedSupplier.id, { notes: newNotes });
    await addActivityLog(selectedSupplier.id, timelineItems, 'Supplier internal notes updated');
  };

  // Add mock document inside Profile view
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !newDocName.trim()) return;

    const newDoc: MockDocument = {
      id: `doc-${Date.now()}`,
      name: newDocName.trim(),
      type: newDocType,
      addedAt: new Date().toISOString(),
      size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`
    };

    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    await updateSupplier(selectedSupplier.id, { documents: JSON.stringify(updatedDocs) });
    await addActivityLog(selectedSupplier.id, timelineItems, `Added new document: ${newDoc.name} (${newDoc.type})`);
    
    setNewDocName('');
  };

  // Delete document
  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!selectedSupplier) return;
    if (window.confirm(`Are you sure you want to delete document "${docName}"?`)) {
      const updatedDocs = documents.filter(d => d.id !== docId);
      setDocuments(updatedDocs);
      await updateSupplier(selectedSupplier.id, { documents: JSON.stringify(updatedDocs) });
      await addActivityLog(selectedSupplier.id, timelineItems, `Deleted document: ${docName}`);
    }
  };

  // EXPORT ALL SUPPLIERS CSV
  const handleExportSuppliers = () => {
    const headers = [
      'Company Name',
      'Contact Person',
      'Phone',
      'Email',
      'Category',
      'Outstanding Balance (PKR)',
      'Total Purchases (PKR)',
      'Last Purchase Date',
      'Status',
      'Address',
      'Tax ID/NTN',
      'Bank Name',
      'Bank Account',
      'Payment Terms',
      'Specialties',
      'Negotiated Discount (%)',
      'Notes'
    ];

    const csvRows = filteredSuppliers.map(s => [
      s.name,
      s.contactPerson || '',
      s.phone || '',
      s.email || '',
      s.category || 'Wholesaler',
      s.outstandingBalance.toFixed(2),
      s.totalPurchases.toFixed(2),
      s.lastPurchaseDate || 'N/A',
      s.status,
      (s.address || '').replace(/"/g, '""'),
      s.taxId || '',
      s.bankName || '',
      s.bankAccount || '',
      s.paymentTerms || '',
      (s.specialties || '').replace(/"/g, '""'),
      s.discountRate || 0,
      (s.notes || '').replace(/"/g, '""')
    ]);

    const csvContent = [
      headers,
      ...csvRows
    ].map(e => e.map(val => `"${val}"`).join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `suppliers_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // EXPORT INDIVIDUAL PROFILE DATA
  const handleExportProfile = (supplier: Supplier) => {
    const sOrders = purchaseOrders.filter(o => o.supplierId === supplier.id);
    const totalPurchasesVal = sOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPaidVal = sOrders.reduce((sum, o) => sum + o.amountPaid, 0);
    const outstandingVal = sOrders.reduce((sum, o) => sum + o.remainingBalance, 0);

    const headers = ['Order Number', 'Date', 'Delivery Expectation', 'Due Date', 'Status', 'Payment Status', 'Total Amount', 'Amount Paid', 'Remaining Balance'];
    const rows = sOrders.map(o => [
      o.purchaseNumber,
      o.purchaseDate,
      o.expectedDeliveryDate,
      o.dueDate,
      o.status,
      o.paymentStatus,
      o.totalAmount.toFixed(2),
      o.amountPaid.toFixed(2),
      o.remainingBalance.toFixed(2)
    ]);

    const infoSection = [
      [`Supplier Report: ${supplier.name}`],
      [`Contact Person: ${supplier.contactPerson || 'N/A'}`],
      [`Phone: ${supplier.phone || 'N/A'}`],
      [`Email: ${supplier.email || 'N/A'}`],
      [`Address: ${supplier.address || 'N/A'}`],
      [`Tax NTN: ${supplier.taxId || 'N/A'}`],
      [`Outstanding Balance: PKR ${outstandingVal.toFixed(2)}`],
      [`Total Purchases: PKR ${totalPurchasesVal.toFixed(2)}`],
      [`Total Paid: PKR ${totalPaidVal.toFixed(2)}`],
      [`Export Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`],
      [],
      headers,
      ...rows
    ];

    const csvContent = infoSection.map(e => e.map(val => `"${val}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `supplier_profile_${supplier.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSV FILE IMPORT PARSER & DUPLICATE VALIDATOR
  const handleParseCSV = () => {
    if (!csvTextInput.trim()) return;

    const lines = csvTextInput.split('\n');
    if (lines.length < 2) {
      alert('CSV must contain a header row and at least one data row.');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('company'));
    const contactIdx = headers.findIndex(h => h.includes('contact') || h.includes('person'));
    const phoneIdx = headers.findIndex(h => h.includes('phone'));
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
    const addressIdx = headers.findIndex(h => h.includes('address'));
    const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('type'));
    const statusIdx = headers.findIndex(h => h.includes('status'));
    const taxIdx = headers.findIndex(h => h.includes('tax') || h.includes('ntn') || h.includes('vat'));
    const bankNameIdx = headers.findIndex(h => h.includes('bankname') || h.includes('bank name'));
    const bankAccountIdx = headers.findIndex(h => h.includes('account') || h.includes('bank account'));
    const termsIdx = headers.findIndex(h => h.includes('terms') || h.includes('payment terms'));
    const specialtiesIdx = headers.findIndex(h => h.includes('specialties') || h.includes('specialty'));
    const discountIdx = headers.findIndex(h => h.includes('discount') || h.includes('negotiated'));
    const notesIdx = headers.findIndex(h => h.includes('notes') || h.includes('internal'));

    if (nameIdx === -1) {
      alert('Could not find "Name" or "Company" header column. Please check your headers.');
      return;
    }

    const parsedValid: any[] = [];
    const parsedDuplicates: any[] = [];
    const parsedInvalid: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row: string[] = [];
      let currentVal = '';
      let insideQuote = false;
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          row.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      row.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      const name = row[nameIdx];
      if (!name) {
        parsedInvalid.push({ row, reason: 'Missing Supplier/Company Name' });
        continue;
      }

      const phone = phoneIdx !== -1 ? row[phoneIdx] : '';
      const email = emailIdx !== -1 ? row[emailIdx] : '';

      const nameDuplicate = suppliers.find(s => s.name.toLowerCase() === name.toLowerCase());
      const phoneDuplicate = phone ? suppliers.find(s => s.phone && s.phone.replace(/\s+/g, '') === phone.replace(/\s+/g, '')) : null;
      const emailDuplicate = email ? suppliers.find(s => s.email && s.email.toLowerCase() === email.toLowerCase()) : null;

      const rowData = {
        name,
        contactPerson: contactIdx !== -1 ? row[contactIdx] : '',
        phone,
        email,
        address: addressIdx !== -1 ? row[addressIdx] : '',
        category: categoryIdx !== -1 ? row[categoryIdx] : 'Wholesaler',
        status: (statusIdx !== -1 ? row[statusIdx] : 'Active') as 'Active' | 'Inactive',
        taxId: taxIdx !== -1 ? row[taxIdx] : '',
        bankName: bankNameIdx !== -1 ? row[bankNameIdx] : '',
        bankAccount: bankAccountIdx !== -1 ? row[bankAccountIdx] : '',
        paymentTerms: termsIdx !== -1 ? row[termsIdx] : '',
        specialties: specialtiesIdx !== -1 ? row[specialtiesIdx] : '',
        discountRate: discountIdx !== -1 ? Number(row[discountIdx] || 0) : 0,
        notes: notesIdx !== -1 ? row[notesIdx] : '',
      };

      if (nameDuplicate || phoneDuplicate || emailDuplicate) {
        let reason = '';
        if (nameDuplicate) reason += `Company Name already exists (${nameDuplicate.name}). `;
        if (phoneDuplicate) reason += `Phone Number already registered to ${phoneDuplicate.name}. `;
        if (emailDuplicate) reason += `Email already registered to ${emailDuplicate.name}. `;
        
        parsedDuplicates.push({ ...rowData, duplicateReason: reason });
      } else {
        parsedValid.push(rowData);
      }
    }

    setImportSummary({
      valid: parsedValid,
      duplicates: parsedDuplicates,
      invalid: parsedInvalid,
      parsed: true
    });
  };

  // Upload trigger for file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvTextInput(text);
      setTimeout(() => {
        handleParseCSV();
      }, 100);
    };
    reader.readAsText(file);
  };

  // Final Import Confirmation
  const handleConfirmImport = async () => {
    if (importSummary.valid.length === 0) return;

    for (const sup of importSummary.valid) {
      const initialLog: ActivityItem = {
        id: `act-${Date.now()}`,
        action: 'Supplier record created via CSV Import',
        date: new Date().toISOString(),
        user: 'Admin'
      };
      
      const newSupData = {
        ...sup,
        outstandingBalance: 0,
        totalPurchases: 0,
        documents: '[]',
        activityLog: JSON.stringify([initialLog])
      };
      
      await addSupplier(newSupData);
    }

    alert(`Successfully imported ${importSummary.valid.length} new suppliers!`);
    setShowImportModal(false);
    setCsvTextInput('');
    setImportSummary({ valid: [], duplicates: [], invalid: [], parsed: false });
  };


  // ==========================================
  // NEW INTUITIVE ANALYTICS CALCULATIONS
  // ==========================================

  // 1. Supplier Dashboard & Overall Performance Metrics
  const supplierStats = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.status === 'Active').length;
    const inactiveSuppliers = suppliers.filter(s => s.status === 'Inactive').length;

    const activePOs = purchaseOrders.filter(po => po.status !== 'Cancelled');
    const totalPurchaseValue = activePOs.reduce((sum, po) => sum + po.totalAmount, 0);
    const outstandingPayments = activePOs.reduce((sum, po) => sum + po.remainingBalance, 0);
    
    const totalPurchaseOrders = purchaseOrders.length;
    const openPurchaseOrders = purchaseOrders.filter(po => po.status === 'Ordered' || po.status === 'Partially Received').length;

    let totalDeliveryDays = 0;
    let receivedCount = 0;
    let onTimeCount = 0;
    let delayedCount = 0;

    purchaseOrders.forEach(po => {
      if (po.status === 'Received') {
        receivedCount++;
        const purchaseTime = new Date(po.purchaseDate).getTime();
        const expectedTime = new Date(po.expectedDeliveryDate || po.purchaseDate).getTime();
        
        let receivedTime = purchaseTime;
        if (po.receivingHistory && po.receivingHistory.length > 0) {
          const dates = po.receivingHistory.map(r => new Date(r.receivedAt).getTime());
          receivedTime = Math.max(...dates);
        } else {
          receivedTime = new Date(po.updatedAt || po.createdAt).getTime();
        }

        const diffDays = Math.max(0, (receivedTime - purchaseTime) / (1000 * 60 * 60 * 24));
        totalDeliveryDays += diffDays;

        if (receivedTime <= expectedTime) {
          onTimeCount++;
        } else {
          delayedCount++;
        }
      } else if (po.status !== 'Cancelled') {
        const expectedTime = new Date(po.expectedDeliveryDate || po.purchaseDate).getTime();
        if (Date.now() > expectedTime) {
          delayedCount++;
        }
      }
    });

    const avgDeliveryTime = receivedCount > 0 ? (totalDeliveryDays / receivedCount) : 0;

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      totalPurchaseValue,
      outstandingPayments,
      avgDeliveryTime: avgDeliveryTime.toFixed(1),
      totalPurchaseOrders,
      openPurchaseOrders,
      receivedCount,
      onTimeCount,
      delayedCount
    };
  }, [suppliers, purchaseOrders]);

  // 2. Supplier Performance Scorecard Engine
  const supplierPerformanceList = useMemo(() => {
    return suppliers.map(supplier => {
      const sOrders = purchaseOrders.filter(o => o.supplierId === supplier.id);
      const totalOrders = sOrders.length;
      const completedOrders = sOrders.filter(o => o.status === 'Received').length;
      const cancelledOrders = sOrders.filter(o => o.status === 'Cancelled').length;
      
      let deliveryDaysSum = 0;
      let receivedCount = 0;
      let onTimeCount = 0;
      let delayedCount = 0;
      let totalSpent = 0;
      let totalRefund = 0;
      let largestPurchase = 0;
      let lastPaymentDate: string | null = null;

      sOrders.forEach(po => {
        totalSpent += po.totalAmount;
        totalRefund += po.totalReturnedAmount || 0;
        if (po.totalAmount > largestPurchase) {
          largestPurchase = po.totalAmount;
        }
        
        if (po.paymentsHistory && po.paymentsHistory.length > 0) {
          const paymentDates = po.paymentsHistory.map(p => new Date(p.date).getTime());
          const maxPayDate = Math.max(...paymentDates);
          if (!lastPaymentDate || maxPayDate > new Date(lastPaymentDate).getTime()) {
            lastPaymentDate = new Date(maxPayDate).toISOString().split('T')[0];
          }
        }

        if (po.status === 'Received') {
          receivedCount++;
          const purchaseTime = new Date(po.purchaseDate).getTime();
          const expectedTime = new Date(po.expectedDeliveryDate || po.purchaseDate).getTime();
          
          let receivedTime = purchaseTime;
          if (po.receivingHistory && po.receivingHistory.length > 0) {
            const dates = po.receivingHistory.map(r => new Date(r.receivedAt).getTime());
            receivedTime = Math.max(...dates);
          } else {
            receivedTime = new Date(po.updatedAt || po.createdAt).getTime();
          }

          const diffDays = Math.max(0, (receivedTime - purchaseTime) / (1000 * 60 * 60 * 24));
          deliveryDaysSum += diffDays;

          if (receivedTime <= expectedTime) {
            onTimeCount++;
          } else {
            delayedCount++;
          }
        } else if (po.status !== 'Cancelled') {
          const expectedTime = new Date(po.expectedDeliveryDate || po.purchaseDate).getTime();
          if (Date.now() > expectedTime) {
            delayedCount++;
          }
        }
      });

      const avgDeliveryTime = receivedCount > 0 ? (deliveryDaysSum / receivedCount) : 0;
      const returnRate = totalSpent > 0 ? (totalRefund / totalSpent) : 0;
      const successRate = (totalOrders - cancelledOrders) > 0 ? (completedOrders / (totalOrders - cancelledOrders)) : 0;

      const onTimeRate = receivedCount > 0 ? (onTimeCount / receivedCount) : 1.0;
      const returnScore = Math.max(0, 1 - returnRate);
      
      let performanceScore = Math.round((onTimeRate * 40) + (returnScore * 30) + (successRate * 30));
      if (totalOrders === 0) {
        performanceScore = 0;
      }

      const totalPayments = sOrders.reduce((sum, po) => sum + po.amountPaid, 0);
      const outstandingBalance = sOrders.reduce((sum, po) => sum + po.remainingBalance, 0);
      const avgOrderValue = totalOrders > 0 ? (totalSpent / totalOrders) : 0;

      return {
        ...supplier,
        totalOrders,
        completedOrders,
        cancelledOrders,
        onTimeDeliveries: onTimeCount,
        delayedDeliveries: delayedCount,
        avgDeliveryTime: avgDeliveryTime.toFixed(1),
        returnRate: (returnRate * 100).toFixed(1),
        successRate: (successRate * 100).toFixed(1),
        performanceScore: totalOrders > 0 ? performanceScore : null,
        financials: {
          totalPurchases: totalSpent,
          totalPayments,
          outstandingBalance,
          avgOrderValue,
          largestPurchase,
          lastPaymentDate
        }
      };
    });
  }, [suppliers, purchaseOrders]);

  // 3. Purchase Analytics engine
  const purchaseAnalytics = useMemo(() => {
    const activePOs = purchaseOrders.filter(po => po.status !== 'Cancelled');
    
    const spendBySupplier: Record<string, number> = {};
    suppliers.forEach(s => {
      spendBySupplier[s.name] = 0;
    });
    activePOs.forEach(po => {
      spendBySupplier[po.supplierName] = (spendBySupplier[po.supplierName] || 0) + po.totalAmount;
    });

    const sortedSuppliersBySpend = Object.entries(spendBySupplier)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const monthlySpend: Record<string, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      last6Months.push(label);
      monthlySpend[label] = 0;
    }

    activePOs.forEach(po => {
      const date = new Date(po.purchaseDate);
      const label = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      if (label in monthlySpend) {
        monthlySpend[label] += po.totalAmount;
      }
    });

    const trendData = last6Months.map(month => ({
      month,
      amount: monthlySpend[month]
    }));

    let growthRate = 0;
    if (last6Months.length >= 2) {
      const currentMonthVal = monthlySpend[last6Months[5]] || 0;
      const prevMonthVal = monthlySpend[last6Months[4]] || 0;
      if (prevMonthVal > 0) {
        growthRate = ((currentMonthVal - prevMonthVal) / prevMonthVal) * 100;
      } else if (currentMonthVal > 0) {
        growthRate = 100;
      }
    }

    const frequencyBySupplier: Record<string, number> = {};
    suppliers.forEach(s => {
      frequencyBySupplier[s.name] = 0;
    });
    purchaseOrders.forEach(po => {
      frequencyBySupplier[po.supplierName] = (frequencyBySupplier[po.supplierName] || 0) + 1;
    });

    const purchaseFrequency = Object.entries(frequencyBySupplier)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      sortedSuppliersBySpend,
      trendData,
      growthRate: growthRate.toFixed(1),
      purchaseFrequency
    };
  }, [suppliers, purchaseOrders]);

  // 4. Product Cost Comparison Engine
  const productCostComparison = useMemo(() => {
    const groupedProducts: Record<string, { products: any[]; name: string; sku?: string; barcode?: string }> = {};

    products.forEach(p => {
      const key = (p.sku || p.barcode || p.name).toLowerCase().trim();
      if (!groupedProducts[key]) {
        groupedProducts[key] = {
          products: [],
          name: p.name,
          sku: p.sku,
          barcode: p.barcode
        };
      }
      groupedProducts[key].products.push(p);
    });

    const comparisons = Object.values(groupedProducts).map(group => {
      const costs = group.products.map(p => p.cost);
      const lowestCost = Math.min(...costs);
      const highestCost = Math.max(...costs);
      const avgCost = costs.reduce((sum, c) => sum + c, 0) / costs.length;

      const supplierDetails = group.products.map(p => {
        const sPerf = supplierPerformanceList.find(s => s.id === p.supplierId);
        return {
          supplierId: p.supplierId,
          supplierName: sPerf?.name || 'Unknown Supplier',
          performanceScore: sPerf?.performanceScore || 0,
          cost: p.cost,
          productId: p.id,
          updatedAt: p.updatedAt
        };
      }).sort((a, b) => a.cost - b.cost);

      const matchingPOs = purchaseOrders.filter(po => 
        po.status !== 'Cancelled' && 
        po.items.some(item => item.productName.toLowerCase().trim() === group.name.toLowerCase().trim())
      );

      const priceHistory = matchingPOs.map(po => {
        const item = po.items.find(it => it.productName.toLowerCase().trim() === group.name.toLowerCase().trim());
        return {
          date: po.purchaseDate,
          cost: item ? item.costPrice : 0,
          supplierName: po.supplierName
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        name: group.name,
        sku: group.sku,
        barcode: group.barcode,
        lowestCost,
        highestCost,
        avgCost: avgCost.toFixed(2),
        supplierDetails,
        priceHistory
      };
    });

    return comparisons;
  }, [products, suppliers, purchaseOrders, supplierPerformanceList]);

  const getSupplierRecommendation = (supplierDetails: any[]) => {
    if (!supplierDetails || supplierDetails.length === 0) return null;
    if (supplierDetails.length === 1) return supplierDetails[0];
    
    const sortedRecommendations = [...supplierDetails].sort((a, b) => {
      const costDiff = a.cost - b.cost;
      if (Math.abs(costDiff) < 1) {
        return b.performanceScore - a.performanceScore;
      }
      return costDiff;
    });

    return sortedRecommendations[0];
  };

  // 5. Smart Supplier Insights Actionable Engine
  const smartSupplierInsights = useMemo(() => {
    const insights: { type: 'success' | 'info' | 'warning' | 'error' | 'trend'; title: string; desc: string; supplierName: string; supplierId: number }[] = [];

    supplierPerformanceList.forEach(sup => {
      if (sup.performanceScore && sup.performanceScore >= 85) {
        insights.push({
          type: 'success',
          title: t('Best Performing Supplier'),
          desc: t('Excellent rating of {{score}}% with {{onTime}} on-time deliveries.', { score: sup.performanceScore, onTime: sup.onTimeDeliveries }),
          supplierName: sup.name,
          supplierId: sup.id
        });
      }

      if (sup.totalOrders >= 5) {
        insights.push({
          type: 'info',
          title: t('Frequently Used Supplier'),
          desc: t('Key operational vendor with {{count}} total purchase orders.', { count: sup.totalOrders }),
          supplierName: sup.name,
          supplierId: sup.id
        });
      }

      if (sup.delayedDeliveries > 0) {
        insights.push({
          type: 'warning',
          title: t('Delayed Deliveries Alert'),
          desc: t('Identified {{count}} delayed shipments in ledger logs.', { count: sup.delayedDeliveries }),
          supplierName: sup.name,
          supplierId: sup.id
        });
      }

      if (sup.outstandingBalance > 0) {
        insights.push({
          type: 'error',
          title: t('Outstanding Balance'),
          desc: t('Pending dues of Rs. {{balance}} requiring payment clearance.', { balance: sup.outstandingBalance.toLocaleString() }),
          supplierName: sup.name,
          supplierId: sup.id
        });
      }

      if (sup.lastPurchaseDate) {
        const days = (Date.now() - new Date(sup.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24);
        if (days > 45) {
          insights.push({
            type: 'trend',
            title: t('No Recent Purchases'),
            desc: t('Zero purchase activity in the past {{days}} days. Review contract active status.', { days: Math.round(days) }),
            supplierName: sup.name,
            supplierId: sup.id
          });
        }
      }

      const supCompList = productCostComparison.filter(c => c.supplierDetails.some(d => d.supplierId === sup.id));
      let hasRisingCost = false;
      supCompList.forEach(comp => {
        const hist = comp.priceHistory.filter(h => h.supplierName === sup.name);
        if (hist.length >= 2) {
          const latest = hist[hist.length - 1].cost;
          const previous = hist[hist.length - 2].cost;
          if (latest > previous) {
            hasRisingCost = true;
          }
        }
      });

      if (hasRisingCost) {
        insights.push({
          type: 'warning',
          title: t('Rising Supply Costs'),
          desc: t('Unit cost of supplied items has increased in recent orders. Review cost comparisons.'),
          supplierName: sup.name,
          supplierId: sup.id
        });
      }
    });

    return insights;
  }, [supplierPerformanceList, productCostComparison, t]);

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payFormOrderId || !payFormAmount) {
      alert(t('Please select an order and enter a valid amount.'));
      return;
    }

    try {
      await recordPayment(Number(payFormOrderId), {
        date: new Date().toISOString(),
        method: payFormMethod,
        amount: Number(payFormAmount),
        notes: payFormNotes
      });
      alert(t('Supplier payment recorded successfully!'));
      
      setPayFormOrderId('');
      setPayFormAmount('');
      setPayFormNotes('');
      setShowPaymentModal(false);
    } catch (err) {
      console.error(err);
      alert(t('Failed to record payment. Please try again.'));
    }
  };

  const pendingOrdersForPaymentSupplier = useMemo(() => {
    if (!payFormSupplierId) return [];
    return purchaseOrders.filter(
      po => po.supplierId === Number(payFormSupplierId) && 
      (po.paymentStatus === 'Unpaid' || po.paymentStatus === 'Partially Paid') &&
      po.status !== 'Cancelled'
    );
  }, [purchaseOrders, payFormSupplierId]);


  // ==========================================
  // EXPORT REPORTS HELPER (PDF & CSV)
  // ==========================================

  const handleExportReportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let reportTitle = '';

    if (selectedReport === 'directory') {
      reportTitle = 'Supplier_Directory_Report';
      headers = [t('Supplier Name'), t('Category'), t('Status'), t('Phone'), t('Email'), t('Outstanding Balance')];
      rows = filteredSuppliers.map(s => [
        s.name,
        s.category || '',
        s.status,
        s.phone || '',
        s.email || '',
        s.outstandingBalance.toFixed(2)
      ]);
    } else if (selectedReport === 'performance') {
      reportTitle = 'Supplier_Performance_Report';
      headers = [t('Supplier Name'), t('Performance Score'), t('Total Orders'), t('On-Time Deliveries'), t('Return Rate (%)'), t('Success Rate (%)')];
      rows = supplierPerformanceList.map(s => [
        s.name,
        s.performanceScore ? `${s.performanceScore}%` : 'N/A',
        s.totalOrders.toString(),
        s.onTimeDeliveries.toString(),
        s.returnRate,
        s.successRate
      ]);
    } else if (selectedReport === 'outstanding') {
      reportTitle = 'Supplier_Outstanding_Balance_Report';
      headers = [t('Supplier Name'), t('Outstanding Balance'), t('Payment Terms'), t('Tax ID/NTN'), t('Last Purchase Date')];
      rows = supplierListWithFinancials.filter(s => s.outstandingBalance > 0).map(s => [
        s.name,
        s.outstandingBalance.toFixed(2),
        s.paymentTerms || 'COD',
        s.taxId || 'N/A',
        s.lastPurchaseDate || 'N/A'
      ]);
    } else if (selectedReport === 'purchases') {
      reportTitle = 'Purchase_Summary_Report';
      headers = [t('PO Number'), t('Supplier'), t('Date'), t('Total Amount'), t('Amount Paid'), t('Remaining Balance'), t('Status')];
      rows = purchaseOrders.map(po => [
        po.purchaseNumber,
        po.supplierName,
        format(new Date(po.purchaseDate), 'yyyy-MM-dd'),
        po.totalAmount.toFixed(2),
        po.amountPaid.toFixed(2),
        po.remainingBalance.toFixed(2),
        po.status
      ]);
    } else if (selectedReport === 'comparison') {
      reportTitle = 'Product_Cost_Comparison_Report';
      headers = [t('Product Name'), t('Lowest Cost'), t('Highest Cost'), t('Average Cost'), t('Alternative Suppliers Count')];
      rows = productCostComparison.map(c => [
        c.name,
        c.lowestCost.toFixed(2),
        c.highestCost.toFixed(2),
        c.avgCost,
        c.supplierDetails.length.toString()
      ]);
    }

    const csvContent = [
      headers,
      ...rows
    ].map(e => e.map(val => `"${val}"`).join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportTitle}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportReportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFont('helvetica');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    let titleText = '';
    if (selectedReport === 'directory') titleText = t('Supplier Directory Report');
    if (selectedReport === 'performance') titleText = t('Supplier Performance & Intelligence Report');
    if (selectedReport === 'outstanding') titleText = t('Outstanding Supplier Payments Report');
    if (selectedReport === 'purchases') titleText = t('Purchase Order Summary Ledger');
    if (selectedReport === 'comparison') titleText = t('Product Cost Comparison Matrix');

    doc.text(titleText, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t('Generated on')}: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    if (selectedReport === 'directory') {
      tableHeaders = ['Supplier Name', 'Category', 'Status', 'Outstanding Bal (PKR)'];
      tableRows = filteredSuppliers.map(s => [
        s.name,
        s.category || 'Wholesaler',
        s.status,
        s.outstandingBalance.toLocaleString()
      ]);
    } else if (selectedReport === 'performance') {
      tableHeaders = ['Supplier', 'Score', 'Total POs', 'Success Rate', 'Return Rate'];
      tableRows = supplierPerformanceList.map(s => [
        s.name,
        s.performanceScore ? `${s.performanceScore}%` : 'N/A',
        s.totalOrders.toString(),
        `${s.successRate}%`,
        `${s.returnRate}%`
      ]);
    } else if (selectedReport === 'outstanding') {
      tableHeaders = ['Supplier Name', 'Terms', 'Tax NTN', 'Outstanding (PKR)'];
      tableRows = supplierListWithFinancials.filter(s => s.outstandingBalance > 0).map(s => [
        s.name,
        s.paymentTerms || 'COD',
        s.taxId || 'N/A',
        s.outstandingBalance.toLocaleString()
      ]);
    } else if (selectedReport === 'purchases') {
      tableHeaders = ['PO No', 'Supplier', 'Date', 'Amount (PKR)', 'Status'];
      tableRows = purchaseOrders.map(po => [
        po.purchaseNumber,
        po.supplierName,
        format(new Date(po.purchaseDate), 'yyyy-MM-dd'),
        po.totalAmount.toLocaleString(),
        po.status
      ]);
    } else if (selectedReport === 'comparison') {
      tableHeaders = ['Product Name', 'Lowest Cost', 'Highest Cost', 'Avg Cost'];
      tableRows = productCostComparison.map(c => [
        c.name,
        c.lowestCost.toLocaleString(),
        c.highestCost.toLocaleString(),
        c.avgCost
      ]);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    
    const colWidth = (pageWidth - 2 * margin) / tableHeaders.length;
    
    tableHeaders.forEach((header, idx) => {
      doc.text(header, margin + idx * colWidth, yPos);
    });
    
    yPos += 3;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    tableRows.forEach(row => {
      if (yPos > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 20;
      }
      row.forEach((cell, idx) => {
        doc.text(cell || '', margin + idx * colWidth, yPos);
      });
      yPos += 7;
    });

    doc.save(`${selectedReport}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-2">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* LIST/DASHBOARD VIEW                                      */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeView === 'list' && (
        <div className="space-y-6">
          
          {/* Header Dashboard section */}
          <PageHeader
            title={t('Suppliers Intelligence & Performance')}
            subtitle={t('Analyze vendor delivery times, cost comparisons, financial ledgers, and purchase orders.')}
            icon={Building}
            breadcrumbs={[
              { label: t('Home'), onClick: () => window.location.hash = '#/' },
              { label: t('Suppliers') }
            ]}
            actions={[
              {
                label: t('Add Supplier'),
                onClick: () => {
                  setEditingSupplier(null);
                  setFormData({
                    name: '',
                    contactPerson: '',
                    phone: '',
                    email: '',
                    address: '',
                    notes: '',
                    logo: '',
                    category: 'Wholesaler',
                    status: 'Active',
                    taxId: '',
                    bankName: '',
                    bankAccount: '',
                    paymentTerms: '',
                    specialties: '',
                    discountRate: 0
                  });
                  setShowAddModal(true);
                },
                icon: Plus,
                variant: 'primary'
              },
              {
                label: t('Record Payment'),
                onClick: () => {
                  setPayFormSupplierId('');
                  setPayFormOrderId('');
                  setPayFormAmount('');
                  setPayFormNotes('');
                  setShowPaymentModal(true);
                },
                icon: Receipt,
                variant: 'secondary'
              },
              {
                label: t('Create PO'),
                onClick: () => navigate('/purchases'),
                icon: Plus,
                variant: 'secondary'
              },
              {
                label: t('Import CSV'),
                onClick: () => setShowImportModal(true),
                icon: Upload,
                variant: 'secondary'
              }
            ]}
          />

          {/* Sub Navigation Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-750 flex flex-wrap gap-1">
            <button
              onClick={() => setActiveSubTab('directory')}
              className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeSubTab === 'directory'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Building className="h-4.5 w-4.5" />
              {t('Supplier Directory')}
            </button>
            
            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeSubTab === 'analytics'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="h-4.5 w-4.5" />
              {t('Performance & Analytics')}
            </button>

            <button
              onClick={() => setActiveSubTab('comparison')}
              className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeSubTab === 'comparison'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <ArrowUpDown className="h-4.5 w-4.5" />
              {t('Cost Comparison')}
            </button>

            <button
              onClick={() => setActiveSubTab('insights')}
              className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeSubTab === 'insights'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-4.5 w-4.5" />
              {t('Smart Insights')}
              {smartSupplierInsights.filter(i => i.type === 'error' || i.type === 'warning').length > 0 && (
                <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xxs font-bold">
                  {smartSupplierInsights.filter(i => i.type === 'error' || i.type === 'warning').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('reports')}
              className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeSubTab === 'reports'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-4.5 w-4.5" />
              {t('Reports Exporter')}
            </button>
          </div>

          {/* TAB CONTENT: 1. DIRECTORY LIST */}
          {activeSubTab === 'directory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('Total Suppliers')}</span>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{generalKPIs.total}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                    <Building className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('Active Vendors')}</span>
                    <h3 className="text-2xl font-black text-green-650 dark:text-green-400 mt-1">{generalKPIs.active}</h3>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('Outstanding Dues')}</span>
                    <h3 className="text-2xl font-black text-red-650 dark:text-red-400 mt-1">Rs. {generalKPIs.outstanding.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('Total Purchases')}</span>
                    <h3 className="text-2xl font-black text-amber-600 dark:text-amber-505 mt-1">Rs. {generalKPIs.purchasesYTD.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 dark:text-amber-505">
                    <Package className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder={t('Search by Name, Contact Person, Phone, Email...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-55 dark:bg-gray-750 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-semibold transition-all ${
                        showFilters || filterCategory || filterStatus || filterBalance !== 'all'
                          ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-900/35 dark:text-blue-400'
                          : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-850 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Filter className="h-4.5 w-4.5" />
                      <span>{t('Filters')}</span>
                      {(filterCategory || filterStatus || filterBalance !== 'all') && (
                        <span className="bg-blue-600 text-white rounded-full w-5 h-5 text-xxs flex items-center justify-center font-bold">!</span>
                      )}
                    </button>

                    <div className="bg-gray-100 dark:bg-gray-700 p-0.5 rounded-xl flex items-center">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-all ${
                          viewMode === 'table'
                            ? 'bg-white dark:bg-gray-850 shadow-sm text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                        title="Table View"
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${
                          viewMode === 'grid'
                            ? 'bg-white dark:bg-gray-850 shadow-sm text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                        title="Grid View"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-slideDown">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('Category')}</label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-25 -rounded-xl bg-gray-55 dark:bg-gray-750 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('All Categories')}</option>
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('Status')}</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-25 -rounded-xl bg-gray-55 dark:bg-gray-750 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('All Statuses')}</option>
                        <option value="Active">{t('Active')}</option>
                        <option value="Inactive">{t('Inactive')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('Balance Filter')}</label>
                      <select
                        value={filterBalance}
                        onChange={(e) => setFilterBalance(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-25 -rounded-xl bg-gray-55 dark:bg-gray-750 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">{t('Show All Dues')}</option>
                        <option value="outstanding">{t('Outstanding Dues Only')}</option>
                        <option value="none">{t('Zero Balance Only')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('Date Registered')}</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={filterRegDate.start}
                          onChange={(e) => setFilterRegDate({ ...filterRegDate, start: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-25 -rounded-xl bg-gray-55 dark:bg-gray-750 text-gray-950 dark:text-white text-xs outline-none"
                        />
                        <span className="text-gray-400 text-xxs">to</span>
                        <input
                          type="date"
                          value={filterRegDate.end}
                          onChange={(e) => setFilterRegDate({ ...filterRegDate, end: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-25 -rounded-xl bg-gray-55 dark:bg-gray-750 text-gray-950 dark:text-white text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('Last Purchase Date')}</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={filterPurchaseDate.start}
                          onChange={(e) => setFilterPurchaseDate({ ...filterPurchaseDate, start: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-25 -rounded-xl bg-gray-55 dark:bg-gray-750 text-gray-950 dark:text-white text-xs outline-none"
                        />
                        <span className="text-gray-400 text-xxs">to</span>
                        <input
                          type="date"
                          value={filterPurchaseDate.end}
                          onChange={(e) => setFilterPurchaseDate({ ...filterPurchaseDate, end: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-25 -rounded-xl bg-gray-55 dark:bg-gray-750 text-gray-950 dark:text-white text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {filteredSuppliers.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-16 text-center shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-500">
                    <Building className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('No Suppliers Found')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                    {t('Try adjusting your search query, clearing filters, or adding a new vendor directory record.')}
                  </p>
                </div>
              ) : viewMode === 'table' ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-750 text-gray-500 dark:text-gray-450 font-bold border-b border-gray-100 dark:border-gray-700 uppercase text-xs tracking-wider">
                          <th className="px-6 py-4">{t('Company/Supplier')}</th>
                          <th className="px-6 py-4">{t('Contact Person')}</th>
                          <th className="px-6 py-4">{t('Phone/Email')}</th>
                          <th className="px-6 py-4 text-right">{t('Outstanding Dues')}</th>
                          <th className="px-6 py-4 text-right">{t('Total Purchases')}</th>
                          <th className="px-6 py-4">{t('Last Purchase')}</th>
                          <th className="px-6 py-4 text-center">{t('Status')}</th>
                          <th className="px-6 py-4 text-right">{t('Actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredSuppliers.map((supplier) => (
                          <tr key={supplier.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {supplier.logo ? (
                                  <img 
                                    src={supplier.logo} 
                                    alt={supplier.name} 
                                    className="w-9 h-9 rounded-lg object-cover bg-gray-100 border border-gray-250 shadow-xxs"
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-650 text-white flex items-center justify-center font-bold text-xs shadow-xxs">
                                    {supplier.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-gray-900 dark:text-white block">{supplier.name}</span>
                                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                    {supplier.category || 'Wholesaler'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-gray-750 dark:text-gray-300 font-medium">
                              {supplier.contactPerson || <span className="text-gray-300 dark:text-gray-650 italic">None</span>}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                              <div className="space-y-0.5">
                                {supplier.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-gray-400" /> <span>{supplier.phone}</span></div>}
                                {supplier.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-gray-400" /> <span>{supplier.email}</span></div>}
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-right font-black">
                              <span className={supplier.outstandingBalance > 0 ? 'text-red-650 dark:text-red-405' : 'text-gray-400 dark:text-gray-500'}>
                                Rs. {supplier.outstandingBalance.toLocaleString()}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white">
                              Rs. {supplier.totalPurchases.toLocaleString()}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-550 dark:text-gray-400">
                              {supplier.lastPurchaseDate ? (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                  <span>{format(new Date(supplier.lastPurchaseDate), 'MMM dd, yyyy')}</span>
                                </div>
                              ) : (
                                <span className="text-gray-300 dark:text-gray-600">—</span>
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
                                supplier.status === 'Active'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-450'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${supplier.status === 'Active' ? 'bg-green-500' : 'bg-gray-450'}`} />
                                {supplier.status}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleViewProfile(supplier)}
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-450 dark:hover:text-blue-400 dark:hover:bg-gray-700 rounded-lg transition-all"
                                  title={t('View Supplier Profile')}
                                >
                                  <Eye className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  onClick={() => handleEdit(supplier)}
                                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-gray-100 dark:text-gray-450 dark:hover:text-green-400 dark:hover:bg-gray-700 rounded-lg transition-all"
                                  title={t('Edit Supplier')}
                                >
                                  <Edit className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  onClick={() => navigate('/purchases')}
                                  className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-gray-100 dark:text-gray-450 dark:hover:text-amber-400 dark:hover:bg-gray-700 rounded-lg transition-all"
                                  title={t('Create Purchase Order')}
                                >
                                  <Plus className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(supplier.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-650 hover:bg-gray-100 dark:text-gray-450 dark:hover:text-red-400 dark:hover:bg-gray-700 rounded-lg transition-all"
                                  title={t('Delete Supplier')}
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSuppliers.map((supplier) => (
                    <div 
                      key={supplier.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 ${supplier.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />

                      <div>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            {supplier.logo ? (
                              <img 
                                src={supplier.logo} 
                                alt={supplier.name} 
                                className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-200 shadow-sm"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-650 text-white flex items-center justify-center font-black text-base shadow-sm">
                                {supplier.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {supplier.name}
                              </h4>
                              <span className="px-2 py-0.5 text-xxs font-bold uppercase rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-350">
                                {supplier.category || 'Wholesaler'}
                              </span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-xxs font-black uppercase tracking-wider ${
                            supplier.status === 'Active'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {supplier.status}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-350 border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                          {supplier.contactPerson && (
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              <span>{supplier.contactPerson}</span>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              <span className="truncate">{supplier.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                          <div className="bg-gray-50 dark:bg-gray-750 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/60">
                            <span className="text-gray-450 dark:text-gray-450 block text-[10px] uppercase font-bold tracking-wider">{t('Outstanding')}</span>
                            <span className={`font-bold text-sm block mt-0.5 ${
                              supplier.outstandingBalance > 0 ? 'text-red-650 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              Rs. {supplier.outstandingBalance.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-750 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/60">
                            <span className="text-gray-450 dark:text-gray-455 block text-[10px] uppercase font-bold tracking-wider">{t('Total Purchases')}</span>
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200 block mt-0.5">
                              Rs. {supplier.totalPurchases.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/65">
                          <button
                            onClick={() => handleViewProfile(supplier)}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                          >
                            <span>{t('View Profile')}</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-55 dark:hover:bg-gray-700"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => navigate('/purchases')}
                              className="p-1.5 text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg hover:bg-gray-55 dark:hover:bg-gray-700"
                              title="New Purchase"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              className="p-1.5 text-gray-400 hover:text-red-650 dark:hover:text-red-400 rounded-lg hover:bg-gray-55 dark:hover:bg-gray-700"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: 2. PERFORMANCE & ANALYTICS */}
          {activeSubTab === 'analytics' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">{t('Total Suppliers')}</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">{supplierStats.totalSuppliers}</h3>
                    <span className="text-xs text-gray-400 font-semibold">
                      {supplierStats.activeSuppliers} {t('Active')} / {supplierStats.inactiveSuppliers} {t('Inactive')}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">{t('Procurement Flow YTD')}</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <h3 className="text-2xl font-black text-blue-650 dark:text-blue-400">Rs. {supplierStats.totalPurchaseValue.toLocaleString()}</h3>
                    <span className="text-xs text-emerald-600 dark:text-emerald-500 font-bold flex items-center gap-0.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      +{purchaseAnalytics.growthRate}% MoM
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">{t('Average Delivery Delay')}</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <h3 className="text-2xl font-black text-amber-650 dark:text-amber-505">{supplierStats.avgDeliveryTime} {t('days')}</h3>
                    <span className="text-xs text-gray-400 font-semibold">
                      {supplierStats.onTimeCount} {t('on-time')} / {supplierStats.delayedCount} {t('delayed')}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">{t('Purchase Order Vol.')}</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <h3 className="text-2xl font-black text-purple-650 dark:text-purple-400">{supplierStats.totalPurchaseOrders}</h3>
                    <span className="text-xs text-purple-600 dark:text-purple-500 font-bold bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded-lg">
                      {supplierStats.openPurchaseOrders} {t('Open')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">{t('Monthly Procurement Trends (PKR)')}</h3>
                    <span className="text-xxs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t('Procurement Flow')}</span>
                  </div>
                  
                  <div className="w-full h-56 flex items-center justify-center relative">
                    {purchaseAnalytics.trendData.every(d => d.amount === 0) ? (
                      <span className="text-gray-400 dark:text-gray-600 italic text-xs">{t('Insufficient ledger data to plot trend line.')}</span>
                    ) : (
                      <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        <line x1="50" y1="20" x2="470" y2="20" stroke="#9ca3af" strokeDasharray="3,3" strokeOpacity="0.2" />
                        <line x1="50" y1="70" x2="470" y2="70" stroke="#9ca3af" strokeDasharray="3,3" strokeOpacity="0.2" />
                        <line x1="50" y1="120" x2="470" y2="120" stroke="#9ca3af" strokeDasharray="3,3" strokeOpacity="0.2" />
                        <line x1="50" y1="170" x2="470" y2="170" stroke="#9ca3af" strokeOpacity="0.3" />
                        
                        {(() => {
                          const maxVal = Math.max(...purchaseAnalytics.trendData.map(d => d.amount)) || 1000;
                          const points = purchaseAnalytics.trendData.map((d, index) => {
                            const x = 50 + (index * 80);
                            const y = 170 - (d.amount / maxVal * 140);
                            return { x, y, label: d.month, val: d.amount };
                          });

                          const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
                          const areaD = `${pathD} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`;

                          return (
                            <>
                              <path d={areaD} fill="url(#chartGradient)" />
                              
                              <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
                              
                              {points.map((p, idx) => (
                                <g key={idx} className="group/dot cursor-pointer">
                                  <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                                  <circle cx={p.x} cy={p.y} r="8" fill="#2563eb" fillOpacity="0" className="hover:fill-opacity-15 transition-all" />
                                  
                                  <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[9px] font-bold fill-gray-800 dark:fill-gray-200">
                                    {p.val > 0 ? `Rs. ${(p.val / 1000).toFixed(0)}k` : ''}
                                  </text>
                                  <text x={p.x} y="185" textAnchor="middle" className="text-[10px] font-semibold fill-gray-400">
                                    {p.label}
                                  </text>
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">{t('Spending by Supplier')}</h3>
                    <span className="text-xxs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t('Proportion')}</span>
                  </div>

                  <div className="space-y-3.5 overflow-y-auto max-h-56 pr-1">
                    {purchaseAnalytics.sortedSuppliersBySpend.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 italic text-xs">{t('No purchases record to compare.')}</div>
                    ) : (
                      purchaseAnalytics.sortedSuppliersBySpend.slice(0, 5).map((sup, idx) => {
                        const totalSpend = purchaseAnalytics.sortedSuppliersBySpend.reduce((sum, s) => sum + s.amount, 0) || 1;
                        const percentage = ((sup.amount / totalSpend) * 100).toFixed(1);
                        
                        const colors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];
                        const color = colors[idx % colors.length];

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-gray-800 dark:text-gray-200">
                              <span className="truncate max-w-[140px]">{sup.name}</span>
                              <span>Rs. {sup.amount.toLocaleString()} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                              <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">{t('Supplier Performance Scorecard Matrix')}</h3>
                    <p className="text-xxs text-gray-400 mt-0.5">{t('Scores are computed dynamically based on: On-Time Rates (40%), Low Return Rates (30%), & PO success completion rates (30%).')}</p>
                  </div>
                  <Award className="h-5 w-5 text-amber-500" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-750 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-700 uppercase text-xs tracking-wider">
                        <th className="px-6 py-4">{t('Supplier Name')}</th>
                        <th className="px-6 py-4 text-center">{t('Performance Score')}</th>
                        <th className="px-6 py-4 text-center">{t('Purchase Orders')}</th>
                        <th className="px-6 py-4 text-center">{t('Completed')}</th>
                        <th className="px-6 py-4 text-center">{t('Cancelled')}</th>
                        <th className="px-6 py-4 text-center">{t('On-Time Delivery')}</th>
                        <th className="px-6 py-4 text-center">{t('Return Rate')}</th>
                        <th className="px-6 py-4 text-center">{t('Success Rate')}</th>
                        <th className="px-6 py-4 text-right">{t('Avg Shipment Time')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {supplierPerformanceList.map((sup, idx) => {
                        let scoreColor = 'text-gray-400 bg-gray-50 dark:bg-gray-750';
                        if (sup.performanceScore !== null) {
                          if (sup.performanceScore >= 85) scoreColor = 'text-green-700 bg-green-50 dark:bg-green-950/20';
                          else if (sup.performanceScore >= 60) scoreColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/20';
                          else scoreColor = 'text-red-700 bg-red-50 dark:bg-red-950/20';
                        }

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                              {sup.name}
                            </td>
                            
                            <td className="px-6 py-3 whitespace-nowrap text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-black inline-block ${scoreColor}`}>
                                {sup.performanceScore !== null ? `${sup.performanceScore}/100` : t('N/A')}
                              </span>
                            </td>

                            <td className="px-6 py-3 whitespace-nowrap text-center text-gray-700 dark:text-gray-300 font-semibold">
                              {sup.totalOrders}
                            </td>

                            <td className="px-6 py-3 whitespace-nowrap text-center text-green-650 dark:text-green-400 font-medium">
                              {sup.completedOrders}
                            </td>

                            <td className="px-6 py-3 whitespace-nowrap text-center text-red-650 dark:text-red-400 font-medium">
                              {sup.cancelledOrders}
                            </td>

                            <td className="px-6 py-3 whitespace-nowrap text-center text-blue-600 dark:text-blue-400 font-medium">
                              {sup.onTimeDeliveries}
                            </td>

                            <td className="px-6 py-3 whitespace-nowrap text-center text-xs font-semibold">
                              <span className={Number(sup.returnRate) > 5 ? 'text-red-650 dark:text-red-400' : 'text-gray-500'}>
                                {sup.returnRate}%
                              </span>
                            </td>

                            <td className="px-6 py-3 whitespace-nowrap text-center text-xs font-semibold text-gray-850 dark:text-gray-200">
                              {sup.successRate}%
                            </td>

                            <td className="px-6 py-3 whitespace-nowrap text-right text-gray-700 dark:text-gray-300 font-semibold">
                              {sup.totalOrders > 0 ? `${sup.avgDeliveryTime} ${t('days')}` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: 3. PRODUCT COST COMPARISON MATRIX */}
          {activeSubTab === 'comparison' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/25 border border-blue-100 dark:border-blue-900/30 p-5 rounded-3xl flex items-start gap-4">
                <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-blue-900 dark:text-blue-300 text-sm">{t('Smart Sourcing Price Comparisons & Recommendations')}</h4>
                  <p className="text-xs text-blue-750 dark:text-blue-400 leading-relaxed mt-1">
                    {t('Compare unit cost variations for inventory stock items supplied by multiple partners. Recommends sourcing choices using a normalized scoring system based on lowest unit costs and optimal delivery performance ratings.')}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">{t('Product Sourcing Matrix')}</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-750 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-700 uppercase text-xs tracking-wider">
                        <th className="px-6 py-4">{t('Product Name')}</th>
                        <th className="px-6 py-4">{t('Supplier Details & Prices')}</th>
                        <th className="px-6 py-4 text-center">{t('Lowest Cost')}</th>
                        <th className="px-6 py-4 text-center">{t('Highest Cost')}</th>
                        <th className="px-6 py-4 text-center">{t('Average Cost')}</th>
                        <th className="px-6 py-4 text-center">{t('Price History')}</th>
                        <th className="px-6 py-4 text-right">{t('AI Recommendation')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {productCostComparison.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                            {t('No multi-vendor products identified in your active inventory.')}
                          </td>
                        </tr>
                      ) : (
                        productCostComparison.map((comp, idx) => {
                          const recommendation = getSupplierRecommendation(comp.supplierDetails);
                          return (
                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-bold text-gray-900 dark:text-white block">{comp.name}</span>
                                {comp.sku && <span className="text-[10px] font-mono text-gray-400 block mt-0.5">SKU: {comp.sku}</span>}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-xs">
                                <div className="space-y-1.5 max-w-[280px]">
                                  {comp.supplierDetails.map((det, sIdx) => (
                                    <div key={sIdx} className="flex justify-between items-center gap-2 border-b border-gray-100 dark:border-gray-700/50 pb-0.5">
                                      <span className="truncate text-gray-600 dark:text-gray-400">{det.supplierName}</span>
                                      <span className="font-bold text-gray-800 dark:text-gray-200">Rs. {det.cost.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-center font-black text-green-650 dark:text-green-400">
                                Rs. {comp.lowestCost.toLocaleString()}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-red-650 dark:text-red-400">
                                Rs. {comp.highestCost.toLocaleString()}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-center font-medium text-gray-700 dark:text-gray-300">
                                Rs. {comp.avgCost}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {comp.priceHistory.length > 0 ? (
                                  <button
                                    onClick={() => setSelectedComparisonProduct(comp)}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xxs font-bold transition-all inline-flex items-center gap-1"
                                  >
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{t('View History ({{count}})', { count: comp.priceHistory.length })}</span>
                                  </button>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600 text-xxs italic">{t('No history')}</span>
                                )}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                {recommendation ? (
                                  <div className="text-right">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-black uppercase tracking-wider bg-indigo-50 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                                      <Award className="h-3 w-3" />
                                      {recommendation.supplierName}
                                    </span>
                                    <span className="text-[10px] text-gray-400 block mt-1">Rs. {recommendation.cost.toLocaleString()} ({t('Score')}: {recommendation.performanceScore}%)</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">—</span>
                                )}
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

          {/* TAB CONTENT: 4. SMART SUPPLIER INSIGHTS */}
          {activeSubTab === 'insights' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {smartSupplierInsights.length === 0 ? (
                  <div className="col-span-full bg-white dark:bg-gray-800 rounded-3xl p-16 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Sparkles className="h-10 w-10 text-gray-350 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-955 dark:text-white text-base">{t('No Actionable Insights')}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t('Suppliers database is stable. Ensure transaction records are updated to discover anomalies.')}</p>
                  </div>
                ) : (
                  smartSupplierInsights.map((insight, idx) => {
                    let cardBorder = 'border-gray-200 dark:border-gray-700';
                    let typeBadge = '';
                    let icon = <HelpCircle className="h-5 w-5" />;

                    if (insight.type === 'success') {
                      cardBorder = 'border-green-200 dark:border-green-900/35 bg-green-50/5';
                      typeBadge = 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400';
                      icon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
                    } else if (insight.type === 'info') {
                      cardBorder = 'border-blue-200 dark:border-blue-900/35 bg-blue-50/5';
                      typeBadge = 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400';
                      icon = <Building className="h-5 w-5 text-blue-650" />;
                    } else if (insight.type === 'warning') {
                      cardBorder = 'border-amber-250 dark:border-amber-900/40 bg-amber-50/5';
                      typeBadge = 'bg-amber-100 text-amber-750 dark:bg-amber-950/20 dark:text-amber-400';
                      icon = <AlertTriangle className="h-5 w-5 text-amber-600" />;
                    } else if (insight.type === 'error') {
                      cardBorder = 'border-red-200 dark:border-red-900/35 bg-red-50/5';
                      typeBadge = 'bg-red-100 text-red-750 dark:bg-red-950/20 dark:text-red-400';
                      icon = <ShieldAlert className="h-5 w-5 text-red-650" />;
                    } else if (insight.type === 'trend') {
                      cardBorder = 'border-purple-200 dark:border-purple-900/35 bg-purple-50/5';
                      typeBadge = 'bg-purple-100 text-purple-750 dark:bg-purple-950/20 dark:text-purple-400';
                      icon = <TrendingUp className="h-5 w-5 text-purple-600" />;
                    }

                    return (
                      <div 
                        key={idx} 
                        className={`bg-white dark:bg-gray-800 rounded-3xl p-5 border ${cardBorder} shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-start">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${typeBadge}`}>
                              {insight.title}
                            </span>
                            {icon}
                          </div>
                          
                          <div>
                            <h4 className="font-extrabold text-gray-900 dark:text-white text-sm">{insight.supplierName}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                              {insight.desc}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setSelectedSupplierId(insight.supplierId);
                              setActiveView('profile');
                              setProfileTab('history');
                            }}
                            className="text-xs font-bold text-blue-600 dark:text-blue-450 hover:underline flex items-center gap-0.5"
                          >
                            <span>{t('View Ledger')}</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>

                          {insight.type === 'error' && (
                            <button
                              onClick={() => {
                                setPayFormSupplierId(insight.supplierId);
                                setPayFormOrderId('');
                                setPayFormAmount('');
                                setPayFormNotes('');
                                setShowPaymentModal(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xxs font-black transition-all flex items-center gap-1 shadow-sm"
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              <span>{t('Pay Vendor')}</span>
                            </button>
                          )}

                          {insight.type === 'warning' && (
                            <button
                              onClick={() => navigate('/purchases')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xxs font-black transition-all flex items-center gap-1 shadow-sm"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>{t('New PO')}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB CONTENT: 5. SUPPLIER REPORTS EXPORTER */}
          {activeSubTab === 'reports' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="font-extrabold text-gray-955 dark:text-white text-sm">{t('Supplier Reports Generator')}</h3>
                      <p className="text-xxs text-gray-400 mt-0.5">{t('Select, preview, and download structured reports as CSV, Excel or PDF.')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedReport}
                      onChange={(e) => setSelectedReport(e.target.value as any)}
                      className="px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="directory">{t('Supplier Directory')}</option>
                      <option value="performance">{t('Supplier Performance Report')}</option>
                      <option value="outstanding">{t('Outstanding Balance Report')}</option>
                      <option value="purchases">{t('Purchase Summary Ledger')}</option>
                      <option value="comparison">{t('Cost Comparison Report')}</option>
                    </select>

                    <button
                      onClick={handleExportReportCSV}
                      className="bg-white hover:bg-gray-50 border border-gray-300 dark:bg-gray-850 dark:hover:bg-gray-700 dark:border-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl flex items-center space-x-1.5 text-xs font-bold transition-all shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>{t('CSV/Excel')}</span>
                    </button>

                    <button
                      onClick={handleExportReportPDF}
                      className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-xl flex items-center space-x-1.5 text-xs font-bold transition-all shadow-sm"
                    >
                      <FileText className="h-4 w-4" />
                      <span>{t('Download PDF')}</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-150 dark:border-gray-700 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-55 dark:bg-gray-750 text-gray-550 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-gray-700 uppercase">
                        {selectedReport === 'directory' && (
                          <>
                            <th className="px-4 py-3">{t('Supplier Name')}</th>
                            <th className="px-4 py-3">{t('Category')}</th>
                            <th className="px-4 py-3">{t('Status')}</th>
                            <th className="px-4 py-3 text-right">{t('Outstanding Dues')}</th>
                          </>
                        )}
                        {selectedReport === 'performance' && (
                          <>
                            <th className="px-4 py-3">{t('Supplier Name')}</th>
                            <th className="px-4 py-3 text-center">{t('Score')}</th>
                            <th className="px-4 py-3 text-center">{t('Total Orders')}</th>
                            <th className="px-4 py-3 text-center">{t('Return Rate')}</th>
                            <th className="px-4 py-3 text-center">{t('Success Rate')}</th>
                          </>
                        )}
                        {selectedReport === 'outstanding' && (
                          <>
                            <th className="px-4 py-3">{t('Supplier Name')}</th>
                            <th className="px-4 py-3 text-right">{t('Outstanding Balance')}</th>
                            <th className="px-4 py-3">{t('Terms')}</th>
                            <th className="px-4 py-3">{t('Last Purchase')}</th>
                          </>
                        )}
                        {selectedReport === 'purchases' && (
                          <>
                            <th className="px-4 py-3">{t('PO Number')}</th>
                            <th className="px-4 py-3">{t('Supplier')}</th>
                            <th className="px-4 py-3">{t('Date')}</th>
                            <th className="px-4 py-3 text-right">{t('Amount')}</th>
                            <th className="px-4 py-3 text-center">{t('Status')}</th>
                          </>
                        )}
                        {selectedReport === 'comparison' && (
                          <>
                            <th className="px-4 py-3">{t('Product Name')}</th>
                            <th className="px-4 py-3 text-right">{t('Lowest Cost')}</th>
                            <th className="px-4 py-3 text-right">{t('Highest Cost')}</th>
                            <th className="px-4 py-3 text-right">{t('Average Cost')}</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {selectedReport === 'directory' && filteredSuppliers.map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                          <td className="px-4 py-3 font-bold">{s.name}</td>
                          <td className="px-4 py-3">{s.category}</td>
                          <td className="px-4 py-3">{s.status}</td>
                          <td className="px-4 py-3 text-right font-semibold">Rs. {s.outstandingBalance.toLocaleString()}</td>
                        </tr>
                      ))}
                      {selectedReport === 'performance' && supplierPerformanceList.map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                          <td className="px-4 py-3 font-bold">{s.name}</td>
                          <td className="px-4 py-3 text-center">{s.performanceScore ? `${s.performanceScore}%` : 'N/A'}</td>
                          <td className="px-4 py-3 text-center">{s.totalOrders}</td>
                          <td className="px-4 py-3 text-center">{s.returnRate}%</td>
                          <td className="px-4 py-3 text-center">{s.successRate}%</td>
                        </tr>
                      ))}
                      {selectedReport === 'outstanding' && supplierListWithFinancials.filter(s => s.outstandingBalance > 0).map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                          <td className="px-4 py-3 font-bold">{s.name}</td>
                          <td className="px-4 py-3 text-right font-semibold text-red-650 dark:text-red-400">Rs. {s.outstandingBalance.toLocaleString()}</td>
                          <td className="px-4 py-3">{s.paymentTerms || 'COD'}</td>
                          <td className="px-4 py-3">{s.lastPurchaseDate || 'N/A'}</td>
                        </tr>
                      ))}
                      {selectedReport === 'purchases' && purchaseOrders.map((po, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                          <td className="px-4 py-3 font-bold text-blue-650 dark:text-blue-400">{po.purchaseNumber}</td>
                          <td className="px-4 py-3 font-semibold">{po.supplierName}</td>
                          <td className="px-4 py-3">{po.purchaseDate}</td>
                          <td className="px-4 py-3 text-right">Rs. {po.totalAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">{po.status}</td>
                        </tr>
                      ))}
                      {selectedReport === 'comparison' && productCostComparison.map((c, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                          <td className="px-4 py-3 font-bold">{c.name}</td>
                          <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-semibold">Rs. {c.lowestCost.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 font-semibold">Rs. {c.highestCost.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">Rs. {c.avgCost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* ORIGINAL SUPPLIER PROFILE VIEW                           */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeView === 'profile' && selectedSupplier && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-750 pb-4">
            <button
              onClick={() => {
                setActiveView('list');
                setSelectedSupplierId(null);
              }}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
              <span>{t('Back to Directory')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportProfile(selectedSupplier)}
                className="bg-white hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-650 dark:text-gray-300 px-4 py-2 rounded-xl flex items-center space-x-2 text-xs font-bold transition-all shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>{t('Export Ledger')}</span>
              </button>
              
              <button
                onClick={() => handleEdit(selectedSupplier)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-xs font-bold transition-all shadow-md"
              >
                <Edit className="h-4 w-4" />
                <span>{t('Edit Profile')}</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
            <div className="flex items-center gap-4">
              {selectedSupplier.logo ? (
                <img 
                  src={selectedSupplier.logo} 
                  alt={selectedSupplier.name} 
                  className="w-16 h-16 rounded-2xl object-cover bg-gray-50 border border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-650 text-white flex items-center justify-center font-black text-xl shadow-md">
                  {selectedSupplier.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedSupplier.name}</h2>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xxs font-black uppercase tracking-wider ${
                    selectedSupplier.status === 'Active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-750 dark:text-gray-400'
                  }`}>
                    {selectedSupplier.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-450 mt-1 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30 text-blue-700 dark:text-blue-400">
                    {selectedSupplier.category || 'Wholesaler'}
                  </span>
                  <span>•</span>
                  <span>{t('Added on')} {format(new Date(selectedSupplier.createdAt), 'MMM dd, yyyy')}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-4 w-full lg:w-auto border-t lg:border-t-0 border-gray-100 dark:border-gray-700/60 pt-4 lg:pt-0">
              <div className="flex-1 lg:flex-initial text-center lg:text-right px-4 border-r border-gray-100 dark:border-gray-700">
                <span className="text-xxs uppercase tracking-wider font-bold text-gray-400 block">{t('Outstanding Balance')}</span>
                <span className={`text-lg font-black block mt-1 ${
                  (selectedSupplier.outstandingBalance || 0) > 0 ? 'text-red-650 dark:text-red-400' : 'text-gray-400'
                }`}>
                  Rs. {(selectedSupplier.outstandingBalance || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex-1 lg:flex-initial text-center lg:text-right px-4 border-r border-gray-100 dark:border-gray-700">
                <span className="text-xxs uppercase tracking-wider font-bold text-gray-400 block">{t('Total Purchases')}</span>
                <span className="text-lg font-black text-gray-900 dark:text-white block mt-1">
                  Rs. {(selectedSupplier.totalPurchases || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex-1 lg:flex-initial text-center lg:text-right px-4">
                <span className="text-xxs uppercase tracking-wider font-bold text-gray-400 block">{t('Last Purchase')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white block mt-2">
                  {selectedSupplier.lastPurchaseDate 
                    ? format(new Date(selectedSupplier.lastPurchaseDate), 'MMM dd, yyyy') 
                    : t('Never')
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="space-y-6">
              
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2.5">
                  {t('Company Details')}
                </h3>
                <div className="space-y-3 text-xs">
                  {selectedSupplier.contactPerson && (
                    <div>
                      <span className="text-gray-455 block mb-0.5">{t('Contact Person')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedSupplier.contactPerson}</span>
                    </div>
                  )}
                  {selectedSupplier.phone && (
                    <div>
                      <span className="text-gray-455 block mb-0.5">{t('Phone Number')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        <Phone className="h-3 w-3 text-blue-500" />
                        {selectedSupplier.phone}
                      </span>
                    </div>
                  )}
                  {selectedSupplier.email && (
                    <div>
                      <span className="text-gray-455 block mb-0.5">{t('Email Address')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        <Mail className="h-3 w-3 text-blue-500" />
                        {selectedSupplier.email}
                      </span>
                    </div>
                  )}
                  {selectedSupplier.address && (
                    <div>
                      <span className="text-gray-455 block mb-0.5">{t('Office Address')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                        <span>{selectedSupplier.address}</span>
                      </span>
                    </div>
                  )}
                  {selectedSupplier.specialties && (
                    <div>
                      <span className="text-gray-455 block mb-0.5">{t('Product Specialties')}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-55 dark:bg-gray-700 font-semibold text-gray-850 dark:text-gray-300">
                        {selectedSupplier.specialties}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2.5 flex items-center gap-1.5">
                  <Landmark className="h-4.5 w-4.5 text-blue-500" />
                  {t('Tax & Bank Account')}
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-gray-455 block mb-0.5">{t('Tax ID / NTN / VAT')}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedSupplier.taxId || <span className="text-gray-350 dark:text-gray-600 font-normal italic">{t('Not Configured')}</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-455 block mb-0.5">{t('Bank Name')}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedSupplier.bankName || <span className="text-gray-350 dark:text-gray-600 font-normal italic">{t('Not Configured')}</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-455 block mb-0.5">{t('Bank Account Number / IBAN')}</span>
                    <span className="font-mono text-gray-855 dark:text-gray-250 font-bold">
                      {selectedSupplier.bankAccount || <span className="text-gray-350 dark:text-gray-600 font-normal italic">{t('Not Configured')}</span>}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                    <div>
                      <span className="text-gray-455 block mb-0.5">{t('Payment Terms')}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedSupplier.paymentTerms || 'COD'}</span>
                    </div>
                    <div>
                      <span className="text-gray-455 block mb-0.5">{t('Negotiated Discount')}</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-505 font-bold flex items-center gap-0.5">
                        <Percent className="h-3 w-3" />
                        {selectedSupplier.discountRate || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-2 shadow-sm flex flex-wrap gap-1">
                <button
                  onClick={() => setProfileTab('history')}
                  className={`flex-1 min-w-[100px] text-center py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    profileTab === 'history'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  <span>{t('Purchase Ledger')}</span>
                </button>
                
                <button
                  onClick={() => setProfileTab('notes')}
                  className={`flex-1 min-w-[100px] text-center py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    profileTab === 'notes'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>{t('Internal Notes')}</span>
                </button>

                <button
                  onClick={() => setProfileTab('timeline')}
                  className={`flex-1 min-w-[100px] text-center py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    profileTab === 'timeline'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>{t('Activity Log')}</span>
                </button>

                <button
                  onClick={() => setProfileTab('documents')}
                  className={`flex-1 min-w-[100px] text-center py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    profileTab === 'documents'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <FileCheck className="h-4 w-4" />
                  <span>{t('Documents')}</span>
                </button>
              </div>

              {profileTab === 'history' && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('Purchase Order Ledger')}</h3>
                    <button
                      onClick={() => navigate('/purchases')}
                      className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-xl font-bold transition-all"
                    >
                      {t('+ New Purchase Order')}
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-750 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-700 uppercase">
                          <th className="px-4 py-3">{t('PO Number')}</th>
                          <th className="px-4 py-3">{t('Date')}</th>
                          <th className="px-4 py-3 text-right">{t('Total Amount')}</th>
                          <th className="px-4 py-3 text-right">{t('Paid Amount')}</th>
                          <th className="px-4 py-3 text-right">{t('Due Balance')}</th>
                          <th className="px-4 py-3 text-center">{t('Status')}</th>
                          <th className="px-4 py-3 text-center">{t('Payment')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {supplierPurchaseOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-400 italic">
                              {t('No purchase orders recorded for this supplier')}
                            </td>
                          </tr>
                        ) : (
                          supplierPurchaseOrders.map(po => (
                            <tr key={po.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                              <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">
                                {po.purchaseNumber}
                              </td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                {format(new Date(po.purchaseDate), 'yyyy-MM-dd')}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                Rs. {po.totalAmount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-green-650 dark:text-green-400">
                                Rs. {po.amountPaid.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-red-650 dark:text-red-400">
                                Rs. {po.remainingBalance.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                                  po.status === 'Received' ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400' :
                                  po.status === 'Cancelled' ? 'bg-red-100 text-red-755 dark:bg-red-955/20 dark:text-red-400' :
                                  'bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400'
                                }`}>
                                  {po.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                                  po.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400' :
                                  po.paymentStatus === 'Partially Paid' ? 'bg-amber-100 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400' :
                                  'bg-red-100 text-red-755 dark:bg-red-955/20 dark:text-red-400'
                                }`}>
                                  {po.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {profileTab === 'notes' && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
                  <div className="border-b border-gray-100 dark:border-gray-700 pb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('Internal Notes & Business Terms')}</h3>
                    <p className="text-xxs text-gray-400 mt-0.5">{t('Maintain business specialties, credit limits, delivery behaviors, and negotiated rates. Internal notes are only visible to staff.')}</p>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      defaultValue={selectedSupplier.notes || ''}
                      onBlur={(e) => handleSaveNotes(e.target.value)}
                      placeholder={t('Enter delivery details, discount rates, specialties etc... (auto-saves on blur)')}
                      rows={8}
                      className="w-full p-4 border border-gray-250 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-750 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-sans text-sm leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-xxs text-gray-455 dark:text-gray-500">
                      <span>* {t('Auto-saves when click outside note area.')}</span>
                      <span>PKR {selectedSupplier.discountRate || 0}% {t('negotiated discount')}</span>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'timeline' && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('Communication & Transaction Timeline')}</h3>
                      <p className="text-xxs text-gray-400 mt-0.5">{t('Logs database changes, purchase order statuses, payments, and document additions.')}</p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                      <input
                        type="text"
                        placeholder={t('Filter timeline...')}
                        value={timelineSearch}
                        onChange={(e) => setTimelineSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-gray-250 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-750 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 pl-6 space-y-6 py-2">
                    {supplierTimeline.length === 0 ? (
                      <p className="text-gray-400 italic text-xs">{t('No timeline events found.')}</p>
                    ) : (
                      supplierTimeline.map(item => (
                        <div key={item.id} className="relative">
                          <span className="absolute -left-[30px] top-1 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-full w-4 h-4 flex items-center justify-center">
                            <span className="bg-blue-500 rounded-full w-1.5 h-1.5" />
                          </span>

                          <div className="text-xs">
                            <span className="font-bold text-gray-900 dark:text-white block">{item.action}</span>
                            <div className="flex items-center gap-2 text-xxs text-gray-455 dark:text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(item.date), 'MMM dd, yyyy HH:mm')}
                              </span>
                              <span>•</span>
                              <span>{t('By')}: {item.user}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {profileTab === 'documents' && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
                  <div className="border-b border-gray-100 dark:border-gray-700 pb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('Contract & Pricing Agreements')}</h3>
                    <p className="text-xxs text-gray-400 mt-0.5">{t('Store agreements, negotiated prices, and verification certificates.')}</p>
                  </div>

                  <form onSubmit={handleAddDocument} className="bg-gray-50 dark:bg-gray-750 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        placeholder={t('Document Name (e.g. Price_List_Swat_2026.pdf)')}
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <select
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Contract">{t('Contracts')}</option>
                        <option value="Price List">{t('Price Lists')}</option>
                        <option value="Tax Certificate">{t('Tax Certificates')}</option>
                        <option value="Agreement">{t('Agreements')}</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t('Link Document')}</span>
                    </button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {documents.length === 0 ? (
                      <div className="col-span-2 py-8 text-center text-gray-400 italic text-xs">
                        {t('No documents linked to this supplier profile yet.')}
                      </div>
                    ) : (
                      documents.map(doc => (
                        <div 
                          key={doc.id}
                          className="border border-gray-150 dark:border-gray-700 p-4 rounded-2xl flex items-center justify-between gap-3 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-900/50 shadow-xxs transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="text-xs">
                              <span className="font-bold text-gray-900 dark:text-white block truncate max-w-[180px]">{doc.name}</span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">{doc.type} • {doc.size}</span>
                              <span className="text-[9px] text-gray-455 block mt-0.5">{format(new Date(doc.addedAt), 'yyyy-MM-dd')}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteDocument(doc.id, doc.name)}
                            className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-55 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ADD / EDIT SUPPLIER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between animate-scaleIn">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  {editingSupplier ? t('Edit Supplier Profile') : t('Create New Supplier')}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">{t('Company & Identity')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Company Name *')}</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Supplier Category')}</label>
                      <div className="flex gap-2">
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {allCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const custom = window.prompt(t('Enter custom category:'));
                            if (custom && custom.trim()) {
                              setCustomCategories([...customCategories, custom.trim()]);
                              setFormData({ ...formData, category: custom.trim() });
                            }
                          }}
                          className="px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                        >
                          {t('+ Custom')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">{t('Contact Details')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Contact Person')}</label>
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Phone Number')}</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Email Address')}</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-gray-500 mb-1">{t('Office Address')}</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">{t('Finance & Bank Account')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Bank Name')}</label>
                      <input
                        type="text"
                        placeholder="e.g. Habib Bank Limited"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Account Number / IBAN')}</label>
                      <input
                        type="text"
                        value={formData.bankAccount}
                        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Tax ID / NTN / VAT')}</label>
                      <input
                        type="text"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Negotiated Payment Terms')}</label>
                      <input
                        type="text"
                        placeholder="e.g. Net 30, Net 60, COD"
                        value={formData.paymentTerms}
                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Discount Rate (%)')}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discountRate}
                        onChange={(e) => setFormData({ ...formData, discountRate: Number(e.target.value || 0) })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-850 text-gray-950 dark:text-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Vendor Status')}</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-950 dark:text-white text-xs outline-none"
                      >
                        <option value="Active">{t('Active')}</option>
                        <option value="Inactive">{t('Inactive')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">{t('Additional Info & Notes')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Product Specialties')}</label>
                      <input
                        type="text"
                        placeholder="e.g. Sanitary, Fittings, Pipes"
                        value={formData.specialties}
                        onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{t('Logo URL')}</label>
                      <input
                        type="text"
                        placeholder="https://example.com/logo.png"
                        value={formData.logo}
                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-850 text-gray-900 dark:text-white text-xs outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-gray-500 mb-1">{t('Internal Notes')}</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-bold transition-all shadow-md"
                  >
                    {editingSupplier ? t('Update Profile') : t('Create Supplier')}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingSupplier(null);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-250 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-xl font-bold transition-all"
                  >
                    {t('Cancel')}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between animate-scaleIn">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-500" />
                  {t('Import Suppliers Ledger via CSV')}
                </h2>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                
                <div className="bg-gray-55 dark:bg-gray-750 p-5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
                  <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {t('Select or drag-and-drop a CSV file')}
                  </p>
                  <p className="text-[10px] text-gray-500 mb-4">
                    {t('Supported Headers: Name*, Contact Person, Phone, Email, Address, Category, Tax ID, Bank Name, Bank Account, Notes')}
                  </p>
                  
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white hover:bg-gray-50 border border-gray-350 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750 dark:text-gray-300 dark:border-gray-650 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm inline-block"
                  >
                    {t('Choose File')}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('Or Paste Raw CSV Data Directly:')}</label>
                  <textarea
                    rows={5}
                    value={csvTextInput}
                    onChange={(e) => setCsvTextInput(e.target.value)}
                    placeholder="Name,Contact Person,Phone,Email,Category,Notes&#10;Swat Pipes Inc.,Fazal Haq,+92301988822,info@swatpipes.com,Manufacturer,Quality pipe fittings&#10;Kabul Importers,Haji Rahim,+92344101010,rahim@kabul.com,Importer,Tax certificate checked"
                    className="w-full p-3 border border-gray-250 dark:border-gray-750 rounded-2xl bg-white dark:bg-gray-850 text-gray-900 dark:text-white font-mono text-xxs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={handleParseCSV}
                      className="bg-gray-100 hover:bg-gray-250 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>{t('Parse & Validate')}</span>
                    </button>
                  </div>
                </div>

                {importSummary.parsed && (
                  <div className="space-y-4 pt-2 border-t border-gray-150 dark:border-gray-700">
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-xs uppercase tracking-wider">{t('Validation Report')}</h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-3 rounded-xl">
                        <span className="text-xxs uppercase font-bold text-green-700 dark:text-green-400 block">{t('Ready to Import')}</span>
                        <span className="text-lg font-black text-green-700 dark:text-green-400 block mt-0.5">{importSummary.valid.length} {t('rows')}</span>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-250 dark:border-yellow-900/35 p-3 rounded-xl">
                        <span className="text-xxs uppercase font-bold text-yellow-700 dark:text-yellow-400 block">{t('Duplicate Warnings')}</span>
                        <span className="text-lg font-black text-yellow-700 dark:text-yellow-400 block mt-0.5">{importSummary.duplicates.length} {t('rows')}</span>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 rounded-xl">
                        <span className="text-xxs uppercase font-bold text-red-700 dark:text-red-400 block">{t('Invalid (Errors)')}</span>
                        <span className="text-lg font-black text-red-700 dark:text-red-400 block mt-0.5">{importSummary.invalid.length} {t('rows')}</span>
                      </div>
                    </div>

                    {(importSummary.duplicates.length > 0 || importSummary.invalid.length > 0) && (
                      <div className="max-h-[150px] overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-55 dark:bg-gray-855 text-xxs">
                        {importSummary.duplicates.map((dup, dIdx) => (
                          <div key={`d-${dIdx}`} className="flex items-start gap-1 text-yellow-700 dark:text-yellow-400 font-semibold">
                            <AlertCircle className="h-3.5 w-3.5 text-yellow-505 shrink-0 mt-0.5" />
                            <span>Row #{dIdx + 1} ({dup.name}): {dup.duplicateReason}</span>
                          </div>
                        ))}
                        {importSummary.invalid.map((inv, iIdx) => (
                          <div key={`i-${iIdx}`} className="flex items-start gap-1 text-red-755 dark:text-red-400 font-semibold">
                            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                            <span>Row #{iIdx + 1}: {inv.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={!importSummary.parsed || importSummary.valid.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-450 text-white py-2.5 px-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="h-4.5 w-4.5" />
                <span>{t('Confirm Import ({{count}} records)', { count: importSummary.valid.length })}</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setCsvTextInput('');
                  setImportSummary({ valid: [], duplicates: [], invalid: [], parsed: false });
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-255 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-xl font-bold transition-all"
              >
                {t('Close')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* RECORD SUPPLIER PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between animate-scaleIn">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-500" />
                  {t('Record Supplier Payment')}
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{t('Select Supplier')}</label>
                  <select
                    required
                    value={payFormSupplierId}
                    onChange={(e) => {
                      setPayFormSupplierId(e.target.value ? Number(e.target.value) : '');
                      setPayFormOrderId('');
                    }}
                    className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-950 dark:text-white text-sm outline-none"
                  >
                    <option value="">{t('-- Select a Supplier --')}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {payFormSupplierId !== '' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{t('Select Purchase Order')}</label>
                    <select
                      required
                      value={payFormOrderId}
                      onChange={(e) => {
                        const orderId = Number(e.target.value);
                        setPayFormOrderId(orderId);
                        const poObj = pendingOrdersForPaymentSupplier.find(p => p.id === orderId);
                        if (poObj) {
                          setPayFormAmount(poObj.remainingBalance);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-950 dark:text-white text-sm outline-none"
                    >
                      <option value="">{t('-- Select Pending PO --')}</option>
                      {pendingOrdersForPaymentSupplier.map(po => (
                        <option key={po.id} value={po.id}>
                          {po.purchaseNumber} ({po.purchaseDate}) - Balance: Rs. {po.remainingBalance.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {pendingOrdersForPaymentSupplier.length === 0 && (
                      <p className="text-red-500 text-xxs mt-1">{t('No pending unpaid purchase orders for this supplier.')}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{t('Payment Amount (PKR)')}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={payFormAmount}
                      onChange={(e) => setPayFormAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-950 dark:text-white text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{t('Payment Method')}</label>
                    <select
                      value={payFormMethod}
                      onChange={(e) => setPayFormMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-950 dark:text-white text-sm outline-none"
                    >
                      <option value="Cash">{t('Cash')}</option>
                      <option value="Bank Transfer">{t('Bank Transfer')}</option>
                      <option value="Card">{t('Card')}</option>
                      <option value="Cheque">{t('Cheque')}</option>
                      <option value="Mobile Wallet">{t('Mobile Wallet')}</option>
                      <option value="Other">{t('Other')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{t('Internal Notes')}</label>
                  <textarea
                    value={payFormNotes}
                    onChange={(e) => setPayFormNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-250 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-950 dark:text-white text-xs outline-none"
                  />
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={!payFormOrderId || !payFormAmount}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-450 text-white py-2.5 px-4 rounded-xl font-bold transition-all shadow-md"
                  >
                    {t('Submit Payment')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-gray-150 hover:bg-gray-250 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-800 dark:text-gray-205 py-2.5 px-4 rounded-xl font-bold transition-all"
                  >
                    {t('Cancel')}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* PRICE HISTORY MODAL */}
      {selectedComparisonProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-gray-955 dark:text-white text-base">{selectedComparisonProduct.name}</h3>
                <span className="text-[10px] text-gray-400 font-mono">SKU: {selectedComparisonProduct.sku || 'N/A'}</span>
              </div>
              <button
                onClick={() => setSelectedComparisonProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-450">{t('Historical Unit Purchase Price History')}</h4>

              <div className="overflow-y-auto max-h-[300px] border border-gray-150 dark:border-gray-700 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-750 text-gray-500 font-bold border-b border-gray-155 dark:border-gray-700 uppercase">
                      <th className="px-4 py-3">{t('Order Date')}</th>
                      <th className="px-4 py-3">{t('Supplier')}</th>
                      <th className="px-4 py-3 text-right">{t('Unit Cost')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {selectedComparisonProduct.priceHistory.map((h: any, hIdx: number) => (
                      <tr key={hIdx} className="hover:bg-gray-55/50 dark:hover:bg-gray-750/30">
                        <td className="px-4 py-2.5 text-gray-500">{h.date}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-gray-200">{h.supplierName}</td>
                        <td className="px-4 py-2.5 text-right font-black text-gray-900 dark:text-white">Rs. {h.cost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedComparisonProduct(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                >
                  {t('Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;