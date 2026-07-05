import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Package,
  Tags,
  Search,
  Filter,
  Download,
  Upload,
  X,
  Grid,
  List,
  Eye,
  Edit,
  TrendingUp,
  Activity,
  ArrowUpDown,
  Clock,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Info,
  ChevronDown,
  Sparkles,
  Printer,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  PlusCircle,
  FileText,
  Heart,
  HelpCircle,
  Bell,
  ArrowRight,
  Bookmark,
  Share2,
  BookOpen,
  PieChart,
  BarChart4
} from 'lucide-react';
import { useInventoryStore, Product, Category, ProductVariant } from '../stores/inventoryStore';
import { useSupplierStore } from '../stores/supplierStore';
import { usePOSStore } from '../stores/posStore';
import inventoryService from '../services/inventoryService';
import supplierService from '../services/supplierService';
import {
  StockPurchase,
  StockAdjustment,
  PurchaseEntry,
  PurchaseEntryItem,
  StockMovement,
  InventoryAuditLog
} from '../backend/types';
import PageHeader from '../components/PageHeader';
import FilterSection from '../components/FilterSection';
import KpiCard from '../components/KpiCard';
import ContentCard from '../components/ContentCard';
import EmptyState from '../components/EmptyState';
import DetailPageLayout from '../components/DetailPageLayout';

interface SavedPreset {
  name: string;
  category: string;
  brand: string;
  supplier: string;
  stockStatus: string;
  status: string;
  minPrice: string;
  maxPrice: string;
}

const CODE39_ENCODINGS: Record<string, string> = {
  '0': 'N N W W N N N N W',
  '1': 'W N N N W N N N W',
  '2': 'N N W N W N N N W',
  '3': 'W N W N N N N N W',
  '4': 'N N N N W N W N W',
  '5': 'W N N N N N W N W',
  '6': 'N N W N N N W N W',
  '7': 'N N N N N N W W W',
  '8': 'W N N N N N W W N',
  '9': 'N N W N N N W W N',
  'A': 'W N N W N N N N W',
  'B': 'N N W W N N N N W',
  'C': 'W N W W N N N N N',
  'D': 'N N N W W N N N W',
  'E': 'W N N W W N N N N',
  'F': 'N N W W W N N N N',
  'G': 'N N N W N N W N W',
  'H': 'W N N W N N W N N',
  'I': 'N N W W N N W N N',
  'J': 'N N N W W N W N N',
  'K': 'W N N N N N N W W',
  'L': 'N N W N N N N W W',
  'M': 'W N W N N N N W N',
  'N': 'N N N N W N N W W',
  'O': 'W N N N W N N W N',
  'P': 'N N W N W N N W N',
  'Q': 'N N N N N N W W W',
  'R': 'W N N N N N W W N',
  'S': 'N N W N N N W W N',
  'T': 'N N N N W N W W N',
  'U': 'W W N N N N N N W',
  'V': 'N W W N N N N N W',
  'W': 'W W W N N N N N N',
  'X': 'N W N N W N N N W',
  'Y': 'W W N N W N N N N',
  'Z': 'N W W N W N N N N',
  '-': 'N W N N N N N W W',
  '.': 'W W N N N N N W N',
  ' ': 'N W W N N N N W N',
  '*': 'N W N N W N N W N', // Start/Stop
  '$': 'N W N W N W N N N',
  '/': 'N W N W N N N W N',
  '+': 'N W N N N W N W N',
  '%': 'N N N W N W N W N'
};

const renderBarcodeSVG = (text: string) => {
  const cleanText = `*${text.toUpperCase().replace(/\*/g, '')}*`;
  
  // Calculate total modules width
  let totalWidth = 0;
  const characters: string[][] = [];
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const encoding = CODE39_ENCODINGS[char];
    if (!encoding) continue;
    
    const elements = encoding.split(' ');
    characters.push(elements);
    
    // Add widths of the 9 elements
    elements.forEach(el => {
      totalWidth += el === 'W' ? 3 : 1;
    });
    
    // Add inter-character gap (width 1)
    if (i < cleanText.length - 1) {
      totalWidth += 1;
    }
  }

  // Build SVG rects
  let currentX = 0;
  const rects: React.ReactNode[] = [];

  characters.forEach((elements, charIdx) => {
    elements.forEach((el, elIdx) => {
      const width = el === 'W' ? 3 : 1;
      const isBar = elIdx % 2 === 0; // Even index = bar (black)

      if (isBar) {
        rects.push(
          <rect
            key={`${charIdx}-${elIdx}`}
            x={currentX}
            y={0}
            width={width}
            height={32}
            fill="black"
          />
        );
      }
      currentX += width;
    });
    
    // Character separator space
    currentX += 1;
  });

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 32`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {rects}
    </svg>
  );
};

const Inventory: React.FC = () => {
  const { t } = useTranslation();
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory
  } = useInventoryStore();
  const { suppliers } = useSupplierStore();
  const { sales } = usePOSStore();

  // Tab State (Default to Analytics for intelligence landing)
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'categories' | 'adjustments' | 'purchases' | 'movements' | 'audit' | 'barcodes'>('analytics');

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Quick Filter State
  const [quickFilter, setQuickFilter] = useState<'all' | 'out_of_stock' | 'low_stock' | 'overstocked' | 'discontinued' | 'missing_image' | 'missing_supplier' | 'duplicate_sku'>('all');

  // Presets State
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showPresetModal, setShowPresetModal] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState<keyof Product | 'categoryName' | 'supplierName' | ''>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Layout View State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection & Bulk State
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkActionType, setBulkActionType] = useState<'delete' | 'category' | 'price' | 'status' | ''>('');
  const [bulkTargetCategory, setBulkTargetCategory] = useState<string>('');
  const [bulkTargetStatus, setBulkTargetStatus] = useState<'Active' | 'Draft' | 'Discontinued'>('Active');
  const [bulkPriceChangeType, setBulkPriceChangeType] = useState<'percent_inc' | 'percent_dec' | 'fixed_inc' | 'fixed_dec'>('percent_inc');
  const [bulkPriceValue, setBulkPriceValue] = useState<string>('');

  // Detail Drawer State
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [detailPurchases, setDetailPurchases] = useState<StockPurchase[]>([]);
  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);
  const [detailTab, setDetailTab] = useState<'overview' | 'pricing' | 'stats' | 'ledger'>('overview');

  // Add/Edit Modals State
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Operations Data state
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [purchaseEntries, setPurchaseEntries] = useState<PurchaseEntry[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [auditLogs, setAuditLogs] = useState<InventoryAuditLog[]>([]);

  // Modals for Stock Adjustments & Purchase Entries
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Stock Adjustment Form
  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: '',
    quantity: '',
    adjustmentType: 'Stock In' as StockAdjustment['adjustmentType'],
    reason: '',
    notes: ''
  });

  // Purchase Entry Form
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: '',
    taxes: '0',
    discounts: '0',
    items: [] as Omit<PurchaseEntryItem, 'id' | 'purchaseEntryId'>[]
  });
  const [purchaseItemInput, setPurchaseItemInput] = useState({
    productId: '',
    costPrice: '',
    quantity: ''
  });

  // Bulk Import state
  const [importFileText, setImportFileText] = useState('');
  const [importSummary, setImportSummary] = useState<{
    total: number;
    valid: number;
    invalid: number;
    rows: any[];
  } | null>(null);

  // Barcode state
  const [barcodeConfig, setBarcodeConfig] = useState({
    productId: '',
    copies: '10',
    size: '50x25' as '50x25' | '38x25' | '60x30',
    showName: true,
    showPrice: true,
    showNumber: true
  });
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Forms State
  const [productForm, setProductForm] = useState({
    name: '',
    nameUrdu: '',
    barcode: '',
    sku: '',
    brand: '',
    categoryId: '',
    supplierId: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    description: '',
    image: '', // main cover
    status: 'Active' as 'Active' | 'Draft' | 'Discontinued',
    images: [] as string[], // multiple images
    hasVariants: false,
    variants: [] as ProductVariant[]
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    nameUrdu: '',
    description: ''
  });

  // Load saved presets from localStorage and listen to hash query filters
  useEffect(() => {
    const saved = localStorage.getItem('khatabook_inventory_presets');
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    const handleHashChange = () => {
      const hashParts = window.location.hash.split('?');
      if (hashParts[0] === '#/inventory') {
        const queryParams = new URLSearchParams(hashParts[1] || '');
        const filter = queryParams.get('filter');
        const tab = queryParams.get('tab');
        if (filter === 'low_stock') {
          setActiveTab('products');
          setQuickFilter('low_stock');
        } else if (filter === 'out_of_stock') {
          setActiveTab('products');
          setQuickFilter('out_of_stock');
        } else if (filter === 'overstocked') {
          setActiveTab('products');
          setQuickFilter('overstocked');
        }
        if (tab === 'analytics') {
          setActiveTab('analytics');
        } else if (tab === 'products') {
          setActiveTab('products');
        }
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Save preset handler
  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const preset: SavedPreset = {
      name: newPresetName.trim(),
      category: selectedCategory,
      brand: selectedBrand,
      supplier: selectedSupplier,
      stockStatus: selectedStockStatus,
      status: selectedStatus,
      minPrice,
      maxPrice
    };
    const updated = [...savedPresets, preset];
    setSavedPresets(updated);
    localStorage.setItem('khatabook_inventory_presets', JSON.stringify(updated));
    setNewPresetName('');
    setShowPresetModal(false);
    alert('Filter preset saved successfully!');
  };

  // Apply saved preset
  const handleApplyPreset = (preset: SavedPreset) => {
    setSelectedCategory(preset.category);
    setSelectedBrand(preset.brand);
    setSelectedSupplier(preset.supplier);
    setSelectedStockStatus(preset.stockStatus);
    setSelectedStatus(preset.status);
    setMinPrice(preset.minPrice);
    setMaxPrice(preset.maxPrice);
    setShowAdvancedFilters(true);
  };

  // Delete saved preset
  const handleDeletePreset = (name: string) => {
    const updated = savedPresets.filter(p => p.name !== name);
    setSavedPresets(updated);
    localStorage.setItem('khatabook_inventory_presets', JSON.stringify(updated));
  };

  // Dynamic values extracted from products for filter dropdowns
  const brandsList = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [products]);

  // Load adjustments
  const loadAdjustments = async () => {
    try {
      const data = await inventoryService.getStockAdjustments();
      setAdjustments(data);
    } catch (e) {
      console.error('Failed to load adjustments:', e);
    }
  };

  // Load purchase entries
  const loadPurchaseEntries = async () => {
    try {
      const data = await supplierService.getPurchaseEntries();
      setPurchaseEntries(data);
    } catch (e) {
      console.error('Failed to load purchase entries:', e);
    }
  };

  // Load movements
  const loadMovements = async () => {
    try {
      const data = await inventoryService.getStockMovements();
      setMovements(data);
    } catch (e) {
      console.error('Failed to load movements:', e);
    }
  };

  // Load audit logs
  const loadAuditLogs = async () => {
    try {
      const data = await inventoryService.getInventoryAuditLogs();
      setAuditLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
  };

  // Effect to load data based on active tab
  useEffect(() => {
    if (activeTab === 'products') {
      useInventoryStore.getState().initializeFromDatabase();
    } else if (activeTab === 'adjustments') {
      loadAdjustments();
    } else if (activeTab === 'purchases') {
      loadPurchaseEntries();
    } else if (activeTab === 'movements') {
      loadMovements();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  // Clean filter parameters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedSupplier('');
    setSelectedStockStatus('');
    setSelectedStatus('');
    setMinPrice('');
    setMaxPrice('');
    setQuickFilter('all');
  };

  // Dynamically compute product status badge text/color class
  const getProductStatus = (product: Product) => {
    if (product.status === 'Discontinued') {
      return { text: 'Discontinued', className: 'bg-purple-105 text-purple-800 dark:bg-purple-900/30 dark:text-purple-305' };
    }
    if (product.status === 'Draft') {
      return { text: 'Draft', className: 'bg-gray-105 text-gray-800 dark:bg-gray-700/50 dark:text-gray-305' };
    }
    if (product.stock === 0) {
      return { text: 'Out of Stock', className: 'bg-red-105 text-red-800 dark:bg-red-900/30 dark:text-red-305' };
    }
    if (product.stock <= product.minStock) {
      return { text: 'Low Stock', className: 'bg-amber-105 text-amber-850 dark:bg-amber-900/30 dark:text-amber-305' };
    }
    return { text: 'Active', className: 'bg-emerald-105 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-305' };
  };

  // Open Drawer and fetch stock purchases & movements
  const handleOpenDetail = async (product: Product) => {
    setSelectedDetailProduct(product);
    setDetailTab('overview');
    try {
      const pm = await inventoryService.getStockMovements(product.id);
      setProductMovements(pm);
      const purchases = await supplierService.getProductStockPurchases(product.id);
      setDetailPurchases(purchases);
    } catch (err) {
      console.error('Failed to fetch product details:', err);
    }
  };

  // Image Upload helper (supports multiple files)
  const handleImageFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const updatedImages = [...productForm.images];
      let filesProcessed = 0;

      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result && !updatedImages.includes(result)) {
            updatedImages.push(result);
          }
          filesProcessed++;
          if (filesProcessed === files.length) {
            setProductForm(prev => {
              const mainCover = prev.image ? prev.image : (updatedImages[0] || '');
              return {
                ...prev,
                images: updatedImages,
                image: mainCover
              };
            });
          }
        };
        reader.readAsDataURL(files[i]);
      }
    }
  };

  // Add Image via URL
  const [imageUrlInput, setImageUrlInput] = useState('');
  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrlInput && imageUrlInput.trim() !== '') {
      const url = imageUrlInput.trim();
      if (!productForm.images.includes(url)) {
        setProductForm(prev => {
          const updatedImages = [...prev.images, url];
          const mainCover = prev.image ? prev.image : url;
          return {
            ...prev,
            images: updatedImages,
            image: mainCover
          };
        });
      }
      setImageUrlInput('');
    }
  };

  // Reorder Images
  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...productForm.images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newImages.length) {
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      setProductForm({ ...productForm, images: newImages });
    }
  };

  // Delete Image
  const handleDeleteImage = (index: number) => {
    const deletedImg = productForm.images[index];
    const newImages = productForm.images.filter((_, i) => i !== index);
    let newCover = productForm.image;
    if (newCover === deletedImg) {
      newCover = newImages[0] || '';
    }
    setProductForm({
      ...productForm,
      images: newImages,
      image: newCover
    });
  };

  const handleSetCoverImage = (img: string) => {
    setProductForm({ ...productForm, image: img });
  };

  // Variants Manager: Add new empty Variant row
  const handleAddVariantRow = () => {
    const newVariant: ProductVariant = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      sku: '',
      barcode: '',
      cost: parseFloat(productForm.cost) || 0,
      price: parseFloat(productForm.price) || 0,
      stock: 0
    };
    setProductForm({
      ...productForm,
      variants: [...productForm.variants, newVariant]
    });
  };

  // Update variant row field
  const handleUpdateVariantField = (variantId: string, field: keyof ProductVariant, val: any) => {
    setProductForm(prev => {
      const updated = prev.variants.map(v => {
        if (v.id === variantId) {
          const updatedVal = (field === 'price' || field === 'cost' || field === 'stock') ? parseFloat(val) || 0 : val;
          return { ...v, [field]: updatedVal };
        }
        return v;
      });

      const totalStock = updated.reduce((sum, v) => sum + (v.stock || 0), 0);
      return {
        ...prev,
        variants: updated,
        stock: totalStock.toString()
      };
    });
  };

  const handleDeleteVariantRow = (variantId: string) => {
    setProductForm(prev => {
      const updated = prev.variants.filter(v => v.id !== variantId);
      const totalStock = updated.reduce((sum, v) => sum + (v.stock || 0), 0);
      return {
        ...prev,
        variants: updated,
        stock: totalStock.toString()
      };
    });
  };

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Quick Filters
    if (quickFilter !== 'all') {
      if (quickFilter === 'out_of_stock') {
        result = result.filter(p => p.stock === 0);
      } else if (quickFilter === 'low_stock') {
        result = result.filter(p => p.stock > 0 && p.stock <= p.minStock);
      } else if (quickFilter === 'overstocked') {
        result = result.filter(p => p.stock > p.minStock * 5);
      } else if (quickFilter === 'discontinued') {
        result = result.filter(p => p.status === 'Discontinued');
      } else if (quickFilter === 'missing_image') {
        result = result.filter(p => !p.image);
      } else if (quickFilter === 'missing_supplier') {
        result = result.filter(p => !p.supplierId);
      } else if (quickFilter === 'duplicate_sku') {
        // Find duplicate SKUs
        const skuCounts: Record<string, number> = {};
        products.forEach(p => {
          if (p.sku) {
            skuCounts[p.sku.toLowerCase()] = (skuCounts[p.sku.toLowerCase()] || 0) + 1;
          }
        });
        result = result.filter(p => p.sku && skuCounts[p.sku.toLowerCase()] > 1);
      }
    }

    // Search query matching
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(p => {
        const categoryName = categories.find(c => c.id === p.categoryId)?.name || '';
        const supplierName = suppliers.find(s => s.id === p.supplierId)?.name || '';
        return (
          p.name.toLowerCase().includes(query) ||
          (p.nameUrdu && p.nameUrdu.toLowerCase().includes(query)) ||
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          (p.barcode && p.barcode.includes(query)) ||
          categoryName.toLowerCase().includes(query) ||
          (p.brand && p.brand.toLowerCase().includes(query)) ||
          supplierName.toLowerCase().includes(query)
        );
      });
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(p => p.categoryId.toString() === selectedCategory);
    }

    // Brand filter
    if (selectedBrand) {
      result = result.filter(p => p.brand === selectedBrand);
    }

    // Supplier filter
    if (selectedSupplier) {
      result = result.filter(p => p.supplierId?.toString() === selectedSupplier);
    }

    // Status filter
    if (selectedStatus) {
      result = result.filter(p => p.status === selectedStatus);
    }

    // Stock level status filter
    if (selectedStockStatus) {
      if (selectedStockStatus === 'in_stock') {
        result = result.filter(p => p.stock > p.minStock);
      } else if (selectedStockStatus === 'low_stock') {
        result = result.filter(p => p.stock <= p.minStock && p.stock > 0);
      } else if (selectedStockStatus === 'out_of_stock') {
        result = result.filter(p => p.stock === 0);
      }
    }

    // Price range filters
    if (minPrice) {
      result = result.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      result = result.filter(p => p.price <= parseFloat(maxPrice));
    }

    // Sort operations
    if (sortField) {
      result.sort((a, b) => {
        let valA: any = a[sortField as keyof Product] || '';
        let valB: any = b[sortField as keyof Product] || '';

        // Resolve relations for sorting
        if (sortField === 'categoryName') {
          valA = categories.find(c => c.id === a.categoryId)?.name || '';
          valB = categories.find(c => c.id === b.categoryId)?.name || '';
        } else if (sortField === 'supplierName') {
          valA = suppliers.find(s => s.id === a.supplierId)?.name || '';
          valB = suppliers.find(s => s.id === b.supplierId)?.name || '';
        }

        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
      });
    }

    return result;
  }, [
    products,
    searchTerm,
    selectedCategory,
    selectedBrand,
    selectedSupplier,
    selectedStockStatus,
    selectedStatus,
    minPrice,
    maxPrice,
    sortField,
    sortDirection,
    categories,
    suppliers,
    quickFilter
  ]);

  // Page Slicing
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedBrand, selectedSupplier, selectedStockStatus, selectedStatus, minPrice, maxPrice, quickFilter]);

  // Sort helper
  const handleSort = (field: keyof Product | 'categoryName' | 'supplierName') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Item Selection Helper
  const handleSelectProduct = (productId: number) => {
    setSelectedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(paginatedProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  // Bulk execution operations
  const handleBulkExecute = async () => {
    if (selectedProductIds.length === 0) return;

    if (bulkActionType === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedProductIds.length} selected products?`)) {
        await Promise.all(selectedProductIds.map(id => deleteProduct(id)));
        alert('Selected products deleted successfully.');
        setSelectedProductIds([]);
        setBulkActionType('');
      }
    } else if (bulkActionType === 'category') {
      if (!bulkTargetCategory) {
        alert('Please select a target category.');
        return;
      }
      const categoryId = parseInt(bulkTargetCategory);
      await Promise.all(selectedProductIds.map(id => updateProduct(id, { categoryId })));
      alert('Selected products category updated.');
      setSelectedProductIds([]);
      setBulkActionType('');
    } else if (bulkActionType === 'status') {
      await Promise.all(selectedProductIds.map(id => updateProduct(id, { status: bulkTargetStatus })));
      alert('Selected products status updated.');
      setSelectedProductIds([]);
      setBulkActionType('');
    } else if (bulkActionType === 'price') {
      const changeVal = parseFloat(bulkPriceValue);
      if (isNaN(changeVal) || changeVal <= 0) {
        alert('Please enter a valid amount or percentage greater than 0.');
        return;
      }
      await Promise.all(
        selectedProductIds.map(id => {
          const product = products.find(p => p.id === id);
          if (!product) return Promise.resolve();

          let newPrice = product.price;
          let newCost = product.cost;

          if (bulkPriceChangeType === 'percent_inc') {
            newPrice = product.price * (1 + changeVal / 100);
            newCost = product.cost * (1 + changeVal / 100);
          } else if (bulkPriceChangeType === 'percent_dec') {
            newPrice = Math.max(0, product.price * (1 - changeVal / 100));
            newCost = Math.max(0, product.cost * (1 - changeVal / 100));
          } else if (bulkPriceChangeType === 'fixed_inc') {
            newPrice = product.price + changeVal;
            newCost = product.cost + changeVal;
          } else if (bulkPriceChangeType === 'fixed_dec') {
            newPrice = Math.max(0, product.price - changeVal);
            newCost = Math.max(0, product.cost - changeVal);
          }

          return updateProduct(id, { price: newPrice, cost: newCost });
        })
      );
      alert('Selected products price updated.');
      setSelectedProductIds([]);
      setBulkActionType('');
      setBulkPriceValue('');
    }
  };

  // Bulk Export
  const handleBulkExport = () => {
    const targetProducts = selectedProductIds.length > 0 
      ? products.filter(p => selectedProductIds.includes(p.id))
      : products;

    const dataStr = JSON.stringify(targetProducts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product_catalog_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Product Submit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: productForm.name,
      nameUrdu: productForm.nameUrdu || '',
      barcode: productForm.barcode || undefined,
      sku: productForm.sku || undefined,
      brand: productForm.brand || undefined,
      categoryId: parseInt(productForm.categoryId),
      supplierId: productForm.supplierId ? parseInt(productForm.supplierId) : undefined,
      price: parseFloat(productForm.price),
      cost: parseFloat(productForm.cost),
      stock: parseInt(productForm.stock),
      initialStock: editingProduct ? editingProduct.initialStock : parseInt(productForm.stock),
      minStock: parseInt(productForm.minStock) || 5,
      description: productForm.description || undefined,
      image: productForm.image || undefined,
      images: productForm.images,
      status: productForm.status,
      variants: productForm.hasVariants ? productForm.variants : []
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
      setEditingProduct(null);
      alert(t('common.product') + ' updated successfully');
    } else {
      const result = await addProduct(productData);
      if (!result.success) {
        alert(result.message);
        return;
      }
      alert(result.message);
    }

    resetProductForm();
    setShowProductModal(false);
  };

  // Category Submit
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCategory) {
      await updateCategory(editingCategory.id.toString(), categoryForm);
      setEditingCategory(null);
      alert('Category updated successfully');
    } else {
      await addCategory(categoryForm);
      alert('Category added successfully');
    }

    resetCategoryForm();
    setShowCategoryModal(false);
  };

  // Stock Adjustment Submission
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prodId = parseInt(adjustmentForm.productId);
    const qtyRaw = parseInt(adjustmentForm.quantity);
    if (!prodId || isNaN(qtyRaw) || qtyRaw <= 0) {
      alert('Please select a valid product and numeric quantity.');
      return;
    }

    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    let finalQty = qtyRaw;
    if (['Stock Out', 'Damaged', 'Lost'].includes(adjustmentForm.adjustmentType)) {
      finalQty = -Math.abs(qtyRaw);
    } else {
      finalQty = Math.abs(qtyRaw);
    }

    try {
      await inventoryService.addStockAdjustment({
        productId: prodId,
        productName: prod.name,
        quantity: finalQty,
        adjustmentType: adjustmentForm.adjustmentType,
        reason: adjustmentForm.reason,
        notes: adjustmentForm.notes
      });
      alert('Stock adjusted successfully!');
      setShowAdjustmentModal(false);
      setAdjustmentForm({
        productId: '',
        quantity: '',
        adjustmentType: 'Stock In',
        reason: '',
        notes: ''
      });
      loadAdjustments();
    } catch (err) {
      console.error(err);
      alert('Database error during adjustment.');
    }
  };

  const handlePrintBarcodes = () => {
    if (!printAreaRef.current) return;
    
    const printContent = printAreaRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is preventing printing.');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            @media print {
              @page {
                size: auto;
                margin: 0;
              }
              body {
                margin: 10px;
                background: white;
                color: black;
              }
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
              background: #f9fafb;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
            }
            .barcode-card {
              border: 1px solid #e5e7eb;
              padding: 12px;
              border-radius: 8px;
              text-align: center;
              background: white;
              page-break-inside: avoid;
            }
            .title {
              font-weight: bold;
              font-size: 11px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-bottom: 2px;
            }
            .price {
              font-weight: 800;
              font-size: 12px;
              margin-bottom: 4px;
            }
            .barcode-svg {
              height: 36px;
              margin: 6px auto;
            }
            .value {
              font-size: 9px;
              font-family: monospace;
              color: #4b5563;
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${printContent}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Add Item inside Purchase Entry form
  const handleAddPurchaseItem = () => {
    const prodId = parseInt(purchaseItemInput.productId);
    const costVal = parseFloat(purchaseItemInput.costPrice);
    const qtyVal = parseInt(purchaseItemInput.quantity);

    if (!prodId || isNaN(costVal) || isNaN(qtyVal) || qtyVal <= 0 || costVal < 0) {
      alert('Please select a valid product, cost, and positive quantity.');
      return;
    }

    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    if (purchaseForm.items.some(i => i.productId === prodId)) {
      alert('Product already added to items. Remove or edit quantity instead.');
      return;
    }

    const newItem: Omit<PurchaseEntryItem, 'id' | 'purchaseEntryId'> = {
      productId: prodId,
      productName: prod.name,
      costPrice: costVal,
      quantity: qtyVal,
      subtotal: costVal * qtyVal
    };

    setPurchaseForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setPurchaseItemInput({
      productId: '',
      costPrice: '',
      quantity: ''
    });
  };

  // Delete Item inside Purchase Entry form
  const handleDeletePurchaseItem = (idx: number) => {
    setPurchaseForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  // Purchase Entry Submit
  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const supplierId = parseInt(purchaseForm.supplierId);
    if (!supplierId) {
      alert('Please select a supplier.');
      return;
    }

    if (purchaseForm.items.length === 0) {
      alert('Please add at least one product.');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const subtotal = purchaseForm.items.reduce((sum, i) => sum + i.subtotal, 0);
    const taxes = parseFloat(purchaseForm.taxes) || 0;
    const discounts = parseFloat(purchaseForm.discounts) || 0;
    const netTotal = subtotal + taxes - discounts;

    try {
      await supplierService.addPurchaseEntry({
        supplierId,
        supplierName: supplier.name,
        purchaseDate: purchaseForm.purchaseDate,
        invoiceNumber: purchaseForm.invoiceNumber,
        taxes,
        discounts,
        notes: purchaseForm.notes,
        totalAmount: netTotal
      }, purchaseForm.items);

      alert('Purchase Entry recorded successfully. Catalog stock values adjusted.');
      setShowPurchaseModal(false);
      setPurchaseForm({
        supplierId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        notes: '',
        taxes: '0',
        discounts: '0',
        items: []
      });
      loadPurchaseEntries();
    } catch (err) {
      console.error(err);
      alert('Procurement entry failed due to database transaction error.');
    }
  };

  // CSV Import Loader & Validator
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    const result: any[] = [];
    if (lines.length === 0 || !lines[0].trim()) return result;

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      let row: string[] = [];
      let insideQuote = false;
      let entry = '';
      
      for (let char of line) {
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          row.push(entry.trim());
          entry = '';
        } else {
          entry += char;
        }
      }
      row.push(entry.trim());
      
      if (row.length === headers.length) {
        const obj: any = {};
        headers.forEach((header, idx) => {
          obj[header] = row[idx].replace(/^["']|["']$/g, '');
        });
        result.push(obj);
      }
    }
    return result;
  };

  const handleCSVImportLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setImportFileText(text);

      const rows = parseCSV(text);
      let validCount = 0;
      let invalidCount = 0;
      const validatedRows = rows.map((row, idx) => {
        const errors: string[] = [];
        
        if (!row.name) errors.push('Missing Name');
        if (!row.categoryId) errors.push('Missing Category ID');
        if (!row.price) errors.push('Missing Price');
        if (!row.cost) errors.push('Missing Cost');

        const price = parseFloat(row.price);
        const cost = parseFloat(row.cost);
        const stock = parseInt(row.stock);
        const minStock = parseInt(row.minStock);

        if (isNaN(price) || price < 0) errors.push('Invalid Price value');
        if (isNaN(cost) || cost < 0) errors.push('Invalid Cost value');
        if (isNaN(stock) || stock < 0) errors.push('Invalid Stock quantity');
        if (isNaN(minStock) || minStock < 0) errors.push('Invalid Min Stock limit');

        if (row.sku) {
          const isDupSkuDB = products.some(p => p.sku && p.sku.toLowerCase() === row.sku.toLowerCase());
          if (isDupSkuDB) errors.push('Duplicate SKU in catalog database');
        }
        if (row.barcode) {
          const isDupBarDB = products.some(p => p.barcode && p.barcode.trim() === row.barcode.trim());
          if (isDupBarDB) errors.push('Duplicate Barcode in catalog database');
        }

        const isValid = errors.length === 0;
        if (isValid) validCount++;
        else invalidCount++;

        return {
          rowNumber: idx + 2,
          name: row.name || '—',
          sku: row.sku || '—',
          barcode: row.barcode || '—',
          price: isNaN(price) ? 0 : price,
          cost: isNaN(cost) ? 0 : cost,
          stock: isNaN(stock) ? 0 : stock,
          minStock: isNaN(minStock) ? 5 : minStock,
          categoryId: parseInt(row.categoryId) || 0,
          description: row.description || '',
          brand: row.brand || '',
          isValid,
          errors
        };
      });

      setImportSummary({
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
        rows: validatedRows
      });
    };
    reader.readAsText(file);
  };

  const handleProceedImport = async () => {
    if (!importSummary || importSummary.valid === 0) return;

    const validRows = importSummary.rows.filter(r => r.isValid);
    let successCount = 0;

    for (const row of validRows) {
      try {
        await addProduct({
          name: row.name,
          sku: row.sku !== '—' ? row.sku : undefined,
          barcode: row.barcode !== '—' ? row.barcode : undefined,
          price: row.price,
          cost: row.cost,
          stock: row.stock,
          initialStock: row.stock,
          minStock: row.minStock,
          categoryId: row.categoryId,
          brand: row.brand || undefined,
          description: row.description || undefined,
          status: 'Active'
        });
        successCount++;
      } catch (err) {
        console.error(err);
      }
    }

    alert(`Successfully imported ${successCount} products into catalog!`);
    setShowImportModal(false);
    setImportSummary(null);
    setImportFileText('');
    useInventoryStore.getState().initializeFromDatabase();
  };

  const handleEditProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      nameUrdu: product.nameUrdu || '',
      barcode: product.barcode || '',
      sku: product.sku || '',
      brand: product.brand || '',
      categoryId: product.categoryId.toString(),
      supplierId: product.supplierId?.toString() || '',
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      description: product.description || '',
      image: product.image || '',
      status: product.status || 'Active',
      images: product.images || [],
      hasVariants: product.variants && product.variants.length > 0 || false,
      variants: product.variants || []
    });
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      nameUrdu: category.nameUrdu,
      description: category.description || ''
    });
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      nameUrdu: '',
      barcode: '',
      sku: '',
      brand: '',
      categoryId: '',
      supplierId: '',
      price: '',
      cost: '',
      stock: '',
      minStock: '',
      description: '',
      image: '',
      status: 'Active',
      images: [],
      hasVariants: false,
      variants: []
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      nameUrdu: '',
      description: ''
    });
  };

  // Dynamics Metrics & Intelligence calculations
  const analyticsData = useMemo(() => {
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    const potentialSalesValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const potentialGrossProfit = potentialSalesValue - totalInventoryValue;

    const totalCount = products.length;
    const activeCount = products.filter(p => p.status === 'Active').length;
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const discontinuedCount = products.filter(p => p.status === 'Discontinued').length;

    // Health Score calculation
    let healthRaw = 100;
    if (totalCount > 0) {
      const outRatio = outOfStockCount / totalCount;
      const lowRatio = lowStockCount / totalCount;
      const negativeCount = products.filter(p => p.stock < 0).length;
      const overstockCount = products.filter(p => p.stock > p.minStock * 5).length;
      const overRatio = overstockCount / totalCount;

      healthRaw -= outRatio * 35;
      healthRaw -= lowRatio * 20;
      healthRaw -= overRatio * 15;
      healthRaw -= (negativeCount > 0 ? 30 : 0);
    }
    const healthScore = Math.max(0, Math.min(100, Math.round(healthRaw)));

    // Fast & Slow moving products (Velocity calculation)
    const productSoldQty: Record<number, number> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const pId = item.product?.id || (item as any).productId;
        if (pId) {
          productSoldQty[pId] = (productSoldQty[pId] || 0) + item.quantity;
        }
      });
    });

    const productsWithVelocity = products.map(p => {
      const sold = productSoldQty[p.id] || 0;
      return {
        ...p,
        soldQty: sold,
        dailyVelocity: sold / 30
      };
    });

    const fastMoving = [...productsWithVelocity].filter(p => p.soldQty > 0).sort((a, b) => b.soldQty - a.soldQty).slice(0, 5);
    const slowMoving = [...productsWithVelocity].filter(p => p.soldQty > 0).sort((a, b) => a.soldQty - b.soldQty).slice(0, 5);
    
    // Dead stock: in stock (> 0) but zero sold in last 30 days
    const deadStock = productsWithVelocity.filter(p => p.stock > 0 && p.soldQty === 0).slice(0, 5);

    // Margins logic
    const productsWithProfit = products.map(p => {
      const absoluteMargin = p.price - p.cost;
      const percentageMargin = p.price > 0 ? (absoluteMargin / p.price) * 100 : 0;
      return { ...p, absoluteMargin, percentageMargin };
    });

    const highestProfit = [...productsWithProfit].sort((a, b) => b.percentageMargin - a.percentageMargin).slice(0, 3);
    const lowestProfit = [...productsWithProfit].sort((a, b) => a.percentageMargin - b.percentageMargin).slice(0, 3);

    // Best categories by revenue
    const categorySales: Record<number, number> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const pId = item.product?.id || (item as any).productId;
        const prod = products.find(p => p.id === pId);
        if (prod) {
          categorySales[prod.categoryId] = (categorySales[prod.categoryId] || 0) + item.subtotal;
        }
      });
    });

    const categoryDetails = categories.map(cat => ({
      name: cat.name,
      revenue: categorySales[cat.id] || 0
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 3);

    // Reorder lists
    const reorderRecommendations = productsWithVelocity.filter(p => p.stock <= p.minStock).map(p => {
      const daysLeft = p.dailyVelocity > 0 ? Math.round(p.stock / p.dailyVelocity) : Infinity;
      const suggestedQty = Math.max(5, (p.minStock * 3) - p.stock);
      const supplier = suppliers.find(s => s.id === p.supplierId);
      return {
        ...p,
        daysLeft,
        suggestedQty,
        supplierName: supplier ? supplier.name : 'Unassigned'
      };
    });

    // Central alerts array
    const alerts: { type: 'danger' | 'warning' | 'info'; title: string; desc: string; target: Product }[] = [];
    
    products.forEach(p => {
      if (p.stock === 0) {
        alerts.push({ type: 'danger', title: 'Out of Stock', desc: `${p.name} has run completely out.`, target: p });
      } else if (p.stock < 0) {
        alerts.push({ type: 'danger', title: 'Negative Stock', desc: `${p.name} has negative stock quantity (${p.stock}).`, target: p });
      } else if (p.stock <= p.minStock) {
        alerts.push({ type: 'warning', title: 'Low Stock Alert', desc: `${p.name} is below safety limit. (${p.stock}/${p.minStock})`, target: p });
      } else if (p.stock > p.minStock * 5) {
        alerts.push({ type: 'info', title: 'Overstocked', desc: `${p.name} contains excessive stock (${p.stock} u). Capital locked.`, target: p });
      }

      if (!p.image) {
        alerts.push({ type: 'info', title: 'Image Missing', desc: `${p.name} is missing a catalog photo.`, target: p });
      }
      if (!p.supplierId) {
        alerts.push({ type: 'info', title: 'No Supplier', desc: `${p.name} has no designated supplier assignment.`, target: p });
      }
    });

    // Check duplicate SKU/Barcode
    const skuRecords: Record<string, Product[]> = {};
    const barRecords: Record<string, Product[]> = {};
    products.forEach(p => {
      if (p.sku) {
        const key = p.sku.trim().toLowerCase();
        skuRecords[key] = skuRecords[key] || [];
        skuRecords[key].push(p);
      }
      if (p.barcode) {
        const key = p.barcode.trim().toLowerCase();
        barRecords[key] = barRecords[key] || [];
        barRecords[key].push(p);
      }
    });

    Object.keys(skuRecords).forEach(sku => {
      if (skuRecords[sku].length > 1) {
        skuRecords[sku].forEach(p => {
          alerts.push({ type: 'warning', title: 'Duplicate SKU', desc: `SKU "${p.sku}" is duplicated on multiple items.`, target: p });
        });
      }
    });

    Object.keys(barRecords).forEach(bar => {
      if (barRecords[bar].length > 1) {
        barRecords[bar].forEach(p => {
          alerts.push({ type: 'warning', title: 'Duplicate Barcode', desc: `Barcode "${p.barcode}" is shared by multiple products.`, target: p });
        });
      }
    });

    return {
      totalInventoryValue,
      potentialSalesValue,
      potentialGrossProfit,
      totalCount,
      activeCount,
      lowStockCount,
      outOfStockCount,
      discontinuedCount,
      healthScore,
      fastMoving,
      slowMoving,
      deadStock,
      highestProfit,
      lowestProfit,
      categoryDetails,
      reorderRecommendations,
      alerts
    };
  }, [products, categories, suppliers, sales]);

  // Report Export (PDF format styled popup print layouts)
  const handleExportPDF = (type: 'summary' | 'low_stock' | 'valuation' | 'dead_stock') => {
    let title = '';
    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === 'summary') {
      title = 'Inventory Summary Intelligence Report';
      headers = ['Metric Key Indicator', 'Statistical Count / Value'];
      rows = [
        ['Overall Product Catalog Size', `${analyticsData.totalCount} items`],
        ['Active Listing Products', `${analyticsData.activeCount} products`],
        ['Low Stock Warning Items', `${analyticsData.lowStockCount} items`],
        ['Out of Stock Items', `${analyticsData.outOfStockCount} items`],
        ['Discontinued Products', `${analyticsData.discontinuedCount} items`],
        ['Inventory Cost Valuation', `PKR ${analyticsData.totalInventoryValue.toLocaleString()}`],
        ['Potential Selling Value', `PKR ${analyticsData.potentialSalesValue.toLocaleString()}`],
        ['Estimated Gross Profit Pool', `PKR ${analyticsData.potentialGrossProfit.toLocaleString()}`],
        ['Inventory Health Score', `${analyticsData.healthScore} / 100`]
      ];
    } else if (type === 'low_stock') {
      title = 'Catalog Low Stock Procurement Report';
      headers = ['Product Name', 'SKU', 'Current Stock', 'Safety Limit', 'Suggested Reorder Qty', 'Supplier'];
      rows = analyticsData.reorderRecommendations.map(r => [
        r.name,
        r.sku || '—',
        r.stock.toString(),
        r.minStock.toString(),
        r.suggestedQty.toString(),
        r.supplierName
      ]);
    } else if (type === 'valuation') {
      title = 'Inventory Capital Valuation Audit Report';
      headers = ['Product Name', 'SKU', 'Available Stock', 'Unit Cost', 'Unit Retail Price', 'Asset Cost Value', 'Potential Retail Value'];
      rows = products.map(p => [
        p.name,
        p.sku || '—',
        p.stock.toString(),
        `PKR ${p.cost.toFixed(2)}`,
        `PKR ${p.price.toFixed(2)}`,
        `PKR ${(p.stock * p.cost).toFixed(2)}`,
        `PKR ${(p.stock * p.price).toFixed(2)}`
      ]);
    } else if (type === 'dead_stock') {
      title = 'Dead & Slow Stock Identification Report';
      headers = ['Product Name', 'SKU', 'Current Stock', 'Cost Value', 'Retail Value', 'Days Since Last Sale'];
      rows = analyticsData.deadStock.map(p => [
        p.name,
        p.sku || '—',
        p.stock.toString(),
        `PKR ${(p.stock * p.cost).toFixed(2)}`,
        `PKR ${(p.stock * p.price).toFixed(2)}`,
        '30+ days (No recent sales)'
      ]);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlRows = rows.map(r => `
      <tr>
        ${r.map(cell => `<td style="padding: 8px; border: 1px solid #ddd;">${cell}</td>`).join('')}
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 30px; color: #333; }
            h1 { text-align: center; font-size: 20px; color: #1e3a8a; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { padding: 10px; background-color: #f3f4f6; border: 1px solid #ddd; text-align: left; }
            .meta { text-align: right; font-size: 10px; color: #666; margin-bottom: 10px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="meta">Generated: ${new Date().toLocaleString()} | Counter Pro Ledger</div>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const computedStats = useMemo(() => {
    if (!selectedDetailProduct) return null;
    const p = selectedDetailProduct;

    const productSales = sales.filter(s => s.items.some(i => (i.product?.id || (i as any).productId) === p.id));
    const totalSoldUnits = productSales.reduce((sum, s) => {
      const it = s.items.find(i => (i.product?.id || (i as any).productId) === p.id);
      return sum + (it ? it.quantity : 0);
    }, 0);
    const totalRevenue = productSales.reduce((sum, s) => {
      const it = s.items.find(i => (i.product?.id || (i as any).productId) === p.id);
      return sum + (it ? it.subtotal : 0);
    }, 0);
    const grossProfit = totalRevenue - (totalSoldUnits * p.cost);
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const totalPurchasedUnits = detailPurchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
    const totalPurchaseCost = detailPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const lastPurchaseDate = detailPurchases.length > 0 ? detailPurchases[0].createdAt : null;

    return {
      totalSoldUnits,
      totalRevenue,
      grossProfit,
      margin,
      totalPurchasedUnits,
      totalPurchaseCost,
      lastPurchaseDate
    };
  }, [selectedDetailProduct, sales, detailPurchases]);

  return (
    <div className="space-y-6 relative pb-20">
      {/* Standardized Page Header */}
      <PageHeader
        title="Inventory & Analytics Hub"
        subtitle="Conduct stock adjustments, multi-item supplier purchases, audit histories, and intelligent analytics metrics."
        icon={Package}
        breadcrumbs={[
          { label: 'Home', onClick: () => window.location.hash = '#/' },
          { label: 'Inventory' }
        ]}
        actions={[
          ...(activeTab === 'products' ? [
            {
              label: `Saved Presets (${savedPresets.length})`,
              onClick: () => setShowPresetModal(true),
              icon: Bookmark,
              variant: 'secondary' as const
            },
            {
              label: 'Import CSV',
              onClick: () => setShowImportModal(true),
              icon: Upload,
              variant: 'secondary' as const
            },
            {
              label: 'Export Catalog',
              onClick: () => handleBulkExport(),
              icon: Download,
              variant: 'secondary' as const
            }
          ] : []),
          ...(activeTab === 'adjustments' ? [
            {
              label: 'Create Adjustment',
              onClick: () => {
                setAdjustmentForm({ productId: '', quantity: '', adjustmentType: 'Stock In', reason: '', notes: '' });
                setShowAdjustmentModal(true);
              },
              icon: Plus,
              variant: 'primary' as const
            }
          ] : []),
          ...(activeTab === 'purchases' ? [
            {
              label: 'New Purchase Entry',
              onClick: () => {
                setPurchaseForm({ supplierId: '', purchaseDate: new Date().toISOString().split('T')[0], invoiceNumber: '', notes: '', taxes: '0', discounts: '0', items: [] });
                setShowPurchaseModal(true);
              },
              icon: Plus,
              variant: 'primary' as const
            }
          ] : []),
          {
            label: 'Add Category',
            onClick: () => {
              resetCategoryForm();
              setEditingCategory(null);
              setShowCategoryModal(true);
            },
            icon: Tags,
            variant: 'secondary' as const
          },
          {
            label: 'Add Product',
            onClick: () => {
              resetProductForm();
              setEditingProduct(null);
              setShowProductModal(true);
            },
            icon: Plus,
            variant: 'primary' as const
          }
        ]}
      />

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap gap-2 bg-gray-105 dark:bg-gray-800/80 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'analytics' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Intelligence Dashboard
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'products' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-650 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Catalog Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'categories' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-650 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'adjustments' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-650 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Stock Adjustments
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'purchases' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-650 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Purchase Entries
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'movements' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-655 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Movement Ledger
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'audit' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-655 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Audit History
        </button>
        <button
          onClick={() => setActiveTab('barcodes')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'barcodes' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-655 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Barcode Generator
        </button>
      </div>

      {/* INTELLIGENCE & ANALYTICS TAB CONTENT */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Level Metric KPIs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Capital Valuation (Cost)</span>
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1 block">
                  PKR {analyticsData.totalInventoryValue.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-1 bg-gray-55 dark:bg-gray-900 p-1.5 rounded-lg w-fit">
                <Info className="h-3 w-3 inline text-blue-500" />
                <span>Combined value of catalog inventory cost</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Potential Retail Value</span>
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1 block">
                  PKR {analyticsData.potentialSalesValue.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-1 bg-gray-55 dark:bg-gray-900 p-1.5 rounded-lg w-fit">
                <Info className="h-3 w-3 inline text-blue-500" />
                <span>Value at current catalog retail price</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Potential Gross Profit</span>
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
                  PKR {analyticsData.potentialGrossProfit.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] text-blue-605 font-bold flex items-center gap-1 bg-blue-50/50 dark:bg-blue-900/10 p-1.5 rounded-lg w-fit">
                <TrendingUp className="h-3 w-3 inline text-blue-500" />
                <span>Projected gross margins: {analyticsData.potentialSalesValue > 0 ? ((analyticsData.potentialGrossProfit / analyticsData.potentialSalesValue) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>

            {/* Health Score visuals */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Catalog Health Rating</span>
                <span className={`text-xl font-extrabold ${
                  analyticsData.healthScore >= 80 ? 'text-emerald-600' :
                  analyticsData.healthScore >= 50 ? 'text-amber-500' : 'text-rose-650'
                }`}>
                  {analyticsData.healthScore >= 80 ? 'Excellent' :
                   analyticsData.healthScore >= 50 ? 'Fair Stocking' : 'Critical Action'}
                </span>
                <p className="text-[10px] text-gray-405 leading-tight">Safety status scored against low, out, and overstocked items.</p>
              </div>

              {/* Progress ring */}
              <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-105 dark:text-gray-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${
                      analyticsData.healthScore >= 80 ? 'text-emerald-600' :
                      analyticsData.healthScore >= 50 ? 'text-amber-500' : 'text-rose-650'
                    }`}
                    strokeWidth="3.5"
                    strokeDasharray={`${analyticsData.healthScore}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white">{analyticsData.healthScore}%</span>
              </div>
            </div>
          </div>

          {/* Quick recommendations sidebar & Alert ticker */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recommendations & Advice box */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <h3 className="font-bold text-gray-905 dark:text-white text-base flex items-center gap-2">
                <Heart className="h-5 w-5 text-emerald-500" />
                Strategic Recommendations
              </h3>

              <div className="space-y-3.5">
                {analyticsData.outOfStockCount > 0 && (
                  <div className="flex items-start gap-3 bg-red-50/40 dark:bg-red-950/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-xs">Out of Stock Losses</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                        {analyticsData.outOfStockCount} products are completely out. Restock quickly to prevent customer turnaways.
                      </p>
                    </div>
                  </div>
                )}

                {analyticsData.lowStockCount > 0 && (
                  <div className="flex items-start gap-3 bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-xs">Low Stock Threshold Warnings</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                        {analyticsData.lowStockCount} products are below safety limits. Formulate procurement orders on the Reorder section.
                      </p>
                    </div>
                  </div>
                )}

                {analyticsData.deadStock.length > 0 && (
                  <div className="flex items-start gap-3 bg-blue-50/40 dark:bg-blue-955/10 p-3 rounded-xl border border-blue-105 dark:border-blue-900/20">
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-xs">Dead Stock Warnings</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                        Items like <span className="font-semibold">{analyticsData.deadStock[0]?.name}</span> have seen zero sales for 30+ days. Consider running discounts or bundled sales.
                      </p>
                    </div>
                  </div>
                )}

                {analyticsData.lowStockCount === 0 && analyticsData.outOfStockCount === 0 && (
                  <div className="p-8 text-center text-gray-450 italic bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100 dark:border-emerald-900/20 rounded-xl space-y-1">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">Stocking levels are perfectly healthy!</p>
                    <p className="text-xs text-gray-500">Zero low stock or out-of-stock items identified in current catalog.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Alerts Feed Widget */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <h3 className="font-bold text-gray-905 dark:text-white text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  Alert Monitor Feed
                </span>
                <span className="h-5 px-2 bg-blue-50 dark:bg-blue-900/30 rounded text-[10px] text-blue-600 font-bold flex items-center">
                  {analyticsData.alerts.length} Warnings
                </span>
              </h3>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {analyticsData.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleOpenDetail(alert.target)}
                    className="p-2.5 bg-gray-55/70 dark:bg-gray-900/30 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer rounded-xl border border-gray-200 dark:border-gray-750 flex justify-between items-center transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider block ${
                        alert.type === 'danger' ? 'text-red-600' :
                        alert.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                      }`}>
                        {alert.title}
                      </span>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 truncate">{alert.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                  </div>
                ))}

                {analyticsData.alerts.length === 0 && (
                  <div className="text-center py-10 text-xs text-gray-400">Zero critical alerts on monitoring feed.</div>
                )}
              </div>
            </div>
          </div>

          {/* Intelligence Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Top Categories */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-bold text-gray-905 dark:text-white text-sm uppercase tracking-wider text-gray-400">Top Categories (Revenue)</h3>
              <div className="space-y-3">
                {analyticsData.categoryDetails.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                      <span className="text-gray-900 dark:text-white">PKR {cat.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${
                            analyticsData.categoryDetails[0].revenue > 0
                              ? (cat.revenue / analyticsData.categoryDetails[0].revenue) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>
                ))}
                {analyticsData.categoryDetails.length === 0 && (
                  <div className="text-center py-6 text-xs text-gray-400">No category sales metrics.</div>
                )}
              </div>
            </div>

            {/* Fast Moving Products */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-bold text-gray-905 dark:text-white text-sm uppercase tracking-wider text-gray-400">Fast Moving Items</h3>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
                {analyticsData.fastMoving.map((p, idx) => (
                  <div key={p.id} className="py-2 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{p.name}</div>
                      <div className="text-[10px] text-gray-400">Stock left: {p.stock} u</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-600">{p.soldQty} sold</div>
                      <div className="text-[9px] text-gray-400">({p.dailyVelocity.toFixed(1)}/day)</div>
                    </div>
                  </div>
                ))}
                {analyticsData.fastMoving.length === 0 && (
                  <div className="text-center py-6 text-xs text-gray-400">No sales transactions available.</div>
                )}
              </div>
            </div>

            {/* Profit Margin Leaders */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-bold text-gray-950 dark:text-white text-sm uppercase tracking-wider text-gray-400">Highest Profit Margin</h3>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
                {analyticsData.highestProfit.map((p) => (
                  <div key={p.id} className="py-2.5 flex justify-between items-center">
                    <div className="truncate max-w-[130px] font-bold text-gray-900 dark:text-white">{p.name}</div>
                    <div className="text-right">
                      <div className="font-extrabold text-blue-650">{p.percentageMargin.toFixed(1)}% margin</div>
                      <div className="text-[10px] text-gray-400">Cost: {p.cost} | Sell: {p.price}</div>
                    </div>
                  </div>
                ))}
                {analyticsData.highestProfit.length === 0 && (
                  <div className="text-center py-6 text-xs text-gray-400">Add products to verify profit metrics.</div>
                )}
              </div>
            </div>

            {/* Slow Moving & Dead stock */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
              <h3 className="font-bold text-gray-950 dark:text-white text-sm uppercase tracking-wider text-gray-400">Dead Stock List</h3>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
                {analyticsData.deadStock.map((p) => (
                  <div key={p.id} className="py-2.5 flex justify-between items-center">
                    <div className="truncate max-w-[150px] font-bold text-gray-900 dark:text-white">{p.name}</div>
                    <div className="text-right">
                      <div className="font-extrabold text-gray-700 dark:text-gray-300">{p.stock} units static</div>
                      <div className="text-[10px] text-gray-400">Locked: PKR {p.stock * p.cost}</div>
                    </div>
                  </div>
                ))}
                {analyticsData.deadStock.length === 0 && (
                  <div className="text-center py-6 text-xs text-gray-400">No dead stock items identified.</div>
                )}
              </div>
            </div>
          </div>

          {/* Reorder Intelligence Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="font-bold text-gray-905 dark:text-white text-base flex items-center gap-2">
              <BarChart4 className="h-5 w-5 text-blue-500" />
              Reorder Intelligence recommendations
            </h3>

            <div className="overflow-x-auto text-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-55 dark:bg-gray-900/60 border-b text-xs uppercase tracking-wider text-gray-450 font-bold">
                  <tr>
                    <th className="p-3">Product Item</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Stock level</th>
                    <th className="p-3">Sales velocity</th>
                    <th className="p-3">Days Left</th>
                    <th className="p-3">Suggested Reorder Qty</th>
                    <th className="p-3">Assigned Supplier</th>
                    <th className="p-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-750">
                  {analyticsData.reorderRecommendations.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-55 dark:hover:bg-gray-750">
                      <td className="p-3 font-semibold text-gray-900 dark:text-white">{rec.name}</td>
                      <td className="p-3 font-mono text-xs">{rec.sku || '—'}</td>
                      <td className="p-3 text-rose-500 font-bold">{rec.stock} / {rec.minStock} u</td>
                      <td className="p-3 text-xs">{rec.dailyVelocity.toFixed(2)} units/day</td>
                      <td className="p-3 text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.daysLeft === Infinity ? 'bg-gray-100 text-gray-600' :
                          rec.daysLeft <= 7 ? 'bg-red-50 text-red-750 font-extrabold' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {rec.daysLeft === Infinity ? 'No recent sales' : `${rec.daysLeft} days left`}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-gray-900 dark:text-white">{rec.suggestedQty} u</td>
                      <td className="p-3 text-xs">{rec.supplierName}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const supplier = suppliers.find(s => s.name === rec.supplierName);
                            setPurchaseForm({
                              supplierId: supplier ? supplier.id.toString() : '',
                              purchaseDate: new Date().toISOString().split('T')[0],
                              invoiceNumber: `RE-${rec.id.substring(0, 4)}`,
                              notes: `Automatic reorder suggestion for ${rec.name}`,
                              taxes: '0',
                              discounts: '0',
                              items: [{
                                productId: rec.id,
                                productName: rec.name,
                                costPrice: rec.cost,
                                quantity: rec.suggestedQty,
                                subtotal: rec.cost * rec.suggestedQty
                              }]
                            });
                            setShowPurchaseModal(true);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-[10px] font-bold rounded"
                        >
                          Quick Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                  {analyticsData.reorderRecommendations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400 italic">No products require restocking currently. All levels above limit.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export & Reporting Matrix */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="font-bold text-gray-905 dark:text-white text-base">Export &amp; Analytics Reports Matrix</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-xl bg-gray-55/50 dark:bg-gray-900/30 space-y-3">
                <h4 className="font-bold text-xs">Low Stock Procurement Report</h4>
                <p className="text-[10px] text-gray-450 leading-snug">Generate a detailed summary of safety thresholds and suggested quantities.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportPDF('low_stock')}
                    className="flex-1 py-1.5 bg-blue-650 hover:bg-blue-750 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <Printer className="h-3 w-3" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border rounded-xl bg-gray-55/50 dark:bg-gray-900/30 space-y-3">
                <h4 className="font-bold text-xs">Inventory Valuation Report</h4>
                <p className="text-[10px] text-gray-450 leading-snug">Examine active listing pricing, cost structures, and capitalized assets.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportPDF('valuation')}
                    className="flex-1 py-1.5 bg-blue-650 hover:bg-blue-750 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <Printer className="h-3 w-3" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border rounded-xl bg-gray-55/50 dark:bg-gray-900/30 space-y-3">
                <h4 className="font-bold text-xs">Dead Stock Audit Report</h4>
                <p className="text-[10px] text-gray-450 leading-snug">List catalog items with stagnant capital and zero sales for 30+ days.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportPDF('dead_stock')}
                    className="flex-1 py-1.5 bg-blue-650 hover:bg-blue-750 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <Printer className="h-3 w-3" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border rounded-xl bg-gray-55/50 dark:bg-gray-900/30 space-y-3">
                <h4 className="font-bold text-xs">Inventory Summary Report</h4>
                <p className="text-[10px] text-gray-450 leading-snug">Capture high-level performance KPIs and health ratings sheet.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportPDF('summary')}
                    className="flex-1 py-1.5 bg-blue-650 hover:bg-blue-750 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <Printer className="h-3 w-3" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB CONTENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Quick Filters Row */}
          <div className="flex flex-wrap gap-2.5 items-center">
            <span className="text-xs text-gray-450 font-bold uppercase tracking-wider mr-2">Quick Filters:</span>
            <button
              onClick={() => setQuickFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                quickFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Catalog
            </button>
            <button
              onClick={() => setQuickFilter('out_of_stock')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                quickFilter === 'out_of_stock' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Out of Stock
            </button>
            <button
              onClick={() => setQuickFilter('low_stock')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                quickFilter === 'low_stock' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setQuickFilter('overstocked')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                quickFilter === 'overstocked' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Overstocked
            </button>
            <button
              onClick={() => setQuickFilter('duplicate_sku')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                quickFilter === 'duplicate_sku' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white border-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Duplicate SKU
            </button>
            <button
              onClick={() => setQuickFilter('missing_image')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                quickFilter === 'missing_image' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Missing Image
            </button>
            <button
              onClick={() => setQuickFilter('missing_supplier')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                quickFilter === 'missing_supplier' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              No Supplier
            </button>
          </div>

          {/* Advanced Search & Filtering Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search catalog by name, barcode, brand, category, supplier, SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-650 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
                    showAdvancedFilters
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-655 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Advanced Filters</span>
                </button>

                <div className="bg-gray-105 dark:bg-gray-700 rounded-xl p-1 flex items-center border border-gray-200 dark:border-gray-650">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-450 hover:text-gray-855'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-450 hover:text-gray-855'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filters Expandable Content */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-slide-down">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Brand
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Brands</option>
                    {brandsList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Supplier
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Product Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Stock Level Status
                  </label>
                  <select
                    value={selectedStockStatus}
                    onChange={(e) => setSelectedStockStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Levels</option>
                    <option value="in_stock">In Stock (&gt; Min)</option>
                    <option value="low_stock">Low Stock (&le; Min)</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Selling Price Range
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Min Price"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-655 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-gray-450">&mdash;</span>
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-655 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={() => setShowPresetModal(true)}
                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all border border-blue-200"
                  >
                    Save Preset
                  </button>
                  <button
                    onClick={resetFilters}
                    className="flex-1 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 border border-gray-300 rounded-lg text-xs font-bold transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* List View / Data Table */}
          {viewMode === 'list' ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto relative max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-20 backdrop-blur-sm">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={paginatedProducts.length > 0 && selectedProductIds.length === paginatedProducts.length}
                          onChange={handleSelectAll}
                          className="rounded text-blue-600 border-gray-300 focus:ring-blue-500 h-4 w-4"
                        />
                      </th>
                      <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                        Image
                      </th>
                      <th
                        onClick={() => handleSort('name')}
                        className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none w-56"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Product Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('sku')}
                        className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>SKU</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Barcode
                      </th>
                      <th
                        onClick={() => handleSort('categoryName')}
                        className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-655 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Category</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Brand
                      </th>
                      <th
                        onClick={() => handleSort('supplierName')}
                        className="p-4 text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Supplier</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('cost')}
                        className="p-4 text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Cost Price</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('price')}
                        className="p-4 text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Selling Price</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('stock')}
                        className="p-4 text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Stock Level</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="p-4 text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider w-36">
                        Status
                      </th>
                      <th className="p-4 text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider w-36">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedProducts.map((product) => {
                      const category = categories.find(c => c.id === product.categoryId);
                      const supplier = suppliers.find(s => s.id === product.supplierId);
                      const status = getProductStatus(product);
                      const isSelected = selectedProductIds.includes(product.id);

                      return (
                        <tr
                          key={product.id}
                          className={`hover:bg-gray-55 dark:hover:bg-gray-700/50 transition-colors ${
                            isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectProduct(product.id)}
                              className="rounded text-blue-600 border-gray-300 focus:ring-blue-500 h-4 w-4"
                            />
                          </td>
                          <td className="p-4">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                                onClick={() => handleOpenDetail(product)}
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4VjE2TTggMTJIMTZNMjEgMTJBOSA5IDAgMTEzIDEyQTkgOSAwIDAxMjEgMTJaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                                }}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer text-gray-400"
                                onClick={() => handleOpenDetail(product)}
                              >
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-gray-905 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => handleOpenDetail(product)}>
                              {product.name}
                            </div>
                            {product.nameUrdu && (
                              <div className="text-xs text-gray-550 dark:text-gray-450 font-urdu mt-0.5" dir="rtl">
                                {product.nameUrdu}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-sm text-gray-655 dark:text-gray-305 font-mono">
                            {product.sku || '—'}
                          </td>
                          <td className="p-4 text-sm text-gray-655 dark:text-gray-305 font-mono">
                            {product.barcode || '—'}
                          </td>
                          <td className="p-4 text-sm text-gray-900 dark:text-white">
                            {category?.name || '—'}
                          </td>
                          <td className="p-4 text-sm text-gray-600 dark:text-gray-305">
                            {product.brand || '—'}
                          </td>
                          <td className="p-4 text-sm text-gray-605 dark:text-gray-305">
                            {supplier?.name || '—'}
                          </td>
                          <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">
                            PKR {product.cost.toFixed(2)}
                          </td>
                          <td className="p-4 text-sm font-semibold text-gray-900 dark:text-white">
                            PKR {product.price.toFixed(2)}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${
                                product.stock === 0
                                  ? 'text-red-650'
                                  : product.stock <= product.minStock
                                  ? 'text-amber-550'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {product.stock} units
                              </span>
                              <span className="text-[10px] text-gray-400">Min: {product.minStock}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${status.className}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleOpenDetail(product)}
                              className="p-1.5 text-gray-605 dark:text-gray-405 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-705 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1.5 text-gray-605 dark:text-gray-450 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-705 transition-colors"
                              title="Edit Product"
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this product?')) {
                                  deleteProduct(product.id);
                                }
                              }}
                              className="p-1.5 text-gray-655 dark:text-gray-455 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-705 transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map(product => {
                const category = categories.find(c => c.id === product.categoryId);
                const supplier = suppliers.find(s => s.id === product.supplierId);
                const status = getProductStatus(product);
                const isSelected = selectedProductIds.includes(product.id);

                return (
                  <div
                    key={product.id}
                    className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all overflow-hidden flex flex-col group relative ${
                      isSelected
                        ? 'border-blue-500 shadow-md ring-1 ring-blue-500'
                        : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                    }`}
                  >
                    <div className="absolute top-3.5 left-3.5 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectProduct(product.id)}
                        className="rounded text-blue-600 border-gray-300 focus:ring-blue-500 h-4.5 w-4.5 shadow"
                      />
                    </div>

                    <div className="relative pt-[65%] w-full bg-gray-55 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700/60 cursor-pointer" onClick={() => handleOpenDetail(product)}>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA4VjE2TTggMTJIMTZNMjEgMTJBOSA5IDAgMTEzIDEyQTkgOSAwIDAxMjEgMTJaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-350 dark:text-gray-650">
                          <Package className="h-16 w-16" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow ${status.className}`}>
                          {status.text}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1 uppercase tracking-wider">
                          {category?.name || 'Uncategorized'}
                        </div>
                        <h3 className="font-bold text-gray-905 dark:text-white text-base line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer" onClick={() => handleOpenDetail(product)}>
                          {product.name}
                        </h3>
                        {product.nameUrdu && (
                          <p className="text-sm text-gray-500 font-urdu mt-0.5 line-clamp-1" dir="rtl">{product.nameUrdu}</p>
                        )}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2.5 text-xs text-gray-505">
                          <div>SKU: <span className="font-mono text-gray-700 dark:text-gray-305 font-medium">{product.sku || '—'}</span></div>
                          <div>Brand: <span className="text-gray-700 dark:text-gray-305 font-medium">{product.brand || '—'}</span></div>
                          <div className="col-span-2 mt-1 line-clamp-1">Supplier: <span className="text-gray-700 dark:text-gray-305 font-medium">{supplier?.name || '—'}</span></div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-xs text-gray-400">Price</span>
                          <span className="text-lg font-bold text-gray-905 dark:text-white">PKR {product.price.toFixed(2)}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-gray-450 font-bold">Stock Status</span>
                            <span className={product.stock === 0 ? 'text-red-500' : product.stock <= product.minStock ? 'text-amber-505' : 'text-emerald-500'}>
                              {product.stock} units left
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                product.stock === 0
                                  ? 'bg-red-500'
                                  : product.stock <= product.minStock
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, (product.stock / Math.max(1, product.minStock * 2)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700/60 flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleOpenDetail(product)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-1.5 text-gray-605 dark:text-gray-405 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this product?')) {
                            deleteProduct(product.id);
                          }
                        }}
                        className="p-1.5 text-gray-655 dark:text-gray-455 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CATEGORIES TAB CONTENT */}
      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Products Contained</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((category) => {
                  const productCount = products.filter(p => p.categoryId === category.id).length;
                  return (
                    <tr key={category.id} className="hover:bg-gray-55 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-gray-905 dark:text-white">{category.name}</div>
                        {category.nameUrdu && <div className="text-xs text-gray-500 font-urdu" dir="rtl">{category.nameUrdu}</div>}
                      </td>
                      <td className="p-4 text-sm text-gray-655 dark:text-gray-305">{category.description || 'No description provided'}</td>
                      <td className="p-4 text-sm font-semibold text-gray-905 dark:text-white">{productCount} products</td>
                      <td className="p-4 text-sm font-medium space-x-2">
                        <button onClick={() => handleEditCategory(category)} className="text-amber-600 hover:text-amber-805">Edit</button>
                        <button
                          onClick={() => {
                            if (productCount > 0) {
                              alert('Cannot delete category containing active products.');
                              return;
                            }
                            if (window.confirm('Delete this category?')) deleteCategory(category.id.toString());
                          }}
                          className={`text-red-650 hover:text-red-800 ${productCount > 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                          disabled={productCount > 0}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENTS TAB */}
      {activeTab === 'adjustments' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date &amp; Time</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Name</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Adjustment Type</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-gray-55 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 text-gray-500 dark:text-gray-405">{new Date(adj.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">{adj.productName}</td>
                    <td className="p-4 font-bold">
                      <span className={adj.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {adj.quantity >= 0 ? `+${adj.quantity}` : adj.quantity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                        ['Stock In', 'Returned'].includes(adj.adjustmentType) ? 'bg-green-50 text-green-700 dark:bg-green-950/20' : 'bg-red-50 text-red-700 dark:bg-red-950/20'
                      }`}>
                        {adj.adjustmentType}
                      </span>
                    </td>
                    <td className="p-4 text-gray-655 dark:text-gray-305">
                      <div>{adj.reason}</div>
                      {adj.notes && <div className="text-xs text-gray-400 italic mt-0.5">{adj.notes}</div>}
                    </td>
                    <td className="p-4 text-gray-505 dark:text-gray-405 font-mono">{adj.user || 'Admin'}</td>
                  </tr>
                ))}
                {adjustments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-450">
                      No stock adjustments have been recorded. Click "Create Adjustment" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PURCHASE ENTRIES TAB */}
      {activeTab === 'purchases' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="p-4 text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider">Procurement Date</th>
                  <th className="p-4 text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider">Invoice Number</th>
                  <th className="p-4 text-xs font-semibold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                  <th className="p-4 text-xs font-semibold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Taxes / Discounts</th>
                  <th className="p-4 text-xs font-semibold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Total Amount</th>
                  <th className="p-4 text-xs font-semibold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Items Procured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-250 dark:divide-gray-700 text-sm">
                {purchaseEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-55 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{entry.purchaseDate}</td>
                    <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{entry.invoiceNumber || `PE-${entry.id}`}</td>
                    <td className="p-4 text-gray-900 dark:text-white">{entry.supplierName}</td>
                    <td className="p-4 text-xs text-gray-500 space-y-0.5">
                      <div>Taxes: PKR {entry.taxes.toFixed(2)}</div>
                      <div>Disc: PKR {entry.discounts.toFixed(2)}</div>
                    </td>
                    <td className="p-4 font-bold text-gray-905 dark:text-white">PKR {entry.totalAmount.toFixed(2)}</td>
                    <td className="p-4 text-xs">
                      <ul className="list-disc list-inside space-y-1">
                        {entry.items?.map((item, idx) => (
                          <li key={idx} className="text-gray-655 dark:text-gray-350">
                            {item.productName} (x{item.quantity}) &mdash; PKR {item.costPrice.toFixed(2)}/u
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
                {purchaseEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-450">
                      No purchase entries recorded. Click "New Purchase Entry" to begin restocking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOVEMENT LEDGER TAB */}
      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date &amp; Time</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Product Name</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action Type</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty Before</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty Changed</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty After</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reference</th>
                  <th className="p-4 text-xs font-semibold text-gray-505 dark:text-gray-400 uppercase tracking-wider">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-55 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 text-xs text-gray-400">{new Date(m.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-semibold text-gray-905 dark:text-white">{m.productName}</td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">{m.actionType}</td>
                    <td className="p-4 text-gray-505">{m.qtyBefore}</td>
                    <td className={`p-4 font-bold ${m.qtyChanged >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {m.qtyChanged >= 0 ? `+${m.qtyChanged}` : m.qtyChanged}
                    </td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{m.qtyAfter}</td>
                    <td className="p-4 font-mono text-xs text-blue-600 dark:text-blue-450">{m.reference || '—'}</td>
                    <td className="p-4 font-mono text-xs text-gray-405">{m.user || 'Admin'}</td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-450">
                      No stock movements recorded yet. Products will populate movements dynamically.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date &amp; Time</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Action</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reference Code</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Audit Description</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-250 dark:divide-gray-700 text-sm">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-55 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 text-xs text-gray-450">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">
                      <span className={`px-2.5 py-0.5 rounded text-xs ${
                        log.action.includes('Created') || log.action.includes('Added') ? 'bg-green-55 text-green-800 dark:bg-green-950/20' :
                        log.action.includes('Deleted') ? 'bg-red-55 text-red-800 dark:bg-red-950/20' : 'bg-blue-55 text-blue-800 dark:bg-blue-950/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-blue-650 dark:text-blue-450">{log.reference || '—'}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{log.description}</td>
                    <td className="p-4 font-mono text-xs text-gray-400">{log.user || 'Admin'}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-450">
                      Audit history timeline is currently empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BARCODE GENERATOR TAB */}
      {activeTab === 'barcodes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Controls Box */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4 h-fit">
            <h3 className="font-bold text-gray-950 dark:text-white text-base">Configure Labels Sizing</h3>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Product *</label>
                <select
                  value={barcodeConfig.productId}
                  onChange={(e) => setBarcodeConfig({ ...barcodeConfig, productId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-750 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                >
                  <option value="">Choose Catalog Item</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Number of copies</label>
                <input
                  type="number"
                  value={barcodeConfig.copies}
                  onChange={(e) => setBarcodeConfig({ ...barcodeConfig, copies: e.target.value })}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-755 text-gray-905 dark:text-white outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Label layout Dimensions</label>
                <select
                  value={barcodeConfig.size}
                  onChange={(e) => setBarcodeConfig({ ...barcodeConfig, size: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none text-sm font-medium"
                >
                  <option value="50x25">50mm x 25mm (Standard Sticker)</option>
                  <option value="38x25">38mm x 25mm (Small Jewelry)</option>
                  <option value="60x30">60mm x 30mm (Large Box)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t dark:border-gray-700">
                <label className="flex items-center space-x-2.5 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={barcodeConfig.showName}
                    onChange={(e) => setBarcodeConfig({ ...barcodeConfig, showName: e.target.checked })}
                    className="rounded text-blue-600 border-gray-305 focus:ring-blue-505 h-4.5 w-4.5"
                  />
                  <span>Show Product Name</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={barcodeConfig.showPrice}
                    onChange={(e) => setBarcodeConfig({ ...barcodeConfig, showPrice: e.target.checked })}
                    className="rounded text-blue-600 border-gray-305 focus:ring-blue-505 h-4.5 w-4.5"
                  />
                  <span>Show Retail Price</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={barcodeConfig.showNumber}
                    onChange={(e) => setBarcodeConfig({ ...barcodeConfig, showNumber: e.target.checked })}
                    className="rounded text-blue-600 border-gray-305 focus:ring-blue-505 h-4.5 w-4.5"
                  />
                  <span>Show Barcode Value</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handlePrintBarcodes}
                disabled={!barcodeConfig.productId}
                className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="h-4.5 w-4.5" />
                <span>Trigger Printing</span>
              </button>
            </div>
          </div>

          {/* Barcode Output Preview Area */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 border rounded-2xl p-5 border-gray-200 dark:border-gray-700 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-955 dark:text-white text-base mb-4">Labels Print Preview Matrix</h3>
              
              {barcodeConfig.productId ? (
                <div
                  ref={printAreaRef}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 border rounded-xl border-dashed border-gray-250 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 max-h-[400px] overflow-y-auto"
                >
                  {Array.from({ length: parseInt(barcodeConfig.copies) || 1 }).map((_, idx) => {
                    const prod = products.find(p => p.id === parseInt(barcodeConfig.productId));
                    if (!prod) return null;
                    return (
                      <div
                        key={idx}
                        className={`bg-white text-black p-3 rounded border text-center font-sans shadow-xs ${
                          barcodeConfig.size === '38x25' ? 'h-[95px] max-w-[130px] text-[10px]' :
                          barcodeConfig.size === '60x30' ? 'h-[130px] text-xs' : 'h-[110px] text-[11px]'
                        }`}
                      >
                        {barcodeConfig.showName && (
                          <div className="font-bold text-gray-900 truncate mb-0.5">{prod.name}</div>
                        )}
                        {barcodeConfig.showPrice && (
                          <div className="font-extrabold text-[12px] mb-1">PKR {prod.price.toFixed(2)}</div>
                        )}
                        <div className="my-1.5 h-9">{renderBarcodeSVG(prod.barcode || prod.id.toString())}</div>
                        {barcodeConfig.showNumber && (
                          <div className="text-[9px] text-gray-600 font-mono mt-1 select-none">{prod.barcode || prod.id}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-60 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-1.5 bg-gray-50 dark:bg-gray-900/30">
                  <Printer className="h-8 w-8 text-gray-300" />
                  <span className="text-xs">Configure configuration parameters on the left to review printable barcode sheets.</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-gray-450 italic mt-4 flex items-center gap-1">
              <Info className="h-3 w-3 inline text-blue-500" />
              <span>Standard Code39 layout generates vector scannable tags compatible with optical/laser barcode readers.</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Glassmorphic Bulk Action Toolbar */}
      {activeTab === 'products' && selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-gray-250 dark:border-gray-700 z-40 flex flex-wrap items-center gap-4 animate-slide-up max-w-[90%] lg:max-w-[70%]">
          <div className="flex items-center space-x-2 text-sm font-bold text-gray-955 dark:text-white">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
              {selectedProductIds.length}
            </span>
            <span>selected</span>
          </div>

          <div className="h-5 w-px bg-gray-205 dark:bg-gray-700 hidden sm:block" />

          {/* Action Choice Group */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={bulkActionType}
              onChange={(e) => setBulkActionType(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-805 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Choose Bulk Action</option>
              <option value="category">Change Category</option>
              <option value="price">Update Selling Price / Cost</option>
              <option value="status">Change Product Status</option>
              <option value="delete">Delete Selected</option>
            </select>

            {/* Sub-inputs based on Action selection */}
            {bulkActionType === 'category' && (
              <select
                value={bulkTargetCategory}
                onChange={(e) => setBulkTargetCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-350 bg-white dark:bg-gray-808 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {bulkActionType === 'status' && (
              <select
                value={bulkTargetStatus}
                onChange={(e) => setBulkTargetStatus(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-350 bg-white dark:bg-gray-808 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Discontinued">Discontinued</option>
              </select>
            )}

            {bulkActionType === 'price' && (
              <div className="flex items-center space-x-2">
                <select
                  value={bulkPriceChangeType}
                  onChange={(e) => setBulkPriceChangeType(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-350 bg-white dark:bg-gray-808 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="percent_inc">Increase by %</option>
                  <option value="percent_dec">Decrease by %</option>
                  <option value="fixed_inc">Increase by Fixed (PKR)</option>
                  <option value="fixed_dec">Decrease by Fixed (PKR)</option>
                </select>
                <input
                  type="number"
                  placeholder="Value"
                  value={bulkPriceValue}
                  onChange={(e) => setBulkPriceValue(e.target.value)}
                  className="w-20 px-3 py-1.5 border border-gray-305 dark:border-gray-655 bg-white dark:bg-gray-855 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {bulkActionType && (
              <button
                onClick={handleBulkExecute}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
              >
                Apply Updates
              </button>
            )}

            <button
              onClick={() => handleBulkExport()}
              className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-305 rounded-lg text-sm font-medium transition-all"
            >
              Export Selected
            </button>
          </div>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

          <button
            onClick={() => setSelectedProductIds([])}
            className="p-1 text-gray-400 hover:text-gray-605 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Right Drawer: Detail Pane */}
      {selectedDetailProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300" onClick={() => setSelectedDetailProduct(null)}></div>

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 md:pl-16">
              <div className="pointer-events-auto w-screen max-w-2xl transform bg-white dark:bg-gray-850 shadow-2xl transition-transform duration-300 border-l border-gray-200 dark:border-gray-750 flex flex-col h-full animate-slide-left">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-150 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-955 dark:text-white line-clamp-1">{selectedDetailProduct.name}</h2>
                      <p className="text-xs text-gray-400">SKU: {selectedDetailProduct.sku || '—'} | Barcode: {selectedDetailProduct.barcode || '—'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedDetailProduct(null)}
                    className="p-2 text-gray-400 hover:text-gray-605 dark:hover:text-white hover:bg-gray-105 dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Sub Tab Navigation */}
                <div className="px-6 border-b border-gray-155 dark:border-gray-700 bg-white dark:bg-gray-855 sticky top-0 z-10 flex space-x-6">
                  <button
                    onClick={() => setDetailTab('overview')}
                    className={`py-3.5 border-b-2 text-sm font-semibold transition-all outline-none ${
                      detailTab === 'overview'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-855 dark:hover:text-white'
                    }`}
                  >
                    Overview Information
                  </button>
                  <button
                    onClick={() => setDetailTab('pricing')}
                    className={`py-3.5 border-b-2 text-sm font-semibold transition-all outline-none ${
                      detailTab === 'pricing'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-855 dark:hover:text-white'
                    }`}
                  >
                    Pricing &amp; Variants
                  </button>
                  <button
                    onClick={() => setDetailTab('stats')}
                    className={`py-3.5 border-b-2 text-sm font-semibold transition-all outline-none ${
                      detailTab === 'stats'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-855 dark:hover:text-white'
                    }`}
                  >
                    Catalog Metrics
                  </button>
                  <button
                    onClick={() => setDetailTab('ledger')}
                    className={`py-3.5 border-b-2 text-sm font-semibold transition-all outline-none ${
                      detailTab === 'ledger'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-855 dark:hover:text-white'
                    }`}
                  >
                    Movement Timeline
                  </button>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {detailTab === 'overview' && (
                    <div className="space-y-6">
                      {selectedDetailProduct.images && selectedDetailProduct.images.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Catalog Photos</h4>
                          <div className="grid grid-cols-4 gap-3">
                            {selectedDetailProduct.images.map((img, i) => (
                              <div key={i} className={`relative pt-[100%] rounded-xl overflow-hidden border ${
                                selectedDetailProduct.image === img 
                                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}>
                                <img src={img} alt="Detail" className="absolute inset-0 w-full h-full object-cover" />
                                {selectedDetailProduct.image === img && (
                                  <span className="absolute bottom-1 right-1 bg-blue-605 text-white text-[9px] px-1 rounded font-semibold shadow">Cover</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="h-44 bg-gray-55 dark:bg-gray-900 border border-dashed border-gray-250 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-1.5">
                          <Package className="h-8 w-8 text-gray-300" />
                          <span className="text-xs">No media assets cataloged for this product.</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-55 dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800">
                          <span className="text-xs text-gray-400 block mb-0.5">Category Name</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {categories.find(c => c.id === selectedDetailProduct.categoryId)?.name || '—'}
                          </span>
                        </div>
                        <div className="p-4 bg-gray-55 dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800">
                          <span className="text-xs text-gray-400 block mb-0.5">Brand Name</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedDetailProduct.brand || '—'}</span>
                        </div>
                        <div className="p-4 bg-gray-55 dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800">
                          <span className="text-xs text-gray-400 block mb-0.5">Assigned Supplier</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                            {suppliers.find(s => s.id === selectedDetailProduct.supplierId)?.name || '—'}
                          </span>
                        </div>
                        <div className="p-4 bg-gray-55 dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800">
                          <span className="text-xs text-gray-400 block mb-0.5">Dynamic Badge Status</span>
                          <span className="mt-1 block w-fit">
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getProductStatus(selectedDetailProduct).className}`}>
                              {getProductStatus(selectedDetailProduct).text}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Extended Specifications</h4>
                        <div className="p-4 bg-gray-55/50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm text-gray-700 dark:text-gray-305 leading-relaxed min-h-20 whitespace-pre-wrap">
                          {selectedDetailProduct.description || 'No descriptive overview added for this item.'}
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                        <span>Date Created: {new Date(selectedDetailProduct.createdAt).toLocaleString()}</span>
                        <span>Last Modified: {new Date(selectedDetailProduct.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {detailTab === 'pricing' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-55 dark:bg-gray-900 rounded-xl border border-gray-155 dark:border-gray-800">
                          <span className="text-xs text-gray-400 block mb-1">Base Cost Price</span>
                          <span className="text-base font-extrabold text-gray-900 dark:text-white">PKR {selectedDetailProduct.cost.toFixed(2)}</span>
                        </div>
                        <div className="p-4 bg-gray-55 dark:bg-gray-900 rounded-xl border border-gray-155 dark:border-gray-800">
                          <span className="text-xs text-gray-400 block mb-1">Base Selling Price</span>
                          <span className="text-base font-extrabold text-gray-900 dark:text-white">PKR {selectedDetailProduct.price.toFixed(2)}</span>
                        </div>
                        <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl border border-blue-105 dark:border-blue-900/30">
                          <span className="text-xs text-blue-505 block mb-1">Profit margin</span>
                          <span className="text-base font-extrabold text-blue-700 dark:text-blue-400">
                            {selectedDetailProduct.price > 0 
                              ? `${(((selectedDetailProduct.price - selectedDetailProduct.cost) / selectedDetailProduct.price) * 100).toFixed(1)}%` 
                              : '0.0%'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Stock Variants</h4>
                          <span className="text-xs text-gray-400">{selectedDetailProduct.variants?.length || 0} variant(s) registered</span>
                        </div>

                        {selectedDetailProduct.variants && selectedDetailProduct.variants.length > 0 ? (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-500">
                                <tr>
                                  <th className="p-3">Variant Option</th>
                                  <th className="p-3">SKU</th>
                                  <th className="p-3">Barcode</th>
                                  <th className="p-3">Cost</th>
                                  <th className="p-3">Price</th>
                                  <th className="p-3">Stock Qty</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-250 dark:divide-gray-700 text-gray-705 dark:text-gray-305">
                                {selectedDetailProduct.variants.map((v) => (
                                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-3 font-semibold text-gray-900 dark:text-white">{v.name}</td>
                                    <td className="p-3 font-mono text-gray-500">{v.sku || '—'}</td>
                                    <td className="p-3 font-mono text-gray-500">{v.barcode || '—'}</td>
                                    <td className="p-3">PKR {v.cost.toFixed(2)}</td>
                                    <td className="p-3 font-semibold">PKR {v.price.toFixed(2)}</td>
                                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{v.stock} units</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-6 bg-gray-55/50 dark:bg-gray-900/30 border border-dashed border-gray-250 dark:border-gray-800 rounded-2xl text-center text-xs text-gray-400">
                            Variants are not activated for this catalog listing.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {detailTab === 'stats' && computedStats && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 rounded-2xl border border-emerald-105 dark:border-emerald-900/25 space-y-3">
                          <span className="text-xs text-emerald-600 dark:text-emerald-450 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4" />
                            Retail Sales Statistics
                          </span>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <div>
                              <span className="text-[10px] text-gray-400 block">Total Units Sold</span>
                              <span className="text-xl font-bold text-gray-950 dark:text-white">{computedStats.totalSoldUnits}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block">Total Profit Earned</span>
                              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">PKR {computedStats.grossProfit.toFixed(2)}</span>
                            </div>
                            <div className="col-span-2 pt-2">
                              <span className="text-[10px] text-gray-400 block">Total Gross Revenue</span>
                              <span className="text-base font-extrabold text-gray-900 dark:text-white">PKR {computedStats.totalRevenue.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-955/20 dark:to-blue-900/10 rounded-2xl border border-blue-105 dark:border-blue-900/25 space-y-3">
                          <span className="text-xs text-blue-650 dark:text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className="h-4 w-4" />
                            Acquisition &amp; Stock stats
                          </span>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <div>
                              <span className="text-[10px] text-gray-400 block">Total Units Purchased</span>
                              <span className="text-xl font-bold text-gray-955 dark:text-white">{computedStats.totalPurchasedUnits}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block">Total Investment Cost</span>
                              <span className="text-xl font-bold text-gray-955 dark:text-white">PKR {computedStats.totalPurchaseCost.toFixed(2)}</span>
                            </div>
                            <div className="col-span-2 pt-2">
                              <span className="text-[10px] text-gray-400 block">Last Procurement Date</span>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {computedStats.lastPurchaseDate ? new Date(computedStats.lastPurchaseDate).toLocaleString() : 'No purchases cataloged'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {detailTab === 'ledger' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Chronological Stock Audit Timeline</h4>

                      {productMovements.length > 0 ? (
                        <div className="flow-root">
                          <ul className="-mb-8">
                            {productMovements.map((item, idx) => (
                              <li key={item.id}>
                                <div className="relative pb-8">
                                  {idx !== productMovements.length - 1 && (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-850 ${
                                        item.qtyChanged >= 0
                                          ? 'bg-emerald-50 text-emerald-605 dark:bg-emerald-900/30 dark:text-emerald-400'
                                          : 'bg-rose-50 text-rose-605 dark:bg-rose-900/30 dark:text-rose-400'
                                      }`}>
                                        {item.qtyChanged >= 0 ? <Plus className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-905 dark:text-white">
                                          {item.actionType} ({item.qtyChanged >= 0 ? `+${item.qtyChanged}` : item.qtyChanged})
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                          Stock Balance: {item.qtyBefore} &rarr; {item.qtyAfter} units
                                        </p>
                                        {item.notes && <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{item.notes}&rdquo;</p>}
                                      </div>
                                      <div className="text-right text-xs whitespace-nowrap text-gray-450 flex flex-col items-end">
                                        <time>{new Date(item.createdAt).toLocaleDateString()}</time>
                                        <span className="text-[10px] font-mono text-gray-400 mt-1">Ref: {item.reference || '—'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="p-12 text-center border rounded-2xl bg-gray-55 dark:bg-gray-900/30 text-gray-405 text-sm space-y-1">
                          <Clock className="h-7 w-7 text-gray-305 mx-auto" />
                          <p className="font-semibold text-gray-700 dark:text-gray-300">Auditing Timeline Empty</p>
                          <p className="text-xs text-gray-450">No stock sales or procurement transactions found for this product.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between items-center">
                  <button
                    onClick={() => handleEditProduct(selectedDetailProduct)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow"
                  >
                    Edit Product Info
                  </button>
                  <button
                    onClick={() => setSelectedDetailProduct(null)}
                    className="px-5 py-2 bg-white hover:bg-gray-100 dark:bg-gray-805 dark:hover:bg-gray-700 dark:border-gray-700 border border-gray-303 rounded-xl text-sm text-gray-700 dark:text-gray-305 font-semibold transition-all"
                  >
                    Close Pane
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgraded Product Form Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-250 dark:border-gray-700 animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                {editingProduct ? 'Modify Catalog Product Specs' : 'Establish New Catalog Listing'}
              </h3>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                  resetProductForm();
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-blue-505 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-505" />
                  Primary Specification Core
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Product Name (English) *
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      required
                      placeholder="e.g. Master PPR Tee 25mm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Product Name (Urdu - Option)
                    </label>
                    <input
                      type="text"
                      value={productForm.nameUrdu}
                      onChange={(e) => setProductForm({ ...productForm, nameUrdu: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white text-right font-urdu outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="مثلاً ماسٹر پی پی آر ٹی 25 ملی میٹر"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      SKU Code
                    </label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. PPR-TEE-25"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={productForm.barcode}
                      onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-305 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. 123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Product Status Field
                    </label>
                    <select
                      value={productForm.status}
                      onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                      className="w-full px-3.5 py-2 border border-gray-305 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Category Assignment *
                    </label>
                    <select
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. Master Pipes"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Primary Supplier
                    </label>
                    <select
                      value={productForm.supplierId}
                      onChange={(e) => setProductForm({ ...productForm, supplierId: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-305 dark:border-gray-655 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Extended description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed"
                    placeholder="Provide detailed description of plumbing/electrical fitting, dimensions, grade, material etc..."
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-xs font-bold text-blue-505 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-505" />
                  Acquisition, Pricing &amp; Stocks
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Cost Price (PKR) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.cost}
                      onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Selling Price (PKR) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-755 text-gray-905 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-655 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-505 focus:border-transparent disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed font-semibold"
                      required
                      disabled={productForm.hasVariants}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      Low Stock Limit *
                    </label>
                    <input
                      type="number"
                      value={productForm.minStock}
                      onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-655 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-505 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-xs font-bold text-blue-505 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-505" />
                  Product Media &amp; Images
                </h4>

                <div className="space-y-3 bg-gray-55/50 dark:bg-gray-900/30 p-4 border rounded-2xl border-gray-250 dark:border-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-505 dark:text-gray-405 mb-1">
                        Select media from files:
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageFilesUpload}
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-xs text-gray-950 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-55 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-505 dark:text-gray-405 mb-1">
                        Or import photo link:
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-305 dark:border-gray-655 rounded-xl bg-white dark:bg-gray-755 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-505"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-3 bg-gray-105 border border-gray-300 dark:border-gray-650 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800 text-gray-705 dark:text-gray-350 rounded-xl text-xs font-bold"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {productForm.images && productForm.images.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Catalog Asset Matrix</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {productForm.images.map((img, idx) => {
                          const isCover = productForm.image === img;
                          return (
                            <div key={idx} className={`relative pt-[100%] rounded-xl overflow-hidden border group ${
                              isCover ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-805'
                            }`}>
                              <img src={img} alt="Catalog preview" className="absolute inset-0 w-full h-full object-cover" />

                              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-between items-start">
                                  <button
                                    type="button"
                                    onClick={() => handleSetCoverImage(img)}
                                    className={`p-1 rounded text-[9px] font-bold ${
                                      isCover ? 'bg-emerald-600 text-white' : 'bg-white hover:bg-gray-105 text-gray-800'
                                    }`}
                                  >
                                    {isCover ? 'Cover Set' : 'Set Cover'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImage(idx)}
                                    className="p-1 rounded bg-red-650 hover:bg-red-750 text-white"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>

                                <div className="flex justify-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, 'left')}
                                    disabled={idx === 0}
                                    className="p-1 rounded bg-white/80 hover:bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    &larr;
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, 'right')}
                                    disabled={idx === productForm.images.length - 1}
                                    className="p-1 rounded bg-white/80 hover:bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    &rarr;
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-blue-505 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-505" />
                    Product Variants &amp; Options
                  </h4>

                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={productForm.hasVariants}
                      onChange={(e) => {
                        const active = e.target.checked;
                        setProductForm(prev => {
                          const initialVars = active && prev.variants.length === 0 
                            ? [{
                                id: Math.random().toString(36).substr(2, 9),
                                name: 'Default Option',
                                sku: prev.sku ? `${prev.sku}-VAR1` : '',
                                barcode: prev.barcode || '',
                                cost: parseFloat(prev.cost) || 0,
                                price: parseFloat(prev.price) || 0,
                                stock: 0
                              }] 
                            : prev.variants;
                          return {
                            ...prev,
                            hasVariants: active,
                            variants: initialVars
                          };
                        });
                      }}
                      className="rounded text-blue-600 border-gray-300 focus:ring-blue-505 h-4.5 w-4.5"
                    />
                    <span className="text-xs font-semibold text-gray-750 dark:text-gray-350">Catalog Has Variant Options</span>
                  </label>
                </div>

                {productForm.hasVariants && (
                  <div className="space-y-3 p-4 bg-gray-55/50 dark:bg-gray-900/30 border border-gray-250 dark:border-gray-805 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Setup Sizes, Colors, Material variants</span>
                      <button
                        type="button"
                        onClick={handleAddVariantRow}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-605 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-all"
                      >
                        Add Variant Row
                      </button>
                    </div>

                    <div className="space-y-3">
                      {productForm.variants.map((v) => (
                        <div key={v.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 bg-white dark:bg-gray-805 border border-gray-205 dark:border-gray-700 p-3 rounded-xl shadow-xs items-end relative pr-10 sm:pr-2">
                          <div className="sm:col-span-1.5">
                            <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Option Name *</label>
                            <input
                              type="text"
                              value={v.name}
                              onChange={(e) => handleUpdateVariantField(v.id, 'name', e.target.value)}
                              placeholder="e.g. Size 32"
                              className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-650 bg-gray-55 dark:bg-gray-755 text-xs text-gray-900 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-blue-505"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-0.5">SKU</label>
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => handleUpdateVariantField(v.id, 'sku', e.target.value)}
                              placeholder="SKU"
                              className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-655 bg-gray-55 dark:bg-gray-755 text-xs text-gray-950 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-blue-505 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Barcode</label>
                            <input
                              type="text"
                              value={v.barcode}
                              onChange={(e) => handleUpdateVariantField(v.id, 'barcode', e.target.value)}
                              placeholder="Barcode"
                              className="w-full px-2.5 py-1 border border-gray-305 dark:border-gray-655 bg-gray-55 dark:bg-gray-755 text-xs text-gray-955 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-blue-505 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Cost</label>
                            <input
                              type="number"
                              value={v.cost}
                              onChange={(e) => handleUpdateVariantField(v.id, 'cost', e.target.value)}
                              placeholder="Cost"
                              className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-655 bg-gray-55 dark:bg-gray-755 text-xs text-gray-905 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-blue-505"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Price</label>
                            <input
                              type="number"
                              value={v.price}
                              onChange={(e) => handleUpdateVariantField(v.id, 'price', e.target.value)}
                              placeholder="Price"
                              className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-655 bg-gray-55 dark:bg-gray-755 text-xs text-gray-905 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-blue-505 font-bold"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Stock</label>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => handleUpdateVariantField(v.id, 'stock', e.target.value)}
                              placeholder="Stock"
                              className="w-full px-2.5 py-1 border border-gray-305 dark:border-gray-655 bg-gray-55 dark:bg-gray-755 text-xs text-gray-905 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-blue-505 font-semibold"
                              required
                            />
                          </div>

                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 sm:static sm:transform-none flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteVariantRow(v.id)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-650 rounded-lg transition-colors"
                              title="Delete Variant"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-2">
                      <Info className="h-3 w-3 inline text-blue-505" />
                      <span>Stock amount is aggregated automatically from variant listings to the core product stock.</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow"
                >
                  Confirm Specifications
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                  className="flex-1 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-xl transition-all"
                >
                  Cancel changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgraded Category Form Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-250 dark:border-gray-700 animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h3 className="text-base font-bold text-gray-955 dark:text-white">
                {editingCategory ? 'Modify Category Specifications' : 'Add New Product Category'}
              </h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  resetCategoryForm();
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-850 text-gray-400 hover:text-gray-650 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-505 dark:text-gray-405 mb-1">
                  Category Name (English) *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-905 dark:text-white outline-none focus:ring-2 focus:ring-blue-505 focus:border-transparent transition-all"
                  required
                  placeholder="e.g. Sanitary Fittings"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-505 dark:text-gray-405 mb-1">
                  Category Name (Urdu - Required) *
                </label>
                <input
                  type="text"
                  value={categoryForm.nameUrdu}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameUrdu: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-905 dark:text-white text-right font-urdu outline-none focus:ring-2 focus:ring-blue-505 focus:border-transparent transition-all"
                  required
                  placeholder="مثلاً سینیٹری فٹنگز"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-505 dark:text-gray-405 mb-1">
                  Description / Details
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-350 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-505 focus:border-transparent transition-all text-sm leading-relaxed"
                  placeholder="Details concerning plumbing, sanitary, electrical category types..."
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow"
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="flex-1 bg-gray-150 hover:bg-gray-250 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-705 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-250 dark:border-gray-700 animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h3 className="text-base font-bold text-gray-955 dark:text-white flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-blue-500" />
                Record Stock Adjustment
              </h3>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Select Product *</label>
                <select
                  value={adjustmentForm.productId}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, productId: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose Catalog Item</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} u)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-905 dark:text-white outline-none font-bold"
                    placeholder="e.g. 10"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Adjustment Type</label>
                  <select
                    value={adjustmentForm.adjustmentType}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustmentType: e.target.value as any })}
                    className="w-full px-3.5 py-2 border border-gray-305 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="Stock In">Stock In (+)</option>
                    <option value="Stock Out">Stock Out (-)</option>
                    <option value="Damaged">Damaged (-)</option>
                    <option value="Lost">Lost (-)</option>
                    <option value="Returned">Returned (+)</option>
                    <option value="Manual Correction">Manual Correction (+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Reason for Adjustment *</label>
                <input
                  type="text"
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Broken package, count error"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Additional Notes</label>
                <textarea
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Optional notes context..."
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow">
                  Apply Adjustment
                </button>
                <button type="button" onClick={() => setShowAdjustmentModal(false)} className="flex-1 bg-gray-150 hover:bg-gray-250 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-750 dark:text-gray-305 font-semibold py-2.5 px-4 rounded-xl transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Entry Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-250 dark:border-gray-700 animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h3 className="text-base font-bold text-gray-955 dark:text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-500" />
                Record Procurement Purchase Entry
              </h3>
              <button onClick={() => setShowPurchaseModal(false)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-605 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-505 dark:text-gray-450 mb-1">Select Supplier *</label>
                  <select
                    value={purchaseForm.supplierId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-755 text-gray-905 dark:text-white outline-none focus:ring-1 focus:ring-blue-505 text-sm"
                    required
                  >
                    <option value="">Choose Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-550 dark:text-gray-450 mb-1">Procurement Date *</label>
                  <input
                    type="date"
                    value={purchaseForm.purchaseDate}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-550 dark:text-gray-455 mb-1">Invoice / Reference Number</label>
                  <input
                    type="text"
                    value={purchaseForm.invoiceNumber}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-xl bg-white dark:bg-gray-755 text-gray-900 dark:text-white outline-none text-sm font-mono"
                    placeholder="e.g. INV-1090"
                  />
                </div>
              </div>

              <div className="bg-gray-55/60 dark:bg-gray-900/30 p-4 border rounded-xl space-y-3">
                <span className="text-[10px] uppercase font-bold text-gray-455 block tracking-wider">Add items to purchase list</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Product Item *</label>
                    <select
                      value={purchaseItemInput.productId}
                      onChange={(e) => {
                        const prodId = parseInt(e.target.value);
                        const prod = products.find(p => p.id === prodId);
                        setPurchaseItemInput({
                          ...purchaseItemInput,
                          productId: e.target.value,
                          costPrice: prod ? prod.cost.toString() : ''
                        });
                      }}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-gray-750 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Choose Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Procurement Cost (PKR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseItemInput.costPrice}
                      onChange={(e) => setPurchaseItemInput({ ...purchaseItemInput, costPrice: e.target.value })}
                      placeholder="Cost"
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-gray-755 text-xs text-gray-950 dark:text-white outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Quantity *</label>
                      <input
                        type="number"
                        value={purchaseItemInput.quantity}
                        onChange={(e) => setPurchaseItemInput({ ...purchaseItemInput, quantity: e.target.value })}
                        placeholder="Qty"
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-gray-755 text-xs text-gray-955 dark:text-white outline-none"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleAddPurchaseItem}
                      className="px-3 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {purchaseForm.items.length > 0 ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-55 dark:bg-gray-800/80 border-b font-semibold text-gray-500">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Cost Price</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Subtotal</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {purchaseForm.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-55 dark:hover:bg-gray-750">
                          <td className="p-3 font-semibold text-gray-905 dark:text-white">{item.productName}</td>
                          <td className="p-3">PKR {item.costPrice.toFixed(2)}</td>
                          <td className="p-3 font-bold">{item.quantity} units</td>
                          <td className="p-3 font-bold text-gray-950 dark:text-white">PKR {item.subtotal.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePurchaseItem(idx)}
                              className="text-red-500 hover:text-red-700 p-0.5"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 border border-dashed rounded-xl text-center text-xs text-gray-400 bg-gray-50/50">
                  No items added to the purchase ledger list. Formulate items above.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-gray-700">
                <div>
                  <label className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-1">Additional Notes</label>
                  <textarea
                    value={purchaseForm.notes}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3.5 py-2 border rounded-xl bg-white dark:bg-gray-755 text-sm text-gray-905 dark:text-white outline-none"
                    placeholder="Enter invoice descriptions, terms, tracking numbers etc..."
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      PKR {purchaseForm.items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs gap-3">
                    <span>Purchase Taxes (PKR):</span>
                    <input
                      type="number"
                      value={purchaseForm.taxes}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, taxes: e.target.value })}
                      className="w-24 px-2 py-0.5 border text-right rounded outline-none text-xs"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs gap-3">
                    <span>Purchase Discounts (PKR):</span>
                    <input
                      type="number"
                      value={purchaseForm.discounts}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, discounts: e.target.value })}
                      className="w-24 px-2 py-0.5 border text-right rounded outline-none text-xs"
                    />
                  </div>

                  <div className="h-px bg-gray-250 dark:bg-gray-700 my-2" />

                  <div className="flex justify-between items-center text-sm font-extrabold text-gray-905 dark:text-white">
                    <span>Net Procurement Invoice Total:</span>
                    <span className="text-base text-blue-600 dark:text-blue-400">
                      PKR {(
                        purchaseForm.items.reduce((sum, i) => sum + i.subtotal, 0) +
                        (parseFloat(purchaseForm.taxes) || 0) -
                        (parseFloat(purchaseForm.discounts) || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                  type="submit"
                  disabled={purchaseForm.items.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow disabled:opacity-50"
                >
                  Record Procurement Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 bg-gray-155 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Wizard Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-250 dark:border-gray-700 animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h3 className="text-base font-bold text-gray-955 dark:text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-500" />
                CSV Catalog Import Wizard
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportSummary(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-655 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!importSummary ? (
                <div className="space-y-4">
                  <div className="p-8 border-2 border-dashed border-gray-305 dark:border-gray-750 rounded-2xl text-center bg-gray-50 dark:bg-gray-900/30 flex flex-col items-center justify-center gap-3">
                    <FileText className="h-10 w-10 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-750 dark:text-gray-305">Select a Product Catalog CSV File</p>
                      <p className="text-xs text-gray-450 mt-1">Files should have headers: name, sku, barcode, price, cost, stock, minStock, categoryId, brand, description</p>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVImportLoad}
                      className="mt-4 text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-750 hover:file:bg-blue-105"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{importSummary.total}</div>
                      <div className="text-[10px] text-gray-450 uppercase font-semibold mt-0.5">Total Rows Found</div>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{importSummary.valid}</div>
                      <div className="text-[10px] text-gray-455 uppercase font-semibold mt-0.5">Valid &amp; Ready</div>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                      <div className="text-xl font-bold text-rose-600 dark:text-rose-455">{importSummary.invalid}</div>
                      <div className="text-[10px] text-gray-455 uppercase font-semibold mt-0.5">Rows with errors</div>
                    </div>
                  </div>

                  {importSummary.invalid > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 text-rose-500">
                        <AlertTriangle className="h-4 w-4" />
                        Validation warnings ledger
                      </span>
                      
                      <div className="border border-red-200 dark:border-red-955/30 rounded-xl bg-red-50/20 dark:bg-red-955/5 p-3 max-h-[150px] overflow-y-auto space-y-1.5">
                        {importSummary.rows.filter(r => !r.isValid).map((row, idx) => (
                          <div key={idx} className="text-xs flex gap-2 text-rose-700 dark:text-rose-400">
                            <span className="font-bold">Line {row.rowNumber}:</span>
                            <span>{row.name} &mdash; {row.errors.join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 text-emerald-500">
                      <CheckCircle className="h-4 w-4" />
                      Valid items ready to import
                    </span>

                    <div className="border rounded-xl bg-white dark:bg-gray-805 max-h-[200px] overflow-y-auto text-xs divide-y">
                      {importSummary.rows.filter(r => r.isValid).map((row, idx) => (
                        <div key={idx} className="p-2.5 flex justify-between hover:bg-gray-55 dark:hover:bg-gray-750">
                          <div>
                            <div className="font-semibold text-gray-905 dark:text-white">{row.name}</div>
                            <div className="text-[10px] text-gray-405">SKU: {row.sku} | Barcode: {row.barcode}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-950 dark:text-white">Price: PKR {row.price}</div>
                            <div className="text-[10px] text-gray-500">Stock: {row.stock} u</div>
                          </div>
                        </div>
                      ))}
                      {importSummary.valid === 0 && (
                        <div className="p-8 text-center text-gray-450 italic">No valid rows available to import.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900 flex space-x-3">
              {importSummary && importSummary.valid > 0 && (
                <button
                  onClick={handleProceedImport}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow"
                >
                  Complete Importing {importSummary.valid} items
                </button>
              )}
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportSummary(null);
                  setImportFileText('');
                }}
                className="flex-1 bg-gray-150 hover:bg-gray-250 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-750 dark:text-gray-305 font-semibold py-2.5 px-4 rounded-xl transition-all"
              >
                Cancel import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Filter Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-250 dark:border-gray-700 animate-scale-up p-5 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Saved Filter Presets Panel</h3>
            
            {savedPresets.length > 0 && (
              <div className="space-y-2 border-b dark:border-gray-700 pb-4 max-h-[160px] overflow-y-auto pr-1">
                {savedPresets.map((preset, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-55 dark:bg-gray-900/50 p-2 rounded-lg text-xs">
                    <span
                      onClick={() => {
                        handleApplyPreset(preset);
                        setShowPresetModal(false);
                      }}
                      className="font-semibold text-blue-650 cursor-pointer hover:underline"
                    >
                      {preset.name}
                    </span>
                    <button
                      onClick={() => handleDeletePreset(preset.name)}
                      className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-450 uppercase tracking-wider">Save active filter settings</label>
              <input
                type="text"
                placeholder="Preset Name (e.g. Master Low Stock)"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-755 text-xs text-gray-900 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={handleSavePreset}
                disabled={!newPresetName.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all disabled:opacity-50"
              >
                Save Active Setup
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="px-4 py-1.5 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;